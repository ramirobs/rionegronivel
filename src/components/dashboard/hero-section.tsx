'use client';

import { ArrowDown, ArrowUp, Minus, MapPin, Clock, RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import ShareButton from './share-button';
import NotificationDialog from './notification-dialog';

export type RiskLevel = 'normal' | 'attention' | 'alert' | 'emergency';

interface HeroSectionProps {
  level: number;
  trend: {
    rate: number;
    direction: 'rising' | 'stable' | 'falling';
  };
  lastUpdate: string;
  riskLevel: RiskLevel;
  precip24h?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const RISK_BADGES: Record<
  RiskLevel,
  { label: string; bg: string; text: string; ring: string; description: string }
> = {
  normal: {
    label: 'Normal',
    bg: 'bg-emerald-500',
    text: 'text-white',
    ring: 'ring-emerald-500/20',
    description: 'Nível seguro dentro da calha regular.',
  },
  attention: {
    label: 'Atenção',
    bg: 'bg-amber-500',
    text: 'text-white',
    ring: 'ring-amber-500/20',
    description: 'Nível elevado. Monitoramento ativo recomendado.',
  },
  alert: {
    label: 'Alerta',
    bg: 'bg-orange-500',
    text: 'text-white',
    ring: 'ring-orange-500/20',
    description: 'Risco de alagamentos em áreas baixas.',
  },
  emergency: {
    label: 'Emergência',
    bg: 'bg-rose-600',
    text: 'text-white',
    ring: 'ring-rose-600/20',
    description: 'Enchente confirmada nas cidades.',
  },
};

export default function HeroSection({
  level,
  trend,
  lastUpdate,
  riskLevel,
  precip24h = 0,
  onRefresh,
  isRefreshing = false,
}: HeroSectionProps) {
  const risk = RISK_BADGES[riskLevel] || RISK_BADGES.normal;

  // Formata a data e hora para exibição limpa
  let formattedTime = lastUpdate;
  try {
    const d = new Date(lastUpdate);
    if (!isNaN(d.getTime())) {
      formattedTime = d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  } catch {
    formattedTime = lastUpdate;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-sm">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 h-40 w-40 sm:h-64 sm:w-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>Rio Negro (PR) / Mafra (SC)</span>
          </div>

          <div>
            <span className="text-xs sm:text-sm font-medium text-slate-500 block">
              Nível do Rio em Tempo Real
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-900">
                {level.toFixed(2)}
                <span className="text-3xl sm:text-4xl text-slate-400 font-bold ml-1">
                  m
                </span>
              </span>

              {/* Pill de Tendência */}
              <div
                className={cn(
                  'flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-xs',
                  trend.direction === 'rising'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : trend.direction === 'falling'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                )}
              >
                {trend.direction === 'rising' && <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.direction === 'falling' && <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />}
                {trend.direction === 'stable' && <Minus className="h-3.5 w-3.5 stroke-[2.5]" />}
                <span>
                  {trend.direction === 'stable' ? 'Estável' : `${Math.abs(trend.rate).toFixed(2)} cm/h`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge & Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
          <div className="text-left md:text-right">
            <div
              className={cn(
                'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm ring-4',
                risk.bg,
                risk.text,
                risk.ring
              )}
            >
              STATUS: {risk.label.toUpperCase()}
            </div>
            <p className="hidden md:block text-xs text-slate-500 font-medium mt-1.5 max-w-[200px]">
              {risk.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formattedTime}</span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="Atualizar dados agora"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin text-blue-600")} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Ações Rápidas: Compartilhar no WhatsApp & Ativar Notificações */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <ShareButton
            level={level}
            trend={trend}
            precip24h={precip24h}
            lastUpdate={lastUpdate}
            riskLevel={riskLevel}
          />
          <NotificationDialog
            currentLevel={level}
            trendRate={trend.direction === 'rising' ? Math.abs(trend.rate) : -Math.abs(trend.rate)}
          />
        </div>

        <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
          Telemetria Oficial ANA & SNIRH
        </span>
      </div>
    </div>
  );
}
