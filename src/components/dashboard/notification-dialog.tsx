'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  ShieldCheck,
  AlertTriangle,
  X,
  Zap,
} from 'lucide-react';

interface NotificationDialogProps {
  currentLevel: number;
  trendRate: number;
}

// Disparo direto da API de Notificação sem alterar estado do React
function dispatchSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon',
          badge: '/icon',
          tag: 'rio-negro-alert',
        });
      });
    } else {
      new Notification(title, {
        body,
        icon: '/icon',
      });
    }
  } catch (e) {
    console.warn('Erro ao disparar notificação:', e);
  }
}

export default function NotificationDialog({
  currentLevel,
  trendRate,
}: NotificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });

  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });

  const [testSent, setTestSent] = useState(false);

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

  // Salva preferências no localStorage
  const savePrefs = (updates: {
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
    }
  };

  // Solicita permissão do navegador
  const requestPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        dispatchSystemNotification(
          'Notificações Ativadas!',
          'Você receberá avisos quando o Rio Negro atingir níveis de atenção ou cheia.'
        );
      }
    } catch (e) {
      console.warn('Erro ao solicitar permissão:', e);
    }
  };

  const handleTestClick = () => {
    dispatchSystemNotification(
      '🚨 Teste de Alerta — Nível Rio Negro',
      `O nível do rio está em ${currentLevel.toFixed(2)} m. Notificações configuradas com sucesso!`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  // Verifica gatilhos reais quando o nível é atualizado
  useEffect(() => {
    if (permission !== 'granted' || typeof window === 'undefined') return;

    const lastAlertTime = Number(localStorage.getItem('nivel_rio_negro_last_alert_time') || 0);
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;

    // Evita repetição excessiva de alertas em curto intervalo (4h)
    if (now - lastAlertTime < fourHours) return;

    if (alertEmergency && currentLevel >= 7.0) {
      dispatchSystemNotification(
        '🔴 EMERGÊNCIA: Cota de Enchente Atingida!',
        `O Rio Negro atingiu ${currentLevel.toFixed(2)}m. Ruas ribeirinhas estão alagadas em Mafra e Rio Negro.`
      );
      localStorage.setItem('nivel_rio_negro_last_alert_time', String(now));
    } else if (alertAlert && currentLevel >= 6.0) {
      dispatchSystemNotification(
        '🟠 ALERTA: Rio Negro em 6,00 m',
        `O rio atingiu a cota de alerta (${currentLevel.toFixed(2)}m). Várzeas e ruas baixas em vigilância.`
      );
      localStorage.setItem('nivel_rio_negro_last_alert_time', String(now));
    } else if (alertFastRise && trendRate >= 10) {
      dispatchSystemNotification(
        '⚡ SUBIDA RÁPIDA DO RIO',
        `O nível está subindo a +${trendRate.toFixed(1)} cm/h (${currentLevel.toFixed(2)}m agora).`
      );
      localStorage.setItem('nivel_rio_negro_last_alert_time', String(now));
    }
  }, [currentLevel, trendRate, permission, alertEmergency, alertAlert, alertFastRise]);

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
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150">
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
                  Receba avisos instantâneos quando o rio subir
                </p>
              </div>
            </div>

            {/* Status da Permissão */}
            {!isSupported ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Seu navegador não suporta notificações web nativas. No iPhone/iPad, adicione o app à <strong>Tela de Início</strong> para habilitar alertas.
                </p>
              </div>
            ) : permission !== 'granted' ? (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-3 mb-4 shadow-sm">
                <p className="text-xs font-medium leading-relaxed">
                  Autorize o aplicativo a enviar notificações para ser avisado sobre subidas rápidas e cotas de emergência mesmo com o app fechado.
                </p>
                <button
                  onClick={requestPermission}
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-blue-700 font-black text-xs hover:bg-blue-50 transition-colors shadow-xs cursor-pointer"
                >
                  🔔 Permitir Notificações no Dispositivo
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="font-bold">Notificações Habilitadas</span>
                </div>
                <button
                  onClick={handleTestClick}
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {testSent ? 'Enviado!' : 'Testar Alerta'}
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

            {/* Botão Concluir */}
            <button
              onClick={() => setIsOpen(false)}
              type="button"
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
            >
              Salvar e Concluir
            </button>
          </div>
        </div>
      )}
    </>
  );
}
