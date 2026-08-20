'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FloodRulerProps {
  currentLevel: number;
  trend?: { rate: number; direction: 'rising' | 'stable' | 'falling' };
}

export default function FloodRuler({ currentLevel, trend }: FloodRulerProps) {
  // Ordem invertida: 11.2 no topo, 4.0 na base. A água preenche de baixo para cima.
  const stages = [
    {
      level: 11.2,
      label: '11,20 m',
      name: 'Cheia Histórica',
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
      desc: 'Água avança para o Centro de Rio Negro e Vila Ivete (Mafra).',
      colorHex: '#dc2626', // red-600
      badgeColor: 'bg-red-200 text-red-900 border-red-400',
      impact: 'Bloqueio total de travessias e resgate por barcos.',
    },
    {
      level: 7.0,
      label: '7,00 m',
      name: 'Alagamento Residencial',
      status: 'Enchente',
      desc: 'Água invade casas na Vila Argentina (Mafra) e Vila Paraíso (Rio Negro).',
      colorHex: '#f43f5e', // rose-500
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      impact: 'Famílias dos bairros ribeirinhos devem ser realocadas.',
    },
    {
      level: 6.0,
      label: '6,00 m',
      name: 'Transbordamento',
      status: 'Alerta',
      desc: 'Várzeas e parques alagam. Água atinge a Praça do Mafrense.',
      colorHex: '#f97316', // orange-500
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      impact: 'Fechamento de ruas adjacentes à orla.',
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

  // Identificar o estágio atual mais próximo (primeiro estágio com level <= currentLevel)
  let currentStageIdx = stages.findIndex((stage) => currentLevel >= stage.level);
  if (currentStageIdx === -1) {
    currentStageIdx = stages.length - 1; // Fica no 4.0m se estiver muito baixo
  }

  // Status de tendência
  const isRising = trend?.direction === 'rising';
  const isFalling = trend?.direction === 'falling';
  const TrendIcon = isRising ? TrendingUp : isFalling ? TrendingDown : Minus;

  const trendLabel = isRising
    ? `Subindo (+${(Math.abs(trend.rate) * 100).toFixed(1)} cm/h)`
    : isFalling
    ? `Descendo (-${(Math.abs(trend.rate) * 100).toFixed(1)} cm/h)`
    : 'Nível Estável';

  const trendHeaderBadge = isRising
    ? 'text-rose-700 bg-rose-50 border-rose-200 ring-1 ring-rose-200'
    : isFalling
    ? 'text-blue-700 bg-blue-50 border-blue-200 ring-1 ring-blue-200'
    : 'text-slate-600 bg-slate-50 border-slate-200';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs overflow-hidden">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 relative z-20 bg-white">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Régua Prática: O que acontece na cidade?
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lendo de baixo para cima, como o rio real.
          </p>
        </div>

        {trend && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${trendHeaderBadge}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{trendLabel}</span>
          </div>
        )}
      </div>

      {/* Lista da Régua */}
      <div className="flex flex-col relative">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest = idx === currentStageIdx;
          const isLast = idx === stages.length - 1; // 4.0m (Base)

          // Nível base deste segmento (o nível do próximo card para baixo)
          const nextStageLevel = !isLast ? stages[idx + 1].level : 3.0; // Fictício abaixo de 4m
          const topLevel = stage.level;
          const bottomLevel = nextStageLevel;
          const range = topLevel - bottomLevel;

          // % de água preenchida neste segmento (de baixo para cima)
          let segmentPercent = 0;
          if (currentLevel >= topLevel) {
            segmentPercent = 100; // Submerso
          } else if (currentLevel > bottomLevel) {
            segmentPercent = ((currentLevel - bottomLevel) / range) * 100; // Parcial
          }

          // Posicionar o marcador "Você está aqui" neste segmento?
          const showMarkerHere = (currentLevel > bottomLevel && currentLevel <= topLevel && !isLast) || (isLast && currentLevel <= topLevel);

          return (
            <div key={idx} className="relative flex items-stretch mb-6 last:mb-0">
              
              {/* Coluna Esquerda: Ponto e Linha conectora */}
              <div className="relative w-10 shrink-0">
                {/* 
                  A Linha/Tubo conectando este ponto ao ponto de baixo.
                  Como a margem inferior do item é 24px (mb-6) e o ponto está no top: 24px,
                  a linha deve descer 48px além do bottom deste container para encostar no próximo ponto.
                */}
                {!isLast && (
                  <div 
                    className="absolute w-2.5 left-1/2 -translate-x-1/2 z-0"
                    style={{ top: '24px', bottom: '-48px' }} 
                  >
                    {/* Tubo visual com overflow-hidden para conter o preenchimento da água */}
                    <div className="absolute inset-0 bg-slate-100 rounded-full shadow-inner overflow-hidden">
                      {/* Água (preenchendo de baixo para cima) */}
                      {segmentPercent > 0 && (
                        <div 
                          className="absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-700 ease-out shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                          style={{ height: `${segmentPercent}%` }}
                        >
                           {/* Efeito visual na água */}
                           <div className="absolute inset-0 opacity-20" style={{
                               backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.5) 4px, rgba(255,255,255,0.5) 8px)'
                           }} />
                        </div>
                      )}
                    </div>

                    {/* Marcador flutuante no nível exato da água neste tubo (fora do overflow-hidden) */}
                    {showMarkerHere && (
                      <div 
                         className="absolute w-full z-30 transition-all duration-700"
                         style={{ bottom: `${segmentPercent}%` }}
                      >
                          {/* Ícone flutuante centralizado na linha da água */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md border-[2.5px] border-blue-600 flex items-center justify-center animate-pulse">
                             {isRising && <TrendingUp className="w-3.5 h-3.5 text-blue-600" />}
                             {isFalling && <TrendingDown className="w-3.5 h-3.5 text-blue-600" />}
                             {!isRising && !isFalling && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                          </div>
                      </div>
                    )}
                  </div>
                )}

                {/* O Ponto Fixo do Estágio */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center"
                  style={{ top: '24px', marginTop: '-8px' }} // Centro do ponto em Y = 24px
                >
                  <div
                    style={{
                      backgroundColor: isReached ? stage.colorHex : '#cbd5e1',
                      borderColor: isReached ? '#fff' : '#f8fafc',
                    }}
                    className={`w-4 h-4 rounded-full border-[3px] shadow-sm transition-all duration-300
                      ${isCurrentNearest ? 'scale-[1.3] ring-4 ring-blue-500/30' : 'scale-100'}
                    `}
                  />
                </div>
              </div>

              {/* Coluna Direita: Cartão de Informações */}
              <div
                className={`flex-1 ml-2 p-4 rounded-xl border transition-all duration-300 relative z-10
                  ${isReached ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-slate-100 opacity-60'}
                  ${isCurrentNearest ? 'ring-2 ring-blue-500/20 shadow-md bg-white border-blue-200' : ''}
                `}
              >
                {/* Badge "VOCÊ ESTÁ AQUI" no card mais próximo */}
                {isCurrentNearest && (
                  <div className="absolute -top-2.5 right-4 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                    ATUAL
                  </div>
                )}

                {/* Header do card (Alinhado com o top: 24px do container -> center of text ~24px) */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-sm font-black text-slate-800">{stage.label}</span>
                  <span className="text-sm font-bold text-slate-700">{stage.name}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${stage.badgeColor}`}>
                    {stage.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">
                  {stage.desc}
                </p>

                {/* Impacto Imediato */}
                {isCurrentNearest && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex gap-2">
                    <span className="text-blue-500 mt-0.5">⚡</span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong className="font-semibold">O que esperar:</strong> {stage.impact}
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
