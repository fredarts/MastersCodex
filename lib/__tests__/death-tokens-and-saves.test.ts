import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { createTokenMesh } from '@/components/battle-3d/Token3DMesh';
import { Combatant } from '@/lib/types';

describe('3D Battle Grid Death Tokens and Downed Players', () => {
  beforeEach(() => {
    vi.spyOn(THREE.TextureLoader.prototype, 'load').mockImplementation((_url, onLoad) => {
      const tex = new THREE.Texture();
      if (onLoad) onLoad(tex);
      return tex;
    });
  });

  it('renders a dead monster as a Dyson coin disc on the floor', () => {
    const deadMonster: Combatant = {
      id: 'goblin-1',
      name: 'Goblin Arqueiro',
      type: 'monster',
      hp: 0,
      maxHp: 7,
      ac: 13,
      initiative: 12,
      conditions: ['Morto'],
      tokenImageUrl: 'https://example.com/goblin.png',
      size: 'Pequeno',
    };

    const mesh = createTokenMesh({
      combatant: deadMonster,
      isCurrentTurn: false,
      isSelectedTarget: false,
      isSelectedForRotation: false,
      isControlledByUser: false,
      positionX: 5,
      positionZ: 5,
      rotationAngleDeg: 0,
    });

    expect(mesh).toBeDefined();
    expect(mesh.userData.isDead).toBe(true);
    // Arrow cone should NOT be rendered for dead creatures
    const arrow = mesh.getObjectByName('arrowMesh');
    expect(arrow).toBeUndefined();
  });

  it('renders a downed player lying horizontally on the ground', () => {
    const downedPlayer: Combatant = {
      id: 'player-1',
      name: 'Thorin Escudo-de-Carvalho',
      type: 'player',
      hp: 0,
      maxHp: 28,
      ac: 18,
      initiative: 15,
      conditions: ['Inconsciente'],
      tokenImageUrl: 'https://example.com/thorin.png',
      size: 'Médio',
    };

    const mesh = createTokenMesh({
      combatant: downedPlayer,
      isCurrentTurn: false,
      isSelectedTarget: false,
      isSelectedForRotation: false,
      isControlledByUser: true,
      positionX: 2,
      positionZ: 3,
      rotationAngleDeg: 45,
    });

    expect(mesh).toBeDefined();
    expect(mesh.userData.isDowned).toBe(true);
    expect(mesh.userData.isDead).toBe(false);
  });

  it('renders normal vertical billboard for a living player or monster', () => {
    const livingMonster: Combatant = {
      id: 'orc-1',
      name: 'Orc Guerreiro',
      type: 'monster',
      hp: 15,
      maxHp: 15,
      ac: 13,
      initiative: 10,
      conditions: [],
      tokenImageUrl: 'https://example.com/orc.png',
    };

    const mesh = createTokenMesh({
      combatant: livingMonster,
      isCurrentTurn: true,
      isSelectedTarget: false,
      isSelectedForRotation: false,
      isControlledByUser: false,
      positionX: 0,
      positionZ: 0,
      rotationAngleDeg: 0,
    });

    expect(mesh.userData.isDead).toBe(false);
    expect(mesh.userData.isDowned).toBe(false);
    expect(mesh.getObjectByName('selectionRing')).toBeDefined();
    expect(mesh.getObjectByName('arrowMesh')).toBeDefined();
  });
});

describe('Death Saving Throw Automation Rules', () => {
  const resolveDeathSave = (roll: number, currentSaves = { successes: 0, failures: 0 }) => {
    let successes = currentSaves.successes;
    let failures = currentSaves.failures;
    let hp = 0;
    let isStabilized = false;
    let isDead = false;

    if (roll === 20) {
      hp = 1;
      successes = 0;
      failures = 0;
    } else if (roll === 1) {
      failures = Math.min(3, failures + 2);
      if (failures >= 3) isDead = true;
    } else if (roll >= 10) {
      successes = Math.min(3, successes + 1);
      if (successes >= 3) isStabilized = true;
    } else {
      failures = Math.min(3, failures + 1);
      if (failures >= 3) isDead = true;
    }

    return { hp, successes, failures, isStabilized, isDead };
  };

  it('Natural 20 heals 1 HP and resets death saves to 0/0', () => {
    const res = resolveDeathSave(20, { successes: 1, failures: 2 });
    expect(res.hp).toBe(1);
    expect(res.successes).toBe(0);
    expect(res.failures).toBe(0);
  });

  it('Natural 1 counts as 2 failures', () => {
    const res = resolveDeathSave(1, { successes: 0, failures: 1 });
    expect(res.failures).toBe(3);
    expect(res.isDead).toBe(true);
  });

  it('Roll between 10 and 19 counts as 1 success and stabilizes at 3 successes', () => {
    const res1 = resolveDeathSave(14, { successes: 1, failures: 0 });
    expect(res1.successes).toBe(2);
    expect(res1.isStabilized).toBe(false);

    const res2 = resolveDeathSave(10, { successes: 2, failures: 0 });
    expect(res2.successes).toBe(3);
    expect(res2.isStabilized).toBe(true);
  });

  it('Roll between 2 and 9 counts as 1 failure', () => {
    const res = resolveDeathSave(7, { successes: 2, failures: 1 });
    expect(res.failures).toBe(2);
    expect(res.isDead).toBe(false);
  });
});
