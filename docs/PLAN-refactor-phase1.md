# PLAN-refactor-phase1: Refatoração de Arquitetura & Modularização

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js 15, React 19, TypeScript, Three.js)

---

## 📖 Visão Geral (Overview)

O **Masters Codex** possui uma interface estética moderna de alto padrão, porém acumulou dívida técnica arquitetural por conta de componentes e contextos monolíticos ("God Context" e "God Components").

Esta **Fase 1** tem como objetivo desacoplar a gestão de estado e decompor as telas gigantes para garantir:
1. **Isolamento de Performance:** Movimentações de tokens 3D e combate não re-renderizam a aplicação inteira.
2. **Manutenibilidade & Testabilidade:** Componentes menores, focados em uma única responsabilidade.
3. **Escalabilidade:** Estrutura pronta para a integração de Supabase Realtime (Fase 2) e IA Nativa Gemini (Fase 3).

---

## 🎯 Critérios de Sucesso (Success Criteria)

- [x] 4 novos Contextos/Stores criados (`WorldContext`, `CampaignContext`, `SessionContext`, `LiveCockpitContext`).
- [x] `AppProviders.tsx` encadeando a hierarquia modular de contextos.
- [x] `LiveCockpitStudio.tsx` decomposto com criação de sub-componentes focados na pasta `components/live-cockpit/`.
- [x] Lógica Three.js isolada em custom hooks (`lib/hooks/useThreeScene`, `useToken3DManager`).
- [x] Compilação limpa sem erros de tipo TypeScript (`npx tsc --noEmit`).
- [x] Build de produção executado com sucesso (`npm run build`).

---

## 🛠️ Stack Tecnológica & Decisões

| Tecnologia | Uso Atual | Decisão na Fase 1 | Justificativa |
| :--- | :--- | :--- | :--- |
| **React Context API** | Monólito em `AuthContext` | Divisão em domínios (`WorldContext`, `CampaignContext`, `SessionContext`) | Manter padrão nativo do React sem adicionar dependências externas para dados de baixa frequência. |
| **Live Cockpit / 3D State** | `AuthContext` | Novo `LiveCockpitContext` / Hook customizado de combate | Isolar estado de alta frequência (posições 3D, iniciativa) para evitar re-renders globais. |
| **Three.js Hooks** | Misturado em `BattleGrid3D.tsx` | Hooks customizados em `lib/hooks/` | Separar a renderização imperativa WebGL do ciclo de vida React UI. |

---

## 📁 Estrutura de Arquivos Proposta

```
Masters Codex/
├── context/
│   ├── AuthContext.tsx           # Remodelado: Apenas login/logout/user
│   ├── WorldContext.tsx          # [NOVO] Mundos e entidades de lore
│   ├── CampaignContext.tsx       # [NOVO] Campanhas, membros e feed
│   ├── SessionContext.tsx        # [NOVO] Sessões e cenas
│   └── LiveCockpitContext.tsx    # [NOVO] Combate, posições 3D e projeção
├── components/
│   ├── LiveCockpitStudio.tsx     # Orquestrador leve das sub-telas do Cockpit
│   ├── live-cockpit/             # [NOVO DIR]
│   │   ├── LiveCockpitHeader.tsx
│   │   ├── CombatInitiativeTracker.tsx
│   │   ├── AddCombatantModal.tsx
│   │   └── QuickAudioPanel.tsx
│   ├── BattleGrid3D.tsx          # Componente React enxuto do Canvas
│   └── battle-3d/                # [NOVO DIR]
│       └── BattleGridOverlay.tsx # HUD de bússola, rotação e clima
├── lib/
│   └── hooks/                    # [NOVO DIR]
│       ├── useThreeScene.ts      # [NOVO] Setup Three.js, Camera e Renderer
│       ├── useToken3DManager.ts  # [NOVO] Carregamento GLTF e Raycasting 3D
│       ├── useEnvironment3D.ts   # [NOVO] Sistema de clima e iluminação
│       ├── useWorld.ts           # [NOVO] Custom hook para WorldContext
│       ├── useCampaign.ts        # [NOVO] Custom hook para CampaignContext
│       └── useSession.ts         # [NOVO] Custom hook para SessionContext
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Task 1: Criar `LiveCockpitContext.tsx` (Estado de Alta Frequência)
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P0 | **Dependências:** Nenhuma
- **Input:** Lógica de `tokenPositions3D`, `tokenRotations3D`, `liveDisplayMode` de `AuthContext.tsx` + combate de `app/page.tsx`.
- **Output:** `context/LiveCockpitContext.tsx` e hook `useLiveCockpit()`.
- **Verificação:** `npx tsc --noEmit`.

### Task 2: Extrair `WorldContext.tsx` e `useWorld.ts`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Task 1
- **Input:** `userWorlds`, `activeWorld`, `worldEntities`, CRUD de mundos/entidades de `AuthContext.tsx`.
- **Output:** `context/WorldContext.tsx` e `lib/hooks/useWorld.ts`.
- **Verificação:** `npx tsc --noEmit`.

### Task 3: Extrair `CampaignContext.tsx` e `useCampaign.ts`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Task 1
- **Input:** `userCampaigns`, `activeCampaign`, `campaignMembers`, `feedEvents`, CRUD de campanhas de `AuthContext.tsx`.
- **Output:** `context/CampaignContext.tsx` e `lib/hooks/useCampaign.ts`.
- **Verificação:** `npx tsc --noEmit`.

### Task 4: Extrair `SessionContext.tsx` e `useSession.ts`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Task 1
- **Input:** `sessions`, `scenes`, `activeSession`, `activeScene`, CRUD de sessões e cenas de `AuthContext.tsx`.
- **Output:** `context/SessionContext.tsx` e `lib/hooks/useSession.ts`.
- **Verificação:** `npx tsc --noEmit`.

### Task 5: Refatorar `AuthContext.tsx` & Criar `AppProviders.tsx`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Tasks 2, 3, 4
- **Input:** `AuthContext.tsx` original.
- **Output:** `AuthContext.tsx` limpo (< 200 linhas) + `components/AppProviders.tsx` encadeando todos os Providers.
- **Verificação:** `npx tsc --noEmit` & `npm run build`.

### Task 6: Decompor `LiveCockpitStudio.tsx` em Sub-Componentes
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Prioridade:** P2 | **Dependências:** Tasks 1-5
- **Input:** `components/LiveCockpitStudio.tsx` (~1.770 linhas).
- **Output:**
  - `components/live-cockpit/LiveCockpitHeader.tsx`
  - `components/live-cockpit/CombatInitiativeTracker.tsx`
  - `components/live-cockpit/AddCombatantModal.tsx`
  - `components/live-cockpit/QuickAudioPanel.tsx`
  - `components/LiveCockpitStudio.tsx` refatorado e conciso (< 300 linhas).
- **Verificação:** `npx tsc --noEmit`.

### Task 7: Extrair Custom Hooks Three.js de `BattleGrid3D.tsx`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P2 | **Dependências:** Task 1
- **Input:** `components/BattleGrid3D.tsx` (~1.560 linhas).
- **Output:**
  - `lib/hooks/useThreeScene.ts` (WebGL, Camera, Controls)
  - `lib/hooks/useToken3DManager.ts` (GLTFLoader, Token Movement, Raycasting)
  - `lib/hooks/useEnvironment3D.ts` (Weather Particles, Sun/Moon Light)
  - `components/battle-3d/BattleGridOverlay.tsx` (HUD)
  - `components/BattleGrid3D.tsx` refatorado (< 250 linhas).
- **Verificação:** `npx tsc --noEmit`.

### Task 8: Atualizar Consumidores nos Componentes Globais
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P3 | **Dependências:** Tasks 5, 6, 7
- **Input:** Componentes do projeto (`app/page.tsx`, `WorldbuilderStudio.tsx`, `SessionStudio.tsx`, `CampaignSettingsStudio.tsx`, `Sidebar.tsx`, `Header.tsx`).
- **Output:** Todas as chamadas atualizadas para usar os novos hooks específicos (`useWorld`, `useCampaign`, `useSession`, `useLiveCockpit`).
- **Verificação:** `npx tsc --noEmit` & `npm run build`.

---

## 🧪 Fase X: Checklist de Verificação Final (Definition of Done)

- [ ] **Verificação de Tipagem:** `npx tsc --noEmit` executado sem erros.
- [ ] **Auditoria de Lint:** `npm run lint` sem avisos críticos.
- [ ] **Build de Produção:** `npm run build` gerado com sucesso.
- [ ] **Auditoria de Segurança:** `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] **Auditoria de UX/UI:** `python .agent/skills/frontend-design/scripts/ux_audit.py .`
- [ ] **Verificação Manual:** Mover tokens 3D e trocar de abas mantendo sincronização de dados sem lags ou re-renderizações desnecessárias.
