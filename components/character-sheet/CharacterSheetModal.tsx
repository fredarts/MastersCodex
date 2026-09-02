import React, { useState, useEffect } from 'react';
import { AdvantageMode, CharacterSheet, DiceRollEvent, PlayerRollEvent } from '@/lib/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { GeneralSection } from './Sections/GeneralSection';
import { CombatSection } from './Sections/CombatSection';
import { SkillsSection } from './Sections/SkillsSection';
import { EquipmentSection } from './Sections/EquipmentSection';
import { SpellsSection } from './Sections/SpellsSection';
import { RPSection } from './Sections/RPSection';
import { JournalSection } from './Sections/JournalSection';
import { ClassAbilitiesSection } from './Sections/ClassAbilitiesSection';
import { QuickCombatBar } from './QuickCombatBar';
import { CharacterBuilderWizardModal } from './Modals/CharacterBuilderWizardModal';
import { ImportCharacterModal } from './ImportCharacterModal';
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
  ScrollText,
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
  playerName?: string;
}

type TabType = 'general' | 'combat' | 'skills' | 'abilities' | 'equipment' | 'spells' | 'rp' | 'journal';

const NAV_TABS: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'general', label: 'Geral & Identidade', icon: User },
  { id: 'combat', label: 'Atributos & Combate', icon: Shield },
  { id: 'skills', label: 'Perícias & Testes', icon: Target },
  { id: 'abilities', label: 'Habilidades de Classe', icon: Wand2 },
  { id: 'equipment', label: 'Equipamentos & Tesouros', icon: Package },
  { id: 'spells', label: 'Conjuração & Magias', icon: Sparkles },
  { id: 'rp', label: 'História & RP (Bio)', icon: BookOpen },
  { id: 'journal', label: 'Diário & Missões', icon: ScrollText },
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
  playerName,
}) => {
  const { showAlert } = useCustomDialog();
  const [sheet, setSheet] = useState<CharacterSheet>(initialSheet);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [advantageMode, setAdvantageMode] = useState<AdvantageMode>('normal');
  const [lastRoll, setLastRoll] = useState<DiceRollEvent | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [headerAvatarAspect, setHeaderAvatarAspect] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sincroniza o estado interno da ficha sempre que a ficha inicial mudar (ex: ao salvar remotamente)
  useEffect(() => {
    if (isOpen) {
      setSheet(initialSheet);
    }
  }, [initialSheet, isOpen]);

  // Sincroniza em tempo real se o personagem receber itens ou moedas enquanto a ficha estiver aberta
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;

    const handleLootReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterName, userId: targetUserId, item, currency, sourceName } = customEvent.detail || {};

      const normalize = (s?: string) =>
        (s || '')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');

      const targetNorm = normalize(characterName);
      const currentNorm = normalize(sheet.characterName);

      const isForMe =
        (targetUserId && (targetUserId === sheet.userId)) ||
        (targetNorm && (targetNorm === currentNorm || currentNorm.includes(targetNorm) || targetNorm.includes(currentNorm))) ||
        (!characterName && !targetUserId && currency);

      if (isForMe) {
        setSheet((prev) => {
          const updated = { ...prev };
          if (currency) {
            const cur = updated.currency || { po: 0, pp: 0, pc: 0, pe: 0, pl: 0 };
            updated.currency = {
              po: (cur.po || 0) + (currency.po || 0),
              pp: (cur.pp || 0) + (currency.pp || 0),
              pc: (cur.pc || 0) + (currency.pc || 0),
              pe: (cur.pe || 0) + (currency.pe || 0),
              pl: (cur.pl || 0) + (currency.pl || 0),
            };

            const newEntries: any[] = [];
            const nowStr = new Date().toLocaleString('pt-BR');
            (['po', 'pp', 'pc', 'pe', 'pl'] as const).forEach((type) => {
              const amount = currency[type];
              if (amount && amount > 0) {
                newEntries.push({
                  id: `${Date.now()}-${type}`,
                  type: 'loot',
                  amount,
                  coinType: type,
                  reason: sourceName || 'Recompensa de Loot (Mestre)',
                  date: nowStr,
                });
              }
            });
            if (newEntries.length > 0) {
              updated.transactionHistory = [...newEntries, ...(updated.transactionHistory || [])];
            }
          }

          if (item) {
            const currentEq = updated.equipment || [];
            const safeId = item.id || `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            updated.equipment = [...currentEq, { ...item, id: safeId }];
          }

          updated.updatedAt = new Date().toISOString();
          onSave(updated);
          return updated;
        });
      }
    };

    window.addEventListener('masters_codex_loot_received', handleLootReceived);
    window.addEventListener('masters_codex_sheets_updated', handleLootReceived);
    return () => {
      window.removeEventListener('masters_codex_loot_received', handleLootReceived);
      window.removeEventListener('masters_codex_sheets_updated', handleLootReceived);
    };
  }, [isOpen, sheet.characterName, onSave]);

  // Sincronização direta com Supabase Realtime: Escuta alterações na tabela character_sheets
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured()) return;

    const normalize = (s?: string) =>
      (s || '')
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const channelId = `sheet_live_${sheet.id || sheet.characterName}_${Math.random().toString(36).substring(2, 7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'character_sheets',
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            const row = payload.new as any;
            const remoteData = row.data as CharacterSheet;
            const rowCharName = normalize(row.character_name || remoteData.characterName);
            const myCharName = normalize(sheet.characterName);

            const isMySheet =
              (row.id && sheet.id && row.id === sheet.id) ||
              (row.user_id && sheet.userId && row.user_id === sheet.userId) ||
              (rowCharName && myCharName && (rowCharName === myCharName || rowCharName.includes(myCharName) || myCharName.includes(rowCharName)));

            if (isMySheet && remoteData) {
              setSheet((prev) => ({
                ...prev,
                ...remoteData,
                currency: remoteData.currency || prev.currency,
                equipment: remoteData.equipment || prev.equipment,
                transactionHistory: remoteData.transactionHistory || prev.transactionHistory,
                attributes: remoteData.attributes || prev.attributes,
              }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, sheet.id, sheet.characterName, sheet.userId]);

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
    onClose();
  };

  const handleRollExecuted = (event: DiceRollEvent) => {
    setLastRoll(event);
    if (onRollEvent) onRollEvent(event);
    if (broadcastRoll) {
      const heroAvatar = sheet.faceImageUrl || sheet.avatarUrl || (Array.isArray(sheet.images) && sheet.images.length > 0 ? sheet.images[0] : undefined);
      broadcastRoll({
        id: event.id,
        characterName: event.characterName || sheet.characterName || 'Personagem',
        playerName: playerName || sheet.playerName || undefined,
        avatarUrl: heroAvatar,
        rollType: event.rollType === 'attack' ? 'attack' : event.rollType === 'skill' ? 'skill' : event.rollType === 'saving_throw' ? 'save' : 'custom',
        label: event.label,
        d20Roll: event.selectedD20 || event.d20Roll1 || 10,
        d20Roll1: event.d20Roll1,
        d20Roll2: event.d20Roll2,
        modifier: event.modifier,
        total: event.total,
        isCrit: event.isCrit,
        isFail: event.isFail,
        dc: event.dc,
        isSuccess: event.isSuccess,
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
      <header className="bg-[#0f0e0d] border-b border-amber-500/20 px-3 py-1.5 flex items-center justify-between shrink-0 shadow-lg relative z-20 gap-2">
        {/* BOTÃO DO MENU SANDUÍCHE (MOBILE ONLY) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="p-1.5 rounded-lg bg-[#141b2d] border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 lg:hidden cursor-pointer"
          aria-label="Abrir Menu de Seções"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase hidden sm:inline">Menu Ficha</span>
        </button>

        {/* DETALHES RÁPIDOS DO PERSONAGEM */}
        {(() => {
          const heroAvatar = sheet.faceImageUrl || sheet.avatarUrl || (Array.isArray(sheet.images) && sheet.images.length > 0 ? (sheet.images.length > 1 ? sheet.images[1] : sheet.images[0]) : undefined);
          return (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative w-8 h-8 rounded-lg bg-[#0a0e17] border border-amber-500/40 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {heroAvatar ? (
                  <img 
                     key={heroAvatar}
                     src={heroAvatar} 
                     alt={sheet.characterName || 'Avatar'} 
                     className="w-full h-full object-cover object-center" 
                  />
                ) : (
                  <User className="w-4 h-4 text-amber-400/80" />
                )}
              </div>
              <div className="flex flex-col whitespace-nowrap">
                <h2 className="text-xs font-black text-amber-400 font-serif leading-tight">
                  {sheet.characterName || 'Sem Nome'}
                </h2>
                <span className="text-[9px] font-semibold text-slate-400 leading-tight">
                  {sheet.race} {sheet.className} (Nív. {sheet.level})
                </span>
              </div>
            </div>
          );
        })()}

        {/* NAVEGAÇÃO DE ABAS SUPERIORES - DESKTOP / TABLET */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#12100e] border border-amber-500/25 px-1.5 py-0.5 rounded-xl shadow-inner mx-1">
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
              journal: 'Diário',
            };
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSettingsOpen(false);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider font-serif transition-all border cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 text-gold-glow shadow-sm'
                    : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{shortLabels[tab.id]}</span>
              </button>
            );
          })}
        </nav>

        {/* AÇÕES DE SALVAR, CONFIGURAÇÕES E FECHAR */}
        <div className="flex items-center gap-1.5 shrink-0 relative">
          {/* MENU DROPDOWN DE FERRAMENTAS */}
          {!readOnly && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
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
                    onClick={() => { setIsImportModalOpen(true); setIsSettingsOpen(false); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-all text-left"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Importar D&D Beyond / JSON
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
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer"
              title="Minimizar Ficha"
            >
              <Minus className="w-4 h-4" />
            </button>
          )}

          {readOnly ? (
            <span className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold text-[9px] px-2 py-1 rounded-lg">
              <Eye className="w-3 h-3" />
              LEITURA
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-md active:scale-95 transition-transform cursor-pointer flex items-center justify-center"
              title="Salvar Ficha"
            >
              {isSavedFeedback ? (
                <CheckCircle2 className="w-4 h-4 text-slate-950 animate-bounce" />
              ) : (
                <Save className="w-4 h-4 text-slate-950" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 cursor-pointer flex items-center justify-center"
            title="Fechar Ficha"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* CONTEÚDO DA ABA SELECIONADA (100% DA ALTURA LIVRE ZERO-SCROLL) */}
      <main className="flex-1 min-h-0 overflow-hidden px-3 py-2 max-w-7xl w-full mx-auto relative flex flex-col">
        {/* BANNER FLUTUANTE DE FEEDBACK DE ROLAGEM */}
        {lastRoll && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#141b2d]/95 border border-amber-500/50 rounded-2xl px-5 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-4 animate-bounce-subtle">
            <Dices className="w-5 h-5 text-amber-400 animate-spin-once" />
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block font-serif">{lastRoll.characterName}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white font-serif">{lastRoll.label}:</span>
                <span className="text-lg font-black text-amber-400 font-mono">{lastRoll.total}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  (d20: {lastRoll.selectedD20 ?? 10} {lastRoll.modifier >= 0 ? `+${lastRoll.modifier}` : lastRoll.modifier})
                  {lastRoll.isCrit && ' 🔥 CRÍTICO!'}
                  {lastRoll.isFail && ' 💀 FALHA CRÍTICA!'}
                </span>
              </div>
            </div>
            <button type="button" onClick={() => setLastRoll(null)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <fieldset disabled={readOnly} className={`border-none p-0 m-0 min-w-0 flex-1 min-h-0 flex flex-col overflow-hidden ${readOnly ? 'pointer-events-none select-none' : ''}`}>
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
          {activeTab === 'journal' && <JournalSection sheet={sheet} onChange={readOnly ? () => {} : setSheet} />}
        </fieldset>
      </main>

      {/* BARRA DE COMBATE DE ACESSO RÁPIDO NO RODAPÉ */}
      {!readOnly && (
        <QuickCombatBar
          sheet={sheet}
          onChange={setSheet}
          advantageMode={advantageMode}
          onAdvantageModeChange={setAdvantageMode}
        />
      )}

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
                    onClick={() => { setIsImportModalOpen(true); setIsDrawerOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Importar D&D Beyond / JSON
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
                <span>Salvar Ficha</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODAL DO CRIADOR GUIADO (WIZARD) */}
      <CharacterBuilderWizardModal
        userId={sheet.userId || 'user'}
        campaignId={sheet.campaignId}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialValues={{
          characterName: sheet.characterName,
          race: sheet.race,
          subrace: sheet.subrace,
          className: sheet.className,
          level: sheet.level,
          background: sheet.background,
          alignment: sheet.alignment,
        }}
        onCharacterCreated={(newSheet) => {
          setSheet(newSheet);
          onSave(newSheet);
        }}
      />

      {/* MODAL DO IMPORTADOR D&D BEYOND & JSON */}
      <ImportCharacterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(importedSheet) => {
          setSheet(importedSheet);
          onSave(importedSheet);
        }}
      />
    </div>
  );
};
