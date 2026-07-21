'use client';

import React, { useState, useEffect } from 'react';
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
import { CompendiumModal } from '@/components/CompendiumModal';
import { PlayerViewModal } from '@/components/PlayerViewModal';
import { AuthModal } from '@/components/AuthModal';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { PlayerLobby } from '@/components/PlayerLobby';
import { LiveCockpitStudio } from '@/components/LiveCockpitStudio';
import { Combatant, Encounter, World, GameScene, UserCampaign } from '@/lib/types';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';

function MainApp() {
  const { roleMode, loadDemoEverything } = useAuth();
  const { setActiveCampaign } = useCampaign();
  const [activeTab, setActiveTab] = useState<ActiveTab>('live_cockpit');
  
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [roundCount, setRoundCount] = useState(1);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isPlayerViewOpen, setIsPlayerViewOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [selectedWorldForCampaign, setSelectedWorldForCampaign] = useState<World | null>(null);
  const [generatedLootResult, setGeneratedLootResult] = useState<string | null>(null);

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
            sheet.characterName?.toLowerCase().includes(cClean) ||
            (sheet.id && c.id.includes(sheet.id));

          if (isMatch) {
            if (c.modelUrl !== updatedModelUrl) {
              hasChanges = true;
              return { ...c, modelUrl: updatedModelUrl };
            }
          }
          return c;
        });
        return hasChanges ? next : prev;
      });
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('masters_codex_sync');
      bc.onmessage = (event) => {
        if (event.data?.type === 'CHARACTER_MODEL_UPDATED' && event.data?.sheet) {
          handleModelUpdate(event.data.sheet);
        }
      };
    } catch (e) {}

    const handleLocalEvent = (e: Event) => {
      const customEvt = e as CustomEvent;
      if (customEvt.detail) {
        handleModelUpdate(customEvt.detail);
      }
    };

    window.addEventListener('masters_codex_character_model_updated', handleLocalEvent);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('masters_codex_character_model_updated', handleLocalEvent);
    };
  }, []);

  const handleLoadEncounter = (encounter: Encounter) => {
    const loadedCombatants: Combatant[] = encounter.combatants.map((c, idx) => ({
      ...c,
      id: `enc-${Date.now()}-${idx}`,
      initiative: Math.floor(Math.random() * 20) + 1,
    }));

    setCombatants((prev) => [
      ...prev.filter((c) => c.type === 'player'),
      ...loadedCombatants,
    ].sort((a, b) => b.initiative - a.initiative));

    setCurrentTurnIndex(0);
    setRoundCount(1);
    setActiveTab('combat');
  };

  const handleLoadDemoEverything = () => {
    loadDemoEverything();
    setCombatants([
      { id: 'p1', name: 'Kaelen (Guerreiro Nível 5)', type: 'player', hp: 45, maxHp: 45, ac: 18, initiative: 18, conditions: [], modelUrl: getModelUrlByNameOrPath('Guerreiro') },
      { id: 'p2', name: 'Lyra (Maga Nível 5)', type: 'player', hp: 32, maxHp: 32, ac: 15, initiative: 14, conditions: ['Concentração'], modelUrl: getModelUrlByNameOrPath('Mago') },
      { id: 'm1', name: 'Líder Hobgoblin Kraag', type: 'monster', hp: 11, maxHp: 11, ac: 18, initiative: 12, conditions: [], cr: '1/2', modelUrl: '/assets/3d/monsters/Líder Hobgoblin/Líder Hobgoblin.glb' },
      { id: 'm2', name: 'Goblin Arqueiro #1', type: 'monster', hp: 7, maxHp: 7, ac: 15, initiative: 9, conditions: [], cr: '1/4', modelUrl: '/assets/3d/monsters/Goblin Arqueiro/Goblin Arqueiro.glb' }
    ]);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    setActiveTab('combat');
  };

  const handleEquipScene = (scene: GameScene) => {
    // 1-Click Auto Equip Scene Logic
    if (scene.combatants && scene.combatants.length > 0) {
      setCombatants((prev) => {
        const existingPlayers = prev.filter((c) => c.type === 'player');
        const nonPlayerMonsters = scene.combatants!.filter(
          (sc) => !existingPlayers.some((p) => p.name.toLowerCase() === sc.name.toLowerCase())
        );
        return [...existingPlayers, ...nonPlayerMonsters].sort((a, b) => b.initiative - a.initiative);
      });
      setCurrentTurnIndex(0);
      setRoundCount(1);
    }

    if (scene.sceneType === 'combat') {
      setActiveTab('live_cockpit');
    } else if (scene.sceneType === 'exploration') {
      setActiveTab('map');
    } else {
      setActiveTab('live_cockpit');
    }
  };

  const handleOpenCreateCampaignWithWorld = (world: World) => {
    setSelectedWorldForCampaign(world);
    setIsCreateCampaignOpen(true);
  };

  const handleSelectCampaignFromWorld = (campaign: UserCampaign) => {
    setActiveCampaign(campaign);
    setActiveTab('campaign_settings');
  };

  const handleGenerateLootForCombat = () => {
    const result = `💰 TESOURO DO COMBATE ATIVO:
• 24 Moedas de Prata e 12 Moedas de Ouro.
• 1x Adaga Ensanguentada do Líder Hobgoblin (+1 Acerto).
• 1x Anel com Brasão da Guilda das Sombras (Chave secreta).
• 1x Poção de Cura (2d4 + 2 HP).`;

    setGeneratedLootResult(result);
    setActiveTab('ai');
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#07090e] text-slate-100">
      {/* Top Header */}
      <Header
        onOpenSearch={() => setIsCompendiumOpen(true)}
        onOpenPlayerView={() => setIsPlayerViewOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Workspace Body: Switch based on Role Mode */}
      {roleMode === 'player' ? (
        <PlayerLobby onOpenPlayerView={() => setIsPlayerViewOpen(true)} />
      ) : (
        <div className="flex-1 flex overflow-hidden">
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
          />

          {/* Main Workspace Column */}
          <div className="flex-1 flex flex-col overflow-hidden">
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
                  combatants={combatants}
                  setCombatants={setCombatants}
                  currentTurnIndex={currentTurnIndex}
                  setCurrentTurnIndex={setCurrentTurnIndex}
                  roundCount={roundCount}
                  setRoundCount={setRoundCount}
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

              {activeTab === 'ai' && <AICoPilot generatedLootResult={generatedLootResult} />}

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
                <div className="flex-1 p-6 bg-[#0a0d14]">
                  <h2 className="text-lg font-bold text-slate-100 mb-2">Painel Maestro de Áudio & Soundboard</h2>
                  <p className="text-xs text-slate-400">
                    Utilize os controles na barra inferior para alternar trilhas de fundo BGM ou disparar efeitos sonoros SFX instantâneos durante a sessão.
                  </p>
                </div>
              )}

              {/* Right Panel AI Assistant always accessible on desktop when not on AI, Worldbuilder, SessionStudio or Campaign Settings tab */}
              {activeTab !== 'ai' && activeTab !== 'worldbuilder' && activeTab !== 'session_studio' && activeTab !== 'campaign_settings' && (
                <div className="hidden xl:block">
                  <AICoPilot generatedLootResult={generatedLootResult} />
                </div>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Bottom Audio Control Footer */}
      <AudioMaestro />

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

