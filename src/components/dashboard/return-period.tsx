'use client';

import { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  MapPin,
  Car,
  Clock,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { calculateExceedanceProbability, returnPeriod, type GumbelParameters } from '@/lib/statistics';
import { CRITICAL_POINTS } from '@/data/flood-map-data';

interface ReturnPeriodProps {
  table: { years: number; level: number; probability: number }[];
  annualMaxima: { year: number; maxLevel: number }[];
  gumbelParams?: GumbelParameters;
}

// Catálogo das Maiores Cheias Documentadas de RioMafra
const TOP_HISTORICAL_FLOODS = [
  { rank: '1º', year: 1983, date: '13/07/1983', level: 14.57, tr: '~50-100 anos', desc: 'Maior enchente da história. Isolamento total das duas cidades e inundação generalizada.' },
  { rank: '2º', year: 1992, date: '02/06/1992', level: 14.39, tr: '~35 anos', desc: 'Segunda maior cheia documentada. Praça João Pessoa e comércios submersos.' },
  { rank: '3º', year: 2023, date: '15/10/2023', level: 14.00, tr: '~25 anos', desc: 'Maior inundação recente do século XXI. Milhares de famílias desabrigadas.' },
  { rank: '4º', year: 2014, date: '09/06/2014', level: 13.68, tr: '~20 anos', desc: 'Inundação severa no inverno com bloqueio total das pontes urbanas.' },
  { rank: '5º', year: 1984, date: '10/08/1984', level: 10.08, tr: '~8 anos', desc: 'Cheia expressiva após o marco histórico de 1983.' },
];

const PRESET_BENCHMARKS = [
  { label: 'Normalidade', level: 4.85, tag: 'Leito Regular' },
  { label: 'Passa Três', level: 6.50, tag: 'Início Várzeas' },
  { label: 'Cota de Enchente', level: 7.00, tag: 'Emergência (7m)' },
  { label: 'Ponte Metálica', level: 8.50, tag: 'Ponte Interditada' },
  { label: 'Centro de Mafra', level: 8.80, tag: 'Av. Heyse' },
  { label: 'Centro Rio Negro', level: 10.20, tag: 'Praça Central' },
  { label: 'Cheia 2014', level: 13.68, tag: '13,68 m' },
  { label: 'Cheia 2023', level: 14.00, tag: '14,00 m' },
  { label: 'Recorde 1983', level: 14.57, tag: '14,57 m' },
];

export default function ReturnPeriod({
  table,
  annualMaxima,
  gumbelParams = { location: 6.82, scale: 2.14 },
}: ReturnPeriodProps) {
  // Estado do nível simulado interativamente (padrão inicial: 7.0m cota de enchente)
  const [simulatedLevel, setSimulatedLevel] = useState<number>(7.00);

  // Cálculos dinâmicos via Distribuição de Gumbel
  const exceedanceProb = useMemo(() => {
    return calculateExceedanceProbability(simulatedLevel, gumbelParams) * 100;
  }, [simulatedLevel, gumbelParams]);

  const recurrenceYears = useMemo(() => {
    return returnPeriod(simulatedLevel, gumbelParams);
  }, [simulatedLevel, gumbelParams]);

  // Diagnóstico de Pontes e Mobilidade
  const bridgesStatus = useMemo(() => {
    return [
      {
        name: 'Ponte Metálica (Dr. Diniz)',
        threshold: 8.50,
        isBlocked: simulatedLevel >= 8.50,
        type: 'Principal ligação urbana',
      },
      {
        name: 'Ponte Cel. Severiano Maia',
        threshold: 10.50,
        isBlocked: simulatedLevel >= 10.50,
        type: 'Ligação Estação Nova / Vila Nova',
      },
      {
        name: 'Ponte Rodrigo Ajuz (Centro)',
        threshold: 11.00,
        isBlocked: simulatedLevel >= 11.00,
        type: 'Ponte alta da Rua Cel. Ary Rauen',
      },
      {
        name: 'Ponte Rodoviária BR-116',
        threshold: 15.00,
        isBlocked: simulatedLevel >= 15.00,
        type: 'Rodovia Federal (Passagem Livre)',
      },
    ];
  }, [simulatedLevel]);

  // Bairros e pontos urbanos afetados na cota selecionada
  const affectedLandmarks = useMemo(() => {
    return CRITICAL_POINTS.filter((p) => p.type === 'neighborhood' && simulatedLevel >= p.floodThreshold);
  }, [simulatedLevel]);

  // Severidade da cota simulada
  const severityConfig = useMemo(() => {
    if (simulatedLevel >= 11.0) {
      return {
        label: 'Cheia Catastrófica',
        badgeClass: 'bg-rose-600 text-white border-rose-700 animate-pulse',
        boxBg: 'bg-rose-50/90 border-rose-300',
        textColor: 'text-rose-700',
        icon: ShieldAlert,
        summary: 'Inundação generalizada dos centros urbanos de Rio Negro e Mafra. Isolamento viário severo.',
      };
    }
    if (simulatedLevel >= 7.0) {
      return {
        label: 'Enchente / Emergência',
        badgeClass: 'bg-red-500 text-white border-red-600',
        boxBg: 'bg-red-50/80 border-red-200',
        textColor: 'text-red-700',
        icon: AlertTriangle,
        summary: 'Transbordamento do leito com invasão de residências ribeirinhas e bloqueio de vias baixas.',
      };
    }
    if (simulatedLevel >= 6.0) {
      return {
        label: 'Alerta de Inundação',
        badgeClass: 'bg-orange-500 text-white border-orange-600',
        boxBg: 'bg-orange-50/80 border-orange-200',
        textColor: 'text-orange-700',
        icon: AlertTriangle,
        summary: 'Água invade várzeas e primeiras ruas baixas (Passa Três e Rua São João).',
      };
    }
    if (simulatedLevel >= 5.0) {
      return {
        label: 'Atenção / Rio Elevado',
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        boxBg: 'bg-amber-50/80 border-amber-200',
        textColor: 'text-amber-700',
        icon: HelpCircle,
        summary: 'Nível alto nas margens, mas ainda contido na calha natural.',
      };
    }
    return {
      label: 'Normalidade',
      badgeClass: 'bg-emerald-500 text-white border-emerald-600',
      boxBg: 'bg-emerald-50/80 border-emerald-200',
      textColor: 'text-emerald-700',
      icon: ShieldCheck,
      summary: 'Rio em cota segura de estiagem/regularidade.',
    };
  }, [simulatedLevel]);

  const SeverityIcon = severityConfig.icon;

  const fittedLineData = table
    .map((t) => ({
      x: t.years,
      y: t.level,
    }))
    .sort((a, b) => a.x - b.x);

  const getFriendlyLabel = (years: number) => {
    switch (years) {
      case 2:
        return 'Cheia Comum';
      case 5:
        return 'Cheia Forte';
      case 10:
        return 'Enchente Severa';
      case 25:
        return 'Grande Cheia (Ex: 2023)';
      case 50:
        return 'Cheia Muito Rara';
      case 100:
        return 'Cheia Centenária';
      default:
        return `${years} anos`;
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SIMULADOR INTERATIVO DE COTAS E PROBABILIDADE (GUMBEL)                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Simulador & Comparador de Inundações de RioMafra
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Arraste a barra para simular qualquer nível e ver o impacto real na cidade e a probabilidade matemática.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200 shrink-0">
            <History className="h-3.5 w-3.5 text-blue-600" />
            <span>Modelo calibrado: 1930–2025 ({annualMaxima.length || 96} anos)</span>
          </div>
        </div>

        {/* Barra Deslizante (Slider) de Nível */}
        <div className="space-y-3 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nível do Rio Simulado:
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-blue-700">
                {simulatedLevel.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-slate-400">metros</span>
            </div>
          </div>

          <input
            type="range"
            min="4.00"
            max="15.00"
            step="0.05"
            value={simulatedLevel}
            onChange={(e) => setSimulatedLevel(parseFloat(e.target.value))}
            className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />

          <div className="flex justify-between text-[11px] font-bold text-slate-400 px-1">
            <span>4.0m (Seco)</span>
            <span>6.0m (Atenção)</span>
            <span>7.0m (Enchente)</span>
            <span>10.0m (Grave)</span>
            <span>14.57m (Recorde 1983)</span>
          </div>

          {/* Atalhos Rápidos para Marcos Conhecidos */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Selecione um marco histórico para simular:
            </span>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {PRESET_BENCHMARKS.map((preset) => {
                const isActive = Math.abs(simulatedLevel - preset.level) < 0.04;
                return (
                  <button
                    key={preset.label}
                    onClick={() => setSimulatedLevel(preset.level)}
                    type="button"
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs scale-[1.03]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{preset.label}</span>
                    <span className="ml-1 opacity-75 font-normal">({preset.level.toFixed(2)}m)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card Dinâmico de Diagnóstico da Cota Simulada */}
        <div className={`p-5 rounded-2xl border ${severityConfig.boxBg} transition-all space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
            <div className="flex items-center gap-2.5">
              <SeverityIcon className={`h-6 w-6 ${severityConfig.textColor}`} />
              <h4 className="text-base sm:text-lg font-black text-slate-900">
                Diagnóstico na Cota de {simulatedLevel.toFixed(2)} m
              </h4>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-black border ${severityConfig.badgeClass}`}>
              {severityConfig.label}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
            {severityConfig.summary}
          </p>

          {/* Métricas de Probabilidade e Recorrência (Gumbel) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            <div className="bg-white/95 p-3.5 rounded-xl border border-black/5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Probabilidade Anual</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {exceedanceProb >= 99 ? '> 99' : exceedanceProb < 0.1 ? '< 0.1' : exceedanceProb.toFixed(1)}
                </span>
                <span className="text-xs font-bold text-slate-500">% de chance a cada ano</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Risco estatístico de ser atingido em qualquer ano.
              </p>
            </div>

            <div className="bg-white/95 p-3.5 rounded-xl border border-black/5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Tempo de Recorrência ($T_R$)</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  ~{recurrenceYears >= 100 ? '100+' : recurrenceYears <= 1.2 ? '1 a 2' : recurrenceYears.toFixed(0)}
                </span>
                <span className="text-xs font-bold text-slate-500">anos</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ocorre em média uma vez a cada intervalo de anos.
              </p>
            </div>

            <div className="bg-white/95 p-3.5 rounded-xl border border-black/5 shadow-2xs sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <Car className="h-4 w-4 text-purple-500" />
                <span>Pontes Intermunicipais</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  {bridgesStatus.filter((b) => b.isBlocked).length} de {bridgesStatus.length}
                </span>
                <span className="text-xs font-bold text-slate-500">pontes bloqueadas</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Impacto direto no tráfego entre Rio Negro e Mafra.
              </p>
            </div>
          </div>

          {/* Status Detalhado das Pontes */}
          <div className="bg-white/90 p-4 rounded-xl border border-black/5 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Condição das Ligações Viárias (Pontes):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bridgesStatus.map((b) => (
                <div
                  key={b.name}
                  className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                    b.isBlocked
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {b.isBlocked ? (
                      <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="font-bold">{b.name}</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/80 border border-black/5 shrink-0">
                    {b.isBlocked ? `Submersa (cota ${b.threshold.toFixed(1)}m)` : 'Livre'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bairros e Ruas Atingidos */}
          <div className="bg-white/90 p-4 rounded-xl border border-black/5 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Bairros e Ruas com Inundação nesta cota ({affectedLandmarks.length} áreas):
            </span>
            {affectedLandmarks.length === 0 ? (
              <p className="text-xs text-emerald-700 font-medium">
                ✅ Nenhuma área residencial ou comercial atingida nesta cota.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {affectedLandmarks.map((point) => (
                  <span
                    key={point.id}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg"
                  >
                    <MapPin className="h-3 w-3 text-rose-600" />
                    {point.name} <span className="opacity-70 font-normal">({point.city})</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RANKING HISTÓRICO: TOP 5 MAIORES CHEIAS DE RIOMAFRA                    */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-600" />
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            As 5 Maiores Inundações da História de Rio Negro e Mafra
          </h3>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          Registros oficiais consolidados das cotas máximas registradas pelas estações da ANA/CPRM desde 1930:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {TOP_HISTORICAL_FLOODS.map((flood) => (
            <div
              key={flood.year}
              onClick={() => {
                setSimulatedLevel(flood.level);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer space-y-1.5 flex flex-col justify-between"
              title="Clique para simular este evento acima"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                    {flood.rank} Maior
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {flood.date}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900">
                  {flood.level.toFixed(2)} m
                </div>
                <div className="text-[11px] font-bold text-blue-600">
                  Ano {flood.year} ({flood.tr})
                </div>
              </div>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-2">
                {flood.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABELA ESTATÍSTICA DE RETORNO (GUMBEL) & GRÁFICO                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Tabela de Períodos de Retorno (Método de Gumbel)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Distribuição de Extremos Tipo I ajustada com base nas máximas anuais consolidadas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Table Section */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="text-[11px] font-bold uppercase bg-slate-100/90 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tipo de Cheia</th>
                  <th className="px-4 py-3">Altura Prevista</th>
                  <th className="px-4 py-3">Chance a Cada Ano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {table.map((row, i) => {
                  const isExtreme = row.level >= 10;
                  const isHigh = row.level >= 7 && row.level < 10;
                  const badgeColor = isExtreme
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : isHigh
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const isNearby = Math.abs(simulatedLevel - row.level) < 1.0;

                  return (
                    <tr
                      key={i}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isNearby ? 'bg-blue-50/40 font-bold' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold">{getFriendlyLabel(row.years)}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            A cada ~{row.years} anos
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {row.level.toFixed(2)} m
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${badgeColor}`}
                        >
                          {row.probability.toFixed(1)}% ao ano
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Chart Section */}
          <div className="h-[280px] sm:h-[320px] flex flex-col justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 15, right: 15, bottom: 15, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="Intervalo em Anos"
                  unit=" anos"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={[0, 100]}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="Nível"
                  unit="m"
                  stroke="#94a3b8"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  domain={['auto', 'auto']}
                />
                <ZAxis range={[60, 60]} />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    color: '#0f172a',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Scatter
                  name="Curva Gumbel"
                  data={fittedLineData}
                  fill="#0284c7"
                  line={{ stroke: '#0284c7', strokeWidth: 2.5 }}
                  shape="circle"
                />
                <ReferenceLine
                  y={simulatedLevel}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    position: 'insideTopLeft',
                    value: `Simulado: ${simulatedLevel.toFixed(2)}m`,
                    fill: '#dc2626',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
