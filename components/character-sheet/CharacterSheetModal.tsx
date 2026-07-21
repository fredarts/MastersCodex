import React, { useState, useEffect } from 'react';
import { CharacterSheet } from '@/lib/types';
import { GeneralSection } from './Sections/GeneralSection';
import { CombatSection } from './Sections/CombatSection';
import { SkillsSection } from './Sections/SkillsSection';
import { EquipmentSection } from './Sections/EquipmentSection';
import { SpellsSection } from './Sections/SpellsSection';
import { RPSection } from './Sections/RPSection';
import { QuickCombatBar } from './QuickCombatBar';
import {
  Menu,
  X,
  User,
  Shield,
  Target,
  Package,
  Sparkles,
  BookOpen,
  Save,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

interface CharacterSheetModalProps {
  sheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSheet: CharacterSheet) => void;
}

type TabType = 'general' | 'combat' | 'skills' | 'equipment' | 'spells' | 'rp';

const NAV_TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'general', label: 'Geral & Identidade', icon: User },
  { id: 'combat', label: 'Atributos & Combate', icon: Shield },
  { id: 'skills', label: 'Perícias & Testes', icon: Target },
  { id: 'equipment', label: 'Equipamentos & Tesouros', icon: Package },
  { id: 'spells', label: 'Conjuração & Magias', icon: Sparkles },
  { id: 'rp', label: 'História & RP (Bio)', icon: BookOpen },
];

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  sheet: initialSheet,
  isOpen,
  onClose,
  onSave,
}) => {
  const [sheet, setSheet] = useState<CharacterSheet>(initialSheet);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Sincroniza o estado interno da ficha sempre que o modal for aberto ou a ficha inicial mudar
  useEffect(() => {
    if (isOpen) {
      setSheet(initialSheet);
      setActiveTab('general');
    }
  }, [initialSheet, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(sheet);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
      onClose();
    }, 800);
  };

  const handleClose = () => {
    onSave(sheet);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-fade-in">
      {/* HEADER SUPERIOR FIXO (MOBILE PORTRAIT FRIENDLY) */}
      <header className="bg-[#0f172a] border-b border-amber-500/30 px-4 py-3 flex items-center justify-between shrink-0 shadow-lg">
        {/* BOTÃO DO MENU SANDUÍCHE */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-[#141b2d] border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          aria-label="Abrir Menu de Seções"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-bold uppercase hidden sm:inline">Menu Ficha</span>
        </button>

        {/* DETALHES RÁPIDOS DO PERSONAGEM */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0">
            {sheet.avatarUrl ? (
              <img src={sheet.avatarUrl} alt={sheet.characterName} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-amber-400 leading-none truncate max-w-[160px]">
              {sheet.characterName || 'Sem Nome'}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 leading-tight">
              {sheet.race} {sheet.className} (Nível {sheet.level})
            </span>
          </div>
        </div>

        {/* BOTÃO SALVAR & FECHAR */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl shadow-md active:scale-95 transition-transform"
          >
            {isSavedFeedback ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* NAVEGAÇÃO DE ABAS RÁPIDAS (SCROLL HORIZONTAL PORTRAIT) */}
      <div className="bg-[#141b2d] border-b border-slate-800 px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-[#0b0f19] text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ÁREA DE CONTEÚDO PRINCIPAL COM SCROLL DA FICHA */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-xl mx-auto w-full relative">
        {activeTab === 'general' && <GeneralSection sheet={sheet} onChange={setSheet} />}
        {activeTab === 'combat' && <CombatSection sheet={sheet} onChange={setSheet} />}
        {activeTab === 'skills' && <SkillsSection sheet={sheet} onChange={setSheet} />}
        {activeTab === 'equipment' && <EquipmentSection sheet={sheet} onChange={setSheet} />}
        {activeTab === 'spells' && <SpellsSection sheet={sheet} onChange={setSheet} />}
        {activeTab === 'rp' && <RPSection sheet={sheet} onChange={setSheet} />}
      </main>

      {/* BARRA DE COMBATE DE ACESSO RÁPIDO NO RODAPÉ */}
      <QuickCombatBar sheet={sheet} onChange={setSheet} />

      {/* DRAWER LATERAL DO MENU SANDUÍCHE (RETRÁTIL MOBILE) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-start animate-fade-in">
          <div className="bg-[#0f172a] border-r border-amber-500/30 w-72 h-full p-5 space-y-6 flex flex-col justify-between shadow-2xl animate-slide-right">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Menu className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-extrabold uppercase text-amber-400 tracking-wider">
                    Partes da Ficha
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* LISTA DE NAVEGAÇÃO DO MENU SANDUÍCHE */}
              <div className="space-y-1.5">
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-[#141b2d] text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span>{tab.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              <Save className="w-4 h-4" />
              Salvar Ficha de Personagem
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
