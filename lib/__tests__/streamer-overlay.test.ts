import { describe, it, expect } from 'vitest';
import {
  overlayStateReducer,
  initialOverlayState,
  isRollSecret,
  filterPublicCombatants,
} from '@/lib/overlay/overlayStateReducer';

describe('Streamer Mode & OBS Overlay State Reducer', () => {
  describe('Secret Roll Filtering (DM Safe)', () => {
    it('should identify secret rolls correctly', () => {
      expect(isRollSecret(true)).toBe(true);
      expect(isRollSecret(false, 'gm_only')).toBe(true);
      expect(isRollSecret(false, 'secret')).toBe(true);
      expect(isRollSecret(false, 'blind')).toBe(true);
      expect(isRollSecret(false, 'public')).toBe(false);
      expect(isRollSecret(undefined, undefined)).toBe(false);
    });

    it('should NOT add secret roll to overlay state', () => {
      const state = overlayStateReducer(initialOverlayState, {
        type: 'ADD_ROLL',
        payload: {
          roll: {
            rollerName: 'Mestre',
            rollType: 'd20',
            diceFormula: '1d20+5',
            result: 19,
          },
          isSecret: true,
        },
      });

      expect(state.rolls).toHaveLength(0);
    });

    it('should add public rolls and recognize Nat 20 crit', () => {
      const state = overlayStateReducer(initialOverlayState, {
        type: 'ADD_ROLL',
        payload: {
          roll: {
            rollerName: 'Guerreiro',
            rollType: 'd20',
            diceFormula: '1d20+7',
            result: 20,
            title: 'Ataque com Espada Larga',
          },
        },
      });

      expect(state.rolls).toHaveLength(1);
      expect(state.rolls[0].rollerName).toBe('Guerreiro');
      expect(state.rolls[0].result).toBe(20);
      expect(state.rolls[0].isCrit).toBe(true);
      expect(state.rolls[0].isFail).toBe(false);
    });

    it('should recognize Nat 1 critical failure', () => {
      const state = overlayStateReducer(initialOverlayState, {
        type: 'ADD_ROLL',
        payload: {
          roll: {
            rollerName: 'Ladino',
            rollType: 'd20',
            diceFormula: '1d20+3',
            result: 1,
          },
        },
      });

      expect(state.rolls).toHaveLength(1);
      expect(state.rolls[0].isCrit).toBe(false);
      expect(state.rolls[0].isFail).toBe(true);
    });
  });

  describe('Combatant Privacy & Initiative Filtering', () => {
    it('should filter out hidden combatants and unrevealed monsters', () => {
      const mockCombatants = [
        { id: '1', name: 'Paladino', initiative: 18, revealedToPlayers: true },
        { id: '2', name: 'Goblin Emboscado', initiative: 15, revealedToPlayers: false },
        { id: '3', name: 'Mago', initiative: 12, hidden: true },
        { id: '4', name: 'Orc Guerreiro', initiative: 10, revealedToPlayers: true, hidden: false },
      ];

      const publicList = filterPublicCombatants(mockCombatants);
      expect(publicList).toHaveLength(2);
      expect(publicList.map((c) => c.name)).toEqual(['Paladino', 'Orc Guerreiro']);
    });

    it('should update combat state with active round and turn index', () => {
      const mockCombatants = [
        { id: '1', name: 'Paladino', initiative: 18 },
        { id: '2', name: 'Orc', initiative: 10 },
      ];

      const state = overlayStateReducer(initialOverlayState, {
        type: 'UPDATE_COMBAT',
        payload: {
          combatants: mockCombatants,
          currentTurnIndex: 1,
          roundCount: 3,
        },
      });

      expect(state.combat.isActive).toBe(true);
      expect(state.combat.combatants).toHaveLength(2);
      expect(state.combat.currentTurnIndex).toBe(1);
      expect(state.combat.roundCount).toBe(3);
    });
  });

  describe('Scene & Atmosphere Updates', () => {
    it('should update projected scene details and climate', () => {
      const state = overlayStateReducer(initialOverlayState, {
        type: 'UPDATE_SCENE',
        payload: {
          title: 'Cripta dos Ancestrais',
          sensoryText: 'O ar é gélido e o som de goteiras ecoa no silêncio sepulcral.',
          timeOfDay: 'night',
          hasRain: true,
          hasFog: true,
        },
      });

      expect(state.scene.title).toBe('Cripta dos Ancestrais');
      expect(state.scene.timeOfDay).toBe('night');
      expect(state.scene.hasRain).toBe(true);
      expect(state.scene.hasFog).toBe(true);
    });
  });

  describe('Chat Filtering', () => {
    it('should ignore private whispers and keep public/IC messages', () => {
      let state = overlayStateReducer(initialOverlayState, {
        type: 'ADD_CHAT',
        payload: {
          id: 'w1',
          senderName: 'Mestre',
          content: 'Você ouve passos atrás de você...',
          channel: 'whisper',
          timestamp: Date.now(),
        },
      });

      expect(state.chatMessages).toHaveLength(0);

      state = overlayStateReducer(state, {
        type: 'ADD_CHAT',
        payload: {
          id: 'ic1',
          senderName: 'Gimli',
          content: 'Ninguém arremessa um anão!',
          channel: 'ic',
          timestamp: Date.now(),
        },
      });

      expect(state.chatMessages).toHaveLength(1);
      expect(state.chatMessages[0].content).toBe('Ninguém arremessa um anão!');
    });
  });
});
