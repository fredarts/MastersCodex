'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Heart, 
  Trash2, 
  Upload, 
  Search, 
  Music, 
  Radio, 
  Volume2, 
  PlusCircle, 
  CheckCircle2, 
  Mic, 
  Sparkles,
  X,
  FileAudio
} from 'lucide-react';
import { useCampaign } from '@/context/CampaignContext';
import { useAudio } from '@/context/AudioContext';
import { useSession } from '@/lib/hooks/useSession';
import { storageService } from '@/lib/services/storageService';
import { supabase, isValidUuid } from '@/lib/supabase';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';
import { useCustomDialog } from '@/context/CustomDialogContext';

export const AudioMaestroPanel: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id;
  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();
  const { activeScene, updateScene } = useSession();
  const { showConfirm } = useCustomDialog();

  const [customAudios, setCustomAudios] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'uploads'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bgm' | 'narration' | 'sfx'>('all');
  
  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<'bgm' | 'narration' | 'sfx'>('narration');
  const [uploadCategory, setUploadCategory] = useState('narracao');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Player de preview local para itens individuais no painel
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadCustomAudios();
      loadFavorites();
    }
    return () => {
      if (previewAudio) previewAudio.pause();
    };
  }, [campaignId]);

  const loadCustomAudios = async () => {
    if (!campaignId || !isValidUuid(campaignId)) return;
    const { data } = await supabase
      .from('campaign_audio_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (data) setCustomAudios(data);
  };

  const loadFavorites = async () => {
    if (!campaignId || !isValidUuid(campaignId)) return;
    const { data } = await supabase
      .from('campaign_audio_favorites')
      .select('audio_id')
      .eq('campaign_id', campaignId);

    if (data) setFavorites(data.map((f: any) => f.audio_id));
  };

  const handleToggleSceneTrack = async (track: any) => {
    if (!activeScene) return;
    
    if (track.type === 'bgm') {
      const current = activeScene.bgmTracks || [];
      const updated = current.includes(track.id)
        ? current.filter(id => id !== track.id)
        : [...current, track.id];
      await updateScene({ ...activeScene, bgmTracks: updated });
    } else if (track.type === 'narration') {
      // Toggle narration into activeScene
      if (activeScene.npcAudioUrl === track.url) {
        await updateScene({ ...activeScene, npcAudioUrl: undefined, npcName: undefined });
      } else {
        await updateScene({ ...activeScene, npcAudioUrl: track.url, npcName: track.name });
      }
    } else {
      const current = activeScene.sfxShortcuts || [];
      const updated = current.includes(track.id)
        ? current.filter(id => id !== track.id)
        : [...current, track.id];
      await updateScene({ ...activeScene, sfxShortcuts: updated });
    }
  };

  const handleToggleFavorite = async (audioId: string, isCustom: boolean) => {
    if (!campaignId) return;
    const isFav = favorites.includes(audioId);

    try {
      if (isFav) {
        await supabase
          .from('campaign_audio_favorites')
          .delete()
          .eq('campaign_id', campaignId)
          .eq('audio_id', audioId);
        setFavorites(favorites.filter(id => id !== audioId));
      } else {
        await supabase
          .from('campaign_audio_favorites')
          .insert({ campaign_id: campaignId, audio_id: audioId, is_custom: isCustom });
        setFavorites([...favorites, audioId]);
      }
    } catch (err) {
      console.error('Erro ao favoritar áudio:', err);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
      setUploadError('Apenas arquivos MP3 são suportados.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite de 15MB.');
      return;
    }

    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    setUploadError(null);
  };

  const handleExecuteUpload = async () => {
    if (!uploadFile || !campaignId) {
      setUploadError('Selecione um arquivo MP3 para enviar.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Upload para o Supabase Storage
      const url = await storageService.uploadAsset(uploadFile, 'audio');

      // 2. Salvar no banco com tag e categoria
      const isLoop = uploadType === 'bgm';

      const { data, error } = await supabase
        .from('campaign_audio_assets')
        .insert({
          campaign_id: campaignId,
          name: uploadName || uploadFile.name.replace('.mp3', ''),
          url: url,
          type: uploadType,
          category: uploadCategory || (uploadType === 'narration' ? 'narracao' : uploadType === 'bgm' ? 'exploracao' : 'environment'),
          is_loop: isLoop,
          icon_name: uploadType === 'narration' ? 'Mic' : uploadType === 'bgm' ? 'Radio' : 'Sparkles'
        })
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        setCustomAudios([data[0], ...customAudios]);
      }

      // Reset modal
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadName('');
    } catch (err: any) {
      if (err?.message?.includes('campaign_audio_assets_type_check')) {
        setUploadError('O banco de dados precisa aceitar o tipo "narration". Execute o script SQL no Supabase SQL Editor: ALTER TABLE public.campaign_audio_assets DROP CONSTRAINT IF EXISTS campaign_audio_assets_type_check; ALTER TABLE public.campaign_audio_assets ADD CONSTRAINT campaign_audio_assets_type_check CHECK (type IN (\'bgm\', \'sfx\', \'narration\'));');
      } else {
        setUploadError(err.message || 'Erro ao realizar upload.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAudio = async (id: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Áudio',
      message: 'Deseja excluir este áudio permanentemente?',
      confirmText: 'Excluir Áudio',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;
    
    const { error } = await supabase
      .from('campaign_audio_assets')
      .delete()
      .eq('id', id);

    if (!error) {
      setCustomAudios(customAudios.filter(a => a.id !== id));
      setFavorites(favorites.filter(favId => favId !== id));
    }
  };

  const togglePreview = (id: string, url: string) => {
    if (previewingId === id) {
      previewAudio?.pause();
      setPreviewingId(null);
      setPreviewAudio(null);
    } else {
      if (previewAudio) previewAudio.pause();
      const audio = new Audio(url);
      audio.volume = 0.6;
      audio.play().catch(() => {});
      setPreviewAudio(audio);
      setPreviewingId(id);
      audio.onended = () => {
        setPreviewingId(null);
        setPreviewAudio(null);
      };
    }
  };

  // Unificar trilhas padrão SRD com as enviadas pelo mestre
  const srdTracksFormatted = [
    ...BGM_TRACKS.map(t => ({ ...t, type: 'bgm' as const, isCustom: false })),
    ...SFX_BUTTONS.map(s => ({ ...s, type: 'sfx' as const, isLoop: false, isCustom: false }))
  ];

  const customTracksFormatted = customAudios.map(a => ({
    id: a.id,
    name: a.name,
    url: a.url,
    type: a.type as 'bgm' | 'sfx' | 'narration',
    category: a.category,
    isLoop: a.is_loop,
    iconName: a.icon_name,
    isCustom: true
  }));

  const allTracks = [...srdTracksFormatted, ...customTracksFormatted];

  // Aplicar filtros e pesquisa
  const filteredTracks = allTracks.filter(track => {
    const matchesSearch = track.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || track.type === filterType;
    
    if (activeTab === 'favorites') {
      return matchesSearch && matchesType && favorites.includes(track.id);
    }
    if (activeTab === 'uploads') {
      return matchesSearch && matchesType && track.isCustom;
    }
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-hidden">
      {/* Top Banner and Tabs */}
      <div className="p-6 border-b border-[#2a3449] bg-[#0c101b] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Radio className="w-5 h-5 text-pink-500 animate-pulse" />
            Audio Maestro Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie e ouça as trilhas sonoras BGM, efeitos SFX e narrações com auto-ducking da sua mesa.
          </p>
        </div>

        {/* Upload Audio Trigger Button */}
        <div>
          <button
            onClick={() => {
              setUploadError(null);
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md hover:scale-105"
          >
            <Upload className="w-4 h-4" />
            <span>Fazer Upload (MP3)</span>
          </button>
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="p-4 bg-[#0f1423] border-b border-[#2a3449] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#0a0d14] border border-[#2a3449] p-0.5 rounded-lg">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'all' ? 'bg-[#1e293b] text-slate-200 shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tudo
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${activeTab === 'favorites' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Favoritos
          </button>
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'uploads' ? 'bg-[#1e293b] text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Uploads do Mestre
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar áudio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0a0d14] border border-[#2a3449] rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-44 md:w-56"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-1.5 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Tipos: Todos</option>
            <option value="bgm">📻 BGM (Música)</option>
            <option value="narration">🎙️ Narração (Voz)</option>
            <option value="sfx">💥 SFX (Efeito)</option>
          </select>
        </div>
      </div>

      {/* Grid List view */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-[#0a0d14]">
        {filteredTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-[#2a3449] rounded-2xl text-slate-500">
            <Music className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm font-semibold">Nenhum áudio encontrado com estes filtros.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map((track) => {
              const isFav = favorites.includes(track.id);
              const isCurrentBgm = activeBgm?.id === track.id;
              const isPlaying = previewingId === track.id || (isCurrentBgm && isPlayingBgm);
              
              const isAddedToScene = track.type === 'bgm' 
                ? activeScene?.bgmTracks?.includes(track.id)
                : track.type === 'narration'
                  ? activeScene?.npcAudioUrl === track.url
                  : activeScene?.sfxShortcuts?.includes(track.id);

              return (
                <div 
                  key={track.id} 
                  className={`p-4 bg-[#121824] border rounded-xl flex items-center justify-between gap-3 shadow-md hover:scale-[1.01] hover:border-slate-700 transition-all ${
                    isCurrentBgm && isPlayingBgm 
                      ? 'border-pink-500/50 bg-[#161d2d]' 
                      : track.type === 'narration'
                        ? 'border-cyan-500/20 hover:border-cyan-500/50'
                        : 'border-[#2a3449]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Play/Pause Button */}
                    <button
                      onClick={() => {
                        if (track.type === 'bgm') {
                          if (isCurrentBgm && isPlayingBgm) {
                            pauseBgm();
                          } else {
                            playBgm(track as any);
                          }
                        } else if (track.type === 'narration') {
                          togglePreview(track.id, track.url);
                        } else {
                          playSfx(track.url);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                        isPlaying
                          ? track.type === 'narration' ? 'bg-cyan-400 text-slate-950 font-bold animate-pulse' : 'bg-pink-600 text-slate-950 font-bold'
                          : 'bg-[#0a0d14] border border-[#2a3449] text-slate-300 hover:bg-[#1a2233] hover:text-slate-100'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5 fill-current" />
                      )}
                    </button>

                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-200 truncate" title={track.name}>
                        {track.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono flex items-center gap-1 ${
                          track.type === 'bgm' 
                            ? 'bg-pink-900/30 text-pink-300 border border-pink-500/30' 
                            : track.type === 'narration'
                              ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 font-bold'
                              : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                        }`}>
                          {track.type === 'narration' && <Mic className="w-2.5 h-2.5" />}
                          {track.type === 'bgm' && <Radio className="w-2.5 h-2.5" />}
                          {track.type === 'sfx' && <Sparkles className="w-2.5 h-2.5" />}
                          {track.type === 'narration' ? 'NARRAÇÃO' : track.type}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize truncate font-mono">
                          {track.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Preview Button for BGM / Narration */}
                    {(track.type === 'bgm' || track.type === 'narration') && (
                      <button
                        onClick={() => togglePreview(track.id, track.url)}
                        title="Ouvir localmente (Preview)"
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer ${previewingId === track.id ? 'bg-cyan-500/20 text-cyan-400' : ''}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Add to Scene/AudioBar Button */}
                    <button
                      onClick={() => handleToggleSceneTrack(track)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isAddedToScene 
                          ? 'text-emerald-500 hover:text-emerald-400 scale-105' 
                          : 'text-slate-400 hover:text-emerald-400'
                      }`}
                      title={isAddedToScene ? 'Remover da Cena / Cockpit' : 'Adicionar à Cena / Cockpit'}
                    >
                      {isAddedToScene ? <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" /> : <PlusCircle className="w-4 h-4" />}
                    </button>

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleToggleFavorite(track.id, track.isCustom)}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isFav 
                          ? 'text-pink-500 hover:text-pink-400 scale-105' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title={isFav ? 'Remover dos Favoritos' : 'Salvar como Favorito'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                    </button>

                    {/* Delete button */}
                    {track.isCustom && (
                      <button
                        onClick={() => handleDeleteAudio(track.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Excluir arquivo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE UPLOAD DE ÁUDIO (COM SELEÇÃO DE TAG: NARRAÇÃO / BGM / SFX)       */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121824] border border-[#2a3449] rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#2a3449]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">Upload de Áudio</h3>
                  <p className="text-xs text-slate-400">Adicione narrações, trilhas ou efeitos sonoros à campanha.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-4">
              {/* 1. File Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Arquivo MP3 (Máx 15MB)
                </label>
                <label className="border-2 border-dashed border-[#2a3449] hover:border-cyan-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#0a0d14]/60">
                  <FileAudio className="w-8 h-8 text-cyan-400 mb-2 opacity-80" />
                  <span className="text-xs font-bold text-slate-200">
                    {uploadFile ? uploadFile.name : 'Clique para selecionar o arquivo MP3'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Formatos: .mp3'}
                  </span>
                  <input 
                    type="file" 
                    accept=".mp3" 
                    className="hidden" 
                    onChange={handleFileSelected} 
                  />
                </label>
              </div>

              {/* 2. Audio Name */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome do Áudio
                </label>
                <input 
                  type="text"
                  placeholder="Ex: Prólogo da Masmorra / Fala do Guardião"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* 3. Audio Tag / Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tipo / Tag do Áudio
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('narration');
                      setUploadCategory('narracao');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      uploadType === 'narration'
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-md shadow-cyan-500/20'
                        : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span className="text-[11px]">Narração</span>
                    <span className="text-[8px] text-cyan-400/70 font-mono">Auto-Ducking</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('bgm');
                      setUploadCategory('exploracao');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      uploadType === 'bgm'
                        ? 'bg-pink-500/20 border-pink-500 text-pink-300 font-bold shadow-md shadow-pink-500/20'
                        : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Radio className="w-4 h-4 text-pink-400" />
                    <span className="text-[11px]">BGM Trilha</span>
                    <span className="text-[8px] text-pink-400/70 font-mono">Loop Contínuo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUploadType('sfx');
                      setUploadCategory('combat');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                      uploadType === 'sfx'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/20'
                        : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[11px]">Efeito SFX</span>
                    <span className="text-[8px] text-amber-400/70 font-mono">Disparo Rápido</span>
                  </button>
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  {uploadError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#2a3449]">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={isUploading || !uploadFile}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <span>Salvar Áudio</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
