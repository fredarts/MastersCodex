# PLAN-refactor-phase2: Consolidação, Testes & Resiliência (Fase 2)

> **Status:** 📝 Em Planejamento / Aguardando Aprovação | **Prioridade:** 🟡 Média (P1) | **Tipo de Projeto:** WEB (Next.js 15, React 19, TypeScript, Three.js)

---

## 📖 Visão Geral (Overview)

A **Fase 2** foca na consolidação de boas práticas no **Masters Codex**:
1. **Camada de Serviços (Service Layer):** Isolar o acesso ao banco de dados Supabase e `localStorage` em arquivos dedicados (`lib/services/`).
2. **Suíte de Testes Automatizados:** Implementar testes unitários via **Vitest** para a engine de regras D&D 5e e testes E2E via **Playwright**.
3. **Resiliência Visual:** Proteger a visualização 3D do Three.js com **React Error Boundaries** e fallback 2D.

---

## 🎯 Requisitos da Fase 2 (P1.1, P1.2, P1.3)

### [P1.1] Camada de Serviço e Abstração de Banco de Dados
- Criar `lib/services/worldService.ts`, `lib/services/campaignService.ts` e `lib/services/sessionService.ts`.
- Migrar chamadas Supabase/localStorage dos contextos para a camada de serviços.

### [P1.2] Suíte de Testes Automatizados (TDD & E2E)
- Configurar **Vitest** em `vitest.config.ts` e adicionar scripts `"test"` e `"test:watch"` no `package.json`.
- Escrever testes unitários em `lib/__tests__/dnd5e-calculator.test.ts` validadando regras de descanso, PV, slots de magia e modificadores.
- Configurar **Playwright** em `e2e/campaign-flow.spec.ts` cobrindo navegação e rolagem de dados.

### [P1.3] Resiliência de Interface e Error Boundaries
- Criar `components/ThreeErrorBoundary.tsx` para interceptar exceções WebGL e falhas de download GLTF.
- Exibir interface de fallback em grade 2D caso ocorra erro no Canvas 3D de `BattleGrid3D.tsx`.

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

| ID | Tarefa | Arquivo(s) Afetado(s) | Prioridade |
| :--- | :--- | :--- | :---: |
| **Task 1** | Criar camada de serviço (`worldService`, `campaignService`, `sessionService`) | `lib/services/*.ts` | **P1** |
| **Task 2** | Refatorar contextos para consumir a camada de serviços | `context/*.tsx` | **P1** |
| **Task 3** | Instalar e configurar Vitest + testes unitários D&D 5e | `vitest.config.ts`, `lib/__tests__/*.test.ts` | **P1** |
| **Task 4** | Configurar Playwright + teste E2E do fluxo de campanha | `e2e/campaign-flow.spec.ts` | **P1** |
| **Task 5** | Criar `ThreeErrorBoundary.tsx` com Fallback 2D e encapsular `BattleGrid3D` | `components/ThreeErrorBoundary.tsx` | **P1** |
| **Task 6** | Validação final (`npm run test`, `npx tsc --noEmit`, `npm run build`) | Repositório | **P1** |

---

## 🧪 Definition of Done (Checklist de Validação)

- [ ] `npm run test` executado e passando com 100% de sucesso.
- [ ] `npx tsc --noEmit` executado sem erros.
- [ ] `npm run build` gerado com sucesso.
- [ ] Canvas 3D protegido por Error Boundary com Fallback 2D funcional.
