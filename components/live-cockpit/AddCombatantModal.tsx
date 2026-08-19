import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Swords, User, Shield, Sparkles, Boxes, Image as ImageIcon, Trash2, Zap } from 'lucide-react';
import { Combatant, CampaignMember, CustomMonster } from '@/lib/types';
import { INITIAL_MONSTERS } from '@/lib/srd-data';
import { getModelUrlByNameOrPath } from '@/lib/3d-models';
import { useWorld } from '@/lib/hooks/useWorld';
import { customMonsterService } from '@/lib/services/customMonsterService';
import { CreateMonsterModal } from '@/components/modals/CreateMonsterModal';
import { EncounterDifficultyMeter } from './EncounterDifficultyMeter';
import { crToXp, previewEncounterWithNewMonster } from '@/lib/dnd5e-encounter-calculator';

interface AddCombatantModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignMembers: CampaignMember[];
  currentCombatants?: Combatant[];
  onAddCombatant: (c: Combatant) => void;
  onRemoveCombatant?: (id: string) => void;
}

export const AddCombatantModal: React.FC<AddCombatantModalProps> = ({
  isOpen,
  onClose,
  campaignMembers,
  currentCombatants = [],
  onAddCombatant,
  onRemoveCombatant,
}) => {
  const { worldEntities } = useWorld();
  const [activeAddTab, setActiveAddTab] = useState<'monsters' | 'my_monsters' | 'players' | 'custom' | 'npcs'>('monsters');
  const [searchQuery, setSearchQuery] = useState('');
  const [customMonsters, setCustomMonsters] = useState<CustomMonster[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      customMonsterService.fetchCustomMonsters().then(setCustomMonsters);
    }
  }, [isOpen]);

  const loadCustomMonsters = async () => {
    const data = await customMonsterService.fetchCustomMonsters();
    setCustomMonsters(data);
  };

  // Helper para resolver nível do personagem salvo em LocalStorage
  const resolvePlayerLevel = (pName: string): number => {
    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
      if (saved) {
        const sheets: any[] = JSON.parse(saved);
        const cClean = pName.split('(')[0].trim().toLowerCase();
        const found = sheets.find(
          (s) =>
            (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
            (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
            (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
        );
        if (found && found.level) return Number(found.level);
      }
    } catch (e) {}
    return 1;
  };

  // Lista de jogadores para cálculo de XP
  const partyList = useMemo(() => {
    const playerCombatants = (currentCombatants || []).filter((c) => c.type === 'player');
    if (playerCombatants.length > 0) {
      return playerCombatants.map((c) => ({
        level: resolvePlayerLevel(c.name),
      }));
    }
    const nonDmMembers = (campaignMembers || []).filter((m) => m.role !== 'dm');
    if (nonDmMembers.length > 0) {
      return nonDmMembers.map((m) => ({
        level: resolvePlayerLevel(m.characterName || m.displayName || ''),
      }));
    }
    return [{ level: 1 }, { level: 1 }, { level: 1 }, { level: 1 }];
  }, [currentCombatants, campaignMembers]);

  // Lista de monstros no combate atual
  const monstersList = useMemo(() => {
    return (currentCombatants || [])
      .filter((c) => c.type === 'monster' || c.type === 'npc')
      .map((c) => ({
        id: c.id,
        cr: c.cr,
        name: c.name,
        xp: crToXp(c.cr),
      }));
  }, [currentCombatants]);

  // Monstros ativos no combate para exibição e remoção
  const activeMonsters = useMemo(() => {
    return (currentCombatants || []).filter((c) => c.type === 'monster' || c.type === 'npc');
  }, [currentCombatants]);

  // Custom Form State
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState(15);
  const [customAc, setCustomAc] = useState(13);
  const [customInit, setCustomInit] = useState(10);
  const [customType, setCustomType] = useState<'player' | 'monster' | 'npc'>('monster');
  const [customCr, setCustomCr] = useState('1');
  const [customVisionType, setCustomVisionType] = useState<'normal' | 'darkvision' | 'blindsight' | 'tremorsense' | 'truesight'>('normal');

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
      tokenImageUrl: monster.tokenImageUrl || `/assets/2d/Monstros/${monster.name}.png`,
      tokenType: monster.tokenType || (monster.tokenImageUrl ? 'billboard' : '3d'),
      modelUrl: monster.modelUrl || getModelUrlByNameOrPath(monster.name),
      str: monster.str,
      dex: monster.dex,
      con: monster.con,
      int: monster.int,
      wis: monster.wis,
      cha: monster.cha,
      speed: monster.speed,
      size: monster.size,
      actions: monster.actions || [],
      abilities: monster.abilities || [],
    };
    onAddCombatant(newCombatant);
  };

  const handleAddPlayer = (member: CampaignMember) => {
    const rollInit = Math.floor(Math.random() * 20) + 1;
    const pName = member.characterName || member.displayName || 'Jogador';

    // Read real HP, AC, tokenType, modelUrl, and avatarUrl from character sheet in localStorage/member
    let resolvedHp = 20;
    let resolvedMaxHp = 20;
    let resolvedAc = 10;
    let resolvedTokenType: 'billboard' | '3d' = member.tokenType || '3d';
    let resolvedModelUrl = member.modelUrl || getModelUrlByNameOrPath(member.characterName || '');
    let resolvedAvatarUrl = member.avatarUrl || '';

    try {
      const saved = localStorage.getItem('masters_codex_character_sheets_v1') || localStorage.getItem('codex_character_sheets_v1');
      if (saved) {
        const sheets: any[] = JSON.parse(saved);
        const cClean = pName.split('(')[0].trim().toLowerCase();
        const found = sheets.find(
          (s) =>
            (s.characterName && s.characterName.split('(')[0].trim().toLowerCase() === cClean) ||
            (s.characterName && pName.toLowerCase().includes(s.characterName.toLowerCase())) ||
            (s.characterName && s.characterName.toLowerCase().includes(pName.toLowerCase()))
        );
        if (found) {
          if (found.maxHp) resolvedMaxHp = found.maxHp;
          if (found.currentHp != null) resolvedHp = found.currentHp;
          else resolvedHp = resolvedMaxHp;
          if (found.armorClass) resolvedAc = found.armorClass;
          if (found.tokenType) resolvedTokenType = found.tokenType;
          if (found.modelUrl) resolvedModelUrl = found.modelUrl;
          if (found.avatarUrl) resolvedAvatarUrl = found.avatarUrl;
        }
      }
    } catch (e) {}

    const newCombatant: Combatant = {
      id: `pc-${Date.now()}-${member.id}`,
      name: pName,
      hp: resolvedHp,
      maxHp: resolvedMaxHp,
      ac: resolvedAc,
      initiative: rollInit,
      type: 'player',
      conditions: [],
      tokenType: resolvedTokenType,
      modelUrl: resolvedTokenType === '3d' ? resolvedModelUrl : undefined,
      tokenImageUrl: resolvedTokenType === 'billboard' ? resolvedAvatarUrl : undefined,
      avatarUrl: resolvedAvatarUrl,
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
      cr: customType === 'monster' ? customCr : undefined,
      visionType: customVisionType,
      conditions: [],
      modelUrl: getModelUrlByNameOrPath(customName),
    };
    onAddCombatant(newCombatant);
    setCustomName('');
    setCustomVisionType('normal');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-zinc-100">Adicionar Combatente ao Encontro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Medidor de Dificuldade de Encontro (CR/XP D&D 5e) */}
        <div className="p-3 bg-zinc-950/40 border-b border-zinc-800/80 shrink-0">
          <EncounterDifficultyMeter
            party={partyList}
            monsters={monstersList}
            onRemoveMonster={onRemoveCombatant}
          />
        </div>

        {/* Monstros & Inimigos no Campo de Batalha (com botão de remoção rápida) */}
        {activeMonsters.length > 0 && (
          <div className="p-3 bg-zinc-950/80 border-b border-zinc-800/80 shrink-0 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 font-serif">
                  <Swords className="w-3.5 h-3.5 text-rose-400" />
                  Monstros no Campo de Batalha ({activeMonsters.length})
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                  Total: {monstersList.reduce((sum, m) => sum + (m.xp || 0), 0).toLocaleString()} XP
                </span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono hidden sm:inline">
                Clique no ✕ para remover do combate
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-700">
              {activeMonsters.map((c) => {
                const monsterXp = crToXp(c.cr);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 px-2.5 py-1.5 bg-zinc-900/90 border border-zinc-800 hover:border-rose-500/50 rounded-xl shrink-0 group transition-all shadow-md shadow-black/40"
                  >
                    {c.tokenImageUrl ? (
                      <img
                        src={c.tokenImageUrl}
                        alt={c.name}
                        className="w-7 h-7 rounded-lg object-contain bg-black/60 border border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                        👹
                      </div>
                    )}

                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-xs font-bold text-zinc-200 truncate max-w-[130px]" title={c.name}>
                        {c.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                        <span className="text-rose-400 font-semibold">CR {c.cr || '0'}</span>
                        <span>•</span>
                        <span>{monsterXp.toLocaleString()} XP</span>
                      </div>
                    </div>

                    {onRemoveCombatant && (
                      <button
                        type="button"
                        onClick={() => onRemoveCombatant(c.id)}
                        className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer ml-0.5"
                        title={`Remover ${c.name} do campo de batalha`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 p-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveAddTab('monsters')}
            className={`flex-1 min-w-[110px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeAddTab === 'monsters' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Monstros SRD (5e)
          </button>
          <button
            onClick={() => setActiveAddTab('my_monsters')}
            className={`flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
              activeAddTab === 'my_monsters' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Meus Monstros ({customMonsters.length})
          </button>
          <button
            onClick={() => setActiveAddTab('players')}
            className={`flex-1 min-w-[130px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeAddTab === 'players' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Roster dos Jogadores
          </button>
          <button
            onClick={() => setActiveAddTab('npcs')}
            className={`flex-1 min-w-[110px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeAddTab === 'npcs' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            NPCs do Mundo
          </button>
          <button
            onClick={() => setActiveAddTab('custom')}
            className={`flex-1 min-w-[100px] py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeAddTab === 'custom' ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/50' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Personalizado
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto min-h-0">
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

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {filteredMonsters.map((m) => {
                  const monsterXp = m.xp || crToXp(m.cr);
                  const preview = previewEncounterWithNewMonster(partyList, monstersList, { cr: m.cr, xp: monsterXp });

                  return (
                    <div
                      key={m.name}
                      className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-zinc-200 truncate">{m.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20">
                            CR {m.cr} • {monsterXp.toLocaleString()} XP
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                            preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                            preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                            preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                            'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                          }`}>
                            +{monsterXp.toLocaleString()} XP → {preview.difficultyLabel}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 font-mono">
                          <span>PV: {m.hp}</span>
                          <span>CA: {m.ac}</span>
                          {m.type && <span>Tipo: {m.type}</span>}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddMonster(m)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-rose-600/20 transition-all shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeAddTab === 'my_monsters' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Buscar nos meus monstros customizados..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-purple-600/20 shrink-0 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> + Criar Monstro
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                {customMonsters.length === 0 ? (
                  <div className="p-8 text-center bg-zinc-950/40 rounded-xl border border-zinc-800/60">
                    <Sparkles className="w-8 h-8 text-amber-400/60 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-zinc-300">Você ainda não criou monstros customizados</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Crie pinos Billboard 2D PNG ou modelos 3D com a ajuda de IA!</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Criar Meu Primeiro Monstro
                    </button>
                  </div>
                ) : (
                  customMonsters
                    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((m) => {
                      const monsterXp = crToXp(m.cr);
                      const preview = previewEncounterWithNewMonster(partyList, monstersList, { cr: m.cr, xp: monsterXp });

                      return (
                        <div
                          key={m.id}
                          className="p-3 bg-zinc-950/70 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {m.tokenImageUrl ? (
                              <div className="w-10 h-10 rounded-lg bg-black/60 border border-purple-500/30 overflow-hidden flex items-center justify-center p-1 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={m.tokenImageUrl} alt={m.name} className="max-h-full max-w-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                                <Boxes className="w-5 h-5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-zinc-100 truncate">{m.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 font-mono border border-purple-500/20">
                                  ND {m.cr} • {monsterXp.toLocaleString()} XP
                                </span>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                  preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                                  preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                                  preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                                  preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                                  'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                                }`}>
                                  +{monsterXp.toLocaleString()} XP → {preview.difficultyLabel}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  m.tokenType === 'billboard' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                }`}>
                                  {m.tokenType === 'billboard' ? 'Billboard 2D' : 'Modelo 3D'}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-3 font-mono">
                                <span>PV: {m.hp}</span>
                                <span>CA: {m.ac}</span>
                                <span>Tam: {m.size}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const rollInit = Math.floor(Math.random() * 20) + 1;
                                const newCombatant: Combatant = {
                                  id: `mon-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                                  name: m.name,
                                  hp: m.hp,
                                  maxHp: m.maxHp || m.hp,
                                  ac: m.ac,
                                  initiative: rollInit,
                                  type: 'monster',
                                  cr: m.cr,
                                  size: m.size,
                                  tokenType: m.tokenType,
                                  tokenImageUrl: m.tokenImageUrl,
                                  modelUrl: m.modelUrl || (m.tokenType === '3d' ? getModelUrlByNameOrPath(m.name) : undefined),
                                  conditions: [],
                                  actions: m.actions?.map((a) => ({ name: a.name, desc: a.desc })),
                                };
                                onAddCombatant(newCombatant);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Adicionar
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await customMonsterService.deleteCustomMonster(m.id);
                                loadCustomMonsters();
                              }}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Deletar Monstro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
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
                    const npcCr = (npc.attributes?.cr || npc.attributes?.nd || '1/2') as string;
                    const npcXp = crToXp(npcCr);
                    const preview = previewEncounterWithNewMonster(partyList, monstersList, { cr: npcCr, xp: npcXp });

                    return (
                      <div
                        key={npc.id}
                        className="p-3 bg-zinc-950/60 hover:bg-zinc-800/80 border border-zinc-800/80 rounded-xl flex items-center justify-between transition-all gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-zinc-200 truncate">{npc.name}</span>
                            {npc.subType && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-850 text-zinc-400">
                                {npc.subType}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 font-mono border border-amber-500/20">
                              ND {npcCr} • {npcXp.toLocaleString()} XP
                            </span>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              preview.difficulty === 'deadly' ? 'bg-rose-950/60 text-rose-300 border-rose-800/60' :
                              preview.difficulty === 'hard' ? 'bg-orange-950/60 text-orange-300 border-orange-800/60' :
                              preview.difficulty === 'medium' ? 'bg-amber-950/60 text-amber-300 border-amber-800/60' :
                              preview.difficulty === 'easy' ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' :
                              'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
                            }`}>
                              +{npcXp.toLocaleString()} XP → {preview.difficultyLabel}
                            </span>
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
                              cr: npcCr,
                              initiative: rollInit,
                              type: 'npc',
                              conditions: [],
                              modelUrl: getModelUrlByNameOrPath(npc.name),
                            });
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1 shadow-md shadow-amber-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
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

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Visão</label>
                  <select
                    value={customVisionType}
                    onChange={(e) => setCustomVisionType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100"
                  >
                    <option value="normal">Visão Normal</option>
                    <option value="darkvision">Darkvision</option>
                    <option value="blindsight">Blindsight</option>
                    <option value="tremorsense">Tremorsense</option>
                    <option value="truesight">Truesight</option>
                  </select>
                </div>
              </div>

              {customType === 'monster' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Nível de Desafio (ND / CR) — {crToXp(customCr).toLocaleString()} XP
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1/4, 1/2, 1, 2, 5, 10..."
                    value={customCr}
                    onChange={(e) => setCustomCr(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 font-mono"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Criar e Adicionar Combatente
              </button>
            </form>
          )}
        </div>

        {/* Footer do Modal */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-400 font-mono">
            {activeMonsters.length > 0 ? (
              <span>⚔️ <strong className="text-zinc-200">{activeMonsters.length}</strong> {activeMonsters.length === 1 ? 'monstro' : 'monstros'} no combate</span>
            ) : (
              <span>Nenhum monstro adicionado ainda</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow"
          >
            Concluir / Fechar
          </button>
        </div>
      </div>

      <CreateMonsterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onMonsterCreated={async (newMonster) => {
          await loadCustomMonsters();
          setShowCreateModal(false);
          setActiveAddTab('my_monsters');
        }}
      />
    </div>
  );
};
