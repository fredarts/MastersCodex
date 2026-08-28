// Funções procedurais para renderização do mapa estilo Dyson Logos

export function hash(x: number, y: number, seed: number): number {
  const dot = (x * 12.9898) + (y * 78.233) + (seed * 137.5453);
  const sn = Math.sin(dot);
  return (sn * 43758.5453) - Math.floor(sn * 43758.5453);
}

export function drawWobblyLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  seed: number
) {
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x1, y1);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(2, Math.floor(dist / 10));

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;

    let noiseX = 0, noiseY = 0;
    if (i < segments) {
      noiseX = (hash(x1, y1, seed + i * 10) - 0.5) * 1.8;
      noiseY = (hash(x2, y2, seed + i * 20) - 0.5) * 1.8;
    }
    ctx.lineTo(baseX + noiseX, baseY + noiseY);
  }
  ctx.stroke();
}

export function drawDysonCrosshatch(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  dist: number
) {
  const x = c * cellSize;
  const y = r * cellSize;
  const MAX_DIST = 4.5;

  const organicMaxDist = MAX_DIST + (hash(c, r, 999) * 1.5 - 0.75);
  if (dist > organicMaxDist) return;

  const intensity = Math.max(0, 1 - (dist / organicMaxDist));

  // 1. Pontilhismo (Stippling)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  const numDots = Math.floor(intensity * 10 * hash(c, r, 0));
  for (let i = 0; i < numDots; i++) {
    const dx = x + hash(c, r, i + 1) * cellSize;
    const dy = y + hash(c, r, i + 100) * cellSize;
    ctx.fillRect(dx, dy, 1.2, 1.2);
  }

  // 2. Grupos de Hachuras (Crosshatching)
  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'round';

  const maxGroups = (dist <= 1.5) ? 5 : 3;
  let numGroups = Math.floor(intensity * maxGroups) + Math.floor(hash(c, r, 200) * 2);

  if (dist === 1 && numGroups < 3) numGroups = 3;

  for (let g = 0; g < numGroups; g++) {
    const cx = x + hash(c, r, g + 300) * cellSize;
    const cy = y + hash(c, r, g + 400) * cellSize;

    const rawAngle = hash(c, r, g + 500) * Math.PI;
    let angle = Math.floor(rawAngle / (Math.PI / 4)) * (Math.PI / 4);
    angle += (hash(c, r, g + 510) - 0.5) * 0.2;

    const numLines = 3 + Math.floor(hash(c, r, g + 600) * 4);
    const lineLen = cellSize * (0.55 + hash(c, r, g + 700) * 0.65);
    const spacing = 3.2 + hash(c, r, g + 800) * 1.3;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.lineWidth = 1.1;

    for (let i = 0; i < numLines; i++) {
      const oy = (i - numLines / 2) * spacing;
      ctx.beginPath();
      ctx.moveTo(-lineLen / 2, oy);

      const bendDir = (hash(c, r, i * 10) > 0.5) ? 1 : -1;
      const bendAmount = hash(c, r, i * 15) * 2.5;

      ctx.quadraticCurveTo(0, oy + (bendDir * bendAmount), lineLen / 2, oy);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawWaterHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number
) {
  const x = c * cellSize;
  const y = r * cellSize;

  // Fundo azul pastel sutil
  ctx.fillStyle = '#e3fafc';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Linhas onduladas horizontais
  ctx.strokeStyle = '#0c8599';
  ctx.lineWidth = 1.0;
  ctx.lineCap = 'round';

  const numWaves = 3 + Math.floor(hash(c, r, 77) * 3);
  for (let w = 0; w < numWaves; w++) {
    const wy = y + (w + 1) * (cellSize / (numWaves + 1)) + (hash(c, r, w * 5) - 0.5) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 2, wy);

    const segments = 4;
    const segWidth = (cellSize - 4) / segments;
    for (let s = 0; s <= segments; s++) {
      const sx = x + 2 + s * segWidth;
      const sy = wy + Math.sin((s + hash(c, r, w * 12)) * Math.PI) * 2;
      if (s === 0) {
        ctx.moveTo(sx, sy);
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
  }
}

export function drawGrassHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number
) {
  const x = c * cellSize;
  const y = r * cellSize;

  // Fundo verde pastel sutil
  ctx.fillStyle = '#ebfbee';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Tufos de grama estilizados Dyson
  ctx.strokeStyle = '#2b8a3e';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  const numTufts = 2 + Math.floor(hash(c, r, 88) * 3);
  for (let t = 0; t < numTufts; t++) {
    const tx = x + 5 + hash(c, r, t * 10) * (cellSize - 10);
    const ty = y + 5 + hash(c, r, t * 20) * (cellSize - 10);

    const height = 4 + hash(c, r, t * 30) * 6;
    const blades = 3 + Math.floor(hash(c, r, t * 40) * 3);

    for (let b = 0; b < blades; b++) {
      const angle = -Math.PI / 2 + (b - (blades - 1) / 2) * 0.25 + (hash(c, r, t * 50 + b) - 0.5) * 0.1;
      const bx = tx + Math.cos(angle) * height;
      const by = ty + Math.sin(angle) * height;

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + (bx - tx) * 0.5, ty + (by - ty) * 0.8, bx, by);
      ctx.stroke();
    }
  }
}

export function drawTrapHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number
) {
  const x = c * cellSize;
  const y = r * cellSize;

  // Fundo vermelho/laranja pastel sutil
  ctx.fillStyle = '#fff0f6';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Linhas de rachadura espiculadas / runas Dyson
  ctx.strokeStyle = '#c2255c';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';

  // Desenha rachaduras finas
  const seed = c * 333 + r * 555;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  // Pequeno símbolo central (crânio / runa simplificada de armadilha)
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Traços saindo do centro como espinhos
  const numSpikes = 4 + Math.floor(hash(c, r, 99) * 4);
  for (let i = 0; i < numSpikes; i++) {
    const angle = (i / numSpikes) * Math.PI * 2 + hash(c, r, i * 4) * 0.3;
    const rx1 = cx + Math.cos(angle) * 5;
    const ry1 = cy + Math.sin(angle) * 5;
    const rx2 = cx + Math.cos(angle) * (10 + hash(c, r, i * 8) * 8);
    const ry2 = cy + Math.sin(angle) * (10 + hash(c, r, i * 8) * 8);

    drawWobblyLine(ctx, rx1, ry1, rx2, ry2, 1.0, seed + i);
  }
}

export function drawChestHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  containerType: string = 'wooden_chest',
  status: string = 'locked'
) {
  const x = c * cellSize;
  const y = r * cellSize;
  const seed = c * 711 + r * 919;

  // Fundo pastel quente
  ctx.fillStyle = containerType === 'ornate_chest' ? '#fdf2e9' : containerType === 'iron_chest' ? '#f1f3f5' : '#fffbeb';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Grid sutil no fundo
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
  drawWobblyLine(ctx, x, y, x + cellSize, y, 0.8, seed + 1);
  drawWobblyLine(ctx, x, y, x, y + cellSize, 0.8, seed + 2);

  // Dimensões da caixa do baú (centralizado na célula)
  const padding = cellSize * 0.2;
  const bx = x + padding;
  const by = y + padding + (status === 'open' || status === 'looted' ? cellSize * 0.08 : 0);
  const bw = cellSize - padding * 2;
  const bh = cellSize * 0.45;

  ctx.strokeStyle = '#1e1e1e';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Corpo do Baú
  drawWobblyLine(ctx, bx, by, bx + bw, by, 1.4, seed + 10);
  drawWobblyLine(ctx, bx + bw, by, bx + bw, by + bh, 1.4, seed + 11);
  drawWobblyLine(ctx, bx + bw, by + bh, bx, by + bh, 1.4, seed + 12);
  drawWobblyLine(ctx, bx, by + bh, bx, by, 1.4, seed + 13);

  // Tiras verticais de reforço de ferro
  const band1X = bx + bw * 0.25;
  const band2X = bx + bw * 0.75;
  drawWobblyLine(ctx, band1X, by, band1X, by + bh, 1.1, seed + 14);
  drawWobblyLine(ctx, band2X, by, band2X, by + bh, 1.1, seed + 15);

  if (status === 'open' || status === 'looted') {
    // Tampa aberta inclinada para trás
    const lidHeight = cellSize * 0.22;
    drawWobblyLine(ctx, bx, by, bx + bw * 0.1, by - lidHeight, 1.4, seed + 20);
    drawWobblyLine(ctx, bx + bw, by, bx + bw * 0.9, by - lidHeight, 1.4, seed + 21);
    drawWobblyLine(ctx, bx + bw * 0.1, by - lidHeight, bx + bw * 0.9, by - lidHeight, 1.4, seed + 22);

    // Interior do baú aberto
    if (status === 'open') {
      // Brilho de moedas/tesouro
      ctx.fillStyle = '#f59e0b';
      for (let i = 0; i < 4; i++) {
        const coinX = bx + bw * 0.35 + (i % 2) * (bw * 0.18);
        const coinY = by + bh * 0.35 + Math.floor(i / 2) * (bh * 0.25);
        ctx.beginPath();
        ctx.arc(coinX, coinY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    // Tampa arredondada clássica fechada
    const lidArch = cellSize * 0.12;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + bw / 2, by - lidArch, bx + bw, by);
    ctx.stroke();

    // Fechadura / buraco da fechadura no centro
    const lockX = bx + bw / 2;
    const lockY = by + bh * 0.42;
    ctx.fillStyle = '#1e1e1e';
    ctx.beginPath();
    ctx.arc(lockX, lockY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    drawWobblyLine(ctx, lockX, lockY, lockX, lockY + 3.5, 1.2, seed + 25);
  }
}

export function drawStashHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number
) {
  const x = c * cellSize;
  const y = r * cellSize;
  const seed = c * 444 + r * 666;

  // Fundo limpo de piso
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Linhas orgânicas da malha de piso Dyson Logos
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  drawWobblyLine(ctx, x, y, x + cellSize, y, 0.8, seed + 1);
  drawWobblyLine(ctx, x, y, x, y + cellSize, 0.8, seed + 2);
}

export function drawPortcullisHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  status: 'closed' | 'open'
) {
  const x = c * cellSize;
  const y = r * cellSize;
  const seed = c * 333 + r * 777;

  // Fundo do piso
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, cellSize, cellSize);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  if (status === 'closed') {
    // Grade baixada: Barras verticais com pontas + barra horizontal estrutural
    const bars = 4;
    const spacing = cellSize / (bars + 1);
    
    // Barras verticais
    for (let i = 1; i <= bars; i++) {
      const bx = x + spacing * i;
      drawWobblyLine(ctx, bx, y + 2, bx, y + cellSize - 4, 2.0, seed + i);
      // Ponta de ferro embaixo
      ctx.beginPath();
      ctx.moveTo(bx - 1.5, y + cellSize - 4);
      ctx.lineTo(bx, y + cellSize);
      ctx.lineTo(bx + 1.5, y + cellSize - 4);
      ctx.fill();
    }
    
    // Barras horizontais
    drawWobblyLine(ctx, x + 2, y + cellSize * 0.3, x + cellSize - 2, y + cellSize * 0.3, 2.5, seed + 10);
    drawWobblyLine(ctx, x + 2, y + cellSize * 0.7, x + cellSize - 2, y + cellSize * 0.7, 2.5, seed + 11);
  } else {
    // Grade erguida: Apenas as pontas aparecendo no teto superior
    const bars = 4;
    const spacing = cellSize / (bars + 1);
    
    ctx.lineWidth = 1.2;
    for (let i = 1; i <= bars; i++) {
      const bx = x + spacing * i;
      // Barras recolhidas
      drawWobblyLine(ctx, bx, y, bx, y + 6, 1.5, seed + i);
      // Pontas
      ctx.beginPath();
      ctx.moveTo(bx - 1.5, y + 6);
      ctx.lineTo(bx, y + 9);
      ctx.lineTo(bx + 1.5, y + 6);
      ctx.fill();
    }
    // Ranhuras no chão (onde a grade encaixa)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.moveTo(x + 2, y + cellSize - 3);
    ctx.lineTo(x + cellSize - 2, y + cellSize - 3);
    ctx.stroke();
  }
}

export function drawTriggerHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  triggerType: 'lever' | 'pressure_plate' | 'chain' | 'button',
  state: 'inactive' | 'active'
) {
  const x = c * cellSize;
  const y = r * cellSize;
  const seed = c * 555 + r * 222;
  const cx = x + cellSize / 2;
  const cy = y + cellSize / 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, cellSize, cellSize);

  ctx.strokeStyle = '#000000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (triggerType === 'lever') {
    // Base de pedra
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#f3f4f6';
    const bw = 14;
    const bh = 8;
    ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
    ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
    
    // Haste
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    if (state === 'inactive') {
      ctx.lineTo(cx - 8, cy - 8); // Inclinada p/ esquerda
    } else {
      ctx.lineTo(cx + 8, cy - 8); // Inclinada p/ direita
    }
    ctx.stroke();

    // Bola na ponta
    ctx.beginPath();
    if (state === 'inactive') {
      ctx.arc(cx - 8, cy - 8, 3, 0, Math.PI * 2);
    } else {
      ctx.arc(cx + 8, cy - 8, 3, 0, Math.PI * 2);
    }
    ctx.fillStyle = state === 'active' ? '#ef4444' : '#1e1e1e';
    ctx.fill();
    ctx.stroke();
  } else if (triggerType === 'pressure_plate') {
    const pad = 6;
    ctx.lineWidth = 1.2;
    // Fenda externa
    drawWobblyLine(ctx, x + pad, y + pad, x + cellSize - pad, y + pad, 1.2, seed + 1);
    drawWobblyLine(ctx, x + cellSize - pad, y + pad, x + cellSize - pad, y + cellSize - pad, 1.2, seed + 2);
    drawWobblyLine(ctx, x + cellSize - pad, y + cellSize - pad, x + pad, y + cellSize - pad, 1.2, seed + 3);
    drawWobblyLine(ctx, x + pad, y + cellSize - pad, x + pad, y + pad, 1.2, seed + 4);
    
    if (state === 'active') {
      // Placa afundada (sombra extra)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x + pad, y + pad, cellSize - pad * 2, cellSize - pad * 2);
    } else {
      // Ranhuras centrais estilo placa
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      drawWobblyLine(ctx, cx - 4, cy - 4, cx + 4, cy + 4, 1.0, seed + 5);
      drawWobblyLine(ctx, cx + 4, cy - 4, cx - 4, cy + 4, 1.0, seed + 6);
    }
  } else if (triggerType === 'button') {
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = state === 'active' ? '#d1d5db' : '#f3f4f6';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner dot
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = state === 'active' ? '#dc2626' : '#1e1e1e';
    ctx.fill();
  } else if (triggerType === 'chain') {
    ctx.lineWidth = 1.5;
    let chainY = y + 4;
    while (chainY < cy + 6) {
      ctx.beginPath();
      ctx.ellipse(cx, chainY, 2.5, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      chainY += 6;
    }
    // Handle
    ctx.beginPath();
    ctx.arc(cx, chainY + 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = state === 'active' ? '#f59e0b' : '#6b7280';
    ctx.fill();
    ctx.stroke();
  }
}

export function drawIllusionWallHachure(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  isPlayerView: boolean,
  revealed: boolean
) {
  const x = c * cellSize;
  const y = r * cellSize;
  
  if (isPlayerView && !revealed) {
    return;
  }

  // Fundo transparente com leve tom arcano para diferenciar no mapa do mestre
  ctx.fillStyle = isPlayerView ? 'rgba(255, 255, 255, 0.9)' : 'rgba(167, 139, 250, 0.08)';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Mestre ou Jogador que descobriu a ilusão enxergam uma demarcação etérea
  ctx.strokeStyle = '#8b5cf6';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  ctx.setLineDash([]);
}

/**
 * Renders a crisp flat black vector map decoration icon for Light Sources (torch, candle, lantern, spell, dragon)
 */
export function drawLightSourceIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  preset = 'torch',
  zoom = 1.0
) {
  ctx.save();
  ctx.translate(x, y);

  const scale = Math.max(0.7, Math.min(1.5, 1.2 / Math.sqrt(zoom)));
  ctx.scale(scale, scale);

  // 1. Dyson Paper Backing Circle (White Fill + Black Border) for crisp contrast on any map background
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Outer hand-drawn double ring (Dyson map style)
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, 17, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Flat Black Hand-Drawn Icon Shapes
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (preset === 'candle') {
    // Flat Black Candle
    ctx.fillRect(-3, -2, 6, 10);
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(0, -5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(-3, -8, -3, -11, 0, -14);
    ctx.bezierCurveTo(3, -11, 3, -8, 0, -5);
    ctx.fill();
  } else if (preset === 'lantern') {
    // Flat Black Lantern
    ctx.beginPath();
    ctx.arc(0, -9, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillRect(-6, -6, 12, 3);
    ctx.fillRect(-5, -3, 10, 8);
    // Glass window lines
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-3, -1, 6, 4);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-0.5, -1, 1, 4);
    ctx.fillRect(-3, 0.5, 6, 1);
    ctx.fillRect(-6, 5, 12, 3);
  } else if (preset === 'spell') {
    // Flat Black Arcane Spell Orb Starburst
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.8;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 6, Math.sin(angle) * 6);
      ctx.lineTo(Math.cos(angle) * 11, Math.sin(angle) * 11);
      ctx.stroke();
    }
  } else if (preset === 'dragon') {
    // Flat Black Dragon Fire Brazier
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(5, 6);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5, 6);
    ctx.lineTo(-8, 11);
    ctx.moveTo(5, 6);
    ctx.lineTo(8, 11);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.bezierCurveTo(-8, -5, -4, -8, -2, -13);
    ctx.bezierCurveTo(0, -10, 2, -12, 5, -13);
    ctx.bezierCurveTo(7, -8, 6, -4, 6, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // Default Flat Black Torch
    ctx.beginPath();
    ctx.moveTo(-2.5, 9);
    ctx.lineTo(-1, -1);
    ctx.lineTo(2, -1);
    ctx.lineTo(0.5, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-4, -3, 9, 3);
    ctx.beginPath();
    ctx.moveTo(-3, -3);
    ctx.bezierCurveTo(-5, -7, -3, -10, 0, -14);
    ctx.bezierCurveTo(2, -10, 4, -9, 3, -3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Desenha um ícone vetorial bico de pena para Esconderijos Secretos (Stash / Gem)
 */
export function drawStashIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isLooted = false,
  zoom = 1
) {
  ctx.save();
  ctx.translate(x, y);

  const scale = Math.max(0.6, Math.min(1.4, 1 / Math.sqrt(zoom)));
  ctx.scale(scale, scale);

  // Fundo circular sutil estilo pergaminho
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Borda dupla hand-drawn
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.stroke();

  if (isLooted) {
    // Esconderijo saqueado: Brilho sutil de faíscas vazias
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.moveTo(-4, -4);
    ctx.lineTo(4, 4);
    ctx.moveTo(-4, 4);
    ctx.lineTo(4, -4);
    ctx.stroke();
  } else {
    // Cristal lapidado estilo Dyson Logos
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.8;

    // Facetas superiores e inferiores do diamante
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(8, -3);
    ctx.lineTo(0, 9);
    ctx.lineTo(-8, -3);
    ctx.closePath();
    ctx.stroke();

    // Mesa e facetas internas
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(5, -3);
    ctx.lineTo(0, 9);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.lineTo(0, -9);
    ctx.lineTo(5, -3);
    ctx.stroke();

    // Hachura fina na faceta esquerda
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-4, -1);
    ctx.lineTo(-1, 5);
    ctx.moveTo(-6, -2);
    ctx.lineTo(-3, 4);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Desenha um ícone vetorial bico de pena para Transições de Andar / Escadas / Portais
 */
export function drawTransitionIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'stairs_down' | 'stairs_up' | 'portal' | 'ladder' | 'doorway' = 'stairs_down',
  targetLevelName?: string,
  zoom = 1
) {
  ctx.save();
  ctx.translate(x, y);

  const scale = Math.max(0.65, Math.min(1.4, 1 / Math.sqrt(zoom)));
  ctx.scale(scale, scale);

  const isPortal = type === 'portal';
  const bgColor = isPortal ? '#f3e8ff' : '#fef3c7';
  const strokeColor = isPortal ? '#6b21a8' : '#78350f';

  // Fundo circular
  ctx.fillStyle = bgColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.2;

  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Borda dupla pontilhada / estilizada
  ctx.lineWidth = 1.2;
  ctx.setLineDash(isPortal ? [3, 2] : [4, 3]);
  ctx.beginPath();
  ctx.arc(0, 0, 18.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Desenhos vetoriais específicos
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = strokeColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'portal') {
    // Vórtice arcano em espiral com runas
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.2) {
      const r = 2 + a * 2.2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 4 Pontos de energia arcana
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 9, Math.sin(ang) * 9, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'ladder') {
    // Escada de mão (duas hastes verticais com 4 travessas)
    ctx.beginPath();
    ctx.moveTo(-6, -10);
    ctx.lineTo(-6, 10);
    ctx.moveTo(6, -10);
    ctx.lineTo(6, 10);
    ctx.stroke();

    for (let step = -6; step <= 6; step += 4) {
      ctx.beginPath();
      ctx.moveTo(-6, step);
      ctx.lineTo(6, step);
      ctx.stroke();
    }
  } else if (type === 'doorway') {
    // Arco de pedra com portal
    ctx.beginPath();
    ctx.moveTo(-8, 9);
    ctx.lineTo(-8, -2);
    ctx.bezierCurveTo(-8, -9, 8, -9, 8, -2);
    ctx.lineTo(8, 9);
    ctx.closePath();
    ctx.stroke();

    // Maçaneta e linha central
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, 2, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Escadas normais (stairs_down / stairs_up) com degraus em perspectiva
    const isDown = type === 'stairs_down';

    // 4 Degraus escalonados
    for (let i = 0; i < 4; i++) {
      const stepY = -7 + i * 4.5;
      const stepW = 14 - i * 2;
      ctx.beginPath();
      ctx.rect(-stepW / 2, stepY, stepW, 3.5);
      ctx.stroke();
    }

    // Seta direcional central
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    if (isDown) {
      ctx.moveTo(-3, 6);
      ctx.lineTo(3, 6);
      ctx.lineTo(0, 10);
    } else {
      ctx.moveTo(-3, -6);
      ctx.lineTo(3, -6);
      ctx.lineTo(0, -10);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Se houver nome do andar alvo, desenha um mini badge abaixo
  if (targetLevelName) {
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(targetLevelName.slice(0, 12), 0, 20);
  }

  ctx.restore();
}

/**
 * Desenha o ícone vetorial de qualquer POI (para canvas ou previews de drag & drop)
 */
export function drawPOIIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  zoom = 1
) {
  if (type === 'stash') {
    drawStashIcon(ctx, x, y, false, zoom);
  } else if (type === 'transition') {
    drawTransitionIcon(ctx, x, y, 'stairs_down', undefined, zoom);
  } else if (type === 'chest') {
    ctx.save();
    ctx.translate(x - 12, y - 12);
    drawChestHachure(ctx, 0, 0, 24, 'closed');
    ctx.restore();
  } else if (type === 'trap') {
    ctx.save();
    ctx.translate(x - 12, y - 12);
    drawTrapHachure(ctx, 0, 0, 24);
    ctx.restore();
  } else if (type === 'portcullis') {
    ctx.save();
    ctx.translate(x - 12, y - 12);
    drawPortcullisHachure(ctx, 0, 0, 24, 'closed');
    ctx.restore();
  } else if (type === 'trigger') {
    ctx.save();
    ctx.translate(x - 12, y - 12);
    drawTriggerHachure(ctx, 0, 0, 24, 'lever', 'inactive');
    ctx.restore();
  } else if (type === 'illusion_wall') {
    ctx.save();
    ctx.translate(x - 12, y - 12);
    drawIllusionWallHachure(ctx, 0, 0, 24, false, true);
    ctx.restore();
  } else {
    // Porta / Genérico
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(-8, -12, 16, 24);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3, 1, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  }
}


