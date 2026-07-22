'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Swords, User, Shield, Sparkles } from 'lucide-react';
import { Combatant, CampaignMember } from '@/lib/types';
import { INITIAL_MONSTERS } from '@/lib/srd-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { useWorld } from '@/lib/hooks/useWorld';

interface AddCombatantModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignMembers: CampaignMember[];
  onAddCombatant: (c: Combatant) => void;
}

export const AddCombatantModal: React.FC<AddCombatantModalProps> = ({
  isOpen,
  onClose,
  campaignMembers,
  onAddCombatant,
}) => {
  const { worldEntities } = useWorld();
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'players' | 'custom' | 'npcs'>('monsters');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom Form State
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(15);
  const [customAc, setCustomAc] = useState(13);
  const [customInit, setCustomInit] = useState(10);
  const [customType, setCustomType] = useState<'player' | 'monster' | 'npc'>('monster');

  if (!isOpen) return null;

  const filteredMonsters = INITIAL_MONSTERS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMonster = (monster: any) => {
    const rollInit = Math.floor(Math.random() * 20) + 1;
    const newCombatant: Combatant = {
      id: `mon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: monster.name,
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      initiative: rollInit,
      type: 'monster',
      cr: monster.cr,
      conditions: [],
      modelUrl: getModelUrlByNameOrPath(monster.name),
    };
    onAddCombatant(newCombatant);
  };

  const handleAddPlayer = (member: CampaignMember) => {
    const rollInit = Math.floor(Math.random() * 20) + 1;
    const newCombatant: Combatant = {
      id: `pc-${Date.now()}-${member.id}`,
      name: member.characterName || member.displayName || 'Jogador',
      hp: 25,
      maxHp: 25,
      ac: 15,
      initiative: rollInit,
      type: 'player',
      conditions: [],
      modelUrl: member.modelUrl || getModelUrlByNameOrPath(member.characterName || ''),
    };
    onAddCombatant(newCombatant);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const newCombatant: Combatant = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      hp: customHp,
      maxHp: customHp,
      ac: customAc,
      initiative: customInit,
      type: customType,
      conditions: [],
      modelUrl: getModelUrlByNameOrPath(customName),
    };
    onAddCombatant(newCombatant);
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-zinc-100">Adicionar Combatente ao Encontro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 p-1">
          <button
            onClick={() => setActiveAddTab('monsters')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeAddTab === 'monsters' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Monstros SRD (5e)
          </button>
          <button
            onClick={() => setActiveAddTab('players')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeAddTab === 'players' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Roster dos Jogadores
          </button>
          <button
            onClick={() => setActiveAddTab('npcs')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeAddTab === 'npcs' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            NPCs do Mundo
          </button>
          <button
            onClick={() => setActiveAddTab('custom')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeAddTab === 'custom' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/50' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeAddTab === 'monsters' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar monstro no Bestiário (Ex: Goblin, Dragão, Esqueleto)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {filteredMonsters.map((m) => (
                  <div
                    key={m.name}
                    className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-200">{m.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-mono">
                          CR {m.cr}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 font-mono">
                        <span>PV: {m.hp}</span>
                        <span>CA: {m.ac}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddMonster(m)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-rose-600/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAddTab === 'players' && (
            <div className="space-y-2">
              {campaignMembers.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  Nenhum jogador registrado na campanha.
                </div>
              ) : (
                campaignMembers.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-zinc-200">
                          {mem.characterName || mem.displayName}
                        </div>
                        <div className="text-xs text-zinc-500">{mem.role === 'dm' ? 'Mestre' : 'Jogador'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddPlayer(mem)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Entrar no Combate
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeAddTab === 'npcs' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar NPC do mundo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-amber-500/50 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 animate-in fade-in duration-200">
                {worldEntities
                  .filter((e) => e.category === 'npc')
                  .filter(
                    (npc) =>
                      npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (npc.subType && npc.subType.toLowerCase().includes(searchQuery.toLowerCase()))
                  )
                  .map((npc) => {
                    const hp = Number(npc.attributes?.hp || npc.attributes?.pv || npc.attributes?.PV || 20);
                    const ac = Number(npc.attributes?.ac || npc.attributes?.ca || npc.attributes?.CA || 12);
                    return (
                      <div
                        key={npc.id}
                        className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-zinc-200">{npc.name}</span>
                            {npc.subType && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-850 text-zinc-400">
                                {npc.subType}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 font-mono">
                            <span>PV: {hp}</span>
                            <span>CA: {ac}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const rollInit = Math.floor(Math.random() * 20) + 1;
                            onAddCombatant({
                              id: `npc-${Date.now()}-${npc.id}`,
                              name: npc.name,
                              hp,
                              maxHp: hp,
                              ac,
                              initiative: rollInit,
                              type: 'npc',
                              conditions: [],
                              modelUrl: getModelUrlByNameOrPath(npc.name),
                            });
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-amber-600/20 transition-all active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" /> Adicionar
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeAddTab === 'custom' && (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome do Combatente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Guardião das Sombras"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Pontos de Vida (PV)</label>
                  <input
                    type="number"
                    min={1}
                    value={customHp}
                    onChange={(e) => setCustomHp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Classe de Armadura (CA)</label>
                  <input
                    type="number"
                    min={1}
                    value={customAc}
                    onChange={(e) => setCustomAc(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Iniciativa</label>
                  <input
                    type="number"
                    value={customInit}
                    onChange={(e) => setCustomInit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Tipo</label>
                <select
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100"
                >
                  <option value="monster">Monstro / Inimigo</option>
                  <option value="player">Jogador (PC)</option>
                  <option value="npc">NPC Aliado</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10"
              >
                Criar e Adicionar Combatente
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
