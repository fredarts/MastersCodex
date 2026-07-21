'use client';

import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Film, 
  Play, 
  Swords, 
  Shield, 
  Heart, 
  Music, 
  Mic, 
  BookOpen, 
  Plus, 
  RotateCcw, 
  ChevronRight, 
  Skull, 
  Volume2, 
  Map as MapIcon, 
  Sparkles, 
  Radio, 
  Eye, 
  CheckCircle2, 
  MessageSquare,
  Compass,
  Beer,
  Search,
  Users,
  UserPlus,
  X,
  Dices,
  Edit3,
  Check
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GameScene, SceneType, Combatant, ConditionType, CampaignMember } from '@/lib/types';
import { INITIAL_MONSTERS, SFX_BUTTONS, CONDITIONS } from '@/lib/srd-data';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { CreateSceneModal } from '@/components/CreateSceneModal';

interface LiveCockpitStudioProps {
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  currentTurnIndex: number;
  setCurrentTurnIndex: React.Dispatch<React.SetStateAction<number>>;
  roundCount: number;
  setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  onGenerateLoot: () => void;
  onOpenPlayerView: () => void;
}

export const LiveCockpitStudio: React.FC<LiveCockpitStudioProps> = ({
  combatants,
  setCombatants,
  currentTurnIndex,
  setCurrentTurnIndex,
  roundCount,
  setRoundCount,
  onGenerateLoot,
  onOpenPlayerView,
}) => {
  const {
    activeWorld,
    activeCampaign,
    activeSession,
    sessions,
    setActiveSession,
    scenes,
    activeScene,
    setActiveScene,
    updateScene,
    createFeedEvent,
    liveDisplayMode,
    setLiveDisplayMode,
    broadcastToPlayerView,
    campaignMembers,
    worldEntities,
  } = useAuth();

  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [playingNpcVoice, setPlayingNpcVoice] = useState(false);
  const [activeBgmCategory, setActiveBgmCategory] = useState<string>('taverna');

  // Scene inline editing state
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editedSceneTitle, setEditedSceneTitle] = useState('');

  // Combat State & Search Modal
  const [isCombatActive, setIsCombatActive] = useState<boolean>(false);
  const [showAddCombatantModal, setShowAddCombatantModal] = useState<boolean>(false);
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'players' | 'custom'>('monsters');
  const [combatantSearchQuery, setCombatantSearchQuery] = useState<string>('');

  // Custom Combatant Form
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(15);
  const [customAc, setCustomAc] = useState(13);
  const [customInit, setCustomInit] = useState(10);
  const [customType, setCustomType] = useState<'player' | 'monster' | 'npc'>('monster');

  // Sync Combat Active status with current scene or combatants array
  useEffect(() => {
    if (activeScene?.sceneType === 'combat' || combatants.length > 0) {
      setIsCombatActive(true);
    } else {
      setIsCombatActive(false);
    }
  }, [activeScene?.id, activeScene?.sceneType, combatants.length]);

  useEffect(() => {
    if (activeScene?.bgmCategory) {
      setActiveBgmCategory(activeScene.bgmCategory);
    }

    // Auto-load pre-programmed combatants if present and current list is empty
    if (activeScene && activeScene.combatants && activeScene.combatants.length > 0 && combatants.length === 0) {
      const sorted = [...activeScene.combatants].sort((a, b) => b.initiative - a.initiative);
      setCombatants(sorted);
      setCurrentTurnIndex(0);
      setRoundCount(1);
      setIsCombatActive(true);
      broadcastToPlayerView({ combatants: sorted });
    }
  }, [activeScene?.id]);

  const handleFireSceneLive = (scene: GameScene) => {
    setActiveScene(scene);

    // Auto-load scene's pre-programmed combatants
    if (scene.combatants && scene.combatants.length > 0) {
      setCombatants((prev) => {
        const existingPlayers = prev.filter((c) => c.type === 'player');
        const nonPlayerMonsters = scene.combatants!.filter(
          (sc) => !existingPlayers.some((p) => p.name.toLowerCase() === sc.name.toLowerCase())
        );
        const merged = [...existingPlayers, ...nonPlayerMonsters].sort((a, b) => b.initiative - a.initiative);
        broadcastToPlayerView({ combatants: merged });
        return merged;
      });
      setCurrentTurnIndex(0);
      setRoundCount(1);
      setIsCombatActive(true);
    }

    if (scene.sceneType === 'combat') {
      setLiveDisplayMode('combat');
      setIsCombatActive(true);
    } else {
      setLiveDisplayMode('artwork');
    }

    broadcastToPlayerView({
      sceneId: scene.id,
      title: scene.title,
      imageUrl: scene.imageUrl ? normalizeImageUrl(scene.imageUrl) : undefined,
      sensoryText: scene.sensoryText,
      mode: scene.sceneType === 'combat' ? 'combat' : 'artwork',
    });
  };

  const handleNextTurn = () => {
    if (combatants.length === 0) return;
    const nextIdx = (currentTurnIndex + 1) % combatants.length;
    if (nextIdx === 0) {
      setRoundCount((r) => r + 1);
    }
    setCurrentTurnIndex(nextIdx);
    broadcastToPlayerView({
      currentTurnIndex: nextIdx,
      roundCount: nextIdx === 0 ? roundCount + 1 : roundCount,
    });
  };

  const handleHpChange = (id: string, delta: number) => {
    setCombatants((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const newHp = Math.max(0, Math.min(c.maxHp, c.hp + delta));
          return { ...c, hp: newHp };
        }
        return c;
      });
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handleToggleCondition = (id: string, cond: ConditionType) => {
    setCombatants((prev) => {
      const next = prev.map((c) => {
        if (c.id === id) {
          const exists = c.conditions.includes(cond);
          const newConds = exists ? c.conditions.filter((x) => x !== cond) : [...c.conditions, cond];
          return { ...c, conditions: newConds };
        }
        return c;
      });
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handleAddPresetMonster = (m: typeof INITIAL_MONSTERS[0], count: number = 1) => {
    setCombatants((prev) => {
      const next = [...prev];
      const existingCount = prev.filter((c) => c.name.toLowerCase().startsWith(m.name.toLowerCase())).length;

      for (let i = 0; i < count; i++) {
        const num = existingCount + i + 1;
        const name = count > 1 || existingCount > 0 ? `${m.name} #${num}` : m.name;
        next.push({
          id: `c-sc-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          name,
          type: 'monster',
          hp: m.hp,
          maxHp: m.hp,
          ac: m.ac,
          initiative: Math.floor(Math.random() * 20) + 1,
          conditions: [],
          cr: m.cr,
        });
      }

      next.sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setIsCombatActive(true);
  };

  const handleAddPlayerMember = (member: CampaignMember) => {
    const charName = member.characterName || member.displayName || 'Jogador';
    const alreadyIn = combatants.some((c) => c.name.toLowerCase() === charName.toLowerCase());
    if (alreadyIn) return;

    const newC: Combatant = {
      id: `p-${member.id || Date.now()}`,
      name: charName,
      type: 'player',
      hp: 25,
      maxHp: 25,
      ac: 15,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
    };

    setCombatants((prev) => {
      const next = [...prev, newC].sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setIsCombatActive(true);
  };

  const handleAddCustomCombatant = () => {
    if (!customName.trim()) return;
    const newC: Combatant = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      type: customType,
      hp: customHp,
      maxHp: customHp,
      ac: customAc,
      initiative: customInit,
      conditions: [],
    };
    setCombatants((prev) => {
      const next = [...prev, newC].sort((a, b) => b.initiative - a.initiative);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
    setCustomName('');
    setIsCombatActive(true);
  };

  const handleDeleteCombatant = (id: string) => {
    setCombatants((prev) => {
      const next = prev.filter((c) => c.id !== id);
      broadcastToPlayerView({ combatants: next });
      return next;
    });
  };

  const handleStartImpromptuCombat = () => {
    setIsCombatActive(true);
    setLiveDisplayMode('combat');
    setShowAddCombatantModal(true);
  };

  const handleEndCombat = async () => {
    onGenerateLoot();
    if (activeCampaign) {
      const monstersDefeated = combatants.filter((c) => c.type === 'monster').length;
      await createFeedEvent({
        campaignId: activeCampaign.id,
        sessionId: activeSession?.id,
        eventType: 'battle_summary',
        title: `⚔️ Vitória em Combate (Rodada ${roundCount})`,
        summary: `O grupo venceu os inimigos em ${roundCount} rodadas de combate intenso.`,
        details: {
          inimigos_derrotados: monstersDefeated || 1,
          tesouro: '24 Moedas de Prata, 12 Ouro, 1x Poção de Cura',
        },
        isPublic: true,
      });
    }

    setCombatants([]);
    setCurrentTurnIndex(0);
    setRoundCount(1);
    setIsCombatActive(false);
    setLiveDisplayMode('artwork');
    broadcastToPlayerView({ combatants: [] });
  };

  const getSceneIcon = (type: SceneType) => {
    switch (type) {
      case 'social':
        return <Beer className="w-3.5 h-3.5 text-amber-400" />;
      case 'dialogue':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'combat':
        return <Swords className="w-3.5 h-3.5 text-rose-400" />;
      case 'exploration':
        return <Compass className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Film className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const displayImageUrl = activeScene?.imageUrl ? normalizeImageUrl(activeScene.imageUrl) : null;

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col h-full overflow-hidden select-none">
      {/* Top Cockpit Header Bar */}
      <div className="bg-[#121824] border-b border-[#2a3449] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono">
                Estúdio Cockpit Ao Vivo
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> TRANSMITINDO
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 mt-0.5">
              <span>{activeWorld?.title || 'Mundo'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">{activeCampaign?.title || 'Campanha Sem Título'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400">{activeSession?.title || 'Sessão Ativa'}</span>
            </div>
          </div>
        </div>

        {/* Live Mode Controls & Player View Trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0a0d14] border border-[#2a3449] rounded-xl p-1 gap-1">
            <button
              onClick={() => {
                setLiveDisplayMode('artwork');
                broadcastToPlayerView({ mode: 'artwork' });
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                liveDisplayMode === 'artwork'
                  ? 'bg-purple-600 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Modo Arte</span>
            </button>

            <button
              onClick={() => {
                setLiveDisplayMode('combat');
                broadcastToPlayerView({ mode: 'combat' });
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                liveDisplayMode === 'combat'
                  ? 'bg-rose-600 text-slate-950 shadow font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3 h-3" />
              <span>Modo Combate</span>
            </button>
          </div>

          <button
            onClick={onOpenPlayerView}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center gap-1.5"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Tela do Jogador</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Cockpit Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Timeline de Cenas da Sessão (Left - 300px) */}
        <div className="w-72 bg-[#0c0f17] border-r border-[#2a3449] flex flex-col justify-between overflow-hidden">
          <div className="p-3 border-b border-[#2a3449] flex items-center justify-between bg-[#121824]/50">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-purple-400" />
              Timeline da Sessão ({scenes.length})
            </span>
            <button
              onClick={() => setShowCreateSceneModal(true)}
              className="p-1 text-amber-400 hover:bg-[#1f2738] rounded-lg transition-colors"
              title="Nova Cena"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 p-3 space-y-2 overflow-y-auto">
            {scenes.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-xl">
                Nenhuma cena criada nesta sessão. Crie uma cena para disparar recursos visuais.
              </div>
            ) : (
              scenes.map((sc, idx) => {
                const isActive = activeScene?.id === sc.id;
                const isEditingThis = editingSceneId === sc.id;
                return (
                  <div
                    key={`${sc.id}-${idx}`}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-950/60 via-[#161c28] to-[#121824] border-purple-500 shadow-lg ring-1 ring-purple-500/40'
                        : 'bg-[#161c28] border-[#2a3449] hover:bg-[#1f2738]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate flex-1 pr-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500">#{idx + 1}</span>
                        {getSceneIcon(sc.sceneType)}
                        {isEditingThis ? (
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="text"
                              autoFocus
                              value={editedSceneTitle}
                              onChange={(e) => setEditedSceneTitle(e.target.value)}
                              className="bg-[#0a0d14] border border-purple-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-bold focus:outline-none w-full"
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                                  setEditingSceneId(null);
                                }
                                if (e.key === 'Escape') setEditingSceneId(null);
                              }}
                            />
                            <button
                              onClick={async () => {
                                if (editedSceneTitle.trim()) await updateScene({ ...sc, title: editedSceneTitle.trim() });
                                setEditingSceneId(null);
                              }}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 truncate group flex-1">
                            <span className="text-xs font-bold text-slate-100 truncate">{sc.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSceneId(sc.id);
                                setEditedSceneTitle(sc.title);
                              }}
                              className="p-0.5 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                              title="Editar Nome da Cena"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      {isActive && !isEditingThis && (
                        <span className="text-[9px] font-black uppercase bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded animate-pulse">
                          AO VIVO
                        </span>
                      )}
                    </div>

                    {/* Scene Media Capabilities Indicators */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      {sc.imageUrl && (
                        <span className="text-purple-300 flex items-center gap-0.5">🖼️ Imagem</span>
                      )}
                      {sc.npcAudioUrl && (
                        <span className="text-cyan-300 flex items-center gap-0.5">🎙️ Voz NPC</span>
                      )}
                      {sc.combatants && sc.combatants.length > 0 && (
                        <span className="text-rose-300 flex items-center gap-0.5">⚔️ {sc.combatants.length} Inimigos</span>
                      )}
                    </div>

                    {/* Trigger Live Button */}
                    <button
                      onClick={() => handleFireSceneLive(sc)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 shadow-md hover:bg-emerald-400'
                          : 'bg-purple-950/60 hover:bg-purple-900 border border-purple-800/60 text-purple-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isActive ? 'CENA TRANSMITINDO' : 'DISPARAR AO VIVO'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Column 2: Espelho de Projeção & Tabuleiro (Center - Flex 1) */}
        <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden border-r border-[#2a3449]">
          <div className="bg-[#121824]/80 p-3 border-b border-[#2a3449] flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Projeção dos Jogadores (Espelho ao Vivo)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Modo Atual: <strong className="text-amber-400 uppercase">{liveDisplayMode}</strong>
            </span>
          </div>

          <div className="flex-1 p-4 flex flex-col min-h-0 space-y-4 overflow-hidden">
            {/* Live Visual Mirror Display Container */}
            <div className="flex-1 min-h-0 w-full flex items-center justify-center">
              <div className="h-full w-full max-h-full max-w-full aspect-square bg-black rounded-2xl border border-[#2a3449] overflow-hidden relative shadow-2xl flex items-center justify-center">
                {liveDisplayMode === 'combat' || activeScene?.sceneType === 'combat' ? (
                  <BattleGrid3D
                    combatants={combatants}
                    currentTurnIndex={currentTurnIndex}
                    interactive={true}
                  />
                ) : displayImageUrl ? (
                  <div className="w-full h-full relative">
                    <img src={displayImageUrl} alt="Arte ao vivo" className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-amber-500/30">
                      <div className="text-xs font-bold text-amber-400 uppercase font-mono">{activeScene?.title}</div>
                      {activeScene?.sensoryText && (
                        <p className="text-xs text-slate-200 mt-1 italic font-serif leading-relaxed line-clamp-2">
                          "{activeScene.sensoryText}"
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <MapIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs">Nenhuma arte ou mapa transmitido no momento.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick DM Media & Soundboard Toolbar */}
            <div className="grid grid-cols-2 gap-3">
              {/* NPC Voice Trigger Box */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voz de NPC (IA)
                  </div>
                  <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                    {activeScene?.npcName || 'Nenhum NPC vinculado'}
                  </div>
                </div>
                <button
                  disabled={!activeScene?.npcAudioUrl}
                  onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    activeScene?.npcAudioUrl
                      ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      : 'bg-[#1a2234] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{playingNpcVoice ? 'Pausar Voz' : 'Tocar Voz'}</span>
                </button>
              </div>

              {/* BGM Category Switcher */}
              <div className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-pink-400 uppercase font-mono flex items-center gap-1">
                    <Music className="w-3 h-3" /> BGM Ambiente
                  </div>
                  <select
                    value={activeBgmCategory}
                    onChange={(e) => setActiveBgmCategory(e.target.value)}
                    className="bg-[#0a0d14] text-xs font-bold text-slate-200 border border-[#2a3449] rounded px-2 py-0.5 mt-0.5"
                  >
                    <option value="taverna">🍺 Taverna</option>
                    <option value="combate">⚔️ Combate</option>
                    <option value="masmorra">🏰 Masmorra</option>
                    <option value="tensao">⚡ Tensão</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Painel de Iniciativa & Combate Ao Vivo (Right - 320px) */}
        <div className="w-80 bg-[#0c0f17] flex flex-col justify-between overflow-hidden border-l border-[#2a3449]">
          <div className="p-3 border-b border-[#2a3449] bg-[#121824]/50 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Swords className="w-4 h-4" />
              Iniciativa & Combate
            </span>
            {isCombatActive || combatants.length > 0 ? (
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                RODADA {roundCount}
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-[#121824] px-2 py-0.5 rounded border border-[#2a3449]">
                SEM COMBATE
              </span>
            )}
          </div>

          {!isCombatActive && combatants.length === 0 ? (
            /* Clean Empty State when no combat active */
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#121824] border border-[#2a3449] flex items-center justify-center shadow-inner">
                <Swords className="w-7 h-7 text-rose-400 opacity-60" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-200">Sem Combate Ativo</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                  Esta cena está em modo narrativo / exploração. Nenhum combate ativo no momento.
                </p>
              </div>
              <button
                onClick={handleStartImpromptuCombat}
                className="w-full py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600 hover:from-rose-500 hover:to-rose-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Swords className="w-4 h-4" />
                <span>INICIAR COMBATE NESTA CENA</span>
              </button>
            </div>
          ) : (
            /* Active Combat Interface */
            <>
              {/* Turn & Add Combatants Toolbar */}
              <div className="p-2 border-b border-[#2a3449] bg-[#161c28]/40 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleNextTurn}
                    disabled={combatants.length === 0}
                    className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-[#1f2738] disabled:text-slate-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>AVANÇAR TURNO</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowAddCombatantModal(true)}
                  className="w-full py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Adicionar Combatentes (Busca / SRD)</span>
                </button>
              </div>

              {/* Live Combatants List */}
              <div className="flex-1 p-3 space-y-2 overflow-y-auto">
                {combatants.map((c, idx) => {
                  const isTurn = idx === currentTurnIndex;
                  return (
                    <div
                      key={`${c.id}-${idx}`}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        isTurn
                          ? 'bg-rose-950/60 border-rose-500 text-rose-200 font-bold shadow-md ring-1 ring-rose-500/40'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono font-bold text-amber-400 bg-[#0a0d14] px-1.5 py-0.5 rounded border border-[#2a3449]">
                            #{c.initiative}
                          </span>
                          <span className="text-xs font-bold truncate max-w-[120px]">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                            CA {c.ac}
                          </span>
                          <button
                            onClick={() => handleDeleteCombatant(c.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* HP controls */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleHpChange(c.id, -5)}
                            className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold text-[10px]"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleHpChange(c.id, -1)}
                            className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800 text-rose-300 font-bold text-[10px]"
                          >
                            -1
                          </button>
                        </div>

                        <div className="flex-1 text-center font-mono text-xs font-bold text-slate-200">
                          {c.hp} / {c.maxHp} HP
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleHpChange(c.id, 1)}
                            className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-[10px]"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleHpChange(c.id, 5)}
                            className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-bold text-[10px]"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* End Combat Footer */}
              <div className="p-3 border-t border-[#2a3449] bg-[#121824]/60">
                <button
                  onClick={handleEndCombat}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Encerrar Combate & Gerar Loot</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Combatants Search Modal */}
      {showAddCombatantModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0f17] border border-[#2a3449] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#2a3449] bg-[#121824]/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Adicionar Combatentes à Batalha
                </h3>
              </div>
              <button
                onClick={() => setShowAddCombatantModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-[#1f2738] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex border-b border-[#2a3449] bg-[#0a0d14] p-1 gap-1">
              <button
                onClick={() => setActiveAddTab('monsters')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'monsters'
                    ? 'bg-[#1e293b] text-rose-400 border border-rose-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Skull className="w-3.5 h-3.5" />
                <span>Monstros & NPCs (Com Busca)</span>
              </button>

              <button
                onClick={() => setActiveAddTab('players')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'players'
                    ? 'bg-[#1e293b] text-cyan-400 border border-cyan-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Jogadores da Campanha</span>
              </button>

              <button
                onClick={() => setActiveAddTab('custom')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeAddTab === 'custom'
                    ? 'bg-[#1e293b] text-amber-400 border border-amber-500/40 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Personalizado</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {/* Tab 1: Monstros & NPCs (Com Busca) */}
              {activeAddTab === 'monsters' && (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={combatantSearchQuery}
                      onChange={(e) => setCombatantSearchQuery(e.target.value)}
                      placeholder="Buscar monstro ou NPC por nome (ex: Goblin, Dragão, Orc, Esqueleto)..."
                      className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
                    />
                    {combatantSearchQuery && (
                      <button
                        onClick={() => setCombatantSearchQuery('')}
                        className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-slate-300"
                      >
                        Limpar
                      </button>
                    )}
                  </div>

                  {/* Filtered Monster List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[45vh] overflow-y-auto pr-1">
                    {INITIAL_MONSTERS.filter(
                      (m) =>
                        m.name.toLowerCase().includes(combatantSearchQuery.toLowerCase()) ||
                        m.type.toLowerCase().includes(combatantSearchQuery.toLowerCase())
                    ).map((m) => (
                      <div
                        key={m.id}
                        className="p-3 bg-[#121824] border border-[#2a3449] hover:border-slate-600 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                            <Skull className="w-3.5 h-3.5 text-rose-400" />
                            <span>{m.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>CA {m.ac}</span>
                            <span>•</span>
                            <span>{m.hp} HP</span>
                            <span>•</span>
                            <span className="text-amber-400 font-bold">ND {m.cr}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAddPresetMonster(m, 1)}
                            className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded-lg text-xs font-bold transition-all"
                            title="Adicionar 1 criatura"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAddPresetMonster(m, 3)}
                            className="px-2 py-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 rounded-lg text-xs font-bold transition-all"
                            title="Adicionar 3 criaturas de uma vez"
                          >
                            +3
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Jogadores da Campanha */}
              {activeAddTab === 'players' && (
                <div className="space-y-2">
                  <span className="text-xs text-slate-400 font-mono block mb-2">
                    Integrantes cadastrados na campanha ativa:
                  </span>
                  {campaignMembers.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-[#2a3449] rounded-xl">
                      Nenhum integrante cadastrado nesta campanha.
                    </div>
                  ) : (
                    campaignMembers.map((mem) => {
                      const name = mem.characterName || mem.displayName || 'Jogador';
                      const isAlreadyIn = combatants.some((c) => c.name.toLowerCase() === name.toLowerCase());
                      return (
                        <div
                          key={mem.id}
                          className="p-3 bg-[#121824] border border-[#2a3449] rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-cyan-400" />
                            <div>
                              <div className="text-xs font-bold text-slate-200">{name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Role: {mem.role.toUpperCase()}
                              </div>
                            </div>
                          </div>

                          <button
                            disabled={isAlreadyIn}
                            onClick={() => handleAddPlayerMember(mem)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isAlreadyIn
                                ? 'bg-[#161c28] text-slate-500 border border-[#2a3449] cursor-not-allowed'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                            }`}
                          >
                            {isAlreadyIn ? 'Já na Batalha' : '+ Adicionar'}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 3: Combatente Personalizado */}
              {activeAddTab === 'custom' && (
                <div className="space-y-3 bg-[#121824] p-4 border border-[#2a3449] rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Nome do Combatente / NPC:
                      </label>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Ex: Guarda da Cidade, Chefe Orc..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Tipo:
                      </label>
                      <select
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value as any)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1.5 text-xs text-slate-200"
                      >
                        <option value="monster">Inimigo / Monstro</option>
                        <option value="player">Jogador</option>
                        <option value="npc">NPC Aliado</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Iniciativa:
                      </label>
                      <input
                        type="number"
                        value={customInit}
                        onChange={(e) => setCustomInit(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Pontos de Vida (HP):
                      </label>
                      <input
                        type="number"
                        value={customHp}
                        onChange={(e) => setCustomHp(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                        Classe de Armadura (CA):
                      </label>
                      <input
                        type="number"
                        value={customAc}
                        onChange={(e) => setCustomAc(Number(e.target.value))}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1.5 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  <button
                    disabled={!customName.trim()}
                    onClick={handleAddCustomCombatant}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-[#161c28] disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl shadow transition-all mt-2"
                  >
                    + Adicionar Combatente Personalizado
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#2a3449] bg-[#121824]/80 flex justify-end">
              <button
                onClick={() => setShowAddCombatantModal(false)}
                className="px-4 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />
    </div>
  );
};
