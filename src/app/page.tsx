'use client';

import { useState, useEffect, useCallback } from 'react';
import HeroSection from '@/components/dashboard/hero-section';
import RiskGauge from '@/components/dashboard/risk-gauge';
import FriendlySummary from '@/components/dashboard/friendly-summary';
import FloodRuler from '@/components/dashboard/flood-ruler';
import InteractiveSimulator from '@/components/dashboard/interactive-simulator';
import StatsCards from '@/components/dashboard/stats-cards';
import RiverLevelChart from '@/components/dashboard/river-level-chart';
import PrecipitationChart from '@/components/dashboard/precipitation-chart';
import ReturnPeriod from '@/components/dashboard/return-period';
import EmergencyContacts from '@/components/dashboard/emergency-contacts';
import ForecastTrendChart from '@/components/dashboard/forecast-trend-chart';
import ForecastDailyCards from '@/components/dashboard/forecast-daily-cards';
import { classifyRisk } from '@/lib/statistics';
import type { RiskLevel } from '@/lib/constants';
import type { WeatherForecastResponse } from '@/lib/weather-api';
import type { HydrologicalProjectionResult } from '@/lib/hydrological-forecast';
import type { CombinedChartPoint } from '@/app/api/weather-forecast/route';

interface RiverDataPoint {
  date: string;
  level: number;
  flow: number;
  precipitation: number;
}

interface PrecipDataPoint {
  date: string;
  precipitation: number;
  accumulated: number;
}

interface ReturnPeriodRow {
  years: number;
  level: number;
  probability: number;
}

interface AnnualMax {
  year: number;
  maxLevel: number;
}

interface RiverResponse {
  data: RiverDataPoint[];
  latest: RiverDataPoint | null;
  trend: { rate: number; direction: 'rising' | 'stable' | 'falling' };
}

interface PrecipResponse {
  data: PrecipDataPoint[];
}

interface StatsResponse {
  returnPeriodTable: ReturnPeriodRow[];
  annualMaxima: AnnualMax[];
  gumbelParams: { location: number; scale: number };
}

interface ForecastApiResponse {
  success: boolean;
  weather: WeatherForecastResponse;
  projection: HydrologicalProjectionResult;
  chartData: CombinedChartPoint[];
  currentLevel: number;
  lastUpdated: string;
}

export default function DashboardPage() {
  const [riverData, setRiverData] = useState<RiverResponse | null>(null);
  const [precipData, setPrecipData] = useState<PrecipResponse | null>(null);
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [forecastData, setForecastData] = useState<ForecastApiResponse | null>(null);
  const [period, setPeriod] = useState('7');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastFetch, setLastFetch] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [riverRes, precipRes, statsRes, forecastRes] = await Promise.allSettled([
        fetch(`/api/river-data?days=${period}`),
        fetch('/api/precipitation'),
        fetch('/api/statistics'),
        fetch('/api/weather-forecast'),
      ]);

      if (riverRes.status === 'fulfilled' && riverRes.value.ok) {
        setRiverData(await riverRes.value.json());
      }
      if (precipRes.status === 'fulfilled' && precipRes.value.ok) {
        setPrecipData(await precipRes.value.json());
      }
      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        setStatsData(await statsRes.value.json());
      }
      if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
        setForecastData(await forecastRes.value.json());
      }

      setLastFetch(new Date().toISOString());
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15 * 60 * 1000); // Atualiza a cada 15 minutos
    return () => clearInterval(interval);
  }, [fetchData]);

  const currentLevel = riverData?.latest?.level ?? forecastData?.currentLevel ?? 0;
  const trend = riverData?.trend ?? { rate: 0, direction: 'stable' as const };
  const riskLevel: RiskLevel = classifyRisk(currentLevel);

  // Calcula estatísticas
  const levels = riverData?.data.map((d) => d.level) ?? [];
  const maxHistorical = levels.length
    ? {
        level: Math.max(...levels),
        date:
          riverData!.data[
            levels.indexOf(Math.max(...levels))
          ]?.date ?? '',
      }
    : { level: 0, date: '' };

  const avg30 =
    levels.length > 0
      ? levels.reduce((a, b) => a + b, 0) / levels.length
      : 0;

  const precips = precipData?.data ?? [];
  const last24h = precips.slice(-1);
  const last72h = precips.slice(-3);
  const precip24h = last24h.reduce((s, d) => s + d.precipitation, 0);
  const precip72h = last72h.reduce((s, d) => s + d.precipitation, 0);

  // Dias sem enchente (> 7.0m)
  const floodDays = (() => {
    if (!riverData?.data.length) return 999;
    const lastFlood = [...riverData.data]
      .reverse()
      .find((d) => d.level >= 7.0);
    if (!lastFlood) return 999;
    const diff = Date.now() - new Date(lastFlood.date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm max-w-sm w-full mx-4">
          <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-900">Carregando Telemetria...</h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Consultando estações da ANA, SNIRH e Open-Meteo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Diagnóstico Amigável em Português Claro */}
      <FriendlySummary
        level={currentLevel}
        trend={trend}
        precip24h={precip24h}
        riskLevel={riskLevel}
      />

      {/* 2. Destaque Visual: Cartão Principal + Termômetro de Risco */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <HeroSection
            level={currentLevel}
            trend={trend}
            lastUpdate={riverData?.latest?.date ?? lastFetch}
            riskLevel={riskLevel}
            onRefresh={fetchData}
            isRefreshing={refreshing}
          />
        </div>
        <div className="flex items-center justify-center">
          <RiskGauge level={currentLevel} maxLevel={10} />
        </div>
      </div>

      {/* 3. NOVO: Previsão Meteorológica e Gráfico de Tendência Futura (Próximos 7 dias) */}
      {forecastData && forecastData.success && (
        <div className="space-y-4 sm:space-y-6">
          <ForecastTrendChart
            data={forecastData.chartData}
            projection={forecastData.projection}
          />
          <ForecastDailyCards
            weather={forecastData.weather}
            projection={forecastData.projection}
          />
        </div>
      )}

      {/* 4. Simulador Interativo: "E se chover mais?" */}
      <InteractiveSimulator currentLevel={currentLevel} />

      {/* 5. Régua Prática de Inundação: O que acontece na cidade? */}
      <FloodRuler currentLevel={currentLevel} />

      {/* 6. Cartões de Resumo Rápido */}
      <StatsCards
        currentLevel={currentLevel}
        maxHistorical={maxHistorical}
        avg30days={avg30}
        precip24h={precip24h}
        precip72h={precip72h}
        daysSinceFlood={floodDays}
      />

      {/* 7. Gráficos Visuais do Histórico e Chuvas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico do Nível do Rio */}
        <div className="flex flex-col">
          <div className="flex justify-end mb-2">
            <div className="inline-flex bg-slate-200/80 p-1 rounded-xl shadow-xs">
              {[
                { label: '7d', val: '7' },
                { label: '30d', val: '30' },
                { label: '90d', val: '90' },
                { label: '180d', val: '180' },
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setPeriod(p.val)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    period === p.val
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <RiverLevelChart
            data={(riverData?.data ?? []).map((d) => ({
              date: d.date,
              level: d.level,
            }))}
            period={`${period} dias`}
          />
        </div>

        {/* Gráfico de Chuva */}
        <div className="flex flex-col justify-end">
          <PrecipitationChart data={precipData?.data ?? []} />
        </div>
      </div>

      {/* 8. Probabilidade Histórica de Enchentes (Gumbel & TR) */}
      <ReturnPeriod
        table={statsData?.returnPeriodTable ?? []}
        annualMaxima={statsData?.annualMaxima ?? []}
      />

      {/* 9. Telefones e Contatos de Emergência */}
      <EmergencyContacts />
    </div>
  );
}
