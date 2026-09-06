# PLAN: Otimização de Performance e Refatoração do Dungeon Forge

**Task:** Refatoração arquitetural completa do Dungeon Forge com separação em 4 Camadas de Canvas, baking offscreen de hachuras, iluminação sob demanda com cache per-pin e DDA raycasting, e modularização dos modais inline.
**Documento:** `docs/PLAN-dungeon-forge-opt.md`
**Tipo de Projeto:** WEB (Next.js 16 + React 19 + HTML5 Canvas 2D)
**Data:** 06/09/2026

---

## 🎯 1. Visão Geral & Problema a Resolver

O **Dungeon Forge** é o estúdio de criação de mapas e VTT 2D do Masters Codex inspirado no estilo artístico *Dyson Logos*.
Atualmente, o componente principal ([`DysonCanvas.tsx`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/DysonCanvas.tsx)) possui **5.193 linhas de código** e sofre de sérios gargalos de desempenho:

1. **Pipeline de Canvas Único (Monolítico):** Tudo (fundo, hachuras de pedra, linhas de tinta, 10 tipos de modais inline, névoa, luzes, sombras, tokens e réguas) é desenhado em um único Canvas 2D em um `useEffect` de 1.140 linhas.
2. **Cálculo de Luz e Sombras em Força-Bruta Contínua:**
   - O raycasting em [`visionCore.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/visionCore.ts) usa ray-marching com passos de 1.5 a 3.0 pixels (centenas de iterações por raio).
   - Não há cache por pino: quando qualquer token ou combatente muda, todas as tochas estáticas e tokens recalculam centenas de milhares de raios em JavaScript na thread principal.
3. **Desenho de Hachuras Devorando CPU:**
   - [`dysonCore.ts`](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/dysonCore.ts) executa até 15.000 chamadas à API Canvas 2D (`save`, `restore`, `quadraticCurveTo`, `stroke`) em cada redesenho.
   - Qualquer movimento de mouse com a régua ou pan do mapa refaz todas as hachuras do zero.

### 🌟 Objetivos da Refatoração
- **Camada Offscreen Bakada (Hachuras):** As hachuras, pisos e linhas orgânicas são desenhadas em um buffer estático apenas quando a topologia do mapa muda. O pan/zoom/movimento de pino passa a fazer apenas 1 blit de textura (`drawImage`), reduzindo o custo de ~40ms para 0.05ms.
- **Luz & Sombras Sob Demanda (Cache Per-Pin + DDA):**
   - Transição do ray-marching de pixels para **DDA (Digital Differential Analyzer)** na grade, acelerando o raycasting em 15x a 20x.
   - Cache com chave geométrica por pino (`id + pos + raio + versãoParedes`): se o Guerreiro se move, apenas ele recalcula a visibilidade; as tochas paradas recuperam o polígono em $O(1)$.
   - Animação suave de **flicker das tochas** isolada na camada de luz via `requestAnimationFrame`, modulando apenas a opacidade e raio de glow, **sem recalcular física de sombras**.
- **Arquitetura Multi-Canvas em 4 Camadas:**
   - Camada 1: Mapa Estático (Parchment + Hachuras + Linhas de Tinta)
   - Camada 2: Luz, Sombras & Fog de Guerra
   - Camada 3: Entidades & Pinos (Tokens, Marcadores POI, Tochas)
   - Camada 4: HUD & Interação (Régua Tática, Caixa de Seleção, Cursor)
- **Modularização Completa:** Extrair os 10 modais inline de dentro de `DysonCanvas.tsx` para `components/map/modals/`, reduzindo o arquivo de 5.200 linhas para componentes limpos, tipados e testados.

---

## 🏆 2. Critérios de Sucesso (Métricas)

- [ ] **Zero Redesenho de Hachuras em Pan/Zoom:** Mover a câmera ou a régua consome < 1ms de CPU para o mapa de fundo.
- [ ] **Zero Recálculo de Sombras em Pinos Estáticos:** Mover um único token recalcula estritamente 1 polígono de visão; tochas e outros tokens recuperam em $O(1)$ do cache.
- [ ] **Flicker Suave sem Lag:** Animação de tochas rodando a 60 FPS na Camada 2 sem disparar raycasting de sombra.
- [ ] **100% de Compatibilidade Funcional:** Todas as ferramentas existentes (Pincel, Caixa, Fog, Régua Ortogonal D&D 5e, Calibração, Modais de Baús/Armadilhas/Portas/Gatilhos) continuam funcionando sem regressão.
- [ ] **Suíte de Testes Automatizados:** Testes unitários com Vitest cobrindo cache de luz, DDA raycasting, baking de mapa e integridade de dados.

---

## 🛠️ 3. Estrutura de Arquivos Proposta

```
components/map/
├── DysonCanvas.tsx                   # [REFATORADO] Orquestrador das 4 Camadas de Canvas e Eventos
├── dysonCore.ts                      # Funções procedurais matemáticas Dyson
├── visionCore.ts                     # [OTIMIZADO] DDA Grid Raycasting e utilitários de LOS
│
├── layers/                           # [NOVO] Renderizadores das Camadas Isoladas
│   ├── StaticMapLayer.ts             # Gerenciador do Buffer Offscreen (Parchment, Hachuras, Paredes)
│   ├── LightingFogLayer.ts           # Renderizador de Fog, Visibilidade e Flicker das Luzes
│   ├── EntitiesLayer.ts              # Renderizador de Tokens e Ícones POI
│   └── InteractionOverlayLayer.ts    # Renderizador da Régua Ortogonal e Caixa de Seleção
│
├── hooks/                            # [NOVO] Hooks Especializados de Estado e Engine
│   ├── useLightingEngine.ts          # Cache per-pin de polígonos, dirty flags e loop de flicker
│   └── useStaticMapBake.ts           # Bake incremental e invalidação da camada estática
│
└── modals/                           # [NOVO] Modais Extraídos de DysonCanvas.tsx
    ├── DoorConfigModal.tsx           # Modal de configuração de portas (madeira, ferro, secreta)
    ├── TrapConfigModal.tsx           # Modal de armadilhas e salvaguardas
    ├── ChestConfigModal.tsx          # Modal de baús, trancas e mímicos
    ├── StashConfigModal.tsx          # Modal de esconderijos ocultos
    ├── TriggerConfigModal.tsx        # Modal de gatilhos e alavancas vinculadas
    ├── PortcullisConfigModal.tsx     # Modal de grades levadiças
    ├── IllusionWallConfigModal.tsx   # Modal de paredes ilusórias
    └── TransitionConfigModal.tsx     # Modal de transição de andares / escadas

lib/__tests__/
├── dynamic-lighting-fog.test.ts      # [EXISTENTE] Testes canônicos de visão e presets D&D 5e
├── dungeon-lighting-cache.test.ts    # [NOVO] Testes de cache per-pin, dirty flags e DDA
└── static-map-baking.test.ts         # [NOVO] Testes do buffer offscreen e invalidação
```

---

## 📋 4. Plano de Tarefas Detalhado

### FASE 1: Extração e Modularização dos Modais Inline (Desinchar `DysonCanvas.tsx`)

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---|---|---|---|---|---|
| **TSK-01** | Extrair Modais de POI para `components/map/modals/` | `frontend-specialist` | `clean-code`, `frontend-design` | **P0** | Nenhuma |

- **Descrição:** Mover os modais que hoje ocupam mais de 1.700 linhas em `DysonCanvas.tsx` (linhas 3440 a 5190) para componentes isolados:
  - `DoorConfigModal.tsx`
  - `TrapConfigModal.tsx`
  - `ChestConfigModal.tsx`
  - `StashConfigModal.tsx`
  - `TriggerConfigModal.tsx`
  - `PortcullisConfigModal.tsx`
  - `IllusionWallConfigModal.tsx`
  - `TransitionConfigModal.tsx`
- **INPUT:** Trechos JSX e handlers de edição de células em `DysonCanvas.tsx`.
- **OUTPUT:** 8 componentes modais tipados em `components/map/modals/` importados de volta no `DysonCanvas.tsx`.
- **VERIFY:** `npx tsc --noEmit` passa sem erros; abrir modal de porta, baú e armadilha na UI continua funcionando 100%.

---

### FASE 2: Motor DDA Raycasting & Cache Per-Pin de Iluminação

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---|---|---|---|---|---|
| **TSK-02** | Otimizar Raycasting em `visionCore.ts` com DDA | `game-developer` | `clean-code`, `game-development` | **P0** | Nenhuma |
| **TSK-03** | Criar Engine de Cache Per-Pin & Hook `useLightingEngine` | `game-developer` | `clean-code`, `performance-profiling` | **P0** | TSK-02 |
| **TSK-04** | Testes Automatizados da Engine de Iluminação e Cache | `test-engineer` | `clean-code`, `testing-patterns` | **P0** | TSK-03 |

- **TSK-02 Detalhes:**
  - Substituir o laço `while (currentDist < closestDist) rx += cosA * 1.5` por algoritmo DDA de célula em célula da grade.
  - Manter a interceptação exata para paredes vetoriais (`vectorWalls`).
  - **INPUT:** Função `computeVisibilityPolygon` em `components/map/visionCore.ts`.
  - **OUTPUT:** Versão acelerada por DDA (15x mais rápida).
  - **VERIFY:** Testes existentes em `lib/__tests__/dynamic-lighting-fog.test.ts` continuam passando 100%.

- **TSK-03 Detalhes:**
  - Criar `components/map/hooks/useLightingEngine.ts`:
    - Cache geométrico: `Map<string, { key: string, polygon: Point[] }>`.
    - Função `invalidatePin(pinId)` e `invalidateAll(reason)`.
    - Controle de animação de **flicker das tochas** em `requestAnimationFrame` que altera apenas `alphaMultiplier` e raio de blur do glow, reutilizando o polígono geométrico cacheado sem chamar raycast.
  - **INPUT:** Tokens de jogadores, fontes de luz, paredes.
  - **OUTPUT:** Hook que fornece os polígonos calculados sob demanda e o estado de pulsação suave das tochas.
  - **VERIFY:** Quando um pino se move, apenas 1 raycast é executado; tochas paradas usam cache.

- **TSK-04 Detalhes:**
  - Criar `lib/__tests__/dungeon-lighting-cache.test.ts`:
    - Testar que pino parado não recalcula polígono.
    - Testar que pino movido gera nova entrada no cache.
    - Testar que modificação de parede invalida o cache geral.
  - **VERIFY:** `npx vitest run lib/__tests__/dungeon-lighting-cache.test.ts` passa com 100% de sucesso.

---

### FASE 3: Motor de Baking Offscreen das Hachuras (Camada Estática)

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---|---|---|---|---|---|
| **TSK-05** | Implementar `StaticMapLayer` & `useStaticMapBake` | `game-developer` | `clean-code`, `performance-profiling` | **P1** | TSK-01 |
| **TSK-06** | Testes Automatizados de Invalidação e Baking | `test-engineer` | `clean-code`, `testing-patterns` | **P1** | TSK-05 |

- **TSK-05 Detalhes:**
  - Criar `components/map/layers/StaticMapLayer.ts`:
    - Cria um `HTMLCanvasElement` offscreen dimensionado para a masmorra.
    - Renderiza uma única vez: pergaminho, linhas do grid Dyson, todas as hachuras de parede (`drawDysonCrosshatch`), hachuras de água/grama/pisos, e as bordas de tinta orgânicas (`drawWobblyLine`).
    - Expõe método `renderToScreen(mainCtx, panOffset, zoom, viewportBounds)` que simplesmente faz `mainCtx.drawImage(...)`.
    - Expõe método `markDirty()` para quando o mestre pintar ou apagar células da grade.
  - **INPUT:** `grid`, `CELL_SIZE`, `distMap`, imagem de fundo.
  - **OUTPUT:** Renderização do fundo estático instantânea (< 0.1ms).
  - **VERIFY:** Durante pan, zoom ou medição de régua, o número de chamadas a `drawDysonCrosshatch` é ZERO.

- **TSK-06 Detalhes:**
  - Criar `lib/__tests__/static-map-baking.test.ts` verificando que a dirty flag é ativada apenas na mudança de tiles.
  - **VERIFY:** `npx vitest run lib/__tests__/static-map-baking.test.ts` passa com sucesso.

---

### FASE 4: Arquitetura Multi-Canvas Layering no `DysonCanvas.tsx`

| Task ID | Nome | Agente | Skills | Prioridade | Dependências |
|---|---|---|---|---|---|
| **TSK-07** | Estruturar os 4 Canvas Sobrepostos no JSX | `frontend-specialist` | `frontend-design`, `clean-code` | **P1** | TSK-01, TSK-03, TSK-05 |
| **TSK-08** | Integrar Camada de Interação & Régua no Canvas Superior | `frontend-specialist` | `clean-code` | **P1** | TSK-07 |

- **TSK-07 Detalhes:**
  - Atualizar a árvore DOM do container em `DysonCanvas.tsx`:
    ```tsx
    <div ref={containerRef} className="...">
      {/* Camada 1: Mapa Estático Bakado */}
      <canvas ref={staticCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Camada 2: Luz, Sombras, Fog de Guerra & Flicker */}
      <canvas ref={lightingCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Camada 3: Pinos, Tokens e Marcadores POI */}
      <canvas ref={entitiesCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Camada 4: Desenhos à Mão Livre */}
      <canvas ref={drawingCanvasRef} className="absolute inset-0 pointer-events-none" />
      {/* Camada 5: Interação, Régua Ortogonal & Seleção (Topo) */}
      <canvas ref={interactionCanvasRef} className="absolute inset-0 pointer-events-none" />
    </div>
    ```
  - Isolar o render loop de cada camada para que eventos do mouse na Camada 5 não toquem as camadas 1, 2 ou 3.
  - **INPUT:** Camadas desacopladas criadas nas fases anteriores.
  - **OUTPUT:** `DysonCanvas.tsx` enxuto, ágil e altamente responsivo.
  - **VERIFY:** Movimento do mouse sobre a tela com régua ou caixa ativadas roda a 60-120 FPS sem nenhum travamento na interface.

---

## 🏁 5. Phase X: Verificação Final & Validação de Qualidade

Antes de considerar a entrega concluída, o checklist rigoroso deve ser executado:

- [ ] **1. Testes Automatizados de Unidade:**
  ```bash
  npx vitest run
  ```
  *(Todos os testes em `lib/__tests__/` incluindo os novos testes de iluminação e baking devem passar com 100% de sucesso).*
- [ ] **2. Typecheck e Lint:**
  ```bash
  npx tsc --noEmit
  npm run lint
  ```
  *(Zero erros de tipagem TypeScript em todo o projeto).*
- [ ] **3. Build de Produção:**
  ```bash
  npm run build
  ```
  *(Build Next.js sem avisos de compilação ou falhas de bundle).*
- [ ] **4. Teste Manual das Ferramentas do Dungeon Forge:**
  - [ ] Pincel de parede / chão (atualiza o bake da camada estática suavemente).
  - [ ] Arrastar pino de personagem (visão atualiza sob demanda; tochas permanecem no cache).
  - [ ] Tochas animadas com flicker suave (sem travar a CPU).
  - [ ] Régua tática ortogonal (arraste a 60 FPS liso no canvas superior).
  - [ ] Abertura e edição dos modais (portas, baús com loot, armadilhas, transições de andares).
  - [ ] Zoom e Pan do mapa (instantâneo sem repintar hachuras).
- [ ] **5. Regras Globais:**
  - [ ] Banimento de violeta/roxo estrito respeitado.
  - [ ] Sem layouts de template genéricos.
