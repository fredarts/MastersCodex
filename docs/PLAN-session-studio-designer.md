# PLAN: Estúdio de Criação de Sessões & Designer de Cenas (Session Studio Workspace)

Este plano define a criação do **Session Studio**, um ambiente completo para desenhar e enriquecer cada cena de uma sessão de RPG.

---

## 🎯 Recursos do Studio

1. **Timeline de Cenas Reordenáveis**: Organização visual da ordem do dia de jogo.
2. **🖼️ Imagem da Cena**: Arte de cenário para exibir no Player View.
3. **🎵 Maestro Áudio & Efeitos SFX**: BGM pré-selecionado e botões de atalho de efeitos sonoros.
4. **⚔️ Encontro de Combate**: Injeção de monstros SRD na cena.
5. **🎙️ Voz de NPC por IA**: Áudios narrados por inteligência artificial.
6. **📜 Texto Sensorial & Segredos**: Leitura em voz alta e notas ocultas do DM.

---

## 📋 Fases de Implementação

1. **Fase 1**: Atualizar `supabase/schema.sql` com colunas de mídia em `scenes`.
2. **Fase 2**: Atualizar `lib/types.ts` e `AuthContext.tsx`.
3. **Fase 3**: Criar componente `SessionStudio.tsx`.
4. **Fase 4**: Conectar à Sidebar e Player View.
