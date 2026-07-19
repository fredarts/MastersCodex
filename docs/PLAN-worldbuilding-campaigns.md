# PLAN: Worldbuilding Independente & Campanhas Derivadas

Este plano estabelece a separação conceitual entre **Mundos (Worldbuilding)** e **Campanhas (Mesas de Jogo)**.

---

## 🏛️ Estrutura

- **Mundos (`worlds`)**: Coleção independente de lore, NPCs, facções, geografias e mapas criados pelo Mestre.
- **Campanhas (`campaigns`)**: Instância de uma mesa de jogo ao vivo vinculada a um Mundo através do `world_id`.
- Um mesmo **Mundo** pode ser o alicerce de **múltiplas campanhas simultâneas**.

---

## 📋 Fases de Implementação

1. **Fase 1**: Atualizar `supabase/schema.sql` com tabelas `worlds` e `world_lore_nodes`.
2. **Fase 2**: Atualizar `AuthContext.tsx` e tipos em `lib/types.ts`.
3. **Fase 3**: Criar componente `WorldbuilderStudio.tsx` para gerenciar a biblioteca de mundos.
4. **Fase 4**: Atualizar `CreateCampaignModal.tsx` com o seletor do Mundo Base.
