# PLAN: Painel de Configurações da Campanha & Feed da Jornada (Timeline Log)

Este plano define a criação do painel de **Configurações Gerais da Campanha** e **Feed Chronológico da Jornada**.

---

## 🎯 Conteúdo do Painel

1. **📜 Feed Chronológico da Jornada**:
   - Log automático de resumos de batalha, encontros com NPCs, recaps de sessões e marcos de nível.
   - Alternador de visibilidade **`👁️ Público`** vs **`🔒 Privado do Mestre`**.
2. **👥 Gestão de Elenco & Jogadores**: Código de convite (`VALIRIA-89X`), roster de jogadores e personagens.
3. **📜 Regras da Casa (House Rules)**: Cadastro de regras da mesa (ex: *Descanso Curto 8h*, *Poção como Ação Bônus*).
4. **🤖 Preferências do Co-Mestre IA**: Estilo de tom da narração (*Heróico*, *Dark Fantasy*, *Cômico*).
5. **📥 Exportação do Diário**: Exportar histórico da aventura em PDF / Markdown.

---

## 📋 Fases de Implementação

1. **Fase 1**: Atualizar `supabase/schema.sql` com tabelas `campaign_feed_events` e `campaign_settings`.
2. **Fase 2**: Atualizar `lib/types.ts` e `AuthContext.tsx`.
3. **Fase 3**: Criar componente `CampaignSettingsStudio.tsx`.
4. **Fase 4**: Conectar ao Sidebar e auto-logging de combate.
