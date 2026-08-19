'use client';

import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

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
      colorHex: '#0284c7', // Sky Blue 600
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      impact: 'Sem impacto urbano.',
    },
    {
      level: 5.0,
      label: '5,00 m',
      name: 'Início de Atenção',
      status: 'Atenção',
      desc: 'Parques e orla ribeirinha com água acumulada.',
      colorHex: '#f59e0b', // amber-500
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      impact: 'Margens inundadas. Evite áreas de lazer próximas ao rio.',
    },
    {
      level: 6.0,
      label: '6,00 m',
      name: 'Cota de Alerta',
      status: 'Alerta',
      desc: 'Várzeas alagam. Entorno da Ponte Metálica em vigilância.',
      colorHex: '#f97316', // orange-500
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      impact: 'Trânsito pode ser desviado em ruas baixas.',
    },
    {
      level: 7.0,
      label: '7,00 m',
      name: 'Residências Atingidas',
      status: 'Enchente',
      desc: 'Água invade casas e comércios em Mafra e Rio Negro.',
      colorHex: '#f43f5e', // rose-500
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      impact: 'Famílias ribeirinhas devem evacuar imediatamente.',
    },
    {
      level: 8.5,
      label: '8,50 m',
      name: 'Enchente Grave',
      status: 'Crítico',
      desc: 'Pontes bloqueadas, vias centrais submersas (ex: 2022).',
      colorHex: '#dc2626', // red-600
      badgeColor: 'bg-red-200 text-red-900 border-red-400',
      impact: 'Bloqueio total de travessia Rio Negro ⇄ Mafra.',
    },
    {
      level: 11.2,
      label: '11,20 m',
      name: 'Cheia Histórica (2023)',
      status: 'Histórico',
      desc: 'Maior cheia em 30 anos. Cidades submersas.',
      colorHex: '#9333ea', // purple-600
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      impact: 'Destruição em larga escala. Isolamento total.',
    },
  ];

  // Encontrar o estágio mais próximo atingido
  const currentStageIdx = stages.reduce((acc, stage, idx) => {
    return currentLevel >= stage.level ? idx : acc;
  }, 0);

  // Status de tendência
  const isRising = trend?.direction === 'rising';
  const isFalling = trend?.direction === 'falling';

  const TrendIcon = isRising ? TrendingUp : isFalling ? TrendingDown : Minus;

  const trendLabel = isRising
    ? `Subindo ${trend.rate > 0 ? `(+${trend.rate.toFixed(1)} cm/h)` : ''}`
    : isFalling
    ? `Descendo ${trend.rate > 0 ? `(-${trend.rate.toFixed(1)} cm/h)` : ''}`
    : 'Nível Estável';

  const trendHeaderBadge = isRising
    ? 'text-rose-700 bg-rose-50 border-rose-200 ring-1 ring-rose-200'
    : isFalling
    ? 'text-blue-700 bg-blue-50 border-blue-200 ring-1 ring-blue-200'
    : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
      {/* Estilos CSS para fluxo direcional inequívoco da água */}
      <style jsx>{`
        @keyframes cascadeDown {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        @keyframes cascadeUp {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100%);
            opacity: 0;
          }
        }
        @keyframes pulseDot {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        .stream-chevron-down {
          animation: cascadeDown 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .stream-chevron-up {
          animation: cascadeUp 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .current-marker-pulse {
          animation: pulseDot 2s ease-in-out infinite;
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Régua Prática: O que acontece na cidade?
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pontos críticos de cheia e comportamento da água em Rio Negro e Mafra
          </p>
        </div>

        {trend && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${trendHeaderBadge}`}
          >
            <TrendIcon className="h-4 w-4" />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {/* Lista da Régua */}
      <div className="flex flex-col">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest = idx === currentStageIdx;
          const isFirst = idx === 0;
          const isLast = idx === stages.length - 1;

          // Próximo nível para cálculo da linha
          const nextLevel = !isLast ? stages[idx + 1].level : stage.level;
          const isNextReached = !isLast && currentLevel >= nextLevel;

          // Percentual preenchido no segmento de saída (do centro do ponto atual para baixo)
          let segmentPercent = 0;
          if (!isLast) {
            if (isNextReached) {
              segmentPercent = 100;
            } else if (isCurrentNearest) {
              const range = nextLevel - stage.level;
              const diff = currentLevel - stage.level;
              segmentPercent = Math.min(Math.max((diff / range) * 100, 0), 100);
            }
          }

          return (
            <div key={idx} className="relative flex items-stretch mb-3.5 last:mb-0">
              {/* Coluna da Linha e do Ponto — 100% alinhado ao centro geométrico vertical do cartão */}
              <div className="relative flex items-center justify-center shrink-0 w-8 self-stretch">
                {/* Linha Metade Superior (Conecta o topo do card ao centro do ponto) */}
                {!isFirst && (
                  <div
                    className={`w-1.5 absolute top-0 bottom-1/2 left-1/2 -translate-x-1/2 z-0 overflow-hidden ${
                      isReached ? 'bg-blue-600' : 'bg-slate-200'
                    }`}
                  >
                    {/* Animação de fluxo na linha superior se a água passa por aqui */}
                    {isReached && (
                      <div className="absolute inset-0 flex flex-col items-center justify-around opacity-75">
                        {isRising ? (
                          <ArrowUp className="w-2 h-2 text-white stream-chevron-up" />
                        ) : isFalling ? (
                          <ArrowDown className="w-2 h-2 text-white stream-chevron-down" />
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* Linha Metade Inferior (Conecta o centro do ponto ao fundo do card) */}
                {!isLast && (
                  <div className="w-1.5 absolute top-1/2 bottom-0 left-1/2 -translate-x-1/2 z-0 bg-slate-200 overflow-hidden">
                    {/* Preenchimento de água em azul */}
                    {segmentPercent > 0 && (
                      <div
                        className="absolute top-0 left-0 w-full bg-blue-600 transition-all duration-500"
                        style={{ height: `${segmentPercent}%` }}
                      >
                        {/* Setas de fluxo correndo dentro do canal preenchido */}
                        <div className="absolute inset-0 flex flex-col items-center justify-around opacity-80 overflow-hidden">
                          {isRising ? (
                            <>
                              <ArrowUp className="w-2 h-2 text-white stream-chevron-up" />
                              <ArrowUp className="w-2 h-2 text-white stream-chevron-up" style={{ animationDelay: '0.7s' }} />
                            </>
                          ) : isFalling ? (
                            <>
                              <ArrowDown className="w-2 h-2 text-white stream-chevron-down" />
                              <ArrowDown className="w-2 h-2 text-white stream-chevron-down" style={{ animationDelay: '0.7s' }} />
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Marcador Exato da Cota Atual (se estiver entre os estágios) */}
                {isCurrentNearest && segmentPercent > 0 && segmentPercent < 100 && !isLast && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-20"
                    style={{ top: `calc(50% + (${segmentPercent}% * 0.5))` }}
                  >
                    <div className="relative -mt-2 -ml-2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md current-marker-pulse flex items-center justify-center">
                      {isRising ? (
                        <ArrowUp className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : isFalling ? (
                        <ArrowDown className="w-2.5 h-2.5 text-white stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </div>
                )}

                {/* Ponto / Nó Central do Estágio (Exatamente no centro geométrico Y do cartão) */}
                <div
                  style={{
                    backgroundColor: isReached ? stage.colorHex : '#cbd5e1',
                  }}
                  className={`relative z-10 w-4.5 h-4.5 rounded-full border-[3px] border-white shadow-md transition-all duration-300 flex items-center justify-center ${
                    isCurrentNearest
                      ? 'scale-125 ring-4 ring-blue-500/25'
                      : isReached
                      ? 'scale-100'
                      : 'scale-90 opacity-80'
                  }`}
                />
              </div>

              {/* Card de Informações do Estágio */}
              <div
                className={`flex-1 ml-3 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                  isCurrentNearest
                    ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                    : isReached
                    ? 'bg-slate-50/70 border-slate-200/90'
                    : 'bg-white border-slate-200/60 opacity-60'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                      {stage.label}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {stage.name}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${stage.badgeColor}`}
                    >
                      {stage.status}
                    </span>
                  </div>

                  {isCurrentNearest && (
                    <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black shadow-xs">
                      {isRising ? (
                        <ArrowUp className="w-3 h-3 text-white animate-bounce" />
                      ) : isFalling ? (
                        <ArrowDown className="w-3 h-3 text-white animate-bounce" />
                      ) : null}
                      <span>NÍVEL ATUAL ({currentLevel.toFixed(2)}m)</span>
                    </div>
                  )}
                </div>

                {/* Descrição */}
                <p className="text-xs text-slate-600 font-medium mt-1.5 leading-relaxed">
                  {stage.desc}
                </p>

                {/* Caixa de Impacto e Ação Prática (apenas para o nível atingido) */}
                {isCurrentNearest && (
                  <div className="mt-2.5 pt-2.5 border-t border-blue-200/80 flex items-start gap-2 text-xs text-blue-900 font-semibold bg-blue-100/40 p-2 rounded-xl">
                    <span className="shrink-0 text-sm">⚡</span>
                    <span className="leading-snug">
                      <strong className="font-bold">O que esperar:</strong> {stage.impact}
                    </span>
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
