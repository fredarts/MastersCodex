'use client';

import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Lock, 
  HelpCircle, 
  BookOpen, 
  Scroll, 
  Swords, 
  Shield, 
  Sparkles, 
  Heart, 
  Share2, 
  Crown,
  EyeOff
} from 'lucide-react';
import { WorldEntity, CampaignNPCDisclosure, ConnectionType } from '@/lib/types';
import { getEntityPortraitUrl } from '@/lib/world/entityHelpers';
import { useWorld } from '@/lib/hooks/useWorld';

interface PlayerNPCModalProps {
  entity: WorldEntity;
  disclosure?: CampaignNPCDisclosure;
  onClose: () => void;
}

export const PlayerNPCModal: React.FC<PlayerNPCModalProps> = ({
  entity,
  disclosure,
  onClose,
}) => {
  const { worldEntities } = useWorld();
  const [activeTab, setActiveTab] = useState<'lore' | 'stats' | 'secrets' | 'connections'>('lore');

  // Máscaras de revelação (com fallback seguro para exibição pública padrão se não houver disclosure customizada)
  const isImageRevealed = disclosure ? Boolean(disclosure.revealedFields?.image) : Boolean(entity.images && entity.images.length > 0);
  const isNameRevealed = disclosure ? Boolean(disclosure.revealedFields?.name) : true;
  const isRaceClassRevealed = disclosure ? Boolean(disclosure.revealedFields?.raceClass) : true;
  const isShortDescRevealed = disclosure ? Boolean(disclosure.revealedFields?.shortDesc) : true;
  const isFullContentRevealed = disclosure ? Boolean(disclosure.revealedFields?.fullContent) : true;
  const isSecretsRevealed = disclosure ? Boolean(disclosure.revealedFields?.secrets) : false;
  const isConnectionsRevealed = disclosure ? Boolean(disclosure.revealedFields?.connections) : true;
  const isStatSheetRevealed = disclosure ? Boolean(disclosure.revealedFields?.statSheet) : false;

  // Nome e Título resolvidos
  const displayName = isNameRevealed 
    ? entity.name 
    : (disclosure?.alias?.trim() || 'Identidade Desconhecida');

  const portraitUrl = getEntityPortraitUrl(entity);
  const rawAttrs = (entity.attributes || {}) as any;
  const isNpc = entity.category === 'npc' || (entity.category as string) === 'person';
  const npcRace = rawAttrs.npcRace || entity.subType || '';
  const npcClass = rawAttrs.npcClass || '';
  const npcAlignment = rawAttrs.npcAlignment || '';

  const defaultCategoryDesc = entity.category === 'location'
    ? 'Localização do Mundo'
    : entity.category === 'faction'
    ? 'Facção / Organização'
    : entity.category === 'religion'
    ? 'Religião / Devoção'
    : entity.category === 'item'
    ? 'Item Mágico'
    : entity.category === 'spell'
    ? 'Feitiço & Magia'
    : 'Lore do Mundo';

  const displaySubtitle = isRaceClassRevealed
    ? (isNpc ? [npcRace, npcClass, npcAlignment].filter(Boolean).join(' • ') : '') || entity.subType || defaultCategoryDesc
    : 'Origem & Detalhes Desconhecidos';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-1.5 sm:p-3 md:p-4 animate-fade-in">
      <div className="bg-[#0c1018] border border-amber-500/40 rounded-2xl w-full h-full max-w-5xl max-h-[96vh] md:max-h-[94vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#252f44] flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-wide font-serif">
                  {displayName}
                </h3>
                {!isNameRevealed && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded border uppercase bg-amber-500/20 text-amber-300 border-amber-500/40">
                    Codinome
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans">
                {displaySubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#161c28] hover:bg-[#1f2738] border border-[#252f44] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-3 border-b border-[#252f44] bg-[#0c1018] flex-shrink-0 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('lore')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'lore'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Descrição & História</span>
          </button>

          {isConnectionsRevealed && (
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'connections'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Conexões & Facções</span>
            </button>
          )}

          {isSecretsRevealed && (
            <button
              onClick={() => setActiveTab('secrets')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'secrets'
                  ? 'border-rose-400 text-rose-300 bg-rose-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Segredos Revelados</span>
            </button>
          )}

          {isStatSheetRevealed && entity.statSheet && (
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-rose-400 text-rose-300 bg-rose-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Ficha Técnica</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 md:p-8 bg-[#090d14] space-y-6">
          {/* Main Hero Card with Portrait or Mysterious Silhouette */}
          <div className="flex flex-col sm:flex-row gap-6 p-5 sm:p-6 rounded-2xl bg-[#111724] border border-[#252f44] items-center sm:items-start shadow-lg">
            {/* Portrait / Silhouette Box */}
            <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden bg-black/60 border border-amber-500/40 flex-shrink-0 flex items-center justify-center relative shadow-xl group">
              {isImageRevealed && portraitUrl ? (
                <img
                  src={portraitUrl}
                  alt={displayName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b from-[#0e131d] via-[#080b12] to-black w-full h-full">
                  <div className="w-14 h-14 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mb-2 shadow-inner">
                    <HelpCircle className="w-7 h-7 text-amber-400/80 animate-pulse" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-tight">
                    Aparência Não Descoberta
                  </span>
                </div>
              )}
            </div>

            {/* Quick Overview Summary */}
            <div className="flex-1 space-y-3.5 text-center sm:text-left w-full">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-100 font-serif">{displayName}</h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{displaySubtitle}</p>
              </div>

              {isShortDescRevealed && entity.shortDesc ? (
                <p className="text-xs text-slate-300 font-serif leading-relaxed italic bg-[#0a0e16] p-3 rounded-xl border border-[#252f44]">
                  "{entity.shortDesc}"
                </p>
              ) : (
                <div className="p-3 rounded-xl bg-[#0a0e16]/60 border border-dashed border-[#252f44] text-xs text-slate-500 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span>O grupo ainda não possui uma impressão detalhada sobre este indivíduo.</span>
                </div>
              )}

              {/* Tags if revealed */}
              {disclosure?.revealedFields?.tags && entity.tags && entity.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entity.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#161f30] text-slate-300 border border-[#252f44]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lore & Full Content Tab */}
          {activeTab === 'lore' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>História & Conhecimentos Revelados:</span>
              </h4>

              {isFullContentRevealed && entity.fullContent ? (
                <div className="p-5 rounded-2xl bg-[#0e131d] border border-[#252f44] text-xs sm:text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-line shadow-inner">
                  {entity.fullContent}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#0e131d]/60 rounded-2xl border border-dashed border-[#252f44] space-y-2">
                  <Lock className="w-6 h-6 text-slate-600 mx-auto opacity-60" />
                  <p className="text-xs font-medium text-slate-400">
                    A biografia e histórico deste personagem ainda não foram descobertos pelo grupo.
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Investigue rumores, interaja em sessões ou explore documentos antigos para desbloquear novas informações.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Connections Tab */}
          {activeTab === 'connections' && isConnectionsRevealed && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Conexões & Alianças Conhecidas:</span>
              </h4>

              {entity.connections && entity.connections.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entity.connections.map((conn, idx) => {
                    const target = worldEntities.find((e) => e.id === conn.targetId);
                    const targetName = target ? target.name : 'Entidade Conectada';
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#0e131d] border border-[#252f44] flex items-center justify-between gap-2"
                      >
                        <span className="text-xs font-bold text-slate-200">{targetName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 uppercase">
                          {conn.type || 'Vínculo'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs bg-[#0e131d]/40 rounded-xl border border-dashed border-[#252f44]">
                  Nenhum relacionamento formal registrado.
                </div>
              )}
            </div>
          )}

          {/* Secrets Tab */}
          {activeTab === 'secrets' && isSecretsRevealed && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-rose-400" />
                <span>Segredos Descobertos pelo Grupo:</span>
              </h4>

              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-xs text-rose-200 font-serif leading-relaxed whitespace-pre-line">
                {rawAttrs.npcSecrets || entity.secretClue || 'Segredos confidenciais revelados durante a campanha.'}
              </div>
            </div>
          )}

          {/* Stat Sheet Tab */}
          {activeTab === 'stats' && isStatSheetRevealed && entity.statSheet && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Swords className="w-3.5 h-3.5 text-rose-400" />
                <span>Ficha de Combate D&D 5e:</span>
              </h4>

              <div className="p-4 rounded-2xl bg-[#0e131d] border border-[#252f44] space-y-3">
                <div className="flex items-center gap-4 text-xs font-mono text-slate-300 border-b border-[#252f44] pb-3">
                  <div><strong>CA:</strong> <span className="text-amber-400">{entity.statSheet.ac}</span></div>
                  <div><strong>PV:</strong> <span className="text-rose-400">{entity.statSheet.maxHp || entity.statSheet.hp}</span></div>
                  <div><strong>Deslocamento:</strong> <span className="text-cyan-400">{entity.statSheet.speed || '9m'}</span></div>
                  <div><strong>ND:</strong> <span className="text-purple-400">{entity.statSheet.cr || '1'}</span></div>
                </div>

                <div className="grid grid-cols-6 gap-2 text-center text-xs font-mono">
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">FOR</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.str}</div>
                  </div>
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">DES</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.dex}</div>
                  </div>
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">CON</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.con}</div>
                  </div>
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">INT</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.int}</div>
                  </div>
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">SAB</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.wis}</div>
                  </div>
                  <div className="p-2 bg-[#06080d] rounded-lg border border-[#252f44]">
                    <div className="text-[10px] text-slate-400">CAR</div>
                    <div className="font-bold text-amber-300">{entity.statSheet.cha}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
