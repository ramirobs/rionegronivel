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
  MapPin,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  Trophy,
} from 'lucide-react';
import { calculateExceedanceProbability, returnPeriod, type GumbelParameters } from '@/lib/statistics';
import { CRITICAL_POINTS } from '@/data/flood-map-data';

interface ReturnPeriodProps {
  table: { years: number; level: number; probability: number }[];
  annualMaxima: { year: number; maxLevel: number }[];
  gumbelParams?: GumbelParameters;
}

const TOP_HISTORICAL_FLOODS = [
  { rank: '1º', year: 1983, date: '13/07/1983', level: 14.57, label: '1983 (14,57m)' },
  { rank: '2º', year: 1992, date: '02/06/1992', level: 14.39, label: '1992 (14,39m)' },
  { rank: '3º', year: 2023, date: '15/10/2023', level: 14.00, label: '2023 (14,00m)' },
  { rank: '4º', year: 2014, date: '09/06/2014', level: 13.68, label: '2014 (13,68m)' },
  { rank: '5º', year: 1984, date: '10/08/1984', level: 10.08, label: '1984 (10,08m)' },
];

const PRESET_BENCHMARKS = [
  { label: 'Normal', level: 4.85 },
  { label: 'Passa Três', level: 6.50 },
  { label: 'Cota 7m', level: 7.00 },
  { label: 'Pte. Metálica', level: 8.50 },
  { label: 'Centro Mafra', level: 8.80 },
  { label: 'Centro RN', level: 10.20 },
  { label: 'Cheia 2023', level: 14.00 },
  { label: 'Recorde 1983', level: 14.57 },
];

export default function ReturnPeriod({
  table,
  annualMaxima,
  gumbelParams = { location: 6.82, scale: 2.14 },
}: ReturnPeriodProps) {
  const [simulatedLevel, setSimulatedLevel] = useState<number>(7.00);

  const exceedanceProb = useMemo(() => {
    return calculateExceedanceProbability(simulatedLevel, gumbelParams) * 100;
  }, [simulatedLevel, gumbelParams]);

  const recurrenceYears = useMemo(() => {
    return returnPeriod(simulatedLevel, gumbelParams);
  }, [simulatedLevel, gumbelParams]);

  const bridgesStatus = useMemo(() => {
    return [
      { name: 'Pte. Metálica', threshold: 8.50, isBlocked: simulatedLevel >= 8.50 },
      { name: 'Pte. Severiano Maia', threshold: 10.50, isBlocked: simulatedLevel >= 10.50 },
      { name: 'Pte. Rodrigo Ajuz', threshold: 11.00, isBlocked: simulatedLevel >= 11.00 },
      { name: 'Pte. BR-116', threshold: 15.00, isBlocked: simulatedLevel >= 15.00 },
    ];
  }, [simulatedLevel]);

  const affectedLandmarks = useMemo(() => {
    return CRITICAL_POINTS.filter((p) => p.type === 'neighborhood' && simulatedLevel >= p.floodThreshold);
  }, [simulatedLevel]);

  const severityConfig = useMemo(() => {
    if (simulatedLevel >= 11.0) {
      return {
        label: 'Cheia Catastrófica',
        badgeClass: 'bg-rose-600 text-white border-rose-700',
        boxBg: 'bg-rose-50/90 border-rose-200',
        textColor: 'text-rose-700',
        icon: ShieldAlert,
        summary: 'Inundação generalizada dos centros urbanos de Rio Negro e Mafra.',
      };
    }
    if (simulatedLevel >= 7.0) {
      return {
        label: 'Enchente / Emergência',
        badgeClass: 'bg-red-500 text-white border-red-600',
        boxBg: 'bg-red-50/80 border-red-200',
        textColor: 'text-red-700',
        icon: AlertTriangle,
        summary: 'Transbordamento do leito com invasão de residências ribeirinhas.',
      };
    }
    if (simulatedLevel >= 6.0) {
      return {
        label: 'Alerta de Inundação',
        badgeClass: 'bg-orange-500 text-white border-orange-600',
        boxBg: 'bg-orange-50/80 border-orange-200',
        textColor: 'text-orange-700',
        icon: AlertTriangle,
        summary: 'Água invade várzeas e primeiras ruas baixas (Passa Três / São João).',
      };
    }
    if (simulatedLevel >= 5.0) {
      return {
        label: 'Atenção / Elevado',
        badgeClass: 'bg-amber-500 text-white border-amber-600',
        boxBg: 'bg-amber-50/80 border-amber-200',
        textColor: 'text-amber-700',
        icon: HelpCircle,
        summary: 'Nível alto nas margens, contido na calha natural.',
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
        return 'Grande Cheia';
      case 50:
        return 'Muito Rara';
      case 100:
        return 'Centenária';
      default:
        return `${years}a`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Simulador de Cotas & Probabilidade Histórica (Gumbel)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Arraste a barra para analisar o risco anual e o impacto urbano em RioMafra.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[11px] font-semibold border border-slate-200 self-start sm:self-auto shrink-0">
          <History className="h-3 w-3 text-blue-600" />
          <span>Série 1930–2025 ({annualMaxima.length || 96} anos)</span>
        </div>
      </div>

      {/* Grid 2 Colunas no Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ========================================================================= */}
        {/* COLUNA ESQUERDA (7/12): SIMULADOR, MÉTRICAS E IMPACTOS                    */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* Slider Compacto de Cota */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cota Simulada:
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-blue-700 leading-none">
                  {simulatedLevel.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">m</span>
              </div>
            </div>

            <input
              type="range"
              min="4.00"
              max="15.00"
              step="0.05"
              value={simulatedLevel}
              onChange={(e) => setSimulatedLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />

            {/* Presets em Pílulas Compactas */}
            <div className="flex flex-wrap gap-1 pt-1">
              {PRESET_BENCHMARKS.map((preset) => {
                const isActive = Math.abs(simulatedLevel - preset.level) < 0.04;
                return (
                  <button
                    key={preset.label}
                    onClick={() => setSimulatedLevel(preset.level)}
                    type="button"
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs scale-[1.02]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card Dinâmico de Diagnóstico & Estatísticas */}
          <div className={`p-3.5 rounded-xl border ${severityConfig.boxBg} space-y-2.5 transition-all`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <SeverityIcon className={`h-4 w-4 shrink-0 ${severityConfig.textColor}`} />
                <span className="text-xs font-bold text-slate-900 truncate">
                  {severityConfig.summary}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border shrink-0 ${severityConfig.badgeClass}`}>
                {severityConfig.label}
              </span>
            </div>

            {/* Métricas Compactas Lado a Lado */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/95 p-2.5 rounded-lg border border-black/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Chance ao Ano</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {exceedanceProb >= 99 ? '> 99' : exceedanceProb < 0.1 ? '< 0.1' : exceedanceProb.toFixed(1)}%
                </div>
              </div>

              <div className="bg-white/95 p-2.5 rounded-lg border border-black/5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span>Recorrência ($T_R$)</span>
                </div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  ~{recurrenceYears >= 100 ? '100+' : recurrenceYears <= 1.2 ? '1 a 2' : recurrenceYears.toFixed(0)} anos
                </div>
              </div>
            </div>

            {/* Pontes Intermunicipais (Grid 2x2 Compacto) */}
            <div className="bg-white/90 p-2.5 rounded-lg border border-black/5 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Pontes Intermunicipais:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {bridgesStatus.map((b) => (
                  <div
                    key={b.name}
                    className={`px-2 py-1 rounded text-[11px] font-bold flex items-center justify-between border ${
                      b.isBlocked
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    {b.isBlocked ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 ml-1" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bairros Atingidos */}
            <div className="bg-white/90 p-2.5 rounded-lg border border-black/5 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Bairros com Alagamento ({affectedLandmarks.length}):
              </span>
              {affectedLandmarks.length === 0 ? (
                <span className="text-[11px] text-emerald-700 font-medium block">
                  ✅ Nenhuma área residencial ou comercial atingida nesta cota.
                </span>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {affectedLandmarks.map((point) => (
                    <span
                      key={point.id}
                      className="inline-flex items-center gap-1 text-[10.5px] font-bold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md"
                    >
                      <MapPin className="h-2.5 w-2.5 text-rose-600" />
                      {point.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA DIREITA (5/12): GRÁFICO GUMBEL, TABELA E TOP CHEIAS              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          {/* Top 5 Cheias Históricas Clicáveis */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <Trophy className="h-3.5 w-3.5 text-purple-600" />
              <span>Maiores Cheias da História:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {TOP_HISTORICAL_FLOODS.map((f) => (
                <button
                  key={f.year}
                  onClick={() => setSimulatedLevel(f.level)}
                  className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-white text-slate-700 border border-slate-200 hover:border-purple-300 hover:text-purple-700 transition-colors cursor-pointer"
                >
                  <span className="text-purple-600 font-extrabold mr-1">{f.rank}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Gráfico Curva Gumbel Compacto */}
          <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Curva de Frequência de Extremos:
            </span>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    unit="a"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    domain={[0, 100]}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    unit="m"
                    stroke="#94a3b8"
                    tick={{ fill: '#64748b', fontSize: 9 }}
                    domain={['auto', 'auto']}
                  />
                  <ZAxis range={[30, 30]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem',
                      fontSize: '11px',
                      fontWeight: '600',
                      padding: '4px 8px',
                    }}
                  />
                  <Scatter
                    name="Gumbel"
                    data={fittedLineData}
                    fill="#0284c7"
                    line={{ stroke: '#0284c7', strokeWidth: 2 }}
                    shape="circle"
                  />
                  <ReferenceLine
                    y={simulatedLevel}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      position: 'insideTopLeft',
                      value: `${simulatedLevel.toFixed(1)}m`,
                      fill: '#dc2626',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Retorno Compacta */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-2.5 py-1.5">Cheia</th>
                  <th className="px-2.5 py-1.5">Altura</th>
                  <th className="px-2.5 py-1.5 text-right">Chance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-[11px]">
                {table.slice(0, 5).map((row, i) => {
                  const isNearby = Math.abs(simulatedLevel - row.level) < 1.0;
                  return (
                    <tr
                      key={i}
                      className={`hover:bg-slate-50 transition-colors ${
                        isNearby ? 'bg-blue-50/60 font-bold' : ''
                      }`}
                    >
                      <td className="px-2.5 py-1.5 text-slate-800">
                        {getFriendlyLabel(row.years)} (~{row.years}a)
                      </td>
                      <td className="px-2.5 py-1.5 font-black text-slate-900">
                        {row.level.toFixed(2)} m
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-bold text-blue-700">
                        {row.probability.toFixed(1)}% /ano
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
