import { FamilyMemberNode, FamilyRelationshipEdge, FamilyRelationType } from '@/lib/types';

export interface LayoutedNode {
  member: FamilyMemberNode;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutedEdge {
  id: string;
  fromId: string;
  toId: string;
  type: FamilyRelationType;
  path: string;
  isSecret?: boolean;
  midpoint?: { x: number; y: number };
  color?: string;
  dashed?: boolean;
}

export interface MarriageJunction {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  x: number;
  y: number;
  childrenIds: string[];
}

export interface TreeLayoutResult {
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  marriageJunctions: MarriageJunction[];
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 100;
const H_GAP = 50;
const SPOUSE_GAP = 28;
const V_GAP = 140;

export function calculateFamilyTreeLayout(
  members: FamilyMemberNode[],
  relationships: FamilyRelationshipEdge[],
  direction: 'top_bottom' | 'bottom_top' | 'left_right' = 'top_bottom'
): TreeLayoutResult {
  if (!members || members.length === 0) {
    return {
      nodes: [],
      edges: [],
      marriageJunctions: [],
      bounds: { minX: 0, minY: 0, maxX: 400, maxY: 300, width: 400, height: 300 },
    };
  }

  // 1. Identificar casamentos / uniões
  const marriageEdges = relationships.filter(
    (r) => r.type === 'spouse' || r.type === 'ex_spouse' || r.type === 'betrothed'
  );

  // Mapeamento de cônjuges
  const spouseMap = new Map<string, string[]>();
  marriageEdges.forEach((m) => {
    if (!spouseMap.has(m.fromId)) spouseMap.set(m.fromId, []);
    if (!spouseMap.has(m.toId)) spouseMap.set(m.toId, []);
    spouseMap.get(m.fromId)!.push(m.toId);
    spouseMap.get(m.toId)!.push(m.fromId);
  });

  // Mapeamento de pais para filhos
  const parentToChildrenMap = new Map<string, string[]>();
  const childToParentsMap = new Map<string, string[]>();

  relationships.forEach((r) => {
    if (r.type === 'parent' || r.type === 'child' || r.type === 'bastard' || r.type === 'adopted') {
      const parentId = r.type === 'child' ? r.toId : r.fromId;
      const childId = r.type === 'child' ? r.fromId : r.toId;

      if (!parentToChildrenMap.has(parentId)) parentToChildrenMap.set(parentId, []);
      if (!parentToChildrenMap.get(parentId)!.includes(childId)) {
        parentToChildrenMap.get(parentId)!.push(childId);
      }

      if (!childToParentsMap.has(childId)) childToParentsMap.set(childId, []);
      if (!childToParentsMap.get(childId)!.includes(parentId)) {
        childToParentsMap.get(childId)!.push(parentId);
      }
    }
  });

  // 2. Agrupar membros por geração
  const generationsMap = new Map<number, FamilyMemberNode[]>();
  members.forEach((m) => {
    const gen = m.generation ?? 0;
    if (!generationsMap.has(gen)) generationsMap.set(gen, []);
    generationsMap.get(gen)!.push(m);
  });

  const sortedGens = Array.from(generationsMap.keys()).sort((a, b) => a - b);
  const layoutedNodes: LayoutedNode[] = [];
  const nodePosMap = new Map<string, { x: number; y: number }>();

  // 3. Posicionar nós linha por linha (por geração)
  sortedGens.forEach((gen) => {
    const genMembers = generationsMap.get(gen)!;
    const yPos = 80 + gen * (NODE_HEIGHT + V_GAP);

    // Agrupar casais lado a lado para manter harmonia visual
    const processed = new Set<string>();
    const orderedInGen: FamilyMemberNode[] = [];

    genMembers.forEach((mem) => {
      if (processed.has(mem.id)) return;
      orderedInGen.push(mem);
      processed.add(mem.id);

      const spouses = spouseMap.get(mem.id) || [];
      spouses.forEach((spId) => {
        const spMember = genMembers.find((gm) => gm.id === spId);
        if (spMember && !processed.has(spMember.id)) {
          orderedInGen.push(spMember);
          processed.add(spMember.id);
        }
      });
    });

    let currentX = 60;
    orderedInGen.forEach((mem, index) => {
      const isSpouseOfPrev =
        index > 0 && (spouseMap.get(mem.id) || []).includes(orderedInGen[index - 1].id);

      if (index > 0) {
        currentX += isSpouseOfPrev ? SPOUSE_GAP : H_GAP;
      }

      const nodeX = currentX;
      nodePosMap.set(mem.id, { x: nodeX, y: yPos });
      layoutedNodes.push({
        member: mem,
        x: nodeX,
        y: yPos,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });

      currentX += NODE_WIDTH;
    });
  });

  // 4. Calcular Marriage Junctions & Midpoints
  const marriageJunctions: MarriageJunction[] = [];
  const marriageJunctionMap = new Map<string, MarriageJunction>();

  marriageEdges.forEach((m, idx) => {
    const p1 = nodePosMap.get(m.fromId);
    const p2 = nodePosMap.get(m.toId);
    if (!p1 || !p2) return;

    const juncX = (p1.x + NODE_WIDTH + p2.x) / 2;
    const juncY = p1.y + NODE_HEIGHT / 2;

    // Achar filhos em comum deste casal
    const children1 = parentToChildrenMap.get(m.fromId) || [];
    const children2 = parentToChildrenMap.get(m.toId) || [];
    const sharedChildren = children1.filter((c) => children2.includes(c));

    const junc: MarriageJunction = {
      id: `junction-${m.id || idx}`,
      spouse1Id: m.fromId,
      spouse2Id: m.toId,
      x: juncX,
      y: juncY,
      childrenIds: sharedChildren,
    };

    marriageJunctions.push(junc);
    marriageJunctionMap.set(`${m.fromId}_${m.toId}`, junc);
    marriageJunctionMap.set(`${m.toId}_${m.fromId}`, junc);
  });

  // 5. Gerar Arestas e Curvas SVG
  const layoutedEdges: LayoutedEdge[] = [];

  // Arestas de Casamento (Linha horizontal entre cônjuges com conector no meio)
  marriageEdges.forEach((m, idx) => {
    const p1 = nodePosMap.get(m.fromId);
    const p2 = nodePosMap.get(m.toId);
    if (!p1 || !p2) return;

    const startX = p1.x < p2.x ? p1.x + NODE_WIDTH : p1.x;
    const endX = p1.x < p2.x ? p2.x : p2.x + NODE_WIDTH;
    const midY = p1.y + NODE_HEIGHT / 2;

    layoutedEdges.push({
      id: `edge-marriage-${m.id || idx}`,
      fromId: m.fromId,
      toId: m.toId,
      type: m.type,
      isSecret: m.isSecret,
      path: `M ${startX} ${midY} L ${endX} ${midY}`,
      midpoint: { x: (startX + endX) / 2, y: midY },
      color: m.type === 'spouse' ? '#f59e0b' : m.type === 'betrothed' ? '#ec4899' : '#64748b',
      dashed: m.type === 'ex_spouse' || m.type === 'betrothed',
    });
  });

  // Arestas de Filhos / Descendência
  relationships.forEach((r, idx) => {
    if (r.type === 'parent' || r.type === 'child' || r.type === 'bastard' || r.type === 'adopted') {
      const parentId = r.type === 'child' ? r.toId : r.fromId;
      const childId = r.type === 'child' ? r.fromId : r.toId;

      const pPos = nodePosMap.get(parentId);
      const cPos = nodePosMap.get(childId);
      if (!pPos || !cPos) return;

      // Verificar se há um ponto de casamento intermediário com o outro progenitor
      const otherParents = (childToParentsMap.get(childId) || []).filter((p) => p !== parentId);
      let startPoint = { x: pPos.x + NODE_WIDTH / 2, y: pPos.y + NODE_HEIGHT };

      if (otherParents.length > 0) {
        const junc = marriageJunctionMap.get(`${parentId}_${otherParents[0]}`);
        if (junc) {
          startPoint = { x: junc.x, y: junc.y };
        }
      }

      const endPoint = { x: cPos.x + NODE_WIDTH / 2, y: cPos.y };
      const midY = (startPoint.y + endPoint.y) / 2;

      // Curva em degrau ou spline suave
      const path = `M ${startPoint.x} ${startPoint.y} C ${startPoint.x} ${midY}, ${endPoint.x} ${midY}, ${endPoint.x} ${endPoint.y}`;

      layoutedEdges.push({
        id: `edge-child-${r.id || idx}`,
        fromId: parentId,
        toId: childId,
        type: r.type,
        isSecret: r.isSecret,
        path,
        midpoint: { x: (startPoint.x + endPoint.x) / 2, y: midY },
        color: r.type === 'bastard' ? '#ef4444' : r.type === 'adopted' ? '#06b6d4' : '#10b981',
        dashed: r.type === 'bastard' || r.type === 'adopted',
      });
    }
  });

  // 6. Calcular Limites (Bounds)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  layoutedNodes.forEach((n) => {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  });

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const padding = 100;

  return {
    nodes: layoutedNodes,
    edges: layoutedEdges,
    marriageJunctions,
    bounds: {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width: Math.max(800, maxX - minX + padding * 2),
      height: Math.max(600, maxY - minY + padding * 2),
    },
  };
}
