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
import { useAuth } from '@/context/AuthContext';
import { GameScene, SceneType, Combatant } from '@/lib/types';
import { INITIAL_MONSTERS, SFX_BUTTONS } from '@/lib/srd-data';
import { CreateSceneModal } from '@/components/CreateSceneModal';

interface SessionStudioProps {
  onEquipScene: (scene: GameScene) => void;
}

export const SessionStudio: React.FC<SessionStudioProps> = ({ onEquipScene }) => {
  const { 
    activeCampaign, 
    campaignMembers,
    sessions, 
    activeSession, 
    setActiveSession, 
    createSession,
    scenes, 
    activeScene, 
    setActiveScene,
    updateScene,
    deleteScene,
    worldEntities 
  } = useAuth();

  const [selectedScene, setSelectedScene] = useState<GameScene | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'image' | 'audio' | 'combat' | 'voice' | 'notes'>('image');
  const [showCreateSceneModal, setShowCreateSceneModal] = useState(false);
  const [showNewSessionInput, setShowNewSessionInput] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // Editable Form State for Selected Scene
  const [title, setTitle] = useState('');
  const [sceneType, setSceneType] = useState<SceneType>('social');
  const [imageUrl, setImageUrl] = useState('');
  const [bgmCategory, setBgmCategory] = useState<'taverna' | 'combate' | 'masmorra' | 'tensao' | 'exploracao'>('taverna');
  const [sfxShortcuts, setSfxShortcuts] = useState<string[]>([]);
  const [npcName, setNpcName] = useState('');
  const [npcAudioUrl, setNpcAudioUrl] = useState('');
  const [sensoryText, setSensoryText] = useState('');
  const [secretNotes, setSecretNotes] = useState('');
  const [sceneCombatants, setSceneCombatants] = useState<Combatant[]>([]);
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
    };

    await updateScene(updated);
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
    const newP: Combatant = {
      id: `c-pl-${Date.now()}-${Math.random()}`,
      name: pName,
      type: 'player',
      hp: 35,
      maxHp: 35,
      ac: 16,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
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
                  <div className="max-w-2xl mx-auto space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1">
                        URL da Imagem / Arte do Cenário (Exibida no Player View / Discord):
                      </label>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    {imageUrl ? (
                      <div className="rounded-2xl overflow-hidden border border-[#2a3449] shadow-2xl relative max-h-80 bg-black flex items-center justify-center">
                        <img src={imageUrl} alt="Arte da cena" className="w-full h-full object-cover max-h-80" />
                        <span className="absolute top-2 right-2 bg-black/70 text-cyan-400 text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                          <Tv className="w-3 h-3" /> Transmitida aos Jogadores
                        </span>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-2xl">
                        Nenhuma imagem definida para esta cena.
                      </div>
                    )}
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
                  <div className="max-w-2xl mx-auto space-y-4">
                    {/* Add Player Characters Section */}
                    {campaignMembers.length > 0 && (
                      <div className="p-3 bg-[#161c28] border border-cyan-500/30 rounded-xl space-y-2">
                        <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5" /> Adicionar Jogadores Conectados ao Combate:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {campaignMembers.map((mem) => (
                            <button
                              key={mem.id}
                              type="button"
                              onClick={() => handleAddPlayerToScene(mem)}
                              className="px-3 py-1.5 bg-[#0a0d14] hover:bg-[#121824] border border-cyan-500/40 rounded-xl text-xs font-bold text-cyan-300 hover:text-cyan-200 transition-all flex items-center gap-1"
                            >
                              <Shield className="w-3.5 h-3.5 text-cyan-400" />
                              <span>+ {mem.characterName || mem.displayName}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Adicionar Monstros do Compêndio SRD:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {INITIAL_MONSTERS.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleAddMonsterToScene(m)}
                            className="px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-xl text-xs font-semibold text-slate-200 hover:text-amber-300 transition-all flex items-center gap-1"
                          >
                            <Skull className="w-3.5 h-3.5 text-rose-400" />
                            <span>+ {m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Combatentes da Cena ({sceneCombatants.length}):
                      </div>

                      {sceneCombatants.length === 0 ? (
                        <div className="p-6 text-center text-slate-500 bg-[#161c28] border border-dashed border-[#2a3449] rounded-2xl text-xs">
                          Nenhum combatente adicionado a esta cena.
                        </div>
                      ) : (
                        sceneCombatants.map((c, idx) => (
                          <div key={idx} className="p-3 bg-[#161c28] border border-[#2a3449] rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {c.type === 'player' ? (
                                <Shield className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <Skull className="w-4 h-4 text-rose-400" />
                              )}
                              <span className="text-xs font-bold text-slate-100">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">HP: {c.hp} | CA: {c.ac}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                c.type === 'player' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {c.type === 'player' ? 'JOGADOR' : 'MONSTRO'}
                              </span>
                            </div>
                            <button
                              onClick={() => setSceneCombatants((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
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
