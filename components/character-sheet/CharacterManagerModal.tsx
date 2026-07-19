import React from 'react';
import { CharacterSheet } from '@/lib/types';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';
import {
  User,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Shield,
  Heart,
  Sparkles,
  X,
  FileText,
  Compass,
} from 'lucide-react';

interface CharacterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterSheets: CharacterSheet[];
  onSelectSheetToEdit: (sheet: CharacterSheet) => void;
  onCreateNewSheet: () => void;
  onDuplicateSheet: (sheetId: string) => void;
  onDeleteSheet: (sheetId: string) => void;
}

export const CharacterManagerModal: React.FC<CharacterManagerModalProps> = ({
  isOpen,
  onClose,
  characterSheets,
  onSelectSheetToEdit,
  onCreateNewSheet,
  onDuplicateSheet,
  onDeleteSheet,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* HEADER */}
        <header className="bg-[#141b2d] border-b border-amber-500/30 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Coleção de Personagens ({characterSheets.length})
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie todas as suas fichas de D&D 5e de campanhas atuais e anteriores.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCreateNewSheet}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Personagem</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* LISTA DE FICHAS */}
        <main className="p-6 overflow-y-auto flex-1">
          {characterSheets.length === 0 ? (
            <div className="p-12 text-center bg-[#141b2d]/50 border border-dashed border-slate-800 rounded-2xl space-y-4 max-w-md mx-auto my-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-200">Nenhum personagem cadastrado</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Crie sua primeira ficha de personagem de D&D 5e totalmente automatizada para usar em suas sessões.
                </p>
              </div>
              <button
                type="button"
                onClick={onCreateNewSheet}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Minha Primeira Ficha</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {characterSheets.map((sheet) => (
                <div
                  key={sheet.id}
                  className="bg-[#141b2d] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xl transition-all hover:-translate-y-1 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#0b0f19] border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                        {sheet.avatarUrl ? (
                          <img src={sheet.avatarUrl} alt={sheet.characterName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-7 h-7 text-amber-400/60" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                          NÍVEL {sheet.level}
                        </span>
                        <h3 className="text-base font-extrabold text-slate-100 truncate mt-1 group-hover:text-amber-300 transition-colors">
                          {sheet.characterName || 'Sem Nome'}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          {sheet.race} • {sheet.className}
                        </p>
                      </div>
                    </div>

                    {/* STATUS RÁPIDOS */}
                    <div className="grid grid-cols-3 gap-2 bg-[#0b0f19] border border-slate-800 rounded-xl p-2 text-center font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">CA</span>
                        <span className="text-xs font-bold text-amber-400">{sheet.armorClass}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">HP</span>
                        <span className="text-xs font-bold text-rose-400">{sheet.maxHp}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase block">XP</span>
                        <span className="text-xs font-bold text-emerald-400">{sheet.xp}</span>
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES DA FICHA */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectSheetToEdit(sheet)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Abrir / Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateSheet(sheet.id)}
                      className="p-2 text-slate-400 hover:text-white bg-[#0b0f19] border border-slate-800 hover:border-slate-700 rounded-xl transition-colors"
                      title="Duplicar Ficha"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSheet(sheet.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 bg-[#0b0f19] border border-slate-800 hover:border-rose-500/40 rounded-xl transition-colors"
                      title="Excluir Ficha"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
