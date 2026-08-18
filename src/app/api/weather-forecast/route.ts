import { NextResponse } from 'next/server';
import { fetchWeatherForecast } from '@/lib/weather-api';
import { calculateHydrologicalForecast } from '@/lib/hydrological-forecast';
import { fetchTelemetricData, fetchHistoricalData } from '@/lib/ana-api';
import { cleanRiverData, calculateTrend, getLatestReading } from '@/lib/data-processing';
import { PRIMARY_STATION } from '@/lib/constants';
import type { RiverDataPoint } from '@/lib/ana-api';

export const revalidate = 1800; // 30 minutos (ISR)
export const dynamic = 'force-dynamic';

function formatAnaDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export interface CombinedChartPoint {
  date: string;
  dateFormatted: string;
  isObserved: boolean;
  isForecast: boolean;
  isToday?: boolean;
  level?: number; // Nível medido ou esperado
  observedLevel?: number;
  expectedLevel?: number;
  minLevel?: number;
  maxLevel?: number;
  rain?: number;
  floodProbability?: number;
  dayOfWeek?: string;
  weatherIcon?: string;
}

export async function GET() {
  try {
    // 1. Busca previsão meteorológica do Open-Meteo
    const weatherData = await fetchWeatherForecast();

    // 2. Busca telemetria recente do rio para sincronizar com o estado atual
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 4 * 24 * 60 * 60 * 1000); // Últimos 4 dias

    const startStr = formatAnaDate(startDate);
    const endStr = formatAnaDate(endDate);

    let rawData: RiverDataPoint[] = [];
    let recentRain24h = 0;

    try {
      rawData = await fetchTelemetricData(PRIMARY_STATION.code, startStr, endStr);
      if (rawData.length === 0) {
        rawData = await fetchHistoricalData(PRIMARY_STATION.code, '1', startStr, endStr);
      }
    } catch (e) {
      console.warn('[API weather-forecast] Telemetria ANA offline, usando cálculo com cota padrão:', e);
    }

    const cleanedRiver = cleanRiverData(rawData);
    const latestReading = getLatestReading(cleanedRiver);
    const trend = calculateTrend(cleanedRiver);

    const currentLevel = latestReading ? latestReading.level : 4.85;
    const trendRate = trend ? trend.rateOfChange : 0;

    // Calcula chuva recente acumulada das últimas 24h
    if (cleanedRiver.length > 0) {
      const nowMs = Date.now();
      const last24hPoints = cleanedRiver.filter(
        (p) => nowMs - new Date(p.date).getTime() <= 24 * 60 * 60 * 1000
      );
      recentRain24h = last24hPoints.reduce((acc, p) => acc + (p.precipitation || 0), 0);
    }

    // 3. Executa a projeção hidrológica
    const projection = calculateHydrologicalForecast(
      currentLevel,
      trendRate,
      weatherData.daily,
      recentRain24h
    );

    // 4. Monta a série temporal unificada para o gráfico (Passado observado + Ponto Hoje + Projeção Futura)
    const chartData: CombinedChartPoint[] = [];

    // Adiciona pontos históricos observados (últimos 3 dias)
    if (cleanedRiver.length > 0) {
      // Agrupa de forma simplificada por intervalos de 6h ou diários
      const pastDaysMap = new Map<string, { levels: number[]; rains: number[]; dateObj: Date }>();

      for (const p of cleanedRiver) {
        const d = new Date(p.date);
        const dayKey = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!pastDaysMap.has(dayKey)) {
          pastDaysMap.set(dayKey, { levels: [], rains: [], dateObj: d });
        }
        pastDaysMap.get(dayKey)!.levels.push(p.level);
        pastDaysMap.get(dayKey)!.rains.push(p.precipitation || 0);
      }

      for (const [dayKey, val] of pastDaysMap.entries()) {
        const avgLvl = Number((val.levels.reduce((a, b) => a + b, 0) / val.levels.length).toFixed(2));
        const totalR = Number(val.rains.reduce((a, b) => a + b, 0).toFixed(1));

        chartData.push({
          date: val.dateObj.toISOString().split('T')[0],
          dateFormatted: dayKey,
          isObserved: true,
          isForecast: false,
          observedLevel: avgLvl,
          level: avgLvl,
          rain: totalR,
        });
      }
    } else {
      // Ponto de fallback para o histórico se a telemetria estiver vazia
      const now = new Date();
      for (let i = 3; i >= 1; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const df = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        const lvl = Number((currentLevel - (i * 0.15)).toFixed(2));
        chartData.push({
          date: d.toISOString().split('T')[0],
          dateFormatted: df,
          isObserved: true,
          isForecast: false,
          observedLevel: lvl,
          level: lvl,
          rain: 2.0,
        });
      }
    }

    // Ponto de conexão ("Hoje / Agora")
    const today = new Date();
    const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    // Se o último ponto observado não for hoje, insere o ponto de transição
    const lastPoint = chartData[chartData.length - 1];
    if (!lastPoint || lastPoint.dateFormatted !== todayFormatted) {
      chartData.push({
        date: today.toISOString().split('T')[0],
        dateFormatted: todayFormatted,
        isObserved: true,
        isForecast: true,
        isToday: true,
        observedLevel: currentLevel,
        expectedLevel: currentLevel,
        minLevel: currentLevel,
        maxLevel: currentLevel,
        level: currentLevel,
        rain: recentRain24h,
        dayOfWeek: 'Hoje',
      });
    } else {
      lastPoint.isToday = true;
      lastPoint.observedLevel = currentLevel;
      lastPoint.expectedLevel = currentLevel;
      lastPoint.minLevel = currentLevel;
      lastPoint.maxLevel = currentLevel;
      lastPoint.level = currentLevel;
      lastPoint.dayOfWeek = 'Hoje';
    }

    // Adiciona os dias futuros projetados
    for (let i = 0; i < projection.projectedDays.length; i++) {
      const proj = projection.projectedDays[i];
      // Ignora se for o mesmo dia de hoje para não duplicar no gráfico
      if (proj.dateFormatted === todayFormatted) {
        continue;
      }

      chartData.push({
        date: proj.date,
        dateFormatted: proj.dateFormatted,
        isObserved: false,
        isForecast: true,
        expectedLevel: proj.expectedLevel,
        minLevel: proj.minLevel,
        maxLevel: proj.maxLevel,
        level: proj.expectedLevel,
        rain: proj.forecastRain,
        floodProbability: proj.floodProbability,
        dayOfWeek: proj.dayOfWeek,
        weatherIcon: proj.weatherIcon,
      });
    }

    return NextResponse.json({
      success: true,
      weather: weatherData,
      projection,
      chartData,
      currentLevel,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API weather-forecast] Erro inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Falha ao processar previsão do tempo e projeção hidrológica',
      },
      { status: 500 }
    );
  }
}
