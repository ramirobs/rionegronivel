import { AlertTriangle, Siren, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/constants';

interface DynamicAlertBannerProps {
  riskLevel: RiskLevel;
  forecastMaxLevel?: number;
  forecastPeakDate?: string;
  className?: string;
}

export function DynamicAlertBanner({
  riskLevel,
  forecastMaxLevel,
  forecastPeakDate,
  className,
}: DynamicAlertBannerProps) {
  // Apenas exibe o banner se o risco for ALERTA ou EMERGÊNCIA.
  if (riskLevel !== 'alert' && riskLevel !== 'emergency') return null;

  const isEmergency = riskLevel === 'emergency';
  const Icon = isEmergency ? Siren : AlertTriangle;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl shadow-lg border-2 p-4 md:p-5 flex items-start sm:items-center gap-4 transition-all mb-6',
        isEmergency
          ? 'bg-red-600 border-red-700 text-white animate-pulse'
          : 'bg-orange-500 border-orange-600 text-white',
        className
      )}
    >
      {/* Decoração de fundo estilo "Faixa Zebrada" */}
      <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.5)_10px,rgba(0,0,0,0.5)_20px)]" />

      <div className="relative shrink-0 bg-white/20 p-2 sm:p-3 rounded-full">
        <Icon className={cn('h-6 w-6 sm:h-8 sm:w-8', isEmergency && 'animate-ping')} />
      </div>

      <div className="relative flex-1">
        <h3 className="text-sm sm:text-base font-black uppercase tracking-wide">
          {isEmergency ? 'ALERTA VERMELHO: Enchente Confirmada' : 'ALERTA LARANJA: Risco de Inundação'}
        </h3>
        <p className="text-xs sm:text-sm font-medium opacity-90 mt-0.5 leading-relaxed">
          {isEmergency
            ? 'O nível do rio ultrapassou a cota de segurança. Áreas ribeirinhas já podem estar submersas. Siga as orientações da Defesa Civil.'
            : 'As águas estão subindo rapidamente e podem atingir as cotas de alerta nas partes baixas.'}
        </p>

        {forecastMaxLevel && forecastMaxLevel > 6 && (
          <div className="mt-2 inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md text-xs font-bold shadow-inner">
            <Info className="h-3.5 w-3.5" />
            <span>
              Projeção Matemática: Pico de {forecastMaxLevel.toFixed(2)}m
              {forecastPeakDate ? ` em ${forecastPeakDate}` : ' nas próximas 48h'}.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
