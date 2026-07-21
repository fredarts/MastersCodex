# PLAN-realtime-backend: Conectividade Realtime Remota & Backend Supabase

> **Status:** 📝 Em Planejamento | **Prioridade:** 🔴 Alta | **Tipo de Projeto:** WEB (Next.js 15, Supabase, WebSockets)

---

## 📖 Visão Geral (Overview)

A **Fase 2** transforma o **Masters Codex** em uma verdadeira plataforma multiplayer online. Atualmente, a sincronização de projeção e movimento de tokens 3D utiliza a `BroadcastChannel API`, que só funciona localmente em abas do mesmo navegador.

Nesta fase, implementaremos:
1. **Supabase Realtime WebSockets:** Sincronização bidirecional entre Mestre e Jogadores em qualquer dispositivo/lugar do mundo.
2. **Persistência Completa no Supabase:** CRUD completo para Cenas, Entidades de Lore, Membros da Campanha e Feed Events.
3. **Segurança de Dados RLS (Row Level Security):** Proteção de segredos do Mestre (ex: `secret_notes` de cenas e soluções de enigmas).

---

## 🎯 Critérios de Sucesso (Success Criteria)

- [x] Hook `useRealtimeSync.ts` criado com suporte a canais WebSocket do Supabase Realtime e fallback transparente para `BroadcastChannel`.
- [x] Movimentações de Tokens 3D (`TOKEN_MOVE_3D`) e rotações (`TOKEN_ROTATE_3D`) sincronizadas instantaneamente em dispositivos remotos.
- [x] Atualização em tempo real de projeção de telas (`artwork`, `map`, `combat`) na visão dos Jogadores (`PlayerViewModal` / `PlayerLobby`).
- [x] Tabela `scenes` e tabelas do Supabase publicadas no `supabase_realtime`.
- [x] Políticas RLS e View segura `scenes_player_view` criadas no schema para proteger `secret_notes` contra inspeção de rede por parte dos jogadores.
- [x] Persistência de Cenas e Sessões funcionando tanto no Supabase quanto no LocalStorage (offline fallback).
- [x] Compilação de tipos TypeScript limpa (`npx tsc --noEmit`).
- [x] Build de produção aprovado (`npm run build`).

---

## 🛠️ Stack Tecnológica & Decisões

| Tecnologia | Uso Atual | Decisão na Fase 2 | Justificativa |
| :--- | :--- | :--- | :--- |
| **Supabase Realtime** | Inativo / Apenas Supabase Auth | Ativação de Channels & Broadcast WebSockets | Permitir comunicação em tempo real de baixíssima latência entre Mestre e Jogadores em dispositivos remotos. |
| **Fallback Mechanism** | Nítido apenas em 1 aba | Manter `BroadcastChannel` como Fallback quando o Supabase não estiver configurado | Garantir que o modo Demo offline continue funcionando perfeitamente sem precisar de chaves da API. |
| **Supabase RLS Policies** | Abertas (`USING true`) | Restringir `secret_notes` apenas ao `dm_id` criador da cena | Impedir spoilers da aventura via inspecionamento de requisições JSON. |

---

## 📁 Estrutura de Arquivos Proposta

```
Masters Codex/
├── lib/
│   ├── hooks/
│   │   └── useRealtimeSync.ts    # [NOVO] Client hook para WebSockets do Supabase Realtime
│   └── supabase.ts               # Suporte a Realtime client
├── supabase/
│   └── schema.sql                # [MODIFY] Habilitação de Realtime + Políticas RLS Seguras
├── context/
│   ├── LiveCockpitContext.tsx    # [MODIFY] Conectado ao useRealtimeSync
│   ├── SessionContext.tsx        # [MODIFY] Persistência remota de cenas/sessões
│   ├── WorldContext.tsx          # [MODIFY] Persistência remota de entidades de lore
│   └── CampaignContext.tsx       # [MODIFY] Persistência remota de feed/membros
├── components/
│   ├── PlayerLobby.tsx           # [MODIFY] Reação em tempo real às projeções do Mestre
│   └── PlayerViewModal.tsx       # [MODIFY] Sincronização 3D e cenas ao vivo
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Task 1: Criar o Engine `useRealtimeSync.ts`
- **Agente:** `backend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P0 | **Dependências:** Nenhuma
- **Input:** `lib/supabase.ts` e `context/LiveCockpitContext.tsx`.
- **Output:** `lib/hooks/useRealtimeSync.ts` lidando com subscrição de canais Supabase Realtime (`masters_codex_campaign_${campaignId}`) e fallback para `BroadcastChannel`.
- **Verificação:** `npx tsc --noEmit`.

### Task 2: Habilitar Supabase Realtime & Atualizar `schema.sql`
- **Agente:** `database-architect` | **Skill:** `database-design`
- **Prioridade:** P0 | **Dependências:** Task 1
- **Input:** `supabase/schema.sql`.
- **Output:** Comandos SQL de publicação `ALTER PUBLICATION supabase_realtime ADD TABLE ...` para `campaign_members`, `scenes`, `sessions`, `campaign_feed_events`.
- **Verificação:** Inspeção de sintaxe SQL no arquivo.

### Task 3: Implementar RLS para Proteção de Segredos do Mestre (`secret_notes`)
- **Agente:** `security-auditor` / `database-architect` | **Skill:** `vulnerability-scanner`
- **Prioridade:** P1 | **Dependências:** Task 2
- **Input:** Tabela `scenes` em `supabase/schema.sql`.
- **Output:** Políticas RLS onde `secret_notes` não é retornado para usuários com papel `'player'`.
- **Verificação:** Auditoria das regras RLS no schema.sql.

### Task 4: Integrar Persistência do Supabase no `SessionContext` e `WorldContext`
- **Agente:** `backend-specialist` | **Skill:** `clean-code`
- **Prioridade:** P1 | **Dependências:** Task 2
- **Input:** `context/SessionContext.tsx` e `context/WorldContext.tsx`.
- **Output:** Funções `createScene`, `updateScene`, `createWorldEntity`, `deleteWorldEntity` salvando no Supabase quando `isSupabaseConfigured()` for verdadeiro.
- **Verificação:** `npx tsc --noEmit`.

### Task 5: Conectar `PlayerLobby.tsx` e `PlayerViewModal.tsx` ao Realtime
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Prioridade:** P2 | **Dependências:** Tasks 1 e 4
- **Input:** Componentes `PlayerLobby.tsx` e `PlayerViewModal.tsx`.
- **Output:** Telas dos Jogadores reagindo instantaneamente a mudanças de cena, dados rolados e movimentação dos tokens 3D no BattleGrid.
- **Verificação:** `npx tsc --noEmit` & `npm run build`.

---

## 🧪 Fase X: Checklist de Verificação Final (Definition of Done)

- [ ] **Verificação de Tipagem:** `npx tsc --noEmit` sem erros.
- [ ] **Build de Produção:** `npm run build` gerado com sucesso.
- [ ] **Auditoria de Segurança:** `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`
- [ ] **Verificação Manual:** Simular Mestre e Jogadores conectados recebendo atualizações remota de dados e movimentação 3D.
