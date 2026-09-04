# PLAN: Suíte de Desempenho Gráfico & Modo Eco 3D (Nível Estúdio)

> **Task Slug:** `3d-eco-pause`  
> **Status:** Proposto / Em Planejamento  
> **Arquivos Afetados:**  
> - `components/BattleGrid3D.tsx`  
> - `components/MagicShaderSlideshow.tsx`  
> - `components/Dice3DCanvas.tsx`  
> - `components/LiveCockpitStudio.tsx`  
> - `components/PlayerLobby.tsx`

---

## 🎯 Objetivo

Transformar o motor 3D WebGL do **Masters Codex** em uma suíte de alta performance de nível estúdio, combinando:
1. **Pausa Inteligente (Eco Mode)** quando em Modo 2D, Ilustração, Ficha cheia ou aba em segundo plano.
2. **Taxa de Quadros Adaptativa (Adaptive Idle Throttling)** (60 FPS interativo ➔ 15~20 FPS ocioso).
3. **Limitador de Densidade de Pixels (Pixel Ratio Clamp ≤ 1.5x)** para iPads e telas 4K.
4. **Cache Estático de Sombras (Static Shadow Caching)**.
5. **Eliminação de Garbage Collection (GC) Stutter** através de variáveis de rascunho reaproveitáveis.
6. **Sleep State para o Rolador de Dados 3D**.

---

## 🏗️ Detalhamento dos 5 Pilares de Engenharia

```
┌────────────────────────────────────────────────────────────────────────┐
│             ARQUITETURA DE PERFORMANCE GRÁFICA "TOP PREMIUM"           │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ 1. ADAPTIVE FPS THROTTLE │ 2. DYNAMIC SHADOW CACHE  │ 3. INSTANCING 3D │
│ 60 FPS em movimento      │ Atualiza sombras apenas  │ 1 Draw Call para │
│ 15 FPS quando ocioso     │ sob eventos reais        │ todos os blocos  │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ 4. PIXEL RATIO CLAMPING  │ 5. MEMORY DISPOSAL       │ 6. DIRTY FLAGGING│
│ Trava em 1.5x no tablet  │ Zero vazamento WebGL     │ Render sob       │
│ (-50% carga de GPU)      │ ao trocar de cena/sessão │ demanda no 2D    │
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

### 🔹 Pilar 1: Pixel Ratio Clamping (iPad / Retina / 4K)
- **Arquivo:** `components/BattleGrid3D.tsx`
- **Ação:** Configurar `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))`.
- **Impacto:** Elimina o superaquecimento em iPads e tablets com telas de 2x/3x DPI, dobrando a taxa de quadros e economizando 50% de GPU.

### 🔹 Pilar 2: Pausa Automática e Renderização Sob Demanda (Dirty Flagging)
- **Arquivos:** `components/BattleGrid3D.tsx`, `components/LiveCockpitStudio.tsx`, `components/PlayerLobby.tsx`
- **Ação:**
  - Suspender `requestAnimationFrame` quando `isPaused === true` (Modo Mapa 2D, Arte, ou Ficha maximizada) ou `document.hidden === true`.
  - Expor método de renderização estática de frame único (`requestSingleRender()`) disparado apenas quando tokens mudarem de posição via realtime enquanto o 3D estiver oculto.
  - Ao retomar (unpause), recalcular `lastTime = performance.now()` para evitar saltos nos deltas de animação.

### 🔹 Pilar 3: Adaptive Idle FPS Throttling
- **Arquivo:** `components/BattleGrid3D.tsx`
- **Ação:**
  - Monitorar interações (ponteiro, arrasto de token, rotação de câmera orbit).
  - Interativo (< 3s): Renderiza em **60 FPS**.
  - Ocioso (> 3s): Reduz para **15~20 FPS**, mantendo animações sutis de fogo/tochas com consumo de energia mínimo.

### 🔹 Pilar 4: Cache Estático de Sombras (Static Shadow Caching)
- **Arquivo:** `components/BattleGrid3D.tsx`
- **Ação:**
  - `renderer.shadowMap.autoUpdate = false`.
  - Disparar `renderer.shadowMap.needsUpdate = true` apenas quando tokens forem arrastados ou a hora do dia for alterada.

### 🔹 Pilar 5: Sono Físico dos Dados e Suspensão de Shaders
- **Arquivos:** `components/Dice3DCanvas.tsx`, `components/MagicShaderSlideshow.tsx`
- **Ação:**
  - `Dice3DCanvas`: Pausar loop de render e física assim que os dados pararem de rolar (*settled state*).
  - `MagicShaderSlideshow`: Pausar shaders de pós-processamento quando não estiver em exibição de arte.

---

## 🧪 Plano de Verificação e Testes

| Teste | Critério de Aceitação |
| :--- | :--- |
| **Pixel Ratio Clamp** | O canvas 3D deve reportar pixel ratio ≤ 1.5 mesmo em telas com 2x/3x DPI. |
| **Pausa no Mapa 2D / Arte** | Mudar para Mapa 2D zera o consumo contínuo de `requestAnimationFrame`. |
| **Segundo Plano do Navegador** | Mudar de aba (`visibilitychange`) congela o loop do Three.js e shaders. |
| **Adaptive Idle** | Após 3s sem interação, o render loop ajusta a taxa de quadros para modo econômico. |
| **Dirty Flagging** | Atualização de posição via realtime enquanto pausado reflete no 3D sem reiniciar o loop contínuo. |
| **Build & Tipagem** | Executar `npm run test` com 100% dos testes aprovados. |
