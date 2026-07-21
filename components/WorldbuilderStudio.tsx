'use client';

import React, { useState } from 'react';
import { Globe, Plus, Sparkles, Rocket, Compass, Layers, Crown, ArrowRight, Edit3, BookOpen, Play, Settings, Network, Check } from 'lucide-react';
import { useWorld } from '@/lib/hooks/useWorld';
import { useCampaign } from '@/lib/hooks/useCampaign';
import { World, UserCampaign } from '@/lib/types';
import { WorldEditor } from '@/components/WorldEditor';
import { LoreGraph } from '@/components/LoreGraph';

interface WorldbuilderStudioProps {
  onOpenCreateCampaignWithWorld: (world: World) => void;
  onSelectCampaign?: (campaign: UserCampaign) => void;
}

export const WorldbuilderStudio: React.FC<WorldbuilderStudioProps> = ({
  onOpenCreateCampaignWithWorld,
  onSelectCampaign,
}) => {
  const { userWorlds, activeWorld, setActiveWorld, createWorld, updateWorld } = useWorld();
  const { userCampaigns, setActiveCampaign } = useCampaign();
  const [showCreateWorldModal, setShowCreateWorldModal] = useState(false);
  const [isEditingActiveWorld, setIsEditingActiveWorld] = useState(false);
  const [subTab, setSubTab] = useState<'overview' | 'lore'>('overview');

  // World inline title editing state
  const [editingWorldId, setEditingWorldId] = useState<string | null>(null);
  const [editedWorldTitle, setEditedWorldTitle] = useState('');

  const [worldTitle, setWorldTitle] = useState('');
  const [worldGenre, setWorldGenre] = useState('Fantasia Medieval Heróica');
  const [worldDesc, setWorldDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateWorldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worldTitle.trim()) return;
    setIsSubmitting(true);
    const w = await createWorld(worldTitle, worldDesc, worldGenre);
    setIsSubmitting(false);
    setWorldTitle('');
    setWorldDesc('');
    setShowCreateWorldModal(false);
    setIsEditingActiveWorld(true);
  };

  const handleSaveWorldTitle = async (worldToUpdate: World) => {
    if (editedWorldTitle.trim()) {
      await updateWorld({ ...worldToUpdate, title: editedWorldTitle.trim() });
    }
    setEditingWorldId(null);
  };

  if (isEditingActiveWorld && activeWorld) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-[#0f141d] border-b border-[#2a3449] px-4 py-2 flex items-center justify-between">
          <button
            onClick={() => setIsEditingActiveWorld(false)}
            className="text-xs text-slate-400 hover:text-amber-400 font-semibold flex items-center gap-1"
          >
            ← Voltar para Biblioteca de Mundos
          </button>
          <span className="text-xs text-amber-400 font-mono flex items-center gap-1.5">
            <span>Editando Mundo:</span>
            {editingWorldId === activeWorld.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={editedWorldTitle}
                  onChange={(e) => setEditedWorldTitle(e.target.value)}
                  className="bg-[#0a0d14] border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-36"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveWorldTitle(activeWorld);
                    if (e.key === 'Escape') setEditingWorldId(null);
                  }}
                />
                <button onClick={() => handleSaveWorldTitle(activeWorld)} className="p-0.5 text-emerald-400 hover:text-emerald-300">
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 font-bold">
                <span>{activeWorld.title}</span>
                <button
                  onClick={() => {
                    setEditingWorldId(activeWorld.id);
                    setEditedWorldTitle(activeWorld.title);
                  }}
                  className="p-0.5 text-slate-500 hover:text-amber-300 transition-colors"
                  title="Editar Nome do Mundo"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </span>
        </div>
        <WorldEditor onOpenCreateCampaignWithWorld={() => onOpenCreateCampaignWithWorld(activeWorld)} />
      </div>
    );
  }

  const activeWorldCampaigns = activeWorld ? userCampaigns.filter((c) => c.worldId === activeWorld.id) : [];

  return (
    <div className="flex-1 bg-[#0a0d14] flex flex-col overflow-hidden select-none">
      {/* Worldbuilder Studio Sub-header Navigation */}
      <div className="bg-[#0f141d] border-b border-[#2a3449] px-6 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('overview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Biblioteca de Mundos & Universos</span>
          </button>
          <button
            onClick={() => setSubTab('lore')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              subTab === 'lore'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Lore Graph (Grafo de Conexões)</span>
          </button>
        </div>
      </div>

      {subTab === 'lore' ? (
        <LoreGraph />
      ) : (
        <div className="flex-1 p-6 overflow-y-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#161c28] via-[#1a2234] to-[#0f141d] border border-amber-500/30 p-6 rounded-2xl mb-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2.5 py-0.5 rounded">
                WORLDBUILDING STUDIO
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1">Sua Biblioteca de Mundos & Universos</h2>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Crie a história, geografia, NPCs, facções e religiões do seu mundo. Depois, inicie múltiplas campanhas ativas alimentadas por esse universo!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateWorldModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Forjar Novo Mundo</span>
        </button>
      </div>

      {/* Active World Highlight Card */}
      {activeWorld && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-[#161c28] to-[#0f141d] border-2 border-amber-500/50 mb-6 shadow-xl flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
                  MUNDO SELECIONADO ATIVO
                </span>
                <span className="text-xs text-amber-300 font-semibold">{activeWorld.genre}</span>
              </div>

              {editingWorldId === activeWorld.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={editedWorldTitle}
                    onChange={(e) => setEditedWorldTitle(e.target.value)}
                    className="bg-[#0a0d14] border border-amber-500 rounded px-2 py-1 text-lg text-amber-300 font-black focus:outline-none max-w-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveWorldTitle(activeWorld);
                      if (e.key === 'Escape') setEditingWorldId(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveWorldTitle(activeWorld)}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h3 className="text-2xl font-black text-slate-100">{activeWorld.title}</h3>
                  <button
                    onClick={() => {
                      setEditingWorldId(activeWorld.id);
                      setEditedWorldTitle(activeWorld.title);
                    }}
                    className="p-1 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                    title="Editar Nome do Mundo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed font-serif">
                {activeWorld.description || 'Nenhuma descrição detalhada informada.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEditingActiveWorld(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
                <span>Explorar / Editar Worldbuilding</span>
              </button>
              <button
                onClick={() => onOpenCreateCampaignWithWorld(activeWorld)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
              >
                <Rocket className="w-4 h-4" />
                <span>Criar Campanha a partir Deste Mundo</span>
              </button>
            </div>
          </div>

          {/* Derived Campaigns Links for Active World */}
          {activeWorldCampaigns.length > 0 && (
            <div className="pt-3 border-t border-[#2a3449]/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono mb-2 block">
                CAMPANHAS DERIVADAS DESTE MUNDO ({activeWorldCampaigns.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {activeWorldCampaigns.map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => {
                      setActiveCampaign(camp);
                      if (onSelectCampaign) onSelectCampaign(camp);
                    }}
                    className="px-3 py-1.5 bg-[#0a0d14] hover:bg-[#161c28] border border-amber-500/40 rounded-xl text-xs font-bold text-slate-200 hover:text-amber-300 transition-all flex items-center gap-2"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>{camp.title} ({camp.inviteCode})</span>
                    <Play className="w-3 h-3 fill-amber-400 text-amber-400 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Worlds List Grid */}
      <h3 className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider mb-3">
        Todos os Seus Mundos Forjados ({userWorlds.length}):
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userWorlds.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-[#2a3449] rounded-2xl p-8 text-center text-slate-500 bg-[#0f141d]/40">
            <Globe className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300 text-sm">Nenhum mundo criado na sua biblioteca.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Comece forjando seu primeiro mundo para abrigar suas cidades, facções, NPCs e futuras campanhas!
            </p>
            <button
              onClick={() => setShowCreateWorldModal(true)}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md"
            >
              + Forjar Primeiro Mundo
            </button>
          </div>
        ) : (
          userWorlds.map((world) => {
            const isSelected = activeWorld?.id === world.id;
            const derivedCampaigns = userCampaigns.filter((c) => c.worldId === world.id);
            return (
              <div
                key={world.id}
                onClick={() => {
                  setActiveWorld(world);
                  setIsEditingActiveWorld(true);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#161c28] border-amber-500/80 shadow-xl shadow-amber-500/10'
                    : 'bg-[#121824] border-[#2a3449] hover:border-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold bg-[#0a0d14] text-slate-400 border border-[#2a3449] px-2 py-0.5 rounded">
                      {world.genre}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded">
                        ATIVO
                      </span>
                    )}
                  </div>

                  {editingWorldId === world.id ? (
                    <div className="flex items-center gap-1 mt-1 mb-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        autoFocus
                        value={editedWorldTitle}
                        onChange={(e) => setEditedWorldTitle(e.target.value)}
                        className="bg-[#0a0d14] border border-amber-500 rounded px-1.5 py-0.5 text-xs text-amber-300 font-bold focus:outline-none w-full"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveWorldTitle(world);
                          if (e.key === 'Escape') setEditingWorldId(null);
                        }}
                      />
                      <button
                        onClick={() => handleSaveWorldTitle(world)}
                        className="p-1 text-emerald-400 hover:text-emerald-300"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <h4 className="font-bold text-base text-slate-100 truncate">{world.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingWorldId(world.id);
                          setEditedWorldTitle(world.title);
                        }}
                        className="p-1 text-slate-500 hover:text-amber-400 rounded transition-colors opacity-70 group-hover:opacity-100"
                        title="Editar Nome do Mundo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-serif">{world.description}</p>
                </div>

                {derivedCampaigns.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#2a3449]/40 space-y-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Campanhas Ativas:</div>
                    {derivedCampaigns.map((c) => (
                      <button
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWorld(world);
                          setActiveCampaign(c);
                          if (onSelectCampaign) onSelectCampaign(c);
                        }}
                        className="w-full text-left px-2 py-1 bg-[#0a0d14] hover:bg-[#161c28] border border-[#2a3449] rounded-lg text-[11px] font-semibold text-amber-300 hover:text-amber-200 flex items-center justify-between"
                      >
                        <span className="truncate">{c.title}</span>
                        <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-[#2a3449] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Total Campanhas: <strong className="text-amber-400 font-mono">{derivedCampaigns.length}</strong>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWorld(world);
                      setIsEditingActiveWorld(true);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                  >
                    <span>Editar Worldbuilding</span>
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
        </div>
      )}

      {/* Modal Create World */}
      {showCreateWorldModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#161c28] border border-amber-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-amber-400" /> Forjar Novo Mundo
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Defina as bases do seu novo universo de RPG.
            </p>

            <form onSubmit={handleCreateWorldSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome do Mundo:</label>
                <input
                  type="text"
                  required
                  value={worldTitle}
                  onChange={(e) => setWorldTitle(e.target.value)}
                  placeholder="Ex: Valíria - O Reino dos Ventos"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Gênero / Estilo:</label>
                <select
                  value={worldGenre}
                  onChange={(e) => setWorldGenre(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Fantasia Medieval Heróica">Fantasia Medieval Heróica</option>
                  <option value="Dark Fantasy (Sombrio & Cru)">Dark Fantasy (Sombrio & Cru)</option>
                  <option value="Terror Cósmico Eldritch">Terror Cósmico (Eldritch)</option>
                  <option value="Sci-Fi / Cyberpunk">Sci-Fi / Cyberpunk</option>
                  <option value="Steampunk Vitoriano">Steampunk Vitoriano</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição & Lore Resumida:</label>
                <textarea
                  rows={3}
                  value={worldDesc}
                  onChange={(e) => setWorldDesc(e.target.value)}
                  placeholder="Ex: Um mundo em ruínas cercado por brumas místicas e impérios em decadência..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-serif"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWorldModal(false)}
                  className="px-4 py-2 bg-[#0f141d] hover:bg-[#1f2738] text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar Mundo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
