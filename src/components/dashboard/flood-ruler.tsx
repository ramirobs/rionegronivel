'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FloodRulerProps {
  currentLevel: number;
  trend?: { rate: number; direction: 'rising' | 'stable' | 'falling' };
}

export default function FloodRuler({ currentLevel, trend }: FloodRulerProps) {
  // Array ordenado do maior para o menor nível. Assim a água preenche de baixo para cima.
  const stages = [
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
      level: 4.0,
      label: '4,00 m',
      name: 'Leito Normal',
      status: 'Normal',
      desc: 'Rio corre no canal. Margens livres.',
      colorHex: '#0284c7', // Sky Blue 600
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      impact: 'Sem impacto urbano.',
    },
  ];

  // Encontrar o estágio mais próximo atingido (primeiro estágio com level <= currentLevel)
  // Ou se for abaixo de 4m, usaremos o de 4m como base.
  let currentStageIdx = stages.findIndex((stage) => currentLevel >= stage.level);
  if (currentStageIdx === -1) {
    currentStageIdx = stages.length - 1; // Fica no 4.0m se estiver muito baixo
  }

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
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Régua Prática: O que acontece na cidade?
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lendo de baixo para cima, como o rio real.
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
      <div className="flex flex-col relative pb-4">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest = idx === currentStageIdx;
          const isFirst = idx === 0; // Topo (11.2m)
          const isLast = idx === stages.length - 1; // Base (4.0m)

          // O segmento visual conecta `stage` (topo do segmento) até `nextStage` (base do segmento).
          // Como desenhamos de cima para baixo na tela, `nextStage` é o item `idx + 1` (que tem level menor).
          const nextStageLevel = !isLast ? stages[idx + 1].level : stage.level - 1; // se for o último, dá uma margem fictícia pra baixo.
          
          const topLevel = stage.level;
          const bottomLevel = nextStageLevel;
          const range = topLevel - bottomLevel;

          let segmentPercent = 0; // % preenchido de baixo para cima
          if (!isLast) {
            if (currentLevel >= topLevel) {
              segmentPercent = 100; // Totalmente submerso
            } else if (currentLevel > bottomLevel) {
              // Parcialmente submerso
              segmentPercent = ((currentLevel - bottomLevel) / range) * 100;
            }
          } else {
             // O último trecho (abaixo de 4m)
             if (currentLevel >= 4.0) {
                 segmentPercent = 100;
             } else {
                 // Abaixo de 4m, proporcional entre 3 e 4
                 const l = Math.max(currentLevel, 3);
                 segmentPercent = ((l - 3) / 1) * 100;
             }
          }

          // Posicionamento do marcador de "Nível Atual" neste trecho (se a água estiver passando por aqui)
          const showMarkerHere = (currentLevel > bottomLevel && currentLevel <= topLevel && !isLast) || (isLast && currentLevel <= topLevel);

          return (
            <div key={idx} className="relative flex items-stretch">
              
              {/* Coluna da Régua (Marcadores e Linha de Água) */}
              <div className="relative flex flex-col items-center shrink-0 w-12 self-stretch">
                
                {/* O Ponto deste nível */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 w-full h-8 justify-center">
                    <div
                        style={{
                            backgroundColor: isReached ? stage.colorHex : '#cbd5e1',
                            borderColor: isReached ? '#fff' : '#f8fafc',
                        }}
                        className={`w-3.5 h-3.5 rounded-full border-[2px] shadow-sm transition-all duration-300 z-10
                            ${isCurrentNearest ? 'scale-125 ring-4 ring-blue-500/25' : 'scale-100'}
                        `}
                    />
                </div>

                {/* A Linha/Tubo conectando este ponto ao de baixo */}
                {!isLast && (
                  <div className="w-2.5 flex-1 relative bg-slate-100 rounded-full my-4 shadow-inner overflow-visible">
                      {/* Água (preenchendo de baixo para cima, absolute bottom-0) */}
                      {segmentPercent > 0 && (
                          <div 
                              className="absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                              style={{ height: `${segmentPercent}%` }}
                          >
                             {/* Efeito de listras sutis na água */}
                             <div className="absolute inset-0 opacity-20" style={{
                                 backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 8px)'
                             }} />
                          </div>
                      )}

                      {/* Marcador do Nível Atual flutuando na superfície da água */}
                      {showMarkerHere && (
                          <div 
                             className="absolute w-full z-30 transition-all duration-700"
                             style={{ bottom: `${segmentPercent}%` }}
                          >
                              {/* O indicador flutuante */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-lg border-2 border-blue-600 flex items-center justify-center">
                                 {isRising && <TrendingUp className="w-3.5 h-3.5 text-blue-600" />}
                                 {isFalling && <TrendingDown className="w-3.5 h-3.5 text-blue-600" />}
                                 {!isRising && !isFalling && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              </div>

                              {/* Dica da bolha (tool-tipzinha) colada no marcador */}
                              <div className="absolute top-1/2 left-4 -translate-y-1/2 ml-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow whitespace-nowrap hidden sm:block">
                                  {currentLevel.toFixed(2)}m
                              </div>
                          </div>
                      )}
                  </div>
                )}

              </div>

              {/* Card de Informação à direita */}
              <div
                className={`flex-1 ml-2 sm:ml-4 mb-6 p-4 rounded-xl border transition-all duration-300 relative
                  ${isReached ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-100 opacity-60'}
                  ${isCurrentNearest ? 'ring-2 ring-blue-500/20 shadow-md bg-white border-blue-200' : ''}
                `}
              >
                {isCurrentNearest && (
                    <div className="absolute -top-3 right-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow animate-pulse">
                        VOCÊ ESTÁ AQUI
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-sm font-black text-slate-800">{stage.label}</span>
                  <span className="text-sm font-bold text-slate-700">{stage.name}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${stage.badgeColor}`}
                  >
                    {stage.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {stage.desc}
                </p>

                {/* Impacto detalhado quando atingido */}
                {isCurrentNearest && (
                   <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                       <span className="text-blue-500 mt-0.5">⚡</span>
                       <p className="text-xs text-slate-700 leading-relaxed">
                           <strong className="font-semibold">Impacto Imediato:</strong> {stage.impact}
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
