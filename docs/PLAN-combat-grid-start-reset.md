# Plano de Implementação: Iniciar e Resetar Batalha no Grid

## Overview
O objetivo é adicionar um controle explícito para o início de uma batalha no grid 3D do Live Cockpit. Antes da batalha começar de fato, o Mestre verá um botão "Iniciar Batalha". A batalha deve persistir seu estado de início para que, se o Mestre sair e voltar para a cena, ela continue de onde parou. Além disso, quando a batalha estiver iniciada, um botão de "Reset" deve aparecer, permitindo zerar a batalha caso o Mestre confirme a ação através de um popup.

## Tipo de Projeto
WEB (Live Cockpit Studio)

## Success Criteria
- [ ] O botão "Iniciar Batalha" aparece antes da batalha começar no painel de combate/grid.
- [ ] O estado de `isBattleStarted` é persistido na `GameScene` do banco de dados para evitar perda de estado ao trocar de cena.
- [ ] O botão de "Resetar Batalha" só aparece quando `isBattleStarted` for verdadeiro.
- [ ] Clicar no botão "Resetar Batalha" exibe um popup de confirmação.
- [ ] Confirmar o reset retorna a batalha para o começo (turno 0, round 1) e redefine `isBattleStarted` para falso.

## Open Questions (Requer Resposta do Mestre)

> [!IMPORTANT] 
> Por favor, responda a estas perguntas de design antes de iniciarmos a codificação:
> 
> 1. **Reset Completo ou Parcial?** Quando o botão "Resetar" for confirmado, a batalha volta pro começo (Turno 0, Round 1). Devemos também restaurar os Pontos de Vida (HP) de todos os combatentes para o valor máximo, ou mantemos a vida atual?
> 2. **Posição no Grid:** No reset da batalha, os tokens devem voltar para a posição em que estavam antes da batalha iniciar, ou podem permanecer na posição em que terminaram?
> 3. **Posição do Botão:** O botão de "Iniciar Batalha" deve ocupar o lugar dos controles de "Avançar/Voltar Turno" no painel de Iniciativa lateral (CombatInitiativePanel), ou deve ser um overlay gigante no meio do Grid 3D?

## Tech Stack
- React & Tailwind (UI)
- Zustand (Gerenciamento de Estado UI)
- Supabase (Persistência via `updateScene`)

## Task Breakdown

### 1. Atualizar Tipos de Dados (Model)
- **Arquivo:** `lib/types.ts`
- **Agente:** `frontend-specialist`
- **Ação:** Adicionar `isBattleStarted?: boolean;` na interface `GameScene`.
- **Verificação:** Compilação TS passando sem erros.

### 2. Atualizar Store do Cockpit
- **Arquivo:** `lib/stores/useLiveCockpitStudioStore.ts`
- **Agente:** `frontend-specialist`
- **Ação:** Adicionar `isBattleStarted` (default `false`) e sua action `setIsBattleStarted`.
- **Verificação:** Store expõe os novos atributos corretamente.

### 3. Sincronizar Estado no Live Cockpit
- **Arquivo:** `components/LiveCockpitStudio.tsx`
- **Agente:** `frontend-specialist`
- **Ação:** 
  - No `useEffect` que observa `activeScene`, sincronizar `scene.isBattleStarted` para o Zustand store.
  - Criar funções `handleStartBattle` e `handleResetBattle` que chamam `updateScene({ ...activeScene, isBattleStarted: true/false })` e resetam `currentTurnIndex` e `roundCount`.
- **Verificação:** Mudanças de cena carregam corretamente se a batalha já foi iniciada ou não.

### 4. Implementar UI no Painel de Iniciativa
- **Arquivo:** `components/live-cockpit/CombatInitiativePanel.tsx`
- **Agente:** `frontend-specialist`
- **Ação:** 
  - Renderizar botão "Iniciar Batalha" na área de controles de turno caso `!isBattleStarted`.
  - Renderizar botão "Resetar Batalha" (corrigido com ícone de Rotate/Reset) caso `isBattleStarted`.
  - Adicionar um Modal de Confirmação customizado ou usar Toast/Modal existente nativo para confirmar a ação de reset.
- **Verificação:** Renderização condicional visualmente consistente com o design Dark Mode (slate/rose/amber).

## Verification Plan (Phase X)

### Manual Verification
- [ ] Entrar em uma cena de combate e verificar que o botão "Iniciar Batalha" aparece.
- [ ] Clicar no botão e verificar se os controles de turno normais aparecem.
- [ ] Sair da cena, voltar e verificar se a batalha continua iniciada (estado persistido).
- [ ] Clicar em "Resetar Batalha", cancelar no popup (nada deve acontecer).
- [ ] Clicar em "Resetar Batalha", confirmar, e garantir que os turnos voltam ao zero e o botão "Iniciar Batalha" ressurge.

### Automated Checks
- `npm run lint` para checagem de erros de TS.
- `python .agent/scripts/verify_all.py .` para auditoria rápida de UX/Segurança (sem quebra de regras).
