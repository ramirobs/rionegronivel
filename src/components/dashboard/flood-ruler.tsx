'use client';

import { Waves, Home, AlertOctagon, ShieldCheck, Footprints } from 'lucide-react';

interface FloodRulerProps {
  currentLevel: number;
}

export default function FloodRuler({ currentLevel }: FloodRulerProps) {
  // Marcos conhecidos das cheias em Rio Negro e Mafra
  const stages = [
    {
      level: 4.0,
      label: '4.00 m',
      name: 'Leito Normal',
      status: 'Normal',
      desc: 'Rio corre normalmente no canal. Margens livres.',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: ShieldCheck,
    },
    {
      level: 5.0,
      label: '5.00 m',
      name: 'Início de Atenção',
      status: 'Atenção',
      desc: 'Água atinge áreas mais baixas da orla e parques ribeirinhos.',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Waves,
    },
    {
      level: 6.0,
      label: '6.00 m',
      name: 'Cota de Alerta',
      status: 'Alerta',
      desc: 'Várzeas alagam; primeiras ruas baixas (ex: entorno da Ponte Metálica) em vigilância.',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: Footprints,
    },
    {
      level: 7.0,
      label: '7.00 m',
      name: 'Primeiras Residências Atingidas',
      status: 'Enchente',
      desc: 'Água invade residências e comércios ribeirinhos em Mafra e Rio Negro.',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: Home,
    },
    {
      level: 8.5,
      label: '8.50 m',
      name: 'Enchente Grave',
      status: 'Crítico',
      desc: 'Bloqueio de vias centrais, pontes e desabrigados (ex: Cheia de 2022).',
      badgeColor: 'bg-red-200 text-red-900 border-red-400',
      icon: AlertOctagon,
    },
    {
      level: 11.2,
      label: '11.20 m',
      name: 'Cheia Histórica (Out/2023)',
      status: 'Histórico',
      desc: 'Maior cheia dos últimos 30 anos. Grande parte das duas cidades submersa.',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300',
      icon: AlertOctagon,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-900">
          Régua Prática: O que acontece na cidade?
        </h3>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Veja os pontos de alagamento conhecidos em Rio Negro e Mafra conforme a altura da água
        </p>
      </div>

      {/* Lista visual dos estágios */}
      <div className="space-y-3">
        {stages.map((stage, idx) => {
          const isReached = currentLevel >= stage.level;
          const isCurrentNearest =
            currentLevel >= stage.level &&
            (idx === stages.length - 1 || currentLevel < stages[idx + 1].level);

          const StageIcon = stage.icon;

          return (
            <div
              key={idx}
              className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                isCurrentNearest
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                  : isReached
                  ? 'bg-slate-50/90 border-slate-200'
                  : 'bg-white border-slate-150 opacity-70'
              }`}
            >
              {/* Indicador de Nível à Esquerda */}
              <div className="flex flex-col items-center justify-center min-w-[58px] p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                <span className="text-xs font-black text-slate-900">{stage.label}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Cota</span>
              </div>

              {/* Conteúdo Explicativo */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{stage.name}</span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${stage.badgeColor}`}
                  >
                    {stage.status}
                  </span>

                  {isCurrentNearest && (
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md ml-auto animate-pulse">
                      📍 NÍVEL ATUAL DO RIO
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 font-medium mt-1">{stage.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
