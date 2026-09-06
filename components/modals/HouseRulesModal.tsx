'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Scroll,
  Search,
  Swords,
  Wine,
  Moon,
  Dice5,
  Sparkles,
  BookMarked,
  Layers,
  Flame,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import {
  HouseRuleItem,
  HouseRuleCategory,
  HOUSE_RULE_CATEGORIES,
  HOUSE_RULE_IMPACT_LABELS,
} from '@/lib/types/houseRules';

interface HouseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseRules: HouseRuleItem[];
  campaignTitle?: string;
}

export const HouseRulesModal: React.FC<HouseRulesModalProps> = ({
  isOpen,
  onClose,
  houseRules,
  campaignTitle = 'Mesa de RPG',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HouseRuleCategory | 'all'>('all');

  // Apenas regras ativas para os jogadores
  const activeRules = useMemo(() => {
    return houseRules.filter((r) => r.isActive !== false);
  }, [houseRules]);

  const filteredRules = useMemo(() => {
    return activeRules.filter((rule) => {
      if (selectedCategory !== 'all' && rule.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rule.title.toLowerCase().includes(q);
        const matchesDesc = rule.description.toLowerCase().includes(q);
        const matchesCat = HOUSE_RULE_CATEGORIES[rule.category]?.label.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [activeRules, selectedCategory, searchQuery]);

  const renderCategoryIcon = (category: HouseRuleCategory, className = 'w-4 h-4') => {
    switch (category) {
      case 'combat':
        return <Swords className={className} />;
      case 'potions':
        return <Wine className={className} />;
      case 'rest':
        return <Moon className={className} />;
      case 'dice':
        return <Dice5 className={className} />;
      case 'magic':
        return <Sparkles className={className} />;
      case 'general':
        return <Scroll className={className} />;
      case 'custom':
      default:
        return <BookMarked className={className} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in text-slate-100">
      <div className="w-full max-w-3xl bg-[#121824] border border-[#2a3449] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HEADER DO MODAL */}
        <div className="p-4 sm:p-6 border-b border-[#2a3449] flex items-center justify-between bg-[#161c28] relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Scroll className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-serif text-slate-100 tracking-wide">
                  Regras da Casa & Diretrizes da Mesa
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {activeRules.length} Em Vigor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Modificações e acordos mecânicos válidos para <span className="text-amber-300 font-semibold">{campaignTitle}</span>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#202838] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="p-4 border-b border-[#2a3449]/70 bg-[#0f1420] space-y-3 relative z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar regras por nome, poção, descanso, crítico..."
              className="w-full bg-[#161c28] border border-[#2a3449] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Chips de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-[#161c28] text-slate-400 border-[#2a3449] hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas ({activeRules.length})</span>
            </button>

            {(Object.keys(HOUSE_RULE_CATEGORIES) as HouseRuleCategory[]).map((catKey) => {
              const meta = HOUSE_RULE_CATEGORIES[catKey];
              const count = activeRules.filter((r) => r.category === catKey).length;
              if (count === 0) return null;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                    selectedCategory === catKey
                      ? `${meta.bg} ${meta.color} border-amber-500/80 font-bold`
                      : 'bg-[#161c28] text-slate-400 border-[#2a3449] hover:text-slate-200'
                  }`}
                >
                  {renderCategoryIcon(catKey, 'w-3 h-3')}
                  <span>{meta.label}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* LISTA DE REGRAS EM VIGOR */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3.5 relative z-10">
          {filteredRules.length === 0 ? (
            <div className="p-8 text-center space-y-2 bg-[#161c28]/50 border border-[#2a3449] rounded-2xl">
              <Scroll className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-xs font-bold text-slate-300">Nenhuma regra da casa encontrada</p>
              <p className="text-[11px] text-slate-500">
                {searchQuery || selectedCategory !== 'all'
                  ? 'Nenhuma regra em vigor bate com os filtros atuais.'
                  : 'Esta mesa está utilizando 100% das regras originais dos livros de D&D 5e sem modificações.'}
              </p>
            </div>
          ) : (
            filteredRules.map((rule, idx) => {
              const catMeta = HOUSE_RULE_CATEGORIES[rule.category] || HOUSE_RULE_CATEGORIES.custom;
              const impactMeta = rule.impact ? HOUSE_RULE_IMPACT_LABELS[rule.impact] : null;

              return (
                <div
                  key={rule.id || idx}
                  className="p-4 bg-[#161c28] border border-[#2a3449] hover:border-amber-500/40 rounded-2xl shadow-md transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border mt-0.5 ${catMeta.bg} ${catMeta.border} ${catMeta.color}`}>
                        {renderCategoryIcon(rule.category, 'w-4 h-4')}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-100 font-serif">
                            {rule.title}
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}>
                            {catMeta.label}
                          </span>
                          {impactMeta && (
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${impactMeta.badgeClass}`}>
                              {impactMeta.label}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                          {rule.description}
                        </p>

                        {rule.source && (
                          <span className="text-[10px] text-slate-500 font-mono block pt-0.5">
                            Origem: {rule.source}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Em Vigor</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[#2a3449] bg-[#161c28] flex items-center justify-between text-xs text-slate-400 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>As regras da casa são definidas pelo Mestre da mesa.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
