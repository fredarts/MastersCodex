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
  calculateTotalInitiativeBonus,
  calculateWeaponAttack,
  calculateTotalWeight,
  isHeavilyEncumbered,
  calculateDynamicSpeed,
  getAttributeModifier,
  getEffectiveAttributeScore,
  findArmorInfo,
} from '../dnd5e-calculator';
import { CharacterSheet } from '../types';
import { SRD_EQUIPMENT } from '../srd-compendium';


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

  // ─────────────────────────────────────────────────────────────
  // LADINO (ROGUE) SPECIFIC TESTS
  // ─────────────────────────────────────────────────────────────

  describe('Ladino - getClassResourcesForLevel', () => {
    it('deve retornar recurso de Ataque Furtivo com os dados corretos para nível 1', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 1,
        attributes: { dex: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 1);
      expect(res.ataque_furtivo).toBeDefined();
      expect(res.ataque_furtivo.label).toBe('Ataque Furtivo (1d6)');
      expect(res.ataque_furtivo.max).toBe(1);
    });

    it('deve escalar o Ataque Furtivo para 5d6 no nível 9', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 9,
        attributes: { dex: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 9);
      expect(res.ataque_furtivo.label).toBe('Ataque Furtivo (5d6)');
    });

    it('deve escalar o Ataque Furtivo para 10d6 no nível 19-20', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 19,
        attributes: { dex: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 19);
      expect(res.ataque_furtivo.label).toBe('Ataque Furtivo (10d6)');
    });

    it('não deve ter Golpe de Sorte antes do nível 20', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 19,
        attributes: { dex: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 19);
      expect(res.golpe_de_sorte).toBeUndefined();
    });

    it('deve ter Golpe de Sorte no nível 20', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 20,
        attributes: { dex: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 20);
      expect(res.golpe_de_sorte).toBeDefined();
      expect(res.golpe_de_sorte.max).toBe(1);
    });
  });

  describe('Ladino - Mente Escorregadia (Slippery Mind)', () => {
    it('deve conceder proficiência em Sabedoria no nível 15+', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 15,
        attributes: { wis: { score: 12 } } as any,
        savingThrows: { str: false, dex: true, con: false, int: true, wis: false, cha: false },
      };
      const total = calculateSavingThrowTotal(mockSheet as CharacterSheet, 'wis');
      const profBonus = calculateProficiencyBonus(15); // +5
      const wisMod = 1; // (12 - 10) / 2
      expect(total).toBe(wisMod + profBonus);
    });

    it('não deve conceder proficiência em Sabedoria antes do nível 15', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 14,
        attributes: { wis: { score: 12 } } as any,
        savingThrows: { str: false, dex: true, con: false, int: true, wis: false, cha: false },
      };
      const total = calculateSavingThrowTotal(mockSheet as CharacterSheet, 'wis');
      const wisMod = 1;
      expect(total).toBe(wisMod); // Sem proficiência
    });

    it('não deve afetar outros testes de resistência', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Ladino',
        level: 15,
        attributes: { str: { score: 10 } } as any,
        savingThrows: { str: false, dex: true, con: false, int: true, wis: false, cha: false },
      };
      const total = calculateSavingThrowTotal(mockSheet as CharacterSheet, 'str');
      expect(total).toBe(0); // Sem proficiência em STR
    });
  });

  describe('Feiticeiro - Recursos e Características', () => {
    it('deve ter 0 Pontos de Feitiçaria no nível 1', () => {
      const mockSheet: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 1,
        attributes: { cha: { score: 14 } } as any,
      };
      const res = getClassResourcesForLevel(mockSheet as CharacterSheet, 1);
      expect(res.pontos_feiticaria).toBeUndefined();
    });

    it('deve ter Pontos de Feitiçaria escalando com o nível a partir do nível 2', () => {
      const mockSheetLvl2: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 2,
        attributes: { cha: { score: 14 } } as any,
      };
      const resLvl2 = getClassResourcesForLevel(mockSheetLvl2 as CharacterSheet, 2);
      expect(resLvl2.pontos_feiticaria).toBeDefined();
      expect(resLvl2.pontos_feiticaria.max).toBe(2);

      const mockSheetLvl10: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 10,
        attributes: { cha: { score: 14 } } as any,
      };
      const resLvl10 = getClassResourcesForLevel(mockSheetLvl10 as CharacterSheet, 10);
      expect(resLvl10.pontos_feiticaria.max).toBe(10);
    });

    it('deve ter Marés do Caos apenas para a subclasse Magia Selvagem', () => {
      const wildMagicSheet: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 1,
        subclass: 'Magia Selvagem',
        attributes: { cha: { score: 14 } } as any,
      };
      const resWild = getClassResourcesForLevel(wildMagicSheet as CharacterSheet, 1);
      expect(resWild.mares_do_caos).toBeDefined();
      expect(resWild.mares_do_caos.max).toBe(1);

      const draconicSheet: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 1,
        subclass: 'Linhagem Dracônica',
        attributes: { cha: { score: 14 } } as any,
      };
      const resDraconic = getClassResourcesForLevel(draconicSheet as CharacterSheet, 1);
      expect(resDraconic.mares_do_caos).toBeUndefined();
    });

    it('deve calcular CA de Resiliência Dracônica (13 + DES) para Linhagem Dracônica sem armadura', () => {
      const draconicSheet: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 3,
        subclass: 'Linhagem Dracônica',
        attributes: { dex: { score: 14 } } as any, // Mod +2
      };
      const ac = calculateArmorClass(draconicSheet as CharacterSheet, 'Nenhuma', false);
      expect(ac).toBe(15); // 13 + 2 = 15
    });

    it('deve somar escudo na CA de Resiliência Dracônica', () => {
      const draconicSheet: Partial<CharacterSheet> = {
        className: 'Feiticeiro',
        level: 3,
        subclass: 'Linhagem Dracônica',
        attributes: { dex: { score: 14 } } as any, // Mod +2
      };
      const ac = calculateArmorClass(draconicSheet as CharacterSheet, 'Nenhuma', true);
      expect(ac).toBe(17); // 13 + 2 + 2 = 17
    });

    it('deve conceder bônus de HP (+1 por nível de Feiticeiro) para Linhagem Dracônica', () => {
      const draconicSheet: CharacterSheet = {
        id: 'test-sorc',
        characterName: 'Feiticeiro Teste',
        className: 'Feiticeiro',
        level: 5,
        subclass: 'Linhagem Dracônica',
        attributes: {
          con: { score: 14, baseScore: 14 }, // Mod +2
          str: { score: 10, baseScore: 10 },
          dex: { score: 10, baseScore: 10 },
          int: { score: 10, baseScore: 10 },
          wis: { score: 10, baseScore: 10 },
          cha: { score: 10, baseScore: 10 },
        } as any,
        maxHp: 10,
        currentHp: 10,
        attacks: [],
        feats: [],
        spellSlots: {},
        classResources: {},
        skills: {} as any,
      } as any;
      
      const recalculated = recalculateSheetDerivedStats(draconicSheet);
      // HitDie = 1d6. Lvl 5.
      // Base HP = 6 + 2 (con) + 4 * (3 + 1 + 2) = 8 + 24 = 32.
      // Draconic Bonus = +5 (1 * level)
      // Total = 37
      expect(recalculated.maxHp).toBe(37);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // BRUXO (WARLOCK) SPECIFIC TESTS
  // ─────────────────────────────────────────────────────────────

  describe('Bruxo (Warlock) - Mechanics and Calculations', () => {
    it('deve carregar recursos corretos por nivel do Bruxo', () => {
      const mockSheet1: Partial<CharacterSheet> = {
        className: 'Bruxo',
        level: 1,
        attributes: { cha: { score: 16 } } as any,
      };
      const res1 = getClassResourcesForLevel(mockSheet1 as CharacterSheet, 1);
      expect(res1.pact_slots).toBeDefined();
      expect(res1.pact_slots.max).toBe(1);
      expect(res1.pact_slot_level.current).toBe(1);

      const mockSheet5: Partial<CharacterSheet> = {
        className: 'Bruxo',
        level: 5,
        attributes: { cha: { score: 16 } } as any,
      };
      const res5 = getClassResourcesForLevel(mockSheet5 as CharacterSheet, 5);
      expect(res5.pact_slots.max).toBe(2);
      expect(res5.pact_slot_level.current).toBe(3);
      expect(res5.invocacoes_misticas.max).toBe(3);

      const mockSheet17: Partial<CharacterSheet> = {
        className: 'Bruxo',
        level: 17,
        attributes: { cha: { score: 16 } } as any,
      };
      const res17 = getClassResourcesForLevel(mockSheet17 as CharacterSheet, 17);
      expect(res17.pact_slots.max).toBe(4);
      expect(res17.pact_slot_level.current).toBe(5);
      expect(res17.invocacoes_misticas.max).toBe(7);
      expect(res17.arcanum_6).toBeDefined();
      expect(res17.arcanum_9).toBeDefined();
    });

    it('deve carregar recursos especificos da subclasse O Corruptor para Bruxo', () => {
      const corruptorSheet: Partial<CharacterSheet> = {
        className: 'Bruxo',
        subclass: 'O Corruptor',
        level: 14,
        attributes: { cha: { score: 16 } } as any,
      };
      const res = getClassResourcesForLevel(corruptorSheet as CharacterSheet, 14);
      expect(res.fortuna_submundo).toBeDefined();
      expect(res.lancar_inferno).toBeDefined();
    });

    it('deve zerar slots de magia normais (1-9) para Bruxo puro', () => {
      const mockWarlock: CharacterSheet = {
        id: 'test-warlock',
        characterName: 'Bruxo Puro',
        className: 'Bruxo',
        level: 5,
        attributes: {
          str: { score: 10 }, dex: { score: 10 }, con: { score: 10 },
          int: { score: 10 }, wis: { score: 10 }, cha: { score: 16 }
        } as any,
        savingThrows: {} as any,
        attacks: [],
        feats: [],
        spellSlots: {
          1: { total: 4, used: 2 },
          2: { total: 3, used: 1 }
        },
        classResources: {},
        skills: {} as any,
        maxHp: 10,
        currentHp: 10,
      } as any;

      const recalculated = recalculateSheetDerivedStats(mockWarlock);
      // Todos os slots padrão de conjurador devem estar zerados
      for (let l = 1; l <= 9; l++) {
        expect(recalculated.spellSlots[l]?.total).toBe(0);
      }
      // Mas deve possuir os pact slots gerados
      expect(recalculated.classResources.pact_slots).toBeDefined();
      expect(recalculated.classResources.pact_slots.max).toBe(2);
    });

    it('deve manter slots normais de multiclasse separados de pact slots para Bruxo/Mago', () => {
      const multiclassSheet: CharacterSheet = {
        id: 'multiclass-warlock-wizard',
        characterName: 'Bruxo 3 / Mago 5',
        className: 'Mago', // Classe ativa na ficha principal
        level: 8,
        classes: [
          { name: 'Mago', level: 5, isPrimary: true },
          { name: 'Bruxo', level: 3, isPrimary: false }
        ],
        attributes: {
          str: { score: 10 }, dex: { score: 10 }, con: { score: 10 },
          int: { score: 16 }, wis: { score: 10 }, cha: { score: 14 }
        } as any,
        savingThrows: {} as any,
        attacks: [],
        feats: [],
        spellSlots: {},
        classResources: {},
        skills: {} as any,
        maxHp: 10,
        currentHp: 10,
      } as any;

      const recalculated = recalculateSheetDerivedStats(multiclassSheet);
      // Slots de Mago Nv 5: 4 de 1º, 3 de 2º, 2 de 3º
      expect(recalculated.spellSlots[1]?.total).toBe(4);
      expect(recalculated.spellSlots[2]?.total).toBe(3);
      expect(recalculated.spellSlots[3]?.total).toBe(2);
      expect(recalculated.spellSlots[4]?.total).toBe(0); // Mago 5 não tem 4º círculo

      // Pact slots do Bruxo Nv 3: 2 slots de 2º círculo
      expect(recalculated.classResources.pact_slots).toBeDefined();
      expect(recalculated.classResources.pact_slots.max).toBe(2);
      expect(recalculated.classResources.pact_slot_level.current).toBe(2);
    });

    it('deve restaurar pact slots do Bruxo ao realizar descanso curto', () => {
      const mockWarlock: CharacterSheet = {
        className: 'Bruxo',
        level: 5,
        hitDiceUsed: '0d8',
        attributes: { con: { score: 14 } } as any,
        currentHp: 5,
        maxHp: 20,
        classResources: {
          pact_slots: { name: 'pact_slots', label: 'Slots do Pacto', current: 0, max: 2 }
        }
      } as any;

      const { updatedSheet } = applyShortRest(mockWarlock, 1);
      expect(updatedSheet.classResources.pact_slots.current).toBe(2);
    });
  });

  describe('Novas Correções de Classes (Auditoria)', () => {
    it('deve somar o bônus de Faz-Tudo na Iniciativa do Bardo nível >= 2', () => {
      const mockBard: CharacterSheet = {
        className: 'Bardo',
        level: 2, // Prof = +2, Faz-Tudo = +1
        initiativeBonus: 0,
        attributes: {
          dex: { score: 14 }, // Mod = +2
        } as any,
        feats: [],
        skills: {} as any,
      } as any;

      // Iniciativa = Dex Mod (+2) + Faz-Tudo (+1) = 3
      expect(calculateTotalInitiativeBonus(mockBard)).toBe(3);
    });

    it('deve adicionar o bônus de Aura de Proteção de Paladin level >= 6 a todas as salvaguardas', () => {
      const paladinSheet: CharacterSheet = {
        className: 'Paladino',
        level: 6,
        attributes: {
          con: { score: 10 }, // Mod = +0
          cha: { score: 16 }, // Mod = +3 (Aura = +3)
        } as any,
        savingThrows: { con: false } as any,
        feats: [],
      } as any;

      // Salvaguarda CON = Con Mod (0) + Aura (+3) = +3
      expect(calculateSavingThrowTotal(paladinSheet, 'con')).toBe(3);

      // Com Proficiência: Con Mod (0) + Prof Lvl 6 (+3) + Aura (+3) = +6
      const proficientPaladin = {
        ...paladinSheet,
        savingThrows: { con: true } as any,
      };
      expect(calculateSavingThrowTotal(proficientPaladin, 'con')).toBe(6);
    });

    it('deve conceder pontos de atributos extras (ASI) para Guerreiro nos níveis 6 e 14', () => {
      const gSheet: CharacterSheet = {
        className: 'Guerreiro',
        level: 5,
        attributePointsAvailable: 0,
        attributesLocked: true,
        attributes: {
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
        spellSlots: {},
        classResources: {},
        classFeatures: [],
      } as any;

      // Level 5 para 6: Guerreiro ganha ASI (+2 pontos)
      const lvl6 = applyLevelChange(gSheet, 6);
      expect(lvl6.attributePointsAvailable).toBe(2);
      expect(lvl6.attributesLocked).toBe(false);

      // Level 13 para 14: Guerreiro ganha ASI (+2 pontos)
      const gSheet13: CharacterSheet = {
        ...gSheet,
        level: 13,
      };
      const lvl14 = applyLevelChange(gSheet13, 14);
      expect(lvl14.attributePointsAvailable).toBe(2);
    });

    it('deve conceder pontos de atributos extras (ASI) para Ladino no nível 10', () => {
      const lSheet: CharacterSheet = {
        className: 'Ladino',
        level: 9,
        attributePointsAvailable: 0,
        attributesLocked: true,
        attributes: {
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
        spellSlots: {},
        classResources: {},
        classFeatures: [],
      } as any;

      // Level 9 para 10: Ladino ganha ASI (+2 pontos)
      const lvl10 = applyLevelChange(lSheet, 10);
      expect(lvl10.attributePointsAvailable).toBe(2);
      expect(lvl10.attributesLocked).toBe(false);
    });

    it('deve registrar Recuperação Arcana para Mago', () => {
      const wizardSheet: CharacterSheet = {
        className: 'Mago',
        level: 1,
        attributes: {
          str: { score: 10 },
          dex: { score: 10 },
          con: { score: 10 },
          int: { score: 10 },
          wis: { score: 10 },
          cha: { score: 10 },
        } as any,
      } as any;

      const res = getClassResourcesForLevel(wizardSheet, 1);
      expect(res.recuperacao_arcana).toBeDefined();
      expect(res.recuperacao_arcana.max).toBe(1);
    });

    it('deve registrar e escalar Dados de Superioridade para Mestre de Batalha', () => {
      const bmSheet3: CharacterSheet = {
        className: 'Guerreiro',
        subclass: 'Mestre de Batalha',
        level: 3,
        attributes: {} as any,
      } as any;

      const res3 = getClassResourcesForLevel(bmSheet3, 3);
      expect(res3.dados_superioridade).toBeDefined();
      expect(res3.dados_superioridade.max).toBe(4);
      expect(res3.dados_superioridade.label).toBe('Dados de Superioridade (d8)');

      const bmSheet10: CharacterSheet = {
        ...bmSheet3,
        level: 10,
      };
      const res10 = getClassResourcesForLevel(bmSheet10, 10);
      expect(res10.dados_superioridade.max).toBe(5);
      expect(res10.dados_superioridade.label).toBe('Dados de Superioridade (d10)');
    });

    it('deve registrar Poder do Gigante e Escudo Rúnico para Guerreiro Rúnico', () => {
      const rSheet7: CharacterSheet = {
        className: 'Guerreiro',
        subclass: 'Guerreiro Rúnico',
        level: 7, // Prof = +3
        attributes: {} as any,
      } as any;

      const res = getClassResourcesForLevel(rSheet7, 7);
      expect(res.poder_gigante).toBeDefined();
      expect(res.poder_gigante.max).toBe(3); // Igual a prof
      expect(res.escudo_runico).toBeDefined();
      expect(res.escudo_runico.max).toBe(3);
    });

    it('deve calcular slots de magia e cantrips conhecidas corretamente para Artífice puro e multiclasse', () => {
      const artificerSheet3: CharacterSheet = {
        id: 'artificer-3',
        characterName: 'Artífice 3',
        className: 'Artífice',
        level: 3,
        classes: [
          { name: 'Artífice', level: 3, isPrimary: true }
        ],
        attributes: {
          str: { score: 10 }, dex: { score: 10 }, con: { score: 10 },
          int: { score: 16 }, wis: { score: 10 }, cha: { score: 10 }
        } as any,
        savingThrows: {} as any,
        attacks: [],
        feats: [],
        spellSlots: {},
        classResources: {},
        skills: {} as any,
        maxHp: 10,
        currentHp: 10,
      } as any;

      const recalculated3 = recalculateSheetDerivedStats(artificerSheet3);
      // Artífice 3 puro tem slots de um conjurador nível ceil(3/2) = 2.
      // Full caster Lvl 2: 3 slots de 1º círculo.
      expect(recalculated3.spellSlots[1]?.total).toBe(3);
      expect(recalculated3.spellSlots[2]?.total).toBe(0);

      // Multiclasse Artífice 3 / Mago 2.
      // Caster Level = ceil(3/2) + 2 = 2 + 2 = 4.
      // Full caster Lvl 4: 4 slots de 1º círculo, 3 slots de 2º círculo.
      const multiclassSheet: CharacterSheet = {
        ...artificerSheet3,
        level: 5,
        classes: [
          { name: 'Artífice', level: 3, isPrimary: true },
          { name: 'Mago', level: 2, isPrimary: false }
        ],
      };

      const recalculatedMulti = recalculateSheetDerivedStats(multiclassSheet);
      expect(recalculatedMulti.spellSlots[1]?.total).toBe(4);
      expect(recalculatedMulti.spellSlots[2]?.total).toBe(3);
    });

    it('deve adicionar cura bônus da Canção de Descanso no descanso curto do Bardo', () => {
      const bardoSheet: CharacterSheet = {
        className: 'Bardo',
        level: 2,
        maxHp: 20,
        currentHp: 5,
        hitDiceUsed: '0d8',
        attributes: {
          str: { score: 10 }, dex: { score: 10 }, con: { score: 10 },
          int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 }
        } as any,
        classResources: {},
        spellSlots: {},
        feats: [],
        skills: {} as any,
      } as any;

      const { updatedSheet, hpRecovered } = applyShortRest(bardoSheet, 1);
      expect(hpRecovered).toBeGreaterThanOrEqual(2);
      expect(updatedSheet.currentHp).toBeGreaterThan(5);
    });

    it('deve aplicar bônus de Estilo de Luta: Arquearia nas jogadas de ataque com armas à distância', () => {
      const charSheet: CharacterSheet = {
        className: 'Guerreiro',
        level: 2,
        otherFeatures: 'Estilo de Luta: Arquearia',
        attributes: {
          str: { score: 10 }, dex: { score: 16 }, con: { score: 10 },
          int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 }
        } as any,
      } as any;

      const attackInfo = calculateWeaponAttack(charSheet, 'Arco Longo');
      expect(attackInfo.atkBonus).toBe('+7');
    });

    it('deve aplicar bônus de Estilo de Luta: Duelismo nas jogadas de dano com armas de uma mão', () => {
      const charSheet: CharacterSheet = {
        className: 'Guerreiro',
        level: 2,
        featuresAndTraits: 'Estilo de Luta: Duelismo',
        attributes: {
          str: { score: 16 }, dex: { score: 10 }, con: { score: 10 },
          int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 }
        } as any,
      } as any;

      const attackInfo = calculateWeaponAttack(charSheet, 'Espada Longa');
      expect(attackInfo.damage).toBe('1d8 +5');
    });
  });
});


describe('D&D 5e Weight and Encumbrance', () => {

  const makeSheet = (overrides: any = {}) => ({
    race: 'Humano',
    level: 5,
    className: 'Guerreiro',
    attributes: {
      str: { score: 10 }, dex: { score: 10 }, con: { score: 10 },
      int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 },
    },
    equipment: [],
    equippedArmor: 'Nenhuma',
    hasShield: false,
    feats: [],
    speed: '9m (30ft)',
    ...overrides,
  });

  it('deve retornar 0 se não houver equipamentos', () => {
    expect(calculateTotalWeight(makeSheet())).toBe(0);
  });

  it('deve somar o peso de equipamentos com quantidade', () => {
    const sheet = makeSheet({
      equipment: [
        { id: '1', name: 'Espada', quantity: 1, weight: '3' },
        { id: '2', name: 'Ração', quantity: 5, weight: '1' },
      ],
    });
    expect(calculateTotalWeight(sheet)).toBe(8);
  });

  it('isHeavilyEncumbered deve retornar true quando peso > FOR * 10', () => {
    const sheet = makeSheet({
      attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 } },
      equipment: [
        { id: '1', name: 'Pilha de Ouro', quantity: 1, weight: '101' },
      ],
    });
    expect(isHeavilyEncumbered(sheet)).toBe(true);
  });

  it('isHeavilyEncumbered deve retornar false quando peso <= FOR * 10', () => {
    const sheet = makeSheet({
      attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 } },
      equipment: [
        { id: '1', name: 'Kit Leve', quantity: 1, weight: '50' },
      ],
    });
    expect(isHeavilyEncumbered(sheet)).toBe(false);
  });

  it('velocidade deve cair para 0 se peso > FOR * 15', () => {
    const sheet = makeSheet({
      attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 } },
      equipment: [
        { id: '1', name: 'Bloco de Ferro', quantity: 1, weight: '200' },
      ],
    });
    expect(calculateDynamicSpeed(sheet)).toBe('0m (0ft)');
  });

  it('velocidade deve reduzir 20ft se peso > FOR * 10 (Carga Pesada)', () => {
    const sheet = makeSheet({
      attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 } },
      equipment: [
        { id: '1', name: 'Carga Pesada', quantity: 1, weight: '101' },
      ],
    });
    expect(calculateDynamicSpeed(sheet)).toBe('3m (10ft)');
  });

  it('velocidade deve reduzir 10ft se peso > FOR * 5 (Sobrecarga)', () => {
    const sheet = makeSheet({
      attributes: { str: { score: 10 }, dex: { score: 10 }, con: { score: 10 }, int: { score: 10 }, wis: { score: 10 }, cha: { score: 10 } },
      equipment: [
        { id: '1', name: 'Carga Moderada', quantity: 1, weight: '51' },
      ],
    });
    expect(calculateDynamicSpeed(sheet)).toBe('6m (20ft)');
  });
});

describe('Mecânicas do Bárbaro Lvl 20 (Campeão Primitivo)', () => {
  const makeBarbarianSheet = (level: number, strScore: number, conScore: number) => ({
    race: 'Humano',
    level,
    className: 'Bárbaro',
    attributes: {
      str: { score: strScore, baseScore: strScore },
      dex: { score: 10, baseScore: 10 },
      con: { score: conScore, baseScore: conScore },
      int: { score: 10, baseScore: 10 },
      wis: { score: 10, baseScore: 10 },
      cha: { score: 10, baseScore: 10 },
    },
    equipment: [],
    equippedArmor: 'Nenhuma',
    hasShield: false,
    feats: [],
    attacks: [],
    speed: '9m (30ft)',
  });

  it('deve aplicar bônus de +4 em Força e Constituição e limitar a 24 para Bárbaro Lvl 20', () => {
    const sheet = makeBarbarianSheet(20, 18, 16) as any;
    
    // Testa getEffectiveAttributeScore
    expect(getEffectiveAttributeScore(sheet, 'str')).toBe(22); // 18 + 4
    expect(getEffectiveAttributeScore(sheet, 'con')).toBe(20); // 16 + 4
    
    // Testa modificadores
    expect(getAttributeModifier(sheet, 'str')).toBe(6);  // Modificador de 22 é +6
    expect(getAttributeModifier(sheet, 'con')).toBe(5);  // Modificador de 20 é +5
    
    // Testa cap em 24
    const strongSheet = makeBarbarianSheet(20, 22, 21) as any;
    expect(getEffectiveAttributeScore(strongSheet, 'str')).toBe(24); // 22 + 4 = 26 -> cap em 24
    expect(getEffectiveAttributeScore(strongSheet, 'con')).toBe(24); // 21 + 4 = 25 -> cap em 24
  });

  it('não deve aplicar o bônus de Campeão Primitivo se o nível de Bárbaro for menor que 20', () => {
    const sheet = makeBarbarianSheet(19, 18, 16) as any;
    expect(getEffectiveAttributeScore(sheet, 'str')).toBe(18);
    expect(getEffectiveAttributeScore(sheet, 'con')).toBe(16);
  });
});

describe('Teste de Armadura de Couro Batido', () => {
  it('deve calcular corretamente a classe de armadura para Armadura de Couro Batido', () => {
    const mockSheet: any = {
      characterName: 'Teste',
      className: 'Ladino',
      level: 1,
      attributes: {
        str: { score: 10 },
        dex: { score: 14 }, // Mod +2
        con: { score: 10 },
        int: { score: 10 },
        wis: { score: 10 },
        cha: { score: 10 }
      },
      equipment: [
        {
          id: 'armor1',
          name: 'Armadura de Couro Batido',
          equipped: true,
          itemType: 'armor',
          quantity: 1
        }
      ],
      savingThrows: {},
      attacks: [],
      classResources: {}
    };

    const res = recalculateSheetDerivedStats(mockSheet);
    expect(res.equippedArmor).toBe('Armadura de Couro Batido');
    expect(res.armorClass).toBe(14); // 12 + 2 = 14
  });

  it('deve encontrar correspondência para todas as armaduras do compêndio SRD', () => {
    const sdrArmors = SRD_EQUIPMENT.filter(item => item.category === 'Armadura' && item.name !== 'Escudo');
    sdrArmors.forEach(armor => {
      const matched = findArmorInfo(armor.name);
      expect(matched.category).not.toBe('none');
      expect(matched.name).not.toBe('Nenhuma');
    });
  });
});


