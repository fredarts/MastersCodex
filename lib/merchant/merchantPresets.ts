/**
 * lib/merchant/merchantPresets.ts
 * Gerador oficial de Lojas e Estoques temáticos baseados no Compêndio D&D 5e (Single Source of Truth).
 */

import { ALL_SRD_ITEMS } from '../srd-items-data';
import { SRDItem } from '../types';
import { 
  MerchantShop, 
  MerchantType, 
  MerchantWealthTier, 
  MerchantStockItem,
  ItemCategory 
} from './merchantTypes';

/**
 * Converte strings de valor como "50 PO", "1.500 PO", "5 PP", "10 PC" em valor numérico em Peças de Ouro (PO).
 */
export function parseGoldValue(valueStr?: string): number {
  if (!valueStr) return 10;
  const clean = valueStr.toLowerCase().replace(/\./g, '').trim();
  
  if (clean.includes('pp') || clean.includes('prata')) {
    const num = parseFloat(clean.replace(/[^0-9,.]/g, '').replace(',', '.'));
    return isNaN(num) ? 1 : num / 10;
  }
  if (clean.includes('pc') || clean.includes('cobre')) {
    const num = parseFloat(clean.replace(/[^0-9,.]/g, '').replace(',', '.'));
    return isNaN(num) ? 0.1 : num / 100;
  }
  if (clean.includes('pe') || clean.includes('electro')) {
    const num = parseFloat(clean.replace(/[^0-9,.]/g, '').replace(',', '.'));
    return isNaN(num) ? 0.5 : num / 2;
  }
  if (clean.includes('pl') || clean.includes('platina')) {
    const num = parseFloat(clean.replace(/[^0-9,.]/g, '').replace(',', '.'));
    return isNaN(num) ? 100 : num * 10;
  }
  
  // Padrão: PO (Peças de Ouro)
  const num = parseFloat(clean.replace(/[^0-9,.]/g, '').replace(',', '.'));
  return isNaN(num) ? 10 : num;
}

/**
 * Mapeia categoria do SRDItem para a categoria da loja.
 */
function mapSrdCategoryToItemCategory(srd: SRDItem): ItemCategory {
  const cat = (srd.category || srd.type || '').toLowerCase();
  if (cat.includes('arma') || cat.includes('weapon')) return 'weapon';
  if (cat.includes('armadura') || cat.includes('armor') || cat.includes('escudo') || cat.includes('shield')) return 'armor';
  if (cat.includes('poção') || cat.includes('potion')) return 'potion';
  if (cat.includes('pergaminho') || cat.includes('scroll')) return 'scroll';
  if (cat.includes('gema') || cat.includes('gem') || cat.includes('joia')) return 'gem';
  if (srd.rarity && srd.rarity !== 'Comum') return 'magic_item';
  return 'adventuring_gear';
}

/**
 * Converte um SRDItem canônico em um MerchantStockItem da loja.
 */
export function convertSrdItemToStockItem(
  srd: SRDItem, 
  quantity: number = -1,
  priceOverride?: number
): MerchantStockItem {
  const basePrice = priceOverride !== undefined ? priceOverride : parseGoldValue(srd.value);
  
  return {
    id: `stock-${srd.id}-${Math.random().toString(36).substring(2, 6)}`,
    srdItemId: srd.id,
    name: srd.name,
    category: mapSrdCategoryToItemCategory(srd),
    basePriceGold: basePrice,
    currentPriceGold: basePrice,
    quantity,
    rarity: (srd.rarity as any) || 'Comum',
    description: srd.description,
    weightLbs: srd.weight,
    attunement: Boolean(srd.attunement),
    isCustom: false,
  };
}

/**
 * Configurações de Reserva de Ouro e Quantidade de Itens Mágicos por Nível de Riqueza da Loja
 */
export const WEALTH_TIER_CONFIG: Record<MerchantWealthTier, { minGold: number; maxGold: number; maxMagicItems: number; label: string }> = {
  poor: { minGold: 80, maxGold: 250, maxMagicItems: 0, label: 'Pobre (Vilarejo/Favela)' },
  modest: { minGold: 400, maxGold: 1200, maxMagicItems: 2, label: 'Modesto (Vila Comercial)' },
  wealthy: { minGold: 1500, maxGold: 4500, maxMagicItems: 6, label: 'Rico (Grande Metrópole)' },
  legendary: { minGold: 8000, maxGold: 25000, maxMagicItems: 14, label: 'Lendário (Bazaar Planar/Sigil)' },
};

/**
 * Metadados temáticos dos tipos de loja
 */
export const MERCHANT_TEMPLATES: Record<MerchantType, {
  defaultName: string;
  defaultMerchant: string;
  greeting: string;
  searchKeywords: string[];
}> = {
  blacksmith: {
    defaultName: 'Forja & Armaria do Martelo Rubro',
    defaultMerchant: 'Mestre Torvald Forjador',
    greeting: 'Aço afiado e armaduras que suportam hálito de dragão! O que precisa hoje, aventureiro?',
    searchKeywords: ['espada', 'machado', 'adaga', 'arco', 'armadura', 'escudo', 'cota', 'martelo', 'flecha'],
  },
  alchemist: {
    defaultName: 'O Caldeirão Borbulhante (Alquimia & Ervas)',
    defaultMerchant: 'Madame Lilith, Boticária',
    greeting: 'Cuidado onde pisa, alguns frascos reagem com a luz! Procurando tônicos de vigor ou misturas mais exóticas?',
    searchKeywords: ['poção', 'cura', 'antídoto', 'fogo', 'ácido', 'óleo', 'elixir', 'unguento', 'frasco'],
  },
  arcanist: {
    defaultName: 'Empório Místico do Olho Índigo',
    defaultMerchant: 'Arquimago Elyon Valandir',
    greeting: 'O conhecimento arcano tem seu preço em ouro e respeito. Que encantamentos busca decifrar?',
    searchKeywords: ['pergaminho', 'varinha', 'cajado', 'grimório', 'foco', 'pérola', 'anel', 'cristal', 'tinta'],
  },
  black_market: {
    defaultName: 'Beco dos Sussurros (Mercado Clandestino)',
    defaultMerchant: 'Corvo de Umbra',
    greeting: 'Guarde as perguntas. Mostre as moedas e pegue o que precisa antes que a Guarda da Cidade apareça.',
    searchKeywords: ['veneno', 'ladino', 'manto', 'adaga', 'falsificação', 'arrombamento', 'invisibilidade', 'veneno'],
  },
  general_store: {
    defaultName: 'Provisões & Empório do Aventureiro',
    defaultMerchant: 'Tobias Pés-Ligeiros',
    greeting: 'Temos de tudo um pouco! Desde cordas de seda até tochas que não apagam na chuva.',
    searchKeywords: ['mochila', 'corda', 'tocha', 'ração', 'cantil', 'pederneira', 'barraca', 'saco', 'pá'],
  },
  tavern: {
    defaultName: 'Taverna do Javali Saltitante',
    defaultMerchant: 'Berna, a Estalajadeira',
    greeting: 'Puxe uma cadeira perto da lareira! A hidromel está gelada e o assado no ponto.',
    searchKeywords: ['ração', 'caneca', 'cerveja', 'hidromel', 'vinho', 'banquete', 'estalagem'],
  },
  jeweler: {
    defaultName: 'Câmbio & Relicário da Gema Estelar',
    defaultMerchant: 'Lorde Vaelin de Prata',
    greeting: 'Trabalho apenas com a mais fina lapidação e gemas puras para canalizações e tesouros de nobres.',
    searchKeywords: ['diamante', 'rubi', 'safira', 'esmeralda', 'anel', 'amuleto', 'colar', 'joia', 'lingote'],
  },
  custom: {
    defaultName: 'Bazar Personalizado',
    defaultMerchant: 'Mercador Itinerante',
    greeting: 'Saudações! Veja as mercadorias que reuni em minhas viagens.',
    searchKeywords: [],
  },
};

/**
 * Gera uma Loja completa com estoque coerente extraído do Compêndio Oficial.
 */
export function generateShopPreset(params: {
  type: MerchantType;
  wealthTier: MerchantWealthTier;
  campaignId: string;
  customName?: string;
  customMerchantName?: string;
}): MerchantShop {
  const { type, wealthTier, campaignId, customName, customMerchantName } = params;
  const template = MERCHANT_TEMPLATES[type] || MERCHANT_TEMPLATES.general_store;
  const wealth = WEALTH_TIER_CONFIG[wealthTier] || WEALTH_TIER_CONFIG.modest;

  // 1. Filtrar itens relevantes do Compêndio D&D 5e
  const keywords = template.searchKeywords;
  let matchingItems: SRDItem[] = [];

  if (keywords.length > 0) {
    matchingItems = ALL_SRD_ITEMS.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const desc = (item.description || '').toLowerCase();
      const typeStr = (item.type || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      return keywords.some(k => name.includes(k) || desc.includes(k) || typeStr.includes(k) || cat.includes(k));
    });
  } else {
    matchingItems = ALL_SRD_ITEMS.slice(0, 30);
  }

  // 2. Separar itens mundanos e mágicos conforme o nível de riqueza
  const mundaneItems = matchingItems.filter(i => !i.rarity || i.rarity === 'Comum');
  const magicItems = matchingItems.filter(i => i.rarity && i.rarity !== 'Comum');

  const selectedStock: MerchantStockItem[] = [];

  // Adiciona itens mundanos (estoque infinito ou abundante)
  mundaneItems.slice(0, 20).forEach((item) => {
    selectedStock.push(convertSrdItemToStockItem(item, -1));
  });

  // Adiciona itens mágicos limitados conforme a riqueza da loja
  const magicToAdd = magicItems.slice(0, wealth.maxMagicItems);
  magicToAdd.forEach((item) => {
    const qty = wealthTier === 'legendary' ? Math.floor(Math.random() * 2) + 1 : 1;
    selectedStock.push(convertSrdItemToStockItem(item, qty));
  });

  // Saldo de ouro do mercador
  const goldReserve = Math.floor(
    Math.random() * (wealth.maxGold - wealth.minGold + 1) + wealth.minGold
  );

  return {
    id: `shop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    campaignId,
    name: customName || template.defaultName,
    merchantName: customMerchantName || template.defaultMerchant,
    merchantType: type,
    dialogueGreeting: template.greeting,
    wealthTier,
    goldReserve,
    attitude: 0, // Neutro por padrão
    persuasionDc: wealthTier === 'legendary' ? 17 : wealthTier === 'wealthy' ? 15 : 13,
    stock: selectedStock,
    isOpenToPlayers: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
