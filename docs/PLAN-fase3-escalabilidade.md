# Plan: Fase 3 - Escalabilidade & Polimento (P2)

> **Goal:** Vector embeddings in AI RAG (`pgvector`), and WebGL 3D rendering performance optimization (Instanced Meshes & LOD) in `BattleGrid3D.tsx`.

## Task Breakdown

### Task 1: Vector Embeddings in AI Assistant (pgvector)
- Create migration `supabase/migrations/20260725_create_vector_embeddings.sql`
- Update `lib/ai/campaign-rag.ts` with embedding generation and `match_lore_documents` RPC integration

### Task 2: WebGL 3D Performance Optimization (Instanced Meshes & LOD)
- Refactor `components/battle-3d/InstancedTokenManager.ts`
- Integrate `InstancedTokenManager` into `components/BattleGrid3D.tsx` for 50+ token 60 FPS rendering

---

## Verification
- Add `lib/__tests__/campaign-rag-vector.test.ts`
- Run `npm run test`
- Run `npx tsc --noEmit`
