'use client';

import React, { useState } from 'react';
import { 
  Map, 
  Plus, 
  Check, 
  BookOpen, 
  CheckCircle2, 
  Compass, 
  Pencil, 
  ExternalLink,
  ShieldAlert,
  Layers,
  Flame
} from 'lucide-react';
import { CampaignMap, GameScene } from '@/lib/types';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { MarkdownViewer } from '@/components/ui/MarkdownViewer';

interface SceneDungeonMapsStudioProps {
  campaignMaps: CampaignMap[];
  selectedScene: GameScene;
  onToggleMapAssociation: (mapId: string) => void;
  onEditMapInMapMaker?: (mapId: string) => void;
}

const DIFFICULTY_PRESETS = [
  { id: 'easy', label: 'Iniciante', range: 'Nível 1 - 3', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-950/30' },
  { id: 'medium', label: 'Intermediário', range: 'Nível 4 - 6', color: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30' },
  { id: 'hard', label: 'Perigoso', range: 'Nível 7 - 10', color: 'border-amber-500/50 text-amber-400 bg-amber-950/30' },
  { id: 'deadly', label: 'Mortal & Épico', range: 'Nível 11+', color: 'border-rose-500/50 text-rose-400 bg-rose-950/30' },
];

export const SceneDungeonMapsStudio: React.FC<SceneDungeonMapsStudioProps> = ({
  campaignMaps,
  selectedScene,
  onToggleMapAssociation,
  onEditMapInMapMaker,
}) => {
  // Masmorra Selecionada para visualização do Dossier
  const [selectedMapId, setSelectedMapId] = useState<string | null>(() => {
    const associatedIds = selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []);
    if (associatedIds.length > 0) return associatedIds[0];
    return campaignMaps[0]?.id || null;
  });

  const associatedMapIds = selectedScene.associatedMapIds || (selectedScene.associatedMapId ? [selectedScene.associatedMapId] : []);

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

  // Identificar masmorra ativa
  const currentMap = campaignMaps.find((m) => m.id === selectedMapId) || campaignMaps[0];
  const gridData = currentMap?.gridData || {};
  const currentCover = gridData.coverImageUrl || gridData.levels?.[0]?.bgImageUrl || gridData.bgImageUrl || '';
  const currentTierPreset = DIFFICULTY_PRESETS.find((p) => p.id === gridData.difficultyTier) || DIFFICULTY_PRESETS[1];
  const currentChallengeRating = gridData.challengeRating || currentTierPreset.range;
  const currentDescription = gridData.description || '';

  const isCurrentAssociated = currentMap ? associatedMapIds.includes(currentMap.id) : false;
  const mapLevelsCount = gridData.levels?.length || 1;
  const mapGridScale = gridData.levels?.[0]?.gridScale || gridData.gridScale || 40;
  const mapWallsCount = gridData.levels?.[0]?.vectorWalls?.length || gridData.vectorWalls?.length || 0;
  const mapLightsCount = gridData.levels?.[0]?.lightSources?.length || gridData.lightSources?.length || 0;

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
            const mGridData = map.gridData || {};
            const cover = mGridData.coverImageUrl || mGridData.levels?.[0]?.bgImageUrl || mGridData.bgImageUrl;
            const tierPreset = DIFFICULTY_PRESETS.find((p) => p.id === mGridData.difficultyTier) || DIFFICULTY_PRESETS[1];

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
                  </div>

                  {/* Nome e Nível */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-200 truncate">{map.title || 'Masmorra Sem Título'}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border font-mono ${tierPreset.color}`}>
                        {mGridData.challengeRating || tierPreset.range}
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
      {/* COLUNA DIREITA (65% - lg:col-span-8): SHOWCASE & DOSSIER DA MASMORRA       */}
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
                {currentMap?.title || 'Masmorra'} • Visualização e briefing narrativo da cena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Vincular à Cena */}
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

            {/* Botão Editar no Map Maker */}
            {onEditMapInMapMaker && (
              <button
                type="button"
                onClick={() => onEditMapInMapMaker(currentMap.id)}
                className="px-3.5 py-1.5 bg-[#161f30] hover:bg-[#202c44] border border-amber-500/40 hover:border-amber-400 text-amber-300 font-bold text-xs rounded-xl shadow flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="Abrir no Map Maker para editar mapa, paredes, luzes e dossier"
              >
                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar no Map Maker</span>
              </button>
            )}
          </div>
        </div>

        {/* Corpo de Apresentação em Grid Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0">
          
          {/* LADO ESQUERDO: CAPA CINEMÁTICA & MÉTRICAS */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-amber-400" />
              Capa Cinemática da Masmorra:
            </label>

            {/* Container da Capa com Aspect Ratio e Moldura */}
            <div className="relative w-full aspect-[16/10] bg-black/90 rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl flex items-center justify-center group">
              {currentCover ? (
                <img
                  src={normalizeImageUrl(currentCover)}
                  alt={currentMap?.title || 'Capa da Masmorra'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="p-6 text-center text-slate-500 flex flex-col items-center gap-2">
                  <Map className="w-10 h-10 opacity-30 text-amber-400" />
                  <p className="text-xs font-semibold">Nenhuma capa cadastrada</p>
                  <p className="text-[9px] text-slate-600">Configure a capa e IA através do Map Maker</p>
                </div>
              )}

              {/* Vinheta escura no rodapé */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold text-amber-300">
                <span className="truncate">{currentMap?.title || 'Sem Título'}</span>
                <span className="bg-black/70 px-1.5 py-0.5 rounded border border-amber-500/30">{currentChallengeRating}</span>
              </div>
            </div>

            {/* Estatísticas Rápidas da Masmorra */}
            <div className="p-3.5 bg-[#0a0d14] rounded-xl border border-[#2a3449] space-y-1.5 text-[11px] font-mono">
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

          {/* LADO DIREITO: EXIBIÇÃO DE LORE E NÍVEL */}
          <div className="md:col-span-7 flex flex-col gap-3.5 min-h-0">
            
            {/* Título da Masmorra */}
            <div className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                Título Oficial da Masmorra:
              </span>
              <h2 className="text-sm font-bold text-slate-100 truncate">
                {currentMap?.title || 'Masmorra Sem Título'}
              </h2>
            </div>

            {/* Nível de Desafio D&D 5e (CR) */}
            <div className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                Nível de Desafio & Faixa Recomendada:
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg border font-mono ${currentTierPreset.color}`}>
                  {currentTierPreset.label} • {currentChallengeRating}
                </span>
              </div>
            </div>

            {/* Lore & Descrição Narrativa da Masmorra (Scroll Interno com Altura Máxima Delimitada) */}
            <div className="p-3.5 bg-[#0a0d14] border border-[#2a3449] rounded-xl flex-1 flex flex-col space-y-2 min-h-0 max-h-[240px] md:max-h-[270px] overflow-hidden shadow-inner">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center gap-1.5 shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                Lore, Rumores & Descrição Narrativa (Leitura do Mestre):
              </span>
              <div className="flex-1 overflow-y-auto custom-scrollbar text-xs text-slate-200 leading-relaxed pr-2 font-serif">
                {currentDescription ? (
                  <MarkdownViewer content={currentDescription} />
                ) : (
                  <p className="text-slate-500 italic font-sans">
                    Nenhuma descrição narrativa ou rumor registrado para esta masmorra. Clique em "Editar no Map Maker" para configurar o dossier.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
