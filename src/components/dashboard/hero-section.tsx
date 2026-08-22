'use client';

import { ArrowDown, ArrowUp, Minus, MapPin, Clock, RefreshCw, PhoneCall, CheckCircle2, Info, AlertTriangle, ShieldAlert } from 'lucide-react';
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
    title: string;
    subtitle: string;
    advice: string;
    bgBadge: string;
    textBadge: string;
    ringBadge: string;
    cardBg: string;
    cardBorder: string;
    glowBg: string;
    sparklineColor: string;
    icon: typeof CheckCircle2;
  }
> = {
  normal: {
    label: 'Normal',
    title: 'Rio em Situação Tranquila',
    subtitle: 'Sem qualquer risco de enchente no momento.',
    advice: 'Pode seguir a rotina normalmente. Calha dentro do leito seguro.',
    bgBadge: 'bg-emerald-500',
    textBadge: 'text-white',
    ringBadge: 'ring-emerald-500/20',
    cardBg: 'bg-gradient-to-br from-sky-50/60 via-white to-blue-50/20',
    cardBorder: 'border-slate-200/90',
    glowBg: 'from-blue-100/40 to-transparent',
    sparklineColor: '#0284c7',
    icon: CheckCircle2,
  },
  attention: {
    label: 'Atenção',
    title: 'Rio Elevado — Fique Atento',
    subtitle: 'A água subiu nas margens, mas ainda não atinge residências.',
    advice: 'Moradores de áreas ribeirinhas devem acompanhar os boletins.',
    bgBadge: 'bg-amber-500',
    textBadge: 'text-white',
    ringBadge: 'ring-amber-500/20',
    cardBg: 'bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/30',
    cardBorder: 'border-amber-200/90',
    glowBg: 'from-amber-200/40 to-transparent',
    sparklineColor: '#d97706',
    icon: Info,
  },
  alert: {
    label: 'Alerta',
    title: 'Risco de Alagamento em Áreas Baixas',
    subtitle: 'O rio está muito cheio e pode começar a invadir ruas mais baixas.',
    advice: 'Recomenda-se levantar móveis em áreas baixas e guardar documentos.',
    bgBadge: 'bg-orange-500',
    textBadge: 'text-white',
    ringBadge: 'ring-orange-500/20',
    cardBg: 'bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40',
    cardBorder: 'border-orange-300',
    glowBg: 'from-orange-200/50 to-transparent',
    sparklineColor: '#ea580c',
    icon: AlertTriangle,
  },
  emergency: {
    label: 'Emergência',
    title: 'Enchente em Andamento!',
    subtitle: 'A água ultrapassou a cota crítica de 7,00m e atinge áreas urbanas.',
    advice: 'Evacue áreas de risco imediatamente e procure abrigo ou a Defesa Civil.',
    bgBadge: 'bg-rose-600',
    textBadge: 'text-white',
    ringBadge: 'ring-rose-600/20',
    cardBg: 'bg-gradient-to-br from-rose-50/90 via-white to-red-50/50',
    cardBorder: 'border-rose-300 ring-2 ring-rose-500/20',
    glowBg: 'from-rose-300/50 to-transparent',
    sparklineColor: '#dc2626',
    icon: ShieldAlert,
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
  const isFlooded = level >= 7.0;
  const distanceToFlood = 7.0 - level;
  const StatusIcon = risk.icon;

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
        'relative overflow-hidden rounded-2xl border p-5 sm:p-7 shadow-xs transition-all duration-300',
        risk.cardBg,
        risk.cardBorder
      )}
    >
      {/* Decorative gradient overlay dinâmico */}
      <div
        className={cn(
          'absolute top-0 right-0 h-44 w-44 sm:h-64 sm:w-64 bg-gradient-to-bl rounded-bl-full pointer-events-none transition-all duration-500',
          risk.glowBg
        )}
      />

      <div className="relative z-10 space-y-5">
        {/* Header Superior: Localização + Status Badge + Horário */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Rio Negro (PR) / Mafra (SC)</span>
            <span className="text-[10px] bg-slate-100/90 text-slate-600 px-2 py-0.5 rounded-full font-bold border border-slate-200">
              Estação 65100001
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ring-2',
                risk.bgBadge,
                risk.textBadge,
                risk.ringBadge
              )}
            >
              STATUS: {risk.label.toUpperCase()}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{formattedTime}</span>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="ml-1 p-1 text-slate-400 hover:text-blue-600 hover:bg-white/80 rounded-md transition-all active:scale-90 cursor-pointer"
                  title="Atualizar dados agora"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-blue-600")} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bloco Central: Nível Gigante + Tendência + Sparkline + Diagnóstico Direto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Lado Esquerdo (Nível e Tendência) */}
          <div className="lg:col-span-5 space-y-2">
            <span className="text-xs sm:text-sm font-bold text-slate-500 block">
              Nível do Rio em Tempo Real
            </span>
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900">
                {level.toFixed(2)}
                <span className="text-3xl sm:text-4xl text-slate-400 font-bold ml-1">
                  m
                </span>
              </span>

              {/* Pill de Tendência */}
              <div
                className={cn(
                  'flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-bold border shadow-2xs',
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
                  {trend.direction === 'rising'
                    ? `Subindo (+${(trend.rate * 100).toFixed(1)} cm/h)`
                    : trend.direction === 'falling'
                    ? `Baixando (-${(Math.abs(trend.rate) * 100).toFixed(1)} cm/h)`
                    : 'Nível Estável'}
                </span>
              </div>
            </div>

            {/* Mini-Gráfico Sparkline das últimas 24h */}
            {recentReadings && recentReadings.length > 3 && (
              <div className="pt-1">
                <MiniSparkline data={recentReadings} strokeColor={risk.sparklineColor} />
              </div>
            )}
          </div>

          {/* Lado Direito (Diagnóstico Direto em Linguagem Clara) */}
          <div className="lg:col-span-7 bg-white/90 p-4 sm:p-5 rounded-xl border border-black/5 shadow-2xs space-y-2.5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0 mt-0.5">
                <StatusIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Diagnóstico Direto
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {risk.title}
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  {isFlooded ? (
                    <span className="text-rose-600 font-bold">
                      ⚠️ O rio está {(level - 7.0).toFixed(2)}m acima da cota de emergência (7,00m).
                    </span>
                  ) : (
                    <span>
                      Faltam <strong className="text-slate-900 font-bold">{distanceToFlood.toFixed(2)}m</strong> para a cota de inundação (7,00m). {risk.advice}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de Ações Rápidas */}
        <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <ShareButton
              level={level}
              trend={trend}
              precip24h={precip24h}
              lastUpdate={lastUpdate}
              riskLevel={riskLevel}
            />
            <NotificationDialog currentLevel={level} />

            {riskLevel !== 'normal' && (
              <a
                href="tel:199"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                Defesa Civil 199
              </a>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Telemetria Oficial ANA • Ao Vivo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
