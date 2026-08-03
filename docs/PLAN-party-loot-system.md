# PLAN-party-loot-system: Sistema de Party & Distribuição de Loot em Tempo Real

> **Status:** 📝 Em Planejamento | **Prioridade:** 🟡 Média-Alta | **Tipo de Projeto:** WEB (Next.js 15, Supabase Realtime, BroadcastChannel)

---

## 📖 Visão Geral (Overview)

Implementação do sistema multiplayer de **Grupo de Jogadores (Party)**, **Distribuição de Loot pelo Mestre** e **Troca de Itens/Moedas entre Personagens**.

### Requisitos Principais:
1. **Envio de Loot pelo Mestre**: Mestre envia itens e moedas para a Party com título e descrição.
2. **Modos de Distribuição**:
   - **Líder da Party**: Apenas o líder pode atribuir cada item aos membros.
   - **Livre (Free-For-All)**: Qualquer jogador pode resgatar o item que desejar.
3. **Registro de Resgate em Tempo Real**: Cada item pego mostra o badge `[Pego por: Nome do Personagem]` até a sessão fechar.
4. **Destruição Automática**: Quando todos os itens e moedas forem zerados/resgatados, o modal é automaticamente destruído.
5. **Divisão de Dinheiro em Partes Iguais**: Botão para calcular e transferir instantaneamente a parte de cada membro da party.
6. **Envio Direto de Itens (Player ↔ Player & Player ↔ Party)**: Jogadores podem transferir itens e dinheiro entre si ou para a mesa.

---

## 📁 Estrutura de Arquivos Proposta

```
Masters Codex/
├── lib/
│   ├── types.ts                    # [MODIFY] Adição dos tipos PartyLootSession, PartyLootItem, payloads Realtime
│   ├── hooks/
│   │   └── useRealtimeSync.ts      # [MODIFY] Registro de eventos PARTY_LOOT_* e PLAYER_ITEM_TRANSFER
│   └── services/
│       └── partyLootService.ts     # [NOVO] Lógica de resgate, distribuição, divisão de dinheiro e trocas
├── supabase/
│   └── schema.sql                  # [MODIFY] Tabela party_loot_sessions e publicação supabase_realtime
├── context/
│   └── PartyLootContext.tsx        # [NOVO] Provedor do estado global de Loot ativo na campanha
├── components/
│   ├── loot/
│   │   ├── DmLootCreatorModal.tsx  # [NOVO] Interface do Mestre para montar e enviar o loot
│   │   ├── PartyLootModal.tsx      # [NOVO] Modal interativo da Party com tempo real, divisão e histórico
│   │   └── ItemTransferModal.tsx   # [NOVO] Modal para envio direto entre players/party
│   └── character-sheet/
│       └── EquipmentTab.tsx        # [MODIFY] Botão "Enviar para Parceiro / Party" na ficha
```

---

## 📋 Detalhamento das Tarefas (Task Breakdown)

### Task 1: Modelos de Dados & Eventos Realtime
- **Agente:** `backend-specialist` | **Skill:** `clean-code`
- **Output:** `lib/types.ts` atualizado com interfaces de `PartyLootSession`, `PartyLootItem` e payloads em `useRealtimeSync.ts`.

### Task 2: Schema Supabase & `partyLootService.ts`
- **Agente:** `database-architect` / `backend-specialist` | **Skill:** `database-design`
- **Output:** Tabela `party_loot_sessions` no `schema.sql` e funções no `partyLootService.ts` para CRUD e divisão de moedas.

### Task 3: Contexto `PartyLootContext.tsx`
- **Agente:** `frontend-specialist` | **Skill:** `clean-code`
- **Output:** Provider que gerencia a sessão de loot ativa e responde instantaneamente a eventos realtime.

### Task 4: UI do Mestre (`DmLootCreatorModal.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Output:** Interface responsiva para o Mestre criar recompensas, definir o modo (Líder / Livre) e enviar para a party.

### Task 5: UI da Party (`PartyLootModal.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Output:** Modal realtime com badges de histórico `[Pego por X]`, botão de divisão igualitária de moedas e fechamento/destruição automática.

### Task 6: Transferência Direta entre Jogadores (`ItemTransferModal.tsx`)
- **Agente:** `frontend-specialist` | **Skill:** `frontend-design`
- **Output:** Funcionalidade de envio direto de itens do inventário da ficha para outro jogador ou para a party.

---

## 🧪 Critérios de Verificação
- [ ] `npx tsc --noEmit` executado sem erros de tipo.
- [ ] Mestre envia loot -> Modal abre instantaneamente para todos os membros da party.
- [ ] Resgate de item atualiza badge `[Pego por: X]` para todos os clientes conectados via Supabase Realtime / BroadcastChannel.
- [ ] Divisão igualitária calcula resto e credita moedas nas fichas de todos os membros.
- [ ] Destruição do modal assim que o último item/moeda for consumido.
- [ ] Transferência direta move item da ficha de Player A para Player B.
