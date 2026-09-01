'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  Search, 
  Sparkles, 
  Plus, 
  Check, 
  Trash2, 
  Zap, 
  Star, 
  Flame, 
  Sword, 
  Skull, 
  Dice5, 
  DoorOpen, 
  Disc3,
  Radio,
  Mic
} from 'lucide-react';

export interface AudioTrackItem {
  id: string;
  name: string;
  url: string;
  category?: string;
  isLoop?: boolean;
  isCustom?: boolean;
  iconName?: string;
}

interface SceneAudioStudioProps {
  // Músicas BGM
  allBgmTracks: AudioTrackItem[];
  favoriteBgmTracks: AudioTrackItem[];
  selectedBgmTrackIds: string[];
  onToggleBgmTrack: (trackId: string) => void;
  onRemoveBgmTrack: (trackId: string) => void;
  
  // Efeitos SFX
  allSfxTracks: AudioTrackItem[];
  favoriteSfxTracks: AudioTrackItem[];
  selectedSfxShortcutIds: string[];
  onToggleSfxShortcut: (sfxId: string) => void;
  onRemoveSfxShortcut: (sfxId: string) => void;

  // Narrações / Vozes
  allNarrations?: AudioTrackItem[];
  favoriteNarrations?: AudioTrackItem[];
  npcAudioUrl?: string;
  npcName?: string;
  onSelectNarration?: (narration: AudioTrackItem) => void;
  onRemoveNarration?: () => void;
}

export const SceneAudioStudio: React.FC<SceneAudioStudioProps> = ({
  allBgmTracks,
  favoriteBgmTracks,
  selectedBgmTrackIds,
  onToggleBgmTrack,
  onRemoveBgmTrack,
  allSfxTracks,
  favoriteSfxTracks,
  selectedSfxShortcutIds,
  onToggleSfxShortcut,
  onRemoveSfxShortcut,
  allNarrations = [],
  favoriteNarrations = [],
  npcAudioUrl,
  npcName,
  onSelectNarration,
  onRemoveNarration,
}) => {
  // Estados de Busca e Filtro BGM
  const [bgmSearchQuery, setBgmSearchQuery] = useState('');
  const [bgmCategoryFilter, setBgmCategoryFilter] = useState<string>('all');

  // Estados de Busca e Filtro SFX
  const [sfxSearchQuery, setSfxSearchQuery] = useState('');
  const [sfxCategoryFilter, setSfxCategoryFilter] = useState<string>('all');

  // Estados de Busca e Filtro Narração
  const [narrationSearchQuery, setNarrationSearchQuery] = useState('');
  const [narrationCategoryFilter, setNarrationCategoryFilter] = useState<string>('all');

  // Áudio Player de Preview
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Parar áudio ao desmontar
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
    };
  }, []);

  const handleTogglePlayPreview = (track: AudioTrackItem) => {
    if (currentPlayingId === track.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setCurrentPlayingId(null);
      return;
    }

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }

    audioPlayerRef.current.src = track.url;
    audioPlayerRef.current.volume = 0.65;
    audioPlayerRef.current.onended = () => setCurrentPlayingId(null);
    audioPlayerRef.current.onerror = () => setCurrentPlayingId(null);
    
    audioPlayerRef.current.play().then(() => {
      setCurrentPlayingId(track.id);
    }).catch((err) => {
      console.warn('[AudioPreview error]:', err);
      setCurrentPlayingId(null);
    });
  };

  // Categorias de BGM disponíveis
  const bgmCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    allBgmTracks.forEach((t) => {
      if (t.category) categoriesSet.add(t.category);
    });
    return Array.from(categoriesSet);
  }, [allBgmTracks]);

  // Filtro de BGM
  const filteredBgmTracks = useMemo(() => {
    return allBgmTracks.filter((track) => {
      const matchesSearch = bgmSearchQuery === '' || 
        track.name.toLowerCase().includes(bgmSearchQuery.toLowerCase()) ||
        (track.category && track.category.toLowerCase().includes(bgmSearchQuery.toLowerCase()));

      let matchesCategory = true;
      if (bgmCategoryFilter === 'favorites') {
        matchesCategory = favoriteBgmTracks.some((f) => f.id === track.id);
      } else if (bgmCategoryFilter === 'custom') {
        matchesCategory = Boolean(track.isCustom);
      } else if (bgmCategoryFilter !== 'all') {
        matchesCategory = track.category?.toLowerCase() === bgmCategoryFilter.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [allBgmTracks, bgmSearchQuery, bgmCategoryFilter, favoriteBgmTracks]);

  // Categorias de SFX disponíveis
  const sfxCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    allSfxTracks.forEach((s) => {
      if (s.category) categoriesSet.add(s.category);
    });
    return Array.from(categoriesSet);
  }, [allSfxTracks]);

  // Filtro de SFX
  const filteredSfxTracks = useMemo(() => {
    return allSfxTracks.filter((sfx) => {
      const matchesSearch = sfxSearchQuery === '' || 
        sfx.name.toLowerCase().includes(sfxSearchQuery.toLowerCase()) ||
        (sfx.category && sfx.category.toLowerCase().includes(sfxSearchQuery.toLowerCase()));

      let matchesCategory = true;
      if (sfxCategoryFilter === 'favorites') {
        matchesCategory = favoriteSfxTracks.some((f) => f.id === sfx.id);
      } else if (sfxCategoryFilter === 'custom') {
        matchesCategory = Boolean(sfx.isCustom);
      } else if (sfxCategoryFilter !== 'all') {
        matchesCategory = sfx.category?.toLowerCase() === sfxCategoryFilter.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [allSfxTracks, sfxSearchQuery, sfxCategoryFilter, favoriteSfxTracks]);

  // Filtro de Narrações
  const filteredNarrations = useMemo(() => {
    return allNarrations.filter((narr) => {
      const matchesSearch = narrationSearchQuery === '' || 
        narr.name.toLowerCase().includes(narrationSearchQuery.toLowerCase()) ||
        (narr.category && narr.category.toLowerCase().includes(narrationSearchQuery.toLowerCase()));

      let matchesCategory = true;
      if (narrationCategoryFilter === 'favorites') {
        matchesCategory = favoriteNarrations.some((f) => f.id === narr.id);
      } else if (narrationCategoryFilter !== 'all') {
        matchesCategory = narr.category?.toLowerCase() === narrationCategoryFilter.toLowerCase();
      }

      return matchesSearch && matchesCategory;
    });
  }, [allNarrations, narrationSearchQuery, narrationCategoryFilter, favoriteNarrations]);

  const getSfxCategoryIcon = (category?: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('combat') || cat.includes('ataque') || cat.includes('arma')) return <Sword className="w-3.5 h-3.5 text-rose-400" />;
    if (cat.includes('magic') || cat.includes('magia') || cat.includes('fogo')) return <Flame className="w-3.5 h-3.5 text-cyan-400" />;
    if (cat.includes('monster') || cat.includes('monstro') || cat.includes('fera')) return <Skull className="w-3.5 h-3.5 text-amber-400" />;
    if (cat.includes('door') || cat.includes('porta') || cat.includes('ambiente')) return <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />;
    if (cat.includes('dice') || cat.includes('dado') || cat.includes('crit')) return <Dice5 className="w-3.5 h-3.5 text-yellow-400" />;
    return <Zap className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-3 gap-3 xl:gap-3.5 max-w-[1720px] mx-auto overflow-hidden animate-fade-in select-none">
      
      {/* ========================================================================= */}
      {/* WIDGET 1: TRILHAS DE MÚSICA & AMBIENTES (BGM)                             */}
      {/* ========================================================================= */}
      <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-3 shadow-2xl flex flex-col gap-2 w-full h-full min-h-0 flex-1 overflow-hidden">
        
        {/* Header do Deck BGM */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Disc3 className={`w-3.5 h-3.5 ${currentPlayingId && allBgmTracks.some(t => t.id === currentPlayingId) ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                Trilhas BGM
              </h3>
              <p className="text-[9.5px] text-cyan-400/90 font-mono">
                Músicas de fundo e ambiente
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold bg-[#0a0d14] text-cyan-300 border border-[#2a3449] px-2 py-0.5 rounded-lg shadow-inner">
            {selectedBgmTrackIds.length} vinculada(s)
          </span>
        </div>

        {/* 1. Área de Trilhas Ativas da Cena */}
        <div className="space-y-1 flex-shrink-0">
          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            Músicas Vinculadas:
          </label>

          {selectedBgmTrackIds.length === 0 ? (
            <div className="p-2 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449] text-center text-slate-500">
              <p className="font-semibold text-slate-400 text-[10.5px]">Nenhuma trilha vinculada.</p>
              <p className="text-[9px] text-slate-600">Selecione no catálogo abaixo.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-16 overflow-y-auto custom-scrollbar pr-1">
              {selectedBgmTrackIds.map((trackId) => {
                const track = allBgmTracks.find((t) => t.id === trackId);
                const isPlaying = currentPlayingId === trackId;
                return (
                  <div
                    key={trackId}
                    className="p-1.5 bg-[#0a0d14] rounded-xl border border-cyan-500/40 flex items-center justify-between gap-2 shadow-sm animate-fade-in"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => track && handleTogglePlayPreview(track)}
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
                            : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                        }`}
                        title={isPlaying ? 'Pausar Prévia' : 'Ouvir Prévia'}
                      >
                        {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                      </button>
                      <div className="truncate">
                        <div className="text-[10.5px] font-bold text-slate-200 truncate">{track ? track.name : 'Trilha'}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveBgmTrack(trackId)}
                      className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Desvincular da Cena"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Barra de Busca e Filtros */}
        <div className="space-y-1 pt-1 border-t border-[#2a3449] flex-shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={bgmSearchQuery}
              onChange={(e) => setBgmSearchQuery(e.target.value)}
              placeholder="Buscar música..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-xl pl-7 pr-2 py-1 text-[11px] text-slate-200"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setBgmCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                bgmCategoryFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
            {favoriteBgmTracks.length > 0 && (
              <button
                type="button"
                onClick={() => setBgmCategoryFilter('favorites')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  bgmCategoryFilter === 'favorites'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-amber-400 hover:text-amber-300'
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-current" /> Favoritas
              </button>
            )}
            {bgmCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBgmCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  bgmCategoryFilter === cat
                    ? 'bg-cyan-500 text-slate-950 font-black shadow'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Catálogo de Trilhas BGM (SCROLL INTERNO - 1 por linha) */}
        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          {filteredBgmTracks.length > 0 ? (
            filteredBgmTracks.map((track) => {
              const isSelected = selectedBgmTrackIds.includes(track.id);
              const isPlaying = currentPlayingId === track.id;
              return (
                <div
                  key={track.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-cyan-950/25 border-cyan-500/50 shadow-sm'
                      : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayPreview(track)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse'
                          : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                      }`}
                      title={isPlaying ? 'Pausar' : 'Ouvir'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>

                    <div className="truncate">
                      <div className="text-[11px] font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{track.name}</span>
                        {track.isCustom && (
                          <span className="text-[7.5px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1 rounded font-mono">
                            Upload
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">
                        {track.category || 'Trilha'} • {track.isLoop ? 'Loop' : 'Linear'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleBgmTrack(track.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black shadow'
                        : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 hover:text-cyan-300'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>Vinculada</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-2.5 h-2.5" />
                        <span>Adicionar</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-slate-500 text-[11px] italic">
              Nenhuma música encontrada.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WIDGET 2: SOUNDBOARD DE EFEITOS SONOROS (SFX) - 1 POR LINHA              */}
      {/* ========================================================================= */}
      <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-3 shadow-2xl flex flex-col gap-2 w-full h-full min-h-0 flex-1 overflow-hidden">
        
        {/* Header do Deck SFX */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                Efeitos SFX
              </h3>
              <p className="text-[9.5px] text-amber-400/90 font-mono">
                Disparos rápidos e impactos
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold bg-[#0a0d14] text-amber-300 border border-[#2a3449] px-2 py-0.5 rounded-lg shadow-inner">
            {selectedSfxShortcutIds.length} atalho(s)
          </span>
        </div>

        {/* 1. Área de Atalhos Rápidos da Cena */}
        <div className="space-y-1 flex-shrink-0">
          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Atalhos no Cockpit:
          </label>

          {selectedSfxShortcutIds.length === 0 ? (
            <div className="p-2 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449] text-center text-slate-500">
              <p className="font-semibold text-slate-400 text-[10.5px]">Nenhum atalho configurado.</p>
              <p className="text-[9px] text-slate-600">Fixe atalhos na lista abaixo.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar p-0.5">
              {selectedSfxShortcutIds.map((sfxId) => {
                const sfx = allSfxTracks.find((s) => s.id === sfxId);
                const isPlaying = currentPlayingId === sfxId;
                return (
                  <div
                    key={sfxId}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-bold transition-all ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black animate-pulse'
                        : 'bg-[#161f30] text-amber-300 border-amber-500/40 shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => sfx && handleTogglePlayPreview(sfx)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                      title="Testar Som"
                    >
                      {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
                    </button>
                    <span className="truncate max-w-[90px]">{sfx ? sfx.name : 'Efeito'}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveSfxShortcut(sfxId)}
                      className="text-slate-400 hover:text-rose-400 ml-0.5 font-black cursor-pointer"
                      title="Remover Atalho"
                    >
                      &times;
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Barra de Busca e Filtros SFX */}
        <div className="space-y-1 pt-1 border-t border-[#2a3449] flex-shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sfxSearchQuery}
              onChange={(e) => setSfxSearchQuery(e.target.value)}
              placeholder="Buscar efeito (espada, fogo, porta)..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl pl-7 pr-2 py-1 text-[11px] text-slate-200"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setSfxCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                sfxCategoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos
            </button>
            {favoriteSfxTracks.length > 0 && (
              <button
                type="button"
                onClick={() => setSfxCategoryFilter('favorites')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  sfxCategoryFilter === 'favorites'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-amber-400 hover:text-amber-300'
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-current" /> Favoritos
              </button>
            )}
            {sfxCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSfxCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  sfxCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Catálogo de Efeitos SFX (SCROLL INTERNO - 1 POR LINHA) */}
        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          {filteredSfxTracks.length > 0 ? (
            filteredSfxTracks.map((sfx) => {
              const isSelected = selectedSfxShortcutIds.includes(sfx.id);
              const isPlaying = currentPlayingId === sfx.id;
              return (
                <div
                  key={sfx.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-amber-950/25 border-amber-500/50 shadow-sm'
                      : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayPreview(sfx)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.6)] animate-pulse'
                          : 'bg-[#161c28] hover:bg-[#20293a] text-amber-400 border border-amber-500/30'
                      }`}
                      title={isPlaying ? 'Parar' : 'Disparar'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="p-1 rounded-md bg-[#161c28] border border-[#2a3449] shrink-0">
                        {getSfxCategoryIcon(sfx.category)}
                      </div>
                      <div className="truncate">
                        <div className="text-[11px] font-bold text-slate-200 truncate">{sfx.name}</div>
                        <div className="text-[9px] text-amber-400/80 font-mono truncate uppercase">
                          {sfx.category || 'SFX'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleSfxShortcut(sfx.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 hover:text-amber-300'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span>No Cockpit</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-2.5 h-2.5" />
                        <span>+ Atalho</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-slate-500 text-[11px] italic">
              Nenhum efeito encontrado.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* WIDGET 3: NARRAÇÕES & FALAS DE NPCS (VOZES) - 1 POR LINHA                  */}
      {/* ========================================================================= */}
      <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-3 shadow-2xl flex flex-col gap-2 w-full h-full min-h-0 flex-1 overflow-hidden">
        
        {/* Header do Deck Narrações */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Mic className={`w-3.5 h-3.5 ${currentPlayingId && allNarrations.some(n => n.id === currentPlayingId) ? 'animate-pulse text-cyan-300' : ''}`} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 flex items-center gap-1">
                Narrações & Vozes
              </h3>
              <p className="text-[9.5px] text-cyan-400/90 font-mono">
                Falas de NPCs e prólogos (Auto-Duck)
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-bold bg-[#0a0d14] text-cyan-300 border border-[#2a3449] px-2 py-0.5 rounded-lg shadow-inner">
            {npcAudioUrl ? '1 vinculada' : '0 vinculada'}
          </span>
        </div>

        {/* 1. Área de Narração Ativa da Cena */}
        <div className="space-y-1 flex-shrink-0">
          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1">
            <Mic className="w-3 h-3 text-cyan-400" />
            Narração Vinculada à Cena:
          </label>

          {!npcAudioUrl ? (
            <div className="p-2 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449] text-center text-slate-500">
              <p className="font-semibold text-slate-400 text-[10.5px]">Nenhuma narração vinculada.</p>
              <p className="text-[9px] text-slate-600">Selecione uma narração na lista abaixo.</p>
            </div>
          ) : (
            <div className="p-1.5 bg-[#0a0d14] rounded-xl border border-cyan-500/50 flex items-center justify-between gap-2 shadow-sm animate-fade-in">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  onClick={() => handleTogglePlayPreview({ id: 'scene-npc-voice', name: npcName || 'Narração', url: npcAudioUrl })}
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                    currentPlayingId === 'scene-npc-voice'
                      ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse'
                      : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                  }`}
                  title={currentPlayingId === 'scene-npc-voice' ? 'Pausar Prévia' : 'Ouvir Narração'}
                >
                  {currentPlayingId === 'scene-npc-voice' ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
                </button>
                <div className="truncate">
                  <div className="text-[10.5px] font-bold text-cyan-300 truncate">
                    {npcName || 'Narração da Cena'}
                  </div>
                  <div className="text-[8px] text-cyan-400/70 font-mono">Auto-Ducking 35% BGM</div>
                </div>
              </div>

              {onRemoveNarration && (
                <button
                  type="button"
                  onClick={onRemoveNarration}
                  className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                  title="Desvincular Narração"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 2. Barra de Busca e Filtros Narração */}
        <div className="space-y-1 pt-1 border-t border-[#2a3449] flex-shrink-0">
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={narrationSearchQuery}
              onChange={(e) => setNarrationSearchQuery(e.target.value)}
              placeholder="Buscar narração ou fala de NPC..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-xl pl-7 pr-2 py-1 text-[11px] text-slate-200"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5">
            <button
              type="button"
              onClick={() => setNarrationCategoryFilter('all')}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                narrationCategoryFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-black shadow'
                  : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas
            </button>
            {favoriteNarrations.length > 0 && (
              <button
                type="button"
                onClick={() => setNarrationCategoryFilter('favorites')}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  narrationCategoryFilter === 'favorites'
                    ? 'bg-amber-500 text-slate-950 font-black shadow'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-amber-400 hover:text-amber-300'
                }`}
              >
                <Star className="w-2.5 h-2.5 fill-current" /> Favoritas
              </button>
            )}
          </div>
        </div>

        {/* 3. Catálogo de Narrações (SCROLL INTERNO - 1 POR LINHA) */}
        <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
          {filteredNarrations.length > 0 ? (
            filteredNarrations.map((narr) => {
              const isSelected = npcAudioUrl === narr.url;
              const isPlaying = currentPlayingId === narr.id;
              return (
                <div
                  key={narr.id}
                  className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm'
                      : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePlayPreview(narr)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse'
                          : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                      }`}
                      title={isPlaying ? 'Pausar' : 'Ouvir Narração'}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>

                    <div className="truncate">
                      <div className="text-[11px] font-bold text-slate-200 truncate flex items-center gap-1">
                        <span>{narr.name}</span>
                      </div>
                      <div className="text-[9px] text-cyan-400/80 font-mono truncate">
                        🎙️ Voz / Narração
                      </div>
                    </div>
                  </div>

                  {onSelectNarration && (
                    <button
                      type="button"
                      onClick={() => onSelectNarration(narr)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-black shadow'
                          : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 hover:text-cyan-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Vinculada</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-2.5 h-2.5" />
                          <span>Vincular</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
              <p className="font-semibold text-slate-400">Nenhuma narração cadastrada.</p>
              <p className="text-[9.5px] text-slate-600">
                Faça o upload de narrações MP3 no <strong>Audio Maestro Panel</strong> (menu de música) para usá-las aqui.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
