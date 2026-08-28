'use client';

import React, { useState } from 'react';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { Combatant } from '@/lib/types';
import { TokenAura } from '@/lib/auras/auraTypes';
import { OFFICIAL_AURA_PRESETS, createAuraFromPreset } from '@/lib/auras/auraPresets';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  ShieldCheck, 
  Flame, 
  EyeOff, 
  VolumeX, 
  Sun,
  Palette,
  Power
} from 'lucide-react';
import { toast } from 'sonner';

interface TokenAuraManagerModalProps {
  combatant: Combatant | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TokenAuraManagerModal: React.FC<TokenAuraManagerModalProps> = ({
  combatant,
  isOpen,
  onClose,
}) => {
  const { updateCombatantState } = useLiveCockpit();

  const [selectedPreset, setSelectedPreset] = useState<string>('spirit_guardians');
  const [customRadiusFt, setCustomRadiusFt] = useState<number>(15);
  const [customColor, setCustomColor] = useState<string>('#facc15');

  if (!isOpen || !combatant) return null;

  const activeAuras: TokenAura[] = combatant.auras || [];

  const handleAddPreset = (presetKey: string) => {
    try {
      const newAura = createAuraFromPreset(
        presetKey as any,
        combatant.id,
        combatant.name,
        {
          radiusFt: customRadiusFt,
          visual: {
            ...OFFICIAL_AURA_PRESETS[presetKey]?.visual,
            colorHex: customColor,
          },
        }
      );

      const updated = [...activeAuras, newAura];
      updateCombatantState(combatant.id, { auras: updated });
      toast.success(`Aura '${newAura.name}' adicionada a ${combatant.name}!`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao adicionar aura');
    }
  };

  const handleToggleAura = (auraId: string) => {
    const updated = activeAuras.map((a) =>
      a.id === auraId ? { ...a, enabled: !a.enabled } : a
    );
    updateCombatantState(combatant.id, { auras: updated });
  };

  const handleRemoveAura = (auraId: string) => {
    const updated = activeAuras.filter((a) => a.id !== auraId);
    updateCombatantState(combatant.id, { auras: updated });
    toast.info('Aura removida.');
  };

  const getPresetIcon = (key: string) => {
    if (key.includes('spirit')) return <Flame className="w-4 h-4 text-amber-400" />;
    if (key.includes('protection') || key.includes('courage')) return <ShieldCheck className="w-4 h-4 text-sky-400" />;
    if (key.includes('darkness')) return <EyeOff className="w-4 h-4 text-slate-400" />;
    if (key.includes('silence')) return <VolumeX className="w-4 h-4 text-slate-300" />;
    return <Sun className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f141d] border border-amber-500/30 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Gerenciador de Auras & Efeitos Espaciais</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Combatente: <span className="text-amber-300 font-bold">{combatant.name}</span> ({activeAuras.length} ativas)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Seção 1: Auras Ativas */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Auras Vinculadas ao Token</span>
            </h3>

            {activeAuras.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 text-center text-xs text-slate-500 font-mono">
                Nenhuma aura ativa no momento. Escolha um preset abaixo para ativar.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeAuras.map((aura) => (
                  <div
                    key={aura.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      aura.enabled
                        ? 'bg-slate-900/90 border-slate-700'
                        : 'bg-slate-950/60 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shrink-0 shadow"
                        style={{ backgroundColor: aura.visual.colorHex }}
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>{aura.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {aura.radiusFt} ft ({aura.affects})
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {aura.action.type === 'saving_throw' && `Exige ${aura.action.saveAbility} Save (${aura.action.damageFormula} ${aura.action.damageType})`}
                          {aura.action.type === 'stat_modifier' && `Bônus Contínuo para Aliados`}
                          {aura.action.type === 'vision_blocker' && `Bloqueador de Visão Mágico`}
                          {aura.action.type === 'apply_condition' && `Aplica condição ${aura.action.condition}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleAura(aura.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          aura.enabled
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title={aura.enabled ? 'Desativar Aura' : 'Ativar Aura'}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{aura.enabled ? 'Ativa' : 'Inativa'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveAura(aura.id)}
                        className="p-1.5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                        title="Remover Aura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seção 2: Adicionar a partir de Preset D&D 5e */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <span>Biblioteca de Presets Oficiais (D&D 5e)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.entries(OFFICIAL_AURA_PRESETS).map(([key, preset]) => (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedPreset(key);
                    setCustomRadiusFt(preset.radiusFt);
                    setCustomColor(preset.visual.colorHex);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedPreset === key
                      ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-950/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {getPresetIcon(key)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{preset.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {preset.radiusFt} ft • {preset.affects}
                      </div>
                    </div>
                  </div>

                  {selectedPreset === key && (
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Customização Rápida antes de Aplicar */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Raio (Pés)
                  </label>
                  <input
                    type="number"
                    value={customRadiusFt}
                    onChange={(e) => setCustomRadiusFt(Math.max(5, Number(e.target.value)))}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-amber-400 focus:border-amber-500 focus:outline-none"
                    step={5}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Cor Visual
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400 uppercase">{customColor}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAddPreset(selectedPreset)}
                className="py-2.5 px-4 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-amber-950/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Aplicar Aura ao Token</span>
              </button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
