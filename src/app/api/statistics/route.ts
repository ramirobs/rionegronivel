import { NextResponse } from 'next/server';
import {
  calculateGumbel,
  generateReturnPeriodTable,
  type ReturnPeriodRow,
  type GumbelParameters,
} from '@/lib/statistics';
import {
  HISTORICAL_ANNUAL_MAXIMA,
  type HistoricalAnnualMax,
} from '@/data/historical-annual-maxima';
import { fetchTelemetricData } from '@/lib/ana-api';
import { cleanRiverData, getMaxByYear } from '@/lib/data-processing';
import { PRIMARY_STATION } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export interface StatisticsApiResponse {
  returnPeriodTable: ReturnPeriodRow[];
  annualMaxima: { year: number; maxLevel: number; date?: string; isFlood?: boolean }[];
  gumbelParams: GumbelParameters;
  metadata?: {
    totalYears: number;
    analyzedYears: number;
    startYear: number;
    endYear: number;
    source: string;
  };
}

export async function GET() {
  try {
    // 1. Carrega a série histórica consolidada local (1930 a 2025)
    const annualList: HistoricalAnnualMax[] = [...HISTORICAL_ANNUAL_MAXIMA];

    // 2. Tenta obter medições do ano corrente (2026) via telemetria leve da ANA
    const currentYear = new Date().getFullYear();
    try {
      const today = new Date();
      const startOfYear = new Date(currentYear, 0, 1);
      const startStr = `${String(startOfYear.getDate()).padStart(2, '0')}/${String(startOfYear.getMonth() + 1).padStart(2, '0')}/${currentYear}`;
      const endStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${currentYear}`;

      const telemetry2026 = await fetchTelemetricData(PRIMARY_STATION.code, startStr, endStr);
      const cleaned = cleanRiverData(telemetry2026);
      if (cleaned.length > 0) {
        const max2026 = getMaxByYear(cleaned).find((item) => item.year === currentYear);
        if (max2026 && max2026.maxLevel > 0) {
          // Atualiza ou insere o ano atual na série
          const existingIdx = annualList.findIndex((item) => item.year === currentYear);
          const currentEntry: HistoricalAnnualMax = {
            year: currentYear,
            maxLevel: max2026.maxLevel,
            date: max2026.date,
            isFlood: max2026.maxLevel >= 6.0,
          };
          if (existingIdx >= 0) {
            annualList[existingIdx] = currentEntry;
          } else {
            annualList.push(currentEntry);
          }
        }
      }
    } catch {
      // Falha silenciosa na telemetria de 2026: a base histórica 1930-2025 garante o cálculo perfeito
    }

    // 3. Filtra a janela recente (a partir de 1990) conforme recomendação metodológica (John, 2021)
    const recentMaxima = annualList.filter((item) => item.year >= 1990);
    const seriesToFit = recentMaxima.length >= 5 ? recentMaxima : annualList;

    // 4. Ajuste da Distribuição de Gumbel e cálculo dos Períodos de Retorno
    const gumbelParams = calculateGumbel(seriesToFit);
    const returnPeriodTable = generateReturnPeriodTable(seriesToFit);

    const responseData: StatisticsApiResponse = {
      returnPeriodTable,
      annualMaxima: seriesToFit.map((item) => ({
        year: item.year,
        maxLevel: item.maxLevel,
        date: item.date,
        isFlood: item.isFlood,
      })),
      gumbelParams,
      metadata: {
        totalYears: annualList.length,
        analyzedYears: seriesToFit.length,
        startYear: seriesToFit[0]?.year ?? 1990,
        endYear: seriesToFit[seriesToFit.length - 1]?.year ?? currentYear,
        source: 'Série Consolidada CPRM/ANA/IAT (John, 2021) + Telemetria 65100001',
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API statistics] Erro inesperado no cálculo estatístico:', error);

    // Fallback de emergência garantido pela base local
    const fallbackList = HISTORICAL_ANNUAL_MAXIMA.filter((item) => item.year >= 1990);
    const gumbelParams = calculateGumbel(fallbackList);
    const returnPeriodTable = generateReturnPeriodTable(fallbackList);

    return NextResponse.json({
      returnPeriodTable,
      annualMaxima: fallbackList,
      gumbelParams,
    });
  }
}

