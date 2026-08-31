'use client';

import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Sparkles, 
  Plus, 
  Check, 
  UploadCloud, 
  Link2, 
  Layers, 
  ShieldAlert, 
  Flame, 
  Skull, 
  Shield, 
  BookOpen, 
  Image as ImageIcon,
  ExternalLink,
  Pencil,
  Save,
  CheckCircle2,
  Eye,
  Sliders,
  Compass
} from 'lucide-react';
import { CampaignMap, GameScene, DungeonMetadata, SlideAspectRatio } from '@/lib/types';
import { SceneImageAiModal } from '@/components/modals/SceneImageAiModal';
import { normalizeImageUrl, isYouTubeUrl } from '@/lib/imageUtils';
import { toast } from 'sonner';

interface SceneDungeonMapsStudioProps {
  campaignMaps: CampaignMap[];
  selectedScene: GameScene;
  onToggleMapAssociation: (mapId: string) => void;
  onUpdateMapMetadata: (mapId: string, updates: Partial<DungeonMetadata & { title?: string }>) => Promise<void>;
}

const DIFFICULTY_PRESETS: { id: 'easy' | 'medium' | 'hard' | 'deadly'; label: string; range: string; color: string }[] = [
  { id: 'easy', label: 'Iniciante', range: 'Nível 1 - 3', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' },
  { id: 'medium', label: 'Intermediário', range: 'Nível 4 - 6', color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30' },
  { id: 'hard', label: 'Perigoso', range: 'Nível 7 - 10', color: 'border-amber-500/50 text-amber-400 bg-amber-950/30' },
  { id: 'deadly', label: 'Mortal & Épico', range: 'Nível 11+', color: 'border-rose-500/50 text-rose-400 bg-rose-950/30' },
];

export const SceneDungeonMapsStudio: React.FC<SceneDungeonMapsStudioProps> = ({
  campaignMaps,
  selectedScene,
  onToggleMapAssociation,
  onUpdateMapMetadata,
}) => {
  // Masmorra Selecionada para visualização do Dossier
  const [selectedMapId, setSelectedMapId] = useState<string | null>(() => {
    const associatedIds = selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []);
    if (associatedIds.length > 0) return associatedIds[0];
    return campaignMaps[0]?.id || null;
  });

  // Formulário do Dossier da Masmorra Ativa
  const [activeTitle, setActiveTitle] = useState('');
  const [activeDescription, setActiveDescription] = useState('');
  const [activeDifficultyTier, setActiveDifficultyTier] = useState<'easy' | 'medium' | 'hard' | 'deadly'>('medium');
  const [activeChallengeRating, setActiveChallengeRating] = useState('Nível 4 - 6');
  const [activeCoverImageUrl, setActiveCoverImageUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Modal de IA para gerar capa da Dungeon
  const [showAiModal, setShowAiModal] = useState(false);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const [directUrlValue, setDirectUrlValue] = useState('');

  // Identificar masmorra ativa
  const currentMap = campaignMaps.find((m) => m.id === selectedMapId) || campaignMaps[0];

  // Sincronizar formulário ao trocar de masmorra selecionada
  useEffect(() => {
    if (currentMap) {
      const gridData = currentMap.gridData || {};
      setActiveTitle(currentMap.title || '');
      setActiveDescription(gridData.description || '');
      setActiveDifficultyTier(gridData.difficultyTier || 'medium');
      setActiveChallengeRating(gridData.challengeRating || 'Nível 4 - 6');
      setActiveCoverImageUrl(gridData.coverImageUrl || '');
    }
  }, [currentMap?.id, currentMap?.title, currentMap?.gridData]);

  const associatedMapIds = selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []);

  const handleSaveDungeonDetails = async () => {
    if (!currentMap) return;
    setIsSaving(true);
    try {
      await onUpdateMapMetadata(currentMap.id, {
        title: activeTitle.trim() || currentMap.title,
        description: activeDescription.trim(),
        difficultyTier: activeDifficultyTier,
        challengeRating: activeChallengeRating,
        coverImageUrl: activeCoverImageUrl.trim(),
      });
      toast.success('Dossier da masmorra salvo com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar dossier da masmorra:', err);
      toast.error('Falha ao salvar dados da masmorra.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyAiCover = (imageUrl: string) => {
    setActiveCoverImageUrl(imageUrl);
    toast.success('Capa gerada por IA aplicada ao dossier!');
  };

  const handleUseMapBackgroundAsCover = () => {
    if (!currentMap) return;
    const bg = currentMap.gridData?.levels?.[0]?.bgImageUrl || currentMap.gridData?.bgImageUrl;
    if (bg) {
      setActiveCoverImageUrl(bg);
      toast.success('Imagem do mapa definida como capa!');
    } else {
      toast.error('Este mapa não possui imagem de fundo cadastrada.');
    }
  };

  if (campaignMaps.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-[#121824] border border-[#2a3449] rounded-2xl text-center space-y-3 shadow-xl">
        <Map className="w-12 h-12 text-emerald-400 mx-auto opacity-50" />
        <h3 className="text-base font-bold text-slate-200">Nenhum Mapa de Masmorra Criado</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Você ainda não possui masmorras criadas nesta campanha. Acesse o menu <strong>Mapas</strong> no topo para criar sua primeira masmorra tática!
        </p>
      </div>
    );
  }

  const isCurrentAssociated = currentMap ? associatedMapIds.includes(currentMap.id) : false;
  const mapLevelsCount = currentMap?.gridData?.levels?.length || 1;
  const mapGridScale = currentMap?.gridData?.levels?.[0]?.gridScale || currentMap?.gridData?.gridScale || 40;
  const mapWallsCount = currentMap?.gridData?.levels?.[0]?.vectorWalls?.length || currentMap?.gridData?.vectorWalls?.length || 0;
  const mapLightsCount = currentMap?.gridData?.levels?.[0]?.lightSources?.length || currentMap?.gridData?.lightSources?.length || 0;

  return (
    <div className="w-full max-w-[1720px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px] animate-fade-in select-none">
      
      {/* ========================================================================= */}
      {/* COLUNA ESQUERDA (35% - lg:col-span-4): LISTA DE MASMORRAS DA CAMPANHA      */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 bg-[#121824] rounded-2xl border border-[#2a3449] p-4 shadow-2xl flex flex-col gap-3">
        {/* Header da Lista */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <Map className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Masmorras da Campanha</h3>
              <p className="text-[10px] text-emerald-400 font-mono">
                {associatedMapIds.length} associada(s) à cena ativa
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-[#0a0d14] text-slate-300 border border-[#2a3449] px-2 py-0.5 rounded-lg">
            {campaignMaps.length} total
          </span>
        </div>

        {/* Lista de Cards de Masmorras */}
        <div className="space-y-2.5 overflow-y-auto custom-scrollbar flex-1 max-h-[580px] pr-1">
          {campaignMaps.map((map) => {
            const isSelected = selectedMapId === map.id;
            const isAssociated = associatedMapIds.includes(map.id);
            const gridData = map.gridData || {};
            const cover = gridData.coverImageUrl || gridData.levels?.[0]?.bgImageUrl || gridData.bgImageUrl;
            const tierPreset = DIFFICULTY_PRESETS.find((p) => p.id === gridData.difficultyTier) || DIFFICULTY_PRESETS[1];

            return (
              <div
                key={map.id}
                onClick={() => setSelectedMapId(map.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                  isSelected
                    ? 'bg-[#182338] border-emerald-500/70 shadow-lg ring-1 ring-emerald-500/40'
                    : 'bg-[#0a0d14] border-[#2a3449] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Thumbnail / Miniatura da Capa */}
                  <div className="relative w-16 h-12 rounded-xl bg-black overflow-hidden border border-[#2a3449] shrink-0 shadow">
                    {cover ? (
                      <img src={normalizeImageUrl(cover)} alt={map.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#161c28] text-slate-600">
                        <Map className="w-5 h-5 opacity-40" />
                      </div>
                    )}
                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[7px] font-mono text-emerald-400 px-1 rounded">
                      {map.gridData?.levels?.length || 1}F
                    </span>
                  </div>

                  {/* Nome e Nível */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{map.title || 'Masmorra Sem Título'}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border font-mono ${tierPreset.color}`}>
                        {gridData.challengeRating || tierPreset.range}
                      </span>
                    </div>
                  </div>

                  {/* Botão / Checkbox de Associação */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleMapAssociation(map.id);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isAssociated
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                        : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    {isAssociated ? (
                      <>
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Associado</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" />
                        <span>Vincular</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COLUNA DIREITA (65% - lg:col-span-8): DOSSIER COMPLETO DA MASMORRA        */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 bg-[#121824] rounded-2xl border border-[#2a3449] p-5 shadow-2xl flex flex-col gap-4">
        
        {/* Header do Dossier */}
        <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Dossier & Capa da Masmorra
              </h3>
              <p className="text-[11px] text-amber-400 font-mono">
                {currentMap?.title || 'Masmorra'} • Configuração narrativa e visual de exploração
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleMapAssociation(currentMap.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                isCurrentAssociated
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black'
                  : 'bg-[#161c28] hover:bg-[#20293a] border border-[#2a3449] text-slate-300 hover:text-emerald-300'
              }`}
            >
              {isCurrentAssociated ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Vinculado à Cena</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Vincular a Esta Cena</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveDungeonDetails}
              disabled={isSaving}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Corpo do Dossier em Grid Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 overflow-y-auto custom-scrollbar flex-1 pr-1">
          
          {/* LADO ESQUERDO DO DOSSIER (md:col-span-5): CAPA CINEMÁTICA */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              Capa Cinemática da Masmorra:
            </label>

            {/* Container da Capa com Aspect Ratio e Moldura */}
            <div className="relative w-full aspect-[16/10] bg-black/90 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl flex items-center justify-center group">
              {activeCoverImageUrl ? (
                <img
                  src={normalizeImageUrl(activeCoverImageUrl)}
                  alt="Capa da Masmorra"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Map className="w-10 h-10 opacity-30 text-amber-400" />
                  <p className="text-xs font-semibold">Nenhuma capa cadastrada</p>
                  <p className="text-[9px] text-slate-600">Gere com IA ou use o fundo do mapa abaixo</p>
                </div>
              )}

              {/* Vinheta escura no rodapé */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold text-amber-300">
                <span className="truncate">{activeTitle || 'Sem Título'}</span>
                <span className="bg-black/70 px-1.5 py-0.5 rounded border border-amber-500/30">{activeChallengeRating}</span>
              </div>
            </div>

            {/* Ações Rápidas de Imagem de Capa */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>Gerar Capa com IA (Nano Banana 2)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleUseMapBackgroundAsCover}
                  className="py-1.5 px-2 bg-[#161f30] hover:bg-[#202c44] border border-[#2a3449] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Map className="w-3 h-3 text-emerald-400" />
                  <span>Usar Fundo do Mapa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDirectUrlInput(!showDirectUrlInput)}
                  className="py-1.5 px-2 bg-[#161f30] hover:bg-[#202c44] border border-[#2a3449] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Link2 className="w-3 h-3 text-cyan-400" />
                  <span>Colar Link de Imagem</span>
                </button>
              </div>

              {/* Input direto de link de imagem */}
              {showDirectUrlInput && (
                <div className="p-2.5 bg-[#0a0d14] border border-[#2a3449] rounded-xl space-y-2 animate-fade-in">
                  <input
                    type="text"
                    value={directUrlValue}
                    onChange={(e) => setDirectUrlValue(e.target.value)}
                    placeholder="https://exemplo.com/imagem_dungeon.jpg"
                    className="w-full bg-[#121824] border border-[#2a3449] focus:border-amber-500 rounded-lg px-2 py-1 text-xs text-slate-200"
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowDirectUrlInput(false)}
                      className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (directUrlValue.trim()) {
                          setActiveCoverImageUrl(directUrlValue.trim());
                          setShowDirectUrlInput(false);
                          setDirectUrlValue('');
                          toast.success('Link de imagem aplicado!');
                        }
                      }}
                      className="px-3 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded-lg shadow"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Estatísticas Rápidas da Masmorra */}
            <div className="p-3 bg-[#0a0d14] rounded-xl border border-[#2a3449] space-y-1.5 text-[11px] font-mono">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Métricas da Grade Tática:
              </span>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Andares: <strong className="text-amber-300">{mapLevelsCount}</strong></div>
                <div>Grid Scale: <strong className="text-amber-300">{mapGridScale}px</strong></div>
                <div>Paredes Oclusão: <strong className="text-emerald-400">{mapWallsCount}</strong></div>
                <div>Fontes de Luz: <strong className="text-cyan-400">{mapLightsCount}</strong></div>
              </div>
            </div>
          </div>

          {/* LADO DIREITO DO DOSSIER (md:col-span-7): FORMULÁRIO DE LORE E NÍVEL */}
          <div className="md:col-span-7 flex flex-col gap-4">
            
            {/* Título da Masmorra */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-300 uppercase font-mono">
                Título Oficial da Masmorra:
              </label>
              <input
                type="text"
                value={activeTitle}
                onChange={(e) => setActiveTitle(e.target.value)}
                placeholder="Ex: Tumba do Guardião Quebrado, Cripta dos Lamentos..."
                className="w-full bg-[#0a0d14] border border-[#2a3449] focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-bold shadow-inner"
              />
            </div>

            {/* Nível de Desafio D&D 5e (CR) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-300 uppercase font-mono flex items-center justify-between">
                <span>Nível de Desafio & Faixa Recomendada:</span>
                <span className="text-amber-400 font-bold">{activeChallengeRating}</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DIFFICULTY_PRESETS.map((preset) => {
                  const isSelected = activeDifficultyTier === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setActiveDifficultyTier(preset.id);
                        setActiveChallengeRating(preset.range);
                      }}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                        isSelected
                          ? `${preset.color} ring-2 ring-amber-500/40 font-black shadow-md`
                          : 'bg-[#0a0d14] border-[#2a3449] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-xs font-bold">{preset.label}</span>
                      <span className="text-[9px] font-mono opacity-80">{preset.range}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lore & Descrição Narrativa da Masmorra */}
            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-[10px] font-bold text-slate-300 uppercase font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Lore, Rumores & Descrição Narrativa (Leitura do Mestre):
              </label>
              <textarea
                rows={7}
                value={activeDescription}
                onChange={(e) => setActiveDescription(e.target.value)}
                placeholder="Ex: Escavada sob as raízes de uma árvore ancestral, esta catacumba guarda os ossos dos antigos sacerdotes. O ar é pesado com cheiro de mofo e cinzas frias. Os aventureiros escutam um leve som de correntes arrastando..."
                className="w-full flex-1 bg-[#0a0d14] border border-amber-500/30 focus:border-amber-500 rounded-2xl p-3 text-xs text-amber-100 font-serif leading-relaxed resize-none shadow-inner"
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE GERAÇÃO DE CAPA DA MASMORRA COM IA */}
      <SceneImageAiModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onApplyImage={(imgUrl) => handleApplyAiCover(imgUrl)}
        sceneTitle={`Entrada imponente da masmorra: ${activeTitle}`}
        sensoryText={activeDescription || 'Entrada sombria de masmorra medieval de fantasia, arquitetura de pedra antiga, tochas acesas, névoa densa e atmosfera épica de exploração.'}
        defaultAspectRatio="16:9"
      />
    </div>
  );
};
