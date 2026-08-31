'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Monitor, 
  Square, 
  Smartphone, 
  Tv,
  Palette,
  Search,
  Plus,
  Trash2,
  Layers,
  User,
  MapPin,
  Shield,
  Sword,
  BookOpen,
  Image as ImageIcon
} from 'lucide-react';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { useWorld } from '@/context/WorldContext';
import { RPG_IMAGE_STYLES, SLIDE_ASPECT_RATIO_OPTIONS } from '@/lib/constants/rpgArtStyles';
import { SlideAspectRatio, WorldEntity, WorldEntityCategory } from '@/lib/types';
import { normalizeImageUrl } from '@/lib/imageUtils';

interface SceneImageAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyImage: (imageUrl: string, aspectRatio?: SlideAspectRatio) => void;
  sceneTitle?: string;
  sensoryText?: string;
  defaultAspectRatio?: SlideAspectRatio;
}

export const SceneImageAiModal: React.FC<SceneImageAiModalProps> = ({
  isOpen,
  onClose,
  onApplyImage,
  sceneTitle = '',
  sensoryText = '',
  defaultAspectRatio = '16:9',
}) => {
  const { settings } = useUserSettings();
  const { worldEntities } = useWorld();
  const [prompt, setPrompt] = useState('');
  const [selectedArtStyle, setSelectedArtStyle] = useState<string>('none');
  const [aspectRatio, setAspectRatio] = useState<SlideAspectRatio>(defaultAspectRatio);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImageBase64, setGeneratedImageBase64] = useState<string | null>(null);

  // Estados para Seleção de Referências do World Building
  const [selectedEntities, setSelectedEntities] = useState<WorldEntity[]>([]);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [entityCategoryFilter, setEntityCategoryFilter] = useState<string>('all');

  // Auto-suggest prompt when opening modal
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setGeneratedImageBase64(null);
      setAspectRatio(defaultAspectRatio);

      // Pre-fill prompt with a curated description if empty
      if (!prompt) {
        if (sceneTitle && sensoryText) {
          const cleanSensory = sensoryText.slice(0, 200).replace(/\n/g, ' ');
          setPrompt(`${sceneTitle}. ${cleanSensory}`);
        } else if (sceneTitle) {
          setPrompt(`Cenário de fantasia para RPG: ${sceneTitle}. Atmosfera cinematográfica e imersiva.`);
        } else {
          setPrompt('Taverna acolhedora e movimentada em uma cidade medieval de fantasia, lareira crepitante, aventureiros reunidos, canecas de hidromel, iluminação quente e acolhedora.');
        }
      }
    }
  }, [isOpen, sceneTitle, sensoryText, defaultAspectRatio]);

  // Filtro de entidades do World Building
  const filteredEntities = useMemo(() => {
    return worldEntities.filter((e) => {
      const matchesQuery = entitySearchQuery === '' || 
        e.name.toLowerCase().includes(entitySearchQuery.toLowerCase()) ||
        (e.shortDesc && e.shortDesc.toLowerCase().includes(entitySearchQuery.toLowerCase()));
      
      const matchesCategory = entityCategoryFilter === 'all' || e.category === entityCategoryFilter;
      return matchesQuery && matchesCategory;
    });
  }, [worldEntities, entitySearchQuery, entityCategoryFilter]);

  const getEntityIcon = (cat: WorldEntityCategory | string) => {
    switch (cat) {
      case 'npc':
      case 'species':
      case 'ethnicity':
        return <User className="w-3.5 h-3.5 text-cyan-400" />;
      case 'location':
      case 'plane':
        return <MapPin className="w-3.5 h-3.5 text-emerald-400" />;
      case 'item':
      case 'material':
        return <Sword className="w-3.5 h-3.5 text-amber-400" />;
      case 'faction':
      case 'religion':
        return <Shield className="w-3.5 h-3.5 text-purple-400" />;
      case 'monster':
      case 'beast':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const handleToggleEntity = (entity: WorldEntity) => {
    setSelectedEntities((prev) => {
      const exists = prev.some((e) => e.id === entity.id);
      if (exists) {
        return prev.filter((e) => e.id !== entity.id);
      } else {
        return [...prev, entity];
      }
    });
  };

  const handleRemoveEntity = (entityId: string) => {
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entityId));
  };

  const handleSyncEntitiesIntoPrompt = () => {
    if (selectedEntities.length === 0) return;
    const descriptions = selectedEntities.map((e) => {
      const catLabel = e.category === 'npc' ? 'Personagem/NPC' : e.category === 'location' ? 'Local/Cenário' : e.category === 'item' ? 'Item' : 'Entidade';
      return `[${catLabel}: ${e.name}${e.shortDesc ? ` - ${e.shortDesc}` : ''}]`;
    }).join(' ');

    setPrompt((prev) => {
      const cleanPrev = prev.trim();
      return cleanPrev ? `${cleanPrev} Com a presença visual de: ${descriptions}.` : `Cena de fantasia incluindo: ${descriptions}.`;
    });
  };

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Por favor, digite uma descrição para a imagem.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const activeImageModel = settings.imageModel || 'gemini-3.1-flash-lite-image';
      
      const chosenStyle = RPG_IMAGE_STYLES.find((s) => s.id === selectedArtStyle);
      const stylePromptPart = chosenStyle?.prompt ? `Art style & aesthetic: ${chosenStyle.prompt}.` : '';
      const noTextRule = 'No text, no typography, no letters, no words, no watermark, no signatures, no UI borders.';

      // Enriquecer prompt com as referências selecionadas
      let entityReferencesPart = '';
      if (selectedEntities.length > 0) {
        const entityDetails = selectedEntities
          .map((e) => `${e.name} (${e.category})${e.shortDesc ? `: ${e.shortDesc}` : ''}`)
          .join('; ');
        entityReferencesPart = `Featuring the following canonical world building elements: ${entityDetails}. Match their visual design, facial features, armor, architectural style, and appearance exactly as depicted in the reference images.`;
      }

      const fullPrompt = `${prompt.trim()}. ${entityReferencesPart} ${stylePromptPart} Epic fantasy RPG environment concept art, atmospheric lighting, high resolution, masterpiece. ${noTextRule}`;

      // Extrair URLs de imagens das entidades selecionadas
      const referenceImages = selectedEntities
        .map((e) => e.images?.[0])
        .filter((url): url is string => Boolean(url && url.trim() !== ''));

      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          aspectRatio,
          referenceImages,
          userSettings: {
            ...settings,
            imageModel: activeImageModel,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao gerar imagem com IA.');
      }

      if (data.base64) {
        const fullDataUrl = data.base64.startsWith('data:') 
          ? data.base64 
          : `data:image/jpeg;base64,${data.base64}`;
        setGeneratedImageBase64(fullDataUrl);
      } else if (data.url) {
        setGeneratedImageBase64(data.url);
      } else {
        throw new Error('Nenhuma imagem retornada pelos servidores de IA.');
      }
    } catch (err: any) {
      console.error('[SceneImageAiModal Error]:', err);
      setError(err.message || 'Ocorreu um erro ao gerar a imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (!generatedImageBase64) return;
    onApplyImage(generatedImageBase64, aspectRatio);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in select-none">
      <div className="bg-[#101522] border-2 border-amber-500/50 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1c182c] to-[#101522] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">Gerador de Arte da Cena com IA</h3>
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                Nano Banana 2 • Referência Multimodal do World Building
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto scrollbar-thin flex-1">
          {error && (
            <div className="bg-rose-950/90 border border-rose-500/60 p-3.5 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SEÇÃO: REFERÊNCIAS VISUAIS DO WORLD BUILDING (NPCS, LOCAIS, ITENS)       */}
          {/* ========================================================================= */}
          <div className="bg-[#121824] p-4 rounded-2xl border border-[#2a3449] space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <label className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">
                  Referências Visuais do World Building ({selectedEntities.length})
                </label>
              </div>

              <div className="flex items-center gap-2">
                {selectedEntities.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncEntitiesIntoPrompt}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                    title="Adicionar descrições das entidades selecionadas ao prompt"
                  >
                    <Wand2 className="w-3 h-3 text-amber-400" />
                    <span>Inserir no Prompt</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowEntityPicker(!showEntityPicker)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{showEntityPicker ? 'Fechar Busca' : 'Buscar Entidades (NPCs/Locais)'}</span>
                </button>
              </div>
            </div>

            {/* Chips das Entidades Selecionadas */}
            {selectedEntities.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedEntities.map((ent) => {
                  const entImg = ent.images?.[0];
                  return (
                    <div
                      key={ent.id}
                      className="flex items-center gap-2 bg-[#0a0d14] border border-amber-500/40 rounded-xl p-1.5 pr-2.5 shadow-md animate-fade-in"
                    >
                      {entImg ? (
                        <img
                          src={normalizeImageUrl(entImg)}
                          alt={ent.name}
                          className="w-8 h-8 rounded-lg object-cover border border-[#2a3449]"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#161c28] border border-[#2a3449] flex items-center justify-center">
                          {getEntityIcon(ent.category)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-200 leading-tight">{ent.name}</span>
                        <span className="text-[9px] font-mono text-amber-400/80 uppercase flex items-center gap-1">
                          {getEntityIcon(ent.category)} {ent.category}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEntity(ent.id)}
                        className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors ml-1 cursor-pointer"
                        title="Remover Referência"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                Nenhuma entidade selecionada. Clique em "Buscar Entidades" para referenciar NPCs, Castelos, Monstros e Itens para que a IA aprenda a aparência exata deles!
              </p>
            )}

            {/* Painel Suspenso de Seleção de Entidades */}
            {showEntityPicker && (
              <div className="bg-[#0a0d14] border border-[#2a3449] rounded-xl p-3 space-y-3 animate-fade-in shadow-2xl">
                {/* Barra de Busca e Filtros */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={entitySearchQuery}
                      onChange={(e) => setEntitySearchQuery(e.target.value)}
                      placeholder="Buscar por nome de NPC, Castelo, Item, Raça..."
                      className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>

                  <select
                    value={entityCategoryFilter}
                    onChange={(e) => setEntityCategoryFilter(e.target.value)}
                    className="bg-[#121824] border border-[#2a3449] focus:border-amber-500 text-amber-300 font-bold text-xs rounded-xl px-2.5 py-1.5 cursor-pointer"
                  >
                    <option value="all">Todas Categorias</option>
                    <option value="npc">👤 Personagens & NPCs</option>
                    <option value="location">🏰 Locais & Castelos</option>
                    <option value="item">⚔️ Itens & Artefatos</option>
                    <option value="faction">🛡️ Facções & Ordens</option>
                    <option value="species">🧝 Raças & Espécies</option>
                    <option value="monster">🐉 Monstros & Criaturas</option>
                    <option value="lore_event">📜 Lore & Eventos</option>
                  </select>
                </div>

                {/* Grade de Entidades */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                  {filteredEntities.length > 0 ? (
                    filteredEntities.map((ent) => {
                      const isSelected = selectedEntities.some((e) => e.id === ent.id);
                      const entImg = ent.images?.[0];
                      return (
                        <div
                          key={ent.id}
                          onClick={() => handleToggleEntity(ent)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-500/40 shadow'
                              : 'bg-[#121824] border-[#2a3449] hover:border-slate-500'
                          }`}
                        >
                          {entImg ? (
                            <img
                              src={normalizeImageUrl(entImg)}
                              alt={ent.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#2a3449] shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#161c28] border border-[#2a3449] flex items-center justify-center shrink-0">
                              {getEntityIcon(ent.category)}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-200 truncate">{ent.name}</div>
                            <div className="text-[9px] text-slate-400 truncate flex items-center gap-1 font-mono">
                              {getEntityIcon(ent.category)}
                              <span>{ent.category}</span>
                              {entImg && <span className="text-emerald-400 font-bold">• Com Arte</span>}
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 stroke-[3]" />}
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-4 text-center text-slate-500 text-xs italic">
                      Nenhuma entidade encontrada no World Building com os filtros atuais.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Grid: Formato & Estilo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Formato / Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Formato do Slide (Proporção)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    aspectRatio === '16:9'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">16:9 Widescreen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('4:3')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    aspectRatio === '4:3'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">4:3 Grimório</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('1:1')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    aspectRatio === '1:1'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Square className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">1:1 Quadrado</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    aspectRatio === '9:16'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-[#161c28] border-[#2a3449] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">9:16 Vertical</span>
                </button>
              </div>
            </div>

            {/* Seletor de Estilo Artístico (World Building) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                Estilo Visual da Obra (World Building)
              </label>
              <select
                value={selectedArtStyle}
                onChange={(e) => setSelectedArtStyle(e.target.value)}
                disabled={isGenerating}
                className="w-full bg-[#0a0d14] border-2 border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none transition-all cursor-pointer shadow-inner h-[88px] flex items-center"
              >
                {RPG_IMAGE_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-[#121824] text-slate-200">
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Descrição Visual da Cena (Prompt)
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (error) setError(null);
              }}
              disabled={isGenerating}
              placeholder="Ex: O Rei Theron na sacada do Castelo de Valíria discursando para o exército ao pôr do sol..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed disabled:opacity-50"
            />
          </div>

          {/* Quick Style Chips */}
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">
              Sugestões Rápidas de Clima:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Iluminação Dramática e Velas',
                'Névoa Sombria e Mistério',
                'Ruínas Ancestrais Mágicas',
                'Floresta Élfica Sob a Lua',
                'Interior de Castelo Gótico',
                'Visão Profética e Fendas Arcanas',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPrompt((prev) => `${prev.trim()}, ${chip}`)}
                  className="px-2 py-0.5 rounded-lg bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-[10px] text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview if generated */}
          {generatedImageBase64 && (
            <div className="space-y-2 pt-2 border-t border-[#2a3449]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> Arte Gerada com Sucesso:
              </span>
              <div className="relative w-full max-h-64 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-black flex items-center justify-center shadow-lg">
                <img
                  src={generatedImageBase64}
                  alt="Arte Gerada por IA"
                  className="w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#2a3449] bg-[#0c101a]">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Gerando com Nano Banana 2...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5 text-slate-950" />
                  <span>{generatedImageBase64 ? 'Gerar Novamente' : 'Gerar Imagem'}</span>
                </>
              )}
            </button>

            {generatedImageBase64 && (
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Adicionar ao Pack da Cena</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
