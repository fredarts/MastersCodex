# PLAN: Reordenação de Abas & Sistema de Envio de Itens entre Jogadores (Player Trading System)

## 1. Visão Geral
Este plano estrutura a reordenação das abas no Cockpit do Jogador (`PlayerLobby.tsx`), alteração da nomenclatura de **"Membros"** para **"Grupo"** (ficando na ordem: **Chat / Log / Grupo**), e a adição de um sistema de menu de contexto (clique com o botão direito) nos membros do grupo com a funcionalidade **"Enviar Item"**. Ao acionar essa opção, abre-se uma interface modal de negociação/transferência de itens entre fichas de personagens com preservação estrita do esquema de dados D&D 5e (armas, armaduras, poções, itens lidos/pergaminhos, notas e consumíveis).

---

## 2. Requisitos e Escopo

### 2.1. Reordenação e Nomenclatura das Abas
- **Ordem Atual:** `Membros (X) | Log (X) | Chat (X)`
- **Nova Ordem:** `Chat (X) | Log (X) | Grupo (X)`
- **Nomenclatura:** Alterar de "Membros Conectados" para "Grupo" / "Integrantes do Grupo".

### 2.2. Menu de Contexto do Membro (Right-Click Context Menu)
- Ao clicar com o botão direito em um card de membro do grupo (`onContextMenu`):
  - Impedir o menu padrão do navegador (`e.preventDefault()`).
  - Abrir um menu de contexto flutuante posicionado na coordenada do cursor com visual temático D&D/Dark Fantasy.
  - Opções do menu:
    - 📦 **Enviar Item (Trade/Transfer)** -> Abre o modal de transferência.
    - 📜 **Ver Ficha** -> Inspeciona a ficha do jogador se não for privada.
    - 💬 **Sussurrar no Chat** -> Abre/preenche comando de mensagem direta no chat.

### 2.3. Modal de Envio de Itens (`ItemTransferModal.tsx`)
- **Layout de Duas Colunas (Dual-Column Vault)**:
  - **Lado Esquerdo ("Seu Inventário")**:
    - Lista categorizada dos pertences da ficha ativa do jogador:
      - ⚔️ **Armas & Ataques** (`attacks` / `weaponProps`)
      - 🛡️ **Armaduras & Escudos** (`equippedArmor` / `armorProps`)
      - 🧪 **Poções & Consumíveis** (`potionProps`, cura, elixires)
      - 📜 **Itens Gerais, Pergaminhos & Livros** (`items`, `readableContent`)
    - Filtro de busca por nome e categoria.
    - Botão para adicionar item à cesta de envio (com seletor de quantidade se `quantity > 1`).
  - **Lado Direito ("Cesta de Transferência para [Nome do Membro]")**:
    - Itens selecionados para serem enviados nesta remessa.
    - Botão de remoção rápida ou ajuste de quantidade.
    - Resumo dos itens que sairão do inventário do remetente e irão para o destinatário.
  - **Botão de Confirmação ("Confirmar Envio")**:
    - Validação de integridade: assegura que o remetente possui os itens.

### 2.4. Preservação Estrita do Modelo de Dados & Sincronização
- **Estrutura dos Objetos (`lib/types.ts`)**:
  - `CharacterEquipmentItem`: Preserva integralmente `id`, `name`, `quantity`, `weight`, `notes`, `rarity`, `itemType`, `potionProps`, `weaponProps`, `armorProps`, `readableContent`.
  - Se for arma (`CharacterWeaponAttack`), cria correspondência no `items` e/ou `attacks` do destinatário.
  - Se for poção com `potionProps`, o destinatário poderá consumir e rolar os dados de cura da poção normalmente pela ficha ou pelo HUD rápido.
- **Sincronização & Persistência**:
  - Remove/decrementa os itens da ficha do remetente e adiciona à ficha do destinatário (`localStorage` + `Supabase` upsert).
  - Emite log público de evento de sessão/feed (`[Troca] Kirion entregou 1x Poção de Cura para Lilith`).
  - Dispara evento Realtime para atualizar a ficha ativa do jogador destinatário em tempo real.

---

## 3. Arquitetura dos Componentes & Arquivos

```
components/
├── PlayerLobby.tsx                      # Reordenação de abas (Chat, Log, Grupo) e listener de context menu
├── player-view/
│   ├── MemberContextMenu.tsx           # [NOVO] Menu flutuante de ações do membro do grupo
│   └── ItemTransferModal.tsx           # [NOVO] Modal de inventário e transferência de itens
lib/
├── services/
│   └── itemTransferService.ts           # [NOVO] Lógica pura de validação, transferência e sync entre fichas
└── __tests__/
    └── item-transfer.test.ts            # [NOVO] Testes automatizados do fluxo de transferência
```

---

## 4. Fases de Execução

### Fase 1: Reordenação de Abas e Nomenclatura no `PlayerLobby.tsx`
- Alterar botões de aba no header lateral:
  1. `sidebarTab === 'chat'` (Chat)
  2. `sidebarTab === 'log'` (Log)
  3. `sidebarTab === 'init'` -> renomear chave/render para `'party'` ou manter `'init'` com label "Grupo (X)".
- Mudar título da seção de "Membros Conectados" para "Integrantes do Grupo".

### Fase 2: Criar `MemberContextMenu.tsx`
- Componente leve acionado por coordenadas `(x, y)`.
- Fecha automaticamente ao clicar fora ou pressionar ESC.
- Opção destacada: "Enviar Item".

### Fase 3: Criar `ItemTransferModal.tsx` & `itemTransferService.ts`
- Implementar interface de 2 colunas com visual RPG estilizado.
- Criar a função pura de transferência `transferItemsBetweenSheets(senderSheet, receiverSheet, itemsToTransfer)`.
- Garantir que todos os campos de poções (`potionProps`), armas (`weaponProps`), armaduras (`armorProps`) e textos legíveis (`readableContent`) sejam clonados e mantidos intactos.

### Fase 4: Persistência & Notificação em Tempo Real
- Atualizar a ficha do remetente e do destinatário no banco de dados e localmente.
- Inserir mensagem de log no chat/feed compartilhado com destaque visual de transação.
