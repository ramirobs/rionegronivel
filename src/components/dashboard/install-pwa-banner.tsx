'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showModalType, setShowModalType] = useState<'ios' | 'android' | null>(null);

  const [isStandalone] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
    );
  });

  const [isIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  });

  const [isAndroid] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed_time');
    if (dismissedTime) {
      const diffDays = (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
      return diffDays < 3;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || isStandalone) return;

    // Captura o evento nativo de instalação do Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowModalType('ios');
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsDismissed(true);
      }
      setDeferredPrompt(null);
    } else {
      // Caso o navegador não tenha disparado beforeinstallprompt ou foi ignorado
      setShowModalType(isAndroid ? 'android' : 'ios');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa_banner_dismissed_time', String(Date.now()));
    }
  };

  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Banner Flutuante de Instalação */}
      <div className="fixed bottom-20 md:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 text-white backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-slate-700 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-amber-500/30 flex items-center justify-center p-2 shrink-0 shadow-sm">
              <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 3.5L20.5 18.5C21 19.5 20.2 20.5 19 20.5H5C3.8 20.5 3 19.5 3.5 18.5L12 3.5Z"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 8.5V12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="14.5" r="1" fill="#fbbf24" />
                <path
                  d="M4.5 17.5C7 15.5 9.5 15.5 12 17.5C14.5 19.5 17 19.5 19.5 17.5"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                Instalar Nível Rio Negro
              </h4>
              <p className="text-[11px] text-slate-300 leading-tight mt-0.5 truncate">
                Acesse em 1 toque na tela inicial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              type="button"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal com Instruções Fallback para Android / iOS */}
      {showModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-150 text-slate-900">
            <button
              onClick={() => setShowModalType(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Instalar no seu Celular
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Adicione o aplicativo à tela de início para acesso rápido e alertas 24h
              </p>
            </div>

            {/* Passo a Passo Visual */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs mb-5">
              {showModalType === 'ios' ? (
                <>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
                      <Share className="h-4 w-4" />
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">1. Toque em Compartilhar</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        No iPhone, toque no botão de compartilhar (ícone na barra inferior do Safari).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <PlusSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">2. Adicionar à Tela de Início</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Role a lista para baixo e toque na opção <strong>&quot;Adicionar à Tela de Início&quot;</strong>.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0 font-bold px-2.5">
                      ⋮
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">1. Abra o Menu do Navegador</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toque nos três pontinhos no canto superior direito da sua tela (geralmente no Chrome).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
                    <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                      <PlusSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <strong className="font-bold text-slate-900">2. Adicionar à Tela Inicial</strong>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Toque em <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModalType(null)}
              type="button"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
