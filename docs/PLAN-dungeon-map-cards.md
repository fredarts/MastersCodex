# PLAN: Dossier de Masmorras, Capas com IA e Exploração Sincronizada no Cockpit e TV

> **Contexto:** Aprimoramento da tela de seleção de mapas de masmorras nas cenas e introdução da tela de abertura e exploração cinematográfica no Cockpit do Mestre e telas dos Jogadores/TV.

---

## 🎯 Proposta Arquitetural e de Design

### 1. Metadados Enriquecidos da Masmorra (`lib/types.ts`)
- `description?: string`: Descrição narrativa, rumores e história da dungeon para leitura do Mestre.
- `challengeRating?: string`: Nível de Desafio / Faixa de Nível recomendada (*Iniciante 1-3*, *Intermediário 4-6*, *Perigoso 7-10*, *Mortal 11+*).
- `coverImageUrl?: string`: Imagem/Arte de Capa ilustrada da masmorra (gerada com IA Nano Banana 2 ou upload).
- `difficultyTier?: 'easy' | 'medium' | 'hard' | 'deadly'`: Categoria visual de perigo.

### 2. Dossier Studio de Masmorras (`components/session/SceneDungeonMapsStudio.tsx`)
- Layout Split-View em 2 colunas:
  - **Coluna Esquerda (35%)**: Lista de Masmorras da Campanha com capas, títulos, badges de perigo e checkbox de associação à cena.
  - **Coluna Direita (65% - Dossier da Masmorra Selecionada)**:
    - Capa ilustrada em destaque + botão de geração de arte com IA (`SceneImageAiModal`) e upload.
    - Seletor estilizado de Nível de Desafio (CR) e Textarea de Lore/Descrição da Masmorra.
    - Estatísticas da masmorra (andares, tamanho da grade, paredes e iluminação).
    - Botão de vincular à cena e salvar dados do mapa.

### 3. Tela de Abertura Cinemática & Sincronização no Cockpit (`CockpitDungeonMap.tsx` / `PlayerViewModal.tsx`)
- **Antes de Iniciar a Exploração**:
  - Exibe a Capa da Masmorra em tela cheia com título, nível de perigo e texto de introdução para o narrador.
  - As telas dos Jogadores e TV exibem a capa imersiva sem spoilers do mapa tático ou monstros.
  - Botão de ação para o Mestre: **"⚔️ Iniciar Exploração da Masmorra"**.
- **Ao Iniciar**:
  - Transição cinematográfica sincronizada via Realtime/Broadcast.
  - Desvanece a capa e revela o mapa tático com Fog of War, LOS, iluminação e tokens dos personagens!
  - Botão no HUD do Mestre para revisitar a Capa/Lore a qualquer momento.
