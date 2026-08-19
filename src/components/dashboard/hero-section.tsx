'use client';

import { ArrowDown, ArrowUp, Minus, MapPin, Clock, RefreshCw } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ShareButton from './share-button';
import NotificationDialog from './notification-dialog';
import MiniSparkline from './mini-sparkline';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
  recentReadings?: { level: number; date?: string }[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const RISK_CONFIG: Record<
  RiskLevel,
  {
    label: string;
    bgBadge: string;
    textBadge: string;
    ringBadge: string;
    description: string;
    cardBg: string;
    cardBorder: string;
    glowBg: string;
    sparklineColor: string;
  }
> = {
  normal: {
    label: 'Normal',
    bgBadge: 'bg-emerald-500',
    textBadge: 'text-white',
    ringBadge: 'ring-emerald-500/20',
    description: 'Nível seguro dentro da calha regular.',
    cardBg: 'bg-gradient-to-br from-sky-50/50 via-white to-blue-50/20',
    cardBorder: 'border-slate-200/90',
    glowBg: 'from-blue-100/40 to-transparent',
    sparklineColor: '#0284c7',
  },
  attention: {
    label: 'Atenção',
    bgBadge: 'bg-amber-500',
    textBadge: 'text-white',
    ringBadge: 'ring-amber-500/20',
    description: 'Nível elevado. Monitoramento ativo recomendado.',
    cardBg: 'bg-gradient-to-br from-amber-50/60 via-white to-yellow-50/20',
    cardBorder: 'border-amber-200/90',
    glowBg: 'from-amber-200/40 to-transparent',
    sparklineColor: '#d97706',
  },
  alert: {
    label: 'Alerta',
    bgBadge: 'bg-orange-500',
    textBadge: 'text-white',
    ringBadge: 'ring-orange-500/20',
    description: 'Risco de alagamentos em áreas baixas.',
    cardBg: 'bg-gradient-to-br from-orange-50/70 via-white to-amber-50/30',
    cardBorder: 'border-orange-300',
    glowBg: 'from-orange-200/50 to-transparent',
    sparklineColor: '#ea580c',
  },
  emergency: {
    label: 'Emergência',
    bgBadge: 'bg-rose-600',
    textBadge: 'text-white',
    ringBadge: 'ring-rose-600/20',
    description: 'Enchente confirmada nas cidades.',
    cardBg: 'bg-gradient-to-br from-rose-50/80 via-white to-red-50/40',
    cardBorder: 'border-rose-300 ring-2 ring-rose-500/20',
    glowBg: 'from-rose-300/50 to-transparent',
    sparklineColor: '#dc2626',
  },
};

export default function HeroSection({
  level,
  trend,
  lastUpdate,
  riskLevel,
  precip24h = 0,
  recentReadings = [],
  onRefresh,
  isRefreshing = false,
}: HeroSectionProps) {
  const risk = RISK_CONFIG[riskLevel] || RISK_CONFIG.normal;

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
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 sm:p-7 shadow-sm transition-all duration-300',
        risk.cardBg,
        risk.cardBorder
      )}
    >
      {/* Decorative gradient overlay dinâmico */}
      <div
        className={cn(
          'absolute top-0 right-0 h-40 w-40 sm:h-64 sm:w-64 bg-gradient-to-bl rounded-bl-full pointer-events-none transition-all duration-500',
          risk.glowBg
        )}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-blue-600" />
            <span>Rio Negro (PR) / Mafra (SC)</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">
              Estação 65100001
            </span>
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
                  {trend.direction === 'stable' ? 'Estável' : `${(Math.abs(trend.rate) * 100).toFixed(1)} cm/h`}
                </span>
              </div>
            </div>
          </div>

          {/* Mini-Gráfico Sparkline das últimas 24h */}
          {recentReadings && recentReadings.length > 3 && (
            <div className="pt-1">
              <MiniSparkline data={recentReadings} strokeColor={risk.sparklineColor} />
            </div>
          )}
        </div>

        {/* Status Badge & Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t border-slate-100 md:border-0">
          <div className="text-left md:text-right">
            <div
              className={cn(
                'inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-extrabold shadow-sm ring-4 transition-all duration-300',
                risk.bgBadge,
                risk.textBadge,
                risk.ringBadge
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
                className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-all active:scale-90 cursor-pointer"
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
          <NotificationDialog currentLevel={level} />
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Telemetria Oficial ANA • Ao Vivo</span>
        </div>
      </div>
    </div>
  );
}
