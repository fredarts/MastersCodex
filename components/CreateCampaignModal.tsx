'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  Globe, 
  BookOpen, 
  Image as ImageIcon, 
  Sliders, 
  Wand2, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Flame, 
  Compass, 
  Scroll, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { World, WorldEntity } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { storageService } from '@/lib/services/storageService';
import { worldService } from '@/lib/services/worldService';
import { CampaignAiNarrativeGeneratorModal } from '@/components/CampaignAiNarrativeGeneratorModal';
import { toast } from 'sonner';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWorldForCampaign?: World | null;
}

type TabType = 'details' | 'cover' | 'settings';

const ART_PRESETS = [
  { id: 'epic-fantasy', label: 'Alta Fantasia Épica', promptSuffix: 'epic high fantasy concept art, dramatic lighting, cinematic 16:9 banner, detailed fantasy oil painting, masterwork' },
  { id: 'dark-fantasy', label: 'Dark Fantasy & Sombrio', promptSuffix: 'dark fantasy gothic atmosphere, moody fog, shadows, grimdark cinematic painting, ultra realistic, masterpiece' },
  { id: 'renaissance-oil', label: 'Óleo Renascentista', promptSuffix: 'renaissance classic oil painting style, warm tones, brushstrokes, museum quality historical fantasy art' },
  { id: 'watercolor-lore', label: 'Aquarela de Grimório', promptSuffix: 'vintage fantasy parchment watercolor illustration, delicate colors, adventure book cover style' },
  { id: 'anime-concept', label: 'Concept Art Estilizado', promptSuffix: 'stylized vivid fantasy anime background art, vibrant colors, expansive scenic vista, cinematic' },
];

const TONE_PRESETS = [
  { id: 'heroic', label: 'Heroico & Inspirador', icon: Crown, desc: 'Clássica jornada do herói contra forças do mal.' },
  { id: 'dark', label: 'Dark Fantasy & Horror', icon: Flame, desc: 'Mundo impiedoso, decisões difíceis e perigo constante.' },
  { id: 'mystery', label: 'Mistério & Investigação', icon: Compass, desc: 'Foco em enigmas, conspirações e exploração de segredos.' },
  { id: 'gritty', label: 'Sobrevivência & Realismo', icon: ShieldAlert, desc: 'Recursos escassos, combate letal e táticas apuradas.' },
];

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  selectedWorldForCampaign,
}) => {
  const { createCampaign } = useCampaign();
  const { userWorlds, activeWorld, worldEntities: activeWorldEntities } = useWorld();
  const { settings } = useUserSettings();

  // Tab State
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // Form Fields
  const [worldId, setWorldId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [adventureHook, setAdventureHook] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [themeTone, setThemeTone] = useState<string>('heroic');
  const [startingLevel, setStartingLevel] = useState<number>(1);
  const [masterNotes, setMasterNotes] = useState('');

  // World Entities State
  const [currentWorldEntities, setCurrentWorldEntities] = useState<WorldEntity[]>([]);

  // AI Modal & Generation States
  const [isAiNarrativeModalOpen, setIsAiNarrativeModalOpen] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverPrompt, setCoverPrompt] = useState('');
  const [selectedArtPreset, setSelectedArtPreset] = useState(ART_PRESETS[0].id);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      setAiError(null);
      let initialWorldId = '';
      if (selectedWorldForCampaign) {
        initialWorldId = selectedWorldForCampaign.id;
      } else if (activeWorld) {
        initialWorldId = activeWorld.id;
      } else if (userWorlds.length > 0) {
        initialWorldId = userWorlds[0].id;
      }
      setWorldId(initialWorldId);
    }
  }, [isOpen, selectedWorldForCampaign, activeWorld, userWorlds]);

  // Load entities whenever worldId changes
  useEffect(() => {
    if (!worldId) {
      setCurrentWorldEntities([]);
      return;
    }

    if (activeWorld && activeWorld.id === worldId) {
      setCurrentWorldEntities(activeWorldEntities);
    } else {
      worldService.fetchWorldEntities(worldId).then((res) => {
        if (res.ok) {
          setCurrentWorldEntities(res.value);
        } else {
          setCurrentWorldEntities([]);
        }
      });
    }
  }, [worldId, activeWorld, activeWorldEntities]);

  if (!isOpen) return null;

  const selectedWorld = userWorlds.find((w) => w.id === worldId);

  // Handle AI Narrative Generated callback
  const handleApplyAiNarrative = (data: {
    suggestedTitle?: string;
    synopsis: string;
    hook: string;
    suggestedTone?: string;
    coverPrompt?: string;
  }) => {
    if (data.suggestedTitle) setTitle(data.suggestedTitle);
    if (data.synopsis) setDescription(data.synopsis);
    if (data.hook) setAdventureHook(data.hook);
    if (data.coverPrompt) setCoverPrompt(data.coverPrompt);
    if (data.suggestedTone) setThemeTone(data.suggestedTone);
    toast.success('Título, sinopse e contexto integrados à campanha!');
  };

  // Generate 16:9 Cover Image with AI
  const handleGenerateCoverAi = async () => {
    setIsGeneratingCover(true);
    setAiError(null);
    try {
      const preset = ART_PRESETS.find((p) => p.id === selectedArtPreset) || ART_PRESETS[0];
      const basePrompt = coverPrompt.trim() 
        ? coverPrompt.trim() 
        : `Epic fantasy adventure landscape for a campaign titled "${title || 'Chronicles of Adventure'}" in the world of ${selectedWorld?.title || 'Valor'}.`;
      
      const fullPrompt = `${basePrompt}, ${preset.promptSuffix}`;

      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio: '16:9',
          userSettings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar imagem de capa.');

      let finalUrl = `data:image/jpeg;base64,${data.base64}`;

      // Upload to Supabase Storage if available
      if (isSupabaseConfigured()) {
        try {
          const imgRes = await fetch(finalUrl);
          const blob = await imgRes.blob();
          const file = new File([blob], `campaign-cover-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'scenes');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Falha no upload para o storage, usando formato base64.', uploadErr);
        }
      }

      setCoverImageUrl(finalUrl);
      toast.success('Arte de capa panorâmica (16:9) forjada com sucesso!');
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Erro ao gerar imagem de capa com IA.');
      toast.error(err.message || 'Erro ao gerar capa.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setActiveTab('details');
      toast.error('Informe o título da campanha.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build combined description if adventure hook is present
      let fullDesc = description.trim();
      if (adventureHook.trim()) {
        fullDesc = `${fullDesc}\n\n**Gancho Inicial:** ${adventureHook.trim()}`;
      }

      await createCampaign(
        title.trim(),
        worldId || undefined,
        fullDesc || undefined,
        coverImageUrl || undefined,
        themeTone || undefined
      );

      toast.success('Mesa de RPG criada com sucesso!');
      handleResetAndClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao criar campanha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setTitle('');
    setDescription('');
    setAdventureHook('');
    setCoverImageUrl('');
    setCoverPrompt('');
    setThemeTone('heroic');
    setStartingLevel(1);
    setMasterNotes('');
    setActiveTab('details');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#111622] border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header (Inspired by WorldEntityModal) */}
        <div className="flex items-center justify-between border-b border-[#252f44] px-6 py-4 bg-[#161d2d]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-700/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Forjar Nova Campanha de RPG
              </h3>
              <p className="text-xs text-slate-400">
                {selectedWorld ? `Mundo Base: ${selectedWorld.title} (${selectedWorld.genre})` : 'Campanha Avulsa / One-Shot'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose} 
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#252f44] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation (Inspired by WorldEntityModal) */}
        <div className="flex items-center border-b border-[#252f44] bg-[#0c1019] px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'details'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Detalhes & Sinopse IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 relative ${
              activeTab === 'cover'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Capa Panorâmica (16:9)</span>
            {coverImageUrl && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block ml-0.5 shadow-sm"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 ${
              activeTab === 'settings'
                ? 'text-amber-400 border-amber-500 bg-[#161d2d]'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#131826]'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>3. Tom & Diretrizes</span>
          </button>
        </div>

        {/* Modal Body - Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#0f1420]/60">
          
          {aiError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{aiError}</span>
            </div>
          )}

          {/* TAB 1: DETALHES & SINOPSE */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fade-in">
              {/* World Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    Mundo Base (Worldbuilding):
                  </span>
                  <span className="text-[11px] text-slate-500">Herda lore, facções e mapas do cenário</span>
                </label>
                <div className="relative flex items-center">
                  <select
                    value={worldId}
                    onChange={(e) => setWorldId(e.target.value)}
                    className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 transition-colors"
                  >
                    <option value="">Nenhum (Campanha Avulsa / One-Shot)</option>
                    {userWorlds.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} — [{w.genre}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Título da Mesa / Campanha: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Queda dos Reis Dragões, Maldição de Ravenhurst..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-bold tracking-wide"
                />
              </div>

              {/* AI Assisted Description Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Scroll className="w-3.5 h-3.5 text-amber-400" />
                    Sinopse / Diário de Abertura:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAiNarrativeModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/20 to-amber-600/30 hover:from-amber-500/30 hover:to-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg transition-all shadow-sm group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                    <span>Escrever / Correlacionar Lore com IA</span>
                    {currentWorldEntities.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-500/30 text-[10px] text-amber-200 rounded-full font-mono">
                        {currentWorldEntities.length} entidades
                      </span>
                    )}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Digite sua ideia inicial ou clique em 'Escrever com IA' para expandir automaticamente a sinopse..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl p-3.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none font-serif leading-relaxed"
                ></textarea>
              </div>

              {/* Adventure Hook */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400/80" />
                  Gancho de Aventura Inicial (Call to Action / Sessão 0):
                </label>
                <input
                  type="text"
                  value={adventureHook}
                  onChange={(e) => setAdventureHook(e.target.value)}
                  placeholder="Ex: Um mensageiro ferido entrega um mapa misterioso na taverna durante uma noite chuvosa..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70 font-sans"
                />
              </div>
            </div>
          )}

          {/* TAB 2: CAPA PANORÂMICA (16:9) */}
          {activeTab === 'cover' && (
            <div className="space-y-4 animate-fade-in">
              {/* 16:9 Cover Banner Preview Box */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-amber-500/30 bg-[#080b12] shadow-xl flex items-center justify-center group">
                {coverImageUrl ? (
                  <>
                    <img 
                      src={coverImageUrl} 
                      alt="Capa da Campanha" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                      <div>
                        <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold rounded uppercase tracking-wider backdrop-blur-sm">
                          {selectedWorld?.genre || 'Campanha'}
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-1 drop-shadow-md">
                          {title || 'Título da Campanha'}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 backdrop-blur-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-300">Nenhuma Capa Panorâmica Selecionada</p>
                    <p className="text-[11px] text-slate-500 max-w-sm">
                      Gere uma arte 16:9 épica com IA abaixo ou cole uma URL externa para ilustrar o cabeçalho da sua mesa.
                    </p>
                  </div>
                )}
              </div>

              {/* AI Image Generation Panel */}
              <div className="bg-[#141a27] border border-[#252f44] p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-amber-400" />
                    Forjar Capa Panorâmica com IA (16:9 Widescreen)
                  </span>
                  <span className="text-[10px] text-slate-500">Imagen 3 / Gemini Pro Vision</span>
                </div>

                {/* Art Style Presets */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Estilo Artístico:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ART_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedArtPreset(preset.id)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${
                          selectedArtPreset === preset.id
                            ? 'bg-amber-500 text-slate-950 font-bold shadow'
                            : 'bg-[#0c1019] text-slate-400 border border-[#252f44] hover:text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Prompt Customizado da Cena / Capa (Opcional):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={coverPrompt}
                      onChange={(e) => setCoverPrompt(e.target.value)}
                      placeholder="Ex: Um castelo em ruínas sob céu tempestuoso com guerreiros em vigília..."
                      className="flex-1 bg-[#0a0e17] border border-[#252f44] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCoverAi}
                      disabled={isGeneratingCover}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGeneratingCover ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Forjando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gerar Arte 16:9</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Direct Image URL input */}
                <div className="pt-2 border-t border-[#252f44]/80 flex items-center gap-2">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="Ou cole a URL direta de uma imagem externa..."
                    className="flex-1 bg-[#0a0e17] border border-[#252f44] rounded-lg px-3 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOM & DIRETRIZES */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              {/* Tone Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Tom Narrativo da Aventura:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TONE_PRESETS.map((t) => {
                    const Icon = t.icon;
                    const isSelected = themeTone === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setThemeTone(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500 text-amber-200 shadow-md'
                            : 'bg-[#141a27] border-[#252f44] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-[#0a0e17] text-slate-400'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{t.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Starting Level */}
              <div className="bg-[#141a27] border border-[#252f44] p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Nível Inicial Recomendado dos Personagens</span>
                  <span className="text-[11px] text-slate-500">Defina o tier de poder para a entrada dos heróis</span>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 3, 5, 10].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setStartingLevel(lvl)}
                      className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${
                        startingLevel === lvl
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#0a0e17] text-slate-400 border border-[#252f44] hover:text-slate-200'
                      }`}
                    >
                      Nv. {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret Master Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Notas Privadas do Mestre (Segredos / Plot Twists Iniciais):
                </label>
                <textarea
                  rows={2}
                  value={masterNotes}
                  onChange={(e) => setMasterNotes(e.target.value)}
                  placeholder="Anotações confidenciais que apenas você poderá ver no painel do Mestre..."
                  className="w-full bg-[#0a0e17] border border-[#252f44] rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 resize-none font-sans"
                ></textarea>
              </div>
            </div>
          )}

        </div>

        {/* Footer with Step Navigation & Submit */}
        <div className="flex items-center justify-between border-t border-[#252f44] px-6 py-4 bg-[#161d2d]/90">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 bg-[#0c1019] hover:bg-[#1f2738] text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {activeTab !== 'details' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'settings') setActiveTab('cover');
                  else if (activeTab === 'cover') setActiveTab('details');
                }}
                className="px-3 py-2 bg-[#1b2336] hover:bg-[#252f44] text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            {activeTab !== 'settings' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'details') setActiveTab('cover');
                  else if (activeTab === 'cover') setActiveTab('settings');
                }}
                className="px-4 py-2 bg-[#252f44] hover:bg-[#2f3b55] text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <span>Avançar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Iniciando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Iniciar Mesa de Jogo</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Robust AI Narrative Generator Modal with World Lore & Entities Correlation */}
      <CampaignAiNarrativeGeneratorModal
        isOpen={isAiNarrativeModalOpen}
        onClose={() => setIsAiNarrativeModalOpen(false)}
        onApply={handleApplyAiNarrative}
        selectedWorld={selectedWorld || null}
        worldEntities={currentWorldEntities}
        initialTitle={title}
        initialTone={themeTone}
      />
    </div>
  );
};
