# PLAN: Estúdio Editor de Mundo (World Editor Workspace)

Este plano define a criação do estúdio de detalhamento de Worldbuilding, permitindo ao Mestre explorar um Mundo e criar todas as suas entidades.

---

## 🎯 Categorias do Mundo

1. **👥 NPCs & Personagens**: Nome, Raça, Alinhamento, Motivações, Segredos.
2. **🏰 Geografia & Locais**: Reinos, Cidades, Vilas, Masmorras, Clima e População.
3. **⚜️ Facções & Guildas**: Ordens, Sindicatos, Líderes, Influência e Objetivos.
4. **⚡ Religiões, Deuses & Panteão**: Deuses, Domínios, Símbolos Sagrados e Dogmas.
5. **📜 Lore & Cronologia**: Eventos históricos passados e artefatos.
6. **🕸️ Lore Graph do Mundo**: Teia visual de conexões entre as entidades do mundo.
7. **✨ IA Geradora por Mundo**: Criação automática de cidades, religiões e NPCs no contexto do mundo.

---

## 📋 Fases de Implementação

1. **Fase 1**: Atualizar `supabase/schema.sql` com a tabela `world_entities`.
2. **Fase 2**: Atualizar `lib/types.ts` e `AuthContext.tsx`.
3. **Fase 3**: Criar componente `WorldEditor.tsx` e `WorldEntityModal.tsx`.
4. **Fase 4**: Conectar o **Lore Graph** para listar os nós do mundo ativo.
