# Plano de Implementação: Fase 3 (Longo Prazo - P2 Melhoria: Performance & IA Avançada)

> **Status:** ⏳ Aguardando Aprovação  
> **Prioridade:** P2 (Melhoria)  
> **Alvo:** RAG Vetorial Real (`pgvector` + Embeddings) e Otimizações de Performance WebGL / Three.js

---

## 🎯 Objetivos de Engenharia

1. **Implementação de RAG Real com `pgvector` & Similarity Search:**
   - Habilitar extensão Postgres `vector` no Supabase via migration SQL.
   - Criar tabela `lore_embeddings` com coluna `embedding vector(1536)` e função RPC `match_lore_documents` para busca por distância cosseno.
   - Atualizar [`lib/ai/campaign-rag.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/ai/campaign-rag.ts) para gerar embeddings via API da IA (Gemini Embeddings / OpenAI) e retornar contexto altamente relevante.

2. **Otimização de Performance 3D & WebGL (Three.js):**
   - **InstancedMesh para Hordas de Inimigos:** Substituir instâncias individuais por `InstancedMesh` para grupos de monstros do mesmo tipo (goblins, esqueletos), reduzindo chamadas de renderização (Draw Calls) de N para 1.
   - **Gerenciador de Ciclo de Vida & Memória GLTF:** Criar [`lib/3d-asset-manager.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/3d-asset-manager.ts) com dispose explícito de geometrias, texturas e materiais (`dispose()`) ao alternar de cena, evitando vazamento de memória GPU.

---

## 🏗️ Estrutura de Arquivos Proposta

```plaintext
supabase/
└── migrations/
    └── 20260722_enable_pgvector_and_lore_embeddings.sql  [NOVO] Extension vector + tabela lore_embeddings + RPC match_lore_documents

lib/
├── ai/
│   └── campaign-rag.ts            [MODIFICAR] Gerar embeddings e consulta por simetria de cosseno
└── 3d-asset-manager.ts            [NOVO] Gerenciador LRU de memória e dispose de assets Three.js

components/
├── battle-3d/
│   ├── InstancedTokenGroup.tsx    [NOVO] Renderizador de hordas com InstancedMesh no Three.js
│   └── Token3DMesh.tsx            [MODIFICAR] Adicionar descarte explícito de memória GPU (dispose)
└── AICoPilot.tsx                  [MODIFICAR] Integrar respostas geradas com contexto vetorial RAG
```

---

## 📋 Detalhamento das Tarefas (Fase 3)

### Módulo 1: RAG Vetorial Real (`pgvector` + Embeddings)
- [ ] **Criar Migration SQL (`20260722_enable_pgvector_and_lore_embeddings.sql`):**
  - Habilitar `CREATE EXTENSION IF NOT EXISTS vector;`.
  - Criar tabela `lore_embeddings` com índice IVFFlat/HNSW (`vector_cosine_ops`).
  - Criar função SQL `match_lore_documents(query_embedding vector, match_threshold float, match_count int)`.
- [ ] **Refatorar [`lib/ai/campaign-rag.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/ai/campaign-rag.ts):**
  - Implementar geração de vetores usando `@google/genai` (modelo `text-embedding-004`).
  - Atualizar `fetchLoreContextFromSupabase` para chamar a função RPC `match_lore_documents`.

### Módulo 2: Otimizações de Performance 3D & WebGL
- [ ] **Criar [`lib/3d-asset-manager.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/3d-asset-manager.ts):**
  - Cache de modelos GLTF compartilhados.
  - Função utilitária `disposeHierarchy(object3D)` para liberação de memória de texturas, geometrias e materiais ao desmontar o canvas.
- [ ] **Criar `InstancedTokenGroup.tsx`:**
  - Implementar `InstancedMesh` para cenários com múltiplos monstros idênticos (ex: 10 goblins ou 15 esqueletos).
- [ ] **Integrar no [`BattleGrid3D.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/BattleGrid3D.tsx):**
  - Chamar `disposeHierarchy` na desmontagem da cena.

---

## 🔍 Plano de Verificação

### Testes Automatizados
- Teste de compilação TypeScript: `npm run build`
- Execução de testes unitários: `npm run test`

### Verificação Manual
- Testar o assistente `AICoPilot.tsx` com perguntas específicas do lore e verificar a precisão do contexto resgatado via RAG vetorial.
- Inspecionar a utilização de memória GPU no Chrome DevTools (Aba Performance / Memory WebGL) durante trocas consecutivas de cenas 3D.

---
