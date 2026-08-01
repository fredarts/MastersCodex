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
