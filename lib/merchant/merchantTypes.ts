/**
 * lib/merchant/merchantTypes.ts
 * Definições completas de tipos para o Sistema de Comércio e Barter estilo Baldur's Gate 3.
 */

import { CharacterEquipmentItem, CharacterCurrency, TransactionEntry } from '../types';

export type MerchantType = 
  | 'blacksmith'      // Ferreiro & Armeiro (Armas, Armaduras, Escudos)
  | 'alchemist'       // Boticário & Alquimista (Poções, Óleos, Frascos, Ervas)
  | 'arcanist'        // Empório Arcano (Pergaminhos, Varinhas, Componentes Mágicos)
  | 'black_market'    // Mercado Negro (Venenos, Itens Proibidos, Ferramentas de Ladino)
  | 'general_store'   // Provisões Gerais & Aventureiro (Cordas, Mochilas, Tochas)
  | 'tavern'          // Taverna & Hospedaria (Comidas, Bebidas, Quartos)
  | 'jeweler'         // Joalheiro & Câmbio (Gemas, Artefatos, Moedas Raras)
  | 'custom';         // Loja Personalizada do Mestre

export type MerchantWealthTier = 'poor' | 'modest' | 'wealthy' | 'legendary';

export type ItemCategory = 
  | 'all'
  | 'weapon' 
  | 'armor' 
  | 'potion' 
  | 'scroll' 
  | 'adventuring_gear' 
  | 'gem' 
  | 'magic_item' 
  | 'service';

export interface MerchantStockItem {
  id: string;
  srdItemId?: string;        // ID canônico no Compêndio D&D 5e SRD (Single Source of Truth)
  name: string;
  category: ItemCategory;
  basePriceGold: number;     // Preço tabelado oficial (em PO)
  currentPriceGold: number;  // Preço com modificador de atitude/inflação aplicado
  quantity: number;          // Quantidade disponível (-1 para infinito)
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário';
  description?: string;
  weightLbs?: number;
  properties?: string[];
  attunement?: boolean;
  armorClass?: string;
  damageDice?: string;
  isCustom?: boolean;        // Se for um item homebrew criado pelo Mestre
  customDocId?: string;      // Vínculo com documento de campanha se houver
  iconUrl?: string;
}

export interface MerchantShop {
  id: string;
  campaignId: string;
  name: string;              // ex: "Forja de Ferrobrás"
  merchantName: string;      // ex: "Dammon Ferrobrás"
  merchantType: MerchantType;
  merchantAvatarUrl?: string;
  dialogueGreeting?: string; // Frase de boas-vindas do NPC
  npcEntityId?: string;      // ID do NPC associado no World Building
  locationEntityId?: string; // ID da Localização / Cidade associada no World Building
  locationName?: string;     // Nome da Localização / Cidade
  wealthTier: MerchantWealthTier;
  goldReserve: number;       // Saldo de ouro do mercador para comprar itens dos jogadores
  attitude: number;          // De -100 (Hostil) a +100 (Aliado/Devoto)
  persuasionDc: number;      // DC para teste de barganha (padrão: 14)
  stock: MerchantStockItem[];
  isOpenToPlayers: boolean;  // Se está visível e acessível para o grupo
  createdAt: string;
  updatedAt: string;
}

export interface BarterItemSlot {
  item: MerchantStockItem | CharacterEquipmentItem;
  quantity: number;
  unitPriceGold: number;
  totalPriceGold: number;
  source: 'merchant' | 'player';
}

export interface BarterTransactionParams {
  shop: MerchantShop;
  characterId: string;
  characterName: string;
  characterCurrency: CharacterCurrency;
  characterInventory: CharacterEquipmentItem[];
  merchantSlots: BarterItemSlot[]; // Itens que o jogador está comprando da loja
  playerSlots: BarterItemSlot[];   // Itens que o jogador está oferecendo da sua mochila
  goldBalanceCharacter: number;    // Ouro extra oferecido ou exigido pelo jogador (negativo = gasta ouro, positivo = recebe ouro)
}

export interface BarterTransactionResult {
  success: boolean;
  error?: string;
  updatedShop: MerchantShop;
  updatedCurrency: CharacterCurrency;
  updatedInventory: CharacterEquipmentItem[];
  transactionLog: TransactionEntry;
}
