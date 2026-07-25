# Fase 3: Escalabilidade & Polimento

## Visão Geral
Este plano aborda as implementações de longo prazo focadas em alta performance e escalabilidade (Prioridade P2). A meta é garantir uma sincronização offline robusta (CRDT), buscas textuais de alta performance no compêndio SRD via banco de dados, e a capacidade de renderizar centenas de tokens no grid de batalha sem perdas de quadros.

## Tipo de Projeto
**WEB** (com forte integração Backend/Supabase e WebGL)

## Critérios de Sucesso
- [ ] Conexões perdidas não devem resultar em perda de movimentação de tokens (Reconciliação Offline -> Online sem sobrescritas acidentais).
- [ ] `srd-data.ts` completamente migrado para o Supabase, reduzindo o bundle inicial do app.
- [ ] Consultas ao SRD devem responder em menos de 100ms utilizando buscas textuais no banco.
- [ ] `BattleGrid3D.tsx` deve manter 60 FPS mesmo com 300+ tokens renderizados na tela.

---

> [!IMPORTANT]
> ## 🟢 Decisões Arquiteturais Definidas (Socratic Gate)
> 1. **CRDT / Sincronização Offline:** Utilizaremos **LWW (Last Writer Wins) via Timestamp**. O último evento registrado na fila local do IndexedDB ganha a reconciliação. O Mestre (DM) manterá um painel de sobrescrita manual caso precise corrigir estados dessincronizados.
> 2. **Busca Textual SRD:** Utilizaremos recursos nativos do **PostgreSQL (`tsvector` e índices GIN)** no Supabase. Garante altíssima performance sem dependências de terceiros (como Algolia) e sem custos extras.
> 3. **WebGL (InstancedMesh):** Tokens genéricos idênticos (ex: Goblins) serão renderizados em massa via **`InstancedMesh`**. Tokens únicos (Jogadores, Chefes com retratos próprios) serão renderizados via **Mesh tradicional**. Esta abordagem oferece o melhor equilíbrio entre extrema performance para "exércitos" e flexibilidade para personagens únicos, sem a complexidade excessiva de Texture Atlases dinâmicos.

---

## Pilha Tecnológica (Tech Stack)
- **Frontend/Offline:** IndexedDB (via Dexie ou idb) para enfileiramento de ações.
- **Backend/DB:** Supabase (PostgreSQL) com índices `tsvector` para Full-Text Search.
- **Renderização:** Three.js / React Three Fiber (`<InstancedMesh>`).

## Estrutura de Arquivos Planejada

### [MODIFY] Componentes WebGL
- `components/battle/BattleGrid3D.tsx`: Refatoração para injetar `<InstancedMesh>` baseado em grupos de tokens.

### [NEW] Camada de Sincronização (CRDT)
- `lib/sync/OfflineQueueManager.ts`: Gerenciador de fila usando IndexedDB para reter ações do WebSocket.
- `lib/sync/CRDTSolver.ts`: Lógica de resolução de conflitos (Timestamp / Authority).

### [NEW] SRD no Banco de Dados
- `supabase/migrations/20260725_srd_schema.sql`: Tabelas `srd_spells` e `srd_monsters` com índices GIN para busca textual.
- `lib/repositories/supabase/SupabaseSRDRepository.ts`: Repositório de leitura focado no banco, substituindo a leitura estática.
- scripts utilitários para popular o Supabase lendo do `srd-data.ts`.

---

## Detalhamento das Tarefas (Task Breakdown)

### Tarefa 1: Otimização do Compêndio SRD (PostgreSQL Full-Text)
- **Agent:** `backend-specialist` | **Skill:** `database-design`
- **INPUT:** Arquivo `srd-data.ts` atual.
- **OUTPUT:** Migração SQL com `srd_spells`/`srd_monsters` e índices `tsvector`. Criação do `SupabaseSRDRepository.ts`.
- **VERIFY:** Consultar magias via API e atestar tempos de reposta < 100ms. O bundle frontend não deve mais importar o mega-arquivo JSON/TS do SRD.

### Tarefa 2: Fila de Sincronização e IndexedDB
- **Agent:** `frontend-specialist` | **Skill:** `architecture`
- **INPUT:** `useRealtimeSync.ts` atual.
- **OUTPUT:** Módulo `OfflineQueueManager` que intercepta ações quando WebSocket cai, salvando localmente.
- **VERIFY:** Desconectar a rede, mover um token, reconectar a rede -> O token deve atualizar no banco e nos outros clientes sem quebrar o estado local.

### Tarefa 3: InstancedMesh no BattleGrid3D
- **Agent:** `frontend-specialist` | **Skill:** `performance-profiling`
- **INPUT:** `BattleGrid3D.tsx`.
- **OUTPUT:** Uso inteligente de `<InstancedMesh args={[geometry, material, count]}>` separando tokens por "tipos" ou utilizando Texture Atlas.
- **VERIFY:** Renderizar um mock de 300 tokens na tela, FPS deve manter 60 e os Draw Calls devem reduzir drasticamente.

---

## ✅ Fase X: Verificação Final (Checklist)
- [ ] Nenhuma das mudanças quebrou as suítes de testes unitários (`npm run test`).
- [ ] Sem violação de regras de UI (sem cores roxas/violetas).
- [ ] Auditoria de performance executada comprovando ganho no FPS do Grid3D.
- [ ] Build concluído com sucesso (`npm run build`).
