'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { HelpCircle, Sparkles } from 'lucide-react';

interface ReturnPeriodProps {
  table: { years: number; level: number; probability: number }[];
  annualMaxima: { year: number; maxLevel: number }[];
}

export default function ReturnPeriod({ table, annualMaxima }: ReturnPeriodProps) {
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
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Probabilidade de Enchentes (Chances Históricas)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Com que frequência ocorrem cheias de cada tamanho em Rio Negro e Mafra?
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold border border-slate-200">
          <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
          <span>Baseado em {annualMaxima.length ? `${annualMaxima.length} anos` : 'décadas'} de registros da ANA</span>
        </div>
      </div>

      {/* Explicação simples para cidadão */}
      <div className="mb-5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-slate-700">
        <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong className="text-slate-900 font-bold">Como ler esta tabela: </strong>
          Uma cheia de <strong>7,0 metros</strong> tem cerca de <strong>50% de chance</strong> de acontecer em qualquer ano (ocorre em média a cada 2 anos). Já uma cheia devastadora de <strong>10,8 metros</strong> (como em 2023) tem apenas <strong>4% de chance anual</strong> (em média a cada 25 anos).
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

                return (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
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
                name="Curva de Previsão"
                data={fittedLineData}
                fill="#0284c7"
                line={{ stroke: '#0284c7', strokeWidth: 2.5 }}
                shape="circle"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
