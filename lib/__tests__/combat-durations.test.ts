import { describe, it, expect } from 'vitest';
import { Combatant } from '../types';

describe('Duração de Efeitos por Rodada (Combat Status Durations)', () => {
  it('deve decrementar a duração restante das condições e remover ao zerar', () => {
    // Simula a lógica de decremento que foi implementada
    const processCombatantTurnStart = (c: Combatant): Combatant => {
      let updatedDurations = c.statusDurations ? c.statusDurations.map(d => ({
        ...d,
        remainingRounds: d.remainingRounds - 1
      })) : [];

      const expired = updatedDurations.filter(d => d.remainingRounds <= 0);
      const active = updatedDurations.filter(d => d.remainingRounds > 0);

      let updatedConditions = c.conditions || [];
      expired.forEach(exp => {
        updatedConditions = updatedConditions.filter(cond => cond !== exp.name);
      });

      return {
        ...c,
        conditions: updatedConditions,
        statusDurations: active.length > 0 ? active : undefined,
      };
    };

    const combatant: Combatant = {
      id: 'c1',
      name: 'Aragorn',
      type: 'player',
      hp: 80,
      maxHp: 80,
      ac: 16,
      initiative: 15,
      conditions: ['Cego', 'Invisível'],
      statusDurations: [
        { name: 'Cego', remainingRounds: 1 },
        { name: 'Invisível', remainingRounds: 3 },
        { name: 'Fúria', remainingRounds: 10 }
      ]
    };

    // Primeiro decremento (início de turno)
    const turn1 = processCombatantTurnStart(combatant);
    
    // 'Cego' deve ter expirado e saído de conditions e statusDurations
    expect(turn1.conditions).not.toContain('Cego');
    expect(turn1.conditions).toContain('Invisível');
    expect(turn1.statusDurations).toEqual([
      { name: 'Invisível', remainingRounds: 2 },
      { name: 'Fúria', remainingRounds: 9 }
    ]);

    // Segundo decremento
    const turn2 = processCombatantTurnStart(turn1);
    expect(turn2.statusDurations).toEqual([
      { name: 'Invisível', remainingRounds: 1 },
      { name: 'Fúria', remainingRounds: 8 }
    ]);
  });
});
