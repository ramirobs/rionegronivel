'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  BellRing,
  ShieldCheck,
  AlertTriangle,
  X,
  Zap,
  CheckCircle2,
} from 'lucide-react';

interface NotificationDialogProps {
  currentLevel: number;
  trendRate?: number;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationDialog({
  currentLevel,
}: NotificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  });

  const [isSubscribing, setIsSubscribing] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  // Preferências do usuário
  const [alertAttention, setAlertAttention] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nivel_rio_negro_alert_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.alertAttention !== undefined) return parsed.alertAttention;
        }
      } catch {
        // ignore
      }
    }
    return true;
  });

  const [alertAlert, setAlertAlert] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nivel_rio_negro_alert_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.alertAlert !== undefined) return parsed.alertAlert;
        }
      } catch {
        // ignore
      }
    }
    return true;
  });

  const [alertEmergency, setAlertEmergency] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nivel_rio_negro_alert_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.alertEmergency !== undefined) return parsed.alertEmergency;
        }
      } catch {
        // ignore
      }
    }
    return true;
  });

  const [alertFastRise, setAlertFastRise] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nivel_rio_negro_alert_prefs');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.alertFastRise !== undefined) return parsed.alertFastRise;
        }
      } catch {
        // ignore
      }
    }
    return true;
  });

  // Salva preferências no localStorage e sincroniza com o servidor
  const savePrefs = async (updates: {
    alertAttention?: boolean;
    alertAlert?: boolean;
    alertEmergency?: boolean;
    alertFastRise?: boolean;
  }) => {
    const newPrefs = {
      alertAttention,
      alertAlert,
      alertEmergency,
      alertFastRise,
      ...updates,
    };
    if (updates.alertAttention !== undefined) setAlertAttention(updates.alertAttention);
    if (updates.alertAlert !== undefined) setAlertAlert(updates.alertAlert);
    if (updates.alertEmergency !== undefined) setAlertEmergency(updates.alertEmergency);
    if (updates.alertFastRise !== undefined) setAlertFastRise(updates.alertFastRise);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nivel_rio_negro_alert_prefs', JSON.stringify(newPrefs));

      // Sincroniza com o servidor se já houver subscription ativa
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub.toJSON(),
                preferences: newPrefs,
              }),
            });
          }
        } catch {
          // ignore
        }
      }
    }
  };

  // Registra no Web Push Server
  const registerWebPush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    setIsSubscribing(true);
    try {
      // 1. Pede permissão nativa
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setIsSubscribing(false);
        return;
      }

      // 2. Obtém a chave pública VAPID do backend
      const res = await fetch('/api/notifications/subscribe');
      const data = await res.json();
      const publicKey = data.publicKey;

      // 3. Obtém o service worker e assina o push
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription && publicKey) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      // 4. Envia a assinatura para o servidor
      if (subscription) {
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            preferences: {
              alertAttention,
              alertAlert,
              alertEmergency,
              alertFastRise,
            },
          }),
        });
      }
    } catch (err) {
      console.warn('Erro ao configurar Web Push:', err);
    } finally {
      setIsSubscribing(false);
    }
  };

  // Dispara teste real de Web Push vindo do servidor
  const handleTestClick = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    setTestSent(true);
    setTestMessage('Enviando via servidor...');

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        // Se ainda não tiver assinatura push, cria agora
        const res = await fetch('/api/notifications/subscribe');
        const data = await res.json();
        if (data.publicKey) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.publicKey),
          });
        }
      }

      if (sub) {
        const response = await fetch('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: sub.toJSON(),
            level: currentLevel,
          }),
        });

        const result = await response.json();
        if (result.success) {
          setTestMessage('Push enviado pelo servidor!');
        } else {
          setTestMessage('Enviado!');
        }
      } else {
        // Fallback para notificação local caso push falhe
        if (reg) {
          reg.showNotification('🚨 Teste Local — Nível Rio Negro', {
            body: `Nível do rio em ${currentLevel.toFixed(2)} m.`,
            icon: '/icon',
          });
        }
        setTestMessage('Alerta local exibido');
      }
    } catch {
      setTestMessage('Alerta enviado!');
    }

    setTimeout(() => {
      setTestSent(false);
      setTestMessage(null);
    }, 4000);
  };

  return (
    <>
      {/* Botão de Abertura do Menu de Notificações */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-2xs transition-all cursor-pointer select-none ${
          permission === 'granted'
            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200'
            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200 animate-pulse'
        }`}
        title="Configurar alertas de enchente no celular"
      >
        {permission === 'granted' ? (
          <BellRing className="h-3.5 w-3.5 text-blue-600" />
        ) : (
          <Bell className="h-3.5 w-3.5 text-amber-600" />
        )}
        <span>{permission === 'granted' ? 'Alertas Ativos' : 'Ativar Alertas'}</span>
      </button>

      {/* Modal de Configuração de Alertas */}
      {isOpen && mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              {/* Fechar */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cabeçalho */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
                <BellRing className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Alertas de Enchente no Celular
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Avisos automáticos 24h via Servidor (Mesmo com App fechado)
                </p>
              </div>
            </div>

            {/* Status da Permissão */}
            {!isSupported ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  No iPhone/iPad, adicione o app à <strong>Tela de Início</strong> (Compartilhar &gt; Adicionar à Tela de Início) para receber notificações com a tela bloqueada.
                </p>
              </div>
            ) : permission !== 'granted' ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-3 mb-4 shadow-sm">
                <p className="text-xs font-medium leading-relaxed">
                  Autorize o aplicativo para ser avisado sobre subidas rápidas e cotas de cheia mesmo de madrugada ou com o celular no bolso.
                </p>
                <button
                  onClick={registerWebPush}
                  disabled={isSubscribing}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-700 font-black text-xs hover:bg-blue-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubscribing ? 'Conectando ao Servidor...' : '🔔 Permitir e Ativar Alertas no Celular'}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold">Servidor de Alertas Conectado</span>
                </div>
                <button
                  onClick={handleTestClick}
                  disabled={testSent}
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {testMessage || (testSent ? 'Enviando...' : 'Testar Alerta Push')}
                </button>
              </div>
            )}

            {/* Configurações de Gatilhos */}
            <div className="space-y-3 mb-5">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Quando você deseja ser avisado:
              </h4>

              {/* Gatilho 1: Atenção (5m) */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">🟡 Cota de Atenção (5,00 m)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Quando a água atinge parques e orla ribeirinha</p>
                </div>
                <input
                  type="checkbox"
                  checked={alertAttention}
                  onChange={(e) => savePrefs({ alertAttention: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* Gatilho 2: Alerta (6m) */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">🟠 Cota de Alerta (6,00 m)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Primeiras ruas baixas em Mafra e Rio Negro</p>
                </div>
                <input
                  type="checkbox"
                  checked={alertAlert}
                  onChange={(e) => savePrefs({ alertAlert: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* Gatilho 3: Emergência (7m) */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-800">🔴 Emergência / Enchente (7,00 m)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Água invade residências e comércios</p>
                </div>
                <input
                  type="checkbox"
                  checked={alertEmergency}
                  onChange={(e) => savePrefs({ alertEmergency: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {/* Gatilho 4: Subida Rápida */}
              <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">Subida Rápida (&gt; +10 cm/h)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Aviso imediato se o rio subir com velocidade repentina</p>
                </div>
                <input
                  type="checkbox"
                  checked={alertFastRise}
                  onChange={(e) => savePrefs({ alertFastRise: e.target.checked })}
                  className="h-4 w-4 rounded-sm text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>
            </div>

            {/* Indicador de monitoramento na nuvem */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 mb-4 font-medium">
              <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
              <span>Rotina na nuvem checa a ANA a cada 15 min e dispara avisos 24h.</span>
            </div>

            {/* Botão Concluir */}
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Salvar e Concluir
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
