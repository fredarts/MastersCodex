# PLAN-live-cockpit-refactor: Refatoração e Decomposição de LiveCockpitStudio

> **Status:** 📝 Em Planejamento / Aguardando Aprovação | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js, React, TypeScript, Zustand)

---

## 📖 Visão Geral (Overview)

O componente `LiveCockpitStudio.tsx` é atualmente o maior monólito da interface de jogo do *Masters Codex* (~3.100 linhas). Ele acumula responsabilidades de renderização de múltiplos painéis (timeline de cenas, projeção visual, teleprompter, controles de áudio, logs de combate, HUD de rolagem de dados em 3D, e modais diversos) e abriga dezenas de estados locais e funções utilitárias extensas (ex.: lógica de rolagem de dados D&D 5e, conjuração de magias de área e alvo único, alocação de mísseis mágicos).

Este plano visa decompor o `LiveCockpitStudio.tsx` em **componentes modulares e coesos**, migrando todo o estado e lógica de controle local para um **Store Zustand (`useLiveCockpitStudioStore.ts`)**. Isso garantirá manutenibilidade, separação de conceitos (Separation of Concerns), e evitará prop-drilling sem que nenhuma funcionalidade seja perdida.

---

## 🎯 Critérios de Sucesso (Success Criteria)

- **Monólito Decomposto:** `LiveCockpitStudio.tsx` reduzido de ~3.100 linhas para menos de 250 linhas, servindo apenas como layout orquestrador dos sub-componentes.
- **Estado no Zustand:** 100% da lógica e estado local UI (modais, abas, overlays, formulários de input, estados de rolagem de dados e áudio) migrados para `useLiveCockpitStudioStore.ts`.
- **Zero Regressões:** Manutenção intacta de todas as animações (como o dado BG3 3D flutuante), sincronizações em tempo real com o `LiveCockpitContext` e banco Supabase, e comportamentos complexos (ex: alocação de dardos de Mísseis Mágicos).
- **Sem Quebras de Tipo:** Compilação TypeScript bem-sucedida e build do Next.js sem avisos.

---

## 🛠️ Pilha Tecnológica (Tech Stack)

- **Gerenciamento de Estado:** Zustand (v5) para o estado do Cockpit Studio UI.
- **Framework & Componentes:** React 19, Next.js 16 (App Router), TypeScript.
- **Efeitos e UI:** Lucide React, Framer Motion, Three.js/Three-fiber (usados em dados 3D e BattleGrid3D).

---

## 📁 Nova Estrutura de Arquivos

Abaixo está o layout de arquivos proposto após a refatoração. Os novos arquivos são criados em conformidade com as convenções da pasta `components/live-cockpit/` e `lib/stores/`.

```plaintext
components/
├── LiveCockpitStudio.tsx            # Layout orquestrador (apenas estruturação de grid/colunas)
└── live-cockpit/
    ├── SceneTimelinePanel.tsx       # [NOVO] Sidebar esquerda de timeline de cenas e slides
    ├── LiveVisualMirror.tsx         # [NOVO] Painel central com projeção visual, notas e slideshow
    ├── CombatInitiativePanel.tsx    # [NOVO] Painel direito: lista de combatentes e controle de turnos
    ├── CombatantCard.tsx            # [NOVO] Ficha inline e ações rápidas do combatente
    ├── NarratorTeleprompterPanel.tsx# [NOVO] Painel de teleprompter e notas secretas
    ├── FloatingDiceRollerHUD.tsx    # [NOVO] HUD flutuante 3D (estilo BG3) e diálogos de rolagem
    └── LiveCockpitModalManager.tsx  # [MODIFICADO] Centralizador de todos os modais (Add, Setup, MagicMissile, Delete, Prompt)
lib/
└── stores/
    └── useLiveCockpitStudioStore.ts # [NEW] Central de estado local e ações da UI do Studio
```

---

## 🧠 Design do Store Zustand (`useLiveCockpitStudioStore`)

Criaremos o `useLiveCockpitStudioStore` em `lib/stores/useLiveCockpitStudioStore.ts` para unificar o controle do Studio.

### Estados
- **UI de Painéis:** `isTimelineCollapsed` (boolean), `rightPanelTab` ('init' | 'log' | 'teleprompter'), `teleprompterFontSize` (number), `expandedId` (string | null), `statusMenuOpen` (string | null).
- **Modais & Overlays:** `showCreateSceneModal` (boolean), `showAddCombatantModal` (boolean), `showBattleSetupModal` (boolean), `confirmDeleteCombatant` (Combatant | null), `pendingAttack` (object | null), `magicMissileModalState` (object | null).
- **Dados & BG3 Overlay:** `diceResult` (object | null), `bg3DiceOverlay` (object | null), `animatedRollNumber` (number), `selectedTargetId` (string | undefined), `combatLogs` (CombatLogEntry[]).
- **Áudio & Overrides Live:** `playingNpcVoice` (boolean), `activeBgmCategory` (string), `customAudios` (any[]).
- **Estados de Combate Temporários:** `isCombatActive` (boolean), `openSpellDropdownId` (string | null), `draggedCardIndex` (number | null), `dragOverCardIndex` (number | null), `activeAddTab` (string).
- **Clima e Hora do Dia Live (DM Overrides):** `liveTimeOfDayHour` (number), `liveHasFog` (boolean), `liveHasRain` (boolean), `liveFloorTextureUrl` (string | undefined), `selectedTimeOfDay` (string).

### Ações (Actions)
- **UI Toggles:** `setTimelineCollapsed()`, `setRightPanelTab()`, `setTeleprompterFontSize()`, `setExpandedId()`, `setStatusMenuOpen()`.
- **Modais Setters:** `setShowCreateSceneModal()`, `setShowAddCombatantModal()`, `setShowBattleSetupModal()`, `setConfirmDeleteCombatant()`, `setPendingAttack()`, `setMagicMissileModalState()`.
- **Combate & Turnos:** `nextTurn()`, `prevTurn()`, `handleCardDrop()`, `handleHpChange()`, `handleToggleCondition()`, `handleEndCombat()`, `handleConfirmBattleSetup()`.
- **Magias & Rolagem de Dados:** `rollDice()`, `parseAndRollDamage()`, `executeSingleTargetSpell()`, `executeAoESpellCast()`, `handleConfirmMagicMissiles()`, `executeSpellCastRoll()`.
- **Alimentação de Dados:** `setCombatLogs()`, `addLogEntry()`, `setCustomAudios()`, `setLiveDisplayMode()`.

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Fase 1: Criação do Store Zustand
#### [NEW] [useLiveCockpitStudioStore.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/stores/useLiveCockpitStudioStore.ts)
- **Agente:** `backend-specialist` (Skill: `clean-code`, `typescript-expert`)
- **Input:** Lista de estados internos mapeados de `LiveCockpitStudio.tsx`.
- **Output:** Store Zustand contendo todos os estados locais da UI, modais, dados e lógica de combate associada à UI.
- **Verificação:** Escrever um arquivo TypeScript válido que exporta o store e seus tipos sem erros.

---

### Fase 2: Extração dos Painéis de Conteúdo
#### [NEW] [SceneTimelinePanel.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/SceneTimelinePanel.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Código JSX correspondente à Coluna 1 (Timeline de Cenas esquerda) de `LiveCockpitStudio.tsx`.
- **Output:** Componente isolado que consome os dados de cena dos hooks `useSession` / `useCampaign` e manipula o colapso e gatilhos de cena usando o store Zustand.
- **Verificação:** Renderiza a lista de cenas, o botão de nova cena dispara o modal correspondente, e o botão de recolher timeline funciona conforme o esperado.

#### [NEW] [LiveVisualMirror.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/LiveVisualMirror.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Código JSX correspondente à Coluna 2 (Espelho de Projeção central) de `LiveCockpitStudio.tsx`.
- **Output:** Componente modularizado que gerencia o BattleGrid3D e renders de imagem/vídeo/slideshow de cena ativa, juntamente com o controle do slideshow.
- **Verificação:** Renderiza o Canvas 3D em modo de combate e as imagens/vídeos nos modos narrativos. Os botões de slideshow navegam os slides corretamente.

#### [NEW] [QuickAudioControllerPanel.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/QuickAudioControllerPanel.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Seção inferior da coluna central de `LiveCockpitStudio.tsx` (Voz NPC e Soundboard Controller).
- **Output:** Componente limpo integrando `LiveCockpitAudioController` e atalhos de voz do NPC ativo.
- **Verificação:** Toca/pausa áudios e vozes sem alterar o volume geral do mestre.

#### [NEW] [NarratorTeleprompterPanel.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/NarratorTeleprompterPanel.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Código da aba `teleprompter` da Coluna 3 de `LiveCockpitStudio.tsx`.
- **Output:** Componente que exibe textos sensoriais e notas secretas do narrador com controles de tamanho de fonte integrados ao Zustand.
- **Verificação:** Ajusta tamanho de texto dinamicamente e altera o slide conforme os cliques nos botões inferior.

---

### Fase 3: Extração da Iniciativa de Combate e Cartões de Criaturas
#### [NEW] [CombatInitiativePanel.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatInitiativePanel.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Conteúdo da aba `init` da Coluna 3 (Iniciativa & Combate).
- **Output:** Painel que renderiza os botões de turno (Avançar/Voltar), checkbox de auto-roll e a lista de cartões dos combatentes ativos.
- **Verificação:** Avança e retrocede turnos, ajusta a rodada e reordena os cartões ao arrastá-los.

#### [NEW] [CombatantCard.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatantCard.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Bloco de renderização de cartão individual de criatura (`combatants.map(...)`) de `LiveCockpitStudio.tsx`.
- **Output:** Componente coeso que cuida de um combatente. Gerencia inline: drag handle, edição de iniciativa, controle de PV via `CombatantHpManager`, economia de ações (Ação, Bônus, Reação, Disparada), alteração de condições ativas, ataques rápidos e dropdown de grimório de magias.
- **Verificação:** Funcionamento correto do drag-and-drop, atualizações de vida, e rolagens rápidas associadas à criatura.

---

### Fase 4: Extração das Overlays de Rolagem de Dados e Modais
#### [NEW] [FloatingDiceRollerHUD.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/FloatingDiceRollerHUD.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Markup do overlay BG3 style e resultado de dados flutuante.
- **Output:** Componente que desenha o canvas de dados 3D (`Dice3DCanvas`) e as faixas de resultados de acertos e falhas críticas.
- **Verificação:** Exibe dados girando ao rolar ataques ou perícias e mostra o total com modificadores corretamente.

#### [MODIFICADO] [LiveCockpitModalManager.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/LiveCockpitModalManager.tsx)
- **Agente:** `frontend-specialist` (Skill: `frontend-design`, `clean-code`)
- **Input:** Os modais inline de `LiveCockpitStudio.tsx` (`BattleSetupModal`, `AddCombatantModal`, `CreateSceneModal`, modal de confirmação de exclusão, modal de alocação de Mísseis Mágicos, modal de aviso de alvo necessário).
- **Output:** Concentração de todos os modais em um único componente gestor que lê os estados do Zustand para decidir o que renderizar.
- **Verificação:** Abertura e fechamento de cada modal acionando as respectivas ações do store.

---

### Fase 5: Integração do Layout Final
#### [MODIFY] [LiveCockpitStudio.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/LiveCockpitStudio.tsx)
- **Agente:** `orchestrator` (Skill: `clean-code`)
- **Input:** Arquivo monólito original.
- **Output:** Arquivo reduzido, limpo, composto apenas pelas importações dos novos sub-componentes dispostos no layout de grid principal. Consome `LiveCockpitProvider` e inicializa o store Zustand se necessário.
- **Verificação:** O arquivo final deve ter menos de 250 linhas e compilar sem erros de tipo.

---

## 🧪 Plano de Verificação (Phase X)

### Testes Automatizados
- Executar os testes de tipo do TypeScript para garantir a integridade da assinatura:
  ```powershell
  npx tsc --noEmit
  ```
- Rodar o linter para manter o código livre de avisos de variáveis não utilizadas ou importações desnecessárias:
  ```powershell
  npm run lint
  ```
- Rodar a suite de testes unitários existente para garantir que os helpers não foram danificados:
  ```powershell
  npm run test
  ```

### Verificação Manual
1. **Ambiente Dev:** Iniciar o servidor com `npm run dev` e acessar o Live Cockpit Studio.
2. **Timeline de Cenas:** Criar uma cena, editá-la e dispará-la ao vivo. Verificar se a projeção é atualizada.
3. **Fluxo de Combate:**
   - Iniciar combate, adicionar combatentes (personagens jogadores e monstros SRD).
   - Alterar iniciativa arrastando os cartões e verificar se a ordem e os turnos se adaptam.
   - Modificar o HP de um combatente e adicionar condições (ex.: Envenenado).
   - Realizar ataques rápidos e magias no grimório. Testar com e sem alvo selecionado no grid.
   - Disparar a magia *Mísseis Mágicos* e alocar os dardos no modal.
4. **Sistema de Dados:** Verificar se a animação 3D dos dados (estilo BG3) é exibida corretamente.
5. **Auditoria Geral:** Executar o script de validação de UX e performance do projeto:
   ```powershell
   python .agent/scripts/checklist.py .
   ```

---

## ⚠️ Perguntas em Aberto & Decisões do Usuário

### 1. Estado Unificado do Zustand vs. Contexto de Multiplayer
O `LiveCockpitContext.tsx` utiliza o hook `useRealtimeSync.ts` para transmitir atualizações de combate (combatantes, turnos, rodadas) em tempo real via Supabase. 
* **Nossa recomendação:** Manter a sincronização multiplayer centralizada no `LiveCockpitContext` e atualizar o estado do Contexto a partir das ações do Zustand (ou vice-versa). A UI de `LiveCockpitStudio` interage with Zustand, que por sua vez propaga/atualiza as informações para o Contexto de tempo real para evitar quebrar a sincronização multiplayer dos jogadores.
* **Pergunta:** Você concorda com essa arquitetura híbrida (Zustand cuidando dos estados de UI local e sincronizado com o Contexto para multiplayer) ou prefere que tentemos migrar a lógica do próprio Contexto multiplayer para dentro do Zustand?

### 2. Organização dos Arquivos de Sub-Componentes
Os novos sub-componentes (como `CombatantCard.tsx`, `SceneTimelinePanel.tsx`) serão colocados na pasta `components/live-cockpit/`.
* **Pergunta:** Há alguma restrição quanto à criação de novos arquivos nesta pasta ou prefere outra estrutura de diretórios?
