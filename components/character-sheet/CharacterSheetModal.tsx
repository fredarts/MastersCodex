import React, { useState, useEffect } from 'react';
import { AdvantageMode, CharacterSheet, DiceRollEvent, PlayerRollEvent } from '@/lib/types';
import { GeneralSection } from './Sections/GeneralSection';
import { CombatSection } from './Sections/CombatSection';
import { SkillsSection } from './Sections/SkillsSection';
import { EquipmentSection } from './Sections/EquipmentSection';
import { SpellsSection } from './Sections/SpellsSection';
import { RPSection } from './Sections/RPSection';
import { ClassAbilitiesSection } from './Sections/ClassAbilitiesSection';
import { QuickCombatBar } from './QuickCombatBar';
import { CharacterBuilderWizardModal } from './Modals/CharacterBuilderWizardModal';
import { exportCharacterToJson, importCharacterFromJson, exportCharacterToPrintablePdf } from '@/lib/character-exporter';
import { useCustomDialog } from '@/context/CustomDialogContext';
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
  Dices,
  TrendingUp,
  TrendingDown,
  Download,
  Upload,
  Printer,
  Wand2,
  Minus,
  Eye,
  Settings,
} from 'lucide-react';

interface CharacterSheetModalProps {
  sheet: CharacterSheet;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSheet: CharacterSheet) => void;
  onRollEvent?: (event: DiceRollEvent) => void;
  onMinimize?: () => void;
  broadcastRoll?: (roll: PlayerRollEvent) => void;
  lockBaseAttributes?: boolean;
  readOnly?: boolean;
}

type TabType = 'general' | 'combat' | 'skills' | 'abilities' | 'equipment' | 'spells' | 'rp';

const NAV_TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'general', label: 'Geral & Identidade', icon: User },
  { id: 'combat', label: 'Atributos & Combate', icon: Shield },
  { id: 'skills', label: 'Perícias & Testes', icon: Target },
  { id: 'abilities', label: 'Habilidades de Classe', icon: Wand2 },
  { id: 'equipment', label: 'Equipamentos & Tesouros', icon: Package },
  { id: 'spells', label: 'Conjuração & Magias', icon: Sparkles },
  { id: 'rp', label: 'História & RP (Bio)', icon: BookOpen },
];

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  sheet: initialSheet,
  isOpen,
  onClose,
  onSave,
  onRollEvent,
  onMinimize,
  broadcastRoll,
  lockBaseAttributes = false,
  readOnly = false,
}) => {
  const { showAlert } = useCustomDialog();
  const [sheet, setSheet] = useState<CharacterSheet>(initialSheet);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [lastRoll, setLastRoll] = useState<DiceRollEvent | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [headerAvatarAspect, setHeaderAvatarAspect] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sincroniza o estado interno da ficha sempre que a ficha inicial mudar (ex: ao salvar remotamente)
  useEffect(() => {
    if (isOpen) {
      setSheet(initialSheet);
    }
  }, [initialSheet, isOpen]);

  // Reseta a aba para a inicial apenas quando o modal for recém-aberto
  useEffect(() => {
    if (isOpen) {
      setActiveTab('general');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (readOnly) return;
    onSave(sheet);
    setIsSavedFeedback(true);
    setTimeout(() => {
      setIsSavedFeedback(false);
    }, 1200);
  };

  const handleClose = () => {
    if (!readOnly) onSave(sheet);
    onClose();
  };

  const handleRollExecuted = (event: DiceRollEvent) => {
    setLastRoll(event);
    if (onRollEvent) onRollEvent(event);
    if (broadcastRoll) {
      broadcastRoll({
        id: event.id,
        characterName: event.characterName || sheet.characterName,
        rollType: event.rollType === 'attack' ? 'attack' : event.rollType === 'skill' ? 'skill' : event.rollType === 'saving_throw' ? 'save' : 'custom',
        label: event.label,
        d20Roll: event.selectedD20 || event.d20Roll1 || 10,
        modifier: event.modifier,
        total: event.total,
        isCrit: event.isCrit,
        isFail: event.isFail,
        advantageMode: event.advantageMode,
        timestamp: event.timestamp || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
    setTimeout(() => {
      setLastRoll((prev) => (prev?.id === event.id ? null : prev));
    }, 4500);
  };

  const handleImportJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importCharacterFromJson(file);
      setSheet(imported);
      onSave(imported);
      showAlert({
        title: 'Ficha Importada',
        message: 'Ficha importada com sucesso!',
        variant: 'success',
      });
    } catch (err) {
      showAlert({
        title: 'Erro de Importação',
        message: 'Erro ao importar ficha: ' + (err as Error).message,
        variant: 'danger',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-fade-in">
      {/* WIZARD MODAL */}
      <CharacterBuilderWizardModal
        userId={sheet.userId}
        campaignId={sheet.campaignId}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCharacterCreated={(newSheet) => {
          setSheet(newSheet);
          onSave(newSheet);
        }}
      />

      {/* HEADER SUPERIOR FIXO (ESTILO JOGO RPG - BG3) */}
      <header className="bg-[#0f0e0d] border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-lg relative z-20">
        {/* BOTÃO DO MENU SANDUÍCHE (MOBILE ONLY) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-2 rounded-xl bg-[#141b2d] border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-2 lg:hidden"
          aria-label="Abrir Menu de Seções"
        >
          <Menu className="w-5 h-5" />
          <span className="text-xs font-bold uppercase hidden sm:inline">Menu Ficha</span>
        </button>

        {/* DETALHES RÁPIDOS DO PERSONAGEM (Pushed left on desktop) */}
        <div className="flex items-center gap-2.5 lg:mr-auto">
          <div className="relative w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0">
            {sheet.avatarUrl ? (
              <img 
                 src={sheet.avatarUrl} 
                 alt={sheet.characterName} 
                 onLoad={(e) => setHeaderAvatarAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                 className="absolute max-w-none transition-all duration-300" 
                 style={{
                   width: headerAvatarAspect >= 1 ? 'auto' : '100%',
                   height: headerAvatarAspect >= 1 ? '100%' : 'auto',
                   minWidth: headerAvatarAspect >= 1 ? '100%' : 'auto',
                   minHeight: headerAvatarAspect >= 1 ? 'auto' : '100%',
                   top: '50%',
                   left: '50%',
                   transform: sheet.avatarSettings 
                     ? `translate(calc(-50% + ${sheet.avatarSettings.offsetX * (36/256)}px), calc(-50% + ${sheet.avatarSettings.offsetY * (36/256)}px)) scale(${sheet.avatarSettings.zoom})`
                     : `translate(-50%, calc(-50% - 15%)) scale(1.7)`,
                 }}
              />
            ) : (
              <User className="w-5 h-5 text-amber-400/80" />
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-amber-400 font-serif leading-none truncate max-w-[140px] md:max-w-[200px]">
              {sheet.characterName || 'Sem Nome'}
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 leading-tight">
              {sheet.race} {sheet.className} (Nível {sheet.level})
            </span>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS SUPERIORES - DESKTOP ONLY */}
        <nav className="hidden lg:flex items-center gap-1.5 bg-[#12100e] border border-amber-500/25 px-2 py-1 rounded-xl shadow-inner mx-auto">
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const shortLabels: Record<TabType, string> = {
              general: 'Geral',
              combat: 'Combate',
              skills: 'Perícias',
              abilities: 'Habilidades',
              equipment: 'Equipamento',
              spells: 'Magias',
              rp: 'Biografia',
            };
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSettingsOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider font-serif transition-all border ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 text-gold-glow'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{shortLabels[tab.id]}</span>
              </button>
            );
          })}
        </nav>

        {/* AÇÕES DE SALVAR, CONFIGURAÇÕES E FECHAR (Pushed right on desktop) */}
        <div className="flex items-center gap-2 lg:ml-auto relative">
          {/* MENU DROPDOWN DE FERRAMENTAS - DESKTOP ONLY */}
          {!readOnly && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-2 rounded-xl border transition-all ${
                  isSettingsOpen 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                }`}
                title="Opções da Ficha"
              >
                <Settings className="w-4 h-4" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#0f0e0d] border border-amber-500/30 rounded-xl shadow-2xl p-2 z-50 animate-fade-in flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase text-[#a39682] px-2.5 py-1.5 border-b border-amber-500/10 tracking-wider">
                    Ferramentas & Exportação
                  </span>
                  <button
                    type="button"
                    onClick={() => { setIsWizardOpen(true); setIsSettingsOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-all text-left"
                  >
                    <Wand2 className="w-4 h-4" />
                    Criador Guiado (Wizard)
                  </button>
                  <button
                    type="button"
                    onClick={() => { exportCharacterToJson(sheet); setIsSettingsOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all text-left"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Exportar JSON
                  </button>
                  <label className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer text-left">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Importar JSON</span>
                    <input type="file" accept=".json" onChange={(e) => { handleImportJsonFile(e); setIsSettingsOpen(false); }} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={() => { exportCharacterToPrintablePdf(sheet); setIsSettingsOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all text-left"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    Imprimir / PDF
                  </button>
                </div>
              )}
            </div>
          )}

          {onMinimize && !readOnly && (
            <button
              type="button"
              onClick={onMinimize}
              className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700"
              title="Minimizar Ficha"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {readOnly ? (
            <span className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-[10px] px-2.5 py-1.5 rounded-xl">
              <Eye className="w-3.5 h-3.5" />
              LEITURA
            </span>
          ) : (
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
          )}
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SELETOR DE MODO DE DADO (VANTAGEM / NORMAL / DESVANTAGEM) */}
      <div className="bg-[#0b0f19] border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <Dices className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-extrabold uppercase text-slate-400">Modo de Rolagem d20:</span>
        </div>

        <div className="flex items-center bg-[#141b2d] p-0.5 rounded-xl border border-slate-800 gap-1">
          <button
            type="button"
            onClick={() => setAdvantageMode('disadvantage')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
              advantageMode === 'disadvantage'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            Desvantagem
          </button>
          <button
            type="button"
            onClick={() => setAdvantageMode('normal')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
              advantageMode === 'normal'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setAdvantageMode('advantage')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
              advantageMode === 'advantage'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Vantagem
          </button>
        </div>
      </div>



      {/* CONTEÚDO DA ABA SELECIONADA */}
      <main className="flex-1 overflow-y-auto lg:overflow-hidden p-4 max-w-4xl lg:max-w-7xl w-full mx-auto relative scrollbar-thin lg:flex lg:flex-col lg:min-h-0 lg:h-[calc(100vh-120px)]">
        {/* BANNER FLUTUANTE DE FEEDBACK DE ROLAGEM */}
        {lastRoll && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#141b2d]/95 border border-amber-500/50 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-bounce-subtle">
            <Dices className="w-6 h-6 text-amber-400 animate-spin-once" />
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block">{lastRoll.characterName}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white">{lastRoll.label}:</span>
                <span className="text-xl font-black text-amber-400 font-mono">{lastRoll.total}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (d20: {lastRoll.selectedD20 ?? 10} {lastRoll.modifier >= 0 ? `+${lastRoll.modifier}` : lastRoll.modifier})
                  {lastRoll.isCrit && ' 🔥 CRÍTICO!'}
                  {lastRoll.isFail && ' 💀 FALHA CRÍTICA!'}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setLastRoll(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <fieldset disabled={readOnly} className={`border-none p-0 m-0 min-w-0 lg:h-full lg:flex lg:flex-col lg:min-h-0 ${readOnly ? 'pointer-events-none select-none' : ''}`}>
          {activeTab === 'general' && <GeneralSection sheet={sheet} onChange={readOnly ? () => {} : setSheet} />}
          {activeTab === 'combat' && (
            <CombatSection
              sheet={sheet}
              onChange={readOnly ? () => {} : setSheet}
              advantageMode={advantageMode}
              onRoll={readOnly ? () => {} : handleRollExecuted}
            />
          )}
          {activeTab === 'skills' && (
            <SkillsSection
              sheet={sheet}
              onChange={readOnly ? () => {} : setSheet}
              advantageMode={advantageMode}
              onRoll={readOnly ? () => {} : handleRollExecuted}
            />
          )}
          {activeTab === 'abilities' && (
            <ClassAbilitiesSection
              sheet={sheet}
              onChange={readOnly ? () => {} : setSheet}
            />
          )}
          {activeTab === 'equipment' && <EquipmentSection sheet={sheet} onChange={readOnly ? () => {} : setSheet} />}
          {activeTab === 'spells' && <SpellsSection sheet={sheet} onChange={readOnly ? () => {} : setSheet} />}
          {activeTab === 'rp' && <RPSection sheet={sheet} onChange={readOnly ? () => {} : setSheet} />}
        </fieldset>
      </main>

      {/* BARRA DE COMBATE DE ACESSO RÁPIDO NO RODAPÉ */}
      {!readOnly && <QuickCombatBar sheet={sheet} onChange={setSheet} />}

      {/* DRAWER LATERAL DO MENU SANDUÍCHE (RETRÁTIL MOBILE) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none flex justify-start">
          <div className="pointer-events-auto bg-[#0f172a] border-r border-amber-500/30 w-72 h-full p-5 space-y-6 flex flex-col justify-between shadow-2xl animate-slide-right overflow-y-auto">
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

              {/* FERRAMENTAS E EXPORTAÇÃO */}
              {!readOnly && (
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-500 block tracking-wider">
                    Ferramentas &amp; Exportação
                  </span>

                  <button
                    type="button"
                    onClick={() => { setIsWizardOpen(true); setIsDrawerOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                  >
                    <Wand2 className="w-4 h-4" />
                    Criador Guiado (Wizard)
                  </button>

                  <button
                    type="button"
                    onClick={() => exportCharacterToJson(sheet)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white transition-all"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    Exportar JSON
                  </button>

                  <label className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white transition-all cursor-pointer">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Importar JSON</span>
                    <input type="file" accept=".json" onChange={handleImportJsonFile} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() => exportCharacterToPrintablePdf(sheet)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-slate-300 border border-slate-800 hover:text-white transition-all"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    Imprimir / PDF
                  </button>
                </div>
              )}
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={handleSave}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                Salvar Ficha de Personagem
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
