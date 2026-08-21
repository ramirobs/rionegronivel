// ============================================================
// Hidro Alert — Análise Estatística e Hidrológica (Gumbel & Risco)
// ============================================================

import { RISK_THRESHOLDS, RiskLevel } from './constants';

export interface GumbelParameters {
  /** Parâmetro de localização / posição (μ ou u) */
  location: number;
  /** Parâmetro de escala (β ou alpha) */
  scale: number;
}

export interface ReturnPeriodRow {
  /** Tempo de Retorno em anos (TR) */
  years: number;
  /** Nível da água estimado correspondente (metros) */
  level: number;
  /** Probabilidade anual de excedência (1 / TR) */
  probability: number;
}

export interface SummaryStatistics {
  count: number;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  median: number;
}

/** Constante de Euler-Mascheroni (γ) */
const EULER_MASCHERONI = 0.5772156649015329;

/**
 * Classifica o nível do rio em uma faixa de risco da Defesa Civil.
 * 
 * Faixas baseadas nos limiares de Rio Negro (PR) e Mafra (SC):
 * - < 5.0m: Normal (Verde)
 * - 5.0m a 6.0m: Atenção (Amarelo)
 * - 6.0m a 8.0m: Alerta (Laranja - risco de alagamentos em áreas ribeirinhas)
 * - >= 8.0m: Emergência (Vermelho - enchente confirmada)
 *
 * @param level Nível do rio em metros
 * @returns 'normal' | 'attention' | 'alert' | 'emergency'
 */
export function classifyRisk(level: number): RiskLevel {
  if (typeof level !== 'number' || isNaN(level) || level < 0) {
    return 'normal';
  }

  if (level >= RISK_THRESHOLDS.EMERGENCY) {
    return 'emergency';
  }
  if (level >= RISK_THRESHOLDS.ALERT) {
    return 'alert';
  }
  if (level >= RISK_THRESHOLDS.ATTENTION) {
    return 'attention';
  }
  return 'normal';
}

/**
 * Extrai valores numéricos válidos de um array que pode conter números ou objetos com `maxLevel`.
 */
function extractNumericArray(annualMaxima: (number | { maxLevel: number })[]): number[] {
  if (!annualMaxima || !Array.isArray(annualMaxima)) {
    return [];
  }

  const values: number[] = [];
  for (const item of annualMaxima) {
    if (typeof item === 'number') {
      if (!isNaN(item) && item > 0) values.push(item);
    } else if (item && typeof item === 'object' && typeof item.maxLevel === 'number') {
      if (!isNaN(item.maxLevel) && item.maxLevel > 0) values.push(item.maxLevel);
    }
  }

  return values;
}

/**
 * Ajusta a Distribuição de Gumbel (Tipo I para Máximos) aos dados de máximas anuais
 * utilizando o Método dos Momentos.
 *
 * Fórmulas:
 * - Média amostral: x̄
 * - Desvio padrão amostral: s
 * - Escala (β): s * √6 / π
 * - Localização (μ): x̄ - γ * β (onde γ = 0.57721566...)
 *
 * @param annualMaxima Array de máximos anuais (números ou objetos com maxLevel)
 * @returns Parâmetros de Gumbel { location, scale }
 */
export function calculateGumbel(
  annualMaxima: (number | { maxLevel: number })[]
): GumbelParameters {
  const values = extractNumericArray(annualMaxima);
  const n = values.length;

  if (n < 2) {
    // Valores de fallback seguros caso haja dados insuficientes
    const defaultMean = values.length === 1 ? values[0] : 6.0;
    return {
      location: defaultMean,
      scale: 1.0,
    };
  }

  // Média amostral
  const mean = values.reduce((sum, val) => sum + val, 0) / n;

  // Desvio padrão amostral (não tendencioso: divisor n - 1)
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev <= 0) {
    return {
      location: mean,
      scale: 1.0,
    };
  }

  // Parâmetro de escala β = s * √6 / π
  const scale = (stdDev * Math.sqrt(6)) / Math.PI;

  // Parâmetro de localização μ = x̄ - γ * β
  const location = mean - EULER_MASCHERONI * scale;

  return {
    location: Number(location.toFixed(4)),
    scale: Number(scale.toFixed(4)),
  };
}

/**
 * Calcula a probabilidade de não excedência F(x) para um dado nível na distribuição de Gumbel.
 * F(x) = exp(-exp(-(x - μ) / β))
 */
export function gumbelCDF(level: number, gumbelParams: GumbelParameters): number {
  const { location, scale } = gumbelParams;
  if (scale <= 0) return 1;

  const z = (level - location) / scale;
  // Limitação para evitar underflow/overflow numérico
  if (z < -10) return 0;
  if (z > 30) return 1;

  return Math.exp(-Math.exp(-z));
}

/**
 * Calcula a probabilidade anual de excedência P(X > x) = 1 - F(x).
 *
 * @param level Nível do rio em metros
 * @param gumbelParams Parâmetros da distribuição de Gumbel
 * @returns Probabilidade de 0 a 1
 */
export function calculateExceedanceProbability(
  level: number,
  gumbelParams: GumbelParameters
): number {
  const cdf = gumbelCDF(level, gumbelParams);
  return Math.max(0, Math.min(1, 1 - cdf));
}

/**
 * Calcula o Tempo de Retorno (Período de Retorno em anos) para um determinado nível d'água.
 * TR = 1 / (1 - F(x))
 *
 * @param level Nível do rio em metros
 * @param gumbelParams Parâmetros da distribuição de Gumbel
 * @returns Tempo de retorno em anos (mínimo 1.0)
 */
export function returnPeriod(level: number, gumbelParams: GumbelParameters): number {
  const exceedanceProb = calculateExceedanceProbability(level, gumbelParams);

  if (exceedanceProb <= 0.0001) {
    return 10000;
  }

  const tr = 1 / exceedanceProb;
  return Number(Math.max(1.0, tr).toFixed(2));
}

/**
 * Função quantil inversa de Gumbel: calcula o nível do rio correspondente a um Tempo de Retorno desejado.
 *
 * Fórmula:
 * x = μ - β * ln(-ln(1 - 1 / TR))
 *
 * @param years Tempo de Retorno em anos (ex: 2, 5, 10, 25, 50, 100)
 * @param gumbelParams Parâmetros da distribuição de Gumbel
 * @returns Nível estimado do rio em metros
 */
export function gumbelQuantile(years: number, gumbelParams: GumbelParameters): number {
  const { location, scale } = gumbelParams;

  if (years <= 1) {
    return Number(location.toFixed(2));
  }

  // Probabilidade de não excedência p = 1 - 1 / TR
  const p = 1 - 1 / years;

  // Variável reduzida y = -ln(-ln(p))
  const y = -Math.log(-Math.log(p));

  // Nível x = μ + β * y
  const level = location + scale * y;

  return Number(level.toFixed(2));
}

/**
 * Gera a tabela de Períodos de Retorno padrão da hidrologia brasileira.
 * Anos avaliados: [2, 5, 10, 25, 50, 100].
 *
 * @param annualMaxima Série histórica de máximas anuais
 * @returns Tabela com anos, níveis correspondentes e probabilidades
 */
export function generateReturnPeriodTable(
  annualMaxima: (number | { maxLevel: number })[]
): ReturnPeriodRow[] {
  const params = calculateGumbel(annualMaxima);
  const periods = [2, 5, 10, 25, 50, 100];

  return periods.map((years) => {
    const level = gumbelQuantile(years, params);
    const probability = Number(((1 / years) * 100).toFixed(2));

    return {
      years,
      level,
      probability,
    };
  });
}

/**
 * Calcula estatísticas descritivas básicas de uma série numérica.
 */
export function calculateSummaryStatistics(values: number[]): SummaryStatistics {
  const valid = values.filter((v) => typeof v === 'number' && !isNaN(v));
  if (valid.length === 0) {
    return { count: 0, mean: 0, stdDev: 0, min: 0, max: 0, median: 0 };
  }

  const count = valid.length;
  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  const variance =
    count > 1
      ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (count - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  const min = sorted[0];
  const max = sorted[count - 1];

  let median = 0;
  const mid = Math.floor(count / 2);
  if (count % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }

  return {
    count,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    median: Number(median.toFixed(2)),
  };
}
