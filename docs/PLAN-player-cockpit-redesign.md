# PLAN: Reformulação da Tela do Jogador (Player Cockpit Studio)

> **Goal:** Transformar a tela do Jogador (`PlayerLobby.tsx` e `PlayerViewModal.tsx`) em uma central de jogo imersiva (Cockpit do Jogador VTT) com Canvas Central (Ilustração/Grid 3D/Mapa 2D), Combat Tracker completo com Economia de Ações (Ação, Bônus, Reação, Movimento), Dock de Ataques/Magias de 1-clique, Header Unificado e Sidebar de Log/Chat.

---

## Estrutura da Solução

### 1. Header Unificado (Barra Superior)
- Remove a caixa estática "RESUMO DA MESA".
- Adiciona no topo:
  - Título da Campanha + Nome do Mundo/Cena.
  - Invite Code com badge e botão de copiar 1-clique.
  - Membros Online (`PresenceIndicator`) com avatares e estatuto.
  - Personagem Ativo + Botão para abrir/editar Ficha.
  - Botão de alternância **Modo TV / Discord** e **Sair da Mesa**.

### 2. Main Canvas Central
- Alternância entre:
  - **Grid de Combate 3D** (`BattleGrid3D` com token interativo).
  - **Mapa Dungeon 2D** (`DysonCanvas` com Fog of War).
  - **Ilustração / Cena** (`MagicShaderSlideshow` ou Vídeo/YouTube).

### 3. Combat Tracker Completo do Jogador & Action Dock
- **Iniciativa & Ordem de Turnos** em Carrossel/Lista.
- **Rastreador de Recursos de Turno**:
  - 🟢 Ação Padrão (Disponível/Usada)
  - 🟧 Ação Bônus (Disponível/Usada)
  - 🟦 Reação (Disponível/Usada)
  - 🏃 Deslocamento Restante (pés)
- **Dock de Ações de 1-Clique** (`PlayerTokenActionDock`):
  - ⚔️ Ataques com Armas da Ficha (Rolagem d20 + dano instantâneo)
  - ✨ Magias & Truques Preparados
  - ⚡ Habilidades da Classe (Retomar Fôlego, Fúria, etc.)
  - 🎲 Salvaguardas & Testes de Atributo

### 4. Sidebar Direita Integrada (Log + Chat)
- Abas: `[Iniciativa & Economia]`, `[Log da Aventura]`, `[Chat da Mesa]`.
- Integração dos componentes existentes `SharedGameLog` e `LiveChatPanel`.

---

## Arquivos Envolvidos
- `components/player-view/PlayerCombatTrackerHUD.tsx` [NEW]
- `components/player-view/PlayerTokenActionDock.tsx` [NEW]
- `components/PlayerLobby.tsx` [MODIFY]
- `components/PlayerViewModal.tsx` [MODIFY]
