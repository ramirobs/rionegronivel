'use client';

import React, { useMemo } from 'react';
import { CRITICAL_POINTS } from '@/data/flood-map-data';
import type { CombinedChartPoint } from '@/app/api/weather-forecast/route';
import { ShieldAlert, CheckCircle2, Clock, MapPin, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ImpactTimelineProps {
  hourlyData: CombinedChartPoint[];
  dailyData: CombinedChartPoint[];
  currentLevel: number;
}

interface ImpactEvent {
  id: string;
  pointId: string;
  pointName: string;
  type: 'bridge' | 'neighborhood' | 'station' | 'shelter';
  eventType: 'flood' | 'safe';
  threshold: number;
  expectedLevel: number;
  date: string;
  dateFormatted: string;
  timestamp: number;
}

export default function ImpactTimeline({ hourlyData, dailyData, currentLevel }: ImpactTimelineProps) {
  // Constrói a linha do tempo cronológica cruzando com os pontos críticos
  const timelineEvents = useMemo(() => {
    // 1. Une os dois arrays ignorando dias que já estejam cobertos pelo horário
    const merged = [...hourlyData];
    
    // Encontra o último timestamp do gráfico horário para não sobrepor
    let lastHourlyDate = 0;
    if (hourlyData.length > 0) {
      lastHourlyDate = new Date(hourlyData[hourlyData.length - 1].date).getTime();
    }

    for (const d of dailyData) {
      if (!d.isForecast) continue;
      const dTime = new Date(d.date).getTime();
      // Se for no mesmo dia do último ponto horário, ignora. Apenas futuro a longo prazo.
      if (dTime > lastHourlyDate + 1000 * 60 * 60 * 12) { 
        merged.push(d);
      }
    }

    // 2. Avalia o estado inicial
    const stateMap = new Map<string, boolean>();
    for (const cp of CRITICAL_POINTS) {
      if (cp.type === 'station') continue; // Estação ANA não é um impacto local
      stateMap.set(cp.id, currentLevel >= cp.floodThreshold);
    }

    const events: ImpactEvent[] = [];

    // 3. Varre a previsão
    for (const point of merged) {
      const level = point.expectedLevel || point.level;
      if (level === undefined) continue;

      const ptTimestamp = new Date(point.date).getTime();

      for (const cp of CRITICAL_POINTS) {
        if (cp.type === 'station') continue;

        const wasFlooded = stateMap.get(cp.id) || false;
        const isFlooded = level >= cp.floodThreshold;

        // Se mudou de estado (inundou ou liberou)
        if (isFlooded !== wasFlooded) {
          events.push({
            id: `${cp.id}-${ptTimestamp}`,
            pointId: cp.id,
            pointName: cp.name,
            type: cp.type,
            eventType: isFlooded ? 'flood' : 'safe',
            threshold: cp.floodThreshold,
            expectedLevel: level,
            date: point.date,
            dateFormatted: point.dateFormatted,
            timestamp: ptTimestamp,
          });
          stateMap.set(cp.id, isFlooded);
        }
      }
    }

    return events;
  }, [hourlyData, dailyData, currentLevel]);

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-200 p-4 sm:p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-rose-100">
          <ShieldAlert className="h-5 w-5 text-rose-600" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">Timeline de Impactos Previstos</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Aviso automático de quais ruas e pontes serão afetadas</p>
        </div>
      </div>

      <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-7">
        {timelineEvents.map((ev) => {
          // Formata a data bonitinha
          const d = new Date(ev.date);
          const hasTime = ev.date.includes('T');
          
          let dateText = '';
          if (hasTime) {
            const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
            const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            dateText = `${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)} às ${timeStr}`;
          } else {
            const dayStr = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', '');
            dateText = `Dia ${dayStr.charAt(0).toUpperCase() + dayStr.slice(1)} (Previsão de Longo Prazo)`;
          }

          const isFlood = ev.eventType === 'flood';

          return (
            <div key={ev.id} className="relative">
              {/* Ponto da linha do tempo */}
              <span 
                className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ring-4 ${
                  isFlood ? 'bg-rose-500 ring-rose-50' : 'bg-emerald-500 ring-emerald-50'
                }`} 
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {dateText}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {ev.pointName}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium ml-5 mt-0.5">
                    Cota da via: {ev.threshold.toFixed(2)}m
                  </p>
                </div>

                <div className={`px-3 py-2.5 rounded-xl border flex items-center gap-2.5 self-start sm:self-center transition-colors ${
                  isFlood 
                    ? 'bg-rose-50/80 border-rose-100 text-rose-800' 
                    : 'bg-emerald-50/80 border-emerald-100 text-emerald-800'
                }`}>
                  <div className={`p-1.5 rounded-lg ${isFlood ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                    {isFlood ? <ArrowUpRight className="h-3.5 w-3.5 text-rose-600" /> : <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wide">
                      {isFlood ? 'Risco de Interdição' : 'Liberação da Via'}
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-semibold">
                      O nível chegará a {ev.expectedLevel.toFixed(2)}m
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
