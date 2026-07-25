# Plan: Fase 1 - Fundações & Refatoração Crítica (P0)

> **Goal:** Decompose `LiveCockpitStudio.tsx`, purify `CampaignContext.tsx` and `SessionContext.tsx`, and delete orphaned legacy files `/masters-codex`.

## Task Breakdown

### Task 1: Component & Hook Extractions from LiveCockpitStudio
- Extract `useCombatEngine.ts` into `lib/hooks/useCombatEngine.ts`
- Extract `useSceneProjection.ts` into `lib/hooks/useSceneProjection.ts`
- Extract `LiveCockpitAudioController.tsx` into `components/live-cockpit/LiveCockpitAudioController.tsx`
- Refactor `components/LiveCockpitStudio.tsx` to use extracted hooks/components

### Task 2: Purify Context Layer (CampaignContext & SessionContext)
- Update `ICampaignRepository.ts` interface with missing operations
- Implement missing operations in `SupabaseCampaignRepository.ts` and `LocalStorageCampaignRepository.ts`
- Expose methods in `campaignService.ts`
- Refactor `CampaignContext.tsx` to delegate 100% to `campaignService`
- Verify `SessionContext.tsx` clean delegation

### Task 3: Cleanup Legacy Artifacts
- Remove `/masters-codex` directory

---

## Verification
- Run `npm run test`
- Run `npx tsc --noEmit`
