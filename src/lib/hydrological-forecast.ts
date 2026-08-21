// ============================================================
// Hidro Alert — Motor Hidrológico de Projeção & Probabilidade
// ============================================================

import { RISK_THRESHOLDS, RiskLevel } from './constants';
import { DailyWeatherForecast, HourlyWeatherForecast } from './weather-api';

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

export interface ProjectedHour {
  time: string; // ISO string
  timeFormatted: string; // HH:mm
  expectedLevel: number;
  minLevel: number;
  maxLevel: number;
  forecastRain: number;
}

export interface HydrologicalProjectionResult {
  currentLevel: number;
  projectedDays: ProjectedDay[];
  projectedHours: ProjectedHour[];
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
 * Kernel de propagação hidrológica (tempo de concentração da bacia):
 * O estudo (pág. 106) aponta que a ascensão dura em média 7 a 15 dias devido ao longo percurso e pouca declividade.
 * Portanto, o pico do impacto de uma chuva ocorre ao longo de vários dias, não imediatamente.
 * Dia 0 (mesmo dia): 5%
 * Dia +1: 15%
 * Dia +2: 25%
 * Dia +3: 25%
 * Dia +4: 15%
 * Dia +5: 10%
 * Dia +6: 5%
 */
const HYDROGRAPH_WEIGHTS = [0.05, 0.15, 0.25, 0.25, 0.15, 0.10, 0.05];

/**
 * Calcula a projeção hidrológica contínua e a probabilidade de enchente para os próximos 7 dias.
 */
export function calculateHydrologicalForecast(
  currentLevel: number,
  recentTrendRate: number, // m/h
  forecastDaily: DailyWeatherForecast[],
  recentRain24h: number = 0,
  soilMoisture: number = 0.25, // m³/m³
  upstreamTrendRate: number | null = 0, // m/h (Estação a montante)
  forecastHourly?: HourlyWeatherForecast[] // opcional para gerar projectedHours
): HydrologicalProjectionResult {
  const safeCurrent = Math.max(1.0, isNaN(currentLevel) ? 4.5 : currentLevel);
  const nDays = forecastDaily.length;

  // Método SCS-CN (Soil Conservation Service - Curve Number) para calcular o escoamento superficial (Runoff)
  // CN varia entre ~50 (solo muito seco) a ~95 (solo saturado)
  const curveNumber = Math.min(98, Math.max(50, 45 + (soilMoisture * 110)));
  const S_storage = (25400 / curveNumber) - 254; // Retenção potencial máxima (mm)
  const Ia = 0.2 * S_storage; // Abstração inicial (perdas por interceptação e infiltração antes do escoamento)
  
  // Fator de calibração: metros de elevação do rio por mm de escoamento efetivo (Runoff)
  const RUNOFF_TO_LEVEL_COEF = 0.13; 

  // Calcula a matriz de contribuição de chuva por dia com retardo (convolução hidrológica)
  const rainContributions = new Array(nDays).fill(0);

  // Considera o efeito residual da chuva recente das últimas 24h usando o SCS-CN
  let recentPe = 0;
  if (recentRain24h > Ia) {
    recentPe = Math.pow(recentRain24h - Ia, 2) / (recentRain24h + 0.8 * S_storage);
  }
  if (recentPe > 0) {
    rainContributions[0] += recentPe * 0.4 * RUNOFF_TO_LEVEL_COEF;
    if (nDays > 1) {
      rainContributions[1] += recentPe * 0.2 * RUNOFF_TO_LEVEL_COEF;
    }
  }

  // Propagação da onda de cheia da estação a montante (routing geográfico).
  if (upstreamTrendRate !== null && Math.abs(upstreamTrendRate) > 0.01 && nDays > 2) {
    const dailyUpstreamVariation = upstreamTrendRate * 24; 
    rainContributions[1] += dailyUpstreamVariation * 0.4;
    rainContributions[2] += dailyUpstreamVariation * 0.3;
  }

  for (let i = 0; i < nDays; i++) {
    const rawRain = forecastDaily[i].precipitationSum;
    const prob = forecastDaily[i].precipitationProbability / 100;
    
    // Pondera a chuva pelo grau de certeza probabilística do modelo
    const probableRain = rawRain * (0.3 + 0.7 * prob); 

    let Pe = 0; // Precipitation excess (Runoff efetivo em mm)
    if (probableRain > Ia) {
      Pe = Math.pow(probableRain - Ia, 2) / (probableRain + 0.8 * S_storage);
    }

    for (let w = 0; w < HYDROGRAPH_WEIGHTS.length; w++) {
      const targetDay = i + w;
      if (targetDay < nDays) {
        rainContributions[targetDay] += Pe * HYDROGRAPH_WEIGHTS[w] * RUNOFF_TO_LEVEL_COEF;
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

  // Nível de base de estiagem do Rio Negro (calibrado conforme média histórica do IAT)
  const BASELINE_RIVER_LEVEL = 1.63;

  for (let i = 0; i < nDays; i++) {
    const dayForecast = forecastDaily[i];

    if (i === 0) {
      // Dia 0 é o ponto de partida ("Hoje"). O nível base esperado é a cota atual medida.
      runningLevel = safeCurrent;
      const expected = Number(runningLevel.toFixed(2));
      const minLvl = expected;
      const maxLvl = expected;

      projectedDays.push({
        date: dayForecast.date,
        dateFormatted: dayForecast.dateFormatted,
        dayOfWeek: dayForecast.dayOfWeek,
        expectedLevel: expected,
        minLevel: minLvl,
        maxLevel: maxLvl,
        forecastRain: dayForecast.precipitationSum,
        rainProbability: dayForecast.precipitationProbability,
        floodProbability: expected >= RISK_THRESHOLDS.EMERGENCY ? 99 : 0,
        alertProbability: expected >= RISK_THRESHOLDS.ALERT ? 99 : 0,
        riskLevel: expected >= RISK_THRESHOLDS.EMERGENCY ? 'emergency' : expected >= RISK_THRESHOLDS.ALERT ? 'alert' : expected >= RISK_THRESHOLDS.ATTENTION ? 'attention' : 'normal',
        weatherDescription: dayForecast.weatherDescription,
        weatherIcon: dayForecast.weatherIcon,
      });
      continue;
    }

    // 1. Inércia real do rio baseada na tendência recente (m/dia)
    const actualDailyTrend = recentTrendRate * 24;

    // 2. Recessão natural teórica (quanto o rio deveria cair por escoamento)
    const excessAboveBase = Math.max(0, runningLevel - BASELINE_RIVER_LEVEL);
    const theoreticalRecession = excessAboveBase > 0 ? Math.min(0.50, excessAboveBase * 0.035 + 0.02) : 0;
    const theoreticalTrend = -theoreticalRecession; // Tendência teórica é sempre negativa (esvaziamento)

    // 3. Suavização (Decaimento Exponencial)
    // O peso da inércia real começa alto no dia 1 e decai para dar lugar à física teórica nos dias seguintes
    const inertiaWeight = Math.pow(0.65, i); 
    
    // Mescla a tendência real com a tendência teórica
    let baseDailyChange = (actualDailyTrend * inertiaWeight) + (theoreticalTrend * (1 - inertiaWeight));

    // Proteção: se a tendência real for uma subida muito abrupta e não há chuva nova, ela deve decair mais rápido
    if (actualDailyTrend > 0 && rainContributions[i] === 0) {
      baseDailyChange = Math.min(baseDailyChange, actualDailyTrend * Math.pow(0.4, i));
    }

    // 4. Acréscimo hidrológico da chuva prevista para hoje
    const inflowRise = rainContributions[i];

    // Novo nível esperado
    runningLevel = Math.max(BASELINE_RIVER_LEVEL, runningLevel + baseDailyChange + inflowRise);
    const expected = Number(runningLevel.toFixed(2));

    // Margem de incerteza (cresce com o horizonte temporal)
    const uncertainty = Number((0.12 + (i - 1) * 0.07 + (dayForecast.precipitationSum > 15 ? 0.30 : 0.08)).toFixed(2));
    const minLvl = Number(Math.max(BASELINE_RIVER_LEVEL, expected - uncertainty).toFixed(2));
    const maxLvl = Number((expected + uncertainty * 1.35).toFixed(2));

    if (maxLvl > maxProjected) {
      maxProjected = maxLvl;
      peakDate = dayForecast.date;
      peakDayOfWeek = dayForecast.dayOfWeek;
    }

    // 4. Cálculo estocástico de probabilidade de atingir cotas críticas
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

  const projectedHours: ProjectedHour[] = [];
  if (forecastHourly && forecastHourly.length > 0 && projectedDays.length > 2) {
    const nowStr = forecastHourly[0].time; // start time
    
    // Find expected levels
    const level0 = safeCurrent;
    const level1 = projectedDays[1].expectedLevel;
    const level2 = projectedDays[2].expectedLevel;
    
    const min0 = safeCurrent;
    const min1 = projectedDays[1].minLevel;
    const min2 = projectedDays[2].minLevel;
    
    const max0 = safeCurrent;
    const max1 = projectedDays[1].maxLevel;
    const max2 = projectedDays[2].maxLevel;

    // Loop até 48h (ou o tamanho do array horário)
    const limit = Math.min(forecastHourly.length, 48);
    for (let h = 0; h < limit; h++) {
      const hData = forecastHourly[h];
      const fraction = (h % 24) / 24;
      const isFirstDay = h < 24;

      const y1 = isFirstDay ? level0 : level1;
      const y2 = isFirstDay ? level1 : level2;
      const minY1 = isFirstDay ? min0 : min1;
      const minY2 = isFirstDay ? min1 : min2;
      const maxY1 = isFirstDay ? max0 : max1;
      const maxY2 = isFirstDay ? max1 : max2;

      // Interpolação linear (evita cotovelo horizontal no início da projeção)
      const mu2 = fraction;
      
      const interpLevel = y1 * (1 - mu2) + y2 * mu2;
      const interpMin = minY1 * (1 - mu2) + minY2 * mu2;
      const interpMax = maxY1 * (1 - mu2) + maxY2 * mu2;
      
      // Formata a hora "HH:mm"
      const dateObj = new Date(hData.time);
      const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      projectedHours.push({
        time: hData.time,
        timeFormatted,
        expectedLevel: Number(interpLevel.toFixed(2)),
        minLevel: Number(interpMin.toFixed(2)),
        maxLevel: Number(interpMax.toFixed(2)),
        forecastRain: hData.precipitation,
      });
    }
  }

  return {
    currentLevel: safeCurrent,
    projectedDays,
    projectedHours,
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
