import React, { useState, useMemo } from 'react';
import { X, Search, Swords, Target, Sparkles, Plus, ChevronDown, Shield } from 'lucide-react';
import { WEAPON_TABLE, WeaponInfo, calculateWeaponAttack } from '@/lib/dnd5e-calculator';
import { CharacterSheet, CharacterWeaponAttack } from '@/lib/types';

interface WeaponCompendiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: CharacterSheet;
  onAddWeapon: (attack: CharacterWeaponAttack) => void;
}

type WeaponCategoryFilter = 'all' | 'Corpo a Corpo Simples' | 'Corpo a Corpo Marcial' | 'À Distância Simples' | 'À Distância Marcial' | 'Mágica';

const CATEGORY_LABELS: Record<WeaponCategoryFilter, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'Todas', icon: <Swords className="w-3.5 h-3.5" />, color: 'text-slate-300' },
  'Corpo a Corpo Simples': { label: 'Simples (Corpo a Corpo)', icon: <Swords className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  'Corpo a Corpo Marcial': { label: 'Marcial (Corpo a Corpo)', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  'À Distância Simples': { label: 'Simples (Distância)', icon: <Target className="w-3.5 h-3.5" />, color: 'text-cyan-400' },
  'À Distância Marcial': { label: 'Marcial (Distância)', icon: <Target className="w-3.5 h-3.5" />, color: 'text-rose-400' },
  'Mágica': { label: 'Mágicas', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'text-violet-400' },
};

const DAMAGE_TYPE_COLORS: Record<string, string> = {
  'Cortante': 'text-rose-400',
  'Perfurante': 'text-cyan-400',
  'Concussão': 'text-amber-400',
  'Perfurante + Fogo': 'text-orange-400',
  '—': 'text-slate-500',
};

export const WeaponCompendiumModal: React.FC<WeaponCompendiumModalProps> = ({
  isOpen,
  onClose,
  sheet,
  onAddWeapon,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<WeaponCategoryFilter>('all');
  const [expandedWeapon, setExpandedWeapon] = useState<string | null>(null);

  const allWeapons = useMemo(() => Object.values(WEAPON_TABLE), []);

  const filteredWeapons = useMemo(() => {
    return allWeapons.filter((w) => {
      const matchesSearch =
        searchQuery === '' ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.damageType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.properties.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || w.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allWeapons, searchQuery, categoryFilter]);

  const handleSelectWeapon = (weapon: WeaponInfo) => {
    const calc = calculateWeaponAttack(sheet, weapon.name);
    const newAttack: CharacterWeaponAttack = {
      id: Date.now().toString(),
      name: weapon.name,
      atkBonus: calc.atkBonus,
      damage: calc.damage,
      type: calc.damageType,
    };
    onAddWeapon(newAttack);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0d1117] border border-amber-500/30 rounded-2xl w-[95vw] max-w-2xl max-h-[85vh] flex flex-col shadow-2xl shadow-amber-500/10">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-black uppercase text-amber-400">Compêndio de Armas</h2>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-800 px-2 py-0.5 rounded-full">
              {filteredWeapons.length} armas
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SEARCH + FILTERS */}
        <div className="p-3 space-y-2 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arma por nome, tipo de dano ou propriedade..."
              className="w-full bg-[#141b2d] border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_LABELS) as WeaponCategoryFilter[]).map((cat) => {
              const info = CATEGORY_LABELS[cat];
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                  }`}
                >
                  {info.icon}
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* WEAPON LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {filteredWeapons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Swords className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-xs font-bold">Nenhuma arma encontrada</p>
              <p className="text-[10px] text-slate-600">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            filteredWeapons.map((weapon) => {
              const isExpanded = expandedWeapon === weapon.name;
              const calc = calculateWeaponAttack(sheet, weapon.name);
              const damageColor = DAMAGE_TYPE_COLORS[weapon.damageType] || 'text-slate-300';

              return (
                <div
                  key={weapon.name}
                  className={`bg-[#141b2d] border rounded-xl transition-all ${
                    isExpanded
                      ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* WEAPON ROW */}
                  <button
                    onClick={() => setExpandedWeapon(isExpanded ? null : weapon.name)}
                    className="w-full flex items-center gap-3 p-3 text-left"
                  >
                    {/* ÍCONE DA CATEGORIA */}
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      weapon.isMagical
                        ? 'bg-violet-500/20 border border-violet-500/30'
                        : weapon.isRanged
                        ? 'bg-cyan-500/15 border border-cyan-500/25'
                        : 'bg-amber-500/15 border border-amber-500/25'
                    }`}>
                      {weapon.isMagical ? (
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      ) : weapon.isRanged ? (
                        <Target className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Swords className="w-4 h-4 text-amber-400" />
                      )}
                    </div>

                    {/* NOME + CATEGORIA */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold truncate ${weapon.isMagical ? 'text-violet-300' : 'text-white'}`}>
                          {weapon.name}
                        </span>
                        {weapon.isMagical && (
                          <span className="text-[9px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 shrink-0">
                            ✨ Mágica
                          </span>
                        )}
                        {weapon.isMartial && !weapon.isMagical && (
                          <span className="text-[9px] font-bold bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/25 shrink-0">
                            Marcial
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">{weapon.category}</span>
                    </div>

                    {/* DANO RÁPIDO */}
                    <div className="shrink-0 text-right">
                      <span className="text-xs font-black text-rose-300 font-mono block">{weapon.damage}</span>
                      <span className={`text-[10px] font-bold ${damageColor}`}>{weapon.damageType}</span>
                    </div>

                    {/* CHEVRON */}
                    <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* PAINEL EXPANDIDO — DETALHES COMPLETOS */}
                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/70 pt-2.5 animate-fade-in">
                      {/* STATS CALCULADOS COM BASE NO PERSONAGEM */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2 text-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Acerto</span>
                          <span className="text-sm font-black text-amber-400 font-mono">{calc.atkBonus}</span>
                        </div>
                        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2 text-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Dano</span>
                          <span className="text-sm font-black text-rose-300 font-mono">{calc.damage}</span>
                        </div>
                        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-2 text-center">
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">Tipo</span>
                          <span className={`text-[11px] font-bold ${damageColor}`}>{calc.damageType}</span>
                        </div>
                      </div>

                      {/* PROPRIEDADES */}
                      {weapon.properties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {weapon.properties.map((prop) => (
                            <span
                              key={prop}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                                prop.includes('Mágica')
                                  ? 'bg-violet-500/15 border-violet-500/30 text-violet-300'
                                  : prop.includes('Amaldiçoado')
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                                  : prop.includes('Pesada') || prop.includes('Duas Mãos')
                                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                  : prop.includes('Acuidade')
                                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {prop}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* DETALHES EXTRAS */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span>
                            <strong className="text-slate-400">Peso:</strong> {weapon.weight} lb
                          </span>
                          <span>
                            <strong className="text-slate-400">Custo:</strong> {weapon.cost}
                          </span>
                          <span>
                            <strong className="text-slate-400">Tipo:</strong>{' '}
                            {weapon.isRanged ? '🏹 À Distância' : '⚔️ Corpo a Corpo'}
                          </span>
                        </div>
                      </div>

                      {/* BOTÃO ADICIONAR À FICHA */}
                      <button
                        onClick={() => handleSelectWeapon(weapon)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-[0.98] shadow-md shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar à Ficha
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
