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

  // Animação CSS baseada na tendência
  const trendAnimClass =
    trend?.direction === 'rising'
      ? 'animate-[flowUp_2s_ease-in-out_infinite]'
      : trend?.direction === 'falling'
      ? 'animate-[flowDown_2s_ease-in-out_infinite]'
      : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      {/* CSS da animação de fluxo */}
      <style jsx>{`
        @keyframes flowUp {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-6px); }
        }
        @keyframes flowDown {
          0%, 100% { opacity: 0.6; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(6px); }
        }
      `}</style>

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

      {/* Régua vertical com linha contínua e pontos */}
      <div className="relative ml-1 sm:ml-2">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest = idx === currentStageIdx;
          const isLast = idx === stages.length - 1;
          const isFirst = idx === 0;

          // Para o segmento da linha: está totalmente preenchido?
          const nextStageReached = !isLast && currentLevel >= stages[idx + 1].level;

          // Calcular preenchimento parcial do segmento atual
          let segmentFillPercent = 0;
          if (!isLast) {
            if (nextStageReached) {
              segmentFillPercent = 100;
            } else if (isCurrentNearest) {
              const nextLevel = stages[idx + 1].level;
              const range = nextLevel - stage.level;
              const progress = (currentLevel - stage.level) / range;
              segmentFillPercent = Math.min(Math.max(progress * 100, 0), 100);
            }
          }

          return (
            <div key={idx} className="relative flex items-stretch">
              {/* Coluna da linha vertical e ponto */}
              <div className="flex flex-col items-center mr-4 relative" style={{ width: '24px' }}>

                {/* Pequeno segmento de linha ACIMA do primeiro ponto para iniciar visualmente */}
                {isFirst && (
                  <div
                    className={`w-[3px] h-3 mb-0 rounded-t-full ${
                      isReached ? stage.dotColor : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Ponto do estágio */}
                <div
                  className={`relative z-10 shrink-0 w-4 h-4 rounded-full border-[2.5px] border-white shadow-sm transition-all duration-500 ${
                    isReached ? stage.dotColor : 'bg-slate-300'
                  } ${isCurrentNearest ? 'ring-4 ring-blue-400/30 scale-125' : ''}`}
                />

                {/* Linha conectora até o próximo ponto */}
                {!isLast && (
                  <div className="relative w-[3px] flex-1 min-h-[44px] bg-slate-200 rounded-full overflow-hidden">
                    {/* Preenchimento colorido */}
                    {segmentFillPercent > 0 && (
                      <div
                        className={`absolute top-0 left-0 w-full rounded-full transition-all duration-700 ease-out ${
                          isCurrentNearest ? 'bg-blue-500' : stage.dotColor
                        } ${isCurrentNearest ? trendAnimClass : ''}`}
                        style={{ height: `${segmentFillPercent}%` }}
                      />
                    )}

                    {/* Marcador do nível atual na linha */}
                    {isCurrentNearest && segmentFillPercent > 0 && segmentFillPercent < 100 && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-20"
                        style={{ top: `${segmentFillPercent}%` }}
                      >
                        <div className="w-[11px] h-[11px] -ml-[0.5px] -mt-[5px] rounded-full bg-blue-600 border-2 border-white shadow-lg animate-pulse" />
                      </div>
                    )}
                  </div>
                )}

                {/* Pequeno segmento de linha ABAIXO do último ponto para finalizar */}
                {isLast && (
                  <div className="w-[3px] h-3 mt-0 bg-slate-200 rounded-b-full" />
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
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md ml-auto flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                      NÍVEL ATUAL
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 font-medium mt-1">{stage.desc}</p>

                {/* Impacto — só no estágio atual */}
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
