import { NextResponse } from 'next/server';
import { sendPushToSubscription, broadcastAlert } from '@/lib/push-service';
import { getAllSubscriptions, type StoredSubscription } from '@/lib/push-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subscriptions = await getAllSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum dispositivo registrado para receber alertas ainda. Abra o app no celular e clique em "Ativar Alertas" no painel.',
        subscriptionsCount: 0,
      });
    }

    const result = await broadcastAlert({
      title: '🚨 Teste de Alerta — Nível Rio Negro',
      body: 'Servidor de alertas ativo! Teste de transmissão para celulares de RioMafra.',
      url: '/',
      tag: 'test-push-alert',
      type: 'test',
    });

    return NextResponse.json({
      success: true,
      message: `Teste enviado para ${result.sent} de ${result.total} dispositivos inscritos!`,
      result,
    });
  } catch (error) {
    console.error('[API test push GET] Erro:', error);
    return NextResponse.json({ error: 'Falha interna ao disparar notificação de teste' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { subscription, level = 5.99 } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      const result = await broadcastAlert({
        title: '🚨 Teste de Alerta — Nível Rio Negro',
        body: `Servidor de alertas ativo! O nível do Rio Negro está em ${Number(level).toFixed(2)} m.`,
        url: '/',
        tag: 'test-push-alert',
        type: 'test',
      });

      return NextResponse.json({
        success: true,
        message: `Notificação enviada para ${result.sent} dispositivos.`,
        result,
      });
    }

    const testSub: StoredSubscription = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      preferences: {
        alertAttention: true,
        alertAlert: true,
        alertEmergency: true,
        alertFastRise: true,
      },
      createdAt: new Date().toISOString(),
    };

    const success = await sendPushToSubscription(testSub, {
      title: '🚨 Teste de Alerta — Nível Rio Negro',
      body: `Conexão direta com o servidor ativa! O nível do rio está em ${Number(level).toFixed(2)} m.`,
      url: '/',
      tag: 'test-push-alert',
      type: 'test',
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notificação Web Push enviada com sucesso pelo servidor!',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Servidor tentou enviar, mas o serviço de push do navegador recusou.',
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[API test push POST] Erro ao enviar teste:', error);
    return NextResponse.json(
      { error: 'Falha interna ao disparar notificação de teste' },
      { status: 500 }
    );
  }
}
