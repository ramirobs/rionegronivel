'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FloodRulerProps {
  currentLevel: number;
  trend?: { rate: number; direction: 'rising' | 'stable' | 'falling' };
}

export default function FloodRuler({ currentLevel, trend }: FloodRulerProps) {
  const stages = [
    {
      level: 4.0,
      label: '4,00 m',
      name: 'Leito Normal',
      status: 'Normal',
      desc: 'Rio corre no canal. Margens livres.',
      dotColor: 'bg-emerald-500',
      lineColor: 'bg-emerald-300',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      impact: 'Sem impacto urbano.',
    },
    {
      level: 5.0,
      label: '5,00 m',
      name: 'Início de Atenção',
      status: 'Atenção',
      desc: 'Parques e orla ribeirinha com água acumulada.',
      dotColor: 'bg-amber-500',
      lineColor: 'bg-amber-300',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      impact: 'Margens inundadas. Evite áreas de lazer próximas ao rio.',
    },
    {
      level: 6.0,
      label: '6,00 m',
      name: 'Cota de Alerta',
      status: 'Alerta',
      desc: 'Várzeas alagam. Entorno da Ponte Metálica em vigilância.',
      dotColor: 'bg-orange-500',
      lineColor: 'bg-orange-300',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      impact: 'Trânsito pode ser desviado em ruas baixas.',
    },
    {
      level: 7.0,
      label: '7,00 m',
      name: 'Residências Atingidas',
      status: 'Enchente',
      desc: 'Água invade casas e comércios em Mafra e Rio Negro.',
      dotColor: 'bg-rose-500',
      lineColor: 'bg-rose-300',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      impact: 'Famílias ribeirinhas devem evacuar imediatamente.',
    },
    {
      level: 8.5,
      label: '8,50 m',
      name: 'Enchente Grave',
      status: 'Crítico',
      desc: 'Pontes bloqueadas, vias centrais submersas (ex: 2022).',
      dotColor: 'bg-red-600',
      lineColor: 'bg-red-400',
      badgeColor: 'bg-red-200 text-red-900 border-red-400',
      impact: 'Bloqueio total de travessia Rio Negro ⇄ Mafra.',
    },
    {
      level: 11.2,
      label: '11,20 m',
      name: 'Cheia Histórica (2023)',
      status: 'Histórico',
      desc: 'Maior cheia em 30 anos. Cidades submersas.',
      dotColor: 'bg-purple-600',
      lineColor: 'bg-purple-300',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      impact: 'Destruição em larga escala. Isolamento total.',
    },
  ];

  // Encontrar o estágio atual
  const currentStageIdx = stages.reduce((acc, stage, idx) => {
    return currentLevel >= stage.level ? idx : acc;
  }, 0);

  // Ícone e texto da tendência
  const TrendIcon =
    trend?.direction === 'rising'
      ? TrendingUp
      : trend?.direction === 'falling'
      ? TrendingDown
      : Minus;

  const trendLabel =
    trend?.direction === 'rising'
      ? `Subindo ${trend.rate > 0 ? `+${trend.rate.toFixed(1)} cm/h` : ''}`
      : trend?.direction === 'falling'
      ? `Descendo ${trend.rate > 0 ? `${trend.rate.toFixed(1)} cm/h` : ''}`
      : 'Estável';

  const trendColor =
    trend?.direction === 'rising'
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : trend?.direction === 'falling'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : 'text-slate-500 bg-slate-50 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      {/* Header com tendência */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Régua Prática: O que acontece na cidade?
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pontos de alagamento conhecidos conforme a altura da água
          </p>
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${trendColor}`}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {/* Régua vertical com linha e pontos */}
      <div className="relative ml-1 sm:ml-2">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest = idx === currentStageIdx;
          const isLast = idx === stages.length - 1;

          // Calcular posição do marcador do nível atual entre dois estágios
          let currentMarkerPosition: number | null = null;
          if (isCurrentNearest && !isLast) {
            const nextLevel = stages[idx + 1].level;
            const range = nextLevel - stage.level;
            const progress = (currentLevel - stage.level) / range;
            currentMarkerPosition = Math.min(Math.max(progress, 0), 1);
          }

          return (
            <div key={idx} className="relative flex items-stretch">
              {/* Coluna da linha vertical e ponto */}
              <div className="flex flex-col items-center mr-4 relative" style={{ width: '20px' }}>
                {/* Ponto do estágio */}
                <div
                  className={`relative z-10 w-4 h-4 rounded-full border-[2.5px] border-white shadow-sm transition-all duration-500 ${
                    isReached ? stage.dotColor : 'bg-slate-300'
                  } ${isCurrentNearest ? 'ring-4 ring-blue-400/30 scale-125' : ''}`}
                />

                {/* Linha conectora até o próximo */}
                {!isLast && (
                  <div
                    className={`w-[3px] flex-1 min-h-[48px] transition-all duration-500 ${
                      isReached && currentLevel >= stages[idx + 1].level
                        ? stages[idx + 1].dotColor.replace('bg-', 'bg-').replace('500', '200').replace('600', '200')
                        : isReached
                        ? 'bg-gradient-to-b from-blue-400 to-slate-200'
                        : 'bg-slate-200'
                    }`}
                  >
                    {/* Marcador animado do nível atual na linha */}
                    {isCurrentNearest && currentMarkerPosition !== null && (
                      <div
                        className="relative w-full"
                        style={{ top: `${currentMarkerPosition * 100}%` }}
                      >
                        <div className="absolute -left-[5px] w-[13px] h-[13px] rounded-full bg-blue-600 border-2 border-white shadow-lg z-20 animate-pulse" />
                        {/* Seta de tendência */}
                        {trend && trend.direction !== 'stable' && (
                          <div
                            className={`absolute -left-[18px] ${
                              trend.direction === 'rising' ? '-top-5' : 'top-4'
                            }`}
                          >
                            <TrendIcon
                              className={`h-4 w-4 ${
                                trend.direction === 'rising' ? 'text-rose-500' : 'text-emerald-500'
                              } animate-bounce`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card do estágio */}
              <div
                className={`flex-1 mb-3 p-3 sm:p-3.5 rounded-xl border transition-all duration-300 ${
                  isCurrentNearest
                    ? 'bg-blue-50/80 border-blue-300 shadow-sm'
                    : isReached
                    ? 'bg-slate-50/60 border-slate-200'
                    : 'bg-white border-slate-100 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-800">{stage.label}</span>
                  <span className="text-xs font-bold text-slate-700">{stage.name}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${stage.badgeColor}`}
                  >
                    {stage.status}
                  </span>

                  {isCurrentNearest && (
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md ml-auto animate-pulse flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                      NÍVEL ATUAL
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium mt-1">{stage.desc}</p>

                {/* Impacto (info do simulador) — só no estágio atual */}
                {isCurrentNearest && (
                  <div className="mt-2 pt-2 border-t border-blue-200/60">
                    <p className="text-[11px] text-blue-700 font-semibold">
                      ⚡ {stage.impact}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
