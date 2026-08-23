# PLAN: Sistema de Itens Customizados & Leitura Imersiva de Livros/Diários/Cartas (BG3-Style)

## 🎯 Objetivo
Resolver a perda de itens ao enviar saques para o Baú do Grupo e implementar o **Sistema de Itens Customizáveis e Textos Imersivos (Readable Items)** — permitindo que o Mestre e Jogadores leiam cartas, bilhetes, diários (como o *Pequeno Diário Empoeirado*) e tomos antigos diretamente no inventário ou no baú da party, com visual e som de pergaminho/livro de Baldur's Gate 3.

---

## 🔍 Diagnóstico do Problema Atual (Screenshot do Usuário)
1. **Sobrescrita da Sessão de Loot**:
   - No `ContainerLootModal.tsx`, ao clicar separadamente em "Enviar Moedas para o Grupo" ou "Baú do Grupo" de um item, o método `createLootSession` criava uma nova sessão de loot descartando os itens anteriores em vez de mesclar/acumular moedas e itens na sessão ativa da campanha.
2. **Itens Customizados com Conteúdo Textual / Lore**:
   - Os itens de equipamento (`CharacterEquipmentItem` e `PartyLootItem`) guardam apenas `name`, `rarity`, `description`, mas não possuem estrutura dedicada para textos longos de lore, autor, tipo de suporte (`book`, `scroll`, `letter`, `diary`, `note`) e estado de leitura.

---

## 📐 Arquitetura Proposta

### 1. Tipos e Esquema de Dados (`lib/types.ts`)
Estender `CharacterEquipmentItem` e `PartyLootItem`:
```typescript
export type ReadableItemType = 'book' | 'scroll' | 'letter' | 'diary' | 'note' | 'tablet';

export interface ReadableContent {
  isReadable: boolean;
  readableType?: ReadableItemType;
  author?: string;
  language?: string; // Comum, Élfico, Dracônico, etc.
  pages?: string[];  // Páginas paginadas ou texto markdown único
  content: string;   // Texto completo do diário/carta
  isSealed?: boolean;
}
```

### 2. Correção no `partyLootService.ts` e `PartyLootContext.tsx`
- Adicionar suporte a **`appendOrUpdateLootSession`**:
  - Se já existir uma sessão ativa, somar as moedas (`currency.po += newPo`, etc.) e anexar os novos itens à lista `session.items`.
  - Garantir que tanto moedas quanto itens como o *Pequeno Diário Empoeirado* permaneçam no cofre até que sejam resgatados.

### 3. Modal de Leitura BG3 (`BG3ReadableModal.tsx` / `components/loot/ReadableItemModal.tsx`)
- **Estética Baldur's Gate 3 / Medieval**:
  - Textura de pergaminho antigo envelhecido ou encadernação em couro com detalhes dourados.
  - Tipografia de caligrafia (serifada elegante / script de fantasia).
  - Suporte a paginação (Folhear Páginas: Anterior / Próxima) com efeito sonoro de papel/página virando.
  - Botão de "Guardar no Inventário" e "Fechar".
- **Acesso Ubíquo**:
  - Clicável com ícone 📜 / 📖 diretamente no **Party Loot Modal**.
  - Clicável com ícone de leitura no **Inventário da Ficha do Jogador**.
  - Clicável no **ContainerLootModal** antes mesmo de recolher o item!

### 4. Criador / Editor de Itens Customizados com Lore no MapMaker & Cockpit
- No gerador/editor de baús e esconderijos do `DysonCanvas.tsx` e `MapMaker`:
  - Permitir cadastrar itens customizados com título e conteúdo de texto (ex: *"Pequeno diário empoeirado"*, autor *"Eldrin o Escriba"*, conteúdo *"Dia 14 de Kythorn: As portas seladas no piso inferior..."*).

---

## 📋 Fases de Implementação

### Fase 1: Correção do Acúmulo no Baú do Grupo
- Modificar `partyLootService.ts` e `PartyLootContext.tsx` para fundir novos itens/moedas à sessão de loot existente sem apagá-los.
- Ajustar `ContainerLootModal.tsx` para usar o fluxo de anexo seguro.

### Fase 2: Estrutura de Readable Items
- Atualizar `lib/types.ts` (`CharacterEquipmentItem`, `PartyLootItem`, `ChestLootItem`).
- Criar helpers de conversão e presets de textos de exemplo (Diário Secreto, Bilhete Ameaçador, Carta de Amor Proibida, Tratado Mágico).

### Fase 3: Componente Visual BG3ReadableModal
- Criar `components/loot/BG3ReadableModal.tsx` com design de tomo/pergaminho rico, virada de página e sons de folhear.

### Fase 4: Integração nos Modais
- Integrar visualização de leitura em:
  1. `PartyLootModal.tsx` (botão "Ler" ao lado do item no cofre).
  2. `ContainerLootModal.tsx` (botão "Inspecionar/Ler" no baú).
  3. `EquipmentTab.tsx` / `CharacterSheetModal.tsx` (botão "Ler" no inventário do jogador).

### Fase 5: Testes Automatizados & Validação
- Escrever testes unitários em `lib/__tests__/readable-items.test.ts` e `lib/__tests__/party-loot-append.test.ts`.
- Validar fluxo com Vitest e compilação do Next.js.
