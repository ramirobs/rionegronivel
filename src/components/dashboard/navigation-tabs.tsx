'use client';

import React from 'react';
import {
  Activity,
  CloudRain,
  BarChart3,
  ShieldAlert,
  Map as MapIcon,
} from 'lucide-react';
import type { RiskLevel } from '@/lib/constants';

export type TabId = 'live' | 'forecast' | 'history' | 'emergency';

interface NavigationTabsProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  riskLevel?: RiskLevel;
}

interface TabItem {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  highlightEmergency?: boolean;
}

export default function NavigationTabs({
  activeTab,
  onSelectTab,
  riskLevel = 'normal',
}: NavigationTabsProps) {
  const isElevatedRisk = riskLevel !== 'normal';
  const isRed = riskLevel === 'emergency';

  const tabs: TabItem[] = [
    {
      id: 'live',
      label: 'Ao Vivo',
      shortLabel: 'Ao Vivo',
      icon: Activity,
    },
    {
      id: 'forecast',
      label: 'Previsão 7 Dias',
      shortLabel: 'Previsão',
      icon: CloudRain,
    },
    {
      id: 'history',
      label: 'Histórico & Dados',
      shortLabel: 'Histórico',
      icon: BarChart3,
    },
  ];

  if (isElevatedRisk) {
    tabs.push({
      id: 'emergency',
      label: 'Emergência & Contatos',
      shortLabel: 'Emergência',
      icon: ShieldAlert,
      highlightEmergency: true,
    });
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. Desktop & Tablet Top Navigation Bar (Segmented Pills Sticky)          */}
      {/* ========================================================================= */}
      <div className="hidden md:block sticky top-[61px] z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-2 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80 mb-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          <nav
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-full sm:w-auto"
            aria-label="Navegação do Painel"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              const isEmergencyTab = tab.id === 'emergency';
              const emergencyColorClass = riskLevel === 'attention' ? 'text-yellow-500' : riskLevel === 'alert' ? 'text-orange-500' : 'text-rose-500';
              const emergencyBgClass = riskLevel === 'attention' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : riskLevel === 'alert' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-rose-100 text-rose-800 border-rose-200';
              const emergencyBadgeText = riskLevel === 'attention' ? 'ATENÇÃO' : riskLevel === 'alert' ? 'ALERTA' : 'EMERGÊNCIA';

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onSelectTab(tab.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  type="button"
                  className={`relative flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer whitespace-nowrap select-none flex-1 sm:flex-initial ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-sm shadow-slate-300/50 scale-[1.01]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-blue-600'
                        : tab.highlightEmergency
                        ? `${emergencyColorClass} animate-[pulse_3s_ease-in-out_infinite]`
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>

                  {tab.id === 'live' && (
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}

                  {tab.highlightEmergency && isEmergencyTab && (
                    <span className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black border ${emergencyBgClass}`}>
                      {emergencyBadgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Mobile Bottom Navigation Bar (Fixed Native-App Style)                  */}
      {/* ========================================================================= */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-1 pt-1.5 pb-safe md:hidden flex items-center justify-between"
        aria-label="Navegação Mobile"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          const isEmergencyTab = tab.id === 'emergency';
          const emergencyColorClass = riskLevel === 'attention' ? 'text-yellow-500' : riskLevel === 'alert' ? 'text-orange-500' : 'text-rose-500';
          const pingColorClass = riskLevel === 'attention' ? 'bg-yellow-400' : riskLevel === 'alert' ? 'bg-orange-400' : 'bg-rose-400';
          const dotColorClass = riskLevel === 'attention' ? 'bg-yellow-500' : riskLevel === 'alert' ? 'bg-orange-500' : 'bg-rose-600';

          return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                type="button"
              className={`relative flex-1 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 font-medium'
              }`}
            >
              <div
                className={`relative p-1 rounded-full transition-all ${
                  isActive ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? 'text-blue-600'
                      : tab.highlightEmergency
                      ? `${emergencyColorClass} animate-[pulse_3s_ease-in-out_infinite]`
                      : 'text-slate-500'
                  }`}
                />
                {tab.id === 'live' && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
                {tab.highlightEmergency && isEmergencyTab && (
                  <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pingColorClass} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColorClass}`} />
                  </span>
                )}
              </div>
              <span className="text-[9.5px] tracking-tighter leading-tight mt-0.5 truncate w-full text-center">
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
