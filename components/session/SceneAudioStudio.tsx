'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Search, 
  Sparkles, 
  Plus, 
  Check, 
  Trash2, 
  Zap, 
  Star, 
  Layers, 
  Flame, 
  Sword, 
  Shield, 
  Skull, 
  Dice5, 
  DoorOpen, 
  Disc3,
  Sliders,
  Radio
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
}) => {
  // Estados de Busca e Filtro BGM
  const [bgmSearchQuery, setBgmSearchQuery] = useState('');
  const [bgmCategoryFilter, setBgmCategoryFilter] = useState<string>('all');

  // Estados de Busca e Filtro SFX
  const [sfxSearchQuery, setSfxSearchQuery] = useState('');
  const [sfxCategoryFilter, setSfxCategoryFilter] = useState<string>('all');

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
      // Pausar
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
    <div className="w-full max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[640px] animate-fade-in select-none">
      
      {/* ========================================================================= */}
      {/* DECK ESQUERDO (50%): TRILHAS DE MÚSICA & AMBIENTES (BGM)                  */}
      {/* ========================================================================= */}
      <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Header do Deck BGM */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Disc3 className={`w-5 h-5 ${currentPlayingId && allBgmTracks.some(t => t.id === currentPlayingId) ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Trilhas Sonoras & Ambientes (BGM)
              </h3>
              <p className="text-[11px] text-cyan-400/90 font-mono">
                Músicas de fundo e ambientação imersiva da cena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold bg-[#0a0d14] text-cyan-300 border border-[#2a3449] px-2.5 py-1 rounded-xl shadow-inner">
              {selectedBgmTrackIds.length} vinculada(s)
            </span>
          </div>
        </div>

        {/* 1. Área de Trilhas Ativas da Cena */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            Músicas Vinculadas a Esta Cena:
          </label>

          {selectedBgmTrackIds.length === 0 ? (
            <div className="p-4 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449] text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">Nenhuma trilha musical vinculada ainda.</p>
              <p className="text-[10px] text-slate-600">Selecione as músicas no catálogo abaixo para adicioná-las aos controles do Cockpit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
              {selectedBgmTrackIds.map((trackId) => {
                const track = allBgmTracks.find((t) => t.id === trackId);
                const isPlaying = currentPlayingId === trackId;
                return (
                  <div
                    key={trackId}
                    className="p-2 bg-[#0a0d14] rounded-xl border border-cyan-500/40 flex items-center justify-between gap-2 shadow-md animate-fade-in"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => track && handleTogglePlayPreview(track)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                            : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                        }`}
                        title={isPlaying ? 'Pausar Prévia' : 'Ouvir Prévia'}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                      </button>
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate">{track ? track.name : 'Trilha Customizada'}</div>
                        <div className="text-[9px] text-cyan-400/80 font-mono truncate">{track?.category || 'BGM'}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveBgmTrack(trackId)}
                      className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Desvincular da Cena"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Barra de Busca e Filtros Narrativos */}
        <div className="space-y-2.5 pt-2 border-t border-[#2a3449]">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bgmSearchQuery}
                onChange={(e) => setBgmSearchQuery(e.target.value)}
                placeholder="Buscar música por nome ou clima..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-cyan-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setBgmCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  bgmCategoryFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow font-black'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas
              </button>
              {favoriteBgmTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBgmCategoryFilter('favorites')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    bgmCategoryFilter === 'favorites'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'bg-[#0a0d14] border border-[#2a3449] text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" /> Favoritas
                </button>
              )}
              {bgmCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setBgmCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    bgmCategoryFilter === cat
                      ? 'bg-cyan-500 text-slate-950 shadow font-black'
                      : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Catálogo de Trilhas BGM */}
          <div className="space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {filteredBgmTracks.length > 0 ? (
              filteredBgmTracks.map((track) => {
                const isSelected = selectedBgmTrackIds.includes(track.id);
                const isPlaying = currentPlayingId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/25 border-cyan-500/50 shadow-md'
                        : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayPreview(track)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse'
                            : 'bg-[#161c28] hover:bg-[#20293a] text-cyan-400 border border-cyan-500/30'
                        }`}
                        title={isPlaying ? 'Pausar Prévia' : 'Ouvir Prévia'}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-2">
                          <span>{track.name}</span>
                          {track.isCustom && (
                            <span className="text-[9px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono">
                              Upload
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {track.category || 'Trilha Sonora'} • {track.isLoop ? 'Looping' : 'Linear'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleBgmTrack(track.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 hover:text-cyan-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Vinculada</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Adicionar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500 text-xs italic">
                Nenhuma música encontrada com os filtros atuais.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DECK DIREITO (50%): SOUNDBOARD DE EFEITOS SONOROS (SFX)                   */}
      {/* ========================================================================= */}
      <div className="bg-[#121824] rounded-2xl border border-[#2a3449] p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Header do Deck SFX */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Soundboard de Efeitos Sonoros (SFX)
              </h3>
              <p className="text-[11px] text-amber-400/90 font-mono">
                Disparos rápidos, feitiços, impactos e monstros
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold bg-[#0a0d14] text-amber-300 border border-[#2a3449] px-2.5 py-1 rounded-xl shadow-inner">
              {selectedSfxShortcutIds.length} atalho(s)
            </span>
          </div>
        </div>

        {/* 1. Área de Atalhos Rápidos da Cena */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Atalhos Rápidos no Cockpit da Cena:
          </label>

          {selectedSfxShortcutIds.length === 0 ? (
            <div className="p-4 bg-[#0a0d14] rounded-xl border border-dashed border-[#2a3449] text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">Nenhum atalho rápido de efeito sonoro configurado.</p>
              <p className="text-[10px] text-slate-600">Clique nos efeitos do soundboard abaixo para fixá-los como atalhos de 1 clique.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#0a0d14] rounded-xl border border-amber-500/30 max-h-36 overflow-y-auto custom-scrollbar">
              {selectedSfxShortcutIds.map((sfxId) => {
                const sfx = allSfxTracks.find((s) => s.id === sfxId);
                const isPlaying = currentPlayingId === sfxId;
                return (
                  <div
                    key={sfxId}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all ${
                      isPlaying
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black animate-pulse'
                        : 'bg-[#161f30] text-amber-300 border-amber-500/40 shadow-sm'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => sfx && handleTogglePlayPreview(sfx)}
                      className="hover:scale-110 transition-transform cursor-pointer"
                      title="Testar Som"
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    </button>
                    <span className="truncate max-w-[140px]">{sfx ? sfx.name : 'Efeito Sonoro'}</span>
                    <button
                      type="button"
                      onClick={() => onRemoveSfxShortcut(sfxId)}
                      className="text-slate-400 hover:text-rose-400 ml-1 font-black cursor-pointer"
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

        {/* 2. Barra de Busca e Filtros por Categoria de SFX */}
        <div className="space-y-2.5 pt-2 border-t border-[#2a3449]">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sfxSearchQuery}
                onChange={(e) => setSfxSearchQuery(e.target.value)}
                placeholder="Buscar efeito sonoro (espada, fogo, porta, rugido)..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200"
              />
            </div>

            <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSfxCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                  sfxCategoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              {favoriteSfxTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSfxCategoryFilter('favorites')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                    sfxCategoryFilter === 'favorites'
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'bg-[#0a0d14] border border-[#2a3449] text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" /> Favoritos
                </button>
              )}
              {sfxCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSfxCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                    sfxCategoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow font-black'
                      : 'bg-[#0a0d14] border border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Soundboard Tátil Interativo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {filteredSfxTracks.length > 0 ? (
              filteredSfxTracks.map((sfx) => {
                const isSelected = selectedSfxShortcutIds.includes(sfx.id);
                const isPlaying = currentPlayingId === sfx.id;
                return (
                  <div
                    key={sfx.id}
                    className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 text-left relative overflow-hidden ${
                      isPlaying
                        ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : isSelected
                        ? 'bg-[#161f30] border-amber-500/50 shadow'
                        : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 rounded-lg bg-[#161c28] border border-[#2a3449]">
                        {getSfxCategoryIcon(sfx.category)}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => handleTogglePlayPreview(sfx)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : 'bg-[#161c28] hover:bg-[#242f44] text-amber-400 border border-amber-500/30'
                        }`}
                        title={isPlaying ? 'Parar' : 'Disparar Efeito'}
                      >
                        {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{sfx.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono truncate uppercase">
                        {sfx.category || 'SFX'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleSfxShortcut(sfx.id)}
                      className={`w-full py-1 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>No Cockpit</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>+ Atalho</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full p-6 text-center text-slate-500 text-xs italic">
                Nenhum efeito sonoro encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
