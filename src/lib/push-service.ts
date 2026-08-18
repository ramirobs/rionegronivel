// ============================================================
// Serviço de Envio de Notificações Web Push (VAPID)
// ============================================================

import webPush from 'web-push';
import { getAllSubscriptions, removeSubscription, type StoredSubscription } from './push-storage';

// Chaves VAPID oficiais do Nível Rio Negro (com suporte a override via variáveis de ambiente)
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BK2V_jy4tNc8hzwZr1hnN1zHzO4Rq-IXyjW7HDtZsHt4TeTd48fzzjGgdBsF5TgOyN2otcQ2dNmm89CBvugSxAU';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'Ksp7rTLq4uihemhjTgLZ_IU1ihXM0jIkFLYBvzBDSpw';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:defesacivil@riomafra.app';

// Configura o cliente web-push com as credenciais VAPID
webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  level?: number;
  type?: 'attention' | 'alert' | 'emergency' | 'fast_rise' | 'test';
}

/**
 * Envia notificação Web Push para uma assinatura específica.
 */
export async function sendPushToSubscription(
  subscription: StoredSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    const pushConfig = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };

    await webPush.sendNotification(
      pushConfig,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        icon: payload.icon || '/icon',
        badge: payload.badge || '/icon',
        tag: payload.tag || 'rio-negro-flood-alert',
      }),
      {
        TTL: 60 * 60 * 2, // 2 horas de vida útil na fila de entrega do Google/Apple
        urgency: payload.type === 'emergency' ? 'high' : 'normal',
      }
    );

    return true;
  } catch (error: unknown) {
    // Código 404 (Not Found) ou 410 (Gone) indica que o usuário desinstalou o app ou revogou a permissão
    const statusCode = (error as { statusCode?: number })?.statusCode;
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (statusCode === 404 || statusCode === 410) {
      console.log(`[WebPush] Assinatura expirada detectada, removendo: ${subscription.endpoint.slice(0, 30)}...`);
      await removeSubscription(subscription.endpoint);
    } else {
      console.warn('[WebPush] Falha ao entregar notificação:', errorMsg);
    }
    return false;
  }
}

/**
 * Dispara notificação em massa para todos os moradores inscritos, respeitando suas preferências.
 */
export async function broadcastAlert(payload: PushPayload): Promise<{
  total: number;
  sent: number;
  failed: number;
}> {
  const subscriptions = await getAllSubscriptions();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    // Filtra com base nas preferências do morador
    if (payload.type === 'attention' && !sub.preferences.alertAttention) continue;
    if (payload.type === 'alert' && !sub.preferences.alertAlert) continue;
    if (payload.type === 'emergency' && !sub.preferences.alertEmergency) continue;
    if (payload.type === 'fast_rise' && !sub.preferences.alertFastRise) continue;

    const success = await sendPushToSubscription(sub, payload);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    total: subscriptions.length,
    sent,
    failed,
  };
}
