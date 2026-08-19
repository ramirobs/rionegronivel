import { NextResponse } from 'next/server';
import { sendPushToSubscription } from '@/lib/push-service';
import type { StoredSubscription } from '@/lib/push-storage';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, level = 5.99 } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Assinatura inválida para envio de teste' },
        { status: 400 }
      );
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
    console.error('[API test push] Erro ao enviar teste:', error);
    return NextResponse.json(
      { error: 'Falha interna ao disparar notificação de teste' },
      { status: 500 }
    );
  }
}
