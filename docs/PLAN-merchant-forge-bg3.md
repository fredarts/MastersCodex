# 💰 PLAN: Merchant Forge & Sistema de Comércio Estilo Baldur's Gate 3

> **Status:** Planejado ⏳  
> **Prioridade:** 🔥🔥🔥 P0 - Altíssimo Impacto em Economia, Roleplay & Automação  
> **Inspiração:** Interface de Comércio & Barter do *Baldur's Gate 3 (Larian Studios)*  
> **Dependências:** `lib/services/partyLootService.ts`, `lib/types.ts`, `lib/srd-items-data.ts`, `components/character-sheet/Sections/EquipmentSection.tsx`, `context/LiveCockpitContext.tsx`, `context/CampaignContext.tsx`  
> **Módulos Afetados:** Ficha de Personagem (Inventário & Carteira), Live Cockpit (Mestre), Compêndio de Itens, Sincronização Realtime de Campanha.

---

## 🎯 1. Visão Geral & Experiência do Usuário (BG3 Style)

O **Merchant Forge** é o ecossistema completo de comércio, economia e troca interativa do *Masters Codex*. Ele permite ao Mestre gerar lojas ricas com 1 clique (ou customizadas) e aos Jogadores abrirem uma interface visual idêntica à de *Baldur's Gate 3* para **Comprar**, **Vender** e **Barganhar (Barter)** itens diretamente conectados às suas fichas de personagem.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           💰 FORJA DE FERROBRÁS (FERREIRO)                      │
│                  Atitude: 💚 Amigável (+15% Desconto) | Caixa: 1.250 PO         │
├─────────────────────────────┬─────────────────────┬─────────────────────────────┤
│  ESTOQUE DO MERCADOR        │   BALANÇA DE TROCA  │    INVENTÁRIO DO JOGADOR    │
│  [Filtros: Armas/Armaduras] │      (BARTER)       │   [Filtros: Equip/Mochila]  │
│                             │                     │                             │
│  🗡️ Espada Longa +1  (500 PO)│   [ Oferta Vendedor ]│  🎒 Adaga de Prata  (50 PO)  │
│  🛡️ Escudo de Aço    (10 PO) │       500 PO        │  🧪 Poção de Cura   (50 PO)  │
│  🏹 Arco Longo       (50 PO) │                     │  💎 Rubi Bruto     (100 PO)  │
│  ⛓️ Cota de Malha    (75 PO) │   [ Oferta Jogador ]│                             │
│                             │     150 PO + 350 PO │   Carteira:                 │
│                             │                     │   🥇 420 PO  🥈 15 PP       │
├─────────────────────────────┴─────────────────────┴─────────────────────────────┤
│  [ 🎲 Tentar Barganhar (Persuasão DC 14) ]          [ ⚖️ EQUILIBRAR & CONCLUIR ]│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ 2. Arquitetura de Dados & Modelos (`lib/merchant/merchantTypes.ts`)

```typescript
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

export interface MerchantStockItem {
  id: string;
  srdItemId?: string;        // ID canônico no Compêndio D&D 5e SRD (Single Source of Truth)
  name: string;
  category: 'weapon' | 'armor' | 'potion' | 'scroll' | 'adventuring_gear' | 'gem' | 'magic_item' | 'service';
  basePriceGold: number;     // Preço tabelado no livro (em PO)
  currentPriceGold: number;  // Preço com modificador de atitude/inflação
  quantity: number;          // Quantidade disponível (-1 para infinito)
  rarity?: 'Comum' | 'Incomum' | 'Raro' | 'Muito Raro' | 'Lendário';
  description?: string;
  weightLbs?: number;
  properties?: string[];
  attunement?: boolean;
  armorClass?: string;
  damageDice?: string;
  isCustom?: boolean;        // Se for um item homebrew criado manualmente pelo Mestre
  customDocId?: string;      // Vínculo com documento de lore/campanha se houver
}

export interface MerchantShop {
  id: string;
  campaignId: string;
  name: string;              // ex: "Empório de Poções da Madame Lilith"
  merchantName: string;      // ex: "Madame Lilith"
  merchantType: MerchantType;
  merchantAvatarUrl?: string;
  dialogueGreeting?: string; // Frase de boas-vindas do NPC
  wealthTier: MerchantWealthTier;
  goldReserve: number;       // Saldo de ouro do mercador para comprar itens dos jogadores
  attitude: number;          // De -100 (Hostil) a +100 (Aliado / Amado)
  stock: MerchantStockItem[];
  isOpenToPlayers: boolean;  // Se está ativa e visível para o grupo
  createdAt: string;
  updatedAt: string;
}

export interface BarterTransaction {
  shopId: string;
  characterId: string;
  characterName: string;
  buyingItems: { itemId: string; name: string; quantity: number; unitPriceGold: number }[];
  sellingItems: { itemId: string; name: string; quantity: number; unitPriceGold: number }[];
  goldDeltaCharacter: number; // Negativo se gastou ouro, positivo se recebeu
  timestamp: number;
}
```

### 🏛️ 2.1. Arquitetura Compendium-First (Única Fonte da Verdade)
Para manter **100% de consistência de dados** no ecossistema:
1. **Itens Oficiais do Livro (SRD 5e)**:
   - Todo item do estoque que não for expressamente customizado é indexado pelo seu `srdItemId` correspondente nos lotes oficiais (`BATCH_1_ITEMS` até `BATCH_14_UNIQUES` de `lib/srd-items-data.ts`).
   - Propriedades canônicas (*dano, tipo de armadura, peso, valor em PO, raridade, sintonização e descrição com tags mágicas*) são hidratadas em tempo de execução via `srdService`.
2. **Itens Customizados (Homebrew do Mestre)**:
   - Marcados com `isCustom: true` ou associados a um `customDocId` dos Documentos de Campanha (`CampaignDocument`).
3. **Conversão Atômica para o Inventário da Ficha**:
   - Ao concluir a compra, o motor utiliza o normalizador de itens (`normalizeChestItem`) para gerar um `CharacterEquipmentItem` perfeitamente compatível com a aba de Equipamentos e os cálculos derivados de Peso/Carga e Ataques.

---

## 🎲 3. Mecânicas de Jogo (Baldur's Gate 3 Mechanics)

### 3.1. Modificador de Atitude & Descontos (*Attitude & Pricing Curve*)
* O Mestre ou as ações dos jogadores ajustam a **Atitude** do mercador (de -100 a +100):
  * **+100 (Devoto/Aliado)**: 20% de Desconto nas Compras + Vende itens por 65% do valor base.
  * **+50 (Amigável)**: 10% de Desconto nas Compras + Vende itens por 55% do valor base.
  * **0 (Neutro)**: Preço base 100% de Compra + Vende itens por 50% do valor base (Padrão 5e).
  * **-50 (Ranzinza/Desconfiado)**: +25% de Sobretaxa nas Compras + Compra dos jogadores por apenas 35%.

### 3.2. Barganha com Teste de Carisma (*Barter Persuasion Check*)
* O jogador pode clicar no botão **"🎲 Tentar Barganhar"**:
  * O sistema rola `d20 + Modificador de Carisma (Persuasão)` do Personagem.
  * **Sucesso (vs DC da Loja)**: Concede +20 de Atitude temporária para aquela sessão de compras.
  * **Falha Crítica (1 Natural)**: O mercador se ofende, reduz a Atitude em -15 e encerra a barganha.

### 3.3. Modo Direto (Trade) vs Modo Balança (Barter)
* **Modo Trade (Rápido)**: Clique duplo no item compra/vende instantaneamente deduzindo/creditando ouro da ficha.
* **Modo Barter (BG3)**: O jogador coloca 1 Espada Longa + 2 Gemas na balança, escolhe a Armadura de Placas do mercador e clica em **"⚖️ Equilibrar com Ouro"**. O sistema calcula a diferença exata em moedas e conclui a transação completa num único clique atômico.

---

## 🛠️ 4. Presets Oficiais de Lojas no Merchant Forge

| Tipo de Loja | Itens Típicos | Estoque Mágico | Saldo de Ouro Médio |
| :--- | :--- | :--- | :---: |
| ⚒️ **Ferreiro de Batalha** | Todas as Armas Marciais, Escudos, Cotas de Malha, Placas, Flechas | Armas +1, Escudo Sentinela, Cota de Mithral | 800 a 2.500 PO |
| 🧪 **Laboratório Alquímico** | Poções de Cura (Maior/Superior), Antídotos, Fogo Alquímico, Ácido | Poção de Invisibilidade, Óleo de Afiação, Elixir de Saúde | 400 a 1.200 PO |
| 📜 **Torre do Encantador Arcano** | Focos Arcanos, Pergaminhos de 1º a 5º Nível, Diamantes de Revivify | Varinha de Mísseis Mágicos, Bolsa de Truques, Pérola do Poder | 1.500 a 5.000 PO |
| 🕵️ **Mercado Negro do Covil** | Venenos de Serpente, Ferramentas de Ladrão, Manto de Elfo | Manto de Invisibilidade, Adaga Envenenada, Itens Amaldiçoados | 1.000 a 3.000 PO |
| 🍺 **Taverna & Provisões** | Rações de Viagem, Cordas, Tochas, Cantis, Barraca, Cerveja | Nenhum (apenas mundano) | 150 a 400 PO |

---

## 💻 5. Tarefas de Implementação (Task Breakdown)

### 🔹 Fase 1: Arquitetura de Dados & Serviços (`lib/merchant/`)
- [ ] Criar `lib/merchant/merchantTypes.ts` com todas as estruturas de Loja, Estoque, Atitude e Transação Barter.
- [ ] Criar `lib/merchant/merchantPresets.ts` contendo geradores de estoque para Ferreiro, Alquimista, Arcano, Mercado Negro e Taverna.
- [ ] Criar `lib/merchant/merchantService.ts`:
  - `fetchShops(campaignId)`
  - `createShop(shopData)`
  - `updateShopStock(shopId, stock)`
  - `executeBarterTransaction(transaction)`: Deduz/adiciona ouro da ficha do personagem, move itens de inventário e grava log financeiro atômico.

### 🔹 Fase 2: Componentes de UI do Baldur's Gate 3 (`components/merchant/`)
- [ ] Criar `components/merchant/BG3MerchantModal.tsx`:
  - Layout widescreen estilo BG3 com split-screen: Estoque do Mercador (Esquerda), Balança Central de Barter, Mochila do Jogador (Direita).
  - Filtros rápidos por categoria de item (Armas, Armaduras, Poções, Pergaminhos, Gemas, Outros).
  - Barra de Atitude do Mercador com feedback visual de desconto.
  - Botão de Barganha com d20 animado (BG3 Dice Roll).
  - Seletor de modo `[Comércio Rápido]` vs `[Balança Barter]`.
- [ ] Criar `components/merchant/MerchantForgeModal.tsx` (Área do Mestre):
  - Criador e editor visual de lojas.
  - Gerador com 1 clique ("Gerar Boticário de Nível Rico").
  - Botão *"📢 Abrir Loja para os Jogadores"* que dispara push notification em tempo real na mesa.

### 🔹 Fase 3: Integração com Ficha, Live Cockpit e Feed
- [ ] Integrar atalho da Loja no cabeçalho do `LiveCockpitStudio.tsx` e no `EquipmentSection.tsx` da Ficha de Personagem.
- [ ] Disparar eventos no feed da campanha e no log de combate: *"💰 Vax comprou Espada Longa +1 por 450 PO na Forja de Ferrobrás"*.
- [ ] Suporte a fallback offline no `LocalStorage` e sincronização Supabase Realtime.

---

## 🧪 6. Plano de Verificação & Testes

### Testes Automatizados (Vitest):
- `tests/merchant/merchantEconomy.test.ts`:
  - Testar cálculo de preços com diferentes níveis de Atitude (-50, 0, +50, +100).
  - Testar conversão de moedas (descontar 50 PO de uma carteira com 10 PL ou 500 PP).
  - Testar transação de Barter: oferecer 3 itens mundanos + 25 PO em troca de 1 Poção Rara.
  - Testar se tentativa de compra com ouro insuficiente lança erro gracioso e bloqueia a transação.

### Verificação Manual de UI:
1. Mestre abre o *Merchant Forge* e clica em *"Gerar Alquimista Rico"*.
2. Mestre clica em *"Abrir Loja para o Grupo"*.
3. Jogador abre a janela estilo BG3, arrasta uma Poção de Cura para o carrinho e confirma.
4. Verificar se a Poção surge no inventário da aba de Equipamentos e as 50 PO são debitadas da carteira.
5. Jogador testa barganha: clica em *Barganhar*, rola d20 de Persuasão e visualiza o desconto imediato no estoque.

---

## 🚀 Próximos Passos
- Revise o plano estruturado e execute `/create` para iniciar o desenvolvimento da Fase 1 e da interface BG3!
