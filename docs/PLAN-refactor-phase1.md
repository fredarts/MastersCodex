# PLAN-refactor-phase1: Refatoração de Arquitetura & Modularização (Fase 1)

> **Status:** 📝 Em Planejamento / Aguardando Aprovação | **Prioridade:** 🔴 Alta (P0) | **Tipo de Projeto:** WEB (Next.js 15, React 19, TypeScript, Three.js)

---

## 📖 Visão Geral (Overview)

A **Fase 1** tem como objetivo eliminar gargalos arquiteturais graves no **Masters Codex**, desmantelar o monólito `AuthContext.tsx` (**1.924 linhas**), migrar todos os componentes para sub-contextos por domínio (`WorldContext`, `CampaignContext`, `SessionContext`, `LiveCockpitContext`), habilitar multiplayer remoto nativo via WebSockets do Supabase (`useRealtimeSync.ts`) e decompor os componentes gigantes `LiveCockpitStudio.tsx` (**1.770 linhas**) e `BattleGrid3D.tsx` (**1.559 linhas**).

---

## 🎯 Requisitos da Fase 1 (P0.1, P0.2, P0.3)

### [P0.1] Desconstrução do `AuthContext.tsx` e Ativação dos Sub-Contextos
- **Reduzir `AuthContext.tsx`** para gerenciar **apenas** perfil de usuário e sessão de login (`user`, `roleMode`, `setRoleMode`, `signInWithGoogle`, `signInWithEmail`, `signOut`).
- **Migrar `WorldbuilderStudio.tsx`** para usar `useWorld()`.
- **Migrar `SessionStudio.tsx`** para usar `useSession()`.
- **Migrar `CampaignSettingsStudio.tsx`** para usar `useCampaign()`.
- **Migrar `LiveCockpitStudio.tsx`** para usar `useLiveCockpit()`.

### [P0.2] Conexão do Hook `useRealtimeSync.ts` para Multiplayer Remoto
- **Substituir** chamadas manuais de `new BroadcastChannel('masters_codex_sync')` em `LiveCockpitStudio`, `BattleGrid3D`, `PlayerLobby` e `PlayerViewModal` pelo hook `useRealtimeSync.ts`.
- **Habilitar** canais Pub/Sub do Supabase Realtime (`masters_codex_campaign_${campaignId}`) permitindo partidas com Mestre e Jogadores remotos em dispositivos diferentes.

### [P0.3] Decomposição dos "God Components"
- **Quebrar `LiveCockpitStudio.tsx`** criando a pasta `components/live-cockpit/` com sub-componentes:
  - `LiveCockpitHeader.tsx`
  - `CombatInitiativeTracker.tsx`
  - `AddCombatantModal.tsx`
  - `QuickAudioPanel.tsx`
- **Extrair a lógica Three.js de `BattleGrid3D.tsx`** para os custom hooks em `lib/hooks/`:
  - `useThreeScene.ts`
  - `useToken3DManager.ts`
  - `useEnvironment3D.ts`
  - `components/battle-3d/BattleGridOverlay.tsx`

---

## 📁 Estrutura de Arquivos Resultante

```plaintext
Masters Codex/
├── context/
│   ├── AuthContext.tsx           # Remodelado: Apenas login/logout/user (< 200 linhas)
│   ├── WorldContext.tsx          # State/CRUD de Mundos e Entidades de Lore
│   ├── CampaignContext.tsx       # State/CRUD de Campanhas, Membros e Feed
│   ├── SessionContext.tsx        # State/CRUD de Sessões e Cenas
│   └── LiveCockpitContext.tsx    # State de Combate, Posições 3D e Projeção Ao Vivo
├── components/
│   ├── LiveCockpitStudio.tsx     # Orquestrador leve das sub-telas do Cockpit (< 300 linhas)
│   ├── live-cockpit/             # [NOVO DIR] Sub-componentes do Live Cockpit
│   │   ├── LiveCockpitHeader.tsx
│   │   ├── CombatInitiativeTracker.tsx
│   │   ├── AddCombatantModal.tsx
│   │   └── QuickAudioPanel.tsx
│   ├── BattleGrid3D.tsx          # Componente React enxuto do Canvas (< 250 linhas)
│   └── battle-3d/                # [NOVO DIR] HUD e Overlays do 3D
│       └── BattleGridOverlay.tsx # HUD de bússola, rotação e clima
├── lib/
│   └── hooks/                    # Hooks isolados
│       ├── useThreeScene.ts      # Setup Three.js, Camera e Renderer
│       ├── useToken3DManager.ts  # Carregamento GLTF e Raycasting 3D
│       ├── useEnvironment3D.ts   # Sistema de clima e iluminação
│       ├── useRealtimeSync.ts    # Sincronização WebSockets Supabase Realtime + IPC Local
│       ├── useWorld.ts           # Custom hook para WorldContext
│       ├── useCampaign.ts        # Custom hook para CampaignContext
│       ├── useSession.ts         # Custom hook para SessionContext
│       └── useLiveCockpit.ts     # Custom hook para LiveCockpitContext
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo(s) Afetado(s) | Prioridade |
| :--- | :--- | :--- | :---: |
| **Task 1** | Refatorar `AuthContext.tsx` e garantir fallback em `WorldContext`, `CampaignContext`, `SessionContext` e `LiveCockpitContext` | `context/*.tsx` | **P0** |
| **Task 2** | Migrar componentes consumidores (`WorldbuilderStudio`, `SessionStudio`, `CampaignSettingsStudio`, `Sidebar`, `Header`, etc.) para os novos hooks | `components/*.tsx` | **P0** |
| **Task 3** | Conectar `useRealtimeSync.ts` substituindo os `BroadcastChannel` manuais | `components/LiveCockpitStudio.tsx`, `BattleGrid3D.tsx`, `PlayerLobby.tsx` | **P0** |
| **Task 4** | Extrair sub-componentes de `LiveCockpitStudio.tsx` para `components/live-cockpit/` | `components/live-cockpit/*` | **P0** |
| **Task 5** | Extrair hooks Three.js de `BattleGrid3D.tsx` (`useThreeScene`, `useToken3DManager`, `useEnvironment3D`) | `lib/hooks/*`, `components/battle-3d/*` | **P0** |
| **Task 6** | Verificação de integridade e compilação (`npx tsc --noEmit` & `npm run build`) | Repositório | **P0** |

---

## 🧪 Definition of Done (Checklist de Validação)

- [ ] `npx tsc --noEmit` executado sem erros de tipo.
- [ ] `npm run build` gerado com sucesso sem avisos no Next.js.
- [ ] `AuthContext.tsx` enxuto (< 200 linhas).
- [ ] Todas as telas principais funcionando normalmente sem acoplamento direto ao `AuthContext`.
- [ ] Posições e rotações 3D sincronizadas via `useRealtimeSync.ts`.
