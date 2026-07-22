'use client';

import React, { useState, useEffect } from 'react';
import { 
  Film, 
  Plus, 
  Play, 
  Image as ImageIcon, 
  Music, 
  Swords, 
  Mic, 
  BookOpen, 
  Lock, 
  Trash2, 
  Calendar, 
  Sparkles, 
  Skull, 
  Volume2,
  Tv,
  Beer,
  MessageSquare,
  Compass,
  UserCheck,
  Shield
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useSession } from '@/lib/hooks/useSession';
import { useWorld } from '@/lib/hooks/useWorld';
import { GameScene, SceneType, Combatant, SceneImage } from '@/lib/types';
import { INITIAL_MONSTERS, SFX_BUTTONS } from '@/lib/srd-data';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { CreateSceneModal } from '@/components/CreateSceneModal';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { BattleGrid3D } from '@/components/BattleGrid3D';
import { ThreeErrorBoundary } from '@/components/ThreeErrorBoundary';

interface SessionStudioProps {
  onEquipScene: (scene: GameScene) => void;
}

export const SessionStudio: React.FC<SessionStudioProps> = ({ onEquipScene }) => {
  const { activeCampaign, campaignMembers } = useCampaign();
  const { 
    sessions, 
    activeSession, 
    setActiveSession, 
    createSession,
    scenes, 
    activeScene, 
    setActiveScene,
    updateScene,
    deleteScene 
  } = useSession();
  const { worldEntities } = useWorld();

  const [selectedScene, setSelectedScene] = useState<GameScene | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'image' | 'audio' | 'combat' | 'voice' | 'notes'>('image');
  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Editable Form State for Selected Scene
  const [title, setTitle] = useState('');
  const [sceneType, setSceneType] = useState<SceneType>('social');
  const [imageUrl, setImageUrl] = useState('');
  const [sceneImages, setSceneImages] = useState<SceneImage[]>([]);
  const [bgmCategory, setBgmCategory] = useState<'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao'>('taverna');
  const [sfxShortcuts, setSfxShortcuts] = useState<string[]>([]);
  const [npcName, setNpcName] = useState('');
  const [npcAudioUrl, setNpcAudioUrl] = useState('');
  const [sensoryText, setSensoryText] = useState('');
  const [secretNotes, setSecretNotes] = useState('');
  const [sceneCombatants, setSceneCombatants] = useState<Combatant[]>([]);
  const [timeOfDayHour, setTimeOfDayHour] = useState<number>(12);
  const [hasFog, setHasFog] = useState<boolean>(false);
  const [hasRain, setHasRain] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (scenes.length > 0) {
      if (!selectedScene || !scenes.some((s) => s.id === selectedScene.id)) {
        setSelectedScene(scenes[0]);
      }
    } else {
      setSelectedScene(null);
    }
  }, [scenes, activeSession?.id]);

  useEffect(() => {
    if (selectedScene) {
      setTitle(selectedScene.title || '');
      setSceneType(selectedScene.sceneType || 'social');
      setImageUrl(selectedScene.imageUrl || '');
      setBgmCategory(selectedScene.bgmCategory || 'taverna');
      setSfxShortcuts(selectedScene.sfxShortcuts || []);
      setNpcName(selectedScene.npcName || '');
      setNpcAudioUrl(selectedScene.npcAudioUrl || '');
      setSensoryText(selectedScene.sensoryText || '');
      setSecretNotes(selectedScene.secretNotes || '');
      setSceneCombatants(selectedScene.combatants || []);
      setTimeOfDayHour(selectedScene.timeOfDayHour ?? 12);
      setHasFog(selectedScene.hasFog ?? false);
      setHasRain(selectedScene.hasRain ?? false);
      setSceneImages(selectedScene.sceneImages || []);
    } else {
      setTitle('');
      setSceneType('social');
      setImageUrl('');
      setBgmCategory('taverna');
      setSfxShortcuts([]);
      setNpcName('');
      setNpcAudioUrl('');
      setSensoryText('');
      setSecretNotes('');
      setSceneCombatants([]);
      setTimeOfDayHour(12);
      setHasFog(false);
      setHasRain(false);
      setSceneImages([]);
    }
  }, [selectedScene]);

  if (!activeCampaign) {
    return (
      <div className="flex-1 bg-[#0a0d14] flex flex-col items-center justify-center p-8 text-center select-none">
        <Film className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="font-bold text-slate-300 text-base">Nenhuma Campanha Selecionada</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Selecione uma campanha na barra lateral para acessar o Estúdio de Sessões & Designer de Cenas.
        </p>
      </div>
    );
  }

  const handleSaveSceneChanges = async () => {
    if (!selectedScene) return;
    const computedPreset: 'day' | 'sunset' | 'night' | 'fog' | 'storm' =
      timeOfDayHour >= 21 || timeOfDayHour <= 4
        ? 'night'
        : timeOfDayHour >= 16.5
        ? 'sunset'
        : 'day';

    const updated: GameScene = {
      ...selectedScene,
      title,
      sceneType,
      imageUrl: imageUrl || undefined,
      bgmCategory,
      sfxShortcuts,
      npcName: npcName || undefined,
      npcAudioUrl: npcAudioUrl || undefined,
      sensoryText: sensoryText || undefined,
      secretNotes: secretNotes || undefined,
      combatants: sceneCombatants,
      timeOfDay: computedPreset,
      timeOfDayHour,
      hasFog,
      hasRain,
      sceneImages,
    };

    await updateScene(updated);
    setSelectedScene(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionTitle.trim()) return;
    await createSession(newSessionTitle);
    setNewSessionTitle('');
    setShowNewSessionInput(false);
  };

  const handleAddMonsterToScene = (m: typeof INITIAL_MONSTERS[0]) => {
    const newC: Combatant = {
      id: `c-sc-${Date.now()}-${Math.random()}`,
      name: m.name,
      type: 'monster',
      hp: m.hp,
      maxHp: m.hp,
      ac: m.ac,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      cr: m.cr,
    };
    setSceneCombatants((prev) => [...prev, newC]);
  };

  const handleAddPlayerToScene = (mem: typeof campaignMembers[0]) => {
    const pName = mem.characterName || mem.displayName || 'Jogador';

    // 1. Usa o modelUrl vindo do cadastro do membro no Supabase (fonte de verdade cross-account)
    let resolvedModelUrl: string | undefined = mem.modelUrl;

    // 2. Se não estiver no cadastro do membro, busca no localStorage (fallback local)
    if (!resolvedModelUrl) {
      try {
        const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
        if (saved) {
          const sheets: any[] = JSON.parse(saved);
          const cClean = pName.split('(')[0].trim().toLowerCase();
          const found = sheets.find(
            (s) =>
              (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
              (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
              (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
          );
          if (found) {
            if (found.modelUrl) resolvedModelUrl = found.modelUrl;
            else if (found.className) resolvedModelUrl = getModelUrlByNameOrPath(found.className);
          }
        }
      } catch (e) {}
    }

    // 3. Fallback por nome
    if (!resolvedModelUrl) {
      resolvedModelUrl = getModelUrlByNameOrPath(pName);
    }

    const newP: Combatant = {
      id: `c-pl-${Date.now()}-${Math.random()}`,
      name: pName,
      type: 'player',
      hp: 35,
      maxHp: 35,
      ac: 16,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      modelUrl: resolvedModelUrl,
    };
    setSceneCombatants((prev) => [...prev, newP]);
  };

  const handleToggleSfxShortcut = (sfxId: string) => {
    setSfxShortcuts((prev) =>
      prev.includes(sfxId) ? prev.filter((id) => id !== sfxId) : [...prev, sfxId]
    );
  };

  const getSceneIcon = (type: string) => {
    switch (type) {
      case 'combat': return <Swords className="w-4 h-4 text-rose-400" />;
      case 'dialogue': return <MessageSquare className="w-4 h-4 text-cyan-400" />;
      case 'social': return <Beer className="w-4 h-4 text-amber-400" />;
      case 'exploration': return <Compass className="w-4 h-4 text-emerald-400" />;
      default: return <Film className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 font-bold shadow-inner">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono">
                ESTÚDIO DE SESSÕES & CENAS
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={activeSession?.id || ''}
                onChange={(e) => {
                  const s = sessions.find((x) => x.id === e.target.value);
                  if (s) setActiveSession(s);
                }}
                className="bg-[#0a0d14] border border-[#2a3449] rounded px-2 py-0.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sessão {s.sessionNumber}: {s.title}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowNewSessionInput(true)}
                className="p-1 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-400 rounded-lg text-xs"
                title="Criar Nova Sessão"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Create Session Inline Form */}
        {showNewSessionInput && (
          <form onSubmit={handleCreateSessionSubmit} className="flex items-center gap-1">
            <input
              type="text"
              required
              autoFocus
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              placeholder="Ex: Sessão 3: O Assalto à Torre"
              className="bg-[#0a0d14] border border-amber-500 rounded px-2.5 py-1 text-xs text-slate-100 font-bold focus:outline-none"
            />
            <button type="submit" className="px-3 py-1 bg-amber-500 text-slate-950 font-bold text-xs rounded">
              Criar
            </button>
            <button type="button" onClick={() => setShowNewSessionInput(false)} className="px-2 py-1 text-slate-400 text-xs">
              x
            </button>
          </form>
        )}

        <div className="flex items-center gap-2">
          {selectedScene && (
            <button
              onClick={() => {
                onEquipScene(selectedScene);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>▶ DISPARAR CENA AO VIVO</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Body: Left Timeline Panel + Right Scene Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Scenes Timeline Sidebar */}
        <div className="w-64 bg-[#0f141d] border-r border-[#2a3449] flex flex-col justify-between p-3 select-none">
          <div>
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                TIMELINE DE CENAS ({scenes.length}):
              </span>
              <button
                onClick={() => setShowCreateSceneModal(true)}
                className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-0.5"
              >
                <Plus className="w-3.5 h-3.5" /> Nova
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)]">
              {scenes.length === 0 ? (
                <div className="p-4 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-xs">
                  Nenhuma cena criada nesta sessão.
                </div>
              ) : (
                scenes.map((sc, idx) => {
                  const isSelected = selectedScene?.id === sc.id;
                  return (
                    <div
                      key={sc.id}
                      onClick={() => setSelectedScene(sc)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-gradient-to-r from-purple-950/40 via-[#161c28] to-[#121824] border-purple-500 text-purple-300 font-bold shadow'
                          : 'bg-[#161c28] border-[#2a3449] text-slate-300 hover:bg-[#1f2738]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{idx + 1}.</span>
                        {getSceneIcon(sc.sceneType)}
                        <span className="text-xs truncate font-semibold">{sc.title}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(sc.id);
                          if (selectedScene?.id === sc.id) setSelectedScene(null);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Scene Editor Panel */}
        <div className="flex-1 flex flex-col bg-[#0a0d14] overflow-hidden">
          {!selectedScene ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <Film className="w-12 h-12 text-slate-600 mb-3" />
              <h3 className="font-bold text-slate-300 text-base">Nenhuma Cena Selecionada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Selecione ou crie uma cena na timeline à esquerda para editar seus recursos visuais, sons e encontros.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Scene Editor Header */}
              <div className="bg-[#121824] border-b border-[#2a3449] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-100 w-72"
                  />
                  <select
                    value={sceneType}
                    onChange={(e) => setSceneType(e.target.value as SceneType)}
                    className="bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-xs text-amber-300 font-bold"
                  >
                    <option value="social">🍺 Social / Taverna</option>
                    <option value="dialogue">🗣️ Diálogo NPC</option>
                    <option value="combat">⚔️ Combate</option>
                    <option value="exploration">🗺️ Exploração</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  {isSaved && <span className="text-xs text-emerald-400 font-bold">✓ Alterações Salvas!</span>}
                  <button
                    onClick={handleSaveSceneChanges}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs rounded-xl shadow transition-all"
                  >
                    Salvar Cena
                  </button>
                </div>
              </div>

              {/* Sub-Tabs for Scene Media Editor */}
              <div className="flex items-center border-b border-[#2a3449] bg-[#0f141d] px-4 space-x-1">
                <button
                  onClick={() => setActiveSubTab('image')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 ${
                    activeSubTab === 'image' ? 'border-purple-400 text-purple-300 bg-[#161c28]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  <span>🖼️ Arte / Imagem da Cena</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('audio')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 ${
                    activeSubTab === 'audio' ? 'border-purple-400 text-purple-300 bg-[#161c28]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <Music className="w-3.5 h-3.5 text-pink-400" />
                  <span>🎵 BGM & SFX</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('combat')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 ${
                    activeSubTab === 'combat' ? 'border-purple-400 text-purple-300 bg-[#161c28]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  <span>⚔️ Encontro ({sceneCombatants.length})</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('voice')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 ${
                    activeSubTab === 'voice' ? 'border-purple-400 text-purple-300 bg-[#161c28]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>🎙️ Voz de NPC por IA</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('notes')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 ${
                    activeSubTab === 'notes' ? 'border-purple-400 text-purple-300 bg-[#161c28]' : 'border-transparent text-slate-400'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>📜 Texto Sensorial & Segredos</span>
                </button>
              </div>

              {/* Sub-Tab Editor Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeSubTab === 'image' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Add Image Options */}
                    <div className="bg-[#121824] p-4 rounded-xl border border-[#2a3449] space-y-4">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Adicionar Nova Arte/Imagem ao Slideshow
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Option 1: File Upload */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Upload de Arquivo (Supabase)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!isSupabaseConfigured()}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                const publicUrl = await storageService.uploadAsset(file, 'scenes');
                                const newImg: SceneImage = {
                                  id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                  imageUrl: publicUrl,
                                  overlayText: '',
                                  secretNotes: '',
                                };
                                setSceneImages(prev => [...prev, newImg]);
                                if (!imageUrl) setImageUrl(publicUrl); // set primary fallback if empty
                              } catch (err: any) {
                                alert(err.message || 'Erro ao fazer upload da imagem.');
                              }
                            }}
                            className={`w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-2 py-1 text-xs text-slate-300 file:bg-purple-600/20 file:border-0 file:text-purple-300 file:px-3 file:py-1 file:rounded-md file:text-[10px] file:font-bold file:cursor-pointer ${
                              !isSupabaseConfigured() ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          />
                          {!isSupabaseConfigured() && (
                            <p className="text-[9px] text-rose-400 font-bold">
                              ⚠️ Supabase não configurado. Upload desabilitado.
                            </p>
                          )}
                        </div>

                        {/* Option 2: Image URL */}
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase">
                            Ou Colar URL Direta da Imagem
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://exemplo.com/imagem.png"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const target = e.target as HTMLInputElement;
                                  if (target.value.trim()) {
                                    const normalized = normalizeImageUrl(target.value.trim());
                                    const newImg: SceneImage = {
                                      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                      imageUrl: normalized,
                                      overlayText: '',
                                      secretNotes: '',
                                    };
                                    setSceneImages(prev => [...prev, newImg]);
                                    if (!imageUrl) setImageUrl(normalized);
                                    target.value = '';
                                  }
                                }
                              }}
                              className="flex-1 bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                const input = (e.currentTarget.previousElementSibling as HTMLInputElement);
                                if (input.value.trim()) {
                                  const normalized = normalizeImageUrl(input.value.trim());
                                  const newImg: SceneImage = {
                                    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                                    imageUrl: normalized,
                                    overlayText: '',
                                    secretNotes: '',
                                  };
                                  setSceneImages(prev => [...prev, newImg]);
                                  if (!imageUrl) setImageUrl(normalized);
                                  input.value = '';
                                }
                              }}
                              className="px-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 font-bold text-xs rounded-lg cursor-pointer"
                            >
                              Adicionar
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* AI Mock button */}
                      <div className="pt-2 border-t border-[#2a3449]/40 flex justify-end">
                        <button
                          type="button"
                          onClick={() => alert('Integração com Nano Banana/Gemini IA estará disponível em breve!')}
                          className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow active:scale-95 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                          <span>Gerar Imagem com IA</span>
                        </button>
                      </div>
                    </div>

                    {/* Scene Images List */}
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Slides Ativos na Cena ({sceneImages.length})
                      </div>
                      
                      {sceneImages.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-2xl text-xs">
                          Nenhuma imagem ou slide adicionado a esta cena. Adicione um arquivo ou cole uma URL acima para começar.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sceneImages.map((imgObj, idx) => (
                            <div key={imgObj.id} className="p-4 bg-[#121824] rounded-xl border border-[#2a3449] flex flex-col md:flex-row gap-4 shadow">
                              {/* Preview Column */}
                              <div className="relative w-full md:w-32 h-24 bg-black rounded-lg overflow-hidden border border-[#2a3449]/80 shrink-0">
                                <img src={normalizeImageUrl(imgObj.imageUrl)} className="w-full h-full object-cover" />
                                <span className="absolute top-1 left-1 bg-black/80 text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded font-mono">
                                  Slide {idx + 1}
                                </span>
                              </div>

                              {/* Form Inputs Column */}
                              <div className="flex-1 space-y-3">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">
                                    Texto de Legenda (Visível para os jogadores na tela):
                                  </label>
                                  <input
                                    type="text"
                                    value={imgObj.overlayText || ''}
                                    placeholder="Ex: O dragão ancestral emerge das cinzas do vulcão..."
                                    onChange={(e) => {
                                      const next = [...sceneImages];
                                      next[idx] = { ...next[idx], overlayText: e.target.value };
                                      setSceneImages(next);
                                    }}
                                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[9px] font-bold text-amber-400/80 uppercase mb-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Teleprompter do Narrador (Apenas você visualiza no Cockpit):
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={imgObj.secretNotes || ''}
                                    placeholder="Ex: Ler com tom grave. Os jogadores devem rolar salvaguarda de Destreza assim que o dragão rugir..."
                                    onChange={(e) => {
                                      const next = [...sceneImages];
                                      next[idx] = { ...next[idx], secretNotes: e.target.value };
                                      setSceneImages(next);
                                    }}
                                    className="w-full bg-[#0a0d14] border border-amber-500/20 focus:border-amber-500 rounded-lg p-2 text-xs text-amber-200 font-serif resize-none"
                                  />
                                </div>
                              </div>

                              {/* Delete button */}
                              <div className="flex items-end justify-end md:justify-center md:items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = sceneImages.filter((_, i) => i !== idx);
                                    setSceneImages(next);
                                    if (imageUrl === imgObj.imageUrl) {
                                      setImageUrl(next[0]?.imageUrl || '');
                                    }
                                  }}
                                  className="p-2 bg-[#0a0d14] hover:bg-rose-950/20 border border-[#2a3449] hover:border-rose-500/30 text-slate-500 hover:text-rose-400 rounded-lg transition-all cursor-pointer"
                                  title="Remover Slide"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeSubTab === 'audio' && (
                  <div className="max-w-2xl mx-auto space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Trilha Sonora BGM Pré-Carregada:</label>
                      <select
                        value={bgmCategory}
                        onChange={(e) => setBgmCategory(e.target.value as any)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="taverna">🍺 Taverna Rústica & Cerveja</option>
                        <option value="combate">⚔️ Combate Épico dos Dragões</option>
                        <option value="masmorra">🏰 Masmorra Sombria & Ecos</option>
                        <option value="tensao">⚡ Tensão & Perigo Iminente</option>
                        <option value="exploracao">🌲 Exploração da Natureza</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">
                        Atalhos Especiais de SFX (Selecione até 3 efeitos sonoros rápidos):
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SFX_BUTTONS.map((sfx) => {
                          const isSelected = sfxShortcuts.includes(sfx.id);
                          return (
                            <button
                              key={sfx.id}
                              type="button"
                              onClick={() => handleToggleSfxShortcut(sfx.id)}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 font-bold'
                                  : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <span className="text-xs">{sfx.name}</span>
                              {isSelected && <Volume2 className="w-3.5 h-3.5 text-purple-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'combat' && (
                  <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Left Column: Monster/Player Selection & Current Scene Combatants List */}
                    <div className="lg:col-span-5 space-y-3.5 bg-[#121824]/90 p-4 rounded-2xl border border-[#2a3449] shadow-xl">
                      {/* Add Player Characters Section */}
                      {campaignMembers.length > 0 && (
                        <div className="p-3 bg-[#161c28] border border-cyan-500/30 rounded-xl space-y-2">
                          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" /> Adicionar Jogadores Conectados ao Combate:
                          </div>
                          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar p-0.5">
                            {campaignMembers.map((mem) => (
                              <button
                                key={mem.id}
                                type="button"
                                onClick={() => handleAddPlayerToScene(mem)}
                                className="px-3 py-1.5 bg-[#0a0d14] hover:bg-[#121824] border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                              >
                                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                <span>+ {mem.characterName || mem.displayName}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add SRD Monsters Section */}
                      <div className="p-3 bg-[#161c28] border border-[#2a3449] rounded-xl space-y-2">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Adicionar Monstros do Compêndio SRD:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-0.5">
                          {INITIAL_MONSTERS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handleAddMonsterToScene(m)}
                              className="px-2.5 py-1 bg-[#0a0d14] hover:bg-[#1f2738] border border-[#2a3449] hover:border-rose-500/40 rounded-lg text-xs font-semibold text-slate-200 hover:text-rose-300 transition-all flex items-center gap-1 active:scale-95"
                            >
                              <Skull className="w-3.5 h-3.5 text-rose-400" />
                              <span>+ {m.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scene Combatants List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
                          <span>Combatentes da Cena ({sceneCombatants.length}):</span>
                          {sceneCombatants.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSceneCombatants([])}
                              className="text-[10px] text-rose-400 hover:underline font-normal"
                            >
                              Limpar Todos
                            </button>
                          )}
                        </div>

                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                          {sceneCombatants.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-xl text-xs">
                              Nenhum combatente nesta cena. Clique nos monstros ou jogadores acima para incluir no encontro!
                            </div>
                          ) : (
                            sceneCombatants.map((c, idx) => (
                              <div key={idx} className="p-2.5 bg-[#161c28] border border-[#2a3449] hover:border-slate-600 rounded-xl flex items-center justify-between shadow-sm transition-all">
                                <div className="flex items-center gap-2 min-w-0">
                                  {c.type === 'player' ? (
                                    <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                                  ) : (
                                    <Skull className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                  <span className="text-xs font-bold text-slate-100 truncate">{c.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">HP: {c.hp} | CA: {c.ac}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    c.type === 'player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                                  }`}>
                                    {c.type === 'player' ? 'JOGADOR' : 'MONSTRO'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSceneCombatants((prev) => prev.filter((_, i) => i !== idx))}
                                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                                  title="Remover combatente"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: 3D Battle Grid Interactive Preview */}
                    <div className="lg:col-span-7 space-y-2.5 bg-[#121824]/90 p-4 rounded-2xl border border-amber-500/30 shadow-xl">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200 uppercase tracking-wider">
                        <span className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-amber-400" />
                          <span>Pré-configuração e Posicionamento 3D no Grid:</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-mono font-normal">
                          Arraste & posicione no painel 3D
                        </span>
                      </div>

                      <div className="w-full h-[490px] bg-black rounded-2xl border border-amber-500/30 overflow-hidden relative shadow-2xl">
                        {sceneCombatants.length === 0 ? (
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950/80 backdrop-blur-sm">
                            <Swords className="w-12 h-12 text-amber-500/40 mb-3 animate-pulse" />
                            <p className="text-sm font-bold text-slate-200">Grid 3D Aguardando Combatentes</p>
                            <p className="text-xs text-slate-400 max-w-xs mt-1.5">
                              Adicione monstros do compêndio ou jogadores no painel ao lado para ativar a pré-visualização e posicionamento 3D!
                            </p>
                          </div>
                        ) : (
                          <ThreeErrorBoundary>
                            <BattleGrid3D
                              combatants={sceneCombatants}
                              onUpdateCombatants={(updated) => setSceneCombatants(updated)}
                              interactive={true}
                              isPlacementPhase={true}
                              timeOfDayHour={timeOfDayHour}
                              hasFog={hasFog}
                              hasRain={hasRain}
                              onEnvironmentChange={(env) => {
                                setTimeOfDayHour(env.timeOfDayHour);
                                setHasFog(env.hasFog);
                                setHasRain(env.hasRain);
                              }}
                              userRole="dm"
                            />
                          </ThreeErrorBoundary>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeSubTab === 'voice' && (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">Vincular NPC da História:</label>
                      <select
                        value={npcName}
                        onChange={(e) => setNpcName(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Selecione um NPC...</option>
                        {worldEntities.filter((e) => e.category === 'npc').map((npc) => (
                          <option key={npc.id} value={npc.name}>
                            {npc.name} ({npc.subType || 'NPC'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">URL do Áudio da Voz de IA do NPC:</label>
                      <input
                        type="url"
                        value={npcAudioUrl}
                        onChange={(e) => setNpcAudioUrl(e.target.value)}
                        placeholder="https://cdn.pixabay.com/download/audio/..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {npcAudioUrl && (
                      <div className="p-4 bg-[#161c28] border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-slate-200">Voz do NPC: {npcName || 'Narrador'}</span>
                        </div>
                        <audio controls src={npcAudioUrl} className="h-8" />
                      </div>
                    )}
                  </div>
                )}

                {activeSubTab === 'notes' && (
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        Texto Sensorial (Para ler em voz alta aos jogadores):
                      </label>
                      <textarea
                        rows={4}
                        value={sensoryText}
                        onChange={(e) => setSensoryText(e.target.value)}
                        placeholder="Ex: O som da chuva bate forte nas janelas de madeira..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-serif resize-none"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Notas Secretas do Mestre (Apenas você visualiza):
                      </label>
                      <textarea
                        rows={4}
                        value={secretNotes}
                        onChange={(e) => setSecretNotes(e.target.value)}
                        placeholder="Ex: O mordomo carrega uma chave secreta no bolso direito..."
                        className="w-full bg-[#0a0d14] border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-serif resize-none"
                      ></textarea>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Scene Modal */}
      <CreateSceneModal
        isOpen={showCreateSceneModal}
        onClose={() => setShowCreateSceneModal(false)}
      />
    </div>
  );
};
