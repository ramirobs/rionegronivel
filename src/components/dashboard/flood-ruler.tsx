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
      colorHex: '#10b981', // emerald-500
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
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
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
    : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
      {/* Estilos e Animações de Fluxo da Régua */}
      <style jsx>{`
        @keyframes waterFlowUp {
          0% {
            background-position: 0 40px;
          }
          100% {
            background-position: 0 0;
          }
        }
        @keyframes waterFlowDown {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 40px;
          }
        }
        @keyframes floatPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.85;
          }
        }
        .water-stream-up {
          background-image: repeating-linear-gradient(
            0deg,
            #2563eb 0px,
            #3b82f6 8px,
            #60a5fa 14px,
            #2563eb 20px
          );
          background-size: 100% 20px;
          animation: waterFlowUp 0.9s linear infinite;
        }
        .water-stream-down {
          background-image: repeating-linear-gradient(
            180deg,
            #059669 0px,
            #10b981 8px,
            #34d399 14px,
            #059669 20px
          );
          background-size: 100% 20px;
          animation: waterFlowDown 0.9s linear infinite;
        }
        .water-stream-stable {
          background-color: #3b82f6;
        }
        .pulse-marker {
          animation: floatPulse 2s ease-in-out infinite;
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

          // Próximo nível para cálculo do segmento
          const nextLevel = !isLast ? stages[idx + 1].level : stage.level;
          const isNextReached = !isLast && currentLevel >= nextLevel;

          // Porcentagem de preenchimento deste segmento
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

          // Cor e animação do fluxo d'água
          const streamClass = isRising
            ? 'water-stream-up'
            : isFalling
            ? 'water-stream-down'
            : 'water-stream-stable';

          return (
            <div key={idx} className="relative flex items-start group">
              {/* Coluna da Linha e dos Pontos (Perfeitamente Centralizada) */}
              <div className="relative flex flex-col items-center shrink-0 w-8 self-stretch">
                {/* Linha Conectora do Topo (até o centro do ponto) */}
                {!isFirst && (
                  <div
                    className={`w-1 absolute top-0 h-4.5 -translate-x-1/2 left-1/2 z-0 ${
                      isReached ? (isRising ? 'water-stream-up' : isFalling ? 'water-stream-down' : 'bg-blue-500') : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Ponto / Nó do Estágio (Altura 18px, centralizado na linha do título do card a 18px do topo) */}
                <div className="h-9 flex items-center justify-center relative z-10 my-0">
                  <div
                    style={{
                      backgroundColor: isReached ? stage.colorHex : '#cbd5e1',
                    }}
                    className={`w-4 h-4 rounded-full border-[2.5px] border-white shadow-md transition-transform duration-300 ${
                      isCurrentNearest
                        ? 'scale-125 ring-4 ring-blue-500/25'
                        : isReached
                        ? 'scale-100'
                        : 'scale-90 opacity-80'
                    }`}
                  />
                </div>

                {/* Linha Conectora para Baixo (do centro do ponto até o final do card) */}
                {!isLast && (
                  <div className="relative w-1 flex-1 bg-slate-200 z-0 overflow-visible">
                    {/* Linha preenchida de água fluindo */}
                    {segmentPercent > 0 && (
                      <div
                        className={`absolute top-0 left-0 w-full rounded-b-full transition-all duration-500 ${streamClass}`}
                        style={{ height: `${segmentPercent}%` }}
                      />
                    )}

                    {/* Marcador flutuante exato do nível da água + indicador de fluxo */}
                    {isCurrentNearest && segmentPercent > 0 && segmentPercent < 100 && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 z-20"
                        style={{ top: `${segmentPercent}%` }}
                      >
                        {/* Ponto de Água Ativo */}
                        <div className="relative -mt-2 -ml-2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg pulse-marker flex items-center justify-center">
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
                  </div>
                )}
              </div>

              {/* Card de Informações do Estágio */}
              <div
                className={`flex-1 ml-3 mb-3.5 p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                  isCurrentNearest
                    ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-400/20 shadow-xs'
                    : isReached
                    ? 'bg-slate-50/70 border-slate-200/90'
                    : 'bg-white border-slate-200/60 opacity-60'
                }`}
              >
                {/* Linha do Cabeçalho do Card (Alinhada perfeitamente com o ponto do estágio) */}
                <div className="flex flex-wrap items-center justify-between gap-2 min-h-6">
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
                    <div className="flex items-center gap-1.5 bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black shadow-xs animate-pulse">
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
