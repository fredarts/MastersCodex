# PLAN-realistic-rain-splash.md - Sistema de Chuva Realista 3D com Respingos no Chão

Este plano detalha a arquitetura, shaders e controles de interface para o sistema de chuva realista no Three.js do Masters Codex.

## 1. Pesquisa Técnica & Arquitetura Three.js
- **Técnica de Queda de Gotas**: GPU Shaders baseados em `THREE.Points` com `THREE.BufferGeometry` e vetor 3D de velocidade (`position`, `velocity`, `size`, `life`).
- **Técnica de Respingos (Ground Splashes & Ripples)**:
  1. *Anéis de Ondulação*: Shader procedural horizontal a $Y = 0.02$ que expande anéis translúcidos em torno do ponto de impacto via função `smoothstep`.
  2. *Micro-Gotículas Saltitantes (Crown Splashes)*: Partículas secundárias que são expelidas em arco parabólico no instante do impacto com curta duração.
- **Relâmpagos Procedurais (Lightning Flashes)**: Flutuação estocástica de luminosidade no ambiente e domo do céu para simular tempestades elétricas.
- **Variações Temáticas**: Água, Ácido, Sangue, Neve, Dourada.

## 2. Tarefas e Arquivos

| Tarefa | Arquivo | Responsável |
|---|---|---|
| Refatoração do Motor de Partículas (Gotas + Splashes + Ripples + Relâmpagos) | `components/battle-3d/WeatherEffects.tsx` | `game-developer` |
| Tipagem e Estado de Clima | `components/battle-3d/BattleEnvironment.tsx` | `game-developer` |
| Redesenho da Aba "Chuva" com Presets e Controles Avançados | `components/battle-3d/BattleControlsToolbar.tsx` | `frontend-specialist` |
| Sincronização no Loop de Render e Luzes | `components/BattleGrid3D.tsx` | `game-developer` |

## 3. Critérios de Aceitação
- 60 FPS estáveis mesmo com milhares de gotas e respingos ativos.
- Respingos e ondas visíveis e convincentes no chão do grid tático.
- Controles reativos e intuitivos na Toolbar 3D com presets rápidos de 1 clique.
