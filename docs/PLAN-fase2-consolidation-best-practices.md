# Plan: Fase 2 - Consolidação & Boas Práticas (P1)

> **Goal:** Full SRD 5e compendium population, repository integration & E2E tests expansion, and Supabase Realtime battle state sync.

## Task Breakdown

### Task 1: Complete SRD 5e Compendium Dataset & Population
- Expand dataset in `lib/srd-data.ts` (monsters, spells, items)
- Update seed script `scripts/populate-srd.ts` for full Supabase table population

### Task 2: Expand Test Suite (Integration & Playwright E2E)
- Add `lib/__tests__/repository-integration.test.ts`
- Expand `e2e/live-cockpit-combat.spec.ts`
- Add `e2e/world-creation.spec.ts`

### Task 3: Supabase Realtime Synchronization
- Create `lib/hooks/useRealtimeBattleSync.ts`
- Integrate realtime token positions and combat turn updates into `BattleGrid3D.tsx`

---

## Verification
- Run `npm run test`
- Run `npx playwright test`
- Run `npx tsc --noEmit`
