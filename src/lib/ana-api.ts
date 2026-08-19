// ============================================================
// Hidro Alert — Cliente da API da ANA (Agência Nacional de Águas)
// Suporta a nova API REST em JSON e faz fallback automático para o SOAP antigo
// ============================================================

import { ANA_ENDPOINTS } from './constants';

export interface RiverDataPoint {
  date: string; // Formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  level: number; // Nível da água em metros
  flow: number; // Vazão em m³/s
  precipitation: number; // Chuva em mm
}

export type AnaDataType = '1' | '2' | '3'; // Legado, mantido para compatibilidade

// Variável em memória para cache do token (dura 60 min, vamos renovar a cada 45 min)
let cachedToken: string | null = null;
let tokenExpiration: number = 0;

// ============================================================
// LÓGICA DA NOVA API REST (JSON)
// ============================================================

/**
 * Obtém um token de autenticação válido usando as credenciais da ANA.
 */
async function getAuthToken(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiration) {
    return cachedToken;
  }

  const identificador = process.env.ANA_USUARIO;
  const senha = process.env.ANA_SENHA;

  if (!identificador || !senha) {
    // Sem credenciais, falha silenciosamente para acionar o fallback SOAP
    return null;
  }

  try {
    const response = await fetch(ANA_ENDPOINTS.AUTH, {
      method: 'GET',
      headers: {
        'Identificador': identificador,
        'Senha': senha,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn(`[ANA API REST] Falha na autenticação. HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.items && data.items.length > 0 && data.items[0].tokenautenticacao) {
      cachedToken = data.items[0].tokenautenticacao;
      tokenExpiration = Date.now() + 45 * 60 * 1000;
      return cachedToken;
    }

    return null;
  } catch (error) {
    console.error('[ANA API REST] Erro ao obter token:', error);
    return null;
  }
}

function formatDateForApi(dateStr: string): string {
  const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month}-${day}`;
  }
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0];
  }
  return dateStr;
}

function formatIsoDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(' ', 'T');
}

/**
 * Busca dados na nova API REST em JSON.
 */
async function fetchTelemetricAdopted(
  token: string,
  stationCode: string,
  startDate?: string,
  range: string = 'DIAS_30'
): Promise<RiverDataPoint[]> {
  try {
    const url = new URL(ANA_ENDPOINTS.TELEMETRIC_ADOPTED);
    url.searchParams.set('CodigoDaEstacao', stationCode);
    url.searchParams.set('TipoFiltroData', 'DATA_LEITURA');
    
    if (startDate) {
      url.searchParams.set('DataBusca', formatDateForApi(startDate));
    }
    url.searchParams.set('RangeIntervaloDeBusca', range);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.items || !Array.isArray(data.items)) {
      return [];
    }

    const results: RiverDataPoint[] = [];

    for (const item of data.items) {
      const rawDate = item.Data_Hora_Medicao || item.Data_Atualizacao;
      if (!rawDate) continue;

      results.push({
        date: formatIsoDate(rawDate),
        level: normalizeLevelToMeters(item.Cota_Adotada),
        flow: parseNumericValue(item.Vazao_Adotada),
        precipitation: parseNumericValue(item.Chuva_Adotada)
      });
    }

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return results;
  } catch (error) {
    console.error('[ANA API REST] Falha na requisição de dados:', error);
    return [];
  }
}

// ============================================================
// LÓGICA DA ANTIGA API SOAP (LEGADO / FALLBACK)
// ============================================================

function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractTagBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

function normalizeLevelToMeters(rawLevel: number | string | null | undefined): number {
  if (rawLevel === null || rawLevel === undefined) return 0;
  const num = typeof rawLevel === 'string' ? parseFloat(rawLevel) : rawLevel;
  if (isNaN(num)) return 0;
  
  if (num === 8888 || num === 9999 || num >= 5000) return 0;
  if (num <= 0) return 0;
  
  if (num > 30) {
    return Number((num / 100).toFixed(3));
  }
  return Number(num.toFixed(3));
}

function parseNumericValue(valueStr: string | number | null | undefined): number {
  if (valueStr === null || valueStr === undefined) return 0;
  if (typeof valueStr === 'number') return valueStr;
  const sanitized = valueStr.trim().replace(',', '.');
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    return cleanStr.replace(' ', 'T');
  }
  const brMatch = cleanStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (brMatch) {
    const [, day, month, year, hour = '00', min = '00', sec = '00'] = brMatch;
    return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
  }
  const d = new Date(cleanStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString();
  }
  return null;
}

async function fetchHistoricalDataSOAP(
  stationCode: string,
  dataType: AnaDataType | string = '1',
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  try {
    const url = new URL(ANA_ENDPOINTS.HISTORICAL_SOAP);
    url.searchParams.set('codEstApoio', '');
    url.searchParams.set('codEstacao', stationCode);
    url.searchParams.set('dataInicio', startDate || '');
    url.searchParams.set('dataFim', endDate || '');
    url.searchParams.set('tipoDados', String(dataType));
    url.searchParams.set('nivelConsistencia', '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/xml, text/xml, */*' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const xmlText = await response.text();
    if (!xmlText || xmlText.includes('<Fault>')) return [];

    const results: RiverDataPoint[] = [];
    const serieBlocks = extractTagBlocks(xmlText, 'SerieHistorica');
    const prefix = dataType === '2' ? 'Chuva' : dataType === '3' ? 'Vazao' : 'Cota';

    for (const block of serieBlocks) {
      const dataHoraStr = extractTagContent(block, 'DataHora');
      if (!dataHoraStr) continue;

      let year = 0, month = 0;
      const isoMatch = dataHoraStr.match(/(\d{4})-(\d{2})/);
      const brMatch = dataHoraStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);

      if (isoMatch) {
        year = parseInt(isoMatch[1], 10); month = parseInt(isoMatch[2], 10);
      } else if (brMatch) {
        year = parseInt(brMatch[3], 10); month = parseInt(brMatch[2], 10);
      }

      if (!year || !month) continue;

      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `${prefix}${day < 10 ? '0' : ''}${day}`;
        const rawValStr = extractTagContent(block, dayKey);

        if (rawValStr !== null && rawValStr !== '') {
          const rawNum = parseNumericValue(rawValStr);
          if (!isNaN(rawNum) && rawNum >= 0) {
            const dateStr = `${year}-${month < 10 ? '0'+month : month}-${day < 10 ? '0'+day : day}`;
            let level = 0, flow = 0, precipitation = 0;

            if (dataType === '1') level = normalizeLevelToMeters(rawNum);
            else if (dataType === '2') precipitation = rawNum;
            else if (dataType === '3') flow = rawNum;

            results.push({ date: dateStr, level, flow, precipitation });
          }
        }
      }
    }

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return results;
  } catch (error) {
    console.warn('[ANA API SOAP] Falha na série histórica:', error);
    return [];
  }
}

async function fetchTelemetricDataSOAP(
  stationCode: string,
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  try {
    const url = new URL(ANA_ENDPOINTS.TELEMETRIC_SOAP);
    url.searchParams.set('codEstacao', stationCode);
    url.searchParams.set('dataInicio', startDate || '');
    url.searchParams.set('dataFim', endDate || '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/xml, text/xml, */*' },
      next: { revalidate: 300 },
    });

    if (!response.ok) return [];

    const xmlText = await response.text();
    if (!xmlText || xmlText.includes('<Fault>')) return [];

    let dataBlocks = extractTagBlocks(xmlText, 'DadosHidrometereologicos');
    if (!dataBlocks.length) dataBlocks = extractTagBlocks(xmlText, 'DadosHidrometeorologicos');
    if (!dataBlocks.length) dataBlocks = extractTagBlocks(xmlText, 'Table');

    const results: RiverDataPoint[] = [];

    for (const block of dataBlocks) {
      const dataHoraStr = extractTagContent(block, 'DataHora') || extractTagContent(block, 'dataHora');
      if (!dataHoraStr) continue;

      const parsedDate = parseDateString(dataHoraStr);
      if (!parsedDate) continue;

      const rawLevelStr = extractTagContent(block, 'Nivel') || extractTagContent(block, 'Cota') || extractTagContent(block, 'cota');
      const rawFlowStr = extractTagContent(block, 'Vazao') || extractTagContent(block, 'vazao');
      const rawRainStr = extractTagContent(block, 'Chuva') || extractTagContent(block, 'chuva');

      results.push({
        date: parsedDate,
        level: normalizeLevelToMeters(parseNumericValue(rawLevelStr)),
        flow: parseNumericValue(rawFlowStr),
        precipitation: parseNumericValue(rawRainStr),
      });
    }

    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return results;
  } catch (error) {
    console.warn('[ANA API SOAP] Falha na telemetria:', error);
    return [];
  }
}

// ============================================================
// EXPORTAÇÕES PÚBLICAS (ROTEAMENTO INTELIGENTE)
// ============================================================

/**
 * Busca a série histórica. 
 * Tenta usar a nova API REST caso o Token esteja configurado.
 * Caso contrário (ou caso a nova API exija mais buscas para longo prazo), usa o SOAP legado.
 */
export async function fetchHistoricalData(
  stationCode: string,
  dataType: AnaDataType | string = '1',
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  const token = await getAuthToken();
  if (token) {
    // A API REST limitada a 30 dias na rota Adotada
    // Se o app pedir um histórico mais longo, a API REST nesse endpoint pode não ser a ideal.
    // Mas para manter a compatibilidade, tenta a REST primeiro.
    const restData = await fetchTelemetricAdopted(token, stationCode, startDate, 'DIAS_30');
    if (restData.length > 0) return restData;
  }

  // Fallback para a API Antiga SOAP
  return fetchHistoricalDataSOAP(stationCode, dataType, startDate, endDate);
}

/**
 * Busca dados telemétricos em tempo quase real.
 * Usa a nova API REST JSON prioritariamente se houver token, caso contrário faz fallback para o SOAP.
 */
export async function fetchTelemetricData(
  stationCode: string,
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  const token = await getAuthToken();
  if (token) {
    const restData = await fetchTelemetricAdopted(token, stationCode, startDate, 'DIAS_30');
    if (restData.length > 0) return restData;
  }

  // Fallback para a API Antiga SOAP
  return fetchTelemetricDataSOAP(stationCode, startDate, endDate);
}
