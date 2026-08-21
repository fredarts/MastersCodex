# PLAN: Gerenciamento e Transição de Tokens no Dungeon Map do Live Cockpit

Este plano detalha a arquitetura e implementação para permitir **adicionar, selecionar e remover tokens de jogadores e monstros** diretamente pela tela do **Live Cockpit (Dungeon Map)**, além de permitir a **transição de tokens entre andares/níveis da masmorra** de forma individual ou em grupo (party).

---

## 1. Diagnóstico do Estado Atual

1. **`selectedTokenCombatant` Hardcoded como `null`**:
   - No `CockpitDungeonMap.tsx`, o componente `<DysonCanvas />` recebe `selectedTokenCombatant={null}`.
   - Isso impede o Mestre de selecionar um combatente/jogador e posicioná-lo no grid tático clicando nas células.

2. **Ausência de Gaveta/Bandeja de Tokens (Token Tray)**:
   - Ao contrário do `MapMaker.tsx` (que possui um painel flutuante de seleção de tokens), o Cockpit possui apenas o botão de alternar ferramenta para `'token'`, sem exibir a lista de jogadores/combatentes da sessão para seleção ou remoção.

3. **Tokens Presos no Andar Atual (Falta de Transição Inter-Andares)**:
   - Quando o mestre troca de andar através do seletor `handleSwitchLevel(targetLevelId)`, o grid atual é salvo na memória com seus respectivos tokens e o novo andar é carregado.
   - Não existe um mecanismo automatizado para mover um token específico ou todo o grupo de jogadores (Party) do Andar 1 para o Andar 2 (por exemplo, ao subir/descer escadas ou passar por portais).

---

## 2. Arquitetura da Solução

### 2.1 Bandeja Flutuante de Tokens no Cockpit (`Token Tray HUD`)
Quando a ferramenta `Token` estiver selecionada no Cockpit:
- Exibir uma gaveta/dock flutuante superior ou lateral com a lista dos **Jogadores (Party)** e **Monstros/NPCs da Cena/Combate**.
- Cada card de token exibe:
  - Miniatura / Avatar ou Inicial + Cor do Token.
  - Nome do Personagem/Criatura.
  - **Badge de Status**: Indicando se o token já está posicionado no mapa ("No Mapa: Andar X") ou "Fora do Mapa".
  - **Ação de Adicionar**: Clicar no token define-o como `selectedTokenCombatant`, permitindo clicar em qualquer célula válida do grid para inseri-lo/reposicioná-lo com cálculo imediato de Line of Sight (LOS).
  - **Ação de Remover**: Botão de lixeira (`Trash2`) ao lado de cada token já posicionado para removê-lo do grid do andar com um clique.

### 2.2 Remoção Rápida no Próprio Grid (Context Menu / Clique com Botão Direito)
- Clicar com o **botão direito** em um token no grid enquanto a ferramenta Token estiver ativa remove o token do mapa e atualiza a visão de névoa (Fog of War).
- Alternativamente, opção "Remover do Mapa" no menu flutuante ao clicar sobre o token.

### 2.3 Transição de Tokens Entre Andares (Individual e em Grupo)

#### A. Transição em Grupo ("Mover Grupo para este Andar" / "Descer/Subir Grupo")
- No cabeçalho do Seletor de Andares (`Floor Selector`), adicionar o botão de ação rápida:
  - 🚀 **"Mover Grupo para este Andar"** (`Move Party to this Floor`)
- **Comportamento**:
  1. Identifica todos os tokens do tipo `player` em qualquer andar da masmorra (`multiMapStateRef.current.maps[currentMapId].levels`).
  2. Remove esses tokens de seus andares de origem.
  3. Encontra posições livres e válidas no andar de destino (próximas ao ponto de entrada/escada ou no centro das primeiras salas descobertas).
  4. Insere todos os tokens de jogadores no grid do andar de destino.
  5. Recalcula a linha de visão (LOS) e névoa de guerra dos personagens no novo andar.
  6. Dispara broadcast imediato em tempo real para o `PlayerViewModal.tsx` (espelho dos jogadores).

#### B. Transição Individual de Token
- Na bandeja de tokens ou ao clicar com o botão direito sobre um token no grid:
  - Menu de contexto: **"Mover [Nome] para o Andar → [Lista de Andares]"**.
  - Remove o token do andar de origem e o coloca em uma célula livre no andar de destino.
  - Se o mestre estiver visualizando o andar de destino, o token aparece instantaneamente; se estiver em outro andar, salva no estado do andar de destino.

---

## 3. Plano de Tarefas Detalhado

### Fase 1: Estado e Tray de Tokens no Cockpit
- [ ] **Task 1.1**: Adicionar estado `selectedTokenCombatant: Combatant | null` e estado da gaveta de tokens no `CockpitDungeonMap.tsx`.
- [ ] **Task 1.2**: Implementar o painel flutuante `TokenTrayHUD` no `CockpitDungeonMap.tsx` contendo:
  - Abas: "Jogadores" e "Inimigos / NPCs".
  - Indicador de presença no mapa (em qual andar cada um se encontra).
  - Botão de seleção para posicionar no grid.
  - Botão de remoção rápida do grid.
- [ ] **Task 1.3**: Conectar `selectedTokenCombatant` e `setSelectedTokenCombatant` no `<DysonCanvas />`.

### Fase 2: Mecânica de Remoção no Grid
- [ ] **Task 2.1**: Permitir remoção de token clicando com botão direito sobre ele quando a ferramenta `token` estiver ativa no `DysonCanvas.tsx`.
- [ ] **Task 2.2**: Atualizar o recálculo de iluminação/visão (LOS) para re-cobrir a névoa caso o token removido fosse a única fonte de visão daquela área.

### Fase 3: Transição de Andares (Individual e em Grupo)
- [ ] **Task 3.1**: Criar a função auxiliar `movePartyToLevel(targetLevelId: string)` no `CockpitDungeonMap.tsx`:
  - Varre todos os níveis do mapa no `multiMapStateRef`.
  - Transfere os tokens de jogadores para o grid do nível alvo.
  - Altera o andar ativo e propaga a atualização via WebSocket / Realtime Broadcast para a tela dos jogadores.
- [ ] **Task 3.2**: Criar a função auxiliar `moveTokenToLevel(tokenName: string, targetLevelId: string)` para transição individual.
- [ ] **Task 3.3**: Adicionar botão visual de "Mover Grupo" no dropdown de andares e no menu de tokens do Cockpit.

---

## 4. Plano de Verificação e Testes

### Testes Automatizados (Vitest)
- [ ] Criar testes unitários em `lib/__tests__/dungeon-floor-tokens.test.ts` validando:
  - Remoção correta de tokens do grid e recálculo da névoa.
  - Transferência de tokens de um nível para outro no `MultiMapState`.
  - Posicionamento em lote da party sem sobreposição de células ou paredes.

### Testes Manuais (E2E / Browser)
- [ ] Acessar o **Live Cockpit** com a aba **Dungeon Map** ativa.
- [ ] Selecionar a ferramenta **Token** e verificar se a bandeja de tokens exibe os personagens da campanha.
- [ ] Clicar em um jogador e depois clicar no mapa: verificar se o token é posicionado e a névoa se abre.
- [ ] Clicar com o botão direito ou no ícone de lixeira e verificar se o token é removido.
- [ ] Trocar para o **Andar 2** e clicar no botão **"Mover Grupo para este Andar"**:
  - Verificar se todos os jogadores são transportados para o Andar 2.
  - Abrir a **Tela dos Jogadores (Player View)** e confirmar se o espelho ao vivo exibiu a transição e a visão correta do novo andar.
