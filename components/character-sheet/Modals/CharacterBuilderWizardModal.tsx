import React, { useState } from 'react';
import { CharacterSheet, AttributeKey } from '@/lib/types';
import { DND_RACES, DND_CLASSES, DND_BACKGROUNDS, DND_ALIGNMENTS, createEmptyCharacterSheet } from '@/lib/dnd5e-data';
import { applyRacePreset, applyClassPreset, applyLevelChange } from '@/lib/dnd5e-calculator';
import { Wand2, User, Sparkles, Shield, Dices, ChevronRight, ChevronLeft, Check, X } from 'lucide-react';

interface CharacterBuilderWizardModalProps {
  userId: string;
  campaignId?: string;
  isOpen: boolean;
  onClose: () => void;
  onCharacterCreated: (sheet: CharacterSheet) => void;
}

export const CharacterBuilderWizardModal: React.FC<CharacterBuilderWizardModalProps> = ({
  userId,
  campaignId,
  isOpen,
  onClose,
  onCharacterCreated,
}) => {
  const [step, setStep] = useState<number>(1);
  const [characterName, setCharacterName] = useState('Heroi Lendario');
  const [selectedRace, setSelectedRace] = useState('Humano');
  const [selectedClass, setSelectedClass] = useState('Guerreiro');
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [selectedBackground, setSelectedBackground] = useState('Herói do Povo');
  const [selectedAlignment, setSelectedAlignment] = useState('Neutro e Bom');

  const [attributes, setAttributes] = useState<Record<AttributeKey, number>>({
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 10,
    cha: 8,
  });

  if (!isOpen) return null;

  const handleFinishWizard = () => {
    let newSheet = createEmptyCharacterSheet(userId, campaignId);

    newSheet.characterName = characterName;
    newSheet.background = selectedBackground;
    newSheet.alignment = selectedAlignment;

    // Aplica os atributos definidos
    Object.keys(attributes).forEach((attrKey) => {
      const k = attrKey as AttributeKey;
      newSheet.attributes[k] = { score: attributes[k] };
    });

    // Aplica Presets de Raça e Classe
    newSheet = applyRacePreset(newSheet, selectedRace);
    newSheet = applyClassPreset(newSheet, selectedClass);
    newSheet = applyLevelChange(newSheet, selectedLevel);

    onCharacterCreated(newSheet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0f172a] border border-amber-500/40 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* HEADER DO WIZARD */}
        <div className="bg-[#141b2d] border-b border-amber-500/20 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <Wand2 className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider">Criador Guiado de Personagem (Wizard)</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE PROGRESSO DOS PASSOS */}
        <div className="bg-[#0b0f19] px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center transition-all ${
                  step === num
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : step > num
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step > num ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-xs font-bold ${step === num ? 'text-amber-400' : 'text-slate-500'} hidden sm:inline`}>
                {num === 1 ? 'Conceito' : num === 2 ? 'Raça & Classe' : num === 3 ? 'Atributos' : 'Revisão'}
              </span>
            </div>
          ))}
        </div>

        {/* CONTEÚDO DO PASSO */}
        <div className="p-6 flex-1 space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-black uppercase text-amber-400">Passo 1: Nome & Antecedentes</h3>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nome do Personagem</label>
                <input
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-3 text-sm font-bold text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Antecedente (Background)</label>
                  <select
                    value={selectedBackground}
                    onChange={(e) => setSelectedBackground(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-medium"
                  >
                    {DND_BACKGROUNDS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Tendência Alinhamento</label>
                  <select
                    value={selectedAlignment}
                    onChange={(e) => setSelectedAlignment(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-medium"
                  >
                    {DND_ALIGNMENTS.map((al) => (
                      <option key={al} value={al}>{al}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs font-black uppercase text-amber-400">Passo 2: Raça & Classe</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Raça</label>
                  <select
                    value={selectedRace}
                    onChange={(e) => setSelectedRace(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-bold"
                  >
                    {Object.keys(DND_RACES).map((raceKey) => (
                      <option key={raceKey} value={raceKey}>{raceKey}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Classe</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none font-bold"
                  >
                    {Object.keys(DND_CLASSES).map((classKey) => (
                      <option key={classKey} value={classKey}>{classKey}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nível Inicial (1 a 20)</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl p-2.5 text-sm font-black text-amber-400 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-amber-400">Passo 3: Distribuição de Atributos (Point Buy)</h3>
                
                {/* BOTÕES DE PRESET */}
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAttributes({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 })}
                    className="text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg border border-slate-700"
                  >
                    Reset (8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttributes({ str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 })}
                    className="text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/30"
                  >
                    Standard Array
                  </button>
                </div>
              </div>

              {/* LABEL DE PONTOS RESTANTES (D&D 5e POINT BUY: 27 PONTOS TOTAIS) */}
              {(() => {
                const POINT_COSTS: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
                const totalSpent = Object.values(attributes).reduce((sum, score) => sum + (POINT_COSTS[score] ?? 0), 0);
                const remainingPoints = 27 - totalSpent;

                return (
                  <div className="bg-[#0b0f19] border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-300 block">Sistema Point Buy D&D 5.0</span>
                      <span className="text-[10px] text-slate-400">Base 8 | Custo máximo 15</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Pontos Restantes</span>
                      <span
                        className={`text-lg font-black font-mono ${
                          remainingPoints > 0
                            ? 'text-emerald-400'
                            : remainingPoints === 0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {remainingPoints} / 27
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* GRID DE ATRIBUTOS COM CONTROLES + / - */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((attrKey) => {
                  const POINT_COSTS: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
                  const currentScore = attributes[attrKey];
                  const mod = Math.floor((currentScore - 10) / 2);
                  const totalSpent = Object.values(attributes).reduce((sum, score) => sum + (POINT_COSTS[score] ?? 0), 0);
                  const remainingPoints = 27 - totalSpent;

                  const canIncrease = currentScore < 15 && (POINT_COSTS[currentScore + 1] - POINT_COSTS[currentScore]) <= remainingPoints;
                  const canDecrease = currentScore > 8;

                  const handleAdjust = (delta: number) => {
                    const next = currentScore + delta;
                    if (next >= 8 && next <= 15) {
                      setAttributes({ ...attributes, [attrKey]: next });
                    }
                  };

                  return (
                    <div key={attrKey} className="bg-[#0b0f19] border border-slate-800 rounded-xl p-2.5 text-center space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-amber-400">{attrKey}</span>
                        <span className="text-[10px] font-bold font-mono text-slate-400">
                          {mod >= 0 ? `+${mod}` : mod}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => handleAdjust(-1)}
                          disabled={!canDecrease}
                          className="w-7 h-7 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 font-bold text-sm flex items-center justify-center"
                        >
                          −
                        </button>
                        <span className="text-base font-black text-white font-mono">{currentScore}</span>
                        <button
                          type="button"
                          onClick={() => handleAdjust(1)}
                          disabled={!canIncrease}
                          className="w-7 h-7 rounded bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 font-bold text-sm flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in bg-[#0b0f19] border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-xs font-black uppercase text-amber-400">Passo 4: Resumo da Ficha Gerada</h3>
              <div className="space-y-2 text-xs text-slate-300">
                <p><strong>Nome:</strong> {characterName}</p>
                <p><strong>Raça:</strong> {selectedRace} | <strong>Classe:</strong> {selectedClass} Nível {selectedLevel}</p>
                <p><strong>Antecedente:</strong> {selectedBackground} | <strong>Tendência:</strong> {selectedAlignment}</p>
                <p><strong>Atributos:</strong> FOR {attributes.str}, DES {attributes.dex}, CON {attributes.con}, INT {attributes.int}, SAB {attributes.wis}, CAR {attributes.cha}</p>
              </div>
            </div>
          )}
        </div>

        {/* NAVEGAÇÃO DE BOTÕES DO RODAPÉ */}
        <div className="bg-[#141b2d] border-t border-slate-800 px-5 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-lg"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishWizard}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-black shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Criar Personagem!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
