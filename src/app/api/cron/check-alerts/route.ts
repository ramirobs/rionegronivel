import { NextResponse } from 'next/server';
import { fetchTelemetricData, fetchHistoricalData } from '@/lib/ana-api';
import { cleanRiverData, calculateTrend, getLatestReading } from '@/lib/data-processing';
import { PRIMARY_STATION } from '@/lib/constants';
import { broadcastAlert, type PushPayload } from '@/lib/push-service';
import { getAllSubscriptions } from '@/lib/push-storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatAnaDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function GET(request: Request) {
  try {
    // Proteção: aceita chamadas da Vercel Cron (header) OU de serviço externo (query param)
    const isVercelCron = request.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`;
    const url = new URL(request.url);
    const isExternalCron = url.searchParams.get('key') === process.env.CRON_SECRET;

    if (process.env.CRON_SECRET && !isVercelCron && !isExternalCron) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // 1. Busca leituras mais recentes da telemetria da ANA
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000); // Últimos 2 dias

    const startStr = formatAnaDate(startDate);
    const endStr = formatAnaDate(endDate);

    let rawData = await fetchTelemetricData(PRIMARY_STATION.code, startStr, endStr);
    if (rawData.length === 0) {
      rawData = await fetchHistoricalData(PRIMARY_STATION.code, '1', startStr, endStr);
    }

    const cleanedRiver = cleanRiverData(rawData);
    const latestReading = getLatestReading(cleanedRiver);
    const trend = calculateTrend(cleanedRiver);

    const currentLevel = latestReading ? latestReading.level : 0;
    const trendRate = trend ? trend.rateOfChange : 0;

    const subscriptions = await getAllSubscriptions();

    // Se o nível for muito baixo ou normal sem subida rápida, não dispara alertas gerais
    let alertPayload: PushPayload | null = null;

    if (currentLevel >= 7.0) {
      alertPayload = {
        title: '🔴 EMERGÊNCIA: Cota de Enchente Atingida!',
        body: `O Rio Negro atingiu ${currentLevel.toFixed(2)} m. Ruas ribeirinhas estão alagadas em Rio Negro e Mafra.`,
        level: currentLevel,
        type: 'emergency',
        tag: 'flood-emergency-alert',
      };
    } else if (currentLevel >= 6.0) {
      alertPayload = {
        title: '🟠 ALERTA: Rio Negro em 6,00 m',
        body: `O rio atingiu a cota de alerta (${currentLevel.toFixed(2)} m). Várzeas e ruas baixas em atenção.`,
        level: currentLevel,
        type: 'alert',
        tag: 'flood-warning-alert',
      };
    } else if (trend && trend.direction === 'rising' && trendRate >= 10) {
      alertPayload = {
        title: '⚡ SUBIDA RÁPIDA DO RIO NEGRO',
        body: `O nível está subindo a +${trendRate.toFixed(1)} cm/h (cota atual: ${currentLevel.toFixed(2)} m).`,
        level: currentLevel,
        type: 'fast_rise',
        tag: 'flood-fast-rise-alert',
      };
    } else if (currentLevel >= 5.0) {
      alertPayload = {
        title: '🟡 ATENÇÃO: Nível do Rio Elevado',
        body: `O Rio Negro atingiu ${currentLevel.toFixed(2)} m. Parques e áreas mais baixas da orla com água.`,
        level: currentLevel,
        type: 'attention',
        tag: 'flood-attention-alert',
      };
    }

    let broadcastResult = { total: subscriptions.length, sent: 0, failed: 0 };

    if (alertPayload && subscriptions.length > 0) {
      broadcastResult = await broadcastAlert(alertPayload);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      station: PRIMARY_STATION.name,
      currentLevel,
      trendDirection: trend?.direction || 'stable',
      trendRate,
      activeSubscriptions: subscriptions.length,
      alertTriggered: alertPayload ? alertPayload.title : null,
      delivery: broadcastResult,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Falha ao executar rotina de monitoramento';
    console.error('[API Cron Check-Alerts] Erro na rotina:', errorMessage);
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
