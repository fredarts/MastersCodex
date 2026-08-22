import { describe, it, expect } from 'vitest';
import { extractDdbCharacterId } from '@/app/api/importer/dndbeyond/route';
import {
  parseDdbCharacter,
  calculateDdbAttributes,
  calculateDdbSkills,
  calculateDdbSavingThrows,
} from '@/lib/importers/dndBeyondParser';
import { DdbCharacterData } from '@/lib/importers/dndBeyondTypes';

describe('D&D Beyond Character Importer', () => {
  describe('URL and ID Extraction', () => {
    it('should extract numeric ID from pure ID string', () => {
      expect(extractDdbCharacterId('12345678')).toBe('12345678');
      expect(extractDdbCharacterId(' 987654 ')).toBe('987654');
    });

    it('should extract numeric ID from full D&D Beyond URL', () => {
      expect(extractDdbCharacterId('https://www.dndbeyond.com/characters/12345678')).toBe('12345678');
      expect(extractDdbCharacterId('https://www.dndbeyond.com/profile/User/characters/87654321/builder')).toBe('87654321');
      expect(extractDdbCharacterId('https://ddb.ac/characters/55443322')).toBe('55443322');
    });

    it('should return null for invalid inputs', () => {
      expect(extractDdbCharacterId('')).toBeNull();
      expect(extractDdbCharacterId('https://google.com')).toBeNull();
      expect(extractDdbCharacterId('invalid-string')).toBeNull();
    });
  });

  describe('Attribute & Modifier Calculations', () => {
    it('should calculate base attributes with racial and feat modifiers', () => {
      const mockDdbData: Partial<DdbCharacterData> = {
        stats: [
          { id: 1, value: 15 }, // STR
          { id: 2, value: 14 }, // DEX
          { id: 3, value: 13 }, // CON
          { id: 4, value: 12 }, // INT
          { id: 5, value: 10 }, // WIS
          { id: 6, value: 8 },  // CHA
        ],
        modifiers: {
          race: [
            { id: '1', type: 'bonus', subType: 'strength-score', value: 2 },
            { id: '2', type: 'bonus', subType: 'constitution-score', value: 1 },
          ],
        },
      };

      const attributes = calculateDdbAttributes(mockDdbData as DdbCharacterData);
      expect(attributes.str.score).toBe(17); // 15 + 2
      expect(attributes.dex.score).toBe(14);
      expect(attributes.con.score).toBe(14); // 13 + 1
      expect(attributes.int.score).toBe(12);
      expect(attributes.wis.score).toBe(10);
      expect(attributes.cha.score).toBe(8);
    });

    it('should respect override stats (e.g. Belt of Giant Strength)', () => {
      const mockDdbData: Partial<DdbCharacterData> = {
        stats: [{ id: 1, value: 10 }],
        overrideStats: [{ id: 1, value: 21 }],
      };

      const attributes = calculateDdbAttributes(mockDdbData as DdbCharacterData);
      expect(attributes.str.score).toBe(21);
    });
  });

  describe('Skill Proficiencies', () => {
    it('should correctly assign proficient and expertise in Portuguese keys', () => {
      const mockDdbData: Partial<DdbCharacterData> = {
        modifiers: {
          class: [
            { id: '1', type: 'proficiency', subType: 'stealth' },
            { id: '2', type: 'expertise', subType: 'perception' },
            { id: '3', type: 'proficiency', subType: 'acrobatics' },
          ],
        },
      };

      const skills = calculateDdbSkills(mockDdbData as DdbCharacterData);
      expect(skills.furtividade).toBe('proficient');
      expect(skills.percepcao).toBe('expertise');
      expect(skills.acrobacia).toBe('proficient');
      expect(skills.atletismo).toBe('none');
    });
  });

  describe('Full CharacterSheet Parser', () => {
    it('should parse a Barbarian character with inventory, attacks, and HP correctly', () => {
      const mockDdbCharacter: Partial<DdbCharacterData> = {
        id: 998877,
        name: 'Grommash o Destruidor',
        alignmentId: 3, // Caótico e Bom
        baseHitPoints: 12,
        stats: [
          { id: 1, value: 16 },
          { id: 2, value: 14 },
          { id: 3, value: 16 },
          { id: 4, value: 8 },
          { id: 5, value: 12 },
          { id: 6, value: 10 },
        ],
        classes: [
          {
            id: 1,
            level: 3,
            isStartingClass: true,
            definition: { name: 'Bárbaro', hitDice: 12 },
            subclassDefinition: { name: 'Caminho do Furioso' },
          },
        ],
        race: {
          fullName: 'Meio-Orc',
          weightSpeeds: { normal: { walk: 30 } },
        },
        background: {
          definition: { name: 'Forasteiro' },
        },
        inventory: [
          {
            id: 101,
            quantity: 1,
            equipped: true,
            definition: {
              name: 'Machado Grande',
              filterType: 'Weapon',
              damage: { diceString: '1d12' },
              damageType: 'Cortante',
              weight: 7,
            },
          },
        ],
        currencies: {
          cp: 10,
          sp: 25,
          ep: 0,
          gp: 50,
          pp: 2,
        },
      };

      const sheet = parseDdbCharacter(mockDdbCharacter as DdbCharacterData);

      expect(sheet.characterName).toBe('Grommash o Destruidor');
      expect(sheet.className).toBe('Bárbaro');
      expect(sheet.subclass).toBe('Caminho do Furioso');
      expect(sheet.level).toBe(3);
      expect(sheet.race).toBe('Meio-Orc');
      expect(sheet.alignment).toBe('Caótico e Bom');
      expect(sheet.currency?.po).toBe(50);
      expect(sheet.currency?.pl).toBe(2);

      // HP: 12 base + (CON mod (3) * 3 level) = 21
      expect(sheet.maxHp).toBe(21);
      expect(sheet.currentHp).toBe(21);

      // Attacks
      expect(sheet.attacks).toHaveLength(1);
      expect(sheet.attacks[0].name).toBe('Machado Grande');
      expect(sheet.attacks[0].damage).toBe('1d12');
      expect(sheet.attacks[0].atkBonus).toBe('+5'); // Prof(+2) + STR(+3)

      // Saving Throws for Barbarian
      expect(sheet.savingThrows.str).toBe(true);
      expect(sheet.savingThrows.con).toBe(true);
      expect(sheet.savingThrows.wis).toBe(false);
    });

    it('should parse a Caster (Wizard) with spells and spell slots', () => {
      const mockWizard: Partial<DdbCharacterData> = {
        name: 'Elminster Mini',
        baseHitPoints: 6,
        stats: [
          { id: 1, value: 8 },
          { id: 2, value: 14 },
          { id: 3, value: 14 },
          { id: 4, value: 18 },
          { id: 5, value: 12 },
          { id: 6, value: 10 },
        ],
        classes: [
          {
            id: 2,
            level: 5,
            isStartingClass: true,
            definition: { name: 'Mago', hitDice: 6 },
            subclassDefinition: { name: 'Escola de Evocação' },
          },
        ],
        race: { fullName: 'Alto Elfo' },
        spellSlots: [
          { level: 1, used: 1, available: 3 },
          { level: 2, used: 0, available: 3 },
          { level: 3, used: 2, available: 0 },
        ],
        spells: {
          class: [
            {
              prepared: true,
              definition: {
                name: 'Bola de Fogo',
                level: 3,
                school: 'Evocation',
                range: { origin: 'Ranged', rangeValue: 150 },
                activation: { activationType: 1 },
                components: [1, 2, 3],
                description: 'Uma explosão radiante de chamas...',
              },
            },
            {
              prepared: true,
              definition: {
                name: 'Mísseis Mágicos',
                level: 1,
                school: 'Evocation',
                range: { origin: 'Ranged', rangeValue: 120 },
                activation: { activationType: 1 },
                components: [1, 2],
                description: 'Dardos brilhantes de energia...',
              },
            },
          ],
        },
      };

      const sheet = parseDdbCharacter(mockWizard as DdbCharacterData);

      expect(sheet.className).toBe('Mago');
      expect(sheet.level).toBe(5);
      expect(sheet.spells).toHaveLength(2);
      expect(sheet.spells[0].name).toBe('Bola de Fogo');
      expect(sheet.spells[0].school).toBe('Evocação');
      expect(sheet.spells[0].level).toBe(3);

      expect(sheet.spellSlots[1].total).toBe(4);
      expect(sheet.spellSlots[1].used).toBe(1);
      expect(sheet.spellSlots[3].total).toBe(2);
      expect(sheet.spellSlots[3].used).toBe(2);
    });

    it('should throw clear error on invalid or empty JSON payload', () => {
      expect(() => parseDdbCharacter({})).toThrowError(/Formato de dados inválido/);
    });
  });
});
