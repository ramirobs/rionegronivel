'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface RiverLevelChartProps {
  data: { date: string; level: number }[];
  period: string;
}

export default function RiverLevelChart({ data, period }: RiverLevelChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-[380px] sm:h-[420px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Histórico de Nível</h3>
          <p className="text-xs text-slate-500 font-medium">Variação da cota em metros</p>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
          {period}
        </span>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLevelLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={8}
              tickFormatter={(val: string | number) => {
                try {
                  const d = new Date(val);
                  if (isNaN(d.getTime())) return String(val);
                  return d.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  });
                } catch {
                  return String(val);
                }
              }}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              unit="m"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                color: '#0f172a',
                fontSize: '12px',
                fontWeight: '600',
              }}
              itemStyle={{ color: '#0284c7' }}
              labelFormatter={(label: React.ReactNode) => {
                if (label === null || label === undefined) return '';
                try {
                  const d = new Date(String(label));
                  if (isNaN(d.getTime())) return String(label);
                  return d.toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                } catch {
                  return String(label);
                }
              }}
            />

            {/* Linhas de Referência de Risco */}
            <ReferenceLine
              y={5}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                position: 'insideTopLeft',
                value: 'Atenção (5m)',
                fill: '#d97706',
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              y={6}
              stroke="#f97316"
              strokeDasharray="4 4"
              label={{
                position: 'insideTopLeft',
                value: 'Alerta (6m)',
                fill: '#ea580c',
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              y={7}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                position: 'insideTopLeft',
                value: 'Emergência (7m)',
                fill: '#dc2626',
                fontSize: 11,
                fontWeight: 700,
              }}
            />

            <Area
              type="monotone"
              dataKey="level"
              name="Nível do Rio"
              stroke="#0284c7"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorLevelLight)"
              activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
