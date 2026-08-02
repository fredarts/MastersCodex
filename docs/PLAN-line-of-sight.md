# Plano de Implementação - Visão 2D Dinâmica (Line of Sight / Raycasting) no Dungeon Map

Este plano detalha o design técnico para implementar um sistema de **Raycasting Angular 2D** (Line of Sight) no Dungeon Map, garantindo que as paredes da masmorra (`wall`) e portas fechadas (`door`) bloqueiem a visão dos tokens dos jogadores em tempo real, gerando sombras suaves similares ao Godot.

---

## 🛠️ Alterações Propostas

### 1. Atualização do Modelo de Dados ([lib/types.ts](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/lib/types.ts))
Adicionar o atributo opcional `visionRange` (em pés/feet) ao combatente:
```typescript
export interface Combatant {
  // ... campos existentes
  visionRange?: number; // Alcance da visão em pés (ex: 30, 60, 120). 5 pés = 1 célula.
}
```

---

### 2. Configuração de Visão no Painel do Mestre ([CombatantCard.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CombatantCard.tsx))
No painel expandido do combatente, adicionar um campo numérico simples para permitir que o Mestre ajuste a distância de visão do token em pés:
* Valor padrão se não definido: 30 pés (equivalente a 6 células).
* Alterações salvam e atualizam dinamicamente a lista de combatentes por meio de `onUpdateCombatants`.

---

### 3. Ajuste do Raio de Revelação Permanente da Névoa ([CockpitDungeonMap.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/live-cockpit/CockpitDungeonMap.tsx))
Ajustar a função `revealVisionAround` para ler o raio personalizado do combatente:
* Obter o raio em células dividindo `visionRange` por 5.
* Aplicar este raio dinâmico quando um token for movido, em vez do valor fixado rígido de `3.0` células.

---

### 4. Motor de Visão por Raycasting 2D no Canvas ([DysonCanvas.tsx](file:///c:/Users/Fred/Documents/game-dev/Masters%20Codex%20-%20The%20Campaign%20Forge%20Tool/components/map/DysonCanvas.tsx))
Implementar o motor de cálculo de colisão por raios diretamente na renderização do canvas:
1. **Helper `getTokenVisionRadius`**:
   * Encontra o combatente correspondente pelo nome na lista de `combatants`.
   * Retorna `visionRange / 5` (em células). Se não configurado, assume `6.0` células (30 pés).
2. **Helper `computeVisibilityPolygon(tx, ty, visionRadius)`**:
   * Executa um algoritmo de raycasting angular a partir do centro do token `(tx, ty)`.
   * Lança 180 raios uniformemente espalhados de $0$ a $2\pi$.
   * Acompanha cada raio em passos de tamanho `CELL_SIZE * 0.1` (alta precisão).
   * Se o raio atingir uma célula do tipo `wall` ou do tipo `door` fechada, interrompe o raio naquele ponto.
   * Acumula todos os pontos finais para construir um polígono de visibilidade fechado.
3. **Máscara de Recorte**:
   * Em vez de desenhar um círculo simples na máscara de FOW, o canvas executa um recorte usando o polígono calculado (`maskCtx.clip()`).
   * Desenha o gradiente radial de iluminação apenas dentro da área visível recortada.
4. **Ocultação de Tokens Oponentes**:
   * Na renderização dos tokens, se `isPlayerView === true`, ocultar monstros/NPCs que não estiverem na linha de visão ativa de pelo menos um token do jogador.

---

## 🧪 Plano de Verificação

### Testes Manuais
1. **Verificação de Bloqueio por Paredes:**
   * Entrar como Jogador. Posicionar um token no corredor adjacente a uma sala fechada.
   * Confirmar que o interior da sala permanece preto e sob névoa de guerra densa (98% de opacidade).
   * Mover o jogador para o vão da porta. Abrir a porta nas configurações e confirmar que a sala é revelada no cone de visão do jogador.
2. **Verificação da Visão do Mestre:**
   * No Cockpit, mover um token de jogador.
   * Confirmar que as salas adjacentes bloqueadas por paredes ficam cobertas por névoa semitransparente (45% de opacidade).
3. **Verificação da Distância Dinâmica:**
   * Alterar o alcance de visão de um combatente para 60 pés (12 células) no card e confirmar o aumento instantâneo do holofote no canvas.
