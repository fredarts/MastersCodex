# Plano de Implementação: Suporte a Tamanho de Criaturas no Grid de Batalha (2D & 3D)

Este plano descreve como implementar o dimensionamento proporcional de criaturas no grid de batalha (2D e 3D) de acordo com o Livro de Regras do RPG (D&D 5e, Tormenta20, Pathfinder). Criaturas Grandes, Enormes, Imensas/Gargântuas e Miúdas ocuparão a quantidade correta de células no grid e terão seus tokens/modelos renderizados no tamanho adequado.

---

## 🤖 Agentes Recrutados
- **`project-planner`**: Estruturação de fases, mapeamento de dependências e plano de verificação.
- **`game-developer`**: Mecânicas de grid tático, cálculo de ocupação espacial de tokens, matemática 2D/3D e renderização Canvas/Three.js.

---

## 1. Tabela de Escala de Tamanhos (Livro de Regras)

| Tamanho (PT-BR) | Size (EN) | Ocupação no Grid | Dimensão | Fator de Escala (2D/3D) |
| :--- | :--- | :--- | :--- | :--- |
| **Miúdo** | Tiny | 1 célula (ou 0.5x0.5) | 2.5 pés | 0.6x (token menor) |
| **Pequeno** | Small | 1x1 célula | 5 pés | 1.0x (padrão) |
| **Médio** | Medium | 1x1 célula | 5 pés | 1.0x (padrão) |
| **Grande** | Large | 2x2 células | 10 pés | 2.0x (ocupa 4 células) |
| **Enorme** | Huge | 3x3 células | 15 pés | 3.0x (ocupa 9 células) |
| **Imenso / Gigante / Gargântua** | Gargantuan | 4x4+ células | 20+ pés | 4.0x (ocupa 16 células) |
| **Colossal** | Colossal | 6x6 células | 30+ pés | 6.0x (ocupa 36 células) |

---

## 2. Componentes e Arquivos Atingidos

### 2.1 Novo Utilitário Centralizado (`lib/utils/creatureSize.ts`)
- Função `getCreatureGridSize(sizeStr?: string): { gridSquares: number; scaleFactor: number; dimensionFeet: number }`
- Trata strings em Português ("Grande", "Enorme", "Imenso", "Miúdo", "Gigante", "Pequeno", "Médio") e Inglês ("Large", "Huge", "Gargantuan", "Tiny", "Small", "Medium").

### 2.2 Modelos de Dados e Construtores de Combatentes
- **`lib/types.ts`**: Garantir que `Combatant` possui o campo `size?: string;`.
- **`components/SessionStudio.tsx`**: Preservar `size: m.size` ao criar combatentes a partir de SRD monsters e Custom monsters.
- **`components/CombatTracker.tsx`**: Preservar `size: m.size` ao adicionar monstros ao combate.
- **`components/live-cockpit/AddCombatantModal.tsx`**: Já passa `size`, validar se está correto para jogadores e monstros.

### 2.3 Grid Tático 2D (`components/map/DysonCanvas.tsx`)
- **Renderização de Tokens no Canvas:**
  - Em vez de desenhar um círculo fixo em 1 célula (`CELL_SIZE * 0.4`), calcular a posição central e o diâmetro do token usando `CELL_SIZE * gridSquares`.
  - Renderizar imagens de tokens (billboard/2D avatar) expandidas para cobrir toda a área de células que a criatura ocupa.
- **Seleção e Hitbox no Canvas:**
  - Atualizar o teste de clique (hit test) para aceitar cliques em qualquer célula dentro do raio de ocupação `[r .. r + gridSquares - 1, c .. c + gridSquares - 1]`.
- **Arraste e Solte (Drag & Drop):**
  - Ajustar o encaixe do token (snap to grid) para posicionar criaturas multi-célula de forma alinhada ao grid.

### 2.4 Cockpit e Visão do Jogador (`CockpitDungeonMap.tsx` / `PlayerViewModal.tsx` / `LiveVisualMirror.tsx`)
- Sincronizar o tamanho do token nas miniactical views e no espelhamento do jogador.
- Garantir que a iluminação/névoa de guerra e visão de linha de visão (LoS) considere o centro ou a área da criatura.

### 2.5 Grid Tático 3D (`components/battle-3d/Token3DMesh.tsx` & `lib/hooks/useToken3DManager.ts`)
- **Anéis de Seleção e Sombras:** Multiplicar o raio do `CircleGeometry` e do anel de turno por `gridSquares`.
- **Sprites 2D Billboard:** Escalar a largura e altura da textura billboard de acordo com `gridSquares`.
- **Modelos 3D GLTF:** Ajustar a escala tridimensional do modelo para preencher o número de células do grid correspondente ao seu tamanho.
- **Posicionamento 3D:** Centralizar o modelo 3D no centro da área de ocupação (ex: para criatura 2x2, o centro fica exatamente no encontro das 4 células).

---

## 3. Plano de Fases para Execução

### Fase 1: Módulo Central de Tamanho e Garantia de Dados
- [ ] Criar `lib/utils/creatureSize.ts` com parsers robustos para todos os tamanhos de RPG.
- [ ] Atualizar `SessionStudio.tsx` e `CombatTracker.tsx` para passar `size` na criação de `Combatant`.

### Fase 2: Grid 2D (`DysonCanvas.tsx` e Views de Mapa)
- [ ] Atualizar renderizador de tokens no `DysonCanvas.tsx` para desenhar borboletas/círculos/imagens com o diâmetro proporcional (`gridSquares * CELL_SIZE`).
- [ ] Atualizar seleção, hover e arrraste de tokens multi-célula.
- [ ] Atualizar `CockpitDungeonMap.tsx` e `PlayerViewModal.tsx`.

### Fase 3: Grid 3D (`Token3DMesh.tsx` & 3D Manager)
- [ ] Escalar anéis de seleção, sombras de chão, billboards 2D e malhas GLTF 3D em `Token3DMesh.tsx`.
- [ ] Ajustar raycasting e clique 3D para selecionar criaturas grandes e gigantes facilmente.

### Fase 4: Testes e Validação
- [ ] Adicionar um dragão / monstro Grande (2x2), Gigante (3x3/4x4) e um Goblin (1x1) no mapa.
- [ ] Verificar visualmente se a imagem cresce e preenche as células do grid corretamente.
- [ ] Testar movimentação, rotação e seleção em 2D e 3D.

---

## 4. Pergunta Aberta / Confirmação do Mestre
1. **Posicionamento de Célula de Origem:** Para criaturas de tamanho par (ex: Grande 2x2, Imenso 4x4), o ponto de ancoragem no grid será o canto superior esquerdo ou o centro geométrico das células? (Recomendado: Canto superior esquerdo como referência de coordenadas `(r, c)` ocupando `[r..r+N, c..c+N]`).
