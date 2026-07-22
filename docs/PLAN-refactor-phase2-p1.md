# Plano de Implementação: Fase 2 (Médio Prazo - P1 Importante: Consolidação & Testes)

> **Status:** ⏳ Aguardando Aprovação  
> **Prioridade:** P1 (Importante)  
> **Alvo:** Compêndio SRD no Banco, Repository Pattern (Injeção de Dependência) e Cobertura de Testes Automatizados (Vitest + Playwright)

---

## 🎯 Objetivos de Engenharia

1. **Refatoração & Migração do Compêndio D&D 5e (SRD):**
   - Criar tabelas dedicadas `srd_monsters`, `srd_spells` e `srd_items` no Supabase Postgres com suporte a busca textual (`ILIKE` / `tsvector`).
   - Criar `lib/services/srdService.ts` com paginação server-side e filtros por tipo, nível de magia, CR e raridade.

2. **Camada de Persistência Unificada (Repository Pattern & Factory):**
   - Criar contratos de interface estritos: `IWorldRepository`, `ISessionRepository`, `ICampaignRepository`.
   - Criar implementações separadas: `SupabaseWorldRepository`, `LocalStorageWorldRepository`, `SupabaseSessionRepository`, `LocalStorageSessionRepository`.
   - Criar `RepositoryFactory` para injeção dinâmica de repositórios baseada em conexão e validade de UUID.

3. **Cobertura de Testes Automatizados (Vitest & Playwright):**
   - Criar suite de testes unitários para o motor de regras D&D 5e em [`lib/__tests__/dnd5e-calculator.test.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/__tests__/dnd5e-calculator.test.ts).
   - Criar teste E2E com Playwright para os fluxos críticos de uso em [`e2e/campaign-flow.spec.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/e2e/campaign-flow.spec.ts).

---

## 🏗️ Estrutura de Arquivos Proposta

```plaintext
supabase/
└── migrations/
    └── 20260722_create_srd_compendium_tables.sql  [NOVO] Tabelas srd_monsters, srd_spells, srd_items

lib/
├── services/
│   └── srdService.ts             [NOVO] Serviço unificado do compêndio SRD com paginação e busca
├── repositories/                 [NOVO DIRETÓRIO]
│   ├── contracts/                [NOVO]
│   │   ├── IWorldRepository.ts   [NOVO] Contrato do repositório de mundos
│   │   ├── ISessionRepository.ts [NOVO] Contrato do repositório de sessões
│   │   └── ICampaignRepository.ts [NOVO] Contrato do repositório de campanhas
│   ├── supabase/                 [NOVO]
│   │   ├── SupabaseWorldRepository.ts
│   │   ├── SupabaseSessionRepository.ts
│   │   └── SupabaseCampaignRepository.ts
│   ├── offline/                  [NOVO]
│   │   ├── LocalStorageWorldRepository.ts
│   │   ├── LocalStorageSessionRepository.ts
│   │   └── LocalStorageCampaignRepository.ts
│   └── RepositoryFactory.ts      [NOVO] Factory para resolver o repositório adequado
└── __tests__/
    └── dnd5e-calculator.test.ts [NOVO] Testes unitários do motor D&D 5e em Vitest

e2e/
└── campaign-flow.spec.ts         [NOVO] Testes E2E com Playwright para fluxos críticos
```

---

## 📋 Detalhamento das Tarefas (Fase 2)

### Módulo 1: Migração & Serviço do Compêndio D&D 5e (SRD)
- [ ] **Criar Migration SQL (`20260722_create_srd_compendium_tables.sql`):**
  - Tabelas `srd_monsters`, `srd_spells`, `srd_items` com campos estruturados JSONB e índices textuais.
- [ ] **Criar `lib/services/srdService.ts`:**
  - `fetchMonsters({ query, cr, page, limit })`
  - `fetchSpells({ query, level, school, page, limit })`
  - `fetchItems({ query, rarity, type, page, limit })`
  - Fallback automático para `srd-data.ts` local quando a conexão com o banco não estiver disponível.

### Módulo 2: Arquitetura Repository Pattern & Factory
- [ ] **Criar Contratos de Repositório (`lib/repositories/contracts/`):**
  - Definir métodos CRUD assíncronos desacoplados do Supabase ou localStorage.
- [ ] **Implementar `SupabaseRepository` vs `LocalStorageRepository`:**
  - Garantir tratamento de erros com alertas Toast e mapeamento DTO estrito.
- [ ] **Criar `RepositoryFactory.ts`:**
  - Método `getWorldRepository(userId)` que seleciona automaticamente o repositório correto.

### Módulo 3: Testes Automatizados (Unit & E2E)
- [ ] **Escrever Testes Unitários em Vitest (`dnd5e-calculator.test.ts`):**
  - Testar moduto de modificadores de atributo (`Math.floor((score - 10) / 2)`).
  - Testar bônus de proficiência por nível.
  - Testar mecânica de descanso curto e longo (recuperação de HP e slots de magia).
- [ ] **Escrever Testes E2E em Playwright (`e2e/campaign-flow.spec.ts`):**
  - Teste de fluxo completo: Abrir aplicação → Criar Campanha → Selecionar Cena → Rolar Iniciativa.

---

## 🔍 Plano de Verificação

### Testes Automatizados
- Executar `npm run test` (Vitest) e validar 100% de passagem das suítes de teste de regras.
- Executar `npx playwright test` para validar o fluxo E2E de criação e navegação.

### Verificação Manual
- Abrir os modais de Compêndio de Monstros, Magias e Itens na interface e testar a busca textual em tempo real.
- Simular alternância transparente entre modo online (Supabase) e offline (localStorage).

---
