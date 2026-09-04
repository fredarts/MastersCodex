import { ALL_SRD_SPELLS } from './srd-spells-data';
import { SRD_SPELLS } from './srd-compendium';
import { ALL_SRD_ITEMS } from './srd-items-data';
import { BATCH_1_MONSTERS } from './srd-monsters-batch-1';
import { BATCH_2_MONSTERS } from './srd-monsters-batch-2';
import { BATCH_3_MONSTERS } from './srd-monsters-batch-3';
import { BATCH_4_MONSTERS } from './srd-monsters-batch-4';
import { BATCH_5_MONSTERS } from './srd-monsters-batch-5';
import { CONDITIONS, INITIAL_MONSTERS } from './srd-data';
import { Combatant, ConditionType, SRDMonster, SRDSpell, SRDItem } from './types';

// Unificação de todas as magias da SRD
const CONSOLIDATED_SPELLS: SRDSpell[] = Array.from(
  new Map([...SRD_SPELLS, ...ALL_SRD_SPELLS].map((s) => [s.name.toLowerCase(), s])).values()
);

// Unificação de todos os monstros da SRD em memória para busca O(1) com memoização
const ALL_MONSTERS: SRDMonster[] = [
  ...INITIAL_MONSTERS,
  ...BATCH_1_MONSTERS,
  ...BATCH_2_MONSTERS,
  ...BATCH_3_MONSTERS,
  ...BATCH_4_MONSTERS,
  ...BATCH_5_MONSTERS,
];

// Deduplicação por nome
const UNIQUE_MONSTERS: SRDMonster[] = Array.from(
  new Map(ALL_MONSTERS.map((m) => [m.name.toLowerCase(), m])).values()
);

export type OmnibarCategory =
  | 'dice'
  | 'combatant'
  | 'condition'
  | 'audio'
  | 'spell'
  | 'monster'
  | 'item'
  | 'rule'
  | 'navigation'
  | 'session';

export interface OmnibarActionItem {
  id: string;
  category: OmnibarCategory;
  title: string;
  subtitle?: string;
  badge?: string;
  iconType?: string;
  shortcut?: string;
  keywords?: string[];
  payload?: any;
  handlerType:
    | 'roll_dice'
    | 'apply_condition'
    | 'remove_condition'
    | 'apply_damage'
    | 'apply_heal'
    | 'audio_control'
    | 'audio_track'
    | 'audio_sfx'
    | 'view_srd_spell'
    | 'view_srd_monster'
    | 'view_srd_item'
    | 'view_rule'
    | 'navigate_tab'
    | 'session_advance'
    | 'trigger_xcard';
}

export interface Dnd5eRuleSnippet {
  name: string;
  summary: string;
  details: string;
  pageReference?: string;
}

export const DND5E_RULES_DB: Dnd5eRuleSnippet[] = [
  {
    name: 'Concentração',
    summary: 'Teste de CON CD 10 ou metade do dano sofrido para manter magia.',
    details: 'Ao sofrer dano enquanto mantém concentração, faça um teste de resistência de Constituição (CD 10 ou metade do dano sofrido, o que for maior). Conjurar outra magia que exige concentração encerra a anterior imediatamente. Incapacitado ou morto encerra a concentração.',
  },
  {
    name: 'Cobertura (Meia / Três Quartos / Total)',
    summary: 'Meia: +2 CA/DEX | 3/4: +5 CA/DEX | Total: não pode ser alvo direto.',
    details: 'Meia Cobertura concede +2 de bônus na CA e em testes de resistência de Destreza. Cobertura de Três Quartos concede +5 de bônus na CA e salvaguardas de Destreza. Cobertura Total impede que o alvo seja escolhido diretamente por magias ou ataques.',
  },
  {
    name: 'Descanso Curto (Short Rest)',
    summary: '1 hora de descanso; gasta Dados de Vida para curar PVs.',
    details: 'Um período de descanso de pelo menos 1 hora sem atividades intensas. O personagem pode gastar 1 ou mais Dados de Vida (HD), adicionando seu modificador de Constituição a cada dado rolado para recuperar PVs.',
  },
  {
    name: 'Descanso Longo (Long Rest)',
    summary: '8 horas de repouso; restaura todos os PVs e metade dos Dados de Vida.',
    details: 'Um período de repouso de pelo menos 8 horas (no mínimo 6 horas dormindo). Recupera todos os Pontos de Vida (HP) perdidos e até metade do total máximo de Dados de Vida gastos. Um personagem só pode se beneficiar de 1 descanso longo a cada 24 horas.',
  },
  {
    name: 'Salvaguardas Contra a Morte (Death Saves)',
    summary: 'd20 sem bônus: 10+ sucesso (3x estabiliza), 9- falha (3x morre). 1 = 2 falhas, 20 = 1 PV.',
    details: 'Ao iniciar o turno com 0 PV, role 1d20 puro. 10 a 19 = 1 Sucesso. 2 a 9 = 1 Falha. 1 Natural = 2 Falhas imediatas. 20 Natural = Recupera 1 PV imediatamente e desperta. 3 sucessos estabilizam; 3 falhas causam a morte do personagem.',
  },
  {
    name: 'Dano Massivo & Morte Instantânea',
    summary: 'Dano restante após zerar PV >= PV Máximo = Morte imediata sem salvaguardas.',
    details: 'Quando o dano reduz um personagem a 0 PV e o dano restante for igual ou superior ao valor máximo de pontos de vida do personagem, ele morre instantaneamente sem direito a testes de morte.',
  },
  {
    name: 'Agarrar (Grapple)',
    summary: 'Teste disputado de Atletismo (FOR) vs Atletismo (FOR) ou Acrobacia (DES).',
    details: 'Substitui um ataque corpo a corpo. O alvo deve ter no máximo uma categoria de tamanho maior. Se vencer a disputa, o alvo fica sob a condição Agarrado (Deslocamento reduzido a 0). Mover o alvo agarrado consome o dobro do deslocamento.',
  },
  {
    name: 'Flanqueamento (Regra Opcional)',
    summary: 'Dois aliados em lados opostos de um inimigo ganham Vantagem no ataque corpo a corpo.',
    details: 'Quando uma criatura e pelo menos um de seus aliados estão em lados diretamente opostos de um inimigo no grid de combate, ambos têm Vantagem nos testes de ataque corpo a corpo contra ele.',
  },
  {
    name: 'Visão no Escuro (Darkvision)',
    summary: 'Enxerga escuridão como penumbra e penumbra como luz plena (em tons de cinza).',
    details: 'Dentro do alcance especificado, a criatura enxerga na escuridão plena como se fosse penumbra (luz fraca, sofrendo desvantagem em testes de Percepção baseados em visão) e na penumbra como luz plena. Não é possível discernir cores no escuro, apenas tons de cinza.',
  },
  {
    name: 'Terreno Difícil (Difficult Terrain)',
    summary: 'Cada metro de deslocamento custa 1 metro extra (+100% de custo).',
    details: 'Mover-se em terreno difícil consome o dobro do movimento habitual (1,5m em terreno difícil custa 3m de deslocamento). Quedas de escombros, pântanos, escadas íngremes ou gelo são exemplos de terreno difícil.',
  },
  {
    name: 'Ataque de Oportunidade (Opportunity Attack)',
    summary: 'Reação ao ver um inimigo sair voluntariamente do seu alcance corpo a corpo.',
    details: 'Você pode gastar sua Reação para fazer um ataque corpo a corpo contra uma criatura hostil que sai do seu alcance corpo a corpo. O ataque ocorre imediatamente antes da criatura sair do alcance. A ação Desengajar evita ataques de oportunidade.',
  },
];

export const CONDITION_DETAILS: Record<ConditionType, string> = {
  Cego: 'Falha automática em testes que exigem visão. Ataques contra têm vantagem; seus ataques têm desvantagem.',
  Encantado: 'Não pode atacar o encantador. Encantador tem vantagem em testes sociais contra o alvo.',
  Surdo: 'Falha automática em testes que exigem audição.',
  Atemorizado: 'Desvantagem em testes de habilidade e ataques enquanto a fonte do medo estiver visível. Não pode se aproximar voluntariamente.',
  Agarrado: 'Deslocamento reduzido a 0. Termina se o agarrador for incapacitado ou empurrado.',
  Incapacitado: 'Não pode realizar ações nem reações.',
  Invisível: 'Impossível de ver sem meios mágicos. Seus ataques têm vantagem; ataques contra têm desvantagem.',
  Paralisado: 'Incapacitado, não pode se mover nem falar. Falha automática em testes de FOR e DES. Ataques contra têm vantagem e acertos a menos de 1.5m são críticos automáticos.',
  Petrificado: 'Transformado em substância sólida inanimada (pedra). Peso multiplicado por 10. Resistência a todo dano; imune a veneno e doença.',
  Envenenado: 'Desvantagem em testes de ataque e testes de habilidade.',
  Caído: 'Apenas pode rastejar (custa o dobro) ou gastar metade do deslocamento para levantar. Seus ataques têm desvantagem; ataques corpo a corpo a menos de 1.5m contra têm vantagem.',
  Restrito: 'Deslocamento reduzido a 0. Seus ataques e testes de DES têm desvantagem. Ataques contra têm vantagem.',
  Inconsciente: 'Incapacitado, cai prostrado, larga o que está segurando. Falha automática em FOR e DES. Ataques contra têm vantagem e acertos a menos de 1.5m são críticos automáticos.',
  Concentração: 'Mantém uma magia ativa. Exige salvaguarda de CON ao receber dano.',
};

/**
 * Normaliza strings para busca sem acentos e minúsculas
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Matcher veloz por inclusão direta e por todas as palavras digitadas
 */
export function matchesQuery(source: string, query: string): boolean {
  const normSource = normalizeText(source);
  const normQuery = normalizeText(query);
  if (!normQuery) return true;
  if (normSource.includes(normQuery)) return true;

  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;

  // Todas as palavras da busca devem estar presentes no texto de origem
  return queryWords.every((word) => normSource.includes(word));
}

/**
 * Analisa a query do usuário e gera a lista ordenada de ações / resultados
 */
export function evaluateOmnibarQuery(
  rawQuery: string,
  contextData: {
    combatants: Combatant[];
    activeCampaignTitle?: string;
    isPlayingBgm?: boolean;
    activeBgmTitle?: string;
  }
): OmnibarActionItem[] {
  const query = rawQuery.trim();
  const norm = normalizeText(query);
  const results: OmnibarActionItem[] = [];

  // ==========================================
  // 1. ROLAGEM DE DADOS RÁPIDA (DICE ENGINE)
  // ==========================================
  const diceExprMatch = query.match(/^(?:\/r|\/roll|\/gmr|\/gmroll|\/sroll|\/broll)?\s*(\d*d\d+(?:[+-]\d+)?(?:\s*(?:adv|desv|kh1|kl1))?)/i);
  const isDirectDice = /^(\d*d\d+|d\d+)/i.test(query);

  if (diceExprMatch || isDirectDice) {
    const rawFormula = diceExprMatch ? diceExprMatch[1] : query;
    const isGm = /^\/(?:gmr|gmroll|sroll)/i.test(query);
    const isAdv = /adv/i.test(query);
    const isDis = /desv/i.test(query);

    results.push({
      id: `dice-roll-${rawFormula}`,
      category: 'dice',
      title: `Rolar Dado: ${rawFormula.toUpperCase()}`,
      subtitle: isGm ? 'Rolagem Secreta do Mestre (Apenas DM visualiza)' : 'Rolagem Pública (Visível para toda a mesa)',
      badge: isGm ? 'SECRETO' : 'PÚBLICO',
      iconType: 'Dice5',
      shortcut: '↵ Rolar',
      handlerType: 'roll_dice',
      payload: {
        formula: rawFormula,
        isSecret: isGm,
        advantage: isAdv,
        disadvantage: isDis,
      },
    });

    // Oferece a alternativa secreta/pública
    if (!isGm) {
      results.push({
        id: `dice-roll-secret-${rawFormula}`,
        category: 'dice',
        title: `Rolar Secreto do Mestre: ${rawFormula.toUpperCase()}`,
        subtitle: 'Apenas você verá o resultado do d20 e modificadores',
        badge: 'GM ROLL',
        iconType: 'EyeOff',
        shortcut: 'Shift+↵',
        handlerType: 'roll_dice',
        payload: {
          formula: rawFormula,
          isSecret: true,
        },
      });
    }
  }

  // Predefinições rápidas de dados quando a query é vazia ou começa com 'd' ou 'rolar'
  if (!query || norm === 'd' || norm === 'rolar' || norm === 'dado' || norm === 'dados') {
    const quickDice = ['1d20', '1d20+5', '2d6', '1d100', '4d6 (Atributos)'];
    quickDice.forEach((d) => {
      results.push({
        id: `quick-dice-${d}`,
        category: 'dice',
        title: `Rolar ${d}`,
        subtitle: 'Rolagem instantânea no Combat Log e 3D Dice Box',
        badge: 'DADO',
        iconType: 'Dice5',
        handlerType: 'roll_dice',
        payload: { formula: d.split(' ')[0], isSecret: false },
      });
    });
  }

  // ==========================================
  // 2. COMBATENTES & CONDIÇÕES (@ e cond:)
  // ==========================================
  const isTargetQuery = query.startsWith('@') || query.startsWith('alvo:') || query.startsWith('combatente:');
  const targetFilter = isTargetQuery ? query.replace(/^[@]|^(alvo:)|^(combatente:)/i, '').trim() : '';

  const activeCombatants = contextData.combatants || [];

  if (isTargetQuery || norm.startsWith('cond') || norm.startsWith('status') || norm.startsWith('dano') || norm.startsWith('cura')) {
    activeCombatants.forEach((c) => {
      if (!targetFilter || matchesQuery(c.name, targetFilter)) {
        // Dano / Cura rápida
        results.push({
          id: `combatant-card-${c.id}`,
          category: 'combatant',
          title: `Gerenciar: ${c.name}`,
          subtitle: `PV: ${c.hp}/${c.maxHp} | CA: ${c.ac} | Condições: ${c.conditions?.length ? c.conditions.join(', ') : 'Nenhuma'}`,
          badge: c.type === 'player' ? 'JOGADOR' : 'MONSTRO',
          iconType: 'Shield',
          handlerType: 'apply_damage',
          payload: { combatantId: c.id, combatantName: c.name },
        });

        // Sugestão de aplicar condições nos combatentes
        CONDITIONS.slice(0, 5).forEach((cond) => {
          const hasCond = c.conditions?.includes(cond);
          results.push({
            id: `combatant-cond-${c.id}-${cond}`,
            category: 'condition',
            title: hasCond ? `Remover Condição [${cond}] de ${c.name}` : `Aplicar Condição [${cond}] em ${c.name}`,
            subtitle: CONDITION_DETAILS[cond] || `Altera status de ${c.name}`,
            badge: hasCond ? 'REMOVER' : 'APLICAR',
            iconType: 'Activity',
            handlerType: hasCond ? 'remove_condition' : 'apply_condition',
            payload: { combatantId: c.id, condition: cond },
          });
        });
      }
    });
  }

  // ==========================================
  // 3. CONTROLE DO AUDIO MAESTRO
  // ==========================================
  if (!query || norm.includes('som') || norm.includes('audio') || norm.includes('musica') || norm.includes('bgm') || norm.includes('sfx') || norm.includes('tocar') || norm.includes('pausar') || norm.includes('mute')) {
    const isPlaying = contextData.isPlayingBgm;
    results.push({
      id: 'audio-toggle-bgm',
      category: 'audio',
      title: isPlaying ? 'Pausar Trilha Sonora BGM' : 'Retomar Trilha Sonora BGM',
      subtitle: contextData.activeBgmTitle ? `Trilha Atual: ${contextData.activeBgmTitle}` : 'Controla a reprodução atmosférica da sessão',
      badge: isPlaying ? 'TOCANDO' : 'PAUSADO',
      iconType: isPlaying ? 'Pause' : 'Play',
      shortcut: 'Espaço',
      handlerType: 'audio_control',
      payload: { action: isPlaying ? 'pause' : 'resume' },
    });

    results.push({
      id: 'audio-mute-all',
      category: 'audio',
      title: 'Silenciar / Reativar Todo o Áudio',
      subtitle: 'Mute geral instantâneo de músicas e efeitos sonoros',
      badge: 'AUDIO',
      iconType: 'VolumeX',
      handlerType: 'audio_control',
      payload: { action: 'toggle_mute' },
    });

    // SFX Imediatos
    const quickSfx = [
      { name: 'Espada / Golpe Metálico', key: 'espada', url: '/audio/sfx/sword-hit.mp3' },
      { name: 'Trovão & Relâmpago', key: 'trovao', url: '/audio/sfx/thunder.mp3' },
      { name: 'Magia / Conjuração Arcana', key: 'magia', url: '/audio/sfx/magic-cast.mp3' },
      { name: 'Fanfarra de Vitória', key: 'vitoria', url: '/audio/sfx/victory.mp3' },
    ];

    quickSfx.forEach((sfx) => {
      if (!query || matchesQuery(sfx.name, query) || norm.includes('sfx')) {
        results.push({
          id: `audio-sfx-${sfx.key}`,
          category: 'audio',
          title: `SFX: ${sfx.name}`,
          subtitle: 'Dispara efeito sonoro em tempo real para o Mestre e Jogadores',
          badge: 'SFX',
          iconType: 'Sparkles',
          handlerType: 'audio_sfx',
          payload: { sfxUrl: sfx.url, name: sfx.name },
        });
      }
    });
  }

  // ==========================================
  // 4. BUSCA NO COMPÊNDIO SRD: MAGIAS
  // ==========================================
  const isSpellQuery = query.startsWith('!m') || query.startsWith('!magia') || norm.startsWith('magia:');
  const spellFilter = isSpellQuery ? query.replace(/^(!m|!magia|magia:)/i, '').trim() : query;

  if (spellFilter && (isSpellQuery || spellFilter.length >= 3)) {
    const matchedSpells = CONSOLIDATED_SPELLS.filter(
      (spell) =>
        matchesQuery(spell.name, spellFilter) ||
        (spell.englishName && matchesQuery(spell.englishName, spellFilter)) ||
        (spellFilter.length >= 4 && matchesQuery(spell.description, spellFilter))
    ).slice(0, 6);

    matchedSpells.forEach((spell) => {
      const componentsStr = typeof spell.components === 'string' ? spell.components : spell.components?.raw || 'V, S';
      results.push({
        id: `srd-spell-${spell.name}`,
        category: 'spell',
        title: `${spell.name} (${spell.level === 0 ? 'Truque' : `${spell.level}º Nível`})`,
        subtitle: `${spell.school} • Alcance: ${spell.range} • Tempo: ${spell.castingTime} • Comp: ${componentsStr}`,
        badge: spell.level === 0 ? 'TRUQUE' : `LVL ${spell.level}`,
        iconType: 'Flame',
        handlerType: 'view_srd_spell',
        payload: spell,
      });
    });
  }

  // ==========================================
  // 5. BUSCA NO COMPÊNDIO SRD: MONSTROS
  // ==========================================
  const isMonsterQuery = query.startsWith('!monstro') || query.startsWith('!mob') || norm.startsWith('monstro:');
  const monsterFilter = isMonsterQuery ? query.replace(/^(!monstro|!mob|monstro:)/i, '').trim() : query;

  if (monsterFilter && (isMonsterQuery || monsterFilter.length >= 3)) {
    const matchedMonsters = UNIQUE_MONSTERS.filter((m) => matchesQuery(m.name, monsterFilter)).slice(0, 6);

    matchedMonsters.forEach((monster) => {
      results.push({
        id: `srd-monster-${monster.name}`,
        category: 'monster',
        title: `${monster.name} (ND ${monster.cr})`,
        subtitle: `${monster.size} ${monster.type} • CA ${monster.ac} • PV ${monster.hp} • Vel: ${monster.speed}`,
        badge: `ND ${monster.cr}`,
        iconType: 'Skull',
        handlerType: 'view_srd_monster',
        payload: monster,
      });
    });
  }

  // ==========================================
  // 6. BUSCA NO COMPÊNDIO SRD: ITENS & EQUIPAMENTO
  // ==========================================
  const isItemQuery = query.startsWith('!item') || norm.startsWith('item:');
  const itemFilter = isItemQuery ? query.replace(/^(!item|item:)/i, '').trim() : query;

  if (itemFilter && (isItemQuery || itemFilter.length >= 3)) {
    const matchedItems = ALL_SRD_ITEMS.filter((item) => matchesQuery(item.name, itemFilter)).slice(0, 5);

    matchedItems.forEach((item) => {
      results.push({
        id: `srd-item-${item.name}`,
        category: 'item',
        title: `${item.name} (${item.category || item.type || 'Item'})`,
        subtitle: `Valor: ${item.value || 'N/A'} • Peso: ${item.weight || 0} kg • ${item.description.slice(0, 75)}...`,
        badge: (item.category || item.type || 'ITEM').toUpperCase(),
        iconType: 'Backpack',
        handlerType: 'view_srd_item',
        payload: item,
      });
    });
  }

  // ==========================================
  // 7. BUSCA DE REGRAS OFICIAIS D&D 5E
  // ==========================================
  const isRuleQuery = query.startsWith('!regra') || norm.startsWith('regra:') || norm.includes('como funciona') || norm.includes('como calcular');
  const ruleFilter = isRuleQuery ? query.replace(/^(!regra|regra:)/i, '').trim() : query;

  if (!query || isRuleQuery || ruleFilter.length >= 3) {
    const matchedRules = DND5E_RULES_DB.filter(
      (rule) => !query || isRuleQuery || matchesQuery(rule.name, ruleFilter) || matchesQuery(rule.summary, ruleFilter)
    ).slice(0, 4);

    matchedRules.forEach((rule) => {
      results.push({
        id: `rule-${rule.name}`,
        category: 'rule',
        title: `Regra: ${rule.name}`,
        subtitle: rule.summary,
        badge: 'REGRA 5E',
        iconType: 'BookOpen',
        handlerType: 'view_rule',
        payload: rule,
      });
    });
  }

  // ==========================================
  // 8. NAVEGAÇÃO ENTRE MÓDULOS & ABAS
  // ==========================================
  if (!query || norm.startsWith('ir') || norm.startsWith('navegar') || norm.startsWith('abrir') || norm.includes('tela') || norm.includes('aba')) {
    const navModules = [
      { name: 'Live Cockpit (Mesa ao Vivo & Grid 3D)', tabKey: 'live_cockpit', icon: 'Compass', badge: 'PRINCIPAL' },
      { name: 'Session Studio (Planejador de Cenas & Roteiro)', tabKey: 'session_studio', icon: 'Film', badge: 'PREPARAÇÃO' },
      { name: 'Worldbuilder Studio (Lore, Entidades & Mapas)', tabKey: 'worldbuilder', icon: 'Globe', badge: 'MUNDO' },
      { name: 'Campaign Settings & Feed de Notícias', tabKey: 'campaign_settings', icon: 'Settings', badge: 'CONFIG' },
      { name: 'Calendário Astral & Rastreamento de Tempo', tabKey: 'calendar', icon: 'Calendar', badge: 'TEMPO' },
      { name: 'Modo TV (Projeção para Mesa Presencial)', tabKey: 'tv_mode', icon: 'Tv', badge: 'PRESENCIAL' },
      { name: 'Overlay de Streaming (OBS / Twitch)', tabKey: 'streamer_overlay', icon: 'Video', badge: 'STREAM' },
    ];

    navModules.forEach((mod) => {
      if (!query || matchesQuery(mod.name, query) || matchesQuery(mod.tabKey, query)) {
        results.push({
          id: `nav-${mod.tabKey}`,
          category: 'navigation',
          title: `Navegar: ${mod.name}`,
          subtitle: `Alterna a visualização para a tela de ${mod.name}`,
          badge: mod.badge,
          iconType: mod.icon,
          handlerType: 'navigate_tab',
          payload: { tabKey: mod.tabKey },
        });
      }
    });
  }

  // ==========================================
  // 9. AÇÕES DE SESSÃO & SEGURANÇA (X-CARD / TEMPO)
  // ==========================================
  if (!query || norm.includes('turno') || norm.includes('combate') || norm.includes('tempo') || norm.includes('descanso') || norm.includes('x-card') || norm.includes('seguranca')) {
    results.push({
      id: 'session-next-turn',
      category: 'session',
      title: 'Próximo Turno de Combate',
      subtitle: 'Avança a ordem de iniciativa para o próximo combatente',
      badge: 'COMBATE',
      iconType: 'FastForward',
      shortcut: 'Ctrl+N',
      handlerType: 'session_advance',
      payload: { action: 'next_turn' },
    });

    results.push({
      id: 'session-short-rest',
      category: 'session',
      title: 'Avançar Tempo: Descanso Curto (1 Hora)',
      subtitle: 'Avança 1 hora no relógio da campanha e notifica os jogadores',
      badge: 'TEMPO',
      iconType: 'Clock',
      handlerType: 'session_advance',
      payload: { action: 'advance_time', hours: 1, label: 'Descanso Curto (1h)' },
    });

    results.push({
      id: 'session-long-rest',
      category: 'session',
      title: 'Avançar Tempo: Descanso Longo (8 Horas)',
      subtitle: 'Avança 8 horas, recupera PVs e espaços de magia do grupo',
      badge: 'TEMPO',
      iconType: 'Moon',
      handlerType: 'session_advance',
      payload: { action: 'advance_time', hours: 8, label: 'Descanso Longo (8h)' },
    });

    results.push({
      id: 'session-xcard',
      category: 'session',
      title: 'Disparar Alerta de Segurança (X-Card)',
      subtitle: 'Pausa a cena e notifica a mesa respeitosamente sobre conteúdo sensível',
      badge: 'SAFETY TOOL',
      iconType: 'AlertTriangle',
      handlerType: 'trigger_xcard',
    });
  }

  return results;
}
