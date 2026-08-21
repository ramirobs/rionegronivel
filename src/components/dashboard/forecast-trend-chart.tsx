'use client';
import React from 'react';

import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Info, Sparkles, CloudRain, AlertTriangle } from 'lucide-react';
import type { CombinedChartPoint } from '@/app/api/weather-forecast/route';
import type { HydrologicalProjectionResult } from '@/lib/hydrological-forecast';

interface ForecastTrendChartProps {
  data: CombinedChartPoint[];
  projection: HydrologicalProjectionResult;
  title?: string;
  subtitle?: string;
  extraHeader?: React.ReactNode;
}

function LiveTickerDot(props: any) {
  const { cx, cy, payload, chartData } = props;
  const [liveValue, setLiveValue] = React.useState(payload.level);

  React.useEffect(() => {
    const idx = chartData.findIndex((d: any) => d.dateFormatted === 'Agora');
    const nextPoint = chartData[idx + 1];
    
    if (!nextPoint) return;
    
    const diff = nextPoint.level - payload.level;
    const msPerUpdate = 100; // 10 ticks per second is very satisfying
    const diffPerUpdate = diff / (900000 / msPerUpdate); // 15 minutos = 900.000 ms
    
    const interval = setInterval(() => {
      setLiveValue((prev: number) => prev + diffPerUpdate);
    }, msPerUpdate);

    return () => clearInterval(interval);
  }, [payload.level, chartData]);

  const idx = chartData.findIndex((d: any) => d.dateFormatted === 'Agora');
  const nextPoint = chartData[idx + 1];
  const isRising = nextPoint && nextPoint.level > payload.level;
  const isFalling = nextPoint && nextPoint.level < payload.level;
  const arrow = isRising ? '▲' : isFalling ? '▼' : '';
  const arrowColor = isRising ? '#ef4444' : isFalling ? '#22c55e' : '#94a3b8';

  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="#3b82f6" opacity={0.6} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
      
      {/* Ticker HUD */}
      <g transform={`translate(${cx}, ${cy - 28})`}>
        <rect x={-36} y={-11} width={72} height={20} rx={10} fill="#0f172a" stroke="#334155" strokeWidth={1} opacity={0.9} />
        
        <text x={2} y={3} textAnchor="middle" fill="#f8fafc" fontSize={10} fontWeight={800} alignmentBaseline="middle" fontFamily="monospace">
          {liveValue.toFixed(5)}m
        </text>
        
        {arrow && (
          <text x={-26} y={3} textAnchor="middle" fill={arrowColor} fontSize={7} fontWeight={900} alignmentBaseline="middle">
            {arrow}
          </text>
        )}
      </g>
    </g>
  );
}

function TodayBadge(props: { viewBox?: { x?: number; y?: number } }) {
  const x = props.viewBox?.x ?? 0;
  return (
    <g transform={`translate(${x}, 8)`}>
      <rect
        x={-44}
        y={0}
        width={88}
        height={20}
        rx={10}
        fill="#2563eb"
        stroke="#ffffff"
        strokeWidth={2}
      />
      <text
        x={0}
        y={14}
        textAnchor="middle"
        fill="#ffffff"
        fontSize={10}
        fontWeight={800}
      >
        Hoje (Agora)
      </text>
    </g>
  );
}

export default function ForecastTrendChart({ data, projection, title, subtitle, extraHeader }: ForecastTrendChartProps) {
  const trend = projection.overallTrend;
  const isRising = trend.direction === 'rising';
  const isFalling = trend.direction === 'falling';

  // Encontra a data de hoje para a linha vertical divisória
  const todayPoint = data.find((d) => d.isToday) || data[Math.floor(data.length / 2)];
  const todayDateFormatted = todayPoint?.dateFormatted || '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Sparkles className="h-4 w-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {title || 'Previsão de Nível & Tendência (Próximos 7 Dias)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            {subtitle || 'Integração do nível observado com previsão meteorológica do Open-Meteo'}
          </p>
        </div>

        {/* Lado Direito do Cabeçalho */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-center">
          {extraHeader && (
            <div className="mr-0 sm:mr-2">
              {extraHeader}
            </div>
          )}

          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black shadow-2xs ${
              isRising
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : isFalling
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            {isRising && <TrendingUp className="h-4 w-4" />}
            {isFalling && <TrendingDown className="h-4 w-4" />}
            {!isRising && !isFalling && <Minus className="h-4 w-4" />}
            <span>{trend.label}</span>
          </div>

          {projection.overallFloodProbability >= 15 && (
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border ${
                projection.overallFloodProbability >= 40
                  ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{projection.overallFloodProbability}% Risco Enchente</span>
            </div>
          )}
        </div>
      </div>

      {/* Resumo Rápido da Tendência em Linguagem Natural */}
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-700">
        <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="font-medium leading-relaxed">
          <strong className="text-slate-900 font-bold">Diagnóstico do Modelo: </strong>
          {trend.summary}
          {isRising && trend.maxProjectedLevel && (
            <span className="text-rose-700 font-bold ml-1">
              (Nível máximo estimado em {trend.maxProjectedLevel.toFixed(2)}m).
            </span>
          )}
        </p>
      </div>

      {/* Gráfico Recharts */}
      <div className="w-full h-[360px] sm:h-[400px] min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 35, right: 12, left: -15, bottom: 0 }}>
            <defs>
              {/* Gradiente para área de incerteza da previsão */}
              <linearGradient id="forecastUncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.05} />
              </linearGradient>
              {/* Gradiente para área observada */}
              <linearGradient id="observedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="dateFormatted"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              dy={8}
            />

            {/* Eixo Y da Esquerda: Nível em metros */}
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              unit="m"
            />

            {/* Eixo Y da Direita: Chuva em mm */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit="mm"
              domain={[0, (dataMax: number) => Math.max(50, Math.ceil(dataMax * 1.5))]}
            />

            {/* Tooltip Interativo */}
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const point = payload[0]?.payload as CombinedChartPoint;
                if (!point) return null;

                const isPointObserved = point.isObserved && !point.isToday;
                const isPointToday = point.isToday;

                return (
                  <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg text-xs space-y-1.5 min-w-[200px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-900">
                        {label} {point.dayOfWeek ? `(${point.dayOfWeek})` : ''}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isPointToday
                            ? 'bg-blue-600 text-white'
                            : isPointObserved
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {isPointToday ? 'Agora' : isPointObserved ? 'Observado' : 'Previsão'}
                      </span>
                    </div>

                    {/* Nível do Rio */}
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold">Nível do Rio:</span>
                      <span className="font-black text-blue-700 text-sm">
                        {(point.expectedLevel ?? point.observedLevel ?? point.level ?? 0).toFixed(2)} m
                      </span>
                    </div>

                    {/* Margem de Incerteza (se previsão) */}
                    {point.isForecast && !point.isToday && point.minLevel && point.maxLevel && (
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Faixa provável:</span>
                        <span className="font-semibold text-slate-700">
                          {point.minLevel.toFixed(2)}m a {point.maxLevel.toFixed(2)}m
                        </span>
                      </div>
                    )}

                    {/* Chuva */}
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-semibold flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5 text-sky-500" /> Chuva:
                      </span>
                      <span className="font-bold text-sky-600">
                        {(point.rain ?? 0).toFixed(1)} mm
                      </span>
                    </div>

                    {/* Probabilidade de Enchente */}
                    {point.floodProbability !== undefined && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="font-semibold text-slate-600">Risco de Enchente:</span>
                        <span
                          className={`font-black ${
                            point.floodProbability >= 40
                              ? 'text-rose-600'
                              : point.floodProbability >= 15
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {point.floodProbability}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Linha Divisória de "Hoje / Tempo Real" */}
            {todayDateFormatted && (
              <ReferenceLine
                yAxisId="left"
                x={todayDateFormatted}
                stroke="#2563eb"
                strokeWidth={2}
                strokeDasharray="4 4"
                label={<TodayBadge />}
              />
            )}

            {/* Zonas de Perigo (Reference Areas) */}
            <ReferenceArea
              yAxisId="left"
              y1={6}
              y2={7}
              fill="#f97316"
              fillOpacity={0.05}
            />
            <ReferenceArea
              yAxisId="left"
              y1={7}
              y2={15} // Teto do gráfico
              fill="#ef4444"
              fillOpacity={0.08}
            />

            {/* Linhas de Referência de Risco da Defesa Civil */}
            <ReferenceLine
              yAxisId="left"
              y={5}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{
                position: 'insideTopLeft',
                value: 'Atenção (5m)',
                fill: '#d97706',
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              yAxisId="left"
              y={6}
              stroke="#f97316"
              strokeDasharray="3 3"
              label={{
                position: 'insideTopLeft',
                value: 'Alerta (6m)',
                fill: '#ea580c',
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <ReferenceLine
              yAxisId="left"
              y={7}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                position: 'insideTopLeft',
                value: 'Emergência (7m)',
                fill: '#dc2626',
                fontSize: 10,
                fontWeight: 700,
              }}
            />

            {/* Barras de Chuva Prevista (Eixo Direito) */}
            <Bar
              yAxisId="right"
              dataKey="rain"
              name="Chuva Diária (mm)"
              barSize={16}
              fill="#7dd3fc"
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />

            {/* Área Sombreada da Faixa de Incerteza (Min a Max) */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="maxLevel"
              name="Cenário Máximo"
              stroke="transparent"
              fill="url(#forecastUncertaintyGrad)"
              isAnimationActive={true}
            />

            {/* Curva Histórica Observada */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="observedLevel"
              name="Nível Observado (m)"
              stroke="#0284c7"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return <g key={props.key || Math.random()} />;
                if (payload.dateFormatted === 'Agora') return <g key={props.key || 'agora'} />; // Deixa pro expectedLevel desenhar o Agora
                if (data.length <= 30) return <circle key={props.key || Math.random()} cx={cx} cy={cy} r={4} fill="#0284c7" stroke="#ffffff" strokeWidth={2} />;
                return <g key={props.key || Math.random()} />;
              }}
              activeDot={(props: any) => {
                if (props.payload.observedLevel == null) return <g />;
                return <circle cx={props.cx} cy={props.cy} r={6} fill="#0284c7" stroke="#ffffff" strokeWidth={2} />;
              }}
              connectNulls={true}
            />

            {/* Curva de Projeção Futura */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="expectedLevel"
              name="Nível Projetado (m)"
              stroke="#2563eb"
              strokeWidth={3}
              strokeDasharray="6 4"
              dot={(props: any) => {
                const { cx, cy, payload, key } = props;
                if (!cx || !cy) return <g key={key || Math.random()} />;
                if (payload.dateFormatted === 'Agora') {
                  return (
                    <g key={key || 'agora'}>
                      <circle cx={cx} cy={cy} r={12} fill="#3b82f6" opacity={0.6} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                      <circle cx={cx} cy={cy} r={5} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />
                    </g>
                  );
                }
                if (data.length <= 30) return <circle key={key || Math.random()} cx={cx} cy={cy} r={4} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />;
                return <g key={key || Math.random()} />;
              }}
              activeDot={(props: any) => {
                if (props.payload.expectedLevel == null) return <g />;
                return <circle cx={props.cx} cy={props.cy} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={2} />;
              }}
              connectNulls={true}
            />

            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '11px', fontWeight: 600 }}
              iconType="circle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda Explicativa Inferior */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 inline-block rounded-full" /> Nível Medido
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-600 inline-block" /> Nível Projetado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-sky-200 inline-block rounded-xs" /> Faixa de Incerteza
          </span>
        </div>
        <span className="text-slate-400">Modelo Calibrado com Open-Meteo & ANA</span>
      </div>
    </div>
  );
}
