# PLAN-refactor-phase3: Escalabilidade, Performance 3D & CI/CD (Fase 3)

> **Status:** 📝 Em Planejamento / Aguardando Aprovação | **Prioridade:** 🟢 Longo Prazo (P2) | **Tipo de Projeto:** WEB (Next.js 15, React 19, TypeScript, Three.js, Supabase, GitHub Actions)

---

## 📖 Visão Geral (Overview)

A **Fase 3** conclui o roadmap de modernização arquitetural do **Masters Codex**, focando em:
1. **Otimização da Engine 3D (WebGL):** Implementação de `InstancedMesh` no Three.js para renderizar múltiplos combatentes/elementos idênticos com poucas draw calls.
2. **Persistência de Mapas & Grafo de Lore:** Salvar desenhos do `MapMaker.tsx` e disposições espaciais de nós no `LoreGraph.tsx`.
3. **Pipeline de CI/CD:** Automação de testes, linters e scripts de auditoria Python (`.agent/scripts/checklist.py`) via GitHub Actions.

---

## 🎯 Requisitos da Fase 3 (P2.1, P2.2, P2.3)

### [P2.1] Otimização da Engine 3D (Three.js Instancing & LOD)
- Atualizar `lib/hooks/useToken3DManager.ts` e `BattleGrid3D.tsx` para agrupar tokens repetidos usando `THREE.InstancedMesh`.

### [P2.2] Persistência de Mapas e Grafo de Lore
- Adicionar suporte a salvamento de imagens no `MapMaker.tsx` para o Supabase Storage ou `localStorage`.
- Salvar e restaurar as posições X/Y do arraste de nós no `LoreGraph.tsx` em `WorldEntity.attributes`.

### [P2.3] Automação de CI/CD & Auditorias Contínuas
- Criar `.github/workflows/ci.yml` configurado para executar `npm run test`, `npx tsc --noEmit` e `python .agent/scripts/checklist.py .` a cada PR.

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo(s) Afetado(s) | Prioridade |
| :--- | :--- | :--- | :---: |
| **Task 1** | Otimização 3D com `InstancedMesh` para tokens repetidos | `lib/hooks/useToken3DManager.ts`, `components/BattleGrid3D.tsx` | **P2** |
| **Task 2** | Persistência de nós no `LoreGraph.tsx` | `components/LoreGraph.tsx`, `lib/services/worldService.ts` | **P2** |
| **Task 3** | Exportação e persistência de mapas no `MapMaker.tsx` | `components/MapMaker.tsx`, `lib/services/sessionService.ts` | **P2** |
| **Task 4** | Automação de CI/CD via GitHub Actions | `.github/workflows/ci.yml` | **P2** |
| **Task 5** | Validação final (`python .agent/scripts/checklist.py .`, `npx tsc --noEmit`, `npm run build`) | Repositório | **P2** |
