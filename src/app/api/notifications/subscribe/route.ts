import { NextResponse } from 'next/server';
import { VAPID_PUBLIC_KEY } from '@/lib/push-service';
import { saveSubscription, removeSubscription } from '@/lib/push-storage';

export const dynamic = 'force-dynamic';

/**
 * Retorna a chave pública VAPID para o frontend gerar a assinatura push.
 */
export async function GET() {
  return NextResponse.json({
    publicKey: VAPID_PUBLIC_KEY,
  });
}

/**
 * Salva uma nova assinatura gerada pelo aparelho do morador.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, preferences } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Assinatura inválida. Endpoint e keys são obrigatórios.' },
        { status: 400 }
      );
    }

    await saveSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      preferences,
    });

    return NextResponse.json({
      success: true,
      message: 'Assinatura de notificações registrada com sucesso no servidor!',
    });
  } catch (error) {
    console.error('[API subscribe] Erro ao salvar assinatura:', error);
    return NextResponse.json(
      { error: 'Falha ao processar assinatura de notificação' },
      { status: 500 }
    );
  }
}

/**
 * Remove a assinatura caso o morador desative os alertas.
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint é obrigatório.' }, { status: 400 });
    }

    const removed = await removeSubscription(endpoint);
    return NextResponse.json({ success: removed });
  } catch (error) {
    console.error('[API subscribe DELETE] Erro ao remover assinatura:', error);
    return NextResponse.json({ error: 'Falha ao remover assinatura' }, { status: 500 });
  }
}
