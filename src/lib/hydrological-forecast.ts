// ============================================================
// Hidro Alert — Motor Hidrológico de Projeção & Probabilidade
// ============================================================

import { RISK_THRESHOLDS, RiskLevel } from './constants';
import { DailyWeatherForecast } from './weather-api';

export interface ProjectedDay {
  date: string; // YYYY-MM-DD
  dateFormatted: string; // DD/MM
  dayOfWeek: string;
  expectedLevel: number; // Nível mais provável (m)
  minLevel: number; // Limite inferior / cenário otimista (m)
  maxLevel: number; // Limite superior / cenário pessimista (m)
  forecastRain: number; // mm
  rainProbability: number; // %
  floodProbability: number; // Probabilidade (%) de atingir cota de emergência (7.0m)
  alertProbability: number; // Probabilidade (%) de atingir cota de alerta (6.0m)
  riskLevel: RiskLevel;
  weatherDescription: string;
  weatherIcon: string;
}

export interface HydrologicalProjectionResult {
  currentLevel: number;
  projectedDays: ProjectedDay[];
  overallTrend: {
    direction: 'rising' | 'falling' | 'stable';
    label: string; // "Tendência de Aumento", "Tendência de Redução", "Estável"
    summary: string;
    maxProjectedLevel: number;
    peakDate: string;
    peakDayOfWeek: string;
    levelDiffFromNow: number; // Diferença em metros (+/-)
  };
  overallFloodProbability: number; // Probabilidade máxima (%) de enchente nos próximos 7 dias
  overallAlertProbability: number; // Probabilidade máxima (%) de alerta nos próximos 7 dias
  floodRiskCategory: 'baixo' | 'moderado' | 'alto' | 'critico';
  riskAdvice: string;
}

/**
 * Coeficiente de sensibilidade chuva-nível da bacia do Rio Negro (PR/SC):
 * ~25mm de chuva acumulada na cabeceira eleva o rio em cerca de ~0.85m a 1.15m.
 */
const RAIN_RESPONSE_COEFFICIENT = 0.038; // ~0.95m para 25mm

/**
 * Kernel de propagação hidrológica (tempo de concentração da bacia de 24h a 48h):
 * Dia 0 (mesmo dia): 20% do impacto
 * Dia +1 (dia seguinte - pico na régua de Mafra/Rio Negro): 55%
 * Dia +2 (cauda do hidrograma): 20%
 * Dia +3 (recessão final): 5%
 */
const HYDROGRAPH_WEIGHTS = [0.20, 0.55, 0.20, 0.05];

/**
 * Calcula a projeção hidrológica contínua e a probabilidade de enchente para os próximos 7 dias.
 */
export function calculateHydrologicalForecast(
  currentLevel: number,
  recentTrendRate: number, // m/h
  forecastDaily: DailyWeatherForecast[],
  recentRain24h: number = 0
): HydrologicalProjectionResult {
  const safeCurrent = Math.max(1.0, isNaN(currentLevel) ? 4.5 : currentLevel);
  const nDays = forecastDaily.length;

  // Calcula a matriz de contribuição de chuva por dia com retardo (convolução hidrológica)
  const rainContributions = new Array(nDays).fill(0);

  // Considera o efeito residual da chuva recente das últimas 24h
  if (recentRain24h > 5) {
    rainContributions[0] += recentRain24h * 0.4 * RAIN_RESPONSE_COEFFICIENT;
    if (nDays > 1) {
      rainContributions[1] += recentRain24h * 0.2 * RAIN_RESPONSE_COEFFICIENT;
    }
  }

  for (let i = 0; i < nDays; i++) {
    const rain = forecastDaily[i].precipitationSum;
    const prob = forecastDaily[i].precipitationProbability / 100;
    const effectiveRain = rain * (0.4 + 0.6 * prob); // Pondera chuva pelo grau de certeza

    for (let w = 0; w < HYDROGRAPH_WEIGHTS.length; w++) {
      const targetDay = i + w;
      if (targetDay < nDays) {
        rainContributions[targetDay] += effectiveRain * HYDROGRAPH_WEIGHTS[w] * RAIN_RESPONSE_COEFFICIENT;
      }
    }
  }

  const projectedDays: ProjectedDay[] = [];
  let runningLevel = safeCurrent;
  let maxProjected = safeCurrent;
  let peakDate = forecastDaily[0]?.date || '';
  let peakDayOfWeek = forecastDaily[0]?.dayOfWeek || '';
  let maxFloodProb = 0;
  let maxAlertProb = 0;

  // Nível de base de estiagem do Rio Negro
  const BASELINE_RIVER_LEVEL = 3.80;

  for (let i = 0; i < nDays; i++) {
    const dayForecast = forecastDaily[i];

    // 1. Recessão natural do nível (perda por drenagem em direção à cota base)
    const excessAboveBase = Math.max(0, runningLevel - BASELINE_RIVER_LEVEL);
    const dailyRecession = excessAboveBase > 0 ? Math.min(0.35, excessAboveBase * 0.12 + 0.05) : 0;

    // 2. Acréscimo hidrológico da chuva prevista
    const inflowRise = rainContributions[i];

    // 3. Efeito da inércia da taxa de variação recente no primeiro dia
    const inertia = i === 0 ? Math.max(-0.25, Math.min(0.35, recentTrendRate * 12)) : 0;

    // Novo nível esperado
    runningLevel = Math.max(2.5, runningLevel - dailyRecession + inflowRise + inertia);
    const expected = Number(runningLevel.toFixed(2));

    // Margem de incerteza (cresce com o horizonte temporal)
    const uncertainty = Number((0.15 + i * 0.08 + (dayForecast.precipitationSum > 15 ? 0.35 : 0.1)).toFixed(2));
    const minLvl = Number(Math.max(2.0, expected - uncertainty).toFixed(2));
    const maxLvl = Number((expected + uncertainty * 1.35).toFixed(2));

    if (maxLvl > maxProjected) {
      maxProjected = maxLvl;
      peakDate = dayForecast.date;
      peakDayOfWeek = dayForecast.dayOfWeek;
    }

    // 4. Cálculo estocástico de probabilidade de atingir cotas críticas
    // Baseado na distância do nível projetado até os limiares e na incerteza (distribuição normal aproximada)
    const floodZ = (RISK_THRESHOLDS.EMERGENCY - expected) / (uncertainty * 1.1);
    const alertZ = (RISK_THRESHOLDS.ALERT - expected) / (uncertainty * 1.1);

    const calcProb = (z: number) => {
      if (z <= -1.5) return 98;
      if (z <= -1.0) return 92;
      if (z <= -0.5) return 80;
      if (z <= 0) return 55;
      if (z <= 0.5) return 35;
      if (z <= 1.0) return 18;
      if (z <= 1.5) return 8;
      if (z <= 2.0) return 3;
      return 1;
    };

    const floodProb = calcProb(floodZ);
    const alertProb = calcProb(alertZ);

    if (floodProb > maxFloodProb) maxFloodProb = floodProb;
    if (alertProb > maxAlertProb) maxAlertProb = alertProb;

    let dayRisk: RiskLevel = 'normal';
    if (expected >= RISK_THRESHOLDS.EMERGENCY || maxLvl >= RISK_THRESHOLDS.EMERGENCY + 0.3) {
      dayRisk = 'emergency';
    } else if (expected >= RISK_THRESHOLDS.ALERT || maxLvl >= RISK_THRESHOLDS.ALERT + 0.3) {
      dayRisk = 'alert';
    } else if (expected >= RISK_THRESHOLDS.ATTENTION || maxLvl >= RISK_THRESHOLDS.ATTENTION + 0.2) {
      dayRisk = 'attention';
    }

    projectedDays.push({
      date: dayForecast.date,
      dateFormatted: dayForecast.dateFormatted,
      dayOfWeek: dayForecast.dayOfWeek,
      expectedLevel: expected,
      minLevel: minLvl,
      maxLevel: maxLvl,
      forecastRain: dayForecast.precipitationSum,
      rainProbability: dayForecast.precipitationProbability,
      floodProbability: floodProb,
      alertProbability: alertProb,
      riskLevel: dayRisk,
      weatherDescription: dayForecast.weatherDescription,
      weatherIcon: dayForecast.weatherIcon,
    });
  }

  // 5. Determina a tendência qualitativa geral
  const finalDayLevel = projectedDays[projectedDays.length - 1]?.expectedLevel ?? safeCurrent;
  const levelDiff = Number((maxProjected - safeCurrent).toFixed(2));
  const netDiff = Number((finalDayLevel - safeCurrent).toFixed(2));

  let direction: 'rising' | 'falling' | 'stable' = 'stable';
  let trendLabel = 'Estável';
  let summary = 'O nível do rio deve oscilar próximo da estabilidade nos próximos dias.';

  if (levelDiff >= 0.35 || netDiff >= 0.25) {
    direction = 'rising';
    trendLabel = 'Tendência de Aumento';
    summary = `O rio apresenta tendência de elevação com pico previsto em ${peakDayOfWeek} (${maxProjected.toFixed(2)}m).`;
  } else if (netDiff <= -0.30) {
    direction = 'falling';
    trendLabel = 'Tendência de Redução';
    summary = `O rio apresenta tendência de vazante contínua com escoamento das águas.`;
  }

  // 6. Categoria de risco geral e orientações
  let floodRiskCategory: 'baixo' | 'moderado' | 'alto' | 'critico' = 'baixo';
  let riskAdvice = 'Sem risco iminente de enchente. Condições hidrológicas favoráveis.';

  if (maxFloodProb >= 70 || maxProjected >= RISK_THRESHOLDS.EMERGENCY) {
    floodRiskCategory = 'critico';
    riskAdvice = 'ALERTA MÁXIMO: Alta probabilidade de transbordamento e enchente nos próximos dias. Prepare medidas preventivas.';
  } else if (maxFloodProb >= 35 || maxAlertProb >= 65 || maxProjected >= RISK_THRESHOLDS.ALERT) {
    floodRiskCategory = 'alto';
    riskAdvice = 'Risco elevado de alagamentos em áreas baixas e ribeirinhas. Acompanhe os boletins horários.';
  } else if (maxFloodProb >= 15 || maxAlertProb >= 30 || maxProjected >= RISK_THRESHOLDS.ATTENTION) {
    floodRiskCategory = 'moderado';
    riskAdvice = 'Atenção com previsão de chuvas acumuladas. O rio subirá, mas com baixa chance de invasão de moradias.';
  }

  return {
    currentLevel: safeCurrent,
    projectedDays,
    overallTrend: {
      direction,
      label: trendLabel,
      summary,
      maxProjectedLevel: Number(maxProjected.toFixed(2)),
      peakDate,
      peakDayOfWeek,
      levelDiffFromNow: levelDiff,
    },
    overallFloodProbability: maxFloodProb,
    overallAlertProbability: maxAlertProb,
    floodRiskCategory,
    riskAdvice,
  };
}
