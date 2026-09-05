'use client';

import React, { useState, useEffect } from 'react';
import { CharacterSheet, ConditionType } from '@/lib/types';
import { CompanionHeader } from './CompanionHeader';
import { CompanionBottomNav, CompanionTab } from './CompanionBottomNav';
import { CompanionHpController } from './CompanionHpController';
import { CompanionDeathSaves } from './CompanionDeathSaves';
import { CompanionDiceRoller } from './CompanionDiceRoller';
import { CompanionActionPad } from './CompanionActionPad';
import { CompanionSpellsSlots } from './CompanionSpellsSlots';
import { User, Users, RefreshCw, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/haptics/hapticFeedback';

const STORAGE_KEY = 'masters_codex_character_sheets_v1';

interface MobileCompanionViewProps {
  initialCharacterId?: string;
}

export const MobileCompanionView: React.FC<MobileCompanionViewProps> = ({
  initialCharacterId,
}) => {
  const [sheets, setSheets] = useState<CharacterSheet[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CompanionTab>('actions');
  const [isCharacterSwitcherOpen, setIsCharacterSwitcherOpen] = useState(false);

  // Carregar fichas salvas
  const loadSheets = () => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: CharacterSheet[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSheets(parsed);
          if (!selectedSheetId) {
            if (initialCharacterId && parsed.some((s) => s.id === initialCharacterId)) {
              setSelectedSheetId(initialCharacterId);
            } else {
              setSelectedSheetId(parsed[0].id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar fichas para Mobile Companion:', err);
    }
  };

  useEffect(() => {
    loadSheets();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadSheets();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const activeSheet = sheets.find((s) => s.id === selectedSheetId) || sheets[0] || null;

  // Persistir alterações da ficha
  const updateSheet = (updated: CharacterSheet) => {
    const newSheets = sheets.map((s) => (s.id === updated.id ? updated : s));
    setSheets(newSheets);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSheets));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleUpdateHp = (currentHp: number, tempHp: number) => {
    if (!activeSheet) return;
    updateSheet({
      ...activeSheet,
      currentHp,
      tempHp,
    });
  };

  const handleToggleCondition = (condition: ConditionType) => {
    if (!activeSheet) return;
    const currentConditions = activeSheet.conditions || [];
    const exists = currentConditions.includes(condition);
    const updatedConditions = exists
      ? currentConditions.filter((c) => c !== condition)
      : [...currentConditions, condition];

    updateSheet({
      ...activeSheet,
      conditions: updatedConditions,
    });
  };

  const handleUpdateDeathSaves = (successes: number, failures: number) => {
    if (!activeSheet) return;
    updateSheet({
      ...activeSheet,
      deathSaves: { successes, failures },
    });
  };

  const handleRevive = (hp: number) => {
    if (!activeSheet) return;
    updateSheet({
      ...activeSheet,
      currentHp: hp,
      deathSaves: { successes: 0, failures: 0 },
    });
  };

  if (!activeSheet) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-amber-400">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">Nenhum Personagem Encontrado</h2>
        <p className="text-xs text-slate-400 max-w-xs mb-6">
          Crie ou carregue uma ficha na aplicação principal para usar o Pocket Companion Mobile.
        </p>
        <button
          onClick={() => {
            haptic.tap();
            window.location.href = '/';
          }}
          className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-transform"
        >
          Ir para a Forja / Criar Ficha
        </button>
      </main>
    );
  }

  const isDeadOrDying = (activeSheet.currentHp ?? activeSheet.maxHp ?? 10) <= 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased overflow-x-hidden">
      {/* Quick Character Switcher Bar */}
      {sheets.length > 1 && (
        <div className="bg-slate-950 border-b border-slate-800/80 px-3 py-1.5 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              haptic.tap();
              setIsCharacterSwitcherOpen(true);
            }}
            className="flex items-center gap-1.5 text-slate-300 font-bold hover:text-white"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Trocar: {activeSheet.characterName}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>
          <span className="text-[10px] text-slate-500 font-mono">POCKET COMPANION</span>
        </div>
      )}

      {/* Sticky Header with Vital Stats */}
      <CompanionHeader
        sheet={activeSheet}
        onUpdateHp={handleUpdateHp}
        onToggleCondition={handleToggleCondition}
      />

      {/* Main Tab Content */}
      <div className="flex-1 px-3.5 pt-3.5 overflow-y-auto">
        {/* If dying at 0 HP and in Life Tab, show Death Saves at top */}
        {isDeadOrDying && activeTab === 'life' && (
          <div className="mb-4">
            <CompanionDeathSaves
              sheet={activeSheet}
              onUpdateDeathSaves={handleUpdateDeathSaves}
              onRevive={handleRevive}
            />
          </div>
        )}

        {/* Tab 1: Actions & Weapons */}
        {activeTab === 'actions' && (
          <CompanionActionPad sheet={activeSheet} />
        )}

        {/* Tab 2: HP & Life Management */}
        {activeTab === 'life' && (
          <CompanionHpController
            sheet={activeSheet}
            onUpdateHp={handleUpdateHp}
          />
        )}

        {/* Tab 3: Tactical Dice Roller & Skills */}
        {activeTab === 'dice' && (
          <CompanionDiceRoller sheet={activeSheet} />
        )}

        {/* Tab 4: Spell Slots & Rest Resources */}
        {activeTab === 'resources' && (
          <CompanionSpellsSlots
            sheet={activeSheet}
            onUpdateSheet={updateSheet}
          />
        )}
      </div>

      {/* Character Switcher Modal */}
      {isCharacterSwitcherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end p-3 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 max-h-[70vh] flex flex-col shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> Selecionar Personagem
            </h3>
            <div className="overflow-y-auto flex flex-col gap-1.5">
              {sheets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    haptic.tap();
                    setSelectedSheetId(s.id);
                    setIsCharacterSwitcherOpen(false);
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    s.id === activeSheet.id
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{s.characterName || 'Sem Nome'}</div>
                    <div className="text-[10px] text-slate-400">
                      Nív. {s.level || 1} • {s.race || ''} {s.className || ''}
                    </div>
                  </div>
                  {s.id === activeSheet.id && (
                    <span className="text-amber-400 text-xs font-bold">Ativo</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsCharacterSwitcherOpen(false)}
              className="mt-3 w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Fixed Thumb Zone Bottom Navigation */}
      <CompanionBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isDeadOrDying={isDeadOrDying}
      />
    </main>
  );
};
