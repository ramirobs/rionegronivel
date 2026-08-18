'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PrecipitationChartProps {
  data: { date: string; precipitation: number; accumulated: number }[];
}

export default function PrecipitationChart({ data }: PrecipitationChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col h-[380px] sm:h-[420px]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">Precipitação e Acumulado</h3>
          <p className="text-xs text-slate-500 font-medium">Volume diário e curva acumulada em mm</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 15, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="mm"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="mm"
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
            />
            <Legend
              wrapperStyle={{ paddingTop: '12px', fontSize: '12px', fontWeight: 600 }}
            />

            <Bar
              yAxisId="left"
              dataKey="precipitation"
              name="Chuva Diária (mm)"
              barSize={18}
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="accumulated"
              name="Acumulado (mm)"
              stroke="#0284c7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#0284c7', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
