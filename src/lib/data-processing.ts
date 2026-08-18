// ============================================================
// Hidro Alert — Processamento e Limpeza de Dados Hidrológicos
// ============================================================

import { RiverDataPoint } from './ana-api';

export type TrendDirection = 'rising' | 'stable' | 'falling';

export interface TrendResult {
  /** Taxa de variação do nível em metros por hora (m/h) */
  rateOfChange: number;
  /** Tendência qualitativa do nível */
  direction: TrendDirection;
  /** Diferença absoluta de nível observada no período avaliado (m) */
  diff: number;
  /** Período efetivo considerado em horas */
  hours: number;
  /** Leitura mais recente (m) */
  latestLevel: number;
  /** Leitura anterior usada como base (m) */
  previousLevel: number;
}

export interface DailyAggregatedData {
  /** Data no formato YYYY-MM-DD */
  date: string;
  /** Nível médio diário (m) */
  avgLevel: number;
  /** Nível máximo do dia (m) */
  maxLevel: number;
  /** Nível mínimo do dia (m) */
  minLevel: number;
  /** Vazão média diária (m³/s) */
  avgFlow: number;
  /** Precipitação total acumulada no dia (mm) */
  totalRain: number;
  /** Quantidade de medições agrupadas no dia */
  count: number;
}

export interface AnnualMax {
  /** Ano de referência */
  year: number;
  /** Nível máximo registrado no ano (m) */
  maxLevel: number;
  /** Data do registro de nível máximo */
  date: string;
}

/**
 * Limpa, valida e ordena uma série de dados hidrológicos.
 * Remove valores nulos, inválidos, datas corrompidas e registros duplicados.
 * Ordena os pontos cronologicamente (do mais antigo para o mais recente).
 *
 * @param rawData Lista de pontos brutos
 * @returns Lista tratada e ordenada
 */
export function cleanRiverData(
  rawData: (RiverDataPoint | Partial<RiverDataPoint> | null | undefined)[]
): RiverDataPoint[] {
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }

  const validMap = new Map<string, RiverDataPoint>();

  for (const item of rawData) {
    if (!item || !item.date) continue;

    const time = new Date(item.date).getTime();
    if (isNaN(time)) continue;

    const level = typeof item.level === 'number' && !isNaN(item.level) ? Math.max(0, item.level) : 0;
    const flow = typeof item.flow === 'number' && !isNaN(item.flow) ? Math.max(0, item.flow) : 0;
    const precipitation =
      typeof item.precipitation === 'number' && !isNaN(item.precipitation)
        ? Math.max(0, item.precipitation)
        : 0;

    // Se o nível for 0 e flow/chuva forem 0, verifica se há dados significativos
    const cleanedPoint: RiverDataPoint = {
      date: item.date,
      level: Number(level.toFixed(3)),
      flow: Number(flow.toFixed(2)),
      precipitation: Number(precipitation.toFixed(1)),
    };

    // Chave única para data/hora
    validMap.set(item.date, cleanedPoint);
  }

  const cleaned = Array.from(validMap.values());

  // Ordena cronologicamente crescente
  cleaned.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return cleaned;
}

/**
 * Calcula a tendência do nível do rio em uma janela recente de horas (ex: últimas 6h ou 12h).
 * Retorna a velocidade de subida/descida em metros por hora (m/h) e a classificação ('rising' | 'stable' | 'falling').
 *
 * @param data Série de leituras do rio
 * @param hoursBack Janela temporal em horas para análise de tendência (padrão: 6 horas)
 */
export function calculateTrend(data: RiverDataPoint[], hoursBack: number = 6): TrendResult {
  const defaultResult: TrendResult = {
    rateOfChange: 0,
    direction: 'stable',
    diff: 0,
    hours: 0,
    latestLevel: 0,
    previousLevel: 0,
  };

  if (!data || data.length < 2) {
    if (data && data.length === 1) {
      return {
        ...defaultResult,
        latestLevel: data[0].level,
        previousLevel: data[0].level,
      };
    }
    return defaultResult;
  }

  // Garante que os dados estejam ordenados
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = sorted[sorted.length - 1];
  const latestTime = new Date(latest.date).getTime();

  if (isNaN(latestTime)) {
    return defaultResult;
  }

  const targetTime = latestTime - hoursBack * 60 * 60 * 1000;

  // Encontra a leitura mais próxima da janela desejada (ou a mais antiga disponível dentro do histórico)
  let closestPoint = sorted[0];
  let minTimeDiff = Math.abs(new Date(sorted[0].date).getTime() - targetTime);

  for (let i = 0; i < sorted.length - 1; i++) {
    const pointTime = new Date(sorted[i].date).getTime();
    if (isNaN(pointTime)) continue;

    const diff = Math.abs(pointTime - targetTime);
    if (diff < minTimeDiff) {
      minTimeDiff = diff;
      closestPoint = sorted[i];
    }
  }

  const previousTime = new Date(closestPoint.date).getTime();
  const actualHours = (latestTime - previousTime) / (1000 * 60 * 60);

  if (actualHours <= 0) {
    return {
      ...defaultResult,
      latestLevel: latest.level,
      previousLevel: latest.level,
    };
  }

  const diff = Number((latest.level - closestPoint.level).toFixed(3));
  const rateOfChange = Number((diff / actualHours).toFixed(3));

  // Limiar de estabilidade: variação menor que 0.02 m/h (2 cm por hora)
  let direction: TrendDirection = 'stable';
  if (rateOfChange > 0.02) {
    direction = 'rising';
  } else if (rateOfChange < -0.02) {
    direction = 'falling';
  }

  return {
    rateOfChange,
    direction,
    diff,
    hours: Number(actualHours.toFixed(1)),
    latestLevel: latest.level,
    previousLevel: closestPoint.level,
  };
}

/**
 * Obtém a leitura mais recente de uma série hidrológica.
 *
 * @param data Série temporal de leituras
 * @returns Último ponto medido ou null se vazio
 */
export function getLatestReading(data: RiverDataPoint[]): RiverDataPoint | null {
  if (!data || data.length === 0) {
    return null;
  }

  let latest = data[0];
  let latestTime = new Date(latest.date).getTime();

  for (let i = 1; i < data.length; i++) {
    const time = new Date(data[i].date).getTime();
    if (!isNaN(time) && (isNaN(latestTime) || time > latestTime)) {
      latest = data[i];
      latestTime = time;
    }
  }

  return isNaN(latestTime) ? null : latest;
}

/**
 * Agrupa dados horários ou de alta frequência em resumos diários.
 * Calcula média, máxima, mínima de nível, vazão média e chuva acumulada por dia.
 *
 * @param data Série com registros horários ou telemétricos
 * @returns Lista agregada por dia (YYYY-MM-DD)
 */
export function aggregateByDay(data: RiverDataPoint[]): DailyAggregatedData[] {
  if (!data || data.length === 0) {
    return [];
  }

  const dayMap = new Map<
    string,
    {
      levels: number[];
      flows: number[];
      precipitation: number[];
    }
  >();

  for (const point of data) {
    if (!point || !point.date) continue;

    // Extrai YYYY-MM-DD
    const dayKey = point.date.split('T')[0].split(' ')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) continue;

    if (!dayMap.has(dayKey)) {
      dayMap.set(dayKey, {
        levels: [],
        flows: [],
        precipitation: [],
      });
    }

    const group = dayMap.get(dayKey)!;
    if (typeof point.level === 'number' && !isNaN(point.level)) {
      group.levels.push(point.level);
    }
    if (typeof point.flow === 'number' && !isNaN(point.flow) && point.flow > 0) {
      group.flows.push(point.flow);
    }
    if (typeof point.precipitation === 'number' && !isNaN(point.precipitation) && point.precipitation >= 0) {
      group.precipitation.push(point.precipitation);
    }
  }

  const aggregated: DailyAggregatedData[] = [];

  for (const [date, group] of dayMap.entries()) {
    const count = group.levels.length;
    if (count === 0) continue;

    const sumLevel = group.levels.reduce((acc, v) => acc + v, 0);
    const avgLevel = Number((sumLevel / count).toFixed(3));
    const maxLevel = Number(Math.max(...group.levels).toFixed(3));
    const minLevel = Number(Math.min(...group.levels).toFixed(3));

    const avgFlow =
      group.flows.length > 0
        ? Number((group.flows.reduce((acc, v) => acc + v, 0) / group.flows.length).toFixed(2))
        : 0;

    const totalRain =
      group.precipitation.length > 0
        ? Number(group.precipitation.reduce((acc, v) => acc + v, 0).toFixed(1))
        : 0;

    aggregated.push({
      date,
      avgLevel,
      maxLevel,
      minLevel,
      avgFlow,
      totalRain,
      count,
    });
  }

  aggregated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return aggregated;
}

/**
 * Identifica o nível máximo anual registrado para cada ano do histórico.
 * Utilizado para análise de eventos extremos (Ajuste de Gumbel / Período de Retorno).
 *
 * @param data Série histórica de leituras
 * @returns Lista com os máximos anuais
 */
export function getMaxByYear(data: RiverDataPoint[]): AnnualMax[] {
  if (!data || data.length === 0) {
    return [];
  }

  const yearMap = new Map<number, { maxLevel: number; date: string }>();

  for (const point of data) {
    if (!point || !point.date || typeof point.level !== 'number' || isNaN(point.level)) {
      continue;
    }

    const d = new Date(point.date);
    const year = d.getUTCFullYear();
    if (isNaN(year) || year < 1900 || year > 2100) continue;

    const current = yearMap.get(year);
    if (!current || point.level > current.maxLevel) {
      yearMap.set(year, {
        maxLevel: point.level,
        date: point.date,
      });
    }
  }

  const result: AnnualMax[] = [];
  for (const [year, record] of yearMap.entries()) {
    result.push({
      year,
      maxLevel: Number(record.maxLevel.toFixed(3)),
      date: record.date,
    });
  }

  result.sort((a, b) => a.year - b.year);

  return result;
}
