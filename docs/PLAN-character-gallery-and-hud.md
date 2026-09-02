# PLAN: Galeria de Imagens do Personagem, Edição com IA & Reordenação do HUD de Controle

> **Status:** Proposto / Em Planejamento  
> **Comando:** `/plan`  
> **Data:** 02/09/2026  
> **Alvo:** Ficha de Personagem ([`RPSection.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/RPSection.tsx)) & Lobby do Jogador ([`PlayerLobby.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerLobby.tsx), [`PlayerTokenActionDock.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/player-view/PlayerTokenActionDock.tsx))

---

## 1. Visão Geral & Objetivos

1. **Reordenação e Enriquecimento do HUD do Jogador no Lobby (`PlayerLobby.tsx`)**:
   - Inverter a prioridade visual na barra lateral direita: o **HUD de Controle do Personagem** (Ações, Armas, Magias, PV, CA, Inspiração e Botão da Ficha) agora fica no **topo** com destaque prioritário.
   - Adicionar o **Retrato de Rosto / Avatar** do personagem dentro do HUD com moldura estilizada, permitindo abrir a ficha diretamente ou ver o status do herói.
   - A lista de Membros Conectados (Party), Registro de Combate e Chat passam para a área inferior com scroll independente.

2. **Galeria de Imagens do Personagem na Ficha (`RPSection.tsx`)**:
   - Permitir que o personagem possua múltiplas imagens em uma galeria (`images: string[]`), idêntico ao sistema maduro das Entidades (`WorldEntityModal.tsx`).
   - Badges e marcações de finalidade:
     - 🎯 **Imagem de Combate** (`modelUrl` / `combatImageUrl`): usada no token/pino 3D e 2D no Grid de Batalha.
     - 👤 **Foto de Rosto / Avatar** (`avatarUrl` / `faceImageUrl`): usada no HUD do jogador, na lista de membros da party, na miniatura da ficha e diálogos.
     - ⭐ **Capa / Retrato Principal**.
   - Ações rápidas de 1 clique em cada card da galeria para definir como Combate, definir como Rosto, ampliar em Lightbox ou excluir.

3. **Edição e Geração Avançada com IA**:
   - Reduzir drasticamente a caixa de prompt/descrição atual (que hoje ocupa a coluna inteira), tornando-a compacta (2-3 linhas) com layout equilibrado.
   - Logo abaixo, posicionar a **Galeria de Miniaturas**.
   - Painel de Geração com:
     - Seletor de Estilos de Arte RPG (`RPG_IMAGE_STYLES`: Anime, Dark Fantasy, 3D Render, Pintura a Óleo, Pixel Art, etc.).
     - Seletor de Proporções / Aspect Ratio (`1:1`, `9:16`, `3:4`, `4:3`, `16:9`).
     - Botões de Preset Instantâneo: **[🎯 Pino de Combate]** (1:1 pose inteira fundo branco) e **[👤 Foto de Rosto / Porta-retrato]** (1:1 close-up).
   - Modal de **Edição por IA (Image-to-Image / Variação de Prompt)** ao clicar em uma imagem existente:
     - Opções claras no resultado gerado: **Substituir Original**, **Salvar ao Lado (Nova Variação na Galeria)** ou **Cancelar**.

---

## 2. Arquitetura & Modificações por Componente

```mermaid
graph TD
    A[CharacterSheet Data] --> B[images: string[] Galeria]
    A --> C[avatarUrl: Foto de Rosto]
    A --> D[modelUrl: Imagem de Combate]
    
    B --> E[RPSection.tsx - Galeria Compacta]
    E --> F[Gerador de IA com Estilos & Aspect Ratio]
    E --> G[Editor Image-to-Image com Substituir / Salvar ao Lado]
    
    C --> H[PlayerTokenActionDock.tsx - Topo do Sidebar]
    D --> I[Grid de Combate 3D / Token Billboard]
    
    H --> J[PlayerLobby.tsx - HUD no Topo + Party Embaixo]
```

---

## 3. Detalhamento dos Componentes

### 3.1. Tipos e Modelo de Dados ([`lib/types.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts))
- Estender `CharacterSheet`:
  ```typescript
  export interface CharacterSheet {
    // ... campos existentes
    avatarUrl?: string;        // Foto de Rosto / Avatar
    modelUrl?: string;         // Imagem de Combate / Billboard / 3D
    combatImageUrl?: string;   // Alias explícito de combate
    faceImageUrl?: string;     // Alias explícito de rosto
    images?: string[];         // Galeria de ilustrações do personagem
    tokenType?: 'billboard' | '3d';
  }
  ```

### 3.2. Ficha de Personagem - Aba de Biografia & Retrato ([`components/character-sheet/Sections/RPSection.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/RPSection.tsx))
1. **Layout Reestruturado**:
   - **Coluna Esquerda**:
     - Preview da Imagem Selecionada (com badges ativos de Rosto/Combate).
     - Caixa de prompt compacta (textarea reduzida a 2 linhas + botão estilizado "Gerar com IA").
     - Seletor de Estilos RPG e botões de proporção / presets rápidos (`🎯 Pino de Combate` e `👤 Foto de Rosto`).
     - **Galeria de Miniaturas** logo abaixo em grid responsivo (`grid-cols-3` / `grid-cols-4`) com botões de hover (Definir Rosto, Definir Combate, Editar com IA, Excluir).
   - **Coluna Direita**:
     - Características Físicas (Idade, Altura, Peso, Olhos, Pele, Cabelos) e Notas de Lore.
2. **Modal de Edição com IA (Image-to-Image)**:
   - Permite enviar uma imagem existente da galeria como referência visual.
   - O usuário digita a alteração desejada (ex: *"adicione uma cicatriz no olho direito e uma capa vermelha"*).
   - O preview da IA exibe a comparação Lado a Lado.
   - Botões de Ação:
     - 🔄 **Substituir Imagem Atual**
     - ➕ **Salvar ao Lado na Galeria**
     - ❌ **Cancelar / Manter Original**

### 3.3. HUD de Controle do Personagem ([`components/player-view/PlayerTokenActionDock.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/player-view/PlayerTokenActionDock.tsx))
- Incorporar o **Avatar de Rosto** do herói no cabeçalho do HUD:
  - Miniatura circular/arredondada com borda dourada/âmbar.
  - Indicador de status (PV atual / Max, CA, Inspiração).
  - Botão de acesso rápido à Ficha Completa.
- Otimizar o dock para ficar no topo da coluna com visual compacto e extremamente polido.

### 3.4. Barra Lateral do Jogador ([`components/PlayerLobby.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerLobby.tsx))
- **Inversão de Posição**:
  - **Topo da Barra Lateral**: `PlayerTokenActionDock` com o controle ativo do personagem, foto de rosto, barra de vida e abas de combate (Armas, Magias, Habilidades, Saves).
  - **Base da Barra Lateral**: Painel com Abas de `Membros Conectados (Party)`, `Registro de Combate (Log)` e `Chat`.
  - Scroll independente na seção de membros e logs sem empurrar o HUD do jogador para fora da tela.

---

## 4. Plano de Tarefas & Etapas

| Fase | Tarefa | Arquivos |
| :--- | :--- | :--- |
| **Fase 1** | **Modelo de Dados & Tipos**<br>Adicionar campos `images?: string[]`, `combatImageUrl?: string`, `faceImageUrl?: string` à `CharacterSheet`. | [`lib/types.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts) |
| **Fase 2** | **Galeria & Geração Compacta na Ficha**<br>Reduzir textarea de prompt em `RPSection.tsx`, adicionar galeria de miniaturas com badges de marcação (🎯 Combate / 👤 Rosto) e seletores de Estilo/Aspect Ratio. | [`components/character-sheet/Sections/RPSection.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Sections/RPSection.tsx) |
| **Fase 3** | **Editor Image-to-Image com IA**<br>Criar fluxo de edição de imagem existente com opções: *Substituir*, *Salvar ao lado* ou *Cancelar*. | [`components/character-sheet/Modals/CharacterImageAiEditorModal.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/character-sheet/Modals/CharacterImageAiEditorModal.tsx) |
| **Fase 4** | **Avatar & Enriquecimento do HUD**<br>Adicionar foto de rosto/avatar e tags de status no `PlayerTokenActionDock.tsx`. | [`components/player-view/PlayerTokenActionDock.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/player-view/PlayerTokenActionDock.tsx) |
| **Fase 5** | **Inversão de Layout no PlayerLobby**<br>Mover o HUD de controle para o topo da barra lateral e a lista de membros/party para a base com scroll. | [`components/PlayerLobby.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/PlayerLobby.tsx) |
| **Fase 6** | **Testes & Validação**<br>Verificação de tipos (`tsc --noEmit`), testes unitários de sincronia e verificação visual. | Suíte de testes vitest e TypeScript |
