'use client';

import { useState, useEffect, useCallback } from 'react';
import NavigationTabs, { type TabId } from '@/components/dashboard/navigation-tabs';
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
import SkeletonDashboard from '@/components/dashboard/skeleton-dashboard';
import FloodMap from '@/components/dashboard/flood-map';
import { classifyRisk } from '@/lib/statistics';
import type { RiskLevel } from '@/lib/constants';
import type { WeatherForecastResponse } from '@/lib/weather-api';
import type { HydrologicalProjectionResult } from '@/lib/hydrological-forecast';
import type { CombinedChartPoint } from '@/app/api/weather-forecast/route';
import { Map, CloudRain, SlidersHorizontal, BarChart3, ShieldAlert, Sparkles } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<TabId>('live');
  const [activeSimulatedLevel, setActiveSimulatedLevel] = useState<number | null>(null);
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

  const handleManualRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const [riverRes, precipRes, statsRes, forecastRes] = await Promise.allSettled([
          fetch(`/api/river-data?days=${period}`),
          fetch('/api/precipitation'),
          fetch('/api/statistics'),
          fetch('/api/weather-forecast'),
        ]);

        if (!isMounted) return;

        if (riverRes.status === 'fulfilled' && riverRes.value.ok) {
          const data = await riverRes.value.json();
          if (isMounted) setRiverData(data);
        }
        if (precipRes.status === 'fulfilled' && precipRes.value.ok) {
          const data = await precipRes.value.json();
          if (isMounted) setPrecipData(data);
        }
        if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
          const data = await statsRes.value.json();
          if (isMounted) setStatsData(data);
        }
        if (forecastRes.status === 'fulfilled' && forecastRes.value.ok) {
          const data = await forecastRes.value.json();
          if (isMounted) setForecastData(data);
        }

        if (isMounted) setLastFetch(new Date().toISOString());
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    const interval = setInterval(load, 15 * 60 * 1000); // Atualiza a cada 15 minutos
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [period]);

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
    const referenceTimestamp = lastFetch ? new Date(lastFetch).getTime() : new Date(lastFlood.date).getTime();
    const diff = referenceTimestamp - new Date(lastFlood.date).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  })();

  if (loading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="pb-8">
      {/* Sistema de Abas / Menu */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        riskLevel={riskLevel}
      />

      {/* ========================================================================= */}
      {/* ABA 1: AO VIVO (MONITORAMENTO EM TEMPO REAL)                              */}
      {/* ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
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
                precip24h={precip24h}
                recentReadings={riverData?.data || []}
                onRefresh={handleManualRefresh}
                isRefreshing={refreshing}
              />
            </div>
            <div className="flex items-center justify-center">
              <RiskGauge level={currentLevel} maxLevel={10} />
            </div>
          </div>

          {/* 3. Régua Prática de Inundação: O que acontece na cidade? */}
          <FloodRuler currentLevel={currentLevel} />

          {/* 4. Cartões de Resumo Rápido */}
          <StatsCards
            currentLevel={currentLevel}
            maxHistorical={maxHistorical}
            avg30days={avg30}
            precip24h={precip24h}
            precip72h={precip72h}
            daysSinceFlood={floodDays}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: MAPA DA CHEIA & MANCHA DE INUNDAÇÃO (RIO NEGRO / MAFRA)             */}
      {/* ========================================================================= */}
      {activeTab === 'map' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-md border border-blue-800/40">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 backdrop-blur-md rounded-xl">
                <Map className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Mapa Interativo da Mancha de Inundação
                </h2>
                <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                  Visualização geoespacial das áreas atingidas pelo Rio Negro e status de travessia das pontes entre Rio Negro (PR) e Mafra (SC).
                </p>
              </div>
            </div>
          </div>

          <FloodMap currentLevel={currentLevel} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: PREVISÃO DO TEMPO & PROJEÇÃO HIDROLÓGICA (7 DIAS)                  */}
      {/* ========================================================================= */}
      {activeTab === 'forecast' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-700 rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <CloudRain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Previsão Meteorológica & Projeção Hidrológica
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                  Estimativa do comportamento do Rio Negro para os próximos 7 dias com base nas chuvas previstas na bacia hidrográfica.
                </p>
              </div>
            </div>
          </div>

          {forecastData && forecastData.success ? (
            <>
              {/* Gráfico de Tendência Futura */}
              <ForecastTrendChart
                data={forecastData.chartData}
                projection={forecastData.projection}
              />

              {/* Cards Diários com Clima e Nível Projetado */}
              <ForecastDailyCards
                weather={forecastData.weather}
                projection={forecastData.projection}
              />
            </>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm text-slate-500 font-medium">
                Carregando previsão do tempo e projeções...
              </p>
            </div>
          )}

          {/* Gráfico de Chuva Recente e Acumulada */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2 px-1">
              Volume de Chuva Recente nas Estações
            </h3>
            <PrecipitationChart data={precipData?.data ?? []} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: SIMULADOR INTERATIVO                                              */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-600 rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <SlidersHorizontal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Simulador Interativo de Enchentes
                </h2>
                <p className="text-xs sm:text-sm text-purple-100 mt-0.5">
                  Arraste a quantidade de chuva esperada para prever o nível que o Rio Negro pode atingir e quais áreas seriam impactadas.
                </p>
              </div>
            </div>
          </div>

          {/* Simulador Interativo */}
          <InteractiveSimulator 
            currentLevel={currentLevel} 
            onSimulate={setActiveSimulatedLevel}
          />

          {/* Régua de apoio para consulta durante a simulação */}
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2 px-1">
              Cotas Críticas de Referência em RioMafra
            </h3>
            <FloodRuler currentLevel={activeSimulatedLevel ?? currentLevel} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: HISTÓRICO & DADOS ESTATÍSTICOS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-blue-900 rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Histórico Hidrológico & Análise Probabilística
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Registros históricos de nível, vazão e modelagem estatística de extremos (Distribuição Gumbel).
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico do Nível do Rio com Filtro de Dias */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-sm font-bold text-slate-700">
                Evolução Temporal do Nível
              </span>
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
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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

          {/* Probabilidade Histórica de Enchentes (Gumbel & TR) */}
          <ReturnPeriod
            table={statsData?.returnPeriodTable ?? []}
            annualMaxima={statsData?.annualMaxima ?? []}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: EMERGÊNCIA & CONTATOS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'emergency' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 rounded-2xl p-4 sm:p-6 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  Canais de Emergência & Apoio à População
                </h2>
                <p className="text-xs sm:text-sm text-rose-100 mt-0.5">
                  Telefones diretos dos órgãos de socorro e Defesa Civil de Rio Negro (PR) e Mafra (SC).
                </p>
              </div>
            </div>
          </div>

          {/* Componente Oficial de Contatos de Emergência */}
          <EmergencyContacts />

          {/* Guia Rápido de Ação Preventiva */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Dicas de Segurança em caso de Enchente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="font-bold text-blue-800">1. Prevenção</p>
                <p className="text-slate-600">
                  Desligue disjuntores e registros de gás caso a água comece a se aproximar da residência. Guarde documentos em sacos plásticos.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="font-bold text-amber-800">2. Evacuação</p>
                <p className="text-slate-600">
                  Nunca atravesse ruas alagadas a pé ou de carro. Siga imediatamente as orientações da Defesa Civil e vá para abrigos indicados.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                <p className="font-bold text-emerald-800">3. Retorno</p>
                <p className="text-slate-600">
                  Ao retornar para casa, lave e desinfete com água sanitária tudo o que teve contato com a água da enchente antes de reutilizar.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
