'use client';

import React, { useState } from 'react';
import { Share2, Check, MessageCircle, Copy } from 'lucide-react';
import type { RiskLevel } from '@/lib/constants';

interface ShareButtonProps {
  level: number;
  trend: {
    rate: number;
    direction: 'rising' | 'stable' | 'falling';
  };
  precip24h: number;
  lastUpdate: string;
  riskLevel: RiskLevel;
}

export default function ShareButton({
  level,
  trend,
  precip24h,
  lastUpdate,
  riskLevel,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const getStatusEmoji = () => {
    switch (riskLevel) {
      case 'emergency':
        return '🔴 EMERGÊNCIA (Enchente)';
      case 'alert':
        return '🟠 ALERTA DE CHEIA';
      case 'attention':
        return '🟡 ATENÇÃO';
      default:
        return '🟢 NORMAL (Sem risco)';
    }
  };

  const getTrendText = () => {
    if (trend.direction === 'rising') return `Subindo (+${Math.abs(trend.rate).toFixed(1)} cm/h) ↗️`;
    if (trend.direction === 'falling') return `Baixando (-${Math.abs(trend.rate).toFixed(1)} cm/h) ↘️`;
    return 'Estável ➡️';
  };

  const getShareText = () => {
    const formattedDate = (() => {
      try {
        const d = new Date(lastUpdate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {
        // fallback
      }
      return lastUpdate || 'Agora';
    })();

    return (
      `🌊 *Nível Rio Negro — RioMafra*\n\n` +
      `📏 *Nível Atual:* ${level.toFixed(2)} m\n` +
      `🚨 *Situação:* ${getStatusEmoji()}\n` +
      `📈 *Tendência:* ${getTrendText()}\n` +
      `🌧️ *Chuva 24h:* ${precip24h.toFixed(1)} mm\n` +
      `⏰ *Leitura:* ${formattedDate}\n\n` +
      `👉 Acompanhe ao vivo e veja a previsão de 7 dias:\n` +
      `https://riomafra.vercel.app`
    );
  };

  const handleShare = async () => {
    const text = getShareText();
    const url = 'https://riomafra.vercel.app';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Nível Rio Negro — Boletim em Tempo Real',
          text,
          url,
        });
        return;
      } catch {
        // Se o usuário cancelar ou o navegador não suportar, abre o menu de fallback
      }
    }

    setShowOptions(true);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(getShareText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    setShowOptions(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowOptions(false);
      }, 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleShare}
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200 shadow-2xs transition-all cursor-pointer select-none"
        title="Compartilhar boletim no WhatsApp ou redes"
      >
        <Share2 className="h-3.5 w-3.5 text-emerald-600" />
        <span>Compartilhar Boletim</span>
      </button>

      {/* Menu / Modal Flutuante de Opções de Compartilhamento */}
      {showOptions && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs"
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-72 bg-white rounded-2xl p-4 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h4 className="text-xs font-bold text-slate-900 mb-2.5">
              Compartilhar Boletim do Rio Negro
            </h4>
            <div className="space-y-2">
              <button
                onClick={handleWhatsApp}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar no WhatsApp
              </button>

              <button
                onClick={handleCopy}
                type="button"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">Copiado para a área de transferência!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-500" />
                    Copiar Texto do Boletim
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
