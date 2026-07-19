# PLAN: Autenticação Supabase, Login Google e Perfis Duplos (Mestre & Jogador)

Este plano define a implementação do sistema de usuários do Co-Mestre RPG (Masters Codex), utilizando Supabase Auth com suporte a Login com o Google e permissões duplas (Dungeon Master + Jogador na mesma conta).

---

## 🎯 Escopo do Projeto

1. **Supabase Auth**:
   - Google OAuth 2.0 (`supabase.auth.signInWithOAuth({ provider: 'google' })`)
   - Autenticação por Email e Senha (com fallback)
   - Tabela `profiles` sincronizada com `auth.users` via Postgres Trigger.

2. **Perfis Duplos (DM Studio + Player Lobby)**:
   - Alternador de modo em 1 clique na barra superior.
   - **Mestre (DM)**: Pode criar mundos, gerenciar campanhas, importar SRD, usar Combat Tracker, Map Maker, Audio Maestro e IA.
   - **Jogador (Player)**: Pode ingressar em campanhas usando `invite_code`, criar e vincular fichas de personagem e assistir a sessões ao vivo via Supabase Realtime.

3. **Schema do Postgres (Supabase)**:
   - `profiles`: Perfil dos usuários.
   - `campaigns`: Campanhas criadas pelos mestres.
   - `campaign_members`: Relação entre usuários e campanhas com papéis (`dm` ou `player`).

---

## 📅 Fases de Execução

### Fase 1: Setup do Supabase Auth & Triggers no Postgres
- Criar migração SQL com as tabelas `profiles`, `campaigns` e `campaign_members` com RLS.
- Criar modal de autenticação `components/AuthModal.tsx`.

### Fase 2: Alternador de Papéis na Interface
- Atualizar `Header.tsx` para mostrar informações do usuário logado e botão de alternar entre "Studio do Mestre" e "Lobby do Jogador".

### Fase 3: Sistema de Convites e Ingressar na Mesa
- Gerar código de convite único (ex: `VALIRIA-89X`).
- Criar interface `components/PlayerLobby.tsx` para o jogador colar o código e se juntar à mesa.

### Fase 4: Validação & Testes
- Testar login via Google e Email.
- Testar troca de contexto em tempo real.
