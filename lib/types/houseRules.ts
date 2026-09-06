export type HouseRuleCategory = 'combat' | 'potions' | 'rest' | 'dice' | 'magic' | 'general' | 'custom';

export type HouseRuleImpact = 'buff' | 'nerf' | 'tactical' | 'gritty' | 'comfort' | 'flavor';

export interface HouseRuleItem {
  id: string;
  title: string;
  description: string;
  category: HouseRuleCategory;
  impact?: HouseRuleImpact;
  isActive: boolean;
  isPreset?: boolean;
  source?: string;
  createdAt?: string;
}

export interface HouseRuleCategoryMeta {
  id: HouseRuleCategory;
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}

export const HOUSE_RULE_CATEGORIES: Record<HouseRuleCategory, HouseRuleCategoryMeta> = {
  combat: {
    id: 'combat',
    label: 'Combate & Tática',
    icon: 'Swords',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
  },
  potions: {
    id: 'potions',
    label: 'Poções & Itens',
    icon: 'Wine',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  rest: {
    id: 'rest',
    label: 'Descanso & Sobrevivência',
    icon: 'Moon',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
  },
  dice: {
    id: 'dice',
    label: 'Rolagens & Críticos',
    icon: 'Dice5',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  magic: {
    id: 'magic',
    label: 'Magia & Conjuração',
    icon: 'Sparkles',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
  },
  general: {
    id: 'general',
    label: 'Mecânicas Gerais',
    icon: 'Scroll',
    color: 'text-slate-300',
    bg: 'bg-slate-700/20',
    border: 'border-slate-600/30',
  },
  custom: {
    id: 'custom',
    label: 'Personalizadas',
    icon: 'BookMarked',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
};

export const HOUSE_RULE_IMPACT_LABELS: Record<HouseRuleImpact, { label: string; badgeClass: string }> = {
  buff: { label: 'Buff / Vantagem', badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
  nerf: { label: 'Desafio Maior', badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
  tactical: { label: 'Foco Tático', badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
  gritty: { label: 'Realismo Brutal', badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
  comfort: { label: 'Agilidade / QoL', badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/40' },
  flavor: { label: 'Narrativo / RP', badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40' },
};

export const COMMUNITY_HOUSE_RULE_PRESETS: Omit<HouseRuleItem, 'isActive' | 'createdAt'>[] = [
  {
    id: 'preset-potion-bonus-action',
    title: 'Poção de Cura como Ação Bônus',
    description: 'Beber uma poção de cura no próprio turno custa apenas uma Ação Bônus. Administrar a poção a um aliado inconsciente continua custando uma Ação normal.',
    category: 'potions',
    impact: 'comfort',
    isPreset: true,
    source: 'Popular 5e / One D&D',
  },
  {
    id: 'preset-brutal-critical',
    title: 'Acerto Crítico Brutal (Dano Máximo + Rolagem)',
    description: 'Em acertos críticos, o 1º conjunto de dados de dano da arma/ataque causa dano máximo automaticamente. Em seguida, rola-se o dado adicional normalmente e soma-se o modificador.',
    category: 'dice',
    impact: 'buff',
    isPreset: true,
    source: 'Popular 5e',
  },
  {
    id: 'preset-tactical-flanking',
    title: 'Flanking Tático (+2 no Ataque ao invés de Vantagem)',
    description: 'Flanquear um inimigo com um aliado adjacente oposto concede um bônus estático de +2 nas jogadas de ataque corpo a corpo, evitando sobrepor mecânicas de Vantagem.',
    category: 'combat',
    impact: 'tactical',
    isPreset: true,
    source: 'D&D DMG Opcional',
  },
  {
    id: 'preset-gritty-rest',
    title: 'Descanso Realista & Sobrevivência (Gritty Realism)',
    description: 'Um Descanso Curto exige 8 horas de repouso leve. Um Descanso Longo exige 7 dias de repouso em um local seguro (cidade/acampamento fortificado).',
    category: 'rest',
    impact: 'gritty',
    isPreset: true,
    source: 'D&D 5e DMG',
  },
  {
    id: 'preset-secret-death-saves',
    title: 'Salvaguardas Contra a Morte Secretas',
    description: 'Os testes de resistência contra a morte são rolados em segredo pelo Mestre ou pelo jogador em mensagem oculta, aumentando a tensão e urgência para o grupo.',
    category: 'combat',
    impact: 'gritty',
    isPreset: true,
    source: 'Mestres Veteranos',
  },
  {
    id: 'preset-stacked-inspiration',
    title: 'Inspiração Cumulativa & Partilhável',
    description: 'Jogadores podem acumular até 3 fichas de Inspiração Heróica. Uma Inspiração pode ser transferida para um companheiro ou gasta para adicionar 1d6 a qualquer rolagem após ver o resultado.',
    category: 'dice',
    impact: 'buff',
    isPreset: true,
    source: 'One D&D Inspirado',
  },
  {
    id: 'preset-out-of-combat-healing-max',
    title: 'Cura Máxima Fora de Combate',
    description: 'Ao consumir poções de cura ou gastar Dados de Vida durante descansos curtos em áreas seguras fora de perigo imediato, utiliza-se o valor máximo dos dados sem necessidade de rolar.',
    category: 'potions',
    impact: 'comfort',
    isPreset: true,
    source: 'House Rule QoL',
  },
  {
    id: 'preset-bonus-action-spells',
    title: 'Conjuração Fluida de Magias',
    description: 'Se você conjurar uma magia com Ação Bônus, você ainda pode conjurar outra magia com sua Ação regular se pelo menos uma delas for de 2º círculo ou inferior.',
    category: 'magic',
    impact: 'buff',
    isPreset: true,
    source: 'Mesa Aberta',
  },
];

/**
 * Converte regras antigas que eram strings simples para a estrutura completa de HouseRuleItem
 */
export function normalizeHouseRules(rules: any[]): HouseRuleItem[] {
  if (!Array.isArray(rules)) return [];
  return rules.map((r, idx) => {
    if (typeof r === 'string') {
      let category: HouseRuleCategory = 'custom';
      let impact: HouseRuleImpact = 'flavor';
      const lower = r.toLowerCase();

      if (lower.includes('poção') || lower.includes('pocao') || lower.includes('cura')) {
        category = 'potions';
        impact = 'comfort';
      } else if (lower.includes('crítico') || lower.includes('critico') || lower.includes('dado')) {
        category = 'dice';
        impact = 'buff';
      } else if (lower.includes('descanso') || lower.includes('sono') || lower.includes('fome')) {
        category = 'rest';
        impact = 'gritty';
      } else if (lower.includes('ataque') || lower.includes('combate') || lower.includes('morte') || lower.includes('flank')) {
        category = 'combat';
        impact = 'tactical';
      } else if (lower.includes('magia') || lower.includes('conjurar') || lower.includes('slot')) {
        category = 'magic';
        impact = 'buff';
      }

      // Tenta extrair título se houver emoji ou pontuação
      const cleanText = r.replace(/^[\p{Emoji}\s]+/u, '').trim();
      const parts = cleanText.split(/[:\-(]/);
      const title = parts[0]?.trim() || `Regra da Casa #${idx + 1}`;
      const description = r;

      return {
        id: `rule-legacy-${idx}-${Date.now()}`,
        title,
        description,
        category,
        impact,
        isActive: true,
        isPreset: false,
        createdAt: new Date().toISOString(),
      };
    }

    return {
      id: r.id || `rule-${idx}`,
      title: r.title || 'Regra Sem Título',
      description: r.description || '',
      category: r.category || 'custom',
      impact: r.impact || 'flavor',
      isActive: r.isActive !== false,
      isPreset: !!r.isPreset,
      source: r.source || 'Mestre da Mesa',
      createdAt: r.createdAt || new Date().toISOString(),
    };
  });
}
