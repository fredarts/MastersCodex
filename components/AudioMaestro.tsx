'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Radio, 
  Repeat, 
  Plus, 
  Mic, 
  Sparkles, 
  Swords,
  Flame,
  Target,
  Heart,
  Zap,
  Skull,
  Coins,
  Sun,
  DoorOpen,
  Hammer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { BGMTrack, SFXButton } from '@/lib/types';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';
import { useAudio } from '@/context/AudioContext';
import { useSession } from '@/context/SessionContext';
import { useCampaign } from '@/context/CampaignContext';
import { supabase, isValidUuid } from '@/lib/supabase';

interface AudioMaestroProps {
  onOpenAudioPanel?: () => void;
}

export const AudioMaestro: React.FC<AudioMaestroProps> = ({ onOpenAudioPanel }) => {
  const { activeScene } = useSession();
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id;

  const { 
    activeBgm, 
    isPlayingBgm, 
    volume, 
    isMuted, 
    setVolume, 
    setIsMuted, 
    playBgm, 
    pauseBgm, 
    playSfx, 
    toggleBgmLoop, 
    isLooping, 
    resumeBgm 
  } = useAudio();

  const [activeSfxId, setActiveSfxId] = useState<string | null>(null);
  const [selectedSfxId, setSelectedSfxId] = useState<string>('');
  const [campaignNarrations, setCampaignNarrations] = useState<any[]>([]);
  const [selectedNarrationUrl, setSelectedNarrationUrl] = useState<string>('');
  const [selectedNarrationName, setSelectedNarrationName] = useState<string>('');
  const [playingNpcVoice, setPlayingNpcVoice] = useState(false);
  
  // Collapsible channel states
  const [isBgmCollapsed, setIsBgmCollapsed] = useState(false);
  const [isNarrationCollapsed, setIsNarrationCollapsed] = useState(false);
  const [isSfxCollapsed, setIsSfxCollapsed] = useState(false);

  const npcAudioRef = useRef<HTMLAudioElement | null>(null);
  const originalVolumeRef = useRef<number>(volume);
  const isDuckingRef = useRef<boolean>(false);

  // Load uploaded narrations from database
  useEffect(() => {
    if (campaignId && isValidUuid(campaignId)) {
      supabase
        .from('campaign_audio_assets')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('type', 'narration')
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setCampaignNarrations(data);
        });
    }
  }, [campaignId]);

  // Sync selected narration when scene or campaign narrations update
  useEffect(() => {
    if (activeScene?.npcAudioUrl) {
      setSelectedNarrationUrl(activeScene.npcAudioUrl);
      setSelectedNarrationName(activeScene.npcName || 'Narração da Cena');
    } else if (campaignNarrations.length > 0) {
      if (!selectedNarrationUrl || !campaignNarrations.some(n => n.url === selectedNarrationUrl)) {
        setSelectedNarrationUrl(campaignNarrations[0].url);
        setSelectedNarrationName(campaignNarrations[0].name);
      }
    } else {
      setSelectedNarrationUrl('');
      setSelectedNarrationName('');
    }
  }, [activeScene?.npcAudioUrl, activeScene?.npcName, campaignNarrations]);

  // Available Scene SFX shortcuts configured in Scene Studio
  const sceneSfxButtons = (activeScene?.sfxShortcuts && activeScene.sfxShortcuts.length > 0)
    ? SFX_BUTTONS.filter(s => activeScene.sfxShortcuts?.includes(s.id))
    : [];

  // Initialize selectedSfxId to first scene shortcut or default sword slash
  useEffect(() => {
    if (activeScene?.sfxShortcuts && activeScene.sfxShortcuts.length > 0) {
      setSelectedSfxId(activeScene.sfxShortcuts[0]);
    } else if (!selectedSfxId) {
      setSelectedSfxId('sfx-sword-slash');
    }
  }, [activeScene?.sfxShortcuts]);

  // Keep track of user-set volume when not ducked
  useEffect(() => {
    if (!isDuckingRef.current && !isMuted) {
      originalVolumeRef.current = volume;
    }
  }, [volume, isMuted]);

  // Handle NPC Voice / Narration audio initialization
  useEffect(() => {
    if (selectedNarrationUrl) {
      if (npcAudioRef.current) {
        npcAudioRef.current.pause();
      }
      npcAudioRef.current = new Audio(selectedNarrationUrl);
      npcAudioRef.current.onended = () => {
        setPlayingNpcVoice(false);
      };
    } else {
      if (npcAudioRef.current) {
        npcAudioRef.current.pause();
      }
      npcAudioRef.current = null;
    }
    return () => {
      if (npcAudioRef.current) {
        npcAudioRef.current.pause();
        npcAudioRef.current = null;
      }
    };
  }, [selectedNarrationUrl]);

  // Auto-Ducking Engine: Attenuate BGM volume to 35% when Narration is playing
  useEffect(() => {
    if (!npcAudioRef.current) return;

    if (playingNpcVoice) {
      isDuckingRef.current = true;
      const targetDuckedVolume = Math.max(0.05, (originalVolumeRef.current || 0.8) * 0.35);
      setVolume(targetDuckedVolume);

      npcAudioRef.current.play().catch((err) => {
        console.error('Falha ao reproduzir áudio da narração:', err);
        setPlayingNpcVoice(false);
      });
    } else {
      npcAudioRef.current.pause();
      if (isDuckingRef.current) {
        setVolume(originalVolumeRef.current || 0.8);
        isDuckingRef.current = false;
      }
    }
  }, [playingNpcVoice, setVolume]);

  const handleBgmSelect = (trackId: string) => {
    if (!trackId) {
      if (isPlayingBgm) pauseBgm();
      return;
    }
    const found = BGM_TRACKS.find(t => t.id === trackId);
    if (found) {
      playBgm(found);
    }
  };

  const handlePlaySfxOption = (urlOrId: string) => {
    if (!urlOrId) return;
    const foundSfx = SFX_BUTTONS.find(s => s.id === urlOrId || s.url === urlOrId);
    if (foundSfx) {
      setActiveSfxId(foundSfx.id);
      playSfx(foundSfx.url);
      setTimeout(() => setActiveSfxId(null), 900);
    } else {
      playSfx(urlOrId);
    }
  };

  const getSfxIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Flame': return <Flame className="w-3.5 h-3.5 text-rose-400" />;
      case 'Target': return <Target className="w-3.5 h-3.5 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-3.5 h-3.5 text-purple-300" />;
      case 'Heart': return <Heart className="w-3.5 h-3.5 text-rose-400" />;
      case 'Zap': return <Zap className="w-3.5 h-3.5 text-yellow-300" />;
      case 'Skull': return <Skull className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Coins': return <Coins className="w-3.5 h-3.5 text-amber-300" />;
      case 'Sun': return <Sun className="w-3.5 h-3.5 text-yellow-400" />;
      case 'DoorOpen': return <DoorOpen className="w-3.5 h-3.5 text-cyan-400" />;
      case 'Hammer': return <Hammer className="w-3.5 h-3.5 text-slate-300" />;
      case 'Sword':
      case 'Swords':
      default:
        return <Swords className="w-3.5 h-3.5 text-amber-300" />;
    }
  };

  // Available BGM tracks (prefer scene tracks, fallback to all)
  const sceneBgmTracks = (activeScene?.bgmTracks && activeScene.bgmTracks.length > 0)
    ? BGM_TRACKS.filter(t => activeScene.bgmTracks?.includes(t.id))
    : BGM_TRACKS;

  const currentSfx = SFX_BUTTONS.find(s => s.id === selectedSfxId) || sceneSfxButtons[0] || SFX_BUTTONS[0];

  return (
    <footer className="h-16 bg-[#0c1017] border-t border-[#2a3449] px-2.5 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 z-20 shadow-2xl select-none min-w-0 overflow-hidden">
      
      {/* 3-Channel Mixer Container */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-1 min-w-0 overflow-hidden">
        
        {/* ========================================================================= */}
        {/* CANAL 1: BGM (MÚSICA DE FUNDO)                                            */}
        {/* ========================================================================= */}
        {isBgmCollapsed ? (
          <div className="flex items-center gap-1.5 bg-[#141a27] border border-[#2a3449] hover:border-pink-500/40 px-2 py-1.5 rounded-xl shrink-0 transition-all shadow-sm">
            <button
              onClick={() => {
                if (isPlayingBgm) pauseBgm();
                else if (activeBgm) resumeBgm();
                else if (sceneBgmTracks.length > 0) playBgm(sceneBgmTracks[0]);
              }}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                isPlayingBgm ? 'bg-pink-600 text-slate-950 shadow-sm' : 'bg-pink-950/60 text-pink-400'
              }`}
              title={isPlayingBgm ? 'Pausar BGM' : 'Tocar BGM'}
            >
              {isPlayingBgm ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => setIsBgmCollapsed(false)}
              className="flex items-center gap-1 text-slate-200 hover:text-pink-300 cursor-pointer"
              title="Expandir Controles de BGM"
            >
              <Radio className="w-3 h-3 text-pink-400 shrink-0" />
              <span className="text-[10px] font-bold truncate max-w-[70px] sm:max-w-[90px]">
                {activeBgm ? activeBgm.name : 'BGM'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#141a27] border border-[#2a3449] px-2 py-1 rounded-xl shrink-0 max-w-[290px] shadow-sm">
            {/* Play/Pause Button */}
            <button
              onClick={() => {
                if (isPlayingBgm) {
                  pauseBgm();
                } else if (activeBgm) {
                  resumeBgm();
                } else if (sceneBgmTracks.length > 0) {
                  playBgm(sceneBgmTracks[0]);
                }
              }}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer shadow ${
                isPlayingBgm 
                  ? 'bg-pink-600 text-slate-950 shadow-pink-600/30' 
                  : 'bg-pink-950/60 text-pink-400 hover:bg-pink-900 border border-pink-700/50'
              }`}
              title={isPlayingBgm ? 'Pausar Trilha de BGM' : 'Tocar Trilha de BGM'}
            >
              {isPlayingBgm ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* BGM Dropdown */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-pink-400 shrink-0" />
                <span className="text-[9px] font-bold text-pink-300/90 uppercase font-mono tracking-wider">
                  BGM
                </span>
              </div>
              <select
                value={activeBgm?.id || ''}
                onChange={(e) => handleBgmSelect(e.target.value)}
                className="bg-[#0a0d14] border border-[#2a3449] hover:border-pink-500/40 text-slate-200 font-medium text-[11px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer w-24 sm:w-28 truncate"
                title="Selecione a trilha de música de fundo"
              >
                <option value="">-- Sem Trilha --</option>
                {activeScene?.bgmTracks && activeScene.bgmTracks.length > 0 && (
                  <optgroup label="⭐ Trilhas da Cena" className="bg-[#121824] text-pink-300 font-bold">
                    {sceneBgmTracks.map((t) => (
                      <option key={`scene-${t.id}`} value={t.id} className="text-slate-100 font-bold">
                        ⭐ {t.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="📚 Todas as Trilhas" className="bg-[#121824] text-slate-400 font-bold">
                  {BGM_TRACKS.filter(t => !activeScene?.bgmTracks?.includes(t.id)).map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-200">
                      {t.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Loop Toggle */}
            {activeBgm && (
              <button
                onClick={() => toggleBgmLoop(activeBgm.id)}
                className={`p-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                  isLooping(activeBgm.id)
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                title={isLooping(activeBgm.id) ? 'Loop Ativo' : 'Ativar Loop Contínuo'}
              >
                <Repeat className="w-3 h-3" />
              </button>
            )}

            {/* Mini Volume Slider */}
            <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-[#2a3449]/70">
              <button 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-slate-400 hover:text-pink-300 cursor-pointer"
                title={isMuted ? 'Desmutar' : 'Mutar'}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  originalVolumeRef.current = val;
                  if (isMuted) setIsMuted(false);
                }}
                className="w-10 accent-pink-500 bg-[#0a0d14] h-1 rounded-lg cursor-pointer"
                title={`Volume BGM: ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setIsBgmCollapsed(true)}
              className="p-0.5 text-slate-500 hover:text-pink-300 cursor-pointer rounded ml-0.5"
              title="Recolher BGM"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CANAL 2: NARRAÇÃO & VOZES DE NPC (COM AUTO-DUCKING)                        */}
        {/* ========================================================================= */}
        {isNarrationCollapsed ? (
          <div className="flex items-center gap-1.5 bg-[#141a27] border border-[#2a3449] hover:border-cyan-500/40 px-2 py-1.5 rounded-xl shrink-0 transition-all shadow-sm">
            <button
              disabled={!selectedNarrationUrl}
              onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                selectedNarrationUrl
                  ? playingNpcVoice
                    ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 animate-pulse cursor-pointer'
                    : 'bg-cyan-950/60 text-cyan-400 cursor-pointer'
                  : 'bg-[#0a0d14] text-slate-600 cursor-not-allowed'
              }`}
              title={selectedNarrationUrl ? (playingNpcVoice ? 'Pausar Narração' : 'Tocar Narração') : 'Sem Narração'}
            >
              {playingNpcVoice ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
            </button>
            <button
              onClick={() => setIsNarrationCollapsed(false)}
              className="flex items-center gap-1 text-slate-200 hover:text-cyan-300 cursor-pointer"
              title="Expandir Controles de Narração"
            >
              <Mic className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-[10px] font-bold truncate max-w-[70px] sm:max-w-[85px]">
                {selectedNarrationName || 'Narração'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#141a27] border border-[#2a3449] px-2 py-1 rounded-xl shrink-0 max-w-[270px] shadow-sm">
            {/* Play/Pause Button with Pulse when Playing */}
            <button
              disabled={!selectedNarrationUrl}
              onClick={() => setPlayingNpcVoice(!playingNpcVoice)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                selectedNarrationUrl
                  ? playingNpcVoice
                    ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 ring-2 ring-cyan-300 animate-pulse cursor-pointer'
                    : 'bg-cyan-950/60 text-cyan-400 hover:bg-cyan-900 border border-cyan-700/50 cursor-pointer'
                  : 'bg-[#0a0d14] text-slate-600 border border-[#2a3449] cursor-not-allowed'
              }`}
              title={selectedNarrationUrl ? (playingNpcVoice ? 'Pausar Narração' : 'Tocar Narração') : 'Nenhuma narração configurada ou enviada'}
            >
              {playingNpcVoice ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            {/* Voice Dropdown / Title */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <Mic className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-[9px] font-bold text-cyan-300/90 uppercase font-mono tracking-wider">
                  Narração
                </span>
                {playingNpcVoice && (
                  <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 rounded font-mono">
                    Duck 35%
                  </span>
                )}
              </div>
              <select
                value={selectedNarrationUrl || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) {
                    setSelectedNarrationUrl('');
                    setSelectedNarrationName('');
                    setPlayingNpcVoice(false);
                    return;
                  }
                  if (activeScene?.npcAudioUrl === val) {
                    setSelectedNarrationUrl(val);
                    setSelectedNarrationName(activeScene.npcName || 'Narração da Cena');
                  } else {
                    const found = campaignNarrations.find(n => n.url === val);
                    setSelectedNarrationUrl(val);
                    setSelectedNarrationName(found?.name || 'Narração');
                  }
                  setPlayingNpcVoice(false);
                }}
                disabled={!activeScene?.npcAudioUrl && campaignNarrations.length === 0}
                className="bg-[#0a0d14] border border-[#2a3449] hover:border-cyan-500/40 text-slate-200 font-medium text-[11px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer w-24 sm:w-28 truncate disabled:opacity-50 disabled:cursor-not-allowed"
                title="Selecione a narração ou voz para tocar no Cockpit"
              >
                {activeScene?.npcAudioUrl && (
                  <option value={activeScene.npcAudioUrl} className="bg-[#121824] text-cyan-300 font-bold">
                    🎙️ {activeScene.npcName || 'Narração da Cena'}
                  </option>
                )}
                {campaignNarrations.length > 0 && (
                  <optgroup label="🎙️ Narrações da Campanha" className="bg-[#121824] text-cyan-400 font-bold">
                    {campaignNarrations.filter(n => n.url !== activeScene?.npcAudioUrl).map((n) => (
                      <option key={n.id} value={n.url} className="text-slate-200">
                        {n.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {!activeScene?.npcAudioUrl && campaignNarrations.length === 0 && (
                  <option value="" className="bg-[#121824] text-slate-500">
                    Sem Narração
                  </option>
                )}
              </select>
            </div>

            {/* Collapse button */}
            <button
              onClick={() => setIsNarrationCollapsed(true)}
              className="p-0.5 text-slate-500 hover:text-cyan-300 cursor-pointer rounded ml-0.5"
              title="Recolher Narração"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CANAL 3: SOUNDBOARD SFX (SELEÇÃO + DISPARO NO BOTÃO)                       */}
        {/* ========================================================================= */}
        {isSfxCollapsed ? (
          <div className="flex items-center gap-1 bg-[#141a27] border border-[#2a3449] hover:border-amber-500/40 px-2 py-1.5 rounded-xl shrink-0 transition-all shadow-sm">
            <button
              onClick={() => handlePlaySfxOption(selectedSfxId || currentSfx?.id || 'sfx-sword-slash')}
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                activeSfxId ? 'bg-amber-400 text-slate-950 scale-105 shadow-md' : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              }`}
              title={`Tocar SFX: ${currentSfx?.name || 'Efeito Sonoro'}`}
            >
              {getSfxIcon(currentSfx?.iconName)}
            </button>
            <button
              onClick={() => setIsSfxCollapsed(false)}
              className="flex items-center gap-1 text-slate-200 hover:text-amber-300 cursor-pointer"
              title="Expandir Soundboard SFX"
            >
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px] font-bold text-amber-300 truncate max-w-[70px] sm:max-w-[85px]">
                {currentSfx?.name?.split(' ')[0] || 'SFX'}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#141a27] border border-[#2a3449] px-2 py-1 rounded-xl shrink-0 max-w-[240px] shadow-sm relative">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[9px] font-bold text-amber-300/90 uppercase font-mono tracking-wider">
                  SFX {sceneSfxButtons.length > 0 ? `(${sceneSfxButtons.length} Cena)` : ''}
                </span>
              </div>
              
              {/* SFX Dropdown (Selects the effect WITHOUT auto-playing) */}
              <select
                value={selectedSfxId || currentSfx?.id || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedSfxId(e.target.value);
                  }
                }}
                className="bg-[#0a0d14] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-[11px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer w-24 sm:w-28 truncate shadow-inner"
                title="Selecione o efeito sonoro para disparar no botão ao lado"
              >
                {/* 1. Scene Shortcuts Configured in Session/Scene Studio */}
                {sceneSfxButtons.length > 0 && (
                  <optgroup label="⭐ Atalhos da Cena" className="bg-[#121824] text-amber-300 font-bold">
                    {sceneSfxButtons.map((s) => (
                      <option key={`scene-${s.id}`} value={s.id} className="text-slate-100 font-bold">
                        ⭐ {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {/* 2. Combat SFX */}
                <optgroup label="⚔️ Combate" className="bg-[#121824] text-amber-400 font-bold">
                  {SFX_BUTTONS.filter(s => s.category === 'combat').map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-200">
                      {s.name}
                    </option>
                  ))}
                </optgroup>

                {/* 3. Magic Spells SFX */}
                <optgroup label="✨ Magia & Arcana" className="bg-[#121824] text-purple-400 font-bold">
                  {SFX_BUTTONS.filter(s => s.category === 'magic').map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-200">
                      {s.name}
                    </option>
                  ))}
                </optgroup>

                {/* 4. Environment & Narration SFX */}
                <optgroup label="🌲 Ambiente & Monstros" className="bg-[#121824] text-cyan-400 font-bold">
                  {SFX_BUTTONS.filter(s => s.category === 'environment').map((s) => (
                    <option key={s.id} value={s.id} className="text-slate-200">
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Trigger Button: Plays the currently selected SFX repeatedly on demand */}
            <button
              onClick={() => handlePlaySfxOption(selectedSfxId || currentSfx?.id || 'sfx-sword-slash')}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                activeSfxId
                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
              title={`Disparar Efeito: ${currentSfx?.name || 'SFX'}`}
            >
              {getSfxIcon(currentSfx?.iconName)}
            </button>

            {/* Collapse button */}
            <button
              onClick={() => setIsSfxCollapsed(true)}
              className="p-0.5 text-slate-500 hover:text-amber-300 cursor-pointer rounded ml-0.5"
              title="Recolher SFX"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Add/Manage Audio Button */}
        {onOpenAudioPanel && (
          <button
            onClick={onOpenAudioPanel}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border border-dashed border-[#2a3449] hover:border-amber-500/50 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Abrir Estúdio / Painel Completo de Áudios"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}

      </div>
    </footer>
  );
};
