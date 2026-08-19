// ============================================================
// Hidro Alert — Cliente da Nova API REST da ANA (Agência Nacional de Águas)
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
    console.warn('[ANA API] Credenciais da ANA não configuradas (ANA_USUARIO / ANA_SENHA). Configure o .env');
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
      cache: 'no-store' // Sempre busca token novo ao expirar
    });

    if (!response.ok) {
      console.warn(`[ANA API] Falha na autenticação. HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (data && data.items && data.items.length > 0 && data.items[0].tokenautenticacao) {
      cachedToken = data.items[0].tokenautenticacao;
      // Define a expiração para 45 minutos (válido por 60 min segundo a documentação)
      tokenExpiration = Date.now() + 45 * 60 * 1000;
      return cachedToken;
    }

    return null;
  } catch (error) {
    console.error('[ANA API] Erro ao obter token:', error);
    return null;
  }
}

/**
 * Converte cota bruta (cm ou metros) para metros de forma segura.
 */
function normalizeLevelToMeters(rawLevel: number | string | null | undefined): number {
  if (rawLevel === null || rawLevel === undefined) return 0;
  const num = typeof rawLevel === 'string' ? parseFloat(rawLevel) : rawLevel;
  if (isNaN(num)) return 0;

  // Ignora códigos de erro comuns da ANA e valores fisicamente impossíveis
  if (num === 8888 || num === 9999) return 0;
  if (num <= 0) return 0;

  let meters = num;
  if (num > 30) {
    meters = num / 100;
  }
  
  // Níveis acima de 20 metros são fisicamente impossíveis para esta bacia (anomalias do sensor)
  if (meters > 20) {
    return 0;
  }
  
  return Number(meters.toFixed(3));
}

function parseNumericValue(valueStr: string | number | null | undefined): number {
  if (valueStr === null || valueStr === undefined) return 0;
  if (typeof valueStr === 'number') return valueStr;
  const sanitized = valueStr.trim().replace(',', '.');
  const num = parseFloat(sanitized);
  return isNaN(num) ? 0 : num;
}

/**
 * Formata data no padrão brasileiro YYYY-MM-DD para busca na nova API
 */
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
  stationCode: string,
  startDate?: string,
  range: string = 'DIAS_30'
): Promise<RiverDataPoint[]> {
  const token = await getAuthToken();
  if (!token) {
    return [];
  }

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
      console.warn(`[ANA API] Erro ao buscar dados: HTTP ${response.status}`);
      return [];
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
    console.error('[ANA API] Falha na requisição:', error);
    return [];
  }
}

/**
 * Busca a série histórica. Usamos a nova API com limite de 30 dias.
 */
export async function fetchHistoricalData(
  stationCode: string,
  dataType: AnaDataType | string = '1',
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  return fetchTelemetricAdopted(stationCode, startDate, 'DIAS_30');
}

/**
 * Busca dados telemétricos em tempo quase real.
 */
export async function fetchTelemetricData(
  stationCode: string,
  startDate?: string,
  endDate?: string
): Promise<RiverDataPoint[]> {
  return fetchTelemetricAdopted(stationCode, startDate, 'DIAS_30');
}
