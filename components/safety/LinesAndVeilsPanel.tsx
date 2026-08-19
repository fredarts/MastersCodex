'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Sparkles,
  Save,
  Check,
  RotateCcw,
  Sliders,
  Lock,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CampaignSafetySettings,
  DEFAULT_SAFETY_SETTINGS,
  SAFETY_PRESETS,
} from '@/lib/types/safety';
import { UserCampaign } from '@/lib/types';

interface LinesAndVeilsPanelProps {
  campaign: UserCampaign;
  onSave: (updatedSettings: CampaignSafetySettings) => Promise<void>;
}

export const LinesAndVeilsPanel: React.FC<LinesAndVeilsPanelProps> = ({
  campaign,
  onSave,
}) => {
  const [settings, setSettings] = useState<CampaignSafetySettings>(
    campaign.safetySettings || DEFAULT_SAFETY_SETTINGS
  );
  const [newLine, setNewLine] = useState('');
  const [newVeil, setNewVeil] = useState('');
  const [newAskFirst, setNewAskFirst] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddLine = () => {
    if (!newLine.trim()) return;
    setSettings((prev) => ({ ...prev, lines: [...prev.lines, newLine.trim()] }));
    setNewLine('');
  };

  const handleRemoveLine = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleAddVeil = () => {
    if (!newVeil.trim()) return;
    setSettings((prev) => ({ ...prev, veils: [...prev.veils, newVeil.trim()] }));
    setNewVeil('');
  };

  const handleRemoveVeil = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      veils: prev.veils.filter((_, i) => i !== index),
    }));
  };

  const handleAddAskFirst = () => {
    if (!newAskFirst.trim()) return;
    setSettings((prev) => ({
      ...prev,
      askFirst: [...prev.askFirst, newAskFirst.trim()],
    }));
    setNewAskFirst('');
  };

  const handleRemoveAskFirst = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      askFirst: prev.askFirst.filter((_, i) => i !== index),
    }));
  };

  const handleApplyPreset = (preset: typeof SAFETY_PRESETS[0]) => {
    if (confirm(`Deseja aplicar o modelo '${preset.name}'? Isto substituirá as configurações atuais.`)) {
      setSettings(preset.settings);
      toast.info(`Preset '${preset.name}' aplicado! Não se esqueça de salvar.`);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await onSave(settings);
      toast.success('Configurações de Safety Tools e Limites salvas com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao salvar limites: ' + (err?.message || 'Tente novamente'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-[#121824] p-5 rounded-2xl border border-[#2a3449] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base text-slate-100">
              Ferramentas de Segurança & Limites de Conteúdo (Lines & Veils)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Estabeleça os acordos de convivência e sensibilidade da mesa. Os jogadores poderão consultar esses limites a qualquer momento e acionar o X-Card em tempo real durante o jogo.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Limites da Campanha'}</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="bg-[#0f141f] p-4 rounded-xl border border-[#2a3449]/70">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-2.5">
          <Sparkles className="w-3.5 h-3.5" /> Modelos Rápidos de Segurança (Presets 1-Clique):
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAFETY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-3 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] hover:border-amber-500/50 rounded-xl text-left transition-all group"
            >
              <h5 className="font-bold text-xs text-slate-200 group-hover:text-amber-300">
                {preset.name}
              </h5>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* 3 Columns: Lines, Veils, Ask First */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 1. Lines */}
        <div className="bg-[#121824] p-4 rounded-2xl border-2 border-rose-500/30 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2a3449]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
                <span>🚫 Linhas (Lines)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">{settings.lines.length} itens</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Temas que <strong>NUNCA</strong> acontecem nem são mencionados na narrativa.
            </p>

            <div className="space-y-1.5 mt-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {settings.lines.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Nenhuma linha restritiva adicionada.</p>
              ) : (
                settings.lines.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0a0d14] border border-rose-500/20 text-xs text-rose-200 group"
                  >
                    <span className="leading-snug">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Remover Linha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-1.5 pt-2 border-t border-[#2a3449]">
            <input
              type="text"
              value={newLine}
              onChange={(e) => setNewLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLine();
                }
              }}
              placeholder="Adicionar nova linha..."
              className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-rose-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddLine}
              className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition-colors"
              title="Adicionar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. Veils */}
        <div className="bg-[#121824] p-4 rounded-2xl border-2 border-amber-500/30 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2a3449]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <span>🌫️ Véus (Veils)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">{settings.veils.length} itens</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Podem existir no mundo, mas acontecem <strong>fora de cena (Fade to Black)</strong>.
            </p>

            <div className="space-y-1.5 mt-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {settings.veils.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Nenhum véu configurado.</p>
              ) : (
                settings.veils.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0a0d14] border border-amber-500/20 text-xs text-amber-200 group"
                  >
                    <span className="leading-snug">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVeil(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Remover Véu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-1.5 pt-2 border-t border-[#2a3449]">
            <input
              type="text"
              value={newVeil}
              onChange={(e) => setNewVeil(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddVeil();
                }
              }}
              placeholder="Adicionar novo véu..."
              className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddVeil}
              className="p-2 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 transition-colors"
              title="Adicionar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3. Ask First */}
        <div className="bg-[#121824] p-4 rounded-2xl border-2 border-cyan-500/30 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#2a3449]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <span>❓ Perguntar Antes (Ask First)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">{settings.askFirst.length} itens</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Requerem <strong>consentimento prévio explícito</strong> dos jogadores antes de introduzir.
            </p>

            <div className="space-y-1.5 mt-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {settings.askFirst.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Nenhum item com aviso prévio.</p>
              ) : (
                settings.askFirst.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0a0d14] border border-cyan-500/20 text-xs text-cyan-200 group"
                  >
                    <span className="leading-snug">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAskFirst(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-1.5 pt-2 border-t border-[#2a3449]">
            <input
              type="text"
              value={newAskFirst}
              onChange={(e) => setNewAskFirst(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAskFirst();
                }
              }}
              placeholder="Adicionar 'Perguntar Antes'..."
              className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddAskFirst}
              className="p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-colors"
              title="Adicionar"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Safety Options */}
      <div className="bg-[#0f141f] p-4 rounded-xl border border-[#2a3449] flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.allowAnonymousXCard}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                allowAnonymousXCard: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Permitir que jogadores acionem o X-Card de forma anônima
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.notifySound}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                notifySound: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0 accent-amber-500"
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-rose-400" />
            Emitir aviso sonoro sutil no Live Cockpit ao receber X-Card
          </span>
        </label>
      </div>
    </div>
  );
};
