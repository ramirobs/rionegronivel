'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { MapPin } from 'lucide-react';

const FloodMapClient = dynamic(() => import('./flood-map-client'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-28 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-center gap-2">
        <div className="h-5 w-64 bg-slate-200 rounded-md" />
        <div className="h-3 w-96 bg-slate-100 rounded-md" />
      </div>
      <div className="h-[550px] sm:h-[620px] bg-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-300">
        <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <MapPin className="h-4 w-4 text-blue-600" />
          <span>Carregando Mapa da Mancha de Inundação (RioMafra)...</span>
        </div>
      </div>
    </div>
  ),
});

interface FloodMapProps {
  currentLevel: number;
}

export default function FloodMap({ currentLevel }: FloodMapProps) {
  return <FloodMapClient currentLevel={currentLevel} />;
}
