import { Droplet, Waves, CloudRain, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AggravatingFactorsCardProps {
  precip7Days: number;
  soilMoisture?: number; // 0 a 1
  upstreamTrendRate?: number; // m/h
}

export default function AggravatingFactorsCard({
  precip7Days,
  soilMoisture = 0.25,
  upstreamTrendRate = 0,
}: AggravatingFactorsCardProps) {
  
  // Avaliação da Chuva
  const rainSeverity = precip7Days > 100 ? 'Alto' : precip7Days > 40 ? 'Médio' : 'Baixo';
  const rainColor = precip7Days > 100 ? 'text-rose-600 bg-rose-50' : precip7Days > 40 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  // Avaliação do Solo
  const soilPercent = Math.round(soilMoisture * 100);
  const soilSeverity = soilMoisture > 0.35 ? 'Crítico (Saturado)' : soilMoisture > 0.25 ? 'Atenção' : 'Seguro (Absorvendo)';
  const soilColor = soilMoisture > 0.35 ? 'text-rose-600 bg-rose-50' : soilMoisture > 0.25 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  // Avaliação de Montante (Cabeceiras - Fragosos / Piên)
  const upstreamSeverity =
    upstreamTrendRate > 0.05
      ? 'Risco Alto'
      : upstreamTrendRate > 0.01
      ? 'Atenção'
      : upstreamTrendRate < -0.01
      ? 'Vazante'
      : 'Estável';

  const upstreamColor =
    upstreamTrendRate > 0.05
      ? 'text-rose-600 bg-rose-50'
      : upstreamTrendRate > 0.01
      ? 'text-amber-600 bg-amber-50'
      : upstreamTrendRate < -0.01
      ? 'text-sky-600 bg-sky-50'
      : 'text-emerald-600 bg-emerald-50';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert className="h-5 w-5 text-slate-700" />
        <h3 className="text-base font-bold text-slate-900">
          Fatores Agravantes do Modelo
        </h3>
      </div>
      
      <p className="text-xs text-slate-500 font-medium mb-6">
        Estes são os sensores físicos que nosso algoritmo monitora para prever enchentes com precisão:
      </p>

      <div className="space-y-4">
        {/* Fator 1: Chuva */}
        <div className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
          <div className={cn("p-2.5 rounded-lg", rainColor)}>
            <CloudRain className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-800">Chuva Prevista (7 dias)</span>
              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", rainColor)}>
                {rainSeverity}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{precip7Days.toFixed(1)} mm</strong> previstos para a bacia.
            </p>
          </div>
        </div>

        {/* Fator 2: Solo */}
        <div className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
          <div className={cn("p-2.5 rounded-lg", soilColor)}>
            <Droplet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-800">Saturação do Solo</span>
              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", soilColor)}>
                {soilSeverity}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              <strong className="text-slate-900">{soilPercent}% de umidade.</strong> {soilMoisture > 0.35 ? 'A terra não consegue absorver mais água; chuva vira enxurrada.' : 'A terra ainda tem capacidade de absorver o impacto da chuva.'}
            </p>
          </div>
        </div>

        {/* Fator 3: Montante */}
        <div className="flex items-start gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
          <div className={cn("p-2.5 rounded-lg", upstreamColor)}>
            <Waves className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-bold text-slate-800">Onda de Cheia (Montante)</span>
              <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-md", upstreamColor)}>
                {upstreamSeverity}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Rio Negro nas cabeceiras (Fragosos / Piên) está{' '}
              {upstreamTrendRate > 0.01 ? (
                <>subindo a <strong className="text-slate-900">+{(upstreamTrendRate * 100).toFixed(1)} cm/h</strong>.</>
              ) : upstreamTrendRate < -0.01 ? (
                <>em vazante, descendo a <strong className="text-slate-900">{(Math.abs(upstreamTrendRate) * 100).toFixed(1)} cm/h</strong>.</>
              ) : (
                <>estável variando <strong className="text-slate-900">{(upstreamTrendRate * 100).toFixed(1)} cm/h</strong>.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
