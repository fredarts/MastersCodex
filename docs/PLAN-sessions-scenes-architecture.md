# PLAN: Gerenciador de Sessões de Jogo & Cenas Narrativas Ao Vivo

Este plano define a criação do módulo de **Sessões (Game Days)** e **Cenas (Live Play Moments)**.

---

## 🏛️ Estrutura

- **Sessão (`sessions`)**: O dia de narração preparado pelo Mestre (ex: *Sessão 3: O Assalto à Torre*).
- **Cena (`scenes`)**: Momento narrativo específico (Combate, Diálogo com NPC, Taverna, Masmorra).
- **Disparo em 1-Clique**: Clicar na cena ativa equipa automaticamente o Combat Tracker, Map Maker, Audio Maestro e Texto Sensorial.

---

## 📋 Fases de Implementação

1. **Fase 1**: Atualizar `supabase/schema.sql` com tabelas `sessions` e `scenes`.
2. **Fase 2**: Atualizar `lib/types.ts` e `AuthContext.tsx`.
3. **Fase 3**: Criar componente `SessionNavigator.tsx` com timeline de cenas.
4. **Fase 4**: Criar modal `CreateSceneModal.tsx`.
