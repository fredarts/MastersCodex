'use client';

import React, { useState } from 'react';
import { Search, X, Plus, UserPlus, Shield, Heart } from 'lucide-react';
import { Combatant, CampaignMember } from '@/lib/types';
import { INITIAL_MONSTERS } from '@/lib/srd-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';

interface AddCombatantModalProps {
  isOpen: boolean;
  onClose: () => void;
  combatants: Combatant[];
  setCombatants: React.Dispatch<React.SetStateAction<Combatant[]>>;
  campaignMembers: CampaignMember[];
}

export const AddCombatantModal: React.FC<AddCombatantModalProps> = ({
  isOpen,
  onClose,
  setCombatants,
  campaignMembers,
}) => {
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'players' | 'custom'>('monsters');
  const [searchQuery, setSearchQuery] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState('10');
  const [customAc, setCustomAc] = useState('12');
  const [customInit, setCustomInit] = useState('10');

  if (!isOpen) return null;

  const filteredMonsters = INITIAL_MONSTERS.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMonster = (monster: (typeof INITIAL_MONSTERS)[0]) => {
    const newCombatant: Combatant = {
      id: `mon-${Date.now()}-${Math.random()}`,
      name: `${monster.name} #${Math.floor(1 + Math.random() * 9)}`,
      type: 'monster',
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      cr: monster.cr,
      modelUrl: getModelUrlByNameOrPath(monster.name),
    };
    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
  };

  const handleAddPlayer = (member: CampaignMember) => {
    const name = member.characterName || member.displayName || 'Jogador';
    const newCombatant: Combatant = {
      id: `ply-${member.id}-${Date.now()}`,
      name,
      type: 'player',
      hp: 30,
      maxHp: 30,
      ac: 15,
      initiative: Math.floor(Math.random() * 20) + 1,
      conditions: [],
      modelUrl: member.modelUrl || getModelUrlByNameOrPath(name),
    };
    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const hpVal = parseInt(customHp) || 10;
    const acVal = parseInt(customAc) || 10;
    const initVal = parseInt(customInit) || 10;

    const newCombatant: Combatant = {
      id: `cust-${Date.now()}`,
      name: customName,
      type: 'npc',
      hp: hpVal,
      maxHp: hpVal,
      ac: acVal,
      initiative: initVal,
      conditions: [],
      modelUrl: getModelUrlByNameOrPath(customName),
    };
    setCombatants((prev) => [...prev, newCombatant].sort((a, b) => b.initiative - a.initiative));
    setCustomName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111622] border border-[#2a3449] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden select-none">
        {/* Header */}
        <div className="p-4 border-b border-[#2a3449] flex items-center justify-between bg-[#161c28]">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Adicionar Combatente ao Encontro
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2a3449] bg-[#090d16]">
          <button
            onClick={() => setActiveAddTab('monsters')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeAddTab === 'monsters'
                ? 'border-emerald-400 text-emerald-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            👾 Monstros SRD
          </button>
          <button
            onClick={() => setActiveAddTab('players')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeAddTab === 'players'
                ? 'border-cyan-400 text-cyan-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🛡️ Jogadores da Campanha
          </button>
          <button
            onClick={() => setActiveAddTab('custom')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeAddTab === 'custom'
                ? 'border-purple-400 text-purple-300 bg-[#161c28]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ Personalizado
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[380px] overflow-y-auto custom-scrollbar">
          {activeAddTab === 'monsters' && (
            <div>
              <div className="relative mb-3">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar monstro (ex: Goblin, Hobgoblin)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#090d16] border border-[#2a3449] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2">
                {filteredMonsters.map((monster) => (
                  <div
                    key={monster.id}
                    className="p-3 bg-[#161c28] border border-[#2a3449] rounded-xl flex items-center justify-between hover:border-emerald-500/50 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{monster.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {monster.type} • CR {monster.cr} • HP {monster.hp} • CA {monster.ac}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddMonster(monster)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAddTab === 'players' && (
            <div className="space-y-2">
              {campaignMembers.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhum jogador na campanha ativa.
                </div>
              ) : (
                campaignMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-3 bg-[#161c28] border border-[#2a3449] rounded-xl flex items-center justify-between hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-100">
                          {member.characterName || member.displayName}
                        </h4>
                        <p className="text-[10px] text-slate-400">Papel: {member.role?.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddPlayer(member)}
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-sm"
                    >
                      Incluir no Combate
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeAddTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Nome do NPC/Inimigo</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Ex: Mercenário Misterioso"
                  required
                  className="w-full px-3 py-2 bg-[#090d16] border border-[#2a3449] rounded-xl text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">HP Máximo</label>
                  <input
                    type="number"
                    value={customHp}
                    onChange={(e) => setCustomHp(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090d16] border border-[#2a3449] rounded-xl text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Classe de Armadura</label>
                  <input
                    type="number"
                    value={customAc}
                    onChange={(e) => setCustomAc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090d16] border border-[#2a3449] rounded-xl text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 block mb-1">Iniciativa Inicial</label>
                  <input
                    type="number"
                    value={customInit}
                    onChange={(e) => setCustomInit(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090d16] border border-[#2a3449] rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Criar e Adicionar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
