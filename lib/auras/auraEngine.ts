/**
 * lib/auras/auraEngine.ts
 * Motor Espacial e de Regras para Auras Dinâmicas no Masters Codex.
 * 
 * Lógica matemática de colisão espacial entre tokens e auras esféricas/cúbicas,
 * avaliação de gatilhos (ao entrar na aura, início/fim de turno) e cálculo
 * contínuo de bônus passivos (ex: Aura do Paladino).
 */

import { TokenAura, AuraTriggerEvent, ActiveAuraBuff } from './auraTypes';
import { Combatant } from '../types';
import { distance2D, Point3D } from '../vision/aoeCollision';

/**
 * Converte distância em pés (feet) para unidades do grid / metros (1 quadrado de 5ft = 1.5m)
 */
export function feetToUnits(feet: number): number {
  return (feet / 5) * 1.5;
}

/**
 * Verifica se um token é considerado 'aliado' ou 'inimigo' em relação à fonte da aura.
 */
export function isTargetEligibleForAura(
  sourceCombatant: Combatant,
  targetCombatant: Combatant,
  filter: TokenAura['affects']
): boolean {
  if (filter === 'all') return true;

  const isSameFaction =
    (sourceCombatant.type === 'player' && targetCombatant.type === 'player') ||
    (sourceCombatant.type === 'monster' && targetCombatant.type === 'monster') ||
    (sourceCombatant.type === 'npc' && targetCombatant.type === 'npc');

  if (filter === 'allies') {
    return isSameFaction;
  }

  if (filter === 'enemies') {
    return !isSameFaction;
  }

  return true;
}

/**
 * Retorna o raio efetivo de um combatente com base no seu tamanho D&D (padrão: 0.75m para Médio)
 */
export function getCombatantRadius(combatant: Combatant): number {
  const size = (combatant.size || 'Medium').toLowerCase();
  if (size.includes('tiny') || size.includes('miudo')) return 0.4;
  if (size.includes('small') || size.includes('pequeno')) return 0.6;
  if (size.includes('large') || size.includes('grande')) return 1.5;
  if (size.includes('huge') || size.includes('enorme')) return 2.25;
  if (size.includes('gargantuan') || size.includes('imenso')) return 3.0;
  return 0.75; // Médio
}

/**
 * Verifica se uma posição 2D/3D de um token está dentro do raio da aura emitida por outro token.
 */
export function isTokenInsideAura(
  targetPos: { x: number; z: number; y?: number },
  targetCombatant: Combatant,
  aura: TokenAura,
  sourcePos: { x: number; z: number; y?: number }
): boolean {
  if (!aura.enabled) return false;

  const auraRadiusUnits = feetToUnits(aura.radiusFt);
  const targetRadius = getCombatantRadius(targetCombatant);

  const p1: Point3D = { x: targetPos.x, z: targetPos.z };
  const p2: Point3D = { x: sourcePos.x, z: sourcePos.z };

  const dist = distance2D(p1, p2);

  // Considera a borda física do token alvo
  return dist <= auraRadiusUnits + targetRadius;
}

/**
 * Avalia se o movimento de um token disparou entradas ou saídas em auras ativas.
 * Retorna os eventos de gatilho que requerem reação do mestre ou automação.
 */
export function evaluateAuraTriggersOnMove(params: {
  movedCombatant: Combatant;
  previousPos: { x: number; z: number };
  newPos: { x: number; z: number };
  allCombatants: Combatant[];
  tokenPositions: Record<string, { x: number; z: number }>;
}): AuraTriggerEvent[] {
  const { movedCombatant, previousPos, newPos, allCombatants, tokenPositions } = params;
  const triggers: AuraTriggerEvent[] = [];

  // Coleta todas as auras ativas no combate
  const activeAuras: { aura: TokenAura; source: Combatant }[] = [];
  allCombatants.forEach((c) => {
    if (c.auras && c.auras.length > 0) {
      c.auras.forEach((aura) => {
        if (aura.enabled) {
          activeAuras.push({ aura, source: c });
        }
      });
    }
  });

  // 1. CASO A: O token que se moveu ENTROU na aura de outro combatente
  activeAuras.forEach(({ aura, source }) => {
    // Auras não afetam o próprio conjurador para gatilhos hostis como Spirit Guardians
    if (source.id === movedCombatant.id && aura.affects === 'enemies') return;

    if (!isTargetEligibleForAura(source, movedCombatant, aura.affects)) return;

    const sourcePos = tokenPositions[source.id] || { x: source.x ?? 0, z: source.z ?? 0 };

    const wasInside = isTokenInsideAura(previousPos, movedCombatant, aura, sourcePos);
    const isInside = isTokenInsideAura(newPos, movedCombatant, aura, sourcePos);

    if (!wasInside && isInside && aura.triggerTiming === 'on_enter') {
      triggers.push({
        id: `trigger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        aura,
        targetCombatantId: movedCombatant.id,
        targetCombatantName: movedCombatant.name,
        triggerType: 'ENTER',
        timestamp: Date.now(),
      });
    }
  });

  // 2. CASO B: O token que se moveu É O EMISSOR da aura (ex: Paladino moveu e engoliu um inimigo)
  if (movedCombatant.auras && movedCombatant.auras.length > 0) {
    movedCombatant.auras.forEach((aura) => {
      if (!aura.enabled || aura.triggerTiming !== 'on_enter') return;

      allCombatants.forEach((other) => {
        if (other.id === movedCombatant.id) return;
        if (!isTargetEligibleForAura(movedCombatant, other, aura.affects)) return;

        const otherPos = tokenPositions[other.id] || { x: other.x ?? 0, z: other.z ?? 0 };

        const wasInside = isTokenInsideAura(otherPos, other, aura, previousPos);
        const isInside = isTokenInsideAura(otherPos, other, aura, newPos);

        if (!wasInside && isInside) {
          triggers.push({
            id: `trigger-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            aura,
            targetCombatantId: other.id,
            targetCombatantName: other.name,
            triggerType: 'ENTER',
            timestamp: Date.now(),
          });
        }
      });
    });
  }

  return triggers;
}

/**
 * Calcula todos os bônus contínuos (passivos) que um combatente está recebendo
 * de todas as auras aliadas ao seu redor no momento.
 */
export function calculateAuraBuffsForCombatant(params: {
  targetCombatant: Combatant;
  allCombatants: Combatant[];
  tokenPositions: Record<string, { x: number; z: number }>;
}): ActiveAuraBuff[] {
  const { targetCombatant, allCombatants, tokenPositions } = params;
  const buffs: ActiveAuraBuff[] = [];

  const targetPos = tokenPositions[targetCombatant.id] || {
    x: targetCombatant.x ?? 0,
    z: targetCombatant.z ?? 0,
  };

  allCombatants.forEach((source) => {
    if (!source.auras || source.auras.length === 0) return;

    source.auras.forEach((aura) => {
      if (!aura.enabled || aura.triggerTiming !== 'continuous_buff') return;
      if (!isTargetEligibleForAura(source, targetCombatant, aura.affects)) return;

      const sourcePos = tokenPositions[source.id] || { x: source.x ?? 0, z: source.z ?? 0 };

      if (isTokenInsideAura(targetPos, targetCombatant, aura, sourcePos)) {
        let finalModifier = { ...aura.action.statModifier };

        // Resolver modificador dinâmico de Carisma do Conjurador (Aura of Protection)
        if (finalModifier.savingThrowsBonus === 'caster_cha_mod') {
          const cha = source.cha ?? 10;
          const chaMod = Math.floor((cha - 10) / 2);
          finalModifier.savingThrowsBonus = Math.max(1, chaMod); // Mínimo +1 pelo Livro do Jogador
        }

        buffs.push({
          auraId: aura.id,
          sourceCombatantId: source.id,
          sourceCombatantName: source.name,
          auraName: aura.name,
          statModifier: finalModifier,
        });
      }
    });
  });

  return buffs;
}
