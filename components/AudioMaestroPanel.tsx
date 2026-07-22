'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, Heart, Trash2, Upload, Search, Music, Radio, Volume2
} from 'lucide-react';
import { useCampaign } from '@/context/CampaignContext';
import { useAudio } from '@/context/AudioContext';
import { storageService } from '@/lib/services/storageService';
import { supabase, isValidUuid } from '@/lib/supabase';
import { BGM_TRACKS, SFX_BUTTONS } from '@/lib/srd-data';

export const AudioMaestroPanel: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const campaignId = activeCampaign?.id;
  const { playBgm, pauseBgm, activeBgm, isPlayingBgm, playSfx } = useAudio();

  const [customAudios, setCustomAudios] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'uploads'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'bgm' | 'sfx'>('all');
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
    const { data, error } = await supabase
      .from('campaign_audio_assets')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (data) setCustomAudios(data);
  };

  const loadFavorites = async () => {
    if (!campaignId || !isValidUuid(campaignId)) return;
    const { data, error } = await supabase
      .from('campaign_audio_favorites')
      .select('audio_id')
      .eq('campaign_id', campaignId);

    if (data) setFavorites(data.map((f: any) => f.audio_id));
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !campaignId) return;

    // Validações: Apenas MP3 e máximo de 15MB
    if (file.type !== 'audio/mpeg' && !file.name.endsWith('.mp3')) {
      setUploadError('Apenas arquivos MP3 são suportados.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite de 15MB.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 1. Upload para o Supabase Storage (pasta audio)
      const url = await storageService.uploadAsset(file, 'audio');

      // 2. Salvar no banco
      const isBgm = file.name.toLowerCase().includes('bgm') || file.size > 2 * 1024 * 1024;
      const audioType = isBgm ? 'bgm' : 'sfx';

      const { data, error } = await supabase
        .from('campaign_audio_assets')
        .insert({
          campaign_id: campaignId,
          name: file.name.replace('.mp3', ''),
          url: url,
          type: audioType,
          category: isBgm ? 'custom' : 'environment',
          is_loop: isBgm
        })
        .select();

      if (error) throw error;
      
      setCustomAudios([data[0], ...customAudios]);
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao realizar upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAudio = async (id: string) => {
    if (!confirm('Deseja excluir este áudio permanentemente?')) return;
    
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
      audio.volume = 0.5;
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
    type: a.type as 'bgm' | 'sfx',
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
            Gerencie e ouça as trilhas sonoras BGM e efeitos SFX da sua mesa. Faça upload de áudios MP3 para sua narração.
          </p>
        </div>

        {/* Upload Audio Area */}
        <div className="flex flex-col items-end gap-1.5">
          <label className={`px-4 py-2 rounded-md text-xs font-bold flex items-center gap-2 cursor-pointer transition-all bg-cyan-600 hover:bg-cyan-500 text-slate-950 shadow-md ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Enviando MP3...' : 'Fazer Upload (MP3)'}</span>
            <input 
              type="file" 
              accept=".mp3" 
              className="hidden" 
              onChange={handleFileUpload} 
              disabled={isUploading} 
            />
          </label>
          {uploadError && <span className="text-[10px] text-rose-400 font-bold">{uploadError}</span>}
        </div>
      </div>

      {/* Control Filters Bar */}
      <div className="p-4 bg-[#0f1423] border-b border-[#2a3449] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-[#0a0d14] border border-[#2a3449] p-0.5 rounded-lg">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-[#1e293b] text-slate-200 shadow-inner' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Tudo
          </button>
          <button 
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${activeTab === 'favorites' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Favoritos
          </button>
          <button 
            onClick={() => setActiveTab('uploads')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'uploads' ? 'bg-[#1e293b] text-slate-200' : 'text-slate-400 hover:text-slate-200'}`}
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
            className="bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="all">Tipos: Todos</option>
            <option value="bgm">BGM (Música)</option>
            <option value="sfx">SFX (Efeito)</option>
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

              return (
                <div 
                  key={track.id} 
                  className={`p-4 bg-[#121824] border rounded-xl flex items-center justify-between gap-3 shadow-md hover:scale-[1.01] hover:border-slate-700 transition-all ${
                    isCurrentBgm && isPlayingBgm ? 'border-pink-500/50 bg-[#161d2d]' : 'border-[#2a3449]'
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
                        } else {
                          playSfx(track.url);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                        isPlaying
                          ? 'bg-pink-600 text-slate-950 font-bold'
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
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded font-mono ${
                          track.type === 'bgm' ? 'bg-pink-900/30 text-pink-300' : 'bg-amber-900/30 text-amber-300'
                        }`}>
                          {track.type}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize truncate font-mono">
                          {track.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Preview Button for BGM */}
                    {track.type === 'bgm' && (
                      <button
                        onClick={() => togglePreview(track.id, track.url)}
                        title="Ouvir localmente (Preview)"
                        className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-200 ${previewingId === track.id ? 'bg-cyan-500/20 text-cyan-400' : ''}`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={() => handleToggleFavorite(track.id, track.isCustom)}
                      className={`p-1.5 rounded-lg transition-all ${
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
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
    </div>
  );
};
