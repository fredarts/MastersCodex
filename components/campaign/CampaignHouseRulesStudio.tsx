'use client';

import React, { useState, useMemo } from 'react';
import {
  Scroll,
  Search,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Sparkles,
  Swords,
  Wine,
  Moon,
  Dice5,
  BookMarked,
  Layers,
  Flame,
  ShieldAlert,
  Info,
  Sliders,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  HouseRuleItem,
  HouseRuleCategory,
  HouseRuleImpact,
  HOUSE_RULE_CATEGORIES,
  HOUSE_RULE_IMPACT_LABELS,
  COMMUNITY_HOUSE_RULE_PRESETS,
} from '@/lib/types/houseRules';
import { toast } from 'sonner';

interface CampaignHouseRulesStudioProps {
  houseRules: HouseRuleItem[];
  onChange: (rules: HouseRuleItem[]) => void;
  campaignTitle?: string;
}

export const CampaignHouseRulesStudio: React.FC<CampaignHouseRulesStudioProps> = ({
  houseRules,
  onChange,
  campaignTitle = 'Campanha',
}) => {
  // Filtros & Busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HouseRuleCategory | 'all'>('all');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  // Tab para telas menores / Tablets (Split vs Tabs)
  const [mobileTab, setMobileTab] = useState<'active' | 'presets'>('active');

  // Modal / Form de Criação/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<HouseRuleItem | null>(null);

  // Campos do Formulário
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<HouseRuleCategory>('combat');
  const [formImpact, setFormImpact] = useState<HouseRuleImpact>('buff');
  const [formIsActive, setFormIsActive] = useState(true);

  // Ícones por Categoria
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

  // Regras Filtradas
  const filteredRules = useMemo(() => {
    return houseRules.filter((rule) => {
      if (selectedCategory !== 'all' && rule.category !== selectedCategory) {
        return false;
      }
      if (filterActiveOnly && !rule.isActive) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = rule.title.toLowerCase().includes(query);
        const matchesDesc = rule.description.toLowerCase().includes(query);
        const matchesCat = HOUSE_RULE_CATEGORIES[rule.category]?.label.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }
      return true;
    });
  }, [houseRules, selectedCategory, filterActiveOnly, searchQuery]);

  // Contadores
  const activeCount = useMemo(() => houseRules.filter((r) => r.isActive).length, [houseRules]);

  // Termômetro de Estilo de Jogo
  const playstyleAnalysis = useMemo(() => {
    const active = houseRules.filter((r) => r.isActive);
    if (active.length === 0) {
      return {
        label: 'Regras Padrão D&D 5e',
        desc: 'Nenhuma modificação caseira ativa. Experiência clássica dos livros oficiais.',
        tone: 'classic',
        badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
      };
    }

    const counts: Record<string, number> = { buff: 0, nerf: 0, tactical: 0, gritty: 0, comfort: 0, flavor: 0 };
    active.forEach((r) => {
      if (r.impact) counts[r.impact] = (counts[r.impact] || 0) + 1;
    });

    if (counts.gritty >= 2 || (counts.gritty > 0 && counts.nerf > 0)) {
      return {
        label: 'Alta Sobrevivência & Realismo (Gritty)',
        desc: 'Mesa focada em perigo implacável, gestão rígida de recursos e descansos punitivos.',
        tone: 'gritty',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      };
    }

    if (counts.buff >= 2 || counts.comfort >= 2) {
      return {
        label: 'Heroico & Ágil (High Fantasy QoL)',
        desc: 'Combates dinâmicos, personagens poderosos e regras que aceleram o ritmo das sessões.',
        tone: 'heroic',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      };
    }

    if (counts.tactical >= 2) {
      return {
        label: 'Tático & Posicional',
        desc: 'Foco no posicionamento no grid, sinergia entre combatentes e decisões estratégicas.',
        tone: 'tactical',
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      };
    }

    return {
      label: 'Personalizado & Balanceado',
      desc: 'Mix equilibrado de customizações para atender às preferências únicas do seu grupo.',
      tone: 'custom',
      badgeColor: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    };
  }, [houseRules]);

  // Handlers
  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('combat');
    setFormImpact('buff');
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: HouseRuleItem) => {
    setEditingRule(rule);
    setFormTitle(rule.title);
    setFormDescription(rule.description);
    setFormCategory(rule.category);
    setFormImpact(rule.impact || 'buff');
    setFormIsActive(rule.isActive);
    setIsModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error('Informe o título da regra.');
      return;
    }

    if (editingRule) {
      const updated = houseRules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              title: formTitle.trim(),
              description: formDescription.trim(),
              category: formCategory,
              impact: formImpact,
              isActive: formIsActive,
            }
          : r
      );
      onChange(updated);
      toast.success('Regra atualizada com sucesso!');
    } else {
      const newRule: HouseRuleItem = {
        id: `rule-${Date.now()}`,
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        impact: formImpact,
        isActive: formIsActive,
        isPreset: false,
        source: 'Mestre da Mesa',
        createdAt: new Date().toISOString(),
      };
      onChange([newRule, ...houseRules]);
      toast.success('Nova regra adicionada à campanha!');
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    const updated = houseRules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r));
    onChange(updated);
  };

  const handleDeleteRule = (id: string) => {
    const updated = houseRules.filter((r) => r.id !== id);
    onChange(updated);
    toast.info('Regra removida da mesa.');
  };

  const handleDuplicateRule = (rule: HouseRuleItem) => {
    const duplicated: HouseRuleItem = {
      ...rule,
      id: `rule-${Date.now()}`,
      title: `${rule.title} (Cópia)`,
      createdAt: new Date().toISOString(),
    };
    onChange([duplicated, ...houseRules]);
    toast.success('Regra duplicada com sucesso!');
  };

  const handleAddPreset = (preset: typeof COMMUNITY_HOUSE_RULE_PRESETS[0]) => {
    // Verifica se já existe
    const exists = houseRules.some((r) => r.title.toLowerCase() === preset.title.toLowerCase());
    if (exists) {
      toast.warning('Esta regra já está presente na sua lista.');
      return;
    }

    const newRule: HouseRuleItem = {
      ...preset,
      id: `preset-instance-${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    onChange([...houseRules, newRule]);
    toast.success(`Preset "${preset.title}" ativado na mesa!`);
  };

  const handleCopyRuleText = (rule: HouseRuleItem) => {
    const text = `📜 *${rule.title}*\n${rule.description}`;
    navigator.clipboard.writeText(text);
    toast.success('Texto da regra copiado para o clipboard!');
  };

  return (
    <div className="w-full space-y-6 pb-12 animate-fade-in text-slate-100">
      {/* 1. HEADER DO ESTÚDIO DE REGRAS */}
      <div className="p-5 md:p-6 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Scroll className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-bold text-slate-100 font-serif tracking-wide">
                    Regras da Casa & Diretrizes da Mesa
                  </h2>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {activeCount} Ativas / {houseRules.length} Total
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure regras caseiras, mecânicas opcionais e variantes para {campaignTitle}.
                </p>
              </div>
            </div>
          </div>

          {/* Ações Primárias */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Regra Customizada</span>
            </button>
          </div>
        </div>

        {/* Termômetro de Estilo da Mesa */}
        <div className="mt-4 pt-4 border-t border-[#2a3449]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 font-mono flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Estilo da Mesa:
            </span>
            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border ${playstyleAnalysis.badgeColor}`}>
              {playstyleAnalysis.label}
            </span>
          </div>
          <span className="text-[11.5px] text-slate-400 italic">
            {playstyleAnalysis.desc}
          </span>
        </div>
      </div>

      {/* 2. BARRA DE BUSCA E FILTROS */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Campo de Busca */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar regras por nome, descrição ou mecânica..."
              className="w-full bg-[#121824] border border-[#2a3449] rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Toggle de Apenas Ativas */}
          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              filterActiveOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apenas Regras Ativas</span>
          </button>
        </div>

        {/* Chips de Categorias com Contadores */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                : 'bg-[#121824] text-slate-400 border-[#2a3449] hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Todas</span>
            <span className="ml-1 text-[10px] opacity-80">({houseRules.length})</span>
          </button>

          {(Object.keys(HOUSE_RULE_CATEGORIES) as HouseRuleCategory[]).map((catKey) => {
            const meta = HOUSE_RULE_CATEGORIES[catKey];
            const isSelected = selectedCategory === catKey;
            const count = houseRules.filter((r) => r.category === catKey).length;

            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? `${meta.bg} ${meta.color} border-amber-500/80 shadow-md font-bold`
                    : 'bg-[#121824] text-slate-400 border-[#2a3449] hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {renderCategoryIcon(catKey, 'w-3.5 h-3.5')}
                <span>{meta.label}</span>
                {count > 0 && <span className="ml-1 text-[10px] opacity-80">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. NAVEGAÇÃO DE ABAS PARA TELAS MENORES / SMARTPHONES (< 1024px) */}
      <div className="lg:hidden flex items-center gap-2 border-b border-[#2a3449] pb-2">
        <button
          onClick={() => setMobileTab('active')}
          className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            mobileTab === 'active'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
              : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scroll className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Regras da Mesa ({filteredRules.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('presets')}
          className={`flex-1 min-w-0 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
            mobileTab === 'presets'
              ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow'
              : 'bg-[#121824] border-[#2a3449] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">Presets ({COMMUNITY_HOUSE_RULE_PRESETS.length})</span>
        </button>
      </div>

      {/* 4. CONTEÚDO PRINCIPAL: GRID RESPONSIVO (2 Colunas em Tablets Paisagem / PC / Abas em Telas Pequenas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUNA ESQUERDA: LISTA DE REGRAS DA MESA */}
        <div className={`lg:col-span-7 space-y-3.5 ${mobileTab === 'presets' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 font-mono flex items-center gap-2">
              <Scroll className="w-3.5 h-3.5 text-amber-400" />
              Regras Configuradas ({filteredRules.length})
            </h3>
            {filteredRules.length > 0 && (
              <span className="text-[11px] text-slate-500">
                Toque no interruptor para ativar/desativar
              </span>
            )}
          </div>

          {filteredRules.length === 0 ? (
            <div className="p-8 bg-[#121824] border border-[#2a3449] rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Scroll className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Nenhuma regra encontrada</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'all' || filterActiveOnly
                  ? 'Nenhuma regra corresponde aos filtros selecionados. Tente limpar a busca.'
                  : 'Sua campanha ainda não possui regras caseiras cadastradas. Crie uma personalizada ou explore os presets populares.'}
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  onClick={handleOpenCreateModal}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  + Criar Regra
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRules.map((rule) => {
                const catMeta = HOUSE_RULE_CATEGORIES[rule.category] || HOUSE_RULE_CATEGORIES.custom;
                const impactMeta = rule.impact ? HOUSE_RULE_IMPACT_LABELS[rule.impact] : null;

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all duration-200 relative group ${
                      rule.isActive
                        ? 'bg-[#161c28] border-[#2a3449] hover:border-amber-500/50 shadow-lg'
                        : 'bg-[#0e121a]/80 border-[#202838] opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Ícone & Título */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${catMeta.bg} ${catMeta.border} ${catMeta.color}`}
                        >
                          {renderCategoryIcon(rule.category, 'w-4 h-4')}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4
                              className={`text-sm font-bold font-serif leading-tight ${
                                rule.isActive ? 'text-slate-100' : 'text-slate-400 line-through'
                              }`}
                            >
                              {rule.title}
                            </h4>

                            {/* Badges de Categoria e Impacto */}
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                            >
                              {catMeta.label}
                            </span>

                            {impactMeta && (
                              <span
                                className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${impactMeta.badgeClass}`}
                              >
                                {impactMeta.label}
                              </span>
                            )}
                          </div>

                          {/* Descrição */}
                          <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                            {rule.description}
                          </p>

                          {/* Fonte ou Tag de Origem */}
                          {rule.source && (
                            <div className="text-[10px] text-slate-500 font-mono pt-1">
                              Origem: {rule.source}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Switch de Ativação / Desativação */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none ${
                            rule.isActive ? 'bg-amber-500' : 'bg-slate-700'
                          }`}
                          title={rule.isActive ? 'Desativar Regra' : 'Ativar Regra'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Barra de Ações Rápidas do Card */}
                    <div className="mt-3 pt-3 border-t border-[#2a3449]/60 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span className="text-[11px] font-mono">
                          {rule.isActive ? 'Ativa na Campanha' : 'Inativa (Pausada)'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopyRuleText(rule)}
                          className="p-1.5 hover:bg-[#202838] hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                          title="Copiar texto da regra"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDuplicateRule(rule)}
                          className="p-1.5 hover:bg-[#202838] hover:text-sky-300 rounded-lg transition-colors cursor-pointer"
                          title="Duplicar regra"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1.5 hover:bg-[#202838] hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Editar regra"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Excluir regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: BIBLIOTECA DE PRESETS POPULARES */}
        <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'active' ? 'hidden lg:block' : 'block'}`}>
          <div className="p-5 bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a3449] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-100 font-mono">
                  Presets Populares da Comunidade
                </h3>
              </div>
              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-bold">
                1-Click Add
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Adicione modificações mecânicas consagradas de D&D 5e e One D&D com apenas um clique:
            </p>

            <div className="space-y-3">
              {COMMUNITY_HOUSE_RULE_PRESETS.map((preset) => {
                const isAlreadyAdded = houseRules.some(
                  (r) => r.title.toLowerCase() === preset.title.toLowerCase()
                );
                const catMeta = HOUSE_RULE_CATEGORIES[preset.category];
                const impactMeta = preset.impact ? HOUSE_RULE_IMPACT_LABELS[preset.impact] : null;

                return (
                  <div
                    key={preset.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isAlreadyAdded
                        ? 'bg-[#101520] border-[#222a3a] opacity-75'
                        : 'bg-[#121824] border-[#2a3449] hover:border-amber-500/40 hover:bg-[#151c2a]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`p-1 rounded bg-[#1c2436] ${catMeta.color}`}>
                            {renderCategoryIcon(preset.category, 'w-3 h-3')}
                          </span>
                          <h4 className="text-xs font-bold text-slate-200 font-serif">
                            {preset.title}
                          </h4>
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                          {preset.description}
                        </p>

                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}>
                            {catMeta.label}
                          </span>
                          {impactMeta && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-semibold rounded border ${impactMeta.badgeClass}`}>
                              {impactMeta.label}
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono">
                            {preset.source}
                          </span>
                        </div>
                      </div>

                      {/* Botão de Adicionar ou Indicador de Já Ativo */}
                      <div className="flex-shrink-0 pt-0.5">
                        {isAlreadyAdded ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>Na Mesa</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddPreset(preset)}
                            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-bold text-[11px] rounded-lg border border-amber-500/40 transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 5. MODAL DE CRIAÇÃO / EDIÇÃO DE REGRA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#161c28] border border-[#2a3449] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header do Modal */}
            <div className="p-4 md:p-5 border-b border-[#2a3449] flex items-center justify-between bg-[#121824]">
              <div className="flex items-center gap-2">
                <Scroll className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100 font-serif">
                  {editingRule ? 'Editar Regra da Casa' : 'Nova Regra da Casa'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveRule} className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Título da Regra *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Poção de Cura como Ação Bônus"
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Categoria & Impacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HouseRuleCategory)}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {(Object.keys(HOUSE_RULE_CATEGORIES) as HouseRuleCategory[]).map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {HOUSE_RULE_CATEGORIES[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Impacto no Jogo
                  </label>
                  <select
                    value={formImpact}
                    onChange={(e) => setFormImpact(e.target.value as HouseRuleImpact)}
                    className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {(Object.keys(HOUSE_RULE_IMPACT_LABELS) as HouseRuleImpact[]).map((impKey) => (
                      <option key={impKey} value={impKey}>
                        {HOUSE_RULE_IMPACT_LABELS[impKey].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Descrição & Mecânica Detalhada *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Explique como a regra afeta os testes, turnos ou decisões dos jogadores..."
                  className="w-full bg-[#0a0d14] border border-[#2a3449] rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                />
              </div>

              {/* Toggle de Ativo */}
              <div className="p-3 bg-[#0a0d14] border border-[#2a3449] rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Regra Ativa na Mesa</div>
                  <div className="text-[10px] text-slate-400">
                    Jogadores verão esta regra como em vigor imediatamente.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formIsActive ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formIsActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Footer do Modal */}
              <div className="pt-3 border-t border-[#2a3449] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
                >
                  {editingRule ? 'Salvar Alterações' : 'Adicionar Regra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
