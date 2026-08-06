'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Zap, Shield, Eye, Ghost, Lock, ChevronUp, ChevronDown, Settings2 } from 'lucide-react';
import { MacroItem, CharacterSheet, SecretRollNotificationMode, MacroBarDisplayMode } from '@/lib/types';
import { loadUserMacros, addCustomMacro, removeCustomMacro, processMacroCommand } from '@/lib/dnd5e-macro-engine';

interface MacroBarHUDProps {
  onExecuteMacro: (command: string) => void;
  activeSheet?: CharacterSheet | null;
  displayMode?: MacroBarDisplayMode;
  onUpdateDisplayMode?: (mode: MacroBarDisplayMode) => void;
  secretMode?: SecretRollNotificationMode;
  onUpdateSecretMode?: (mode: SecretRollNotificationMode) => void;
}

export const MacroBarHUD: React.FC<MacroBarHUDProps> = ({
  onExecuteMacro,
  activeSheet,
  displayMode = 'both',
  onUpdateDisplayMode,
  secretMode = 'subtle_notice',
  onUpdateSecretMode,
}) => {
  const [macros, setMacros] = useState<MacroItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // New macro form state
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroCommand, setNewMacroCommand] = useState('');
  const [newMacroColor, setNewMacroColor] = useState('#f59e0b');

  useEffect(() => {
    setMacros(loadUserMacros());
  }, []);

  if (displayMode === 'chat_tab') {
    // If set to chat_tab only, hide the bottom bar
    return null;
  }

  const handleAddMacro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMacroName.trim() || !newMacroCommand.trim()) return;

    const updated = addCustomMacro({
      name: newMacroName.trim(),
      command: newMacroCommand.trim(),
      color: newMacroColor,
    });
    setMacros(updated);

    setNewMacroName('');
    setNewMacroCommand('');
    setShowAddModal(false);
  };

  const handleDeleteMacro = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeCustomMacro(id);
    setMacros(updated);
  };

  const handleRun = (macro: MacroItem) => {
    const interpolated = processMacroCommand(macro, activeSheet);
    onExecuteMacro(interpolated);
  };

  return (
    <>
      {/* Floating Bottom Macro Bar */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-[#0f141d]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 max-w-4xl overflow-x-auto scrollbar-none">
          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors shrink-0"
            title={isExpanded ? 'Ocultar Régua de Macros' : 'Expandir Régua de Macros'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="w-7 h-7 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-amber-400 flex items-center justify-center transition-colors shrink-0"
            title="Configurações de Rolagem e Layout"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {isExpanded && (
            <>
              <div className="h-5 w-px bg-slate-700/60 mx-0.5" />

              {/* Macro Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-1 scrollbar-none">
                {macros.map((m) => (
                  <div key={m.id} className="relative group shrink-0">
                    <button
                      onClick={() => handleRun(m)}
                      style={{ borderColor: m.color || '#f59e0b' }}
                      className="px-3 py-1.5 bg-[#172030] hover:bg-[#202c42] text-slate-100 font-bold text-xs rounded-xl border flex items-center gap-1.5 shadow-md active:scale-95 transition-all group"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color || '#f59e0b' }} />
                      <span className="truncate max-w-[120px]">{m.name}</span>
                    </button>

                    {!m.isGlobal && (
                      <button
                        onClick={(e) => handleDeleteMacro(m.id, e)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] shadow transition-opacity"
                        title="Excluir macro"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add New Macro Button */}
              <button
                onClick={() => setShowAddModal(true)}
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs rounded-xl flex items-center gap-1 transition-all shrink-0"
                title="Criar nova Macro"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Nova Macro</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Add Macro Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f141d] border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" /> Criar Macro Customizada
            </h3>

            <form onSubmit={handleAddMacro} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nome da Macro</label>
                <input
                  type="text"
                  placeholder="Ex: Ataque com Espada, Bola de Fogo"
                  value={newMacroName}
                  onChange={(e) => setNewMacroName(e.target.value)}
                  className="w-full bg-[#172030] border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Comando de Rolagem</label>
                <input
                  type="text"
                  placeholder="Ex: /roll 1d20+@str (Espada) ou /gmroll 2d6+3"
                  value={newMacroCommand}
                  onChange={(e) => setNewMacroCommand(e.target.value)}
                  className="w-full bg-[#172030] border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Variáveis aceitas: <code className="text-amber-400">@str, @dex, @con, @int, @wis, @cha, @pb, @lvl</code>
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Cor do Botão</label>
                <div className="flex items-center gap-2">
                  {['#f59e0b', '#38bdf8', '#10b981', '#ef4444', '#a855f7', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewMacroColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${newMacroColor === c ? 'scale-125 border-white' : 'border-transparent opacity-70'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg"
                >
                  Salvar Macro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Secret Rolls Mode & Macro Bar Position) */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f141d] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-slate-100 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-400" /> Configurações do VTT & Rolagens
            </h3>

            {/* Secret Rolls Setting */}
            <div className="space-y-2 bg-[#141b2d] p-3.5 rounded-xl border border-slate-700/60">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                Visual de Rolagem Secreta do DM (/gmroll)
              </label>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onUpdateSecretMode && onUpdateSecretMode('subtle_notice')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    secretMode === 'subtle_notice'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#1b2438] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-slate-100 mb-0.5">🔔 Notificação Sutil</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Jogadores veem: <em>"O Mestre rolou os dados em segredo..."</em>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onUpdateSecretMode && onUpdateSecretMode('stealth_silent')}
                  className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                    secretMode === 'stealth_silent'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-[#1b2438] border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-extrabold text-slate-100 mb-0.5">🥷 100% Furtivo / Silencioso</div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    Nenhum pacote ou mensagem é enviado aos jogadores.
                  </div>
                </button>
              </div>
            </div>

            {/* Macro Bar Position Setting */}
            <div className="space-y-2 bg-[#141b2d] p-3.5 rounded-xl border border-slate-700/60">
              <label className="text-xs font-black text-amber-400 uppercase tracking-wider block">
                Exibição de Macros na UI
              </label>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { key: 'bottom_bar', label: 'Régua Rodapé', desc: 'Estilo Roll20' },
                  { key: 'chat_tab', label: 'Aba no Chat', desc: 'Aba dedicada' },
                  { key: 'both', label: 'Ambas Visíveis', desc: 'Rodapé + Chat' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => onUpdateDisplayMode && onUpdateDisplayMode(opt.key as MacroBarDisplayMode)}
                    className={`p-2 rounded-xl text-center border text-xs font-bold transition-all ${
                      displayMode === opt.key
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-[#1b2438] border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-extrabold text-slate-100">{opt.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
