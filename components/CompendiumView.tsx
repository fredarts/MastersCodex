'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  BookOpen,
  Shield,
  Sparkles,
  Package,
  Flame,
  Filter,
  FilterX,
  Zap,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Eye,
  Heart,
  Swords,
  Crown,
  MapPin,
  Scroll,
  Compass,
} from 'lucide-react';
import { SRDMonster, SRDSpell, SRDItem } from '@/lib/types';
import { INITIAL_MONSTERS, INITIAL_SPELLS, INITIAL_ITEMS } from '@/lib/srd-data';
import { srdService } from '@/lib/services/srdService';
import { useLiveCockpitStudioStore } from '@/lib/stores/useLiveCockpitStudioStore';
import { toast } from 'sonner';

interface CompendiumViewProps {
  isModal?: boolean;
  onClose?: () => void;
}

function getProficiencyBonusByCR(crStr: string): number {
  const cr = parseFloat(crStr);
  if (isNaN(cr)) return 2;
  if (cr <= 4) return 2;
  if (cr <= 8) return 3;
  if (cr <= 12) return 4;
  if (cr <= 16) return 5;
  if (cr <= 20) return 6;
  if (cr <= 24) return 7;
  if (cr <= 28) return 8;
  return 9;
}

function getMonsterLoreDescription(monster: SRDMonster): string {
  const typeStr = monster.type.toLowerCase();
  const nameStr = monster.name;

  if (typeStr.includes('aberração')) {
    return `${nameStr} é uma entidade grotesca e inominável vinda das profundezas do Reino Distante. Sua simples presença perturba o tecido da realidade e distorce a mente de criaturas mortais vulneráveis.`;
  }
  if (typeStr.includes('morto-vivo')) {
    return `${nameStr} é uma abominação necrótica impulsionada pela energia negativa do Plano das Sombras. Consumida pelo desprezo contra os vivos, assombra locais decrépitos em busca de presas indefesas.`;
  }
  if (typeStr.includes('dragão')) {
    return `${nameStr} é um réptil lendário de tremendo poder arcano e físico. Senhor absoluto dos céus e guardião de tesouros lendários, exige obediência e terror de todos que ousam adentrar seu território.`;
  }
  if (typeStr.includes('ínfero')) {
    return `${nameStr} é uma criatura profana nascida nos abismos dos Nove Infernos ou do Caos Absoluto. Especialista em ruína, pactos e destruição, serve como agente da desordem e tirania.`;
  }
  if (typeStr.includes('besta')) {
    return `${nameStr} é um predador feroz que habita os confins selvagens do mundo, agindo puramente por instinto de caça, territorialismo e sobrevivência.`;
  }
  if (typeStr.includes('elemental')) {
    return `${nameStr} é uma corporificação pura da energia primordial elemental (Fogo, Água, Terra ou Ar) invocada a partir dos planos elementares para devastar o mundo físico.`;
  }
  if (typeStr.includes('humanóide')) {
    return `${nameStr} é um combatente astuto que se organiza em bandos, tribos ou exércitos ordenados. Utiliza táticas de emboscada, armas e estratégia de grupo no campo de batalha.`;
  }
  if (typeStr.includes('monstruosidade')) {
    return `${nameStr} é uma criatura aterradora dotada de dons não naturais, resultante de antigas maldições arcanas, metamorfoses profanas ou experimentos alquímicos esquecidos.`;
  }

  return `${nameStr} é uma criatura formidável de tamanho ${monster.size} e alinhamento ${monster.alignment}, respeitada por mestres e temida por aventureiros em todo o reino.`;
}

function getMonsterHabitats(monster: SRDMonster): string[] {
  const typeStr = monster.type.toLowerCase();
  const nameStr = monster.name.toLowerCase();

  if (nameStr.includes('água') || nameStr.includes('merrow') || nameStr.includes('aboleth') || nameStr.includes('sereia') || nameStr.includes('tritão')) {
    return ['Oceano & Abismos Marinhos', 'Lagos Profundos', 'Cavernas Subaquáticas'];
  }
  if (typeStr.includes('morto-vivo') || nameStr.includes('esqueleto') || nameStr.includes('zumbi') || nameStr.includes('lich')) {
    return ['Catacumbas & Criptas', 'Masmorras Abandonadas', 'Cemitérios Antiquados'];
  }
  if (typeStr.includes('dragão') || typeStr.includes('gigante')) {
    return ['Picos Rochosos & Montanhas', 'Guaridas Vulcânicas / Glaciais', 'Altos Vales Selvagens'];
  }
  if (typeStr.includes('ínfero') || typeStr.includes('aberração')) {
    return ['Subterrâneo (Underdark)', 'Planos Infernais / Fenda Abissal', 'Ruínas Arcanas Profundas'];
  }
  if (typeStr.includes('besta') || nameStr.includes('aranha') || nameStr.includes('goblin') || nameStr.includes('orc')) {
    return ['Florestas Fechadas', 'Cavernas Naturais', 'Acampamentos de Fronteira'];
  }

  return ['Masmorras Antigas', 'Ruínas Esquecidas', 'Cavernas Profundas'];
}

export const CompendiumView: React.FC<CompendiumViewProps> = ({ isModal = false, onClose }) => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'monsters' | 'spells' | 'items'>('monsters');

  // Monster Filters State
  const [monsterCrFilter, setMonsterCrFilter] = useState<string>('all');
  const [monsterTypeFilter, setMonsterTypeFilter] = useState<string>('all');
  const [monsterSizeFilter, setMonsterSizeFilter] = useState<string>('all');
  const [monsterAlignmentFilter, setMonsterAlignmentFilter] = useState<string>('all');

  // Spell Filters State
  const [spellLevelFilter, setSpellLevelFilter] = useState<string>('all');
  const [spellSchoolFilter, setSpellSchoolFilter] = useState<string>('all');
  const [spellClassFilter, setSpellClassFilter] = useState<string>('all');
  const [spellRitualOnly, setSpellRitualOnly] = useState<boolean>(false);
  const [spellConcentrationOnly, setSpellConcentrationOnly] = useState<boolean>(false);
  const [spellShapeFilter, setSpellShapeFilter] = useState<string>('all');

  // Item Filters State
  const [itemRarityFilter, setItemRarityFilter] = useState<string>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');

  const [monsters, setMonsters] = useState<SRDMonster[]>(INITIAL_MONSTERS);
  const [spells, setSpells] = useState<SRDSpell[]>(INITIAL_SPELLS);
  const [items, setItems] = useState<SRDItem[]>(INITIAL_ITEMS);

  const [selectedMonster, setSelectedMonster] = useState<SRDMonster | null>(INITIAL_MONSTERS[0] || null);
  const [selectedSpell, setSelectedSpell] = useState<SRDSpell | null>(INITIAL_SPELLS[0] || null);
  const [selectedItem, setSelectedItem] = useState<SRDItem | null>(INITIAL_ITEMS[0] || null);
  const [monsterDetailTab, setMonsterDetailTab] = useState<'narrative' | 'stats'>('narrative');

  // Image Zoom Lightbox Modal Overlay State
  const [zoomedImage, setZoomedImage] = useState<{ url: string; title: string } | null>(null);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Keyboard shortcut ESC to close zoom modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomedImage) {
        setZoomedImage(null);
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

  // Load from srdService (which supports Supabase or fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [fetchedMonsters, fetchedSpells, fetchedItems] = await Promise.all([
          srdService.fetchMonsters({ limit: 1000 }),
          srdService.fetchSpells({ limit: 1000 }),
          srdService.fetchItems({ limit: 1000 }),
        ]);
        if (isMounted) {
          if (fetchedMonsters && fetchedMonsters.length > 0) {
            setMonsters(fetchedMonsters);
            setSelectedMonster(fetchedMonsters[0]);
          }
          if (fetchedSpells && fetchedSpells.length > 0) {
            setSpells(fetchedSpells);
            setSelectedSpell(fetchedSpells[0]);
          }
          if (fetchedItems && fetchedItems.length > 0) {
            setItems(fetchedItems);
            setSelectedItem(fetchedItems[0]);
          }
        }
      } catch (err) {
        console.warn('Error loading compendium data:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setMonsterDetailTab('narrative');
  }, [selectedMonster]);

  // Monster Filtering Logic
  const filteredMonsters = monsters.filter((m) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.size.toLowerCase().includes(q) ||
      m.alignment.toLowerCase().includes(q) ||
      (m.abilities && m.abilities.some((a) => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q))) ||
      (m.actions && m.actions.some((act) => act.name.toLowerCase().includes(q) || act.desc.toLowerCase().includes(q)));

    const matchesType =
      monsterTypeFilter === 'all' || m.type.toLowerCase().includes(monsterTypeFilter.toLowerCase());

    const matchesSize =
      monsterSizeFilter === 'all' || m.size.toLowerCase() === monsterSizeFilter.toLowerCase();

    const matchesAlignment =
      monsterAlignmentFilter === 'all' ||
      m.alignment.toLowerCase().includes(monsterAlignmentFilter.toLowerCase());

    let matchesCr = true;
    if (monsterCrFilter !== 'all') {
      if (monsterCrFilter === 'low') {
        matchesCr = ['0', '1/8', '1/4', '1/2', '1'].includes(m.cr);
      } else if (monsterCrFilter === 'mid') {
        matchesCr = ['2', '3', '4'].includes(m.cr);
      } else if (monsterCrFilter === 'high') {
        matchesCr = ['5', '6', '7', '8', '9', '10'].includes(m.cr);
      } else if (monsterCrFilter === 'legendary') {
        matchesCr = ['11', '12', '13', '14', '15', '16'].includes(m.cr);
      } else if (monsterCrFilter === 'epic') {
        const crNum = parseFloat(m.cr);
        matchesCr = !isNaN(crNum) && crNum >= 17;
      } else {
        matchesCr = m.cr === monsterCrFilter;
      }
    }

    return matchesQuery && matchesType && matchesSize && matchesAlignment && matchesCr;
  });

  // Spell Filtering Logic
  const filteredSpells = spells.filter((s) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.englishName && s.englishName.toLowerCase().includes(q)) ||
      s.school.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);

    const matchesLevel =
      spellLevelFilter === 'all' || String(s.level) === spellLevelFilter;

    const matchesSchool =
      spellSchoolFilter === 'all' || s.school.toLowerCase() === spellSchoolFilter.toLowerCase();

    const matchesClass =
      spellClassFilter === 'all' ||
      (s.classes && s.classes.some((c) => c.toLowerCase().includes(spellClassFilter.toLowerCase())));

    const matchesRitual = !spellRitualOnly || !!s.ritual;
    const matchesConcentration = !spellConcentrationOnly || !!s.concentration;

    const matchesShape =
      spellShapeFilter === 'all' || (s.targetArea && s.targetArea.shape === spellShapeFilter);

    return matchesQuery && matchesLevel && matchesSchool && matchesClass && matchesRitual && matchesConcentration && matchesShape;
  });

  // Item Filtering Logic
  const filteredItems = items.filter((i) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      i.name.toLowerCase().includes(q) ||
      i.rarity.toLowerCase().includes(q) ||
      i.type.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q);

    const matchesRarity =
      itemRarityFilter === 'all' || i.rarity.toLowerCase().includes(itemRarityFilter.toLowerCase());

    const matchesType =
      itemTypeFilter === 'all' || i.type.toLowerCase().includes(itemTypeFilter.toLowerCase());

    return matchesQuery && matchesRarity && matchesType;
  });

  const hasActiveMonsterFilters =
    monsterCrFilter !== 'all' ||
    monsterTypeFilter !== 'all' ||
    monsterSizeFilter !== 'all' ||
    monsterAlignmentFilter !== 'all' ||
    query !== '';

  const hasActiveSpellFilters =
    spellLevelFilter !== 'all' ||
    spellSchoolFilter !== 'all' ||
    spellClassFilter !== 'all' ||
    spellRitualOnly ||
    spellConcentrationOnly ||
    spellShapeFilter !== 'all' ||
    query !== '';

  const hasActiveItemFilters = itemRarityFilter !== 'all' || itemTypeFilter !== 'all' || query !== '';

  const clearMonsterFilters = () => {
    setQuery('');
    setMonsterCrFilter('all');
    setMonsterTypeFilter('all');
    setMonsterSizeFilter('all');
    setMonsterAlignmentFilter('all');
  };

  const clearSpellFilters = () => {
    setQuery('');
    setSpellLevelFilter('all');
    setSpellSchoolFilter('all');
    setSpellClassFilter('all');
    setSpellRitualOnly(false);
    setSpellConcentrationOnly(false);
    setSpellShapeFilter('all');
  };

  const clearItemFilters = () => {
    setQuery('');
    setItemRarityFilter('all');
    setItemTypeFilter('all');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0d14] text-slate-100 overflow-hidden relative">
      {/* Header & Search Bar */}
      <div className="p-4 md:p-5 border-b border-[#2a3449] bg-[#0f141d] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-wide flex items-center gap-2 font-serif">
                Compêndio Completo D&D 5e SRD
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  v5.1
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Biblioteca oficial de monstros, magias e itens mágicos com separação clara de Lore e Fichas de Combate.
              </p>
            </div>
          </div>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#1f2738] rounded-xl transition-all"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search input area */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-amber-400 absolute left-3.5" />
          <input
            type="text"
            autoFocus={isModal}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome, tipo, efeito, habilidade ou palavra-chave..."
            className="w-full bg-[#161c28] border border-[#2a3449] focus:border-amber-500 rounded-xl pl-11 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-200 text-xs bg-[#2a3449]/50 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-[#2a3449]/60 pb-1 -mb-1">
          <button
            onClick={() => setActiveTab('monsters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'monsters'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                : 'bg-[#161c28]/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Monstros</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#2a3449] text-[10px] text-slate-300">
              {filteredMonsters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('spells')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'spells'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                : 'bg-[#161c28]/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Magias</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#2a3449] text-[10px] text-slate-300">
              {filteredSpells.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              activeTab === 'items'
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                : 'bg-[#161c28]/60 border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#161c28]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Itens Mágicos</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#2a3449] text-[10px] text-slate-300">
              {filteredItems.length}
            </span>
          </button>
        </div>

        {/* Dynamic Multi-Filter Toolbar */}
        {activeTab === 'monsters' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 bg-[#0a0d14]/40 p-2.5 rounded-xl border border-[#2a3449]/50 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">Filtros:</span>
            </div>

            {/* CR Filter */}
            <select
              value={monsterCrFilter}
              onChange={(e) => setMonsterCrFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">ND (Todos os Níveis)</option>
              <optgroup label="Faixas de Nível">
                <option value="low">ND 0 a 1 (Iniciante)</option>
                <option value="mid">ND 2 a 4 (Intermediário)</option>
                <option value="high">ND 5 a 10 (Avançado)</option>
                <option value="legendary">ND 11 a 16 (Lendário)</option>
                <option value="epic">ND 17+ (Épico)</option>
              </optgroup>
              <optgroup label="ND Específico">
                {['0', '1/8', '1/4', '1/2', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '24', '30'].map((crVal) => (
                  <option key={crVal} value={crVal}>
                    ND {crVal}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Type Filter */}
            <select
              value={monsterTypeFilter}
              onChange={(e) => setMonsterTypeFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Tipo (Todos)</option>
              <option value="Aberração">Aberração</option>
              <option value="Besta">Besta</option>
              <option value="Celestial">Celestial</option>
              <option value="Construto">Construto</option>
              <option value="Dragão">Dragão</option>
              <option value="Elemental">Elemental</option>
              <option value="Fada">Fada</option>
              <option value="Ínfero">Ínfero</option>
              <option value="Gigante">Gigante</option>
              <option value="Humanóide">Humanóide</option>
              <option value="Monstruosidade">Monstruosidade</option>
              <option value="Limo">Limo</option>
              <option value="Planta">Planta</option>
              <option value="Morto-Vivo">Morto-Vivo</option>
            </select>

            {/* Size Filter */}
            <select
              value={monsterSizeFilter}
              onChange={(e) => setMonsterSizeFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Tamanho (Todos)</option>
              <option value="Miúdo">Miúdo (Tiny)</option>
              <option value="Pequeno">Pequeno (Small)</option>
              <option value="Médio">Médio (Medium)</option>
              <option value="Grande">Grande (Large)</option>
              <option value="Enorme">Enorme (Huge)</option>
              <option value="Imenso">Imenso (Gargantuan)</option>
            </select>

            {/* Alignment Filter */}
            <select
              value={monsterAlignmentFilter}
              onChange={(e) => setMonsterAlignmentFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Alinhamento (Todos)</option>
              <option value="Leal">Tendência Leal</option>
              <option value="Caótico">Tendência Caótica</option>
              <option value="Neutro">Tendência Neutra</option>
              <option value="Bom">Tendência Boa</option>
              <option value="Mau">Tendência Má</option>
              <option value="Sem Alinhamento">Sem Alinhamento</option>
            </select>

            {hasActiveMonsterFilters && (
              <button
                onClick={clearMonsterFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg transition-all font-semibold ml-auto"
                title="Limpar filtros aplicados"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        )}

        {/* Spells Filter Toolbar */}
        {activeTab === 'spells' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 bg-[#0a0d14]/40 p-2.5 rounded-xl border border-[#2a3449]/50 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">Filtros de Magia:</span>
            </div>

            <select
              value={spellLevelFilter}
              onChange={(e) => setSpellLevelFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Nível (Todos)</option>
              <option value="0">Truque (Nível 0)</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                <option key={lvl} value={String(lvl)}>
                  {lvl}º Nível
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={spellClassFilter}
              onChange={(e) => setSpellClassFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Classe (Todas)</option>
              <option value="Bardo">Bardo</option>
              <option value="Bruxo">Bruxo (Warlock)</option>
              <option value="Clérigo">Clérigo</option>
              <option value="Druida">Druida</option>
              <option value="Feiticeiro">Feiticeiro (Sorcerer)</option>
              <option value="Mago">Mago (Wizard)</option>
              <option value="Paladino">Paladino</option>
              <option value="Patrulheiro">Patrulheiro (Ranger)</option>
            </select>

            {/* Shape / Area Filter */}
            <select
              value={spellShapeFilter}
              onChange={(e) => setSpellShapeFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Formato / Área (Todos)</option>
              <option value="cone">📐 Cone / Leque</option>
              <option value="sphere">🟢 Esfera / Baforada</option>
              <option value="line">⚡ Linha</option>
              <option value="cube">🧊 Cubo</option>
              <option value="cylinder">🏛️ Cilindro</option>
              <option value="single_target">🎯 Alvo Único</option>
              <option value="multiple_targets">🎯🎯 Múltiplos Alvos</option>
              <option value="touch">🖐️ Toque</option>
              <option value="self">👤 Pessoal (Si Mesmo)</option>
            </select>

            {/* Toggles */}
            <button
              type="button"
              onClick={() => setSpellRitualOnly(!spellRitualOnly)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                spellRitualOnly
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow'
                  : 'bg-[#161c28] text-slate-400 border-[#2a3449] hover:text-slate-200'
              }`}
            >
              <span>📜</span>
              <span>Apenas Rituais</span>
            </button>

            <button
              type="button"
              onClick={() => setSpellConcentrationOnly(!spellConcentrationOnly)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                spellConcentrationOnly
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/60 shadow'
                  : 'bg-[#161c28] text-slate-400 border-[#2a3449] hover:text-slate-200'
              }`}
            >
              <span>🧘</span>
              <span>Concentração</span>
            </button>

            {hasActiveSpellFilters && (
              <button
                onClick={clearSpellFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg transition-all font-semibold ml-auto"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        )}

        {/* Items Filter Toolbar */}
        {activeTab === 'items' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 bg-[#0a0d14]/40 p-2.5 rounded-xl border border-[#2a3449]/50 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-wider">Filtros de Itens:</span>
            </div>

            <select
              value={itemRarityFilter}
              onChange={(e) => setItemRarityFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Raridade (Todas)</option>
              <option value="Comum">Comum</option>
              <option value="Incomum">Incomum</option>
              <option value="Raro">Rara</option>
              <option value="Muito Raro">Muito Rara</option>
              <option value="Lendário">Lendária</option>
              <option value="Artefato">Artefato</option>
            </select>

            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="bg-[#161c28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer font-medium"
            >
              <option value="all">Tipo (Todos)</option>
              <option value="Arma">Arma</option>
              <option value="Armadura">Armadura</option>
              <option value="Poção">Poção</option>
              <option value="Anel">Anel</option>
              <option value="Varinha">Varinha</option>
              <option value="Cajado">Cajado</option>
              <option value="Pergaminho">Pergaminho</option>
              <option value="Maravilhoso">Item Maravilhoso</option>
            </select>

            {hasActiveItemFilters && (
              <button
                onClick={clearItemFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-lg transition-all font-semibold ml-auto"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Split Pane */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left List Pane */}
        <div className="md:col-span-4 lg:col-span-3 border-r border-[#2a3449] overflow-y-auto p-3 space-y-1.5 bg-[#0f141d]/60 custom-scrollbar">
          {activeTab === 'monsters' &&
            (filteredMonsters.length > 0 ? (
              filteredMonsters.map((m) => (
                <button
                  key={m.id || m.name}
                  onClick={() => setSelectedMonster(m)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedMonster?.name === m.name
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-md'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-medium">{m.name}</span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 border border-amber-500/20 shrink-0">
                      ND {m.cr}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{m.type}</span>
                    <span>{m.size}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FilterX className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p>Nenhum monstro encontrado com os filtros selecionados.</p>
                <button
                  onClick={clearMonsterFilters}
                  className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-bold transition-all border border-amber-500/40"
                >
                  Limpar todos os filtros
                </button>
              </div>
            ))}

          {activeTab === 'spells' &&
            (filteredSpells.length > 0 ? (
              filteredSpells.map((s) => (
                <button
                  key={s.id || s.name}
                  onClick={() => setSelectedSpell(s)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedSpell?.name === s.name
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-md'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-medium">{s.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700 shrink-0">
                      {s.level === 0 ? 'Truque' : `${s.level}º Nível`}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{s.school}</div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FilterX className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p>Nenhuma magia encontrada com os filtros selecionados.</p>
                <button
                  onClick={clearSpellFilters}
                  className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-bold transition-all border border-amber-500/40"
                >
                  Limpar filtros
                </button>
              </div>
            ))}

          {activeTab === 'items' &&
            (filteredItems.length > 0 ? (
              filteredItems.map((i) => (
                <button
                  key={i.id || i.name}
                  onClick={() => setSelectedItem(i)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    selectedItem?.name === i.name
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold shadow-md'
                      : 'bg-[#161c28] text-slate-300 border-[#2a3449] hover:bg-[#1f2738] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-medium">{i.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 shrink-0">{i.rarity}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">{i.type}</div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <FilterX className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p>Nenhum item encontrado com os filtros selecionados.</p>
                <button
                  onClick={clearItemFilters}
                  className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[11px] font-bold transition-all border border-amber-500/40"
                >
                  Limpar filtros
                </button>
              </div>
            ))}
        </div>

        {/* Right Details Pane - Premium Diagrammed View */}
        <div className="md:col-span-8 lg:col-span-9 p-6 overflow-y-auto bg-[#161c28] custom-scrollbar">
          {activeTab === 'monsters' && selectedMonster && (
            <div className="space-y-6">
              {/* Header Hero Banner */}
              <div className="border-b border-[#2a3449] pb-5 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-[#0f141d] to-transparent p-4 rounded-2xl border border-[#2a3449]/80 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-extrabold text-amber-100 font-serif tracking-wide">
                      {selectedMonster.name}
                    </h2>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ND {selectedMonster.cr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium italic">
                    {selectedMonster.size} • {selectedMonster.type} • {selectedMonster.alignment}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 bg-[#161c28] border border-[#2a3449] rounded-xl text-center shadow-inner">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Nível de Desafio</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">ND {selectedMonster.cr} ({selectedMonster.xp} XP)</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#161c28] border border-[#2a3449] rounded-xl text-center shadow-inner">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Proficiência</span>
                    <span className="text-xs font-bold text-slate-200 font-mono">+{getProficiencyBonusByCR(selectedMonster.cr)}</span>
                  </div>
                </div>
              </div>

              {/* Sub-tabs with CLEAN & DISTINCT PURPOSE */}
              <div className="flex border-b border-[#2a3449] bg-[#0a0d14]/60 p-1 rounded-xl">
                <button
                  onClick={() => setMonsterDetailTab('narrative')}
                  className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 ${
                    monsterDetailTab === 'narrative'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Lore, Arte & Ecologia</span>
                </button>
                <button
                  onClick={() => setMonsterDetailTab('stats')}
                  className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg flex items-center justify-center gap-2 ${
                    monsterDetailTab === 'stats'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  <span>Ficha de Combate (Estatísticas Completas)</span>
                </button>
              </div>

              {/* TAB 1: PURE LORE, ART & ECOLOGY */}
              {monsterDetailTab === 'narrative' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Featured Artwork Showcase Box */}
                    <div className="lg:col-span-5 flex flex-col bg-[#0a0d14] border border-amber-500/30 rounded-2xl p-4 shadow-xl relative overflow-hidden group">
                      <div className="flex items-center justify-between mb-3 border-b border-[#2a3449]/80 pb-2">
                        <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" /> Token de Combate 2D High-Res
                        </span>
                        <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-md">
                          Zoom
                        </span>
                      </div>

                      {/* Clickable Image Showcase Container */}
                      <div
                        onClick={() => {
                          const tokenUrl = selectedMonster.tokenImageUrl || `/assets/2d/Monstros/${selectedMonster.name}.png`;
                          setZoomedImage({ url: tokenUrl, title: selectedMonster.name });
                        }}
                        className="flex-1 w-full min-h-[220px] max-h-[300px] rounded-xl overflow-hidden bg-slate-950 border border-[#2a3449] flex items-center justify-center p-4 relative cursor-pointer transition-all duration-300 group-hover:border-amber-500/60 shadow-2xl"
                      >
                        <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />

                        {(() => {
                          const tokenUrl = selectedMonster.tokenImageUrl || `/assets/2d/Monstros/${selectedMonster.name}.png`;
                          return (
                            <img
                              src={tokenUrl}
                              alt={selectedMonster.name}
                              className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_15px_rgba(245,158,11,0.35)] transition-transform duration-300 group-hover:scale-110 relative z-10"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.onerror = null;
                                target.src = '/assets/2d/Monstros/Goblin.png';
                              }}
                            />
                          );
                        })()}

                        {/* Hover Overlay Badge */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 text-amber-300 z-20">
                          <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/50 shadow-lg">
                            <ZoomIn className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="text-xs font-bold tracking-wide text-slate-100">Ampliar Arte em Zoom</span>
                        </div>
                      </div>
                    </div>

                    {/* Ecology & Habitat Summary */}
                    <div className="lg:col-span-7 flex flex-col justify-between bg-[#0a0d14]/70 p-5 rounded-2xl border border-[#2a3449] shadow-lg space-y-4">
                      <div>
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-amber-400" /> Classificação & Ecologia
                        </h3>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Tamanho & Categoria</span>
                            <span className="font-bold text-slate-200">{selectedMonster.size} ({selectedMonster.type})</span>
                          </div>
                          <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Alinhamento Moral</span>
                            <span className="font-bold text-slate-200">{selectedMonster.alignment}</span>
                          </div>
                          <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Deslocamento Base</span>
                            <span className="font-bold text-amber-300 font-mono">{selectedMonster.speed}</span>
                          </div>
                          <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Nível de Desafio</span>
                            <span className="font-bold text-amber-400 font-mono">ND {selectedMonster.cr} ({selectedMonster.xp} XP)</span>
                          </div>
                        </div>
                      </div>

                      {/* Preferred Habitats */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" /> Terrenos e Habitats Típicos:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {getMonsterHabitats(selectedMonster).map((habitat, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 bg-[#161c28] border border-amber-500/30 text-amber-300 text-[11px] font-semibold rounded-lg"
                            >
                              {habitat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Narrative Lore Card */}
                  <div className="bg-[#0a0d14]/70 p-5 rounded-2xl border border-[#2a3449] space-y-3 shadow-lg">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-amber-400" /> Descrição Narrativa & História (Lore RPG):
                    </h4>
                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-wrap bg-[#161c28] p-4 rounded-xl border border-[#2a3449]/70">
                      {getMonsterLoreDescription(selectedMonster)}
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: COMPLETE COMBAT STATBLOCK */}
              {monsterDetailTab === 'stats' && (
                <div className="space-y-6">
                  {/* Key vitals row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-[#0a0d14] rounded-2xl border border-[#2a3449] text-center shadow-md">
                      <Shield className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Classe de Armadura
                      </span>
                      <span className="text-xl font-extrabold text-cyan-400 font-mono">{selectedMonster.ac}</span>
                    </div>
                    <div className="p-4 bg-[#0a0d14] rounded-2xl border border-[#2a3449] text-center shadow-md">
                      <Heart className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Pontos de Vida
                      </span>
                      <span className="text-xl font-extrabold text-rose-400 font-mono">{selectedMonster.hp}</span>
                    </div>
                    <div className="p-4 bg-[#0a0d14] rounded-2xl border border-[#2a3449] text-center shadow-md">
                      <Zap className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Deslocamento
                      </span>
                      <span className="text-xs font-bold text-amber-300 font-mono truncate block mt-1">
                        {selectedMonster.speed}
                      </span>
                    </div>
                    <div className="p-4 bg-[#0a0d14] rounded-2xl border border-[#2a3449] text-center shadow-md">
                      <Eye className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Percepção Passiva
                      </span>
                      <span className="text-xl font-extrabold text-emerald-400 font-mono">
                        {10 + Math.floor((selectedMonster.wis - 10) / 2)}
                      </span>
                    </div>
                  </div>

                  {/* Attributes Table */}
                  <div className="bg-[#0a0d14]/70 p-4 rounded-2xl border border-[#2a3449]">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                      Pontuação de Atributos & Modificadores de Combate:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { label: 'FOR', val: selectedMonster.str },
                        { label: 'DES', val: selectedMonster.dex },
                        { label: 'CON', val: selectedMonster.con },
                        { label: 'INT', val: selectedMonster.int },
                        { label: 'SAB', val: selectedMonster.wis },
                        { label: 'CAR', val: selectedMonster.cha },
                      ].map((attr) => {
                        const mod = Math.floor((attr.val - 10) / 2);
                        const modSign = mod >= 0 ? '+' : '';
                        return (
                          <div
                            key={attr.label}
                            className="text-center p-3 bg-[#161c28] rounded-xl border border-[#2a3449]/70"
                          >
                            <span className="text-[10px] font-bold text-slate-400 block">{attr.label}</span>
                            <span className="text-base font-bold text-slate-100 block font-mono">{attr.val}</span>
                            <span className="text-xs text-amber-400 font-semibold font-mono">{`${modSign}${mod}`}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Special Abilities */}
                  {selectedMonster.abilities && selectedMonster.abilities.length > 0 && (
                    <div className="space-y-3 bg-[#0a0d14]/70 p-5 rounded-2xl border border-[#2a3449]">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Habilidades Especiais (Traits):
                      </h4>
                      <div className="space-y-2">
                        {selectedMonster.abilities.map((ab, idx) => (
                          <div
                            key={idx}
                            className="bg-[#161c28] p-4 rounded-xl border border-[#2a3449]/80 space-y-1"
                          >
                            <span className="font-bold text-xs text-amber-200">{ab.name}: </span>
                            <span className="text-xs text-slate-300 leading-relaxed">{ab.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Combat Actions with Interactive Rolls */}
                  {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                    <div className="space-y-3 bg-[#0a0d14]/70 p-5 rounded-2xl border border-[#2a3449]">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                          <Swords className="w-4 h-4 text-amber-400" /> Ações de Ataque & Combate Interativas:
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Clique em Rolar para executar a rolar de dados
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {selectedMonster.actions.map((act, idx) => {
                          const atkMatch = act.desc.match(/\+([0-9]+)/);
                          const bonus = atkMatch ? parseInt(atkMatch[1]) : Math.floor(((selectedMonster.str || 10) - 10) / 2);
                          const bonusStr = bonus >= 0 ? `+${bonus}` : `${bonus}`;
                          
                          // Extract damage formula e.g. (2d6 + 5)
                          const dmgMatch = act.desc.match(/\(([^)]+)\)/);
                          const damageFormula = dmgMatch ? dmgMatch[1] : null;

                          return (
                            <div
                              key={idx}
                              className="bg-[#161c28] p-4 rounded-xl border border-[#2a3449]/80 space-y-2.5 transition-all hover:border-amber-500/40"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2a3449]/60 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-sm text-amber-200 font-serif">{act.name}</span>
                                  {atkMatch && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                      Ataque {bonusStr}
                                    </span>
                                  )}
                                  {damageFormula && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      Dano ({damageFormula})
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const d20 = Math.floor(Math.random() * 20) + 1;
                                    const total = d20 + bonus;
                                    const isCrit = d20 === 20;
                                    const isFail = d20 === 1;

                                    useLiveCockpitStudioStore.getState().setBg3DiceOverlay({
                                      title: `Ataque: ${act.name}`,
                                      subtitle: selectedMonster.name,
                                      actorName: selectedMonster.name,
                                      d20Roll: d20,
                                      selectedD20Roll: d20,
                                      modifier: bonus,
                                      totalRoll: total,
                                      isCrit,
                                      isFail,
                                      damageDiceFormula: damageFormula || undefined,
                                      isRolling: true,
                                      phase: 'd20',
                                    });

                                    toast.success(`Rolagem de ${act.name} para ${selectedMonster.name}: D20 (${d20}) ${bonusStr} = Total ${total}`);
                                  }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-slate-950 font-black text-xs rounded-lg shadow-md flex items-center gap-1.5 transition-all active:scale-95 border border-rose-400/40 cursor-pointer"
                                  title={`Rolar teste de ataque para ${act.name}`}
                                >
                                  <Swords className="w-3.5 h-3.5 text-slate-950" />
                                  <span>Rolar Ataque ({bonusStr})</span>
                                </button>
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed font-sans">{act.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'spells' && selectedSpell && (
            <div className="space-y-6">
              {/* Header Hero Banner */}
              <div className="border-b border-[#2a3449] pb-5 flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-[#0f141d] to-transparent p-4 rounded-2xl border border-[#2a3449]/80 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-3xl font-extrabold text-amber-100 font-serif tracking-wide">
                      {selectedSpell.name}
                    </h2>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {selectedSpell.level === 0 ? 'Truque' : `${selectedSpell.level}º Nível`}
                    </span>
                  </div>
                  {selectedSpell.englishName && (
                    <p className="text-xs text-slate-400 font-mono italic">
                      Original: {selectedSpell.englishName}
                    </p>
                  )}
                  <p className="text-xs text-amber-400 font-semibold pt-1">
                    Escola de {selectedSpell.school}
                  </p>
                </div>

                {/* Class badges */}
                {selectedSpell.classes && selectedSpell.classes.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 max-w-xs justify-end">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block w-full text-right mb-0.5">Classes de Conjurador:</span>
                    {selectedSpell.classes.map((cls, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#161c28] border border-amber-500/30 text-amber-300 text-[10px] font-bold rounded-md shadow-sm"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid de Metadados Detalhados */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#0a0d14] p-3.5 rounded-xl border border-[#2a3449] space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Tempo de Conjuração
                  </span>
                  <span className="font-bold text-slate-200">{selectedSpell.castingTime}</span>
                </div>

                <div className="bg-[#0a0d14] p-3.5 rounded-xl border border-[#2a3449] space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Alcance
                  </span>
                  <span className="font-bold text-slate-200">{selectedSpell.range}</span>
                </div>

                <div className="bg-[#0a0d14] p-3.5 rounded-xl border border-[#2a3449] space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Duração
                  </span>
                  <span className="font-bold text-slate-200">{selectedSpell.duration}</span>
                </div>

                <div className="bg-[#0a0d14] p-3.5 rounded-xl border border-[#2a3449] space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Concentração & Ritual
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${selectedSpell.concentration ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {selectedSpell.concentration ? '🧘 Concentração' : 'Sem Concentração'}
                    </span>
                    {selectedSpell.ritual && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[10px] font-bold">
                        📜 Ritual
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 2: Componentes & Formato da Área */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Componentes (V, S, M) */}
                <div className="bg-[#0a0d14]/70 p-4 rounded-2xl border border-[#2a3449] space-y-2.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    🧪 Componentes & Ingredientes
                  </span>
                  {(() => {
                    const comp = typeof selectedSpell.components === 'object' ? selectedSpell.components : null;
                    const rawText = typeof selectedSpell.components === 'string' ? selectedSpell.components : comp?.raw || '';
                    const isV = comp ? comp.verbal : rawText.includes('V');
                    const isS = comp ? comp.somatic : rawText.includes('S');
                    const isM = comp ? comp.material : rawText.includes('M');
                    const matDesc = comp?.materialsDescription || (rawText.includes('(') ? rawText.substring(rawText.indexOf('(') + 1, rawText.indexOf(')')) : null);

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-mono font-black border ${isV ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-600 border-slate-800 opacity-40'}`}>
                            V (Verbal)
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs font-mono font-black border ${isS ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-600 border-slate-800 opacity-40'}`}>
                            S (Somático/Gestual)
                          </span>
                          <span className={`px-2 py-1 rounded-md text-xs font-mono font-black border ${isM ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-600 border-slate-800 opacity-40'}`}>
                            M (Material)
                          </span>
                        </div>
                        {matDesc && (
                          <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449] text-xs space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase block">Materiais Exigidos:</span>
                            <p className="text-slate-300 italic">{matDesc}</p>
                            {comp?.costly && (
                              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded">
                                💰 Requer Ingrediente Valioso com Custo em PO
                              </span>
                            )}
                            {comp?.consumed && (
                              <span className="inline-block mt-1 ml-1 text-[10px] font-bold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded">
                                🔥 Material Consumido na Conjuração
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Formato / Área de Efeito */}
                <div className="bg-[#0a0d14]/70 p-4 rounded-2xl border border-[#2a3449] space-y-2.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    📐 Formato & Área de Efeito
                  </span>
                  {(() => {
                    const area = selectedSpell.targetArea;
                    const shape = area?.shape;
                    let shapeLabel = 'Alvo / Área';
                    let shapeIcon = '🎯';
                    if (shape === 'cone') { shapeLabel = 'Cone / Leque'; shapeIcon = '📐'; }
                    else if (shape === 'sphere') { shapeLabel = 'Esfera / Baforada'; shapeIcon = '🟢'; }
                    else if (shape === 'line') { shapeLabel = 'Linha'; shapeIcon = '⚡'; }
                    else if (shape === 'cube') { shapeLabel = 'Cubo'; shapeIcon = '🧊'; }
                    else if (shape === 'cylinder') { shapeLabel = 'Cilindro'; shapeIcon = '🏛️'; }
                    else if (shape === 'wall') { shapeLabel = 'Parede / Muralha'; shapeIcon = '🧱'; }
                    else if (shape === 'single_target') { shapeLabel = 'Alvo Único'; shapeIcon = '🎯'; }
                    else if (shape === 'multiple_targets') { shapeLabel = 'Múltiplos Alvos'; shapeIcon = '🎯🎯'; }
                    else if (shape === 'touch') { shapeLabel = 'Toque'; shapeIcon = '🖐️'; }
                    else if (shape === 'self') { shapeLabel = 'Pessoal (Si Mesmo)'; shapeIcon = '👤'; }

                    return (
                      <div className="space-y-2 text-xs">
                        <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Tipo / Formato</span>
                            <span className="font-bold text-slate-200 text-sm">{shapeIcon} {shapeLabel}</span>
                          </div>
                          {area?.formatted && (
                            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              {area.formatted}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Dano / Salvaguarda / Rolagem de Dados Interativa */}
              {selectedSpell.damageSave && (selectedSpell.damageSave.damageDice || selectedSpell.damageSave.saveStat) && (
                <div className="bg-[#0a0d14]/70 p-4 rounded-2xl border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      ⚔️ Mecanismos de Ataque, Dano & Salvaguarda
                    </span>
                    {selectedSpell.damageSave.damageDice && (
                      <button
                        type="button"
                        onClick={() => {
                          const diceFormula = selectedSpell.damageSave?.damageDice || '1d6';
                          useLiveCockpitStudioStore.getState().setBg3DiceOverlay({
                            title: `Efeito de Magia: ${selectedSpell.name}`,
                            subtitle: `${selectedSpell.level === 0 ? 'Truque' : selectedSpell.level + 'º Nível'} - ${selectedSpell.damageSave?.damageType || 'Magia'}`,
                            actorName: 'Conjurador',
                            d20Roll: 15,
                            selectedD20Roll: 15,
                            modifier: 0,
                            totalRoll: 15,
                            damageDiceFormula: diceFormula,
                            isRolling: true,
                            phase: 'damage',
                          });
                          toast.success(`Executando rolagem de dano (${diceFormula}) para ${selectedSpell.name}`);
                        }}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <Swords className="w-3.5 h-3.5 text-slate-950" />
                        <span>Rolar Dano ({selectedSpell.damageSave.damageDice})</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    {selectedSpell.damageSave.damageDice && (
                      <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Dado de Dano / Cura</span>
                        <span className="font-bold text-amber-300 font-mono text-sm">{selectedSpell.damageSave.damageDice} ({selectedSpell.damageSave.damageType || 'Magia'})</span>
                      </div>
                    )}
                    {selectedSpell.damageSave.saveStat && (
                      <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Teste de Resistência (TR)</span>
                        <span className="font-bold text-rose-300 font-mono text-sm">TR de {selectedSpell.damageSave.saveStat}</span>
                      </div>
                    )}
                    {selectedSpell.damageSave.attackType && (
                      <div className="bg-[#161c28] p-3 rounded-xl border border-[#2a3449]">
                        <span className="text-[10px] text-slate-400 uppercase block font-semibold">Tipo de Ataque</span>
                        <span className="font-bold text-slate-200 capitalize">
                          {selectedSpell.damageSave.attackType === 'ranged_spell' ? 'Ataque Mágico à Distância' : selectedSpell.damageSave.attackType === 'melee_spell' ? 'Ataque Mágico Corpo a Corpo' : selectedSpell.damageSave.attackType === 'save' ? 'Teste de Resistência' : 'Utilidade / Suporte'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Descrição Principal da Magia */}
              <div className="bg-[#0a0d14] p-5 rounded-2xl border border-[#2a3449] space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efeito Completo da Magia:</h4>
                <p className="text-sm text-slate-200 leading-relaxed font-serif whitespace-pre-wrap">
                  {selectedSpell.description}
                </p>
              </div>

              {/* Em Níveis Superiores */}
              {selectedSpell.higherLevels && (
                <div className="bg-gradient-to-r from-amber-500/10 via-[#0a0d14] to-transparent p-4 rounded-2xl border border-amber-500/40 space-y-1.5 shadow-md">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Em Níveis Superiores:
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans italic">
                    {selectedSpell.higherLevels}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'items' && selectedItem && (
            <div className="space-y-5">
              <div className="border-b border-[#2a3449] pb-4">
                <h2 className="text-2xl font-bold text-slate-100 font-serif">{selectedItem.name}</h2>
                <p className="text-xs text-amber-400 font-semibold mt-1">
                  {selectedItem.type} • Raridade: {selectedItem.rarity}
                </p>
              </div>

              <div className="bg-[#0a0d14] p-5 rounded-2xl border border-[#2a3449] space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição:</h4>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-serif">
                  {selectedItem.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL OVERLAY (ZOOM ARTE) */}
      {zoomedImage && (
        <div
          onClick={() => {
            setZoomedImage(null);
            setZoomScale(1);
          }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#161c28] border border-amber-500/40 rounded-3xl max-w-4xl max-h-[90vh] w-full p-6 flex flex-col items-center justify-between shadow-2xl relative overflow-hidden animate-scale-in cursor-default"
          >
            {/* Header controls */}
            <div className="w-full flex items-center justify-between border-b border-[#2a3449] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-slate-100 font-serif">{zoomedImage.title}</h3>
                <span className="text-xs text-slate-400 font-mono">(Arte Expandida em Alta Resolução)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale((prev) => Math.min(prev + 0.25, 2.5))}
                  className="p-2 bg-[#0a0d14] hover:bg-[#1f2738] text-amber-400 rounded-lg border border-[#2a3449] transition-all"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale((prev) => Math.max(prev - 0.25, 0.75))}
                  className="p-2 bg-[#0a0d14] hover:bg-[#1f2738] text-amber-400 rounded-lg border border-[#2a3449] transition-all"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="px-2 py-1 bg-[#0a0d14] hover:bg-[#1f2738] text-slate-300 text-xs font-mono rounded-lg border border-[#2a3449] transition-all"
                >
                  Reset
                </button>
                <button
                  onClick={() => {
                    setZoomedImage(null);
                    setZoomScale(1);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-100 hover:bg-[#1f2738] rounded-lg transition-all ml-2"
                  title="Fechar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image viewer container */}
            <div className="w-full flex-1 min-h-[350px] max-h-[60vh] overflow-auto flex items-center justify-center bg-slate-950/80 rounded-2xl border border-[#2a3449]/60 p-6 relative">
              <img
                src={zoomedImage.url}
                alt={zoomedImage.title}
                style={{ transform: `scale(${zoomScale})` }}
                className="max-w-full max-h-[55vh] object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-transform duration-200"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.onerror = null;
                  target.src = '/assets/2d/Monstros/Goblin.png';
                }}
              />
            </div>

            {/* Footer instruction */}
            <div className="mt-4 text-center">
              <span className="text-xs text-slate-400">
                Pressione <kbd className="px-1.5 py-0.5 bg-[#0a0d14] border border-[#2a3449] rounded text-[10px] font-mono">Esc</kbd> ou clique fora da janela para fechar a visualização.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
