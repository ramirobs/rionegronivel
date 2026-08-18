'use client';

import React from 'react';

interface MiniSparklineProps {
  data: { level: number; date?: string }[];
  height?: number;
  width?: number;
  strokeColor?: string;
}

export default function MiniSparkline({
  data,
  height = 36,
  width = 140,
  strokeColor = '#0284c7',
}: MiniSparklineProps) {
  if (!data || data.length < 2) return null;

  // Pega até os últimos 24 pontos
  const points = data.slice(-24);
  const levels = points.map((p) => p.level);
  const min = Math.min(...levels);
  const max = Math.max(...levels);
  const range = max - min || 0.1;

  const padding = 4;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const coordinates = points.map((p, idx) => {
    const x = padding + (idx / (points.length - 1)) * usableWidth;
    const y = height - padding - ((p.level - min) / range) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coordinates.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          {/* Sombra / Área */}
          <path d={areaD} fill="url(#sparklineGrad)" />
          {/* Linha */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Ponto final (atual) */}
          {coordinates.length > 0 && (
            <circle
              cx={coordinates[coordinates.length - 1].split(',')[0]}
              cy={coordinates[coordinates.length - 1].split(',')[1]}
              r={3}
              fill={strokeColor}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          )}
        </svg>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
        Últimas 24h
      </span>
    </div>
  );
}
