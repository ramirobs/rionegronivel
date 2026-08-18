// ============================================================
// Service Worker Customizado: Web Push Notifications & Alertas
// ============================================================

declare const self: any;

self.addEventListener('push', (event: any) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || '🚨 Alerta — Nível Rio Negro';
    const options: NotificationOptions = {
      body: data.body || 'O nível do Rio Negro foi atualizado.',
      icon: data.icon || '/icon',
      badge: data.badge || '/icon',
      tag: data.tag || 'rio-negro-flood-alert',
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('[ServiceWorker] Erro ao processar push:', err);
  }
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients: any) => {
      for (const client of windowClients) {
        if (client.url && client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

export {};
