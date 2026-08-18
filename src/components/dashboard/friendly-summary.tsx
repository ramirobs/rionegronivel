'use client';

import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ArrowDownRight, ArrowUpRight, Minus, PhoneCall } from 'lucide-react';
import type { RiskLevel } from '@/lib/constants';

interface FriendlySummaryProps {
  level: number;
  trend: {
    rate: number;
    direction: 'rising' | 'stable' | 'falling';
  };
  precip24h: number;
  riskLevel: RiskLevel;
}

export default function FriendlySummary({
  level,
  trend,
  precip24h,
  riskLevel,
}: FriendlySummaryProps) {
  // Distância para a cota de emergência/inundação (7.0m)
  const distanceToFlood = 7.0 - level;
  const isFlooded = level >= 7.0;

  // Textos explicativos em linguagem popular
  const statusInfo = {
    normal: {
      title: 'Rio em Situação Tranquila',
      subtitle: 'Sem qualquer risco de enchente no momento.',
      badge: 'Normal / Seguro',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      boxBg: 'bg-emerald-50/70 border-emerald-200',
      advice: 'Pode seguir a rotina normalmente. Não há previsão de inundação.',
    },
    attention: {
      title: 'Rio Elevado — Fique Atento',
      subtitle: 'A água subiu nas margens, mas ainda não atinge residências.',
      badge: 'Estado de Atenção',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: Info,
      iconColor: 'text-amber-600',
      boxBg: 'bg-amber-50/70 border-amber-200',
      advice: 'Moradores de áreas ribeirinhas devem acompanhar as notícias e boletins.',
    },
    alert: {
      title: 'Risco de Alagamento em Áreas Baixas',
      subtitle: 'O rio está muito cheio e pode começar a invadir ruas mais baixas.',
      badge: 'Estado de Alerta',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      boxBg: 'bg-orange-50/70 border-orange-200',
      advice: 'Recomenda-se levantar móveis em áreas baixas e guardar documentos importantes.',
    },
    emergency: {
      title: 'Enchente em Andamento!',
      subtitle: 'A água ultrapassou a cota crítica e já atinge casas e comércios.',
      badge: 'EMERGÊNCIA / ENCHENTE',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
      icon: ShieldAlert,
      iconColor: 'text-rose-600',
      boxBg: 'bg-rose-50/90 border-rose-300',
      advice: 'Evacue áreas de risco imediatamente e procure abrigo seguro ou a Defesa Civil.',
    },
  }[riskLevel];

  const StatusIcon = statusInfo.icon;

  return (
    <div className={`rounded-2xl border p-5 sm:p-6 shadow-xs ${statusInfo.boxBg} transition-all`}>
      {/* Header com Ícone e Título Amigável */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white shadow-xs">
            <StatusIcon className={`h-7 w-7 ${statusInfo.iconColor}`} />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block">
              Diagnóstico Direto
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {statusInfo.title}
            </h2>
          </div>
        </div>

        <span
          className={`self-start sm:self-center px-3.5 py-1 rounded-full text-xs font-black border ${statusInfo.badgeClass}`}
        >
          {statusInfo.badge}
        </span>
      </div>

      {/* 3 Cartões de Resumo Prático */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {/* Cartão 1: O Nível e o Espaço que resta */}
        <div className="bg-white/90 p-4 rounded-xl border border-black/5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">Nível do Rio</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {level.toFixed(2)} m
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {isFlooded ? (
              <span className="text-rose-600 font-bold">
                ⚠️ {(level - 7.0).toFixed(2)}m acima da cota de enchente
              </span>
            ) : (
              <span>
                Faltam <strong className="text-slate-900 font-bold">{distanceToFlood.toFixed(2)}m</strong> para transbordar (7m)
              </span>
            )}
          </p>
        </div>

        {/* Cartão 2: Tendência (Subindo ou Descendo?) */}
        <div className="bg-white/90 p-4 rounded-xl border border-black/5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">Comportamento das Águas</span>
          <div className="flex items-center gap-2 mt-1">
            {trend.direction === 'falling' && (
              <span className="inline-flex items-center text-emerald-700 font-black text-lg">
                <ArrowDownRight className="h-6 w-6 mr-0.5" /> Baixando
              </span>
            )}
            {trend.direction === 'rising' && (
              <span className="inline-flex items-center text-rose-700 font-black text-lg">
                <ArrowUpRight className="h-6 w-6 mr-0.5" /> Subindo
              </span>
            )}
            {trend.direction === 'stable' && (
              <span className="inline-flex items-center text-slate-700 font-black text-lg">
                <Minus className="h-6 w-6 mr-0.5" /> Parado / Estável
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {trend.direction === 'rising'
              ? `Subindo a cerca de ${(trend.rate * 100).toFixed(1)} cm a cada hora.`
              : trend.direction === 'falling'
              ? `Baixando a cerca de ${Math.abs(trend.rate * 100).toFixed(1)} cm por hora.`
              : 'O nível praticamente não se alterou nas últimas horas.'}
          </p>
        </div>

        {/* Cartão 3: Chuva Recente */}
        <div className="bg-white/90 p-4 rounded-xl border border-black/5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 block">Chuva nas Últimas 24h</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {precip24h.toFixed(1)} mm
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            {precip24h === 0
              ? '☀️ Sem chuva recente na bacia do rio.'
              : precip24h < 15
              ? '🌦️ Chuva leve, baixo impacto no nível.'
              : precip24h < 40
              ? '🌧️ Chuva moderada, pode elevar o rio.'
              : '⛈️ Chuva pesada! Alerta para subida rápida.'}
          </p>
        </div>
      </div>

      {/* Orientação Prática / O que fazer agora? */}
      <div className="mt-4 p-3.5 rounded-xl bg-white/80 border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <span className="font-black text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded-md text-[11px] uppercase">
            Orientação
          </span>
          <p className="text-slate-700 font-medium">{statusInfo.advice}</p>
        </div>

        <a
          href="tel:199"
          className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors shrink-0"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          Ligar Defesa Civil (199)
        </a>
      </div>
    </div>
  );
}
