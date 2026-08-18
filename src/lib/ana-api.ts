// ============================================================
// Hidro Alert — Cliente da API da ANA (Agência Nacional de Águas)
// ============================================================

import { ANA_ENDPOINTS } from './constants';

export interface RiverDataPoint {
  date: string; // Formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  level: number; // Nível da água em metros
  flow: number; // Vazão em m³/s
  precipitation: number; // Chuva em mm
}

export type AnaDataType = '1' | '2' | '3'; // 1: Nível/Cota, 2: Chuva, 3: Vazão

/**
 * Utilitário para extrair conteúdo entre tags XML simples sem dependências externas.
 */
function extractTagContent(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Utilitário para extrair todos os blocos de uma tag XML.
 */
function extractTagBlocks(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocks.push(match[1]);
  }
  return blocks;
}

/**
 * Converte string de número (com ponto ou vírgula) para número flutuante válido.
 */
function parseNumericValue(valueStr: string | null | undefined): number {
  if (!valueStr) return 0;
  const sanitized = valueStr.trim().replace(',', '.');
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

/**
 * Converte cota bruta da ANA para metros.
 * Históricamente a ANA registra cotas diárias em centímetros (ex: 450 cm = 4.5m).
 * Se o valor for superior a 30, assume-se que está em centímetros e converte para metros.
 */
function normalizeLevelToMeters(rawLevel: number): number {
  // Ignora códigos de erro comuns da ANA e valores fisicamente impossíveis (>50m)
  if (rawLevel === 8888 || rawLevel === 9999 || rawLevel >= 5000) return 0;

  if (rawLevel <= 0) return 0;
  if (rawLevel > 30) {
    return Number((rawLevel / 100).toFixed(3));
  }
  return Number(rawLevel.toFixed(3));
}

/**
 * Normaliza e padroniza data e hora para ISO string (YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DD).
 */
function parseDateString(dateStr: string): string | null {
  if (!dateStr) return null;
  const cleanStr = dateStr.trim();

  // Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(cleanStr)) {
    return cleanStr.replace(' ', 'T');
  }

  // Formato brasileiro: DD/MM/YYYY ou DD/MM/YYYY HH:mm:ss
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

/**
 * Busca a série histórica diária de uma estação na API da ANA (HidroSerieHistorica).
 * 
 * O endpoint retorna blocos mensais contendo <SerieHistorica> com <DataHora> do primeiro dia do mês
 * e campos diários de 01 a 31 (ex: <Cota01>..<Cota31>, <Chuva01>..<Chuva31>, <Vazao01>..<Vazao31>).
 *
 * @param stationCode Código da estação (ex: '65100001')
 * @param dataType '1' = Nível/Cota, '2' = Chuva, '3' = Vazão (padrão '1')
 * @param startDate Data inicial (formato DD/MM/YYYY ou YYYY-MM-DD)
 * @param endDate Data final (formato DD/MM/YYYY ou YYYY-MM-DD)
 */
export async function fetchHistoricalData(
  stationCode: string,
  dataType: AnaDataType | string = '1',
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  try {
    const url = new URL(ANA_ENDPOINTS.HISTORICAL);
    url.searchParams.set('codEstApoio', '');
    url.searchParams.set('codEstacao', stationCode);
    url.searchParams.set('dataInicio', startDate || '');
    url.searchParams.set('dataFim', endDate || '');
    url.searchParams.set('tipoDados', String(dataType));
    url.searchParams.set('nivelConsistencia', '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/xml, text/xml, */*',
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      console.warn(`[ANA API] Erro ao buscar série histórica: HTTP ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.includes('<Fault>') || xmlText.includes('<error>')) {
      return [];
    }

    const results: RiverDataPoint[] = [];
    const serieBlocks = extractTagBlocks(xmlText, 'SerieHistorica');

    const prefix = dataType === '2' ? 'Chuva' : dataType === '3' ? 'Vazao' : 'Cota';

    for (const block of serieBlocks) {
      const dataHoraStr = extractTagContent(block, 'DataHora');
      if (!dataHoraStr) continue;

      let year = 0;
      let month = 0;

      // Extrai ano e mês do primeiro dia do mês registrado
      const isoMatch = dataHoraStr.match(/(\d{4})-(\d{2})/);
      const brMatch = dataHoraStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);

      if (isoMatch) {
        year = parseInt(isoMatch[1], 10);
        month = parseInt(isoMatch[2], 10);
      } else if (brMatch) {
        year = parseInt(brMatch[3], 10);
        month = parseInt(brMatch[2], 10);
      } else {
        const d = new Date(dataHoraStr);
        if (!isNaN(d.getTime())) {
          year = d.getUTCFullYear();
          month = d.getUTCMonth() + 1;
        }
      }

      if (!year || !month) continue;

      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayKey = `${prefix}${day < 10 ? '0' : ''}${day}`;
        const rawValStr = extractTagContent(block, dayKey);

        if (rawValStr !== null && rawValStr !== '') {
          const rawNum = parseNumericValue(rawValStr);
          if (!isNaN(rawNum) && rawNum >= 0) {
            const dayFormatted = day < 10 ? `0${day}` : `${day}`;
            const monthFormatted = month < 10 ? `0${month}` : `${month}`;
            const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;

            let level = 0;
            let flow = 0;
            let precipitation = 0;

            if (dataType === '1') {
              level = normalizeLevelToMeters(rawNum);
            } else if (dataType === '2') {
              precipitation = rawNum;
            } else if (dataType === '3') {
              flow = rawNum;
            }

            results.push({
              date: dateStr,
              level,
              flow,
              precipitation,
            });
          }
        }
      }
    }

    // Ordena do mais antigo para o mais recente
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return results;
  } catch (error) {
    console.error('[ANA API] Falha na requisição de série histórica:', error);
    return [];
  }
}

/**
 * Busca dados telemétricos em tempo quase real da estação na API da ANA (DadosHidrometeorologicos).
 * 
 * O endpoint retorna registros recentes com nível, vazão e chuva.
 *
 * @param stationCode Código da estação (ex: '65100001')
 * @param startDate Data inicial (opcional)
 * @param endDate Data final (opcional)
 */
export async function fetchTelemetricData(
  stationCode: string,
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  try {
    const url = new URL(ANA_ENDPOINTS.TELEMETRIC);
    url.searchParams.set('codEstacao', stationCode);
    url.searchParams.set('dataInicio', startDate || '');
    url.searchParams.set('dataFim', endDate || '');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/xml, text/xml, */*',
      },
      next: { revalidate: 300 }, // Cache de 5 minutos para telemetria
    });

    if (!response.ok) {
      console.warn(`[ANA API] Erro ao buscar dados telemétricos: HTTP ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    if (!xmlText || xmlText.includes('<Fault>') || xmlText.includes('<error>')) {
      return [];
    }

    // O XML da telemetria da ANA utiliza a tag <DadosHidrometereologicos> (ou <DadosHidrometeorologicos> / <Table>)
    let dataBlocks = extractTagBlocks(xmlText, 'DadosHidrometereologicos');
    if (dataBlocks.length === 0) {
      dataBlocks = extractTagBlocks(xmlText, 'DadosHidrometeorologicos');
    }
    if (dataBlocks.length === 0) {
      dataBlocks = extractTagBlocks(xmlText, 'DadosHidrometworking');
    }
    if (dataBlocks.length === 0) {
      dataBlocks = extractTagBlocks(xmlText, 'Table');
    }

    const results: RiverDataPoint[] = [];

    for (const block of dataBlocks) {
      const dataHoraStr = extractTagContent(block, 'DataHora') || extractTagContent(block, 'dataHora');
      if (!dataHoraStr) continue;

      const parsedDate = parseDateString(dataHoraStr);
      if (!parsedDate) continue;

      const rawLevelStr =
        extractTagContent(block, 'Nivel') ||
        extractTagContent(block, 'nivel') ||
        extractTagContent(block, 'Cota') ||
        extractTagContent(block, 'cota');

      const rawFlowStr =
        extractTagContent(block, 'Vazao') ||
        extractTagContent(block, 'vazao');

      const rawRainStr =
        extractTagContent(block, 'Chuva') ||
        extractTagContent(block, 'chuva');

      const rawLevel = parseNumericValue(rawLevelStr);
      const flow = parseNumericValue(rawFlowStr);
      const precipitation = parseNumericValue(rawRainStr);

      const level = normalizeLevelToMeters(rawLevel);

      results.push({
        date: parsedDate,
        level,
        flow,
        precipitation,
      });
    }

    // Ordena do mais antigo para o mais recente
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return results;
  } catch (error) {
    console.error('[ANA API] Falha na requisição de dados telemétricos:', error);
    return [];
  }
}
