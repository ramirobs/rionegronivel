'use client';

import { CloudRain, Droplets, Calendar, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import type { WeatherForecastResponse } from '@/lib/weather-api';
import type { HydrologicalProjectionResult, ProjectedDay } from '@/lib/hydrological-forecast';

interface ForecastDailyCardsProps {
  weather: WeatherForecastResponse;
  projection: HydrologicalProjectionResult;
}

export default function ForecastDailyCards({ weather, projection }: ForecastDailyCardsProps) {
  const getRiskBadge = (prob: number) => {
    if (prob >= 70) {
      return {
        label: 'CRÍTICO',
        color: 'bg-rose-600 text-white border-rose-700 font-black animate-pulse',
        icon: ShieldAlert,
        text: 'Enchente muito provável',
      };
    }
    if (prob >= 40) {
      return {
        label: 'ALTO',
        color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        icon: AlertTriangle,
        text: 'Risco de transbordamento',
      };
    }
    if (prob >= 15) {
      return {
        label: 'ATENÇÃO',
        color: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        icon: AlertTriangle,
        text: 'Rio em elevação',
      };
    }
    return {
      label: 'BAIXO',
      color: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',
      icon: ShieldCheck,
      text: 'Sem risco iminente',
    };
  };

  return (
    <div className="space-y-4">
      {/* Resumo Geral de Previsão */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs text-sky-300">
            <CloudRain className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                Previsão Meteorológica da Bacia
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">
              Total Previsto: {weather.totalForecastRain7Days.toFixed(1)} mm nos próximos 7 dias
            </h4>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {weather.maxRainDay.precipitation > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-medium border border-white/10">
              Maior volume:{' '}
              <strong className="text-sky-300 font-bold">
                {weather.maxRainDay.precipitation.toFixed(1)} mm
              </strong>{' '}
              ({weather.daily.find((d) => d.date === weather.maxRainDay.date)?.dayOfWeek || ''})
            </div>
          )}

          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
              projection.floodRiskCategory === 'critico'
                ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                : projection.floodRiskCategory === 'alto'
                ? 'bg-orange-500 text-white border-orange-400'
                : projection.floodRiskCategory === 'moderado'
                ? 'bg-amber-400 text-slate-900 border-amber-300'
                : 'bg-emerald-500 text-white border-emerald-400'
            }`}
          >
            <span>Risco Geral: {projection.floodRiskCategory.toUpperCase()} ({projection.overallFloodProbability}%)</span>
          </div>
        </div>
      </div>

      {/* Grade de 7 Dias de Previsão */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
        {projection.projectedDays.map((day: ProjectedDay, index: number) => {
          const weatherDay = weather.daily[index] || {};
          const riskBadge = getRiskBadge(day.floodProbability);
          const RiskIcon = riskBadge.icon;
          const isToday = index === 0;

          return (
            <div
              key={day.date}
              className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all bg-white hover:shadow-md ${
                day.floodProbability >= 40
                  ? 'border-rose-300 ring-2 ring-rose-200/50'
                  : day.floodProbability >= 15
                  ? 'border-amber-300'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Header do Dia */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                  <div>
                    <span className="text-xs font-black text-slate-900 block">
                      {isToday ? 'Hoje' : index === 1 ? 'Amanhã' : day.dayOfWeek}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {day.dateFormatted}
                    </span>
                  </div>
                  <span className="text-2xl select-none" title={day.weatherDescription}>
                    {day.weatherIcon}
                  </span>
                </div>

                {/* Descrição do Clima & Temperatura */}
                <div className="text-[11px] text-slate-600 font-medium line-clamp-1 mb-2">
                  {day.weatherDescription}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-800">
                    {weatherDay.tempMax ?? '--'}°
                  </span>
                  <span className="text-slate-400 font-medium">
                    {weatherDay.tempMin ?? '--'}°
                  </span>
                </div>

                {/* Chuva Prevista */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1 font-medium">
                      <Droplets className="h-3.5 w-3.5 text-sky-500" /> Chuva:
                    </span>
                    <span className="font-black text-slate-900">
                      {day.forecastRain.toFixed(1)} mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Probab.:</span>
                    <span className="font-bold text-sky-600">
                      {day.rainProbability}%
                    </span>
                  </div>
                </div>

                {/* Nível Estimado do Rio */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nível Estimado
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-black text-blue-700">
                      {day.expectedLevel.toFixed(2)}m
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    ({day.minLevel.toFixed(1)}m - {day.maxLevel.toFixed(1)}m)
                  </span>
                </div>
              </div>

              {/* Badge de Probabilidade de Enchente */}
              <div className="pt-1">
                <div
                  className={`w-full py-1.5 px-2 rounded-xl text-center border text-[11px] flex items-center justify-center gap-1 ${riskBadge.color}`}
                >
                  <RiskIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{day.floodProbability}% Enchente</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
