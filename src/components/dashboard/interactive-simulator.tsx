'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CloudRain, AlertTriangle, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

interface InteractiveSimulatorProps {
  currentLevel: number;
  onSimulate?: (simulatedLevel: number | null) => void;
}

export default function InteractiveSimulator({ currentLevel, onSimulate }: InteractiveSimulatorProps) {
  const [rainScenario, setRainScenario] = useState<number>(0); // mm adicionais de chuva
  const [extraLevel, setExtraLevel] = useState<number>(0); // metros adicionais de elevação manual

  // Estimativa hidrológica simplificada para a Bacia do Rio Negro:
  // Cada ~25mm de chuva acumulada na bacia eleva o rio em cerca de ~0.8m a 1.2m
  const estimatedRiseFromRain = (rainScenario / 25) * 0.9;
  const simulatedLevel = Number((currentLevel + estimatedRiseFromRain + extraLevel).toFixed(2));

  // Avisa o componente pai quando a simulação está ativa ou resetada
  useEffect(() => {
    if (onSimulate) {
      if (rainScenario > 0 || extraLevel > 0) {
        onSimulate(simulatedLevel);
      } else {
        onSimulate(null);
      }
    }
  }, [simulatedLevel, rainScenario, extraLevel, onSimulate]);

  // Diagnóstico do cenário simulado
  const getSimulatedStatus = (lvl: number) => {
    if (lvl < 5.0) {
      return {
        label: 'Normal',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        impact: 'Sem impacto urbano. As águas permanecem no leito natural.',
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
      };
    }
    if (lvl < 6.0) {
      return {
        label: 'Atenção',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        impact: 'Margens inundadas. Parques e orlas com água acumulada.',
        icon: AlertTriangle,
        iconColor: 'text-amber-600',
      };
    }
    if (lvl < 7.0) {
      return {
        label: 'Alerta',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        impact: 'Água atinge ruas baixas e várzeas. Trânsito pode ser desviado.',
        icon: AlertTriangle,
        iconColor: 'text-orange-600',
      };
    }
    if (lvl < 8.5) {
      return {
        label: 'Enchente Moderada',
        badge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        impact: 'Invasão de residências ribeirinhas em Mafra e Rio Negro. Famílias desabrigadas.',
        icon: AlertTriangle,
        iconColor: 'text-rose-600',
      };
    }
    return {
      label: 'ENCHENTE GRAVE / HISTÓRICA',
      badge: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
      impact: 'Bloqueio de pontes, vias centrais e inundação em larga escala.',
      icon: AlertTriangle,
      iconColor: 'text-purple-600',
    };
  };

  const status = getSimulatedStatus(simulatedLevel);
  const StatusIcon = status.icon;

  const resetSimulation = () => {
    setRainScenario(0);
    setExtraLevel(0);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/80 via-white to-slate-50 rounded-2xl border border-blue-200/80 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Simulador Interativo: &quot;E se chover mais?&quot;
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Simule cenários de chuva e veja a previsão de impacto nas cidades
            </p>
          </div>
        </div>

        {(rainScenario > 0 || extraLevel > 0) && (
          <button
            onClick={resetSimulation}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Resetar
          </button>
        )}
      </div>

      {/* Seletor Rápido de Cenários */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Escolha um Cenário de Chuva Prevista na Bacia:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Sem Chuva', rain: 0, desc: '0 mm' },
              { label: 'Chuva Moderada', rain: 30, desc: '+30 mm' },
              { label: 'Chuva Forte', rain: 60, desc: '+60 mm' },
              { label: 'Temporal Severo', rain: 110, desc: '+110 mm' },
            ].map((btn) => (
              <button
                key={btn.rain}
                onClick={() => {
                  setRainScenario(btn.rain);
                  setExtraLevel(0);
                }}
                className={`p-3 rounded-xl text-left border transition-all ${
                  rainScenario === btn.rain && extraLevel === 0
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{btn.label}</span>
                  <CloudRain className={`h-4 w-4 ${rainScenario === btn.rain ? 'text-white' : 'text-blue-500'}`} />
                </div>
                <span className={`text-[11px] font-medium block mt-1 ${rainScenario === btn.rain ? 'text-blue-100' : 'text-slate-400'}`}>
                  {btn.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resultado da Simulação */}
        <div className="mt-5 p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Previsão Simulada
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {simulatedLevel.toFixed(2)} m
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  (Nível atual: {currentLevel.toFixed(2)}m{' '}
                  {simulatedLevel > currentLevel && (
                    <strong className="text-rose-600 font-bold">
                      +{(simulatedLevel - currentLevel).toFixed(2)}m
                    </strong>
                  )}
                  )
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${status.iconColor}`} />
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${status.badge}`}>
                {status.label}
              </span>
            </div>
          </div>

          <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-start gap-2.5">
            <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              <strong className="text-slate-900 font-bold">O que esperar: </strong>
              {status.impact}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
