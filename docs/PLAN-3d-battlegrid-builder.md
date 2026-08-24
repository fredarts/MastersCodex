# PLAN: Construtor de Cenários 3D & Customização de Grid (3D BattleGrid Forge)

> **Documento de Arquitetura e Engenharia de Software**  
> **Status:** Pronto para Revisão & Aprovação  
> **Agente Principal:** `@[game-developer]` + `@[frontend-specialist]` + `@[project-planner]`  

---

## 🎯 Visão Geral & Objetivos

Transformar o **Combat Grid 3D** do Masters Codex em uma ferramenta completa de criação tática de arenas e masmorras 3D (estilo *Talespire* / *Dungeon Alchemist* / *Foundry VTT 3D*), permitindo que o Mestre:
1. **Redimensione e Mude o Formato do Tabuleiro:** Grids retangulares customizados (ex: 20x30, 40x40, 60x60), formatos **Quadrado**, **Hexagonal** e **Arena Circular**.
2. **Adicione Blocos de Construção 3D (Building Blocks):** Paredes, pilares, colunas, portas operáveis, escadas, barricadas e fogueiras que **bloqueiam movimento e linha de visão (Line of Sight/Sombras) dinamicamente**.
3. **Pinte e Decore Terrenos:** Múltiplas texturas e biomas (Masmorra de Pedra, Caverna de Gelo, Floresta, Ruínas Vulcânicas).
4. **Utilize Ferramentas Táticas Avançadas 5e:** Medidores de Magia 3D (Cones, Esferas, Cubos), Elevação Vertical de Tokens (Voo/Andares) e Cálculo Automático de Cobertura (*Half-Cover / Three-Quarters Cover*).

---

## 🧱 1. Especificação de Recursos & Funcionalidades

### A. Dimensões & Formatos do Grid (Grid Customization)
* **Tamanhos Customizáveis:** Slider/Inputs de Largura e Comprimento de 6x6 (pequeno quarto) até 60x60 (campo aberto / masmorra épica).
* **Formatos de Grade:**
  * **Quadrado (Standard 5ft):** Sistema atual aprimorado com espaçamento milimétrico.
  * **Hexagonal (Pontas Verticais / Flat-topped):** Ideal para exploração em ermos ou combate tático avançado.
  * **Arena Circular / Anfiteatro:** Plataforma redonda com anéis concêntricos de raio de 15ft, 30ft, 60ft, 90ft.
* **Estilização Visual da Grade:**
  * Opacidade ajustável (0% a 100%).
  * Cor da grade (Azul arcano, Dourado, Branco sutil, Preto masmorra).
  * Tipo: Linhas contínuas, Pontos nos vértices (*Dot-grid*) ou Sem grade (*Gridless*).

---

### B. Sistema de Blocos de Construção 3D (Modular Building Blocks)
Blocos com geometrias modulares de 2x2 unidades Three.js (5ft x 5ft):

| Categoria | Bloco | Comportamento no Jogo | Efeito na Iluminação / Visão |
|---|---|---|---|
| **Estruturas** | **Parede de Pedra / Madeira** | Bloqueia movimento | Bloqueia 100% de luz e visão (gera sombra) |
| **Estruturas** | **Pilar / Coluna** (Redondo / Quadrado) | Bloqueia movimento na célula | Bloqueia linha de tiro (concede Cobertura 5e) |
| **Estruturas** | **Mureta / Barricada Baixa** | Custo de terreno difícil (2x) | Concede Meia-Cobertura (+2 CA) sem tapar visão |
| **Passagens** | **Porta de Madeira / Ferro** | Clicável: Abre / Fecha | Fechada: bloqueia visão; Aberta: luz atravessa |
| **Elevação** | **Plataforma / Escada (5ft / 10ft)** | Permite subir para andar superior | Eleva a coordenada Y dos tokens posicionados |
| **Objetos** | **Fogueira / Braseiro** | Causa dano de fogo se pisar | Emite luz de tocha dinâmica própria (`PointLight`) |
| **Objetos** | **Baú de Tesouro / Barris** | Interagível (Abre loot) | Obstáculo de cobertura leve |

---

### C. Novas Funcionalidades Sugeridas de Alto Valor (Nível Foundry / Talespire)

1. **Templates de Área de Magia 3D (3D Spell Templates):**
   * Ferramenta para posicionar instantaneamente:
     * **Esfera / Cilindro:** Raio de 10ft, 20ft (ex: *Bola de Fogo*), 30ft com cúpula semitransparente brilhante.
     * **Cone:** 15ft, 30ft, 60ft (ex: *Mãos Flamejantes*, *Sopro de Dragão*).
     * **Cubo:** 10ft, 20ft (ex: *Padrão Hipnótico*).
     * **Linha:** 30ft, 60ft, 100ft (ex: *Relâmpago*).
   * **Detecção Automática:** O sistema destaca e lista em tempo real todos os tokens atingidos pela área da magia!

2. **Elevação Vertical de Tokens (Voo, Escalada e Natação):**
   * Controle de altitude em pés (+5ft, +10ft, +30ft, +60ft).
   * O token sobe fisicamente no espaço 3D com uma haste/sombra projetada no chão indicando sua posição no plano e a altura exata.
   * O cálculo de distância de ataque passa a usar Pitágoras 3D: $\text{Distância} = \sqrt{\Delta X^2 + \Delta Z^2 + \Delta Y^2}$.

3. **Cálculo Automático de Cobertura (D&D 5e Cover System):**
   * Ao mirar em um alvo com arco ou magia, o motor 3D faz múltiplos raycasts entre o atacante e os 4 cantos do token do defensor:
     * **Sem obstrução:** Cobertura normal.
     * **Obstruído por 1-2 cantos (barricada/pilar):** **Meia-Cobertura (+2 na CA e testes de DES)**.
     * **Obstruído por 3 cantos:** **Três-Quartos de Cobertura (+5 na CA e testes de DES)**.
     * **Obstruído por parede cheia:** **Sem Linha de Visão**.

4. **Gerenciador de Arenas (Salvar / Carregar Cenários):**
   * Botão para exportar a arena construída (blocos, texturas, iluminação e posições) como preset JSON na campanha e reutilizá-la em qualquer combate com 1 clique.

---

## 📐 2. Arquitetura Técnica & Modelo de Dados

### Nova Tipagem (`lib/types.ts` & `lib/3d-building-blocks.ts`)

```typescript
export type GridShape = 'square' | 'hex' | 'circle';

export interface GridConfig3D {
  widthCells: number;      // Ex: 20 (padrão)
  heightCells: number;     // Ex: 20 (padrão)
  cellSizeFeet: number;    // Ex: 5
  shape: GridShape;        // 'square' | 'hex' | 'circle'
  lineColor: string;       // Ex: '#0284c7'
  lineOpacity: number;     // Ex: 0.35
  gridType: 'lines' | 'dots' | 'borderless';
}

export type BuildingBlockType = 
  | 'wall_stone' 
  | 'wall_wood' 
  | 'pillar_round' 
  | 'pillar_square' 
  | 'half_wall' 
  | 'door_wood' 
  | 'stairs' 
  | 'platform_5ft' 
  | 'campfire' 
  | 'chest' 
  | 'barrel';

export interface BuildingBlock3D {
  id: string;
  type: BuildingBlockType;
  x: number;               // Coordenada X no grid (unidades 3D)
  z: number;               // Coordenada Z no grid (unidades 3D)
  yElevation: number;      // Altura base (padrão 0)
  rotationDeg: number;     // 0, 45, 90, 180, 270
  state?: 'closed' | 'open'; // Para portas
  blocksVision: boolean;   // Se bloqueia FOW e luz
  blocksMovement: boolean; // Se impede andar
  providesCover: 'none' | 'half' | 'three_quarters' | 'full';
}
```

---

## 🛠️ 3. Plano de Implementação em Fases

### Fase 1: Motor de Customização do Grid 3D
* Criar hook e store para dimensões dinâmicas (`widthCells`, `heightCells`, `shape`).
* Atualizar gerador de malha do piso no `BattleGrid3D.tsx` para aceitar malhas retangulares, hexagonais e circulares (`CircleGeometry`, `PlaneGeometry`).
* Atualizar `GridHelper` para desenhar grades quadradas proporcionais e hexagonais.

### Fase 2: Módulo de Building Blocks 3D (`BuildingBlockManager.ts`)
* Implementar renderização procedural de blocos com materiais PBR de alta performance:
  * Paredes com texturas de alvenaria e chanfros.
  * Colunas e pilares com topo esculpido.
  * Portas clicáveis com animação suave de giro 90°.
  * Fogueiras com `PointLight` pulsante e partículas.
* Adicionar suporte a InstancedMesh para permitir centenas de paredes sem perda de FPS (60 FPS estável).

### Fase 3: Interface do Construtor do Mestre (DM Forge Toolbar)
* Adicionar painel retrátil **"🏗️ Construtor de Cenário"** no topo do grid 3D:
  * Seletor de blocos com ícones 3D.
  * Modo Colocar Bloco (clique no grid posiciona o bloco alinhado à célula).
  * Modo Girar Bloco (R) e Modo Deletar / Borracha (DEL / Clique direito).
  * Sliders de Dimensão do Grid (Largura x Comprimento) e Formato (Quadrado / Hex / Circular).

### Fase 4: Integração com Sombras Dinâmicas e FOW
* Os blocos colocados projetam sombras reais das tochas e do sol/luar.
* As paredes e pilares alimentam o algoritmo de *Line of Sight* já existente (`hasLineOfSight`), bloqueando a visão de jogadores no escuro e atrás de obstáculos.

### Fase 5: Templates de Magia 3D & Elevação Vertical
* Implementar ferramentas de desenho de magias (Esferas, Cones, Cubos e Linhas translúcidas de energia arcana/fogo).
* Adicionar controle de elevação de tokens com indicador visual de voo.

### Fase 6: Testes & Validação
* Escrever testes unitários em `lib/__tests__/building-blocks-3d.test.ts`.
* Garantir 0 erros de TypeScript e 100% de compatibilidade retroativa com sessões existentes.
