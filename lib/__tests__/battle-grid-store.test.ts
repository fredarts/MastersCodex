import { describe, it, expect, beforeEach } from 'vitest';
import { useBattleGridStore } from '../stores/useBattleGridStore';

describe('useBattleGridStore', () => {
  beforeEach(() => {
    useBattleGridStore.setState({
      tokenPositions3D: {},
      tokenRotations3D: {},
    });
  });

  it('deve atualizar posições 3D corretamente com limites', () => {
    const { updateTokenPosition3D } = useBattleGridStore.getState();

    updateTokenPosition3D('hero1', undefined, undefined, 2, -3);
    expect(useBattleGridStore.getState().tokenPositions3D['hero1']).toEqual({ x: 2, z: -3 });

    // Clamp limits (-5 a 5)
    updateTokenPosition3D('hero1', undefined, undefined, 10, -10);
    expect(useBattleGridStore.getState().tokenPositions3D['hero1']).toEqual({ x: 10, z: -10 });
  });

  it('deve normalizar ângulos de rotação 3D', () => {
    const { updateTokenRotation3D } = useBattleGridStore.getState();

    updateTokenRotation3D('hero1', 450);
    expect(useBattleGridStore.getState().tokenRotations3D['hero1']).toBe(90);

    updateTokenRotation3D('hero1', -90);
    expect(useBattleGridStore.getState().tokenRotations3D['hero1']).toBe(270);
  });

  it('deve inicializar posições e rotações a partir de combatantes', () => {
    const mockCombatants: any[] = [
      { id: 'c1', name: 'Aragorn', x: 1, z: 2, rotation: 180 },
      { id: 'c2', name: 'Orc', x: -2, z: 4, rotation: 0 },
    ];

    useBattleGridStore.getState().initializeFromCombatants(mockCombatants);

    expect(useBattleGridStore.getState().tokenPositions3D['c1']).toEqual({ x: 1, z: 2 });
    expect(useBattleGridStore.getState().tokenRotations3D['c1']).toBe(180);
    expect(useBattleGridStore.getState().tokenPositions3D['c2']).toEqual({ x: -2, z: 4 });
  });
});
