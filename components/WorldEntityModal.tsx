'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Sparkles, Layers, BookOpen, FileText, Image as ImageIcon, Trash2, Upload, AlertCircle, Wand2, Network } from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { WorldEntityCategory, WorldEntity, EntityConnection, ConnectionType } from '@/lib/types';
import { ImageLightboxModal } from '@/components/ImageLightboxModal';
import { storageService } from '@/lib/services/storageService';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useUserSettings } from '@/lib/hooks/useUserSettings';
import { WorldEntityAiGeneratorModal } from '@/components/WorldEntityAiGeneratorModal';

interface WorldEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: WorldEntityCategory;
  editingEntity?: WorldEntity | null;
}

export const WorldEntityModal: React.FC<WorldEntityModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'npc',
  editingEntity = null,
}) => {
  const { activeWorld, createWorldEntity, updateWorldEntity } = useWorld();
  const { settings } = useUserSettings();
  const [category, setCategory] = useState<WorldEntityCategory>(defaultCategory);
  const [name, setName] = useState('');
  const [subType, setSubType] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [extraAttr1, setExtraAttr1] = useState('');
  const [extraAttr2, setExtraAttr2] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [connections, setConnections] = useState<EntityConnection[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Lista de todas as outras entidades no mundo atual
  const { worldEntities } = useWorld();
  
  // Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // AI Image Generator states (Nano Banana)
  const [extraPrompt, setExtraPrompt] = useState('');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);
  const [aiWarningMessage, setAiWarningMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    if (editingEntity) {
      setCategory(editingEntity.category);
      setName(editingEntity.name);
      setSubType(editingEntity.subType || '');
      setShortDesc(editingEntity.shortDesc || '');
      setFullContent(editingEntity.fullContent || '');
      setImages(editingEntity.images || []);
      setConnections(editingEntity.connections || []);
      setTags(editingEntity.tags || []);
      
      const attrs = editingEntity.attributes || {};
      const keys = Object.keys(attrs);
      if (keys.length > 0) setExtraAttr1(String(attrs[keys[0]] || ''));
      if (keys.length > 1) setExtraAttr2(String(attrs[keys[1]] || ''));
    } else {
      setCategory(defaultCategory);
      setName('');
      setSubType('');
      setShortDesc('');
      setFullContent('');
      setExtraAttr1('');
      setExtraAttr2('');
      setImages([]);
      setConnections([]);
      setTags([]);
    }
  }, [editingEntity, defaultCategory, isOpen]);

  if (!isOpen || !activeWorld) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const publicUrl = await storageService.uploadAsset(file, 'avatars');
      setImages((prev) => [...prev, publicUrl]);
    } catch (err) {
      console.error('Failed to upload entity image:', err);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleDeleteImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // IA Image Generator (Gemini/Nano Banana ou modelo selecionado)
  const handleGenerateAiImage = async () => {
    // Description validation check as requested
    if (!shortDesc.trim() && !fullContent.trim()) {
      setAiWarningMessage('Preencha primeiro a descrição da entrada antes de gerar a imagem com IA!');
      return;
    }
    setAiWarningMessage(null);
    setIsGeneratingAiImage(true);

    try {
      const baseDescription = shortDesc.trim() || fullContent.trim();
      const categoryName = getCategoryTitle().replace('Adicionar Novo ', '').replace('Adicionar Nova ', '');
      
      // Construct rich prompt
      const promptText = `High detailed fantasy RPG concept art of ${name.trim() || categoryName}: ${baseDescription}. Genre: ${activeWorld.genre}. ${extraPrompt.trim() ? `Additional style details: ${extraPrompt.trim()}` : 'Digital painting, atmospheric lighting, 8k resolution, cinematic composition, white background.'}`;
      
      const response = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptText,
          userSettings: settings,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao gerar imagem.');

      const base64Data = data.base64;
      let finalUrl = `data:image/jpeg;base64,${base64Data}`;

      if (isSupabaseConfigured()) {
        try {
          const res = await fetch(finalUrl);
          const blob = await res.blob();
          const file = new File([blob], `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const publicUrl = await storageService.uploadAsset(file, 'avatars');
          finalUrl = publicUrl;
        } catch (uploadErr) {
          console.warn('Failed to upload entity image, falling back to base64', uploadErr);
        }
      }

      setImages((prev) => [...prev, finalUrl]);

    } catch (err: any) {
      console.error('Failed to generate AI image', err);
      setAiWarningMessage(err.message || 'Erro ao gerar imagem.');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const attributes: Record<string, any> = {};
    if (extraAttr1.trim()) attributes[getAttrKey1()] = extraAttr1.trim();
    if (extraAttr2.trim()) attributes[getAttrKey2()] = extraAttr2.trim();

    if (editingEntity) {
      await updateWorldEntity({
        ...editingEntity,
        category,
        name: name.trim(),
        subType: subType.trim() || undefined,
        shortDesc: shortDesc.trim(),
        fullContent: fullContent.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        connections: connections,
        attributes,
        tags: tags.length > 0 ? tags : undefined,
      });
    } else {
      await createWorldEntity({
        worldId: activeWorld.id,
        category,
        name: name.trim(),
        subType: subType.trim() || undefined,
        status: 'active',
        shortDesc: shortDesc.trim(),
        fullContent: fullContent.trim() || undefined,
        images: images.length > 0 ? images : undefined,
        connections: connections,
        attributes,
        tags: tags.length > 0 ? tags : undefined,
      });
    }

    setIsSubmitting(false);
    setName('');
    setSubType('');
    setShortDesc('');
    setFullContent('');
    setExtraAttr1('');
    setExtraAttr2('');
    setImages([]);
    setConnections([]);
    setTags([]);
    setTagInput('');
    setExtraPrompt('');
    setAiWarningMessage(null);
    onClose();
  };

  // Dynamic Text Helpers per Category
  const getCategoryTitle = () => {
    switch (category) {
      case 'npc': return 'Adicionar Novo NPC / Personagem';
      case 'location': return 'Adicionar Nova Cidade, Masmorra, Ruína ou Geografia';
      case 'faction': return 'Adicionar Nova Facção ou Guilda';
      case 'religion': return 'Adicionar Nova Religião ou Deus';
      case 'lore_event': return 'Adicionar Novo Evento Histórico / Lore';
      case 'species': return 'Adicionar Nova Espécie / Raça';
      case 'ethnicity': return 'Adicionar Nova Etnia / Cultura';
      case 'tradition': return 'Adicionar Nova Tradição ou Ritual';
      case 'profession': return 'Adicionar Nova Profissão ou Título';
      case 'natural_law': return 'Adicionar Nova Lei Natural / Fenômeno';
      case 'spell': return 'Adicionar Novo Feitiço ou Magia';
      case 'disease': return 'Adicionar Nova Doença ou Condição';
      case 'item': return 'Adicionar Novo Item ou Artefato';
      case 'material': return 'Adicionar Novo Recurso, Material ou Minério';
      case 'technology': return 'Adicionar Nova Tecnologia ou Veículo';
      case 'document': return 'Adicionar Novo Documento ou Registro';
      case 'language': return 'Adicionar Novo Idioma ou Dialeto';
      case 'military_conflict': return 'Adicionar Novo Conflito Militar';
      case 'military_unit': return 'Adicionar Nova Unidade Militar';
      case 'currency': return 'Adicionar Sistema Monetário ou Moeda';
      case 'trade_route': return 'Adicionar Rota Comercial ou Mercado';
      case 'beast': return 'Adicionar Monstro, Criatura ou Fera';
      case 'flora': return 'Adicionar Flora Extraordinária ou Planta';
      case 'magic_system': return 'Adicionar Sistema de Magia ou Lei Física';
      case 'plane': return 'Adicionar Plano de Existência ou Dimensão';
      case 'cosmology': return 'Adicionar Mito de Criação ou Cosmologia';
    }
  };

  const getSubmitButtonText = () => {
    return `+ Salvar ${getCategoryTitle().replace('Adicionar Novo ', '').replace('Adicionar Nova ', '').replace('Adicionar ', '')}`;
  };

  const getNamePlaceholder = () => {
    switch (category) {
      case 'npc': return 'Ex: Rei Aris III / Kraag, o Devastador';
      case 'location': return 'Ex: Cidade Real de Valíria / Masmorra Obscura dos Ventos / Taverna do Dragão';
      case 'faction': return 'Ex: Guilda das Sombras / Ordem dos Cavaleiros de Prata';
      case 'religion': return 'Ex: Caminho dos Oito Deuses / Culto da Névoa Ancestral';
      case 'lore_event': return 'Ex: A Queda do Império Solaria / Cataclisma Solar';
      case 'species': return 'Ex: Elfos Astrais do Crepúsculo / Draconídeos / Fungos Conscientes';
      case 'ethnicity': return 'Ex: Nômades das Dunas de Ouro / Clãs da Montanha do Norte';
      case 'tradition': return 'Ex: Festival do Eclipse / Ritual de Passagem Solar';
      case 'profession': return 'Ex: Caçador de Quimeras / Arquimago da Corte Imperial';
      case 'natural_law': return 'Ex: Gravidade Invertida dos Picos / Anomalia Temporal';
      case 'spell': return 'Ex: Esfera de Aniquilação Arcana / Ritual de Selamento';
      case 'disease': return 'Ex: Praga de Cristal / Maldição do Sangue Negro';
      case 'item': return 'Ex: Cetro de Fogo Ancestral / Moeda de Mithral Encantada';
      case 'material': return 'Ex: Adamantite Negro / Essência de Éter / Madeira de Ferro';
      case 'technology': return 'Ex: Autômato a Vapor / Carruagem Voadora Arcana';
      case 'document': return 'Ex: Tratado de Paz dos Sete Reinos / Tomo de Alquimia';
      case 'language': return 'Ex: Alto Élfico / Dialeto das Sombras / Rúnico Anão';
      case 'military_conflict': return 'Ex: Guerra dos Três Tronos / Cerco de Valíria';
      case 'military_unit': return 'Ex: Legião de Ferro / Batalhão de Grifos do Sol';
      case 'currency': return 'Ex: Padrão Ouro Imperial / Fragmentos de Cristal Astral / Escambo de Peles';
      case 'trade_route': return 'Ex: Rota das Caravanas do Deserto / Mercado Negro de Porto Real';
      case 'beast': return 'Ex: Quimera de Escamas Negras / Behemoth dos Picos Gelados';
      case 'flora': return 'Ex: Flor Solar Curativa / Cogumelo Luminescente das Profundezas';
      case 'magic_system': return 'Ex: Magia Rúnica Ancestral / Canalização Cósmica de Éter';
      case 'plane': return 'Ex: Plano das Sombras Reais / Dimensão das Nuvens Astral';
      case 'cosmology': return 'Ex: Mito da Grande Forja Elemental / Deuses Primordiais do Vazio';
    }
  };

  const getAttrLabel1 = () => {
    switch (category) {
      case 'npc': return 'Alinhamento / Papel:';
      case 'location': return 'População / Tipo de Local:';
      case 'faction': return 'Líder / Representante:';
      case 'religion': return 'Domínio Sagrado:';
      case 'lore_event': return 'Era / Data Histórica:';
      case 'species': return 'Expectativa de Vida / Origem:';
      case 'ethnicity': return 'Valores Culturais / Idioma Principal:';
      case 'tradition': return 'Frequência / Época do Ano:';
      case 'profession': return 'Requisito / Classe Social:';
      case 'natural_law': return 'Região Afetada / Escala:';
      case 'spell': return 'Círculo / Escola de Magia:';
      case 'disease': return 'Forma de Contágio / Sintoma:';
      case 'item': return 'Raridade / Tipo de Item:';
      case 'material': return 'Região de Origem / Abundância:';
      case 'technology': return 'Fonte de Energia / Nível Tech:';
      case 'document': return 'Autor / Idioma Escrito:';
      case 'language': return 'Família Linguística / Alfabeto:';
      case 'military_conflict': return 'Comandantes / Facções Envolvidas:';
      case 'military_unit': return 'Tamanho da Força / Armamento:';
      case 'currency': return 'Taxa de Conversão / Material Base:';
      case 'trade_route': return 'Regiões Conectadas / Periculosidade:';
      case 'beast': return 'Nível de Perigo / Hábitat:';
      case 'flora': return 'Propriedades Medicinais / Hábitat:';
      case 'magic_system': return 'Fonte de Poder / Custo ou Limitação:';
      case 'plane': return 'Acessibilidade / Leis Físicas:';
      case 'cosmology': return 'Era da Criação / Forças Primordiais:';
    }
  };

  const getAttrKey1 = () => {
    switch (category) {
      case 'npc': return 'alinhamento';
      case 'location': return 'populacao';
      case 'faction': return 'lider';
      case 'religion': return 'dominio';
      case 'lore_event': return 'era';
      case 'species': return 'expectativa_vida';
      case 'ethnicity': return 'valores';
      case 'tradition': return 'frequencia';
      case 'profession': return 'requisito';
      case 'natural_law': return 'plano';
      case 'spell': return 'escola_magia';
      case 'disease': return 'contagio';
      case 'item': return 'raridade';
      case 'material': return 'abundancia';
      case 'technology': return 'fonte_energia';
      case 'document': return 'autor';
      case 'language': return 'alfabeto';
      case 'military_conflict': return 'comandantes';
      case 'military_unit': return 'tamanho_forca';
      case 'currency': return 'conversao';
      case 'trade_route': return 'periculosidade';
      case 'beast': return 'nivel_perigo';
      case 'flora': return 'propriedades';
      case 'magic_system': return 'fonte_poder';
      case 'plane': return 'acessibilidade';
      case 'cosmology': return 'forcas_primordiais';
    }
  };

  const getAttrLabel2 = () => {
    switch (category) {
      case 'npc': return 'Raça / Classe:';
      case 'location': return 'Clima & Terreno:';
      case 'faction': return 'Influência / Postura:';
      case 'religion': return 'Símbolo Sagrado:';
      case 'lore_event': return 'Impacto no Mundo:';
      case 'species': return 'Características Biológicas:';
      case 'ethnicity': return 'Vestimentas & Costumes:';
      case 'tradition': return 'Significado / Crença:';
      case 'profession': return 'Ferramentas / Equipamentos:';
      case 'natural_law': return 'Efeito nas Criaturas / Regra Física:';
      case 'spell': return 'Componentes Arcanos / Conjuração:';
      case 'disease': return 'Cura Conhecida / Efeito de Status:';
      case 'item': return 'Propriedades Mágicas / Efeito:';
      case 'material': return 'Uso Alquímico / Importação & Exportação:';
      case 'technology': return 'Fabricante / Complexidade:';
      case 'document': return 'Localização do Original / Status:';
      case 'language': return 'Nº de Falantes / Dificuldade:';
      case 'military_conflict': return 'Vencedor / Baixas Estimadas:';
      case 'military_unit': return 'Base Operacional / Especialidade:';
      case 'currency': return 'Região de Circulação / Aceitação:';
      case 'trade_route': return 'Principais Produtos / Guildas Envolvidas:';
      case 'beast': return 'Comportamento / Fraqueza:';
      case 'flora': return 'Efeitos / Rara ou Comum:';
      case 'magic_system': return 'Regras Físicas / Consequências de Uso:';
      case 'plane': return 'Habitantes Primordiais / Clima:';
      case 'cosmology': return 'Verdade vs Lenda / Registros:';
    }
  };

  const getAttrKey2 = () => {
    switch (category) {
      case 'npc': return 'raca';
      case 'location': return 'clima';
      case 'faction': return 'influencia';
      case 'religion': return 'simbolo';
      case 'lore_event': return 'impacto';
      case 'species': return 'biologia';
      case 'ethnicity': return 'costumes';
      case 'tradition': return 'significado';
      case 'profession': return 'ferramentas';
      case 'natural_law': return 'efeito';
      case 'spell': return 'componentes';
      case 'disease': return 'cura';
      case 'item': return 'propriedades';
      case 'material': return 'uso';
      case 'technology': return 'fabricante';
      case 'document': return 'localizacao';
      case 'language': return 'falantes';
      case 'military_conflict': return 'vencedor';
      case 'military_unit': return 'especialidade';
      case 'currency': return 'circulacao';
      case 'trade_route': return 'produtos_guildas';
      case 'beast': return 'comportamento';
      case 'flora': return 'efeitos';
      case 'magic_system': return 'consequencias';
      case 'plane': return 'habitantes';
      case 'cosmology': return 'verdade_lenda';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in select-none">
      {/* Widescreen PC Modal Container */}
      <form onSubmit={handleSubmit} className="bg-[#121722] border-2 border-amber-500/50 rounded-2xl w-full max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] px-6 py-4 border-b border-[#2a3449] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                {activeWorld.title} • WORLD STUDIO
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">{getCategoryTitle()}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{editingEntity ? '✓ Salvar Alterações' : getSubmitButtonText()}</span>
            </button>
            <div className="h-8 w-px bg-[#2a3449] mx-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#2a3449] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Category Dropdown Selector & AI Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Categoria de Worldbuilding:</span>
              </label>
              
              {/* AI Auto-Fill Button */}
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-bold rounded-lg transition-all shadow-inner group"
              >
                <Wand2 className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                <span>Gerar Textos com IA</span>
              </button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WorldEntityCategory)}
              className="w-full bg-[#0a0d14] border-2 border-[#2a3449] focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-amber-300 font-bold focus:outline-none transition-all cursor-pointer shadow-inner"
            >
              <optgroup label="Economia & Comércio">
                <option value="currency">Sistemas Monetários & Moedas</option>
                <option value="trade_route">Rotas Comercial & Mercados</option>
                <option value="material">Recursos & Produtos de Exportação</option>
              </optgroup>
              <optgroup label="Bestiário & Natureza">
                <option value="beast">Monstros & Feras (Predadores / Mitologia)</option>
                <option value="flora">Flora Extraordinária (Plantas Curativas / Fungos)</option>
                <option value="species">Espécie / Raça / Biologia</option>
              </optgroup>
              <optgroup label="Magia & Cosmologia">
                <option value="magic_system">Sistema de Magia (Regras & Limitações)</option>
                <option value="spell">Feitiço & Magia Individual</option>
                <option value="plane">Reino, Plano & Dimensão de Existência</option>
                <option value="cosmology">Cosmologia, Mitos & Deuses Primordiais</option>
                <option value="natural_law">Lei Natural / Fenômeno Físico</option>
                <option value="disease">Doença / Mutação / Condição</option>
              </optgroup>
              <optgroup label="Pessoas & Sociedades">
                <option value="npc">NPC / Personagem</option>
                <option value="faction">Facção / Guilda / Ordem Mercantil</option>
                <option value="religion">Religião / Culto Mortal</option>
                <option value="ethnicity">Etnia / Cultura / Povo</option>
                <option value="tradition">Tradição / Ritual / Festival</option>
                <option value="profession">Profissão / Título / Ocupação</option>
              </optgroup>
              <optgroup label="Geografia & Marcos">
                <option value="location">Geografia, Masmorras, Ruínas & Tavernas</option>
              </optgroup>
              <optgroup label="Material, Itens & Tecnologia">
                <option value="item">Item / Artefato Mágico</option>
                <option value="technology">Tecnologia / Veículo / Autômato</option>
              </optgroup>
              <optgroup label="História & Cronologia">
                <option value="lore_event">Lore & Eventos Marcantes / Eras</option>
                <option value="document">Documento / Registro / Tratado</option>
                <option value="language">Idioma / Dialeto / Runa</option>
                <option value="military_conflict">Conflito Militar / Guerra</option>
                <option value="military_unit">Unidade Militar / Exército</option>
              </optgroup>
            </select>
          </div>

          {/* Grid Row 1: Name & SubType Textarea Textboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Entidade:
              </label>
              <textarea
                rows={2}
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (aiWarningMessage) setAiWarningMessage(null);
                }}
                placeholder={getNamePlaceholder()}
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-100 font-bold focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Sub-tipo / Rótulo / Título:
              </label>
              <textarea
                rows={2}
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="Ex: Lendário, Raro, Antigo, Secreto, Monarca, Cidade Portuária..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-sm text-slate-200 focus:outline-none transition-all resize-none shadow-inner leading-relaxed"
              />
            </div>
          </div>

          {/* Tags Chips Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Etiquetas & Tags Personalizadas:</span>
              <span className="text-[10px] text-slate-500 font-normal">Pressione Enter ou vírgula para adicionar</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-[#0a0d14] border border-[#2a3449] focus-within:border-amber-500 rounded-xl min-h-[44px]">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((_, i) => i !== idx))}
                    className="hover:text-rose-400 font-bold ml-1 text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const trimmed = tagInput.trim().replace(/^#/, '');
                    if (trimmed && !tags.includes(trimmed)) {
                      setTags((prev) => [...prev, trimmed]);
                      setTagInput('');
                    }
                  }
                }}
                placeholder={tags.length === 0 ? "Ex: nobreza, dragao, perigoso, quest..." : "Nova tag..."}
                className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 min-w-[120px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Descrição Curta / Resumo Rápido:
            </label>
            <textarea
              rows={3}
              required
              value={shortDesc}
              onChange={(e) => {
                setShortDesc(e.target.value);
                if (aiWarningMessage) setAiWarningMessage(null);
              }}
              placeholder="Resumo de fácil leitura em poucas frases para consulta rápida durante o jogo..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 font-serif leading-relaxed focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Grid Row 3: Dynamic Attribute Textboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {getAttrLabel1()}
              </label>
              <textarea
                rows={3}
                value={extraAttr1}
                onChange={(e) => setExtraAttr1(e.target.value)}
                placeholder="Descreva detalhadamente o valor deste atributo..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {getAttrLabel2()}
              </label>
              <textarea
                rows={3}
                value={extraAttr2}
                onChange={(e) => setExtraAttr2(e.target.value)}
                placeholder="Descreva detalhadamente o valor deste atributo..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-3 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* Row 4: Full Lore & Master Secrets Large Textarea Textbox */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Conteúdo Completo, Lore Detalhada & Segredos (Opcional):</span>
            </label>
            <textarea
              rows={5}
              value={fullContent}
              onChange={(e) => {
                setFullContent(e.target.value);
                if (aiWarningMessage) setAiWarningMessage(null);
              }}
              placeholder="Aprofundamento de história, regras de RPG, tabelas, encontros ou segredos exclusivos do Mestre..."
              className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl p-4 text-xs text-slate-200 font-serif leading-relaxed focus:outline-none transition-all resize-none shadow-inner"
            ></textarea>
          </div>

          {/* Row 5: Connections & Relationships */}
          <div className="bg-[#0a0d14] border-2 border-[#2a3449] p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-[#2a3449] pb-3">
              <Network className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-100">Conexões na Lore</h4>
                <p className="text-[11px] text-slate-400">Associe esta entidade a outras do mundo e defina a natureza da relação.</p>
              </div>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {worldEntities.filter(e => e.id !== editingEntity?.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic">Nenhuma outra entidade encontrada neste mundo.</p>
              ) : (
                worldEntities.filter(e => e.id !== editingEntity?.id).map(entity => {
                  const existingConn = connections.find(c => c.targetId === entity.id);
                  const isConnected = !!existingConn;
                  
                  return (
                    <div key={entity.id} className={`flex items-center justify-between p-3 rounded-xl border ${isConnected ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#121824] border-[#2a3449]'}`}>
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input 
                          type="checkbox"
                          checked={isConnected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConnections([...connections, { targetId: entity.id, type: 'neutral' }]);
                            } else {
                              setConnections(connections.filter(c => c.targetId !== entity.id));
                            }
                          }}
                          className="w-4 h-4 rounded bg-[#0a0d14] border-[#2a3449] text-amber-500 focus:ring-amber-500/50 cursor-pointer"
                        />
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold ${isConnected ? 'text-amber-400' : 'text-slate-300'}`}>{entity.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{entity.category}</span>
                        </div>
                      </label>
                      
                      {isConnected && (
                        <select
                          value={existingConn.type}
                          onChange={(e) => {
                            const newType = e.target.value as ConnectionType;
                            setConnections(connections.map(c => c.targetId === entity.id ? { ...c, type: newType } : c));
                          }}
                          className="bg-[#0a0d14] border border-amber-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="neutral">Neutro / Relacionado</option>
                          <option value="allied">Aliado / Amigo</option>
                          <option value="hostile">Inimigo / Hostil</option>
                          <option value="family">Família / Sangue</option>
                          <option value="member">Membro / Pertence a</option>
                          <option value="location">Localizado em</option>
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Row 6: Media Gallery & AI Generator Section (Nano Banana) */}
          <div className="bg-[#0a0d14] border-2 border-amber-500/30 p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2a3449] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Galeria de Imagens & Conceito Visual</h4>
                  <p className="text-[11px] text-slate-400">Adicione uploads, URLs ou gere ilustrações por IA para esta entrada.</p>
                </div>
              </div>

              {/* Upload & Add URL buttons */}
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] rounded-xl text-xs font-bold text-slate-200 cursor-pointer transition-all ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className={`w-3.5 h-3.5 text-amber-400 ${isUploadingImage ? 'animate-bounce' : ''}`} />
                  <span>{isUploadingImage ? 'Enviando...' : 'Upload de Arquivo'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploadingImage} />
                </label>
              </div>
            </div>

            {/* AI Image Generation Panel (Nano Banana) */}
            <div className="bg-[#121824] border border-[#2a3449] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold text-slate-200">Gerar Ilustração com IA (Nano Banana)</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
                  Gemini / Nano Banana AI
                </span>
              </div>

              {/* Description Required Alert Warning Banner */}
              {aiWarningMessage && (
                <div className="bg-rose-950/90 border border-rose-500/60 p-3 rounded-xl flex items-center gap-2.5 text-rose-200 text-xs font-semibold shadow-lg animate-pulse">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{aiWarningMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <textarea
                    rows={2}
                    value={extraPrompt}
                    onChange={(e) => setExtraPrompt(e.target.value)}
                    placeholder="Adicionar prompt de texto extra (Ex: pintura a óleo estilo dark fantasy, iluminação dramática, alta definição)..."
                    className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-purple-500 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none transition-all resize-none shadow-inner"
                  />
                </div>
                <button
                  type="button"
                  disabled={isGeneratingAiImage}
                  onClick={handleGenerateAiImage}
                  className="h-full min-h-[48px] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 fill-slate-950" />
                  <span>{isGeneratingAiImage ? 'Gerando Imagem...' : 'Gerar Imagem com IA'}</span>
                </button>
              </div>
            </div>

            {/* Manual URL Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Cole a URL da imagem aqui (https://...)..."
                className="flex-1 bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2 bg-[#161c28] hover:bg-[#1f2738] border border-[#2a3449] text-amber-300 font-bold text-xs rounded-xl"
              >
                + Adicionar URL
              </button>
            </div>

            {/* Image Thumbnails Gallery */}
            {images.length > 0 && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block font-mono">
                  Imagens da Galeria ({images.length}) — Clique na foto para expandir / dar zoom:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-amber-500/40 bg-[#0a0d14] cursor-pointer hover:border-amber-400 transition-all"
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                    >
                      <img src={imgUrl} alt={`Mídia ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(idx);
                          }}
                          className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-md transition-transform active:scale-95"
                          title="Excluir Imagem"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow font-mono">
                          CAPA
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lightbox / Zoom Carousel Modal */}
        <ImageLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          images={images}
          initialIndex={lightboxIndex}
        />
        
        {/* AI Entity Generator Modal */}
        <WorldEntityAiGeneratorModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          worldEntities={worldEntities}
          currentEntityId={editingEntity?.id}
          categoryContext={{
            categoryTitle: getCategoryTitle(),
            namePlaceholder: getNamePlaceholder(),
            attr1Label: getAttrLabel1(),
            attr2Label: getAttrLabel2()
          }}
          onApply={(data) => {
            setName(data.name || name);
            setSubType(data.subType || subType);
            setShortDesc(data.shortDesc || shortDesc);
            setFullContent(data.fullContent || fullContent);
            setExtraAttr1(data.extraAttr1 || extraAttr1);
            setExtraAttr2(data.extraAttr2 || extraAttr2);
            // We do not overwrite images here.
          }}
        />
      </form>
    </div>
  );
};
