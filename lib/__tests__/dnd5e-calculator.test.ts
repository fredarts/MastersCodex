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
  recalculateSheetDerivedStats,
  calculateSavingThrowTotal,
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
        hitDiceUsed: '2d10', // Usados: 2. Totais: 5. Disponíveis: 3.
      };

      // Spy no Math.random para controlar o rolo do dado
      const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5); // (0.5 * 10) + 1 = 6

      const { updatedSheet, hpRecovered } = applyShortRest(mockSheet as CharacterSheet, 2);

      // Roll: 6 + 2 = 8 por dado. 2 dados = 16.
      expect(hpRecovered).toBe(16);
      expect(updatedSheet.currentHp).toBe(26);
      expect(updatedSheet.hitDiceUsed).toBe('4d10'); // 2 já usados + 2 = 4

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

  describe('Mecânicas do Clérigo', () => {
    it('deve calcular usos de recursos do Clérigo (Canalizar Divindade e Intervenção Divina)', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Clérigo',
        level: 20,
        attributes: { wis: { score: 20 } } as any
      };

      const resourcesLvl2 = getClassResourcesForLevel({ ...mockSheet, level: 2 } as CharacterSheet, 2);
      expect(resourcesLvl2['canalizar_divindade']?.max).toBe(1);

      const resourcesLvl6 = getClassResourcesForLevel({ ...mockSheet, level: 6 } as CharacterSheet, 6);
      expect(resourcesLvl6['canalizar_divindade']?.max).toBe(2);

      const resourcesLvl18 = getClassResourcesForLevel({ ...mockSheet, level: 18 } as CharacterSheet, 18);
      expect(resourcesLvl18['canalizar_divindade']?.max).toBe(3);

      const resourcesLvl10 = getClassResourcesForLevel({ ...mockSheet, level: 10 } as CharacterSheet, 10);
      expect(resourcesLvl10['intervencao_divina']?.max).toBe(1);
    });

    it('deve filtrar habilidades baseadas na subclasse no recalculateSheetDerivedStats', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Clérigo',
        subclass: 'Domínio da Vida',
        level: 2,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(mockSheet as CharacterSheet);
      const featureNames = recalculated.classFeatures?.map(f => f.name) || [];

      // Deve incluir habilidades básicas
      expect(featureNames).toContain('Conjuração (Clérigo)');
      // Deve incluir habilidades específicas do Domínio da Vida
      expect(featureNames).toContain('Proficiência Bônus (Domínio da Vida)');
      expect(featureNames).toContain('Canalizar Divindade: Preservar a Vida');
    });

    it('não deve incluir habilidades de subclasse se o jogador não possui a subclasse', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Clérigo',
        subclass: 'Domínio da Enganação', // Subclasse diferente da planilhada
        level: 2,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(mockSheet as CharacterSheet);
      const featureNames = recalculated.classFeatures?.map(f => f.name) || [];

      // Deve incluir habilidades básicas
      expect(featureNames).toContain('Canalizar Divindade: Expulsar Mortos-Vivos');
      // NÃO deve incluir habilidades específicas do Domínio da Vida
      expect(featureNames).not.toContain('Proficiência Bônus (Domínio da Vida)');
      expect(featureNames).not.toContain('Canalizar Divindade: Preservar a Vida');
    });
  });

  describe('Mecânicas do Druida', () => {
    it('deve calcular usos de Forma Selvagem nos níveis 2, 19 e 20', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Druida',
        level: 1,
        attributes: {} as any
      };

      const resLvl1 = getClassResourcesForLevel({ ...mockSheet, level: 1 } as CharacterSheet, 1);
      expect(resLvl1['forma_selvagem']).toBeUndefined();

      const resLvl2 = getClassResourcesForLevel({ ...mockSheet, level: 2 } as CharacterSheet, 2);
      expect(resLvl2['forma_selvagem']?.max).toBe(2);

      const resLvl19 = getClassResourcesForLevel({ ...mockSheet, level: 19 } as CharacterSheet, 19);
      expect(resLvl19['forma_selvagem']?.max).toBe(2);

      const resLvl20 = getClassResourcesForLevel({ ...mockSheet, level: 20 } as CharacterSheet, 20);
      expect(resLvl20['forma_selvagem']?.max).toBe(9999);
    });

    it('deve carregar Recuperação Natural apenas se for do Círculo da Terra', () => {
      const moonSheet: Partial<CharacterSheet> = {
        className: 'Druida',
        subclass: 'Círculo da Lua',
        level: 2,
        attributes: {} as any
      };
      const resMoon = getClassResourcesForLevel(moonSheet as CharacterSheet, 2);
      expect(resMoon['recuperacao_natural']).toBeUndefined();

      const landSheet: Partial<CharacterSheet> = {
        className: 'Druida',
        subclass: 'Círculo da Terra',
        level: 2,
        attributes: {} as any
      };
      const resLand = getClassResourcesForLevel(landSheet as CharacterSheet, 2);
      expect(resLand['recuperacao_natural']?.max).toBe(1);
    });

    it('deve filtrar habilidades do Druida baseado nas subclasses', () => {
      const moonSheet: Partial<CharacterSheet> = {
        className: 'Druida',
        subclass: 'Círculo da Lua',
        level: 6,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculatedMoon = recalculateSheetDerivedStats(moonSheet as CharacterSheet);
      const moonFeatures = recalculatedMoon.classFeatures?.map(f => f.name) || [];

      expect(moonFeatures).toContain('Forma Selvagem de Combate');
      expect(moonFeatures).toContain('Ataque Primitivo');
      expect(moonFeatures).not.toContain('Travessia da Terra');

      const landSheet: Partial<CharacterSheet> = {
        className: 'Druida',
        subclass: 'Círculo da Terra',
        level: 6,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculatedLand = recalculateSheetDerivedStats(landSheet as CharacterSheet);
      const landFeatures = recalculatedLand.classFeatures?.map(f => f.name) || [];

      expect(landFeatures).not.toContain('Forma Selvagem de Combate');
      expect(landFeatures).not.toContain('Ataque Primitivo');
      expect(landFeatures).toContain('Travessia da Terra');
    });
  });

  describe('Mecânicas do Monge', () => {
    it('deve calcular usos de Ki nos níveis 1, 2 e 10', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 1,
        attributes: {} as any
      };

      const resLvl1 = getClassResourcesForLevel({ ...mockSheet, level: 1 } as CharacterSheet, 1);
      expect(resLvl1['pontos_ki']).toBeUndefined();

      const resLvl2 = getClassResourcesForLevel({ ...mockSheet, level: 2 } as CharacterSheet, 2);
      expect(resLvl2['pontos_ki']?.max).toBe(2);

      const resLvl10 = getClassResourcesForLevel({ ...mockSheet, level: 10 } as CharacterSheet, 10);
      expect(resLvl10['pontos_ki']?.max).toBe(10);
    });

    it('deve carregar Integridade Corporal apenas se for do Caminho da Mão Aberta nível >= 6', () => {
      const sheetLvl5: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho da Mão Aberta',
        level: 5,
        attributes: {} as any
      };
      const resLvl5 = getClassResourcesForLevel(sheetLvl5 as CharacterSheet, 5);
      expect(resLvl5['integridade_corporal']).toBeUndefined();

      const sheetLvl6: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho da Mão Aberta',
        level: 6,
        attributes: {} as any
      };
      const resLvl6 = getClassResourcesForLevel(sheetLvl6 as CharacterSheet, 6);
      expect(resLvl6['integridade_corporal']?.max).toBe(1);

      const sheetShadowLvl6: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho das Sombras',
        level: 6,
        attributes: {} as any
      };
      const resShadowLvl6 = getClassResourcesForLevel(sheetShadowLvl6 as CharacterSheet, 6);
      expect(resShadowLvl6['integridade_corporal']).toBeUndefined();
    });

    it('deve calcular a CA do Monge com e sem escudo', () => {
      const mongeSemEscudo: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 1,
        attributes: {
          dex: { score: 14 }, // Mod +2
          wis: { score: 16 }  // Mod +3
        } as any,
        equippedArmor: 'Nenhuma',
        hasShield: false
      };
      // CA = 10 + 2 + 3 = 15
      expect(calculateArmorClass(mongeSemEscudo as CharacterSheet, 'Nenhuma', false)).toBe(15);

      const mongeComEscudo: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 1,
        attributes: {
          dex: { score: 14 }, // Mod +2
          wis: { score: 16 }  // Mod +3
        } as any,
        equippedArmor: 'Nenhuma',
        hasShield: true
      };
      // CA = 10 + 2 (Dex) + 2 (Escudo) = 14 (Desativa Defesa sem Armadura)
      expect(calculateArmorClass(mongeComEscudo as CharacterSheet, 'Nenhuma', true)).toBe(14);
    });

    it('deve filtrar habilidades do Monge baseado na subclasse', () => {
      const openHandSheet: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho da Mão Aberta',
        level: 6,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(openHandSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Defesa sem Armadura');
      expect(features).toContain('Técnica da Mão Aberta');
      expect(features).toContain('Integridade Corporal');
    });

    it('deve aplicar Alma de Diamante (nível 14+) concedendo proficiência em todas as salvaguardas', () => {
      const sheetLvl13: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 13,
        attributes: {
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 }
        } as any,
        savingThrows: { str: false, dex: true, con: false, int: false, wis: true, cha: false } as any
      };
      // Não deve interferir se nível for < 14
      expect(calculateSavingThrowTotal(sheetLvl13 as CharacterSheet, 'con')).toBe(0); // 0 mod + 0 prof = 0
      expect(calculateSavingThrowTotal(sheetLvl13 as CharacterSheet, 'dex')).toBe(5); // 0 mod + 5 prof = 5

      const sheetLvl14: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 14,
        attributes: {
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 }
        } as any,
        savingThrows: { str: false, dex: true, con: false, int: false, wis: true, cha: false } as any
      };
      // Deve forçar proficiência em con mesmo desmarcado
      expect(calculateSavingThrowTotal(sheetLvl14 as CharacterSheet, 'con')).toBe(5); // 0 mod + 5 prof = 5
      expect(calculateSavingThrowTotal(sheetLvl14 as CharacterSheet, 'str')).toBe(5); // 0 mod + 5 prof = 5
    });

    it('deve calcular velocidade dinâmica para Monge e Bárbaro', () => {
      const mongeSemBônus: Partial<CharacterSheet> = {
        className: 'Monge',
        race: 'Humano', // Humano base = 9m (30ft)
        level: 1,
        equippedArmor: 'Nenhuma',
        hasShield: false,
        attributes: { con: { score: 10 }, str: { score: 10 }, dex: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: []
      };
      const sheetLvl1 = recalculateSheetDerivedStats(mongeSemBônus as CharacterSheet);
      expect(sheetLvl1.speed).toBe('9m (30ft)');

      const mongeComBônus: Partial<CharacterSheet> = {
        className: 'Monge',
        race: 'Humano',
        level: 10, // +6m (+20ft)
        equippedArmor: 'Nenhuma',
        hasShield: false,
        savingThrows: {} as any,
        attacks: [],
        attributes: { con: { score: 10 }, str: { score: 10 }, dex: { score: 10 }, wis: { score: 10 } } as any
      };
      const sheetLvl10 = recalculateSheetDerivedStats(mongeComBônus as CharacterSheet);
      expect(sheetLvl10.speed).toBe('15m (50ft)');

      const mongeComArmadura: Partial<CharacterSheet> = {
        className: 'Monge',
        race: 'Humano',
        level: 10,
        equippedArmor: 'Couro', // Armadura bloqueia Movimento sem Armadura
        hasShield: false,
        savingThrows: {} as any,
        attacks: [],
        attributes: { con: { score: 10 }, str: { score: 10 }, dex: { score: 10 }, wis: { score: 10 } } as any
      };
      const sheetComArmadura = recalculateSheetDerivedStats(mongeComArmadura as CharacterSheet);
      expect(sheetComArmadura.speed).toBe('9m (30ft)');
    });

    it('deve escalar dano e acerto do Ataque Desarmado do Monge', () => {
      const mongeLvl1: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 1,
        attributes: {
          str: { score: 10 }, // Mod +0
          dex: { score: 16 }, // Mod +3
          con: { score: 10 },
          wis: { score: 10 }
        } as any,
        attacks: [
          { name: 'Ataque Desarmado', damage: '1d4', type: 'Concussão' }
        ] as any,
        savingThrows: {} as any,
        classResources: {}
      };
      const recalculated1 = recalculateSheetDerivedStats(mongeLvl1 as CharacterSheet);
      // Nível 1: Dano 1d4 + 3 (DEX), Acerto +5 (+3 DEX + 2 prof)
      expect(recalculated1.attacks[0].atkBonus).toBe('+5');
      expect(recalculated1.attacks[0].damage).toBe('1d4+3');

      const mongeLvl5: Partial<CharacterSheet> = {
        className: 'Monge',
        level: 5,
        attributes: {
          str: { score: 10 }, // Mod +0
          dex: { score: 18 }, // Mod +4
          con: { score: 10 },
          wis: { score: 10 }
        } as any,
        attacks: [
          { name: 'Ataque Desarmado', damage: '1d4', type: 'Concussão' }
        ] as any,
        savingThrows: {} as any,
        classResources: {}
      };
      const recalculated5 = recalculateSheetDerivedStats(mongeLvl5 as CharacterSheet);
      // Nível 5: Dano escalado para 1d6 + 4 (DEX), Acerto +7 (+4 DEX + 3 prof)
      expect(recalculated5.attacks[0].atkBonus).toBe('+7');
      expect(recalculated5.attacks[0].damage).toBe('1d6+4');
    });

    it('deve carregar habilidades corretas para o Caminho das Sombras', () => {
      const shadowSheet: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho das Sombras',
        level: 6,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(shadowSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Artes das Sombras');
      expect(features).toContain('Passo das Sombras');
      expect(features).not.toContain('Técnica da Mão Aberta');
      expect(features).not.toContain('Disciplinas Elementais (6º Nível)');
    });

    it('deve carregar habilidades corretas para o Caminho dos Quatro Elementos', () => {
      const elementsSheet: Partial<CharacterSheet> = {
        className: 'Monge',
        subclass: 'Caminho dos Quatro Elementos',
        level: 11,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(elementsSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Discípulo dos Elementos');
      expect(features).toContain('Disciplinas Elementais (6º Nível)');
      expect(features).toContain('Disciplinas Elementais (11º Nível)');
      expect(features).not.toContain('Artes das Sombras');
      expect(features).not.toContain('Tranquilidade');
    });
  });

  describe('Patrulheiro (Ranger) Automation & Subclasses', () => {
    it('deve carregar habilidades básicas do Patrulheiro de nível 1', () => {
      const rangerSheet: Partial<CharacterSheet> = {
        className: 'Patrulheiro',
        subclass: '',
        level: 1,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(rangerSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Inimigo Favorito');
      expect(features).toContain('Explorador Natural');
      expect(features).not.toContain('Estilo de Luta');
    });

    it('deve carregar Estilo de Luta e Conjuração no nível 2 e calcular slots de magia corretos', () => {
      const rangerSheet: Partial<CharacterSheet> = {
        className: 'Patrulheiro',
        subclass: '',
        level: 2,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        spellSlots: {
          1: { total: 0, used: 0 },
          2: { total: 0, used: 0 },
          3: { total: 0, used: 0 },
          4: { total: 0, used: 0 },
          5: { total: 0, used: 0 },
          6: { total: 0, used: 0 },
          7: { total: 0, used: 0 },
          8: { total: 0, used: 0 },
          9: { total: 0, used: 0 }
        } as any,
        currentHp: 10,
        maxHp: 10
      };

      // Simula subida de nível para calcular os slots de magia
      const leveled = applyLevelChange(rangerSheet as CharacterSheet, 2);
      const recalculated = recalculateSheetDerivedStats(leveled);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Estilo de Luta');
      expect(features).toContain('Conjuração (Patrulheiro)');
      expect(recalculated.spellSlots[1].total).toBe(2);
    });

    it('deve carregar Presa do Caçador para subclasse Caçador e filtrar Mestre das Feras', () => {
      const hunterSheet: Partial<CharacterSheet> = {
        className: 'Patrulheiro',
        subclass: 'Caçador',
        level: 3,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(hunterSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Presa do Caçador');
      expect(features).toContain('Prontidão Primal');
      expect(features).not.toContain('Companheiro do Patrulheiro');
    });

    it('deve carregar Companheiro do Patrulheiro para Mestre das Feras e filtrar Caçador', () => {
      const beastSheet: Partial<CharacterSheet> = {
        className: 'Patrulheiro',
        subclass: 'Mestre das Feras',
        level: 3,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(beastSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Companheiro do Patrulheiro');
      expect(features).toContain('Prontidão Primal');
      expect(features).not.toContain('Presa do Caçador');
    });

    it('deve carregar habilidades avançadas corretas do Caçador no nível 15', () => {
      const hunterSheet: Partial<CharacterSheet> = {
        className: 'Patrulheiro',
        subclass: 'Caçador',
        level: 15,
        attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, wis: { score: 10 } } as any,
        savingThrows: {} as any,
        attacks: [],
        classResources: {},
        currentHp: 10,
        maxHp: 10
      };

      const recalculated = recalculateSheetDerivedStats(hunterSheet as CharacterSheet);
      const features = recalculated.classFeatures?.map(f => f.name) || [];

      expect(features).toContain('Presa do Caçador');
      expect(features).toContain('Táticas Defensivas');
      expect(features).toContain('Ataque Múltiplo');
      expect(features).toContain('Defesa de Caçador Superior');
      expect(features).not.toContain('Conjurar Compartilhado');
      expect(features).not.toContain('Fúria Bestial');
    });
  });
});

