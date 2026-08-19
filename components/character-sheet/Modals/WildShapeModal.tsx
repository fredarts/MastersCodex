'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  PawPrint,
  Shield,
  Heart,
  Wind,
  Sparkles,
  Waves,
  Feather,
  Flame,
  AlertCircle,
  CheckCircle2,
  Lock,
  Swords,
  Footprints,
} from 'lucide-react';
import { CharacterSheet } from '@/lib/types';
import {
  WILD_SHAPE_BEASTS,
  WildShapeBeast,
} from '@/lib/dnd5e-wild-shape-data';
import {
  getWildShapeLimits,
  isBeastEligibleForWildShape,
  transformIntoWildShape,
} from '@/lib/dnd5e-calculator';

interface WildShapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: CharacterSheet;
  onChange: (updated: CharacterSheet) => void;
}

type BeastFilterType = 'all' | 'eligible' | 'land' | 'swim' | 'fly' | 'elemental';

export const WildShapeModal: React.FC<WildShapeModalProps> = ({
  isOpen,
  onClose,
  sheet,
  onChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<BeastFilterType>('eligible');
  const [selectedBeastId, setSelectedBeastId] = useState<string>('lobo');

  const limits = useMemo(() => getWildShapeLimits(sheet), [sheet]);
  const currentFS = sheet.classResources?.['forma_selvagem']?.current ?? 2;
  const maxFS = sheet.classResources?.['forma_selvagem']?.max ?? 2;

  // Filtragem das Bestas
  const filteredBeasts = useMemo(() => {
    return WILD_SHAPE_BEASTS.filter((beast) => {
      const eligibility = isBeastEligibleForWildShape(sheet, beast);

      if (filterType === 'eligible' && !eligibility.eligible) return false;
      if (filterType === 'swim' && !beast.hasSwim) return false;
      if (filterType === 'fly' && !beast.hasFly) return false;
      if (filterType === 'land' && (beast.hasFly || beast.hasSwim || beast.type === 'elemental')) return false;
      if (filterType === 'elemental' && beast.type !== 'elemental') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = beast.name.toLowerCase().includes(q);
        const matchAction = beast.actions.some((a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
        const matchAbility = beast.abilities.some((a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
        if (!matchName && !matchAction && !matchAbility) return false;
      }

      return true;
    });
  }, [sheet, filterType, searchQuery]);

  const selectedBeast = useMemo(() => {
    return WILD_SHAPE_BEASTS.find((b) => b.id === selectedBeastId) || filteredBeasts[0] || WILD_SHAPE_BEASTS[0];
  }, [selectedBeastId, filteredBeasts]);

  if (!isOpen) return null;

  const handleTransform = (beast: WildShapeBeast) => {
    const eligibility = isBeastEligibleForWildShape(sheet, beast);
    if (!eligibility.eligible) return;

    const cost = beast.type === 'elemental' ? 2 : 1;
    if (currentFS < cost && maxFS !== 9999) return;

    const updated = transformIntoWildShape(sheet, beast);

    try {
      const bc = new BroadcastChannel('masters_codex_sync');
      bc.postMessage({
        type: 'SYSTEM_MESSAGE',
        content: `🐾 ${sheet.characterName} assume a FORMA SELVAGEM de ${beast.name}! (${beast.hp} PV | CA ${beast.ac}) ✨`,
      });
      bc.close();
    } catch (e) {}

    onChange(updated);
    onClose();
  };

  const selectedEligibility = selectedBeast ? isBeastEligibleForWildShape(sheet, selectedBeast) : { eligible: false };
  const cost = selectedBeast?.type === 'elemental' ? 2 : 1;
  const hasEnoughUses = currentFS >= cost || maxFS === 9999;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0f19] border border-amber-500/30 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden text-slate-200">
        
        {/* Header */}
        <div className="p-4 px-6 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white font-serif flex items-center gap-2">
                Compêndio de Forma Selvagem
                {limits.isMoonDruid && (
                  <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Círculo da Lua
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Limite Atual: <strong className="text-amber-400">ND {limits.maxCRLabel}</strong> • Natação: {limits.allowSwim ? '✅' : '❌'} • Voo: {limits.allowFly ? '✅' : '❌'} • Usos: <strong className="text-emerald-400">{maxFS === 9999 ? '∞' : `${currentFS}/${maxFS}`}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className="p-3 px-6 bg-[#0e1320] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar besta por nome, ataque ou habilidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#151c2e] border border-slate-700/80 focus:border-amber-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {[
              { key: 'eligible', label: 'Elegíveis', icon: <CheckCircle2 className="w-3 h-3 text-emerald-400" /> },
              { key: 'all', label: 'Todas', icon: <PawPrint className="w-3 h-3 text-slate-400" /> },
              { key: 'land', label: 'Terrestres', icon: <Footprints className="w-3 h-3 text-amber-400" /> },
              { key: 'swim', label: 'Natação', icon: <Waves className="w-3 h-3 text-cyan-400" /> },
              { key: 'fly', label: 'Voo', icon: <Feather className="w-3 h-3 text-indigo-400" /> },
              ...(limits.isMoonDruid ? [{ key: 'elemental', label: 'Elementais', icon: <Flame className="w-3 h-3 text-orange-400" /> }] : []),
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as BeastFilterType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === tab.key
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content: Left Beast Grid / Right Statblock Panel */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          
          {/* Left: Beast List */}
          <div className="md:col-span-5 border-r border-slate-800 overflow-y-auto p-3 space-y-2 bg-[#090d16] scrollbar-thin scrollbar-thumb-slate-700">
            {filteredBeasts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs italic">
                Nenhuma besta encontrada com os filtros selecionados.
              </div>
            ) : (
              filteredBeasts.map((beast) => {
                const eligibility = isBeastEligibleForWildShape(sheet, beast);
                const isSelected = selectedBeast?.id === beast.id;

                return (
                  <button
                    key={beast.id}
                    onClick={() => setSelectedBeastId(beast.id)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md'
                        : eligibility.eligible
                        ? 'bg-[#111726]/60 border-slate-800/80 hover:bg-[#151c2e] hover:border-slate-700'
                        : 'bg-black/40 border-slate-900 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        beast.type === 'elemental'
                          ? 'bg-orange-950/50 border-orange-500/40 text-orange-300'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      }`}>
                        {beast.hasFly ? <Feather className="w-4 h-4" /> : beast.hasSwim ? <Waves className="w-4 h-4" /> : beast.type === 'elemental' ? <Flame className="w-4 h-4" /> : <PawPrint className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate font-serif">{beast.name}</span>
                          {!eligibility.eligible && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span>ND {beast.cr}</span>
                          <span>•</span>
                          <span>{beast.hp} PV</span>
                          <span>•</span>
                          <span>CA {beast.ac}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400">{beast.size}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Detailed Beast Statblock */}
          {selectedBeast && (
            <div className="md:col-span-7 overflow-y-auto p-5 space-y-4 bg-[#0d121f] scrollbar-thin scrollbar-thumb-slate-700">
              
              {/* Header Details */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white font-serif">{selectedBeast.name}</h3>
                    <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                      ND {selectedBeast.cr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    {selectedBeast.size} {selectedBeast.type === 'elemental' ? 'Elemental' : 'Besta'}
                  </p>
                </div>

                {!selectedEligibility.eligible && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2.5 py-1 rounded-xl">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{selectedEligibility.reason}</span>
                  </div>
                )}
              </div>

              {/* Combat Stats Grid (CA, PV, Velocidade) */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#141a2b] border border-slate-800 rounded-2xl p-2.5">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-serif uppercase">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>CA Natural</span>
                  </div>
                  <span className="text-base font-black text-white font-mono">{selectedBeast.ac}</span>
                </div>

                <div className="bg-[#141a2b] border border-slate-800 rounded-2xl p-2.5">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-serif uppercase">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>PV da Besta</span>
                  </div>
                  <span className="text-base font-black text-rose-300 font-mono">{selectedBeast.hp}</span>
                </div>

                <div className="bg-[#141a2b] border border-slate-800 rounded-2xl p-2.5">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-[10px] font-serif uppercase">
                    <Wind className="w-3 h-3 text-amber-400" />
                    <span>Deslocamento</span>
                  </div>
                  <span className="text-xs font-bold text-white font-mono truncate block">{selectedBeast.speed}</span>
                </div>
              </div>

              {/* Physical Attributes (STR, DEX, CON) */}
              <div className="bg-[#111726] border border-slate-800 rounded-2xl p-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 font-serif flex items-center justify-between">
                  <span>Atributos Físicos Substituídos</span>
                  <span className="text-[9px] text-slate-500 font-sans italic">Mentais (INT, SAB, CAR) são mantidos do Druida</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-[#0b0f19] rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">FOR</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {selectedBeast.str} ({Math.floor((selectedBeast.str - 10) / 2) >= 0 ? `+${Math.floor((selectedBeast.str - 10) / 2)}` : Math.floor((selectedBeast.str - 10) / 2)})
                    </span>
                  </div>
                  <div className="bg-[#0b0f19] rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">DES</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {selectedBeast.dex} ({Math.floor((selectedBeast.dex - 10) / 2) >= 0 ? `+${Math.floor((selectedBeast.dex - 10) / 2)}` : Math.floor((selectedBeast.dex - 10) / 2)})
                    </span>
                  </div>
                  <div className="bg-[#0b0f19] rounded-xl p-2 border border-slate-800">
                    <span className="text-[10px] text-slate-400 font-bold block">CON</span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {selectedBeast.con} ({Math.floor((selectedBeast.con - 10) / 2) >= 0 ? `+${Math.floor((selectedBeast.con - 10) / 2)}` : Math.floor((selectedBeast.con - 10) / 2)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Abilities */}
              {selectedBeast.abilities.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider font-serif">Traços & Sentidos</span>
                  <div className="space-y-1.5">
                    {selectedBeast.abilities.map((ab, idx) => (
                      <div key={idx} className="bg-[#111726] border border-slate-800/80 rounded-xl p-2.5 text-xs">
                        <strong className="text-slate-200 block mb-0.5">{ab.name}</strong>
                        <p className="text-slate-400 leading-relaxed text-[11px]">{ab.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions & Natural Weapon Attacks */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider font-serif flex items-center gap-1">
                  <Swords className="w-3 h-3" /> Ações e Ataques Naturais
                </span>
                <div className="space-y-1.5">
                  {selectedBeast.actions.map((act, idx) => (
                    <div key={idx} className="bg-[#111726] border border-slate-800/80 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <strong className="text-white font-bold">{act.name}</strong>
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                          Dano: {act.damage} ({act.damageType})
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed text-[11px]">{act.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transform Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!selectedEligibility.eligible || !hasEnoughUses}
                  onClick={() => handleTransform(selectedBeast)}
                  className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider font-serif flex items-center justify-center gap-2 shadow-xl transition-all ${
                    selectedEligibility.eligible && hasEnoughUses
                      ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 hover:from-emerald-500 hover:to-amber-400 text-slate-950 cursor-pointer active:scale-95 shadow-emerald-950/50'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  <PawPrint className="w-4 h-4" />
                  <span>
                    {!hasEnoughUses
                      ? 'Sem Usos de Forma Selvagem Restantes'
                      : !selectedEligibility.eligible
                      ? selectedEligibility.reason
                      : `Transformar-se em ${selectedBeast.name} (Gasta ${cost} ${cost > 1 ? 'Usos' : 'Uso'})`}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
