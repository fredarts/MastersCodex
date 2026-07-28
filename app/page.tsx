'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { Header } from '@/components/Header';
import { Sidebar, ActiveTab } from '@/components/Sidebar';
import { SessionNavigator } from '@/components/SessionNavigator';
import { SessionStudio } from '@/components/SessionStudio';
import { WorldbuilderStudio } from '@/components/WorldbuilderStudio';
import { CampaignSettingsStudio } from '@/components/CampaignSettingsStudio';
import { CombatTracker } from '@/components/CombatTracker';
import { MapMaker } from '@/components/MapMaker';
import { AICoPilot } from '@/components/AICoPilot';
import { LoreGraph } from '@/components/LoreGraph';
import { AudioMaestro } from '@/components/AudioMaestro';
import { AudioMaestroPanel } from '@/components/AudioMaestroPanel';
import { AudioMaestroModal } from '@/components/AudioMaestroModal';
import { CompendiumModal } from '@/components/CompendiumModal';
import { PlayerViewModal } from '@/components/PlayerViewModal';
import { AuthModal } from '@/components/AuthModal';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { PlayerLobby } from '@/components/PlayerLobby';
import { LiveCockpitStudio } from '@/components/LiveCockpitStudio';
import { Combatant, Encounter, World, GameScene, UserCampaign } from '@/lib/types';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { createEmptyCharacterSheet } from '@/lib/dnd5e-data';
import { useLiveCockpit } from '@/context/LiveCockpitContext';
import { useCharacterSync } from '@/lib/hooks/useCharacterSync';
import { CharacterSheetModal } from '@/components/character-sheet/CharacterSheetModal';
import { MonsterStatBlockModal } from '@/components/live-cockpit/MonsterStatBlockModal';
import { MinimizedSheetsDock } from '@/components/live-cockpit/MinimizedSheetsDock';

function MainApp() {
  const { user, roleMode, loadDemoEverything } = useAuth();
  const { activeCampaign, setActiveCampaign, createFeedEvent } = useCampaign();
  const [activeTab, setActiveTab] = useState<ActiveTab>('live_cockpit');

  const { characterSheets, saveSheet } = useCharacterSync({
    userId: user?.id || '',
    campaignId: activeCampaign?.id,
  });

  const {
    activeSheets,
    minimizeSheet,
    maximizeSheet,
    closeSheet,
    combatants,
    setCombatants,
    currentTurnIndex,
    setCurrentTurnIndex,
    roundCount,
    setRoundCount,
  } = useLiveCockpit();
  
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isPlayerViewOpen, setIsPlayerViewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [selectedWorldForCampaign, setSelectedWorldForCampaign] = useState<World | null>(null);
  const [generatedLootResult, setGeneratedLootResult] = useState<string | null>(null);

  // Retractable Panels State (Sidebar & AI Drawer)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isAIPanelCollapsed, setIsAIPanelCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSidebar = localStorage.getItem('masters_codex_sidebar_collapsed');
      if (savedSidebar !== null) {
        setIsSidebarCollapsed(savedSidebar === 'true');
      }
      const savedAI = localStorage.getItem('masters_codex_ai_panel_collapsed');
      if (savedAI !== null) {
        setIsAIPanelCollapsed(savedAI === 'true');
      }
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_codex_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const toggleAIPanel = () => {
    setIsAIPanelCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('masters_codex_ai_panel_collapsed', String(next));
      }
      return next;
    });
  };

  const handleMonsterRoll = (title: string, bonus: number, isPrivate: boolean, desc?: string) => {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + bonus;
    const diceFormula = `1d20 + ${bonus}`;
    const message = `rolou ${title}: ${diceFormula} = **${total}** ${isPrivate ? '(Secreto)' : ''}`;

    createFeedEvent({
      campaignId: activeCampaign?.id || '',
      eventType: 'chat_message',
      title: `Rolagem: ${title}`,
      summary: message,
      details: {
        sender: 'Dungeon Master',
        message,
        isPrivate,
        rollDetails: { formula: diceFormula, result: total, d20 }
      },
      isPublic: !isPrivate
    });
  };

  const handleUpdateCombatant = (updated: Combatant) => {
    setCombatants((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  useEffect(() => {
    const handleModelUpdate = (sheet: any) => {
      const updatedModelUrl = sheet.modelUrl || getModelUrlByNameOrPath(sheet.className || sheet.characterName);
      setCombatants((prev) => {
        let hasChanges = false;
        const next = prev.map((c) => {
          const cClean = c.name.split('(')[0].trim().toLowerCase();
          const sheetClean = (sheet.characterName || '').split('(')[0].trim().toLowerCase();
          const isMatch =
            cClean === sheetClean ||
            c.name.toLowerCase().includes(sheetClean) ||
            sheetClean.includes(cClean);

          if (isMatch && c.modelUrl !== updatedModelUrl) {
            hasChanges = true;
            return { ...c, modelUrl: updatedModelUrl };
          }
          return c;
        });
        return hasChanges ? next : prev;
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('character_sheet_updated', (e: any) => {
        if (e.detail) handleModelUpdate(e.detail);
      });
    }
  }, [setCombatants]);

  const handleLoadEncounter = (encounter: Encounter) => {
    const loadedCombatants: Combatant[] = encounter.combatants.map((c, idx) => ({
      ...c,
      id: `enc-${Date.now()}-${idx}`,
      initiative: Math.floor(Math.random() * 20) + 1,
    }));
    setCombatants(loadedCombatants);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    setActiveTab('combat');
  };

  const handleLoadDemoEverything = () => {
    loadDemoEverything();
  };

  const handleEquipScene = (scene: GameScene) => {
    if (scene.combatants && scene.combatants.length > 0) {
      setCombatants(scene.combatants);
      setCurrentTurnIndex(0);
      setRoundCount(1);
    }
  };

  const handleOpenCreateCampaignWithWorld = (world: World) => {
    setSelectedWorldForCampaign(world);
    setIsCreateCampaignOpen(true);
  };

  const handleSelectCampaignFromWorld = (campaign: UserCampaign) => {
    setActiveCampaign(campaign);
    setActiveTab('live_cockpit');
  };

  const handleGenerateLootForCombat = (result?: string) => {
    if (result) {
      setGeneratedLootResult(result);
    } else {
      const defaultLoot = `💰 TESOURO DO COMBATE ATIVO:
• 24 Moedas de Prata e 12 Moedas de Ouro.
• 1x Adaga Ensanguentada do Líder Hobgoblin (+1 Acerto).
• 1x Anel com Brasão da Guilda das Sombras (Chave secreta).
• 1x Poção de Cura (2d4 + 2 HP).`;
      setGeneratedLootResult(defaultLoot);
    }
    setActiveTab('ai');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsCompendiumOpen(true)}
        onOpenPlayerView={() => setIsPlayerViewOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        isAIPanelCollapsed={isAIPanelCollapsed}
        onToggleAIPanel={toggleAIPanel}
      />

      {/* Main Workspace Body: Switch based on Role Mode */}
      {roleMode === 'player' ? (
        <PlayerLobby onOpenPlayerView={() => setIsPlayerViewOpen(true)} />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLoadEncounter={handleLoadEncounter}
            onOpenCreateCampaign={() => {
              setSelectedWorldForCampaign(null);
              setIsCreateCampaignOpen(true);
            }}
            onLoadDemoEverything={handleLoadDemoEverything}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />

          {/* Main Workspace Column */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* DM Session & Scene Timeline Navigation Bar (Visible only in Live Cockpit & Session Studio) */}
            {(activeTab === 'live_cockpit' || activeTab === 'session_studio') && (
              <SessionNavigator onEquipScene={handleEquipScene} />
            )}

            {/* Main Central DM Workspace Module */}
            <main className="flex-1 flex overflow-hidden relative">
              {activeTab === 'worldbuilder' && (
                <WorldbuilderStudio
                  onOpenCreateCampaignWithWorld={handleOpenCreateCampaignWithWorld}
                  onSelectCampaign={handleSelectCampaignFromWorld}
                />
              )}

              {activeTab === 'live_cockpit' && (
                <LiveCockpitStudio
                  onGenerateLoot={handleGenerateLootForCombat}
                  onOpenPlayerView={() => setIsPlayerViewOpen(true)}
                />
              )}

              {activeTab === 'session_studio' && (
                <SessionStudio onEquipScene={handleEquipScene} />
              )}

              {activeTab === 'campaign_settings' && (
                <CampaignSettingsStudio />
              )}

              {activeTab === 'combat' && (
                <CombatTracker
                  combatants={combatants}
                  setCombatants={setCombatants}
                  currentTurnIndex={currentTurnIndex}
                  setCurrentTurnIndex={setCurrentTurnIndex}
                  roundCount={roundCount}
                  setRoundCount={setRoundCount}
                  onGenerateLoot={handleGenerateLootForCombat}
                  onLoadDemoEverything={handleLoadDemoEverything}
                />
              )}

              {activeTab === 'map' && <MapMaker combatants={combatants} />}

              {activeTab === 'ai' && (
                <AICoPilot
                  generatedLootResult={generatedLootResult}
                  isCollapsed={false}
                />
              )}

              {activeTab === 'lore' && <LoreGraph />}

              {activeTab === 'compendium' && (
                <div className="flex-1 p-6 overflow-y-auto bg-[#0a0d14]">
                  <h2 className="text-lg font-bold text-slate-100 mb-2">Compêndio Completo D&D 5e SRD</h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Pressione <kbd className="px-1.5 py-0.5 bg-[#161c28] border border-[#2a3449] rounded font-mono">Ctrl + Espaço</kbd> a qualquer momento para abrir a busca flutuante rápida.
                  </p>
                  <button
                    onClick={() => setIsCompendiumOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md"
                  >
                    Abrir Busca Flutuante do Compêndio
                  </button>
                </div>
              )}

              {activeTab === 'audio' && (
                <AudioMaestroPanel />
              )}

              {/* Right Panel AI Assistant always accessible on desktop when not on AI, Worldbuilder, SessionStudio or Campaign Settings tab */}
              {activeTab !== 'ai' && activeTab !== 'worldbuilder' && activeTab !== 'session_studio' && activeTab !== 'campaign_settings' && (
                !isAIPanelCollapsed ? (
                  <div className="hidden xl:block h-full transition-all duration-300">
                    <AICoPilot
                      generatedLootResult={generatedLootResult}
                      isCollapsed={isAIPanelCollapsed}
                      onToggleCollapse={toggleAIPanel}
                    />
                  </div>
                ) : (
                  <div className="hidden xl:flex items-center absolute right-0 top-1/2 -translate-y-1/2 z-30">
                    <button
                      onClick={toggleAIPanel}
                      className="bg-[#161c28] hover:bg-[#1f2738] text-purple-400 hover:text-purple-300 border border-r-0 border-purple-500/40 py-4 px-1.5 rounded-l-xl shadow-xl backdrop-blur-sm flex flex-col items-center gap-2 transition-all group cursor-pointer"
                      title="Expandir Widget IA Co-Mestre"
                    >
                      <Sparkles className="w-4 h-4 animate-pulse group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 [writing-mode:vertical-lr] rotate-180">
                        IA CO-MESTRE
                      </span>
                    </button>
                  </div>
                )
              )}
            </main>
          </div>
        </div>
      )}

      {/* Bottom Audio Control Footer */}
      {activeTab === 'live_cockpit' && <AudioMaestro onOpenAudioPanel={() => setIsAudioModalOpen(true)} />}

      {/* Global Compendium Search Modal (`Ctrl + Space`) */}
      <CompendiumModal
        isOpen={isCompendiumOpen}
        onClose={() => setIsCompendiumOpen(false)}
      />

      {/* Player View Second Screen Modal */}
      <PlayerViewModal
        isOpen={isPlayerViewOpen}
        onClose={() => setIsPlayerViewOpen(false)}
        combatants={combatants}
        currentTurnIndex={currentTurnIndex}
        roundCount={roundCount}
      />

      {/* Audio Maestro Modal */}
      <AudioMaestroModal 
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* User Auth Modal (Google OAuth & Email Login) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Create Campaign Modal */}
      <CreateCampaignModal
        isOpen={isCreateCampaignOpen}
        onClose={() => setIsCreateCampaignOpen(false)}
        selectedWorldForCampaign={selectedWorldForCampaign}
      />

      {/* Dock de Minimizados */}
      <MinimizedSheetsDock
        activeSheets={activeSheets}
        onMaximizeSheet={maximizeSheet}
        onCloseSheet={closeSheet}
      />

      {/* Modais de Fichas de Jogadores (PC) */}
      {activeSheets
        .filter((s) => (s.type === 'pc' || (s.type as string) === 'player') && s.state === 'open')
        .map((sheetState) => {
          const matchingSheet = characterSheets.find((cs) => {
            if (cs.id === sheetState.id) return true;
            const cClean = sheetState.characterName.split('(')[0].trim().toLowerCase();
            const sheetClean = cs.characterName.split('(')[0].trim().toLowerCase();
            return sheetClean === cClean || sheetClean.includes(cClean) || cClean.includes(sheetClean);
          });
          // Se não encontrou a ficha no array sincronizado, usa um fallback inteligente com o nome do personagem para NUNCA falhar silenciosamente
          const sheetToRender = matchingSheet || (sheetState.data && sheetState.data.attributes ? sheetState.data : (() => {
            const fallback = createEmptyCharacterSheet('player-1', activeCampaign?.id);
            fallback.id = sheetState.id;
            fallback.characterName = sheetState.characterName.split('(')[0].trim() || 'Aventureiro';
            return fallback;
          })());

          return (
            <CharacterSheetModal
              key={sheetState.id}
              sheet={sheetToRender}
              isOpen={true}
              onClose={() => closeSheet(sheetState.id)}
              onMinimize={() => minimizeSheet(sheetState.id)}
              onSave={saveSheet}
            />
          );
        })}

      {/* Modais de Stat Blocks de Monstros/NPCs */}
      {activeSheets
        .filter((s) => (s.type === 'monster' || s.type === 'npc') && s.state === 'open')
        .map((sheetState) => {
          const combatant = combatants.find((c) => (c.id || c.name) === sheetState.id) || sheetState.data;
          if (!combatant) return null;
          return (
            <MonsterStatBlockModal
              key={sheetState.id}
              combatant={combatant}
              isOpen={true}
              onClose={() => closeSheet(sheetState.id)}
              onMinimize={() => minimizeSheet(sheetState.id)}
              onRoll={handleMonsterRoll}
              onUpdateCombatant={handleUpdateCombatant}
            />
          );
        })}
    </div>
  );
}

import { AppProviders } from '@/components/AppProviders';

export default function Home() {
  return (
    <AppProviders>
      <MainApp />
    </AppProviders>
  );
}

