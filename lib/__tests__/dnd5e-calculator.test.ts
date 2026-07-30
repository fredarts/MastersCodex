/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import {
  calculateModifier,
  formatModifier,
  calculateProficiencyBonus,
  calculateSpellDC,
  applyLongRest,
  calculatePassivePerception,
  applyShortRest,
  getClassResourcesForLevel,
  applyLevelChange,
  getJackOfAllTradesBonus,
  calculateSkillTotal,
  calculateArmorClass,
} from '../dnd5e-calculator';
import { CharacterSheet } from '../types';

describe('D&D 5e Rules Calculator Unit Tests', () => {
  describe('calculateModifier', () => {
    it('deve retornar 0 para atributo 10 ou 11', () => {
      expect(calculateModifier(10)).toBe(0);
      expect(calculateModifier(11)).toBe(0);
    });

    it('deve retornar modificadores positivos corretos', () => {
      expect(calculateModifier(12)).toBe(1);
      expect(calculateModifier(14)).toBe(2);
      expect(calculateModifier(18)).toBe(4);
      expect(calculateModifier(20)).toBe(5);
    });

    it('deve retornar modificadores negativos corretos', () => {
      expect(calculateModifier(8)).toBe(-1);
      expect(calculateModifier(6)).toBe(-2);
      expect(calculateModifier(1)).toBe(-5);
    });
  });

  describe('formatModifier', () => {
    it('deve formatar sinal de positivo para valores >= 0', () => {
      expect(formatModifier(3)).toBe('+3');
      expect(formatModifier(0)).toBe('+0');
    });

    it('deve formatar sinal de negativo para valores < 0', () => {
      expect(formatModifier(-2)).toBe('-2');
    });
  });

  describe('calculateProficiencyBonus', () => {
    it('deve retornar +2 para níveis 1 a 4', () => {
      expect(calculateProficiencyBonus(1)).toBe(2);
      expect(calculateProficiencyBonus(4)).toBe(2);
    });

    it('deve retornar +3 para níveis 5 a 8', () => {
      expect(calculateProficiencyBonus(5)).toBe(3);
      expect(calculateProficiencyBonus(8)).toBe(3);
    });

    it('deve retornar +6 para nível 20', () => {
      expect(calculateProficiencyBonus(20)).toBe(6);
    });
  });

  describe('calculateSpellDC', () => {
    it('deve calcular CD de magia corretamente (8 + Bônus Proficiência + Modificador)', () => {
      const mockSheet: Partial<CharacterSheet> = {
        level: 5, // Prof = +3
        spellcastingAbility: 'int',
        attributes: {
          int: { score: 16 }, // Mod = +3
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
        savingThrows: {} as any,
        skills: {} as any,
      };

      expect(calculateSpellDC(mockSheet as CharacterSheet)).toBe(14); // 8 + 3 + 3 = 14
    });
  });

  describe('applyLongRest', () => {
    it('deve restaurar PV total e resgatar slots de magia no descanso longo', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Guerreiro',
        level: 4,
        currentHp: 5,
        maxHp: 25,
        tempHp: 0,
        hitDiceUsed: '21d8',
        deathSaves: { successes: 2, failures: 1 },
        spellSlots: {
          1: { max: 4, used: 3 },
          2: { max: 2, used: 2 },
        } as any,
      };

      const restored = applyLongRest(mockSheet as CharacterSheet);

      expect(restored.currentHp).toBe(25);
      expect(restored.deathSaves.successes).toBe(0);
      expect(restored.deathSaves.failures).toBe(0);
      expect(restored.spellSlots[1].used).toBe(0);
      expect(restored.spellSlots[2].used).toBe(0);
    });
  });
  describe('calculatePassivePerception', () => {
    it('deve calcular percepção passiva (10 + percepção total)', () => {
      const mockSheet: Partial<CharacterSheet> = {
        level: 5, // Prof = +3
        attributes: {
          wis: { score: 16 }, // Mod = +3
        } as any,
        skills: {
          percepcao: 'proficient', // Total = 3 + 3 = 6
        } as any,
      };

      expect(calculatePassivePerception(mockSheet as CharacterSheet)).toBe(16); // 10 + 6 = 16
    });

    it('deve calcular percepção passiva com expertise', () => {
      const mockSheet: Partial<CharacterSheet> = {
        level: 5, // Prof = +3
        attributes: {
          wis: { score: 16 }, // Mod = +3
        } as any,
        skills: {
          percepcao: 'expertise', // Total = 3 + (3 * 2) = 9
        } as any,
      };

      expect(calculatePassivePerception(mockSheet as CharacterSheet)).toBe(19); // 10 + 9 = 19
    });
  });

  describe('applyShortRest', () => {
    it('deve recuperar PV rolando dados de vida e atualizar os usados', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Guerreiro', // hitDie = 1d10
        level: 5,
        currentHp: 10,
        maxHp: 50,
        attributes: {
          con: { score: 14 } // mod = +2
        } as any,
        hitDiceUsed: '21d10', // Usados: 2. Totais: 5. Disponíveis: 3.
      };

      // Spy no Math.random para controlar o rolo do dado
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // (0.5 * 10) + 1 = 6

      const { updatedSheet, hpRecovered } = applyShortRest(mockSheet as CharacterSheet, 2);

      // Roll: 6 + 2 = 8 por dado. 2 dados = 16.
      expect(hpRecovered).toBe(16);
      expect(updatedSheet.currentHp).toBe(26);
      expect(updatedSheet.hitDiceUsed).toBe('41d10'); // 2 já usados + 2 = 4

      randomSpy.mockRestore();
    });
  });

  describe('getClassResourcesForLevel & Class Automation', () => {
    it('deve retornar recursos de fúria corretos para Bárbaro de nível 5', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Bárbaro',
        level: 5,
        attributes: {
          cha: { score: 10 }
        } as any
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 5);
      expect(res.furia).toBeDefined();
      expect(res.furia.max).toBe(3);
      expect(res.furia.current).toBe(3);
    });

    it('deve retornar cura pelas mãos e sentido divino para Paladino de nível 1', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Paladino',
        level: 1,
        attributes: {
          cha: { score: 14 } // mod = +2
        } as any
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 1);
      expect(res.lay_on_hands).toBeDefined();
      expect(res.lay_on_hands.max).toBe(5);
      expect(res.sentido_divino).toBeDefined();
      expect(res.sentido_divino.max).toBe(3); // 1 + 2
    });

    it('deve carregar características da classe no levelUp', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Bárbaro',
        level: 1,
        attributePointsAvailable: 0,
        attributesLocked: true,
        attributes: {
          con: { score: 14 }
        } as any,
        spellSlots: {},
        classResources: {},
        classFeatures: []
      };

      const leveled = applyLevelChange(mockSheet as CharacterSheet, 2);
      expect(leveled.level).toBe(2);
      expect(leveled.classFeatures).toBeDefined();
      // Level 2 Bárbaro deve ter 4 características (Fúria, Defesa Sem Armadura, Ataque Descuidado, Sentido de Perigo)
      expect(leveled.classFeatures!.length).toBe(4);
      expect(leveled.classFeatures!.some(f => f.name === 'Ataque Descuidado')).toBe(true);
    });
  });

  describe('Mecânicas do Bardo', () => {
    it('deve adicionar bônus de Jack of All Trades (Faz-Tudo) para perícias não proficientes', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Bardo', // classes is generated from className in calculateSkillTotal using getCharacterClasses
        level: 2, // Prof = +2, Faz-Tudo = +1
        attributes: {
          dex: { score: 14 }, // Mod = +2
          str: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
        skills: {
          furtividade: 'none',
          atletismo: 'proficient', // Prof = +2
          atuacao: 'expertise', // Exp = +4
        } as any,
      };

      // Jack of All Trades bonus
      expect(getJackOfAllTradesBonus(mockSheet as CharacterSheet)).toBe(1);

      // Furtividade (DEX): Mod (+2) + Faz-Tudo (+1) = +3
      expect(calculateSkillTotal(mockSheet as CharacterSheet, 'furtividade')).toBe(3);

      // Atletismo (STR): Mod (+0) + Prof (+2) = +2
      expect(calculateSkillTotal(mockSheet as CharacterSheet, 'atletismo')).toBe(2);
      
      // Atuacao (CHA): Mod (+0) + Exp (+4) = +4
      expect(calculateSkillTotal(mockSheet as CharacterSheet, 'atuacao')).toBe(4);
    });

    it('deve fornecer Inspiração Bárdica corretamente', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Bardo',
        level: 1,
        attributes: {
          cha: { score: 16 } // mod = +3
        } as any
      };
      
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 1);
      expect(res.inspiracao_bardica).toBeDefined();
      expect(res.inspiracao_bardica.max).toBe(3); // min 1, or Cha mod (3)
    });
  });

  describe('Mecânicas do Guerreiro', () => {
    it('deve aplicar +1 na CA se tiver Estilo de Luta: Defesa e usar armadura', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Guerreiro',
        level: 1,
        featuresAndTraits: 'Estilo de Luta: Defesa',
        attributes: { dex: { score: 14 } } as any, // Mod +2
      };

      // Sem armadura (Nenhuma) -> AC = 10 + 2 (Dex) = 12 (Defesa não aplica)
      expect(calculateArmorClass(mockSheet as CharacterSheet, 'Nenhuma')).toBe(12);

      // Com armadura leve (Couro: Base 11) -> AC = 11 + 2 (Dex) + 1 (Defesa) = 14
      expect(calculateArmorClass(mockSheet as CharacterSheet, 'Couro')).toBe(14);
    });

    it('deve calcular usos de recursos do Guerreiro', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Guerreiro',
        level: 17,
      };

      const resources = getClassResourcesForLevel(mockSheet as CharacterSheet, 17);
      expect(resources['retomar_folego']?.max).toBe(1);
      expect(resources['surto_acao']?.max).toBe(2);
      expect(resources['indomavel']?.max).toBe(3);
    });
  });
});
