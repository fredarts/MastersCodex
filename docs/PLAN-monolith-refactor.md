# PLAN-monolith-refactor.md
# Refatoração e Fatiamento de Monólitos: PlayerLobby, WorldEntityModal e LiveCockpitContext

> **Status:** Planejamento  
> **Prioridade:** Alta (P1)  
> **Escopo:** Desacoplamento arquitetural, extração de hooks/subcomponentes e preservação integral de contratos públicos e canais realtime.

---

## 1. Contexto & Diagnóstico dos Monólitos

O projeto possui 3 arquivos centrais altamente concentrados de lógica, estado e renderização:
1. `components/PlayerLobby.tsx` (~3.226 linhas): Centraliza a visão do jogador, feed de eventos, party grid, quick macro bar, WebRTC voice call, painel de inventário/transações, modais de ficha e sincronização de dados.
2. `components/WorldEntityModal.tsx` (~3.187 linhas): Centraliza a criação e edição de todas as categorias do WorldBuilder (NPCs, Monstros, Locais, Facções, Quests, Itens, Lojas), galeria de imagens/estilos RPG, uploads de mídia, MentionTextarea, WikiTextRenderer e grafos de conexão.
3. `context/LiveCockpitContext.tsx` (~1.462 linhas): Centraliza o estado global de sessões ativas, combatentes, iniciativa, turnos, posições 3D no BattleGrid, cálculo de targeting/AoE, motor de auras dinâmicas, sincronização CRDT, projeção de cenas para TV e broadcast de eventos.

---

## 2. Regras de Ouro & Invariantes Críticas

1. **Zero Regressão de Contrato Público (API Stability):**
   - As assinaturas de exportação (`<PlayerLobby />`, `<WorldEntityModal />`, `LiveCockpitProvider` e o hook `useLiveCockpit()`) permanecem **100% inalteradas**.
   - Os consumidores externos (`app/page.tsx`, `components/WorldEditor.tsx`, `components/tv/TvDisplayContainer.tsx`, `components/live-cockpit/AuraTriggerModal.tsx`, etc.) não devem necessitar de alterações de importação ou propriedades.
2. **Preservação dos Canais Realtime & CRDT:**
   - Nenhum payload de broadcast Supabase/Realtime pode ser alterado (`broadcastDiceRoll`, `AuraTriggerEvent`, pings de mapa, cursores do DM, sinais WebRTC, alertas X-Card e `CRDTSolver`).
3. **Estabilidade de Referências & Performance:**
   - Isolar lógicas pesadas de estado em hooks com `useCallback` e seletores memoizados para evitar re-renderizações desnecessárias em grids de tokens e componentes de combate.
4. **Isolamento de Efeitos Colaterais:**
   - Separar requisições I/O (Supabase, Storage, IA, Microfone/Áudio) da camada de apresentação pura (JSX).

---

## 3. Arquitetura de Decomposição

### FASE 1: Decomposição do `LiveCockpitContext.tsx`

Criar o subdiretório `context/cockpit/` com hooks dedicados de domínio:

- **`context/cockpit/useCockpitCombatState.ts`**
  - Gerenciamento de lista de `combatants`, ordenação por iniciativa, `currentTurnIndex`, `roundCount`.
  - Funções de mutação: `setCombatants`, avançar turno, adicionar/remover combatente, atualizar HP/condições.
- **`context/cockpit/useCockpit3DGridState.ts`**
  - Estados 3D: `tokenPositions3D`, `tokenRotations3D`, `updateTokenPosition3D`, `updateTokenRotation3D`, `initializeFromCombatants`.
  - Targeting de magias e AoE: `activeSpellTargeting`, `casterTokenKey`, `spellTargetPosition`, `aoeRotation`, `detectedAoETargets`.
- **`context/cockpit/useCockpitAuraEngine.ts`**
  - Gerenciamento de auras ativas, triggers de movimentação (`evaluateAuraTriggersOnMove`), lista de `pendingAuraTriggers`, resolução/fechamento de modal de aura.
- **`context/cockpit/useCockpitRealtimeSync.ts`**
  - Broadcasts em tempo real: `broadcastDiceRoll`, `broadcastCombatUpdate`, `broadcastToPlayerView`, `broadcastCursor`, `broadcastPingLocation`.
  - Listeners de presença, rolagens de dados, transcrições e alertas de segurança (X-Card).
- **`context/cockpit/useCockpitSceneProjection.ts`**
  - Modos de exibição (`liveDisplayMode`: artwork/map/combat), `projectedScene`, `mapData`, Lightbox e TV streaming.
- **`context/LiveCockpitContext.tsx` (Refatorado):**
  - Orquestra os sub-hooks acima, agrega seus retornos e fornece `LiveCockpitContext.Provider` com exatamente a mesma interface `LiveCockpitContextType`.

---

### FASE 2: Decomposição do `WorldEntityModal.tsx`

Criar a estrutura modular `components/world/entity-modal/`:

- **Hooks de Negócio (`components/world/entity-modal/hooks/`):**
  - `useWorldEntityForm.ts`: Controle do estado do formulário, validação de campos, alternância de categorias, persistência via `worldService`.
  - `useEntityImageUploader.ts`: Upload para Supabase Storage, estilos RPG (`RPG_IMAGE_STYLES`), integração com gerador de arte por IA.
  - `useEntityConnectionsGraph.ts`: Adicionar, listar e remover conexões bidirecionais entre entidades (NPCs, Facções, Locais).
- **Subcomponentes das Abas (`components/world/entity-modal/tabs/`):**
  - `EntityGeneralTab.tsx`: Campos comuns (nome, descrição, bio, visibilidade para jogadores, `MentionTextarea`, preview em `WikiTextRenderer`).
  - `EntityNpcSheetTab.tsx`: Seletor de ficha de personagem D&D 5e vinculada, presets de equipamento e atributos.
  - `EntityMonsterTab.tsx`: Bloco de atributos de monstro, CA, PV, ND, ações de combate e traços lendários.
  - `EntityLocationTab.tsx`: Coordenadas no mapa do mundo, clima, pontos de interesse e entidades residentes.
  - `EntityQuestTab.tsx`: Lista de objetivos, recompensas de XP/ouro, NPCs dadores de quest e status.
  - `EntityMerchantTab.tsx`: Configuração de mercador, tabela de preços, estoque e moedas aceitas.
  - `EntityConnectionsTab.tsx`: Lista visual de relacionamentos, afinidades e alianças.
  - `EntityMediaTab.tsx`: Galeria de retratos, pins de combate 3D (`CombatPinSelector`) e trilha de áudio ambiente.
- **`components/WorldEntityModal.tsx` (Refatorado):**
  - Container enxuto com cabeçalho, barra de abas de categoria, rodapé de ações (Salvar/Cancelar) e renderização das sub-abas dinâmicas.

---

### FASE 3: Decomposição do `PlayerLobby.tsx`

Criar a estrutura modular `components/player-lobby/`:

- **Hooks Especializados (`components/player-lobby/hooks/`):**
  - `usePlayerLobbyRealtime.ts`: Subscrição a eventos da campanha, presença de jogadores, notificações em tempo real.
  - `usePlayerMacroBar.ts`: Execução de rolagens de ataque, testes de perícia, magias e atalhos customizados.
  - `usePlayerInventoryActions.ts`: Negociações de comércio com a party, transações com mercadores e gerenciamento de moedas.
- **Subcomponentes de Interface (`components/player-lobby/components/`):**
  - `LobbyHeaderBar.tsx`: Status da sessão, botão de chamada de voz WebRTC, seletor de visualização e perfil.
  - `PartyMembersGrid.tsx`: Grid dos outros jogadores com status de vida, iniciativa e conexões ativas.
  - `PlayerCharacterHub.tsx`: Resumo da ficha ativa do jogador (PV, CA, slots de magia, condições, ações rápidas).
  - `LobbyLiveFeedPanel.tsx`: Chat de texto, feed de rolagens de dados com visualização 3D, transcrições e avisos do DM.
  - `LobbyVoiceCallWidget.tsx`: Controles de microfone, áudio da sala e sinalização WebRTC.
  - `LobbyModalsContainer.tsx`: Modais integrados (Ficha Completa, Importação D&D Beyond, Troca de Itens, Inventário da Party).
- **`components/PlayerLobby.tsx` (Refatorado):**
  - Componente limpo de layout e composição das seções acima.

---

## 4. Tarefas e Ordem de Execução

| Fase | Arquivo/Módulo | Ação | Responsável |
| :--- | :--- | :--- | :--- |
| **P1** | `context/cockpit/*` | Extrair sub-hooks de estado e orquestrar em `LiveCockpitContext.tsx` | Backend / Frontend Specialist |
| **P2** | `components/world/entity-modal/*` | Extrair hooks de form/mídia e subcomponentes de abas para `WorldEntityModal.tsx` | Frontend Specialist |
| **P3** | `components/player-lobby/*` | Extrair hooks de realtime/macros e subcomponentes visuais para `PlayerLobby.tsx` | Frontend Specialist |
| **P4** | Validação Global | Executar checagem de tipos TypeScript (`tsc --noEmit`), linter e testes de integração | Test Specialist |

---

## 5. Matriz de Verificação & Critérios de Aceite

1. **Compilação e Tipagem Estrita:**
   - `npx tsc --noEmit` executado com **0 erros de tipos**.
   - Nenhuma propriedade faltando nas props ou no contexto.
2. **Preservação de Funcionalidades do Live Cockpit:**
   - Movimentação de tokens 3D no BattleGrid atualiza coordenadas sem atraso.
   - Triggers de auras disparam corretamente quando tokens entram em áreas demarcadas.
   - Rolagens de dados de jogadores e do DM aparecem no feed e no visualizador 3D.
3. **Preservação de Funcionalidades do WorldEntityModal:**
   - Criação e edição de todas as 7 categorias (NPC, Monster, Location, Faction, Item, Quest, Shop).
   - Menções no `MentionTextarea` continuam renderizando links ricos no `WikiTextRenderer`.
   - Upload de imagens e seleção de estilos RPG continuam gravando URLs no Supabase Storage.
4. **Preservação de Funcionalidades do PlayerLobby:**
   - Conexão em tempo real de múltiplos navegadores sincroniza status de membros da party.
   - Barra de macros executa rolagens com sucesso.
   - Abertura de ficha de personagem, importação e inventário operam normalmente.
