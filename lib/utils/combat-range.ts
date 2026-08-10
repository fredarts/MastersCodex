import { Combatant } from '../types';
import { WEAPON_TABLE } from '../dnd5e-calculator';

/**
 * Retorna o offset de alcance (reach) em quadrados de acordo com o tamanho da criatura.
 * Pelo fato dos combatentes serem alinhados em 1 célula (x, z), criaturas maiores estendem
 * seu alcance físico para as células adjacentes.
 */
export function getCombatantSizeReachOffset(size?: string): number {
  if (!size) return 0;
  const s = size.toLowerCase();
  if (s.includes('grande') || s.includes('large')) return 1;       // 2x2 ocupa +1 quadrado para fora da âncora
  if (s.includes('enorme') || s.includes('huge')) return 2;        // 3x3 ocupa +2 quadrados
  if (s.includes('imenso') || s.includes('gargantuan')) return 3;   // 4x4 ocupa +3 quadrados
  return 0;
}

/**
 * Verifica se um ataque é considerado de alcance (Reach/10ft+) analisando o nome da arma
 * ou a descrição da habilidade.
 */
export function isReachAttack(attackName: string, actionDescription: string = ''): boolean {
  const nameClean = attackName.replace(/Ataque:\s*/i, '').trim();

  // 1. Procurar na tabela padrão de armas
  const weapon = WEAPON_TABLE[nameClean];
  if (weapon && weapon.properties) {
    const hasReachProp = weapon.properties.some(p => 
      p.toLowerCase().includes('alcance') || p.toLowerCase().includes('reach')
    );
    if (hasReachProp) return true;
  }

  // 2. Analisar nome ou descrição da habilidade
  const textToAnalyze = `${attackName} ${actionDescription}`.toLowerCase();
  
  // Expressões comuns para alcance em PT/EN:
  const reachKeywords = [
    'alcance 3m', 'alcance: 3m', 'alcance de 3m',
    'reach 10', 'reach: 10',
    'alcance 4.5m', 'alcance: 4.5m', 'reach 15',
    'alongado', 'long-limbed', 'lunge', 'espada longa de alcance'
  ];

  return reachKeywords.some(keyword => textToAnalyze.includes(keyword));
}

/**
 * Calcula a distância Chebyshev (D&D 5e padrão, onde diagonais custam 1 unidade).
 * Como o grid 3D do Masters Codex utiliza células de 2x2 unidades, a diferença 3D 
 * deve ser dividida por 2 para obtermos a distância real em quadrados.
 */
export function calculateGridDistance(c1: { x: number; z: number }, c2: { x: number; z: number }): number {
  const dx = Math.abs(c1.x - c2.x);
  const dz = Math.abs(c1.z - c2.z);
  return Math.max(dx, dz) / 2;
}

/**
 * Valida o alcance de um ataque corpo a corpo.
 */
export function validateMeleeAttackRange(
  attacker: Combatant,
  target: Combatant,
  attackName: string,
  actionDescription: string = ''
): { isValid: boolean; actualDistance: number; maxAllowedDistance: number; isMelee: boolean } {
  // Se o atacante ou alvo não possuir coordenadas, não há como validar alcance no grid
  if (
    attacker.x === undefined || attacker.z === undefined ||
    target.x === undefined || target.z === undefined
  ) {
    return { isValid: true, actualDistance: 0, maxAllowedDistance: 999, isMelee: false };
  }

  const nameClean = attackName.replace(/Ataque:\s*/i, '').trim().toLowerCase();

  // 1. Determinar se o ataque é à distância (ranged)
  // Checamos a tabela de armas
  const weapon = WEAPON_TABLE[attackName.replace(/Ataque:\s*/i, '').trim()];
  const isWeaponRanged = weapon ? (weapon.isRanged || weapon.category.toLowerCase().includes('distância')) : false;

  // Checamos palavras chave no nome do ataque ou descrição
  const isAttackRangedText = 
    nameClean.includes('arco') || 
    nameClean.includes('bow') || 
    nameClean.includes('besta') || 
    nameClean.includes('crossbow') || 
    nameClean.includes('arremess') || 
    nameClean.includes('throw') || 
    nameClean.includes('distância') || 
    nameClean.includes('ranged') || 
    nameClean.includes('funda') || 
    nameClean.includes('sling') || 
    nameClean.includes('dardo') || 
    nameClean.includes('dart') ||
    actionDescription.toLowerCase().includes('ataque à distância') ||
    actionDescription.toLowerCase().includes('ranged weapon attack');

  const isMelee = !isWeaponRanged && !isAttackRangedText;

  // Se for um ataque à distância, não validamos o alcance corpo a corpo
  if (!isMelee) {
    return { isValid: true, actualDistance: 0, maxAllowedDistance: 999, isMelee: false };
  }

  // 2. Determinar alcance base
  const hasReach = isReachAttack(attackName, actionDescription);
  const baseReach = hasReach ? 2 : 1; // 2 quadrados (10ft/3m) ou 1 quadrado (5ft/1.5m)

  // 3. Obter offsets baseados no tamanho do atacante e do alvo
  const attackerOffset = getCombatantSizeReachOffset(attacker.size);
  const targetOffset = getCombatantSizeReachOffset(target.size);

  const maxAllowedDistance = baseReach + attackerOffset + targetOffset;
  const actualDistance = calculateGridDistance(
    { x: attacker.x as number, z: attacker.z as number },
    { x: target.x as number, z: target.z as number }
  );

  const isValid = actualDistance <= maxAllowedDistance;

  return { isValid, actualDistance, maxAllowedDistance, isMelee: true };
}
