'use client';

import {
  Waves,
  CalendarClock,
  CloudRain,
  CloudLightning,
  Activity,
  AlertCircle,
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
      title: 'Nível Atual',
      value: `${currentLevel.toFixed(2)} m`,
      icon: Waves,
      color:
        currentLevel >= 7
          ? 'text-rose-600'
          : currentLevel >= 6
          ? 'text-amber-600'
          : 'text-blue-600',
      bgColor:
        currentLevel >= 7
          ? 'bg-rose-50 border-rose-100'
          : currentLevel >= 6
          ? 'bg-amber-50 border-amber-100'
          : 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Pico no Período',
      value: `${maxHistorical.level.toFixed(2)} m`,
      subtitle: formattedMaxDate ? `em ${formattedMaxDate}` : undefined,
      icon: AlertCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-100',
    },
    {
      title: 'Média do Período',
      value: `${avg30days.toFixed(2)} m`,
      icon: Activity,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Chuva 24h',
      value: `${precip24h.toFixed(1)} mm`,
      icon: CloudRain,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 border-sky-100',
    },
    {
      title: 'Chuva 72h Acumulada',
      value: `${precip72h.toFixed(1)} mm`,
      icon: CloudLightning,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Dias sem Enchente',
      value: daysSinceFlood >= 999 ? '> 1 ano' : `${daysSinceFlood} dias`,
      icon: CalendarClock,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 border-teal-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider line-clamp-1">
              {card.title}
            </span>
            <div className={cn('p-2 rounded-xl border', card.bgColor, card.color)}>
              <card.icon className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {card.value}
            </h4>
            {card.subtitle && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5 truncate">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
