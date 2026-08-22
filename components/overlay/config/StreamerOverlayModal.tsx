'use client';

import React, { useState } from 'react';
import {
  Video,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Dices,
  Swords,
  Compass,
  MessageSquare,
  Eye,
  Sparkles,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface StreamerOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

export const StreamerOverlayModal: React.FC<StreamerOverlayModalProps> = ({
  isOpen,
  onClose,
  campaignId,
}) => {
  const [widgets, setWidgets] = useState<{ [key: string]: boolean }>({
    dice: true,
    combat: true,
    scene: true,
    chat: false,
  });

  const [align, setAlign] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center'>('bottom-right');
  const [combatLayout, setCombatLayout] = useState<'horizontal' | 'vertical' | 'compact'>('horizontal');
  const [showHp, setShowHp] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1.0);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  // Compute current overlay URL
  const getActiveWidgetsParam = () => {
    return Object.entries(widgets)
      .filter(([_, active]) => active)
      .map(([key]) => key)
      .join(',');
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const overlayUrl = `${baseUrl}/overlay?campaignId=${campaignId}&widgets=${getActiveWidgetsParam()}&align=${align}&combatLayout=${combatLayout}&showHp=${showHp}&scale=${scale}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    toast.success('Link do Overlay copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleWidget = (key: string) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-950 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Streamer Mode & Overlay OBS
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  OBS Studio / Twitch
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gere uma fonte de navegador transparente para exibir rolagens e combate na sua transmissão.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Copy Link Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400">
              URL da Fonte de Navegador (Browser Source)
            </label>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-2 px-3">
              <input
                type="text"
                readOnly
                value={overlayUrl}
                className="bg-transparent text-xs font-mono text-slate-300 w-full outline-none select-all"
              />
              <button
                onClick={handleCopyUrl}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-lg'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <a
                href={overlayUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                title="Abrir pré-visualização em nova aba"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 No OBS: Adicione uma fonte <strong>"Navegador"</strong>, cole a URL acima e configure a resolução para 1920x1080.
            </p>
          </div>

          {/* Widgets Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Módulos Ativos na Transmissão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleToggleWidget('dice')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  widgets.dice
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Dices className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    Alerta de Dados
                    {widgets.dice && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Pop-up animado de rolagens com Nat 20 / Nat 1 em destaque.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget('combat')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  widgets.combat
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    Tracker de Combate
                    {widgets.combat && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Barra de iniciativa e indicador do turno ativo.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget('scene')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  widgets.scene
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    Banner de Cena
                    {widgets.scene && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Título da cena ativa, clima (chuva/noite) e texto sensorial.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleWidget('chat')}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  widgets.chat
                    ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    Falas In-Character
                    {widgets.chat && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Balões de interpretação dos personagens na tela.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Positioning and Options */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Position */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Posição dos Alertas</label>
              <select
                value={align}
                onChange={(e) => setAlign(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500/50 outline-none"
              >
                <option value="bottom-right">Inferior Direito (Padrão)</option>
                <option value="bottom-left">Inferior Esquerdo</option>
                <option value="bottom-center">Inferior Centralizado</option>
                <option value="top-right">Superior Direito</option>
                <option value="top-left">Superior Esquerdo</option>
              </select>
            </div>

            {/* Combat Layout */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Layout do Combate</label>
              <select
                value={combatLayout}
                onChange={(e) => setCombatLayout(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500/50 outline-none"
              >
                <option value="horizontal">Horizontal (Barra Superior/Inferior)</option>
                <option value="vertical">Vertical (Coluna Lateral)</option>
                <option value="compact">Compacto (Apenas Turno Ativo)</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showHpToggle"
                checked={showHp}
                onChange={(e) => setShowHp(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
              />
              <label htmlFor="showHpToggle" className="text-xs text-slate-300 cursor-pointer">
                Exibir barra e valor de HP dos combatentes no overlay
              </label>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Escala:</span>
              <select
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200"
              >
                <option value={0.8}>80%</option>
                <option value={1.0}>100% (Padrão)</option>
                <option value={1.2}>120% (Grande)</option>
                <option value={1.4}>140% (4K)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900/80 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-amber-400/80">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anti-Spoiler Ativo: Rolagens secretas do DM nunca são exibidas.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copiar Link do OBS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
