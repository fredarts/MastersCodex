'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  Crown,
  Globe,
  Scroll,
  Compass,
  Upload,
  Check,
  AlertCircle,
  Trash2,
  ShieldAlert,
  Flame,
  BookOpen,
  Sliders,
  Layers,
} from 'lucide-react';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { useWorld } from '@/lib/hooks/useWorld';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { UserCampaign, WorldEntity } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { storageService } from '@/lib/services/storageService';
import { CampaignAiNarrativeGeneratorModal } from '@/components/CampaignAiNarrativeGeneratorModal';
import { toast } from 'sonner';

interface EditCampaignDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: UserCampaign;
}

export const ART_STYLE_PRESETS = [
  { 
    id: 'epic-fantasy', 
    label: 'Alta Fantasia Épica', 
    promptSuffix: 'epic high fantasy concept art, dramatic lighting, cinematic 16:9 banner, detailed fantasy oil painting, masterwork, atmospheric glowing colors' 
  },
  { 
    id: 'dark-fantasy', 
    label: 'Dark Fantasy & Sombrio', 
    promptSuffix: 'dark fantasy gothic atmosphere, moody fog, shadows, grimdark cinematic painting, ultra realistic, dramatic contrast, masterpiece' 
  },
  { 
    id: 'renaissance-oil', 
    label: 'Óleo Renascentista Clássico', 
    promptSuffix: 'renaissance classic oil painting style, warm tones, textured brushstrokes, museum quality historical fantasy art, fine details' 
  },
  { 
    id: 'watercolor-lore', 
    label: 'Aquarela de Grimório Antigo', 
    promptSuffix: 'vintage fantasy parchment watercolor illustration, delicate colors, adventure book cover style, hand-drawn ink and wash' 
  },
  { 
    id: 'anime-concept', 
    label: 'Concept Art Estilizado / Anime Fantasy', 
    promptSuffix: 'stylized vivid fantasy anime background art, vibrant colors, expansive scenic vista, cinematic lighting, Makoto Shinkai aesthetic' 
  },
  { 
    id: 'dnd-handbook', 
    label: 'Ilustração de Livro Oficial D&D 5e', 
    promptSuffix: 'official Dungeons and Dragons sourcebook art style, evocative tabletop RPG illustration, detailed fantasy heroes and creatures, heroic composition' 
  },
  { 
    id: 'cinematic-photoreal', 
    label: 'Cinemático Ultra-Realista / Live Action', 
    promptSuffix: 'cinematic 8k film still, dramatic volumetric lighting, unreal engine 5 render style, photorealistic fantasy environment, epic scale' 
  },
];

const TONE_OPTIONS = [
  { id: 'heroic', label: 'Heroico & Inspirador', icon: Crown, desc: 'Clássica jornada do herói contra forças do mal.' },
  { id: 'dark', label: 'Dark Fantasy & Horror', icon: Flame, desc: 'Mundo impiedoso, decisões difíceis e perigo constante.' },
  { id: 'mystery', label: 'Mistério & Investigação', icon: Compass, desc: 'Foco em enigmas, conspirações e segredos ocultos.' },
  { id: 'gritty', label: 'Sobrevivência & Realismo', icon: ShieldAlert, desc: 'Recursos escassos, combate letal e sobrevivência árdua.' },
];

export const EditCampaignDetailsModal: React.FC<EditCampaignDetailsModalProps> = ({
  isOpen,
  onClose,
  campaign,
}) => {
  const { updateCampaign } = useCampaign();
  const { userWorlds, activeWorld, worldEntities: activeWorldEntities } = useWorld();
  const { settings } = useUserSettings();

  const [activeTab, setActiveTab] = useState<'details' | 'cover'>('details');

  // Form States
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [adventureHook, setAdventureHook] = useState('');
  const [themeTone, setThemeTone] = useState<string>('heroic');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Image Generation States
  const [coverPrompt, setCoverPrompt] = useState('');
  const [selectedArtPreset, setSelectedArtPreset] = useState<string>(ART_STYLE_PRESETS[0].id);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [aiImageError, setAiImageError] = useState<string | null>(null);

  // Text AI Generator States
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState(false);
  const [isAiNarrativeModalOpen, setIsAiNarrativeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize fields on open
  useEffect(() => {
    if (isOpen && campaign) {
      setTitle(campaign.title || '');
      setCoverImageUrl(campaign.coverImageUrl || '');
      setThemeTone(campaign.themeTone || 'heroic');
      setAiImageError(null);
      setActiveTab('details');

      // Parse synopsis and hook
      const rawDesc = campaign.description || '';
      let parsedSynopsis = rawDesc;
      let parsedHook = '';

      if (rawDesc.includes('**Gancho Inicial:**')) {
        const parts = rawDesc.split('**Gancho Inicial:**');
        parsedSynopsis = parts[0].trim();
        parsedHook = parts[1].trim();
      } else if (rawDesc.includes('Gancho Inicial:')) {
        const parts = rawDesc.split('Gancho Inicial:');
        parsedSynopsis = parts[0].trim();
        parsedHook = parts[1].trim();
      }

      setSynopsis(parsedSynopsis);
      setAdventureHook(parsedHook);

      // Pre-fill cover prompt if empty
      if (!coverPrompt) {
        setCoverPrompt(
          parsedSynopsis.slice(0, 160) ||
            `Epic fantasy landscape banner for "${campaign.title}" adventure in the realm of ${activeWorld?.title || 'Valor'}`
        );
      }
    }
  }, [isOpen, campaign, activeWorld]);

  if (!isOpen) return null;

  const currentWorld = userWorlds.find((w) => w.id === campaign.worldId) || activeWorld;

  // Handle Quick AI Narrative Generation
  const handleQuickGenerateNarrative = async () => {
    setIsGeneratingNarrative(true);
    try {
      const res = await fetch('/api/ai/generate-campaign-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || campaign.title,
          worldTitle: currentWorld?.title,
          worldGenre: currentWorld?.genre,
          worldDesc: currentWorld?.description,
          tone: themeTone,
          userIdeas: synopsis.trim() || undefined,
          userSettings: settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar texto da campanha.');

      if (data.suggestedTitle && !title.trim()) setTitle(data.suggestedTitle);
      if (data.synopsis) setSynopsis(data.synopsis);
      if (data.hook) setAdventureHook(data.hook);
      if (data.coverPrompt) setCoverPrompt(data.coverPrompt);
      if (data.suggestedTone) {
        const matchingTone = TONE_OPTIONS.find((t) => t.label.toLowerCase().includes(data.suggestedTone.toLowerCase()) || t.id === data.suggestedTone);
        if (matchingTone) setThemeTone(matchingTone.id);
      }

      toast.success('Narrativa gerada com sucesso pela IA!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao gerar narrativa com IA.');
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  // Handle AI Narrative Modal callback (Deep Entity Selection)
  const handleApplyDeepAiNarrative = (data: {
    suggestedTitle?: string;
    synopsis: string;
    hook: string;
    suggestedTone?: string;
    coverPrompt?: string;
  }) => {
    if (data.suggestedTitle) setTitle(data.suggestedTitle);
    if (data.synopsis) setSynopsis(data.synopsis);
    if (data.hook) setAdventureHook(data.hook);
    if (data.coverPrompt) setCoverPrompt(data.coverPrompt);
    if (data.suggestedTone) {
      const matchingTone = TONE_OPTIONS.find((t) => t.label.toLowerCase().includes(data.suggestedTone!.toLowerCase()) || t.id === data.suggestedTone);
      if (matchingTone) setThemeTone(matchingTone.id);
    }
    toast.success('Narrativa integrada à campanha!');
  };

  // Generate 16:9 Cover Image with AI
  const handleGenerateCoverAi = async () => {
    setIsGeneratingCover(true);
    setAiImageError(null);
    try {
      const preset = ART_STYLE_PRESETS.find((p) => p.id === selectedArtPreset) || ART_STYLE_PRESETS[0];
      const basePrompt = coverPrompt.trim()
        ? coverPrompt.trim()
        : synopsis.trim()
        ? synopsis.trim().slice(0, 200)
        : `Epic fantasy adventure landscape for a campaign titled "${title || campaign.title}" in the world of ${currentWorld?.title || 'Valor'}.`;

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
      setAiImageError(err.message || 'Erro ao gerar imagem de capa com IA.');
      toast.error(err.message || 'Erro ao gerar capa.');
    } finally {
      setIsGeneratingCover(false);
    }
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (isSupabaseConfigured()) {
        const publicUrl = await storageService.uploadAsset(file, 'scenes');
        setCoverImageUrl(publicUrl);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setCoverImageUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
      toast.success('Imagem de capa carregada!');
    } catch (err: any) {
      toast.error('Erro ao carregar arquivo de imagem.');
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
      // Build unified description
      let fullDesc = synopsis.trim();
      if (adventureHook.trim()) {
        fullDesc = `${fullDesc}\n\n**Gancho Inicial:** ${adventureHook.trim()}`;
      }

      await updateCampaign({
        ...campaign,
        title: title.trim(),
        description: fullDesc,
        coverImageUrl: coverImageUrl || undefined,
        themeTone: themeTone || undefined,
      });

      toast.success('Campanha atualizada com sucesso!');
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Falha ao salvar campanha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in select-none">
      <div className="bg-[#111622] border border-amber-500/40 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border-b border-[#2a3449] p-4 sm:p-5 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-100 font-serif">
                  Editar Detalhes & Forja Visual IA
                </h3>
                <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  {campaign.inviteCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Personalize o título, sinopse, gancho narrativo e forje uma capa 16:9 com IA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#1f2738] rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#0d121c] border-b border-[#2a3449] px-4 sm:px-6 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'details'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scroll className="w-4 h-4" />
            <span>1. Título & Sinopse (Texto IA)</span>
          </button>

          <button
            onClick={() => setActiveTab('cover')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'cover'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>2. Capa Panorâmica & Arte IA (16:9)</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-[#0a0d14]">
          
          {/* TAB 1: DETAILS & NARRATIVE */}
          {activeTab === 'details' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Campaign Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Título da Campanha *</span>
                  </label>
                  {currentWorld && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>Mundo: {currentWorld.title}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: A Queda dos Reis Dragões, Sombras de Valíria..."
                  className="w-full text-sm font-bold bg-[#141a27] border border-[#2a3449] focus:border-amber-500/70 text-slate-100 px-3.5 py-2 rounded-xl outline-none shadow-inner"
                />
              </div>

              {/* AI Narrative Assistant Bar */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#182030] to-cyan-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-100">Assistente Narrativo com Inteligência Artificial</div>
                    <div className="text-[10.5px] text-slate-400">Gere sinopse, gancho e sugestão de título integrados à lore.</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleQuickGenerateNarrative}
                    disabled={isGeneratingNarrative}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isGeneratingNarrative ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingNarrative ? 'Gerando Texto...' : '✨ Gerar Rápido com IA'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAiNarrativeModalOpen(true)}
                    className="px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Deep Lore (+Entidades)</span>
                  </button>
                </div>
              </div>

              {/* Synopsis Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Scroll className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sinopse & Diário de Abertura da Mesa</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {synopsis.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Descreva o conflito central da mesa, os mistérios que os heróis enfrentarão e o clima da narrativa..."
                  className="w-full text-xs bg-[#141a27] border border-[#2a3449] focus:border-amber-500/70 text-slate-200 p-3 rounded-xl outline-none resize-none font-serif leading-relaxed"
                />
              </div>

              {/* Adventure Hook (Call to Action / Session 0) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>Gancho Inicial de Aventura (Sessão 0 / Call to Action)</span>
                </label>
                <input
                  type="text"
                  value={adventureHook}
                  onChange={(e) => setAdventureHook(e.target.value)}
                  placeholder="Ex: O grupo é contratado para escoltar uma relíquia misteriosa através da floresta proibida..."
                  className="w-full text-xs bg-[#141a27] border border-[#2a3449] focus:border-amber-500/70 text-slate-200 px-3.5 py-2 rounded-xl outline-none"
                />
              </div>

              {/* Theme Tone Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tom e Atmosfera da Campanha</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TONE_OPTIONS.map((t) => {
                    const Icon = t.icon;
                    const isSelected = themeTone === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setThemeTone(t.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500/80 text-slate-100 shadow-md'
                            : 'bg-[#141a27] border-[#252f44] text-slate-400 hover:border-[#354360]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                            {t.label}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-snug">
                            {t.desc}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: COVER & ART AI */}
          {activeTab === 'cover' && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Cover Live Preview 16:9 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Visualização da Capa Panorâmica (16:9)</span>
                  </label>
                  {coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverImageUrl('')}
                      className="text-[10.5px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover Capa</span>
                    </button>
                  )}
                </div>

                <div className="relative w-full aspect-[16/9] max-h-[220px] rounded-2xl overflow-hidden border border-amber-500/40 bg-black/80 flex items-center justify-center shadow-2xl group">
                  {coverImageUrl ? (
                    <>
                      <img
                        src={coverImageUrl}
                        alt="Capa da Campanha"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent pointer-events-none"></div>
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
                        <span className="text-base font-bold text-white font-serif drop-shadow-md">
                          {title || campaign.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-black/60 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded backdrop-blur-md">
                          16:9 Widescreen
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 text-slate-500 space-y-2">
                      <ImageIcon className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                      <p className="text-xs font-semibold text-slate-400">Nenhuma capa panorâmica configurada ainda.</p>
                      <p className="text-[10.5px] text-slate-500 max-w-sm">
                        Use o gerador de imagem IA abaixo ou selecione um arquivo para ilustrar a mesa.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Image Generator Section */}
              <div className="p-4 rounded-2xl bg-[#141a27] border border-amber-500/30 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#252f44] pb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                      Forja de Capa Panorâmica com IA (Imagen / Gemini)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (synopsis.trim()) {
                        setCoverPrompt(
                          `Epic cinematic wide concept art of ${synopsis.trim().slice(0, 220)} in the fantasy world of ${currentWorld?.title || 'Valor'}`
                        );
                        toast.success('Prompt preenchido a partir da sinopse!');
                      } else {
                        toast.info('Preencha a sinopse na aba 1 primeiro.');
                      }
                    }}
                    className="text-[10.5px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Preencher com Sinopse</span>
                  </button>
                </div>

                {/* Prompt Field */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Descrição Visual / Prompt da Capa:
                  </label>
                  <textarea
                    rows={2}
                    value={coverPrompt}
                    onChange={(e) => setCoverPrompt(e.target.value)}
                    placeholder="Ex: An epic fantasy dragon lair overlooking a mystical valley at twilight, ruins covered in glowing runes, volumetric light..."
                    className="w-full text-xs bg-[#0d121c] border border-[#2a3449] focus:border-amber-500/70 text-slate-100 p-2.5 rounded-xl outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Art Style Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Estilo Visual & Pintura:
                    </label>
                    <select
                      value={selectedArtPreset}
                      onChange={(e) => setSelectedArtPreset(e.target.value)}
                      className="w-full bg-[#0d121c] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold outline-none cursor-pointer"
                    >
                      {ART_STYLE_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          🎨 {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end justify-end gap-2 pt-4 sm:pt-0">
                    <button
                      type="button"
                      onClick={handleGenerateCoverAi}
                      disabled={isGeneratingCover}
                      className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isGeneratingCover ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      <span>{isGeneratingCover ? 'Forjando Arte IA...' : '🎨 Forjar Capa com IA'}</span>
                    </button>
                  </div>
                </div>

                {aiImageError && (
                  <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{aiImageError}</span>
                  </div>
                )}
              </div>

              {/* Upload Manual File / Custom URL */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0d121c] border border-[#252f44] rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Ou carregue uma imagem do seu dispositivo:</span>
                </div>
                <label className="px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Escolher Arquivo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-[#0d121c] border-t border-[#2a3449] p-3.5 sm:p-4 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl border border-[#2a3449] transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>

      </div>

      {/* Deep Entity Narrative Assistant Sub-Modal */}
      {isAiNarrativeModalOpen && (
        <CampaignAiNarrativeGeneratorModal
          isOpen={isAiNarrativeModalOpen}
          onClose={() => setIsAiNarrativeModalOpen(false)}
          onApply={handleApplyDeepAiNarrative}
          selectedWorld={currentWorld || null}
          worldEntities={activeWorldEntities || []}
          initialTitle={title || campaign.title}
          initialTone={themeTone}
        />
      )}
    </div>
  );
};
