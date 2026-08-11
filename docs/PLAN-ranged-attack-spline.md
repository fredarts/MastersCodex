# PLAN-ranged-attack-spline.md - BG3-Style Ranged Attack Spline & D&D 5e Range Mechanics

> **Objetivo:** Implementar um sistema de linha de trajetória curva (Spline Arc 3D/2D) estilo *Baldur's Gate 3* para ataques a distância (arcos, bestas, magias como Raio de Fogo/Eldritch Blast) no BattleGrid 3D e 2D, com indicador de distância em metros/pés, verificação automática de alcance D&D 5.0 (Alcance Normal vs Longo com Desvantagem vs Fora de Alcance) e desaparição suave pós-rolagem dos dados.

---

## 🤖 Agente Responsável
`@[game-developer]` - Especialista em VTT, Three.js 3D Math, Sistemas D&D 5e e Visual FX.

---

## 1. Visão Geral da Funcionalidade

### 🎯 Experiência do Usuário (BG3 Style)
1. **Ativação:** Ao selecionar um ataque à distância (Arma ou Magia no Action Dock / Cockpit), o sistema entra no modo de mira (*Pending Attack*).
2. **Preview Visual Interativo:**
   - Ao passar o cursor/hover sobre um inimigo ou ponto no Grid, desenha-se uma **Spline Curva Parabólica (Arco 3D)** conectando o atacante ao alvo.
   - **Cores Dinâmicas:**
     - 🟢 **Ciano/Esmeralda:** Alcance Normal (Ataque Padrão).
     - 🟡 **Âmbar/Laranja:** Alcance Longo (Ataque com **Desvantagem** automática conforme regras D&D 5e).
     - 🔴 **Carmesim/Vermelho:** Fora do Alcance Máximo (Ataque Bloqueado).
   - **Tag Flutuante HUD:** Mostra a distância em tempo real ex: `18.0m (60ft)` e o status de alcance (`✅ Alcance Normal` | `⚠️ Alcance Longo - Desvantagem` | `❌ Fora de Alcance`).
3. **Execução & Animação:**
   - Ao clicar no alvo válido, um projétil luminoso / flecha percorre a spline em arc flight ($t: 0 \to 1$).
   - Os dados de acerto (d20) são rolados com Vantagem/Desvantagem correta.
4. **Desaparição Automática:**
   - Após a resolução do ataque e exibição dos dados de acerto, a spline faz um fade-out suave (`opacity: 1 -> 0`) em 400ms e desaparece.

---

## 2. Regras D&D 5.0 para Ataques à Distância

| Tipo de Ataque | Sintaxe de Alcance | Alcance Normal | Alcance Longo (Desvantagem) | Fora de Alcance |
| :--- | :--- | :--- | :--- | :--- |
| **Arco Curto** | `80/320 ft` (24m/96m) | $\le 24\text{m}$ ($80\text{ft}$) | $24\text{m} < d \le 96\text{m}$ ($320\text{ft}$) | $> 96\text{m}$ (Bloqueado) |
| **Arco Longo** | `150/600 ft` (45m/180m) | $\le 45\text{m}$ ($150\text{ft}$) | $45\text{m} < d \le 180\text{m}$ ($600\text{ft}$) | $> 180\text{m}$ (Bloqueado) |
| **Besta de Mão** | `30/120 ft` (9m/36m) | $\le 9\text{m}$ ($30\text{ft}$) | $9\text{m} < d \le 36\text{m}$ ($120\text{ft}$) | $> 36\text{m}$ (Bloqueado) |
| **Raio de Fogo (Fire Bolt)** | `120 ft` (36m) | $\le 36\text{m}$ ($120\text{ft}$) | N/A (Magias não possuem alcance longo) | $> 36\text{m}$ (Bloqueado) |
| **Raio de Gelo (Ray of Frost)** | `60 ft` (18m) | $\le 18\text{m}$ ($60\text{ft}$) | N/A | $> 18\text{m}$ (Bloqueado) |

*Conversão:* 1 quadrado do grid = $5\text{ft} = 1,5\text{m}$.

---

## 3. Arquitetura de Componentes & Modificações

```
┌────────────────────────────────────────────────────────┐
│               lib/utils/dndRangeUtils.ts               │
│  - parseRangeString(rangeStr)                          │
│  - calculateTargetDistance(attackerPos, targetPos)     │
│  - evaluateRangeStatus(distanceFt, rangeConfig)        │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│       lib/stores/useLiveCockpitStudioStore.ts         │
│  - PendingAttackState + rangeConfig + isRanged         │
│  - activeSplineState (attackerPos, targetPos, status)  │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│         components/BattleGrid3D.tsx (Three.js)         │
│  - Renderização de CatmullRomCurve3 / QuadraticBezier  │
│  - TubeGeometry / Shader Glow Gradient                 │
│  - Projétil voador (Arrow / Fireball particle along arc)│
│  - Retículo de mira e HUD de distância 3D-to-2D        │
└────────────────────────────────────────────────────────┘
```

---

## 4. Fases de Implementação

### Fase 1: Utilitário de Parsing e Distância D&D 5e (`lib/utils/dndRangeUtils.ts`)
- Criar funções utilitárias para extrair limites de alcance a partir da string de armas/magias:
  - Regex para capturar formatos como `"80/320 ft"`, `"120 feet"`, `"Alcance: 24m / 96m"`.
  - Função `evaluateRangeStatus(distFeet, rangeInfo)` retornando `'NORMAL'`, `'LONG_RANGE'` (disadvantage: true) ou `'OUT_OF_RANGE'`.

### Fase 2: Atualização da Store State (`useLiveCockpitStudioStore.ts`)
- Expandir `PendingAttackState` para armazenar o alcance detectado da arma/magia.
- Adicionar estado de animação da spline (`splineAnimationPhase: 'aiming' | 'firing' | 'fading' | 'idle'`).

### Fase 3: Renders 3D no `BattleGrid3D.tsx` (Three.js Parabolic Arc)
- Criar curva bézier parabólica 3D:
  $$\vec{P}_{mid} = \frac{\vec{P}_{start} + \vec{P}_{end}}{2} + \left(0, \text{height}, 0\right)$$
  onde $\text{height} = \min(4.0, \text{dist} \times 0.08 + 1.2)$.
- Criar mesh com `THREE.TubeGeometry` e material translúcido/glow pulsante com shader/emissive.
- Adicionar partículas/esfera de energia animada percorrendo o caminho durante a confirmação.
- Projetar HUD flutuante (distância em m/ft e badge de desvantagem/alcance) na tela.

### Fase 4: Integração com o Fluxo de Ataque e Dados
- Ao confirmar o clique de ataque no alvo:
  - Se for `'OUT_OF_RANGE'`: exibe toast informativo e cancela ação.
  - Se for `'LONG_RANGE'`: aplica desvantagem (`advantageState: 'disadvantage'`) na rotagem d20 do `PlayerLobby` / `LiveCockpitStudio`.
  - Dispara a animação do projétil ao longo do arco.
  - Ao finalizar a animação da rolagem dos dados d20 no BG3 Dice Overlay, dispara o fade-out de 400ms da spline e limpa o estado.

---

## 5. Plano de Verificação e Testes

### Testes Automatizados & Validação de Módulos
- **Unit test em `dndRangeUtils.test.ts`**:
  - Testar parsing de `"80/320 ft"`, `"120 ft"`, `"150/600"`.
  - Testar cálculo de distância e detecção de `'NORMAL'`, `'LONG_RANGE'`, `'OUT_OF_RANGE'`.

### Teste Manual de Interface (VTT 3D)
1. **Ataque com Arco (ex: Longbow 150/600ft / 45m/180m):**
   - Alvo a 15m -> Spline Ciano, "15m (Alcance Normal)". Ataque normal.
   - Alvo a 60m -> Spline Laranja, "60m (Alcance Longo - Desvantagem)". Rolagem com 2d20 pegando o menor.
   - Alvo a 200m -> Spline Vermelha, "200m (Fora de Alcance)". Clique bloqueado com alerta visual.
2. **Magia de Arremesso (ex: Raio de Fogo 120ft / 36m):**
   - Alvo a 30m -> Spline Ciano. Ataque normal.
   - Alvo a 40m -> Spline Vermelha. Bloqueado.
3. **Animação & Fade Out:**
   - Confirmar ataque -> projétil desliza pelo arco -> dados rolam -> curva desaparece suavemente.
