'use client';

import {
  Waves,
  CalendarClock,
  CloudRain,
  CloudLightning,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatsCardsProps {
  currentLevel: number;
  maxHistorical: { level: number; date: string };
  avg30days: number;
  precip24h: number;
  precip72h: number;
  daysSinceFlood: number;
}

export default function StatsCards({
  currentLevel,
  maxHistorical,
  avg30days,
  precip24h,
  precip72h,
  daysSinceFlood,
}: StatsCardsProps) {
  // Formata a data da máxima histórica se existir
  let formattedMaxDate = maxHistorical.date;
  try {
    if (maxHistorical.date) {
      const d = new Date(maxHistorical.date);
      if (!isNaN(d.getTime())) {
        formattedMaxDate = d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
    }
  } catch {
    formattedMaxDate = maxHistorical.date;
  }

  const cards = [
    {
      title: 'Nível Atual do Rio',
      value: currentLevel.toFixed(2),
      unit: 'm',
      description: 'Leitura em tempo real da estação',
      icon: Waves,
      color:
        currentLevel >= 7
          ? 'text-rose-600'
          : currentLevel >= 6
          ? 'text-amber-600'
          : 'text-blue-600',
      bgColor:
        currentLevel >= 7
          ? 'bg-rose-50 border-rose-200'
          : currentLevel >= 6
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-200',
    },
    {
      title: 'Pico no Período',
      value: maxHistorical.level.toFixed(2),
      unit: 'm',
      description: formattedMaxDate ? `Registrado em ${formattedMaxDate}` : 'Cota máxima no período',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
    },
    {
      title: 'Média dos Últimos 30 Dias',
      value: avg30days.toFixed(2),
      unit: 'm',
      description: 'Nível médio histórico recente',
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Chuva nas Últimas 24h',
      value: precip24h.toFixed(1),
      unit: 'mm',
      description: 'Volume diário registrado',
      icon: CloudRain,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border-sky-200',
    },
    {
      title: 'Chuva Acumulada em 72h',
      value: precip72h.toFixed(1),
      unit: 'mm',
      description: 'Volume acumulado em 3 dias',
      icon: CloudLightning,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Tempo sem Enchente',
      value: daysSinceFlood >= 999 ? '> 1' : `${daysSinceFlood}`,
      unit: daysSinceFlood >= 999 ? 'ano' : 'dias',
      description: 'Sem ultrapassar a cota de 7,0 m',
      icon: CalendarClock,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 border-teal-200',
    },
  ];

  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-bold text-slate-700 px-1">
        Indicadores & Estatísticas do Rio Negro
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-700 block leading-tight">
                {card.title}
              </span>
              <div className="mt-2.5 flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {card.value}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-400">
                  {card.unit}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-1 leading-snug">
                {card.description}
              </p>
            </div>
            <div className={cn('p-2.5 rounded-xl border shrink-0', card.bgColor, card.color)}>
              <card.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
