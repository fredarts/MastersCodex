# PLAN: Dungeon Forge UI/UX Redesign (Photoshop & Modern VTT Studio Style)

**Task:** Redesenho completo da interface do Dungeon Forge (Editor de Mapas / VTT)
**Objetivo:** Transformar a interface sobrecarregada em um estúdio moderno, profissional e limpo inspirado no Photoshop/Figma/Foundry VTT, maximizando a área do canvas, organizando ações em Top Bar com menus, seletor de mapas em Modal dedicado, toolbar vertical com ícones e tooltips, e seletor de andares em Dropdown.

---

## 🎯 1. Diagnóstico da Interface Atual vs Nova Visão

### Problemas Atuais Identificados:
1. **Sidebar lateral engessada e pesada (280px fixa):** Rouba espaço nobre do canvas para listar mapas, andares e botões longos com textos repetitivos.
2. **Poluição visual e botões misturados:** Ações de arquivos, IA, iluminação, desenho e fog competem entre si com diferentes tamanhos e cores chamativas sem hierarquia clara.
3. **Gestão de Mapas rudimentar:** Uma simples lista vertical pequena dentro da sidebar que limita a visão das masmorras salvas.
4. **Gestão de Andares fragmentada:** Aparece na sidebar e também num switcher flutuante redundante no canto superior direito.

### Nova Visão (Photoshop & Studio VTT Layout):
1. **Top Bar Profissional (Menu & Status):**
   - **Esquerda:** Logo/Título + Nome do Mapa Ativo (com badge/botão "📁 Gerenciar Mapas") + **Dropdown de Andares/Pisos**.
   - **Centro:** Menus organizados em dropdowns compactos (`Arquivo`, `Ferramentas de Fog & Grid`, `Iluminação`) + Botão de Destaque 🪄 **Gerar Masmorra com IA**.
   - **Direita:** Indicador de Salvo/Modificado + Botão Primário **Salvar** + **Centralizar Mapa** + Atalhos/Ajuda.
2. **Barra de Ferramentas Vertical Flutuante (Estilo Photoshop / Illustrator):**
   - Barra ultrafina (48px) no lado esquerdo com ícones limpos (Lucide SVGs).
   - Sem textos poluindo a tela: **Tooltips elegantes no hover** com nome e atalho de teclado.
   - Estado ativo nítido com brilho/acento âmbar/ciano.
   - Painel contextual flutuante que se abre suavemente ao lado da ferramenta selecionada (ex: Paleta de Terrenos ao selecionar Pincel, Presets de Luz ao selecionar Iluminação, Seletor de Tokens em gaveta/modal rápido).
3. **Modal Dedicado "Gerenciador de Mapas" (Map Browser Modal):**
   - Grade de cards com os mapas da campanha.
   - Busca por nome, data de modificação, contagem de andares.
   - Ações de Criar Novo, Renomear, Duplicar e Excluir com confirmação segura.
4. **Dropdown de Andares Inteligente:**
   - Exibe o andar atual selecionado (ex: `🏛️ Andar 1: Cripta Central`).
   - Ao abrir: Lista ordenada dos andares com botões rápidos de renomear e excluir, e ação `+ Adicionar Novo Andar`.
5. **Área de Canvas Totalmente Desimpedida:**
   - 95%+ da tela livre para interação, desenho tático e visualização da masmorra.

---

## 🏗️ 2. Arquitetura de Componentes Proposta

```
components/
├── MapMaker.tsx                      # Orquestrador Principal do Editor
└── map/
    ├── DysonCanvas.tsx               # Canvas de desenho e renderização
    ├── DungeonGeneratorModal.tsx     # Modal de IA para gerar masmorra
    ├── DungeonTransitionModal.tsx    # Modal de transição de níveis/portas
    ├── MapMakerTopBar.tsx            # [NOVO] Barra Superior com Menus, Andares e Ações
    ├── MapMakerToolbar.tsx           # [NOVO] Barra de Ferramentas Vertical estilo Photoshop
    ├── MapManagerModal.tsx           # [NOVO] Modal Gerenciador de Mapas (Cards, busca, criação)
    ├── ToolSubBar.tsx                # [NOVO] Barra contextual flutuante (Terrenos, Fog, Luz, Box)
    └── TokenPickerDrawer.tsx         # [NOVO] Gaveta/Modal flutuante de seleção de Tokens
```

---

## 📋 3. Detalhamento dos Componentes

### A. `MapMakerTopBar.tsx`
- **Breadcrumb / Seletor:**
  - Botão `[ 📁 Mapas ]` que abre o `MapManagerModal`.
  - Título editável inline do mapa ativo com ícone de lápis.
  - **Dropdown de Andares**:
    - Trigger com o nome do piso atual e ícone de `Layers`.
    - Menu dropdown com lista de pisos, indicando piso ativo, botões de renomear/remover e item `+ Novo Andar`.
- **Menu Bar Suspenso:**
  - **Menu "Arquivo":** `Carregar Imagem de Fundo`, `Importar UVTT (.df2vtt/.uvtt)`, `Remover Imagem de Fundo`, `Calibrar Grid`.
  - **Menu "Visão & Fog":** `Revelar Todo o Fog`, `Ocultar Todo o Fog`, `Limpar Todo o Grid`.
  - **Menu "Exibir / Grid":** Alternar grade visual, escala de células, centralizar mapa.
- **Ações Rápidas em Destaque:**
  - Botão Gradiente **"🪄 Gerar Masmorra com IA"**.
  - Botão **"💾 Salvar"** (com feedback visual de alterações pendentes).

### B. `MapMakerToolbar.tsx` (Estilo Photoshop)
- Barra vertical compacta de ícones:
  - 🖌️ **Pincel (P)** -> Abre sub-barra de terrenos (Piso, Parede, Grama, Água, Porta, Baú, Armadilha, etc.)
  - ⬛ **Retângulo / Forma (R)** -> Abre sub-barra de modos (Preencher, Sala Completa, Contorno, Fog)
  - 👁️ **Revelar Fog (E)** -> Revelar névoa de guerra
  - 🙈 **Ocultar Fog (H)** -> Ocultar névoa de guerra
  - 🎭 **Tokens (T)** -> Abre painel de tokens de jogadores/monstros/NPCs
  - 💡 **Iluminação (L)** -> Abre presets de luz (Tocha, Vela, Lampião, Magia, Brazeiro)
  - 📏 **Régua (M)** -> Medição de distância em pés/metros
  - 🖐️ **Mover / Pan (Espaço ou V)** -> Navegar pelo canvas
  - 📐 **Calibrar Grid (C)** -> Ajuste fino se houver imagem de fundo
- **Tooltips Flutuantes**: Hover instantâneo com atalhos de teclado e descrição clara.

### C. `MapManagerModal.tsx`
- **Header:** Campo de busca rápida + Botão `+ Criar Novo Mapa`.
- **Conteúdo:** Grid responsivo de cards com:
  - Thumbnail / Preview estilizado com tema de pergaminho/masmorra.
  - Título do mapa e quantidade de andares.
  - Botão "Abrir Mapa", "Duplicar" e "Excluir".
  - Empty state elegante caso não existam mapas.

---

## 💡 4. Sugestões de Melhorias de UI/UX Adicionais

1. **Atalhos de Teclado (Hotkeys):**
   - `B` ou `P`: Pincel | `R`: Retângulo | `F`: Revelar Fog | `H`: Ocultar Fog | `Space + Drag`: Pan | `Ctrl+S`: Salvar.
2. **Minimap ou HUD de Zoom e Posição no Canto Inferior:**
   - Controles discretos de zoom `+ / - / 100% / Centralizar` no canto inferior direito.
3. **Design System & Dark Studio Palette:**
   - Fundo do estúdio em ardósia profunda (`#0a0d14` / `#0f141d`), bordas ultra-finas em `#1e293b`, acentos em Âmbar e Ciano dourado de alta legibilidade (sem saturação excessiva).

---

## 🚦 5. Plano de Fases de Implementação

- [ ] **Fase 1: Criação dos Componentes Modulares**
  - Implementar `MapManagerModal.tsx` com listagem em cards, busca e criação.
  - Implementar `MapMakerTopBar.tsx` com dropdown de andares e menus drop-down.
  - Implementar `MapMakerToolbar.tsx` com ícones compactos e tooltips.
- [ ] **Fase 2: Integração e Refatoração no `MapMaker.tsx`**
  - Substituir a antiga sidebar de 280px pela nova TopBar e Toolbar.
  - Ligar todos os handlers de estado existentes (andares, ferramentas, imports, IA, saves).
- [ ] **Fase 3: Refinamento Visual e Polimento UX**
  - Ajustar animações de entrada das sub-barras contextuais e tooltips.
  - Garantir compatibilidade total com o `DysonCanvas.tsx`.
- [ ] **Fase 4: Verificação & Testes**
  - Testar criação e troca de mapas via modal.
  - Testar adição e alternância de andares pelo dropdown.
  - Testar todas as ferramentas de desenho, iluminação e fog.
