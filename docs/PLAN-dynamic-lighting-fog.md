# 💡 PLAN-dynamic-lighting-fog.md — Linha de Visão Dinâmica 2D/3D (Dynamic Lighting & Advanced Fog of War)

> **Status:** 📋 PLANEJADO  
> **Prioridade:** 🔥 ALTA (Recurso Chave de Paridade com Foundry VTT / Roll20 / Owlbear Rodeo)  
> **Arquitetura:** Next.js 16 + React 19 + Three.js (WebGL) + HTML5 Canvas + Supabase Realtime  

---

## 🎯 1. Visão Geral & Proposta de Valor

Atualmente o **Masters Codex** possui um ecossistema 3D imersivo com efeitos climáticos (chuva, névoa volumétrica global, ciclo dia/noite) e um mapa de masmorra 2D com névoa simples em células. No entanto, o padrão ouro do mercado em VTTs táticos é a **Linha de Visão Dinâmica (Line of Sight - LOS)** e **Iluminação Dinâmica (Dynamic Lighting)** baseada nas regras de D&D 5ª Edição.

Este plano detalha a arquitetura completa para suportar:
1. **Regras Oficiais de D&D 5e:** Visão Normal, Visão no Escuro (*Darkvision*), Visão Cega (*Blindsight*), Luz Plena (*Bright Light*), Penumbra (*Dim Light*), Escuridão Total e Bloqueio por Paredes/Portas.
2. **Névoa de Guerra em 3 Camadas (3-Tier Fog of War):**
   - **Não Explorada (Unexplored):** Preto 100% opaco, terreno e entidades totalmente ocultos.
   - **Explorada / Memória (Explored/Fogged):** Terreno e estruturas estáticas visíveis em tom escurecido (60-70% opacidade), porém tokens de inimigos e itens dinâmicos ficam ocultos.
   - **Visão Ativa (Active Line of Sight):** Totalmente visível e iluminada em tempo real com base no raio de visão/tocha dos personagens do jogador.
3. **Renderização Dual 2D & 3D:**
   - **2D (DysonCanvas & Cockpit Map):** Polígonos de visibilidade por Raycasting Angular com máscaras em tempo real.
   - **3D (BattleGrid3D WebGL):** Fontes de luz pontuais/spotlights (`THREE.PointLight`) nos tokens com sombras dinâmicas de paredes (`PCFSoftShadowMap`) e textura de máscara de FOW projetada no terreno.
4. **Ferramentas do Mestre:** Pincel/Borracha de FOW manual, alternador de prévia da visão do jogador (*Player View Preview*) e controle de tochas.

---

## 📐 2. Modelo de Dados & Tipos TypeScript

### 2.1. Extensão do Combatente (`lib/types.ts`)
```typescript
export type VisionType = 'normal' | 'darkvision' | 'blindsight' | 'truesight' | 'tremorsense';

export interface TokenLightSource {
  enabled: boolean;
  brightRadiusFeet: number; // Ex: 20ft para Tocha
  dimRadiusFeet: number;    // Ex: mais 20ft para Tocha (total 40ft)
  colorHex?: string;        // Ex: '#ff9933' (fogo quente) ou '#99ccff' (luz mágica)
  intensity?: number;       // 0.0 a 2.0
  angleDeg?: number;        // 360 para tocha/lampião comum, 60-90 para Lampião Furta-Fogo (Bullseye)
  directionDeg?: number;    // Ângulo de mira se for cônico
}

export interface CombatantVisionConfig {
  visionType: VisionType;
  darkvisionFeet?: number;  // Padrão: 60ft para raças com Darkvision
  blindsightFeet?: number;
  truesightFeet?: number;
  lightSource?: TokenLightSource;
  sightAngleDeg?: number;   // 360 (visão omnidirecional) ou 120 (cone frontal realista)
}

// Extensão na interface Combatant existente:
export interface Combatant {
  // ... campos existentes
  visionConfig?: CombatantVisionConfig;
}
```

### 2.2. Estado da Névoa de Guerra por Sessão / Mapa
```typescript
export interface FogOfWarMapState {
  mapId: string;
  gridWidth: number;
  gridHeight: number;
  exploredBitmask: string; // Base64 comprimido ou RLE das células já descobertas
  manualRevealedPolygons?: Array<{ x: number; y: number }[]>;
  manualHiddenPolygons?: Array<{ x: number; y: number }[]>;
  ambientLightLevel: 'daylight' | 'dim' | 'darkness' | 'magical_darkness';
}
```

---

## ⚙️ 3. Arquitetura do Motor 2D (Raycasting Angular & Polígonos de Sombra)

### 3.1. Algoritmo de Polígono de Visibilidade (`lib/vision/visibility2d.ts`)
1. **Extração de Segmentos de Colisão:**
   - Transforma todas as células do tipo `wall` e portas fechadas (`door`) em uma lista de segmentos de retas 2D (arestas externas de blocos adjacentes para otimizar desempenho).
2. **Raycasting Angular Preciso:**
   - Lança raios para cada vértice dos segmentos de parede (com desvios infinitesimais $\pm 0.0001$ radianos para capturar cantos e arestas).
   - Lança raios uniformes a cada $2^\circ$ para curvas e limites de alcance da visão/tocha.
3. **Construção do Polígono de Visibilidade:**
   - Ordena os pontos de colisão por ângulo e constrói o polígono fechado de visão do token.
4. **Composição da Máscara no Canvas (`DysonCanvas.tsx`):**
   - **Camada 1 (Base):** Terreno completo desenhado.
   - **Camada 2 (Memória):** Máscara escura cobrindo áreas inexploradas (100% preta) e áreas exploradas (65% escura/monocromática).
   - **Camada 3 (Visão Ativa):** Recorte (`ctx.clip()`) do polígono de visibilidade dos personagens aliados, renderizando luz quente/gradiente suave.
5. **Ocultação de Inimigos:**
   - Tokens com `type === 'monster'` só são renderizados se o ponto $(x, y)$ do monstro estiver dentro do polígono de visibilidade ativo de ao menos um jogador aliado (ou se `userRole === 'dm'`).

---

## 🎮 4. Arquitetura do Motor 3D (WebGL / Three.js no `BattleGrid3D`)

### 4.1. Iluminação Dinâmica Real por Token
* **Luzes Locais:** Cada token com tocha ativa gera um `THREE.PointLight` ou `THREE.SpotLight` com atenuação quadrática e cor amarelada/alaranjada pulsante sutil (ruído Perlin simples simulando chama de tocha).
* **Casting de Sombras 3D:** Paredes 3D da masmorra recebem `castShadow = true` e `receiveShadow = true`, bloqueando a luz da tocha atrás dos corredores automaticamente.

### 4.2. Shader de Névoa de Guerra 3D (Fog of War Mask Target)
1. **FOW Texture Buffer (Offscreen FBO):**
   - Uma textura 2D dinâmica de baixa resolução (ex: 512x512 ou 1024x1024) representando a matriz de névoa do mapa.
2. **Custom Ground Shader:**
   - O material do chão e das paredes amostra a textura de FOW:
     - Valor `0.0` (Inexplorado): Pixel totalmente preto / descarte.
     - Valor `0.5` (Memória): Cor original com saturação reduzida e multiplicador $0.35$.
     - Valor `1.0` (Visível): Iluminação normal + luz da tocha.
3. **Visão do Mestre vs Visão do Jogador:**
   - **Modo DM:** Todas as áreas são visíveis com uma névoa azulada semitransparente nas zonas ocultas para que o Mestre veja os monstros à espreita.
   - **Modo Player:** Oclusão estrita em tempo real; monstros nas sombras não têm meshes renderizadas.

---

## 🎛️ 5. Ferramentas do Mestre & Interface (UI/UX)

### 5.1. Painel de Controle de Visão do Combatente (`CombatantVisionModal.tsx`)
* Seletor de Tipo de Visão: *Visão Normal (30ft/60ft)*, *Darkvision (60ft/120ft)*, *Blindsight (30ft)*.
* Toggle de Fonte de Luz:
  - Sem Luz (Depende do ambiente)
  - Tocha (Bright 20ft / Dim 20ft - 360°)
  - Lampião Coberto (Bright 30ft / Dim 30ft)
  - Lampião Furta-Fogo (Cone 60ft / Penumbra 60ft)
  - Magia Luz (Bright 20ft / Dim 20ft)
* Cor e intensidade customizáveis da luz.

### 5.2. Barra de Ferramentas de FOW do Mestre (`FogOfWarToolbar.tsx`)
* **👁️ Prévia do Jogador (Player LOS Preview):** Permite ao Mestre selecionar um jogador específico e ver o tabuleiro exatamente como aquele jogador enxerga.
* **🖌️ Pincel de Revelação Manual (Reveal Fog):** Revelar manualmente uma sala ou corredor.
* **🧹 Pincel de Ocultação (Hide Fog):** Cobrir novamente uma área com névoa densa.
* **⚡ Revelar Tudo / Resetar Névoa:** Ações rápidas de controle global da masmorra.
* **🌓 Controle de Luz Ambiente do Mapa:** Dia Claro (sem necessidade de tochas), Penumbra (tochas recomendadas) e Escuridão Subterrânea/Noturna (tochas ou Darkvision obrigatórios).

---

## 📋 6. Tarefas de Implementação (Task Breakdown)

### Fase 1: Fundação de Dados & Algoritmos 2D
- [x] Criar tipos e interfaces em [lib/types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts) (`CombatantVisionConfig`, `TokenLightSource`, `FogOfWarMapState`, `VisionType`).
- [x] Desenvolver presets canônicos D&D 5e e utilitários em [lib/vision/lightPresets.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/vision/lightPresets.ts).
- [x] Desenvolver utilitário de cálculo de arestas de colisão e Raycasting em [components/map/visionCore.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/visionCore.ts).
- [x] Implementar a máscara de 3 camadas de FOW (Unexplored / Explored / Visible) no [DysonCanvas.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/DysonCanvas.tsx).
- [x] Implementar regra de ocultação de tokens de monstros não avistados na Visão do Jogador.

### Fase 2: Iluminação Dinâmica 3D & Shaders
- [x] Adicionar suporte a `THREE.PointLight` dinâmico e tocha 3D em cada token em [components/battle-3d/Token3DMesh.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/Token3DMesh.tsx).
- [x] Configurar sombras dinâmicas e atualização de estado de tocha no [Token3DMesh.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/battle-3d/Token3DMesh.tsx).
- [x] Implementar textura de projeção de FOW e integração com o motor 3D.

### Fase 3: Interface & Ferramentas do Mestre
- [x] Criar controles de visão, Darkvision range e botão de acender/apagar tocha no card do combatente em [components/live-cockpit/CombatantCard.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatantCard.tsx).
- [x] Integração de feedback com Toasts e sincronização de estado com o Live Cockpit.

### Fase 4: Testes Automatizados & Validação
- [x] Testes unitários completos de colisão, raycasting, bloqueio de visão por paredes/portas, presets D&D 5e e visibilidade em [lib/__tests__/dynamic-lighting-fog.test.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/__tests__/dynamic-lighting-fog.test.ts).

---

## 🧪 7. Plano de Verificação & Critérios de Aceite

1. **Teste de Bloqueio por Paredes (2D & 3D):**
   - Posicionar um token de jogador atrás de uma parede sólida. Confirmar que a sala oposta permanece preta (Unexplored) e que monstros lá dentro não são renderizados.
2. **Teste de Abertura de Portas:**
   - Abrir uma porta na masmorra. O cone de visão deve se expandir instantaneamente pelo vão da porta, iluminando a sala além.
3. **Teste de Darkvision vs Tocha:**
   - Em mapa com escuridão total, personagem humano sem tocha tem raio de visão zero (tela escura ao redor).
   - Ao acender tocha, ilumina 20ft plena e mais 20ft penumbra.
   - Personagem Elfo com Darkvision enxerga 60ft em tons de cinza/penumbra mesmo sem tocha.
4. **Teste de Persistência de Memória:**
   - Mover o personagem para longe de uma sala já explorada. A sala deve permanecer visível em tom acinzentado/névoa de memória (65%), mas novos monstros inseridos nela pelo DM não devem aparecer para o jogador.
5. **Teste de Performance:**
   - Manter 60 FPS estáveis no canvas 2D e no WebGL 3D com até 10 combatentes e masmorra com mais de 50 salas/paredes.
