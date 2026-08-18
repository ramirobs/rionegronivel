'use client';

import { useMemo } from 'react';

interface RiskGaugeProps {
  level: number;
  maxLevel?: number;
}

export default function RiskGauge({ level, maxLevel = 10 }: RiskGaugeProps) {
  // SVG properties
  const size = 280;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  // Calculate percentage of max level (clamped to 0-1)
  const percentage = Math.min(Math.max(level / maxLevel, 0), 1);

  // Calculate needle angle (-90 to +90 degrees)
  const angle = useMemo(() => {
    return -90 + percentage * 180;
  }, [percentage]);

  // Define zones based on limits (0-5, 5-6, 6-7, 7-10)
  const zones = [
    { name: 'Normal', max: 5, color: '#10b981', textColor: 'text-emerald-600', risk: 'normal' },
    { name: 'Atenção', max: 6, color: '#f59e0b', textColor: 'text-amber-600', risk: 'attention' },
    { name: 'Alerta', max: 7, color: '#f97316', textColor: 'text-orange-600', risk: 'alert' },
    { name: 'Emergência', max: maxLevel, color: '#ef4444', textColor: 'text-rose-600', risk: 'emergency' },
  ];

  // Helper to generate SVG arcs
  const createArc = (startVal: number, endVal: number) => {
    const startPercent = startVal / maxLevel;
    const endPercent = endVal / maxLevel;

    const startAngle = Math.PI + startPercent * Math.PI;
    const endAngle = Math.PI + endPercent * Math.PI;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
  };

  const currentZone = zones.find((z) => level <= z.max) || zones[zones.length - 1];

  return (
    <div className="flex flex-col items-center justify-center p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/90 shadow-sm w-full h-full">
      <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
        Termômetro de Risco
      </h3>

      <div className="relative w-full max-w-[260px] aspect-[2/1] overflow-hidden my-1">
        <svg viewBox={`0 0 ${size} ${size / 2}`} className="w-full h-full overflow-visible">
          {/* Background tracks */}
          {zones.map((zone, i) => {
            const startVal = i === 0 ? 0 : zones[i - 1].max;
            return (
              <path
                key={zone.name}
                d={createArc(startVal, zone.max)}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                className="opacity-25"
              />
            );
          })}

          {/* Foreground tracks (filled up to current level) */}
          {zones.map((zone, i) => {
            const startVal = i === 0 ? 0 : zones[i - 1].max;
            if (level <= startVal) return null;
            const fillEndVal = Math.min(level, zone.max);
            return (
              <path
                key={`filled-${zone.name}`}
                d={createArc(startVal, fillEndVal)}
                fill="none"
                stroke={zone.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
              />
            );
          })}

          {/* Needle Base */}
          <circle cx={center} cy={center} r={10} fill="#0f172a" />
          <circle cx={center} cy={center} r={4} fill="#ffffff" />

          {/* Needle */}
          <g
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <polygon
              points={`${center - 3.5},${center} ${center + 3.5},${center} ${center},${strokeWidth + 6}`}
              fill="#0f172a"
            />
          </g>
        </svg>

        {/* Labels at ends */}
        <div className="absolute bottom-0 left-1 text-[11px] font-bold text-slate-400">0m</div>
        <div className="absolute bottom-0 right-1 text-[11px] font-bold text-slate-400">{maxLevel}m</div>
      </div>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {level.toFixed(2)}
          <span className="text-xl sm:text-2xl text-slate-400 font-bold ml-1">m</span>
        </span>
        <span
          className={`text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-1 ${currentZone.textColor} bg-slate-100 border border-slate-200`}
        >
          {currentZone.name}
        </span>
      </div>
    </div>
  );
}
