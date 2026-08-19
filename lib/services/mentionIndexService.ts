import { WorldEntity, SRDMonster, SRDSpell, SRDItem, WorldEntityCategory } from '@/lib/types';
import { INITIAL_MONSTERS, CONDITIONS } from '@/lib/srd-data';
import { ALL_SRD_SPELLS } from '@/lib/srd-spells-data';
import { ALL_SRD_ITEMS } from '@/lib/srd-items-data';

export type MentionEntityType =
  | 'npc'
  | 'location'
  | 'faction'
  | 'religion'
  | 'lore_event'
  | 'species'
  | 'ethnicity'
  | 'tradition'
  | 'profession'
  | 'natural_law'
  | 'spell'
  | 'disease'
  | 'item'
  | 'material'
  | 'technology'
  | 'document'
  | 'language'
  | 'military_conflict'
  | 'military_unit'
  | 'currency'
  | 'trade_route'
  | 'beast'
  | 'flora'
  | 'magic_system'
  | 'plane'
  | 'cosmology'
  | 'monster'
  | 'quest'
  | 'condition';

export interface MentionItem {
  id: string;
  name: string;
  type: MentionEntityType;
  categoryLabel: string;
  subType?: string;
  source: 'world' | 'srd' | 'campaign';
  previewText?: string;
  iconName?: string;
  avatarUrl?: string;
  rawEntity?: any;
}

export interface MentionPreviewData {
  id: string;
  name: string;
  type: MentionEntityType;
  categoryLabel: string;
  subType?: string;
  status?: string;
  shortDesc?: string;
  fullContent?: string;
  imageUrl?: string;
  tags?: string[];
  monsterStats?: {
    cr?: string;
    ac?: number;
    hp?: number;
    speed?: string;
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
    type?: string;
    alignment?: string;
  };
  spellStats?: {
    level: number;
    school: string;
    castingTime: string;
    range: string;
    duration: string;
    damage?: string;
    save?: string;
    classes?: string[];
  };
  itemStats?: {
    category?: string;
    rarity?: string;
    cost?: string;
    weight?: number;
    type?: string;
  };
  questStats?: {
    status?: string;
    difficulty?: string;
    type?: string;
    xpReward?: number;
    goldReward?: number;
    giverNpcName?: string;
    targetLocationName?: string;
    objectives?: { description: string; isCompleted: boolean }[];
  };
}

export const CATEGORY_LABELS: Record<string, string> = {
  npc: 'NPC',
  location: 'Localização',
  faction: 'Facção',
  religion: 'Religião / Deuses',
  lore_event: 'Evento Histórico',
  species: 'Espécie / Raça',
  ethnicity: 'Etnia',
  tradition: 'Tradição / Cultura',
  profession: 'Profissão',
  natural_law: 'Lei Natural / Física',
  spell: 'Magia',
  disease: 'Doença / Praga',
  item: 'Item / Relíquia',
  material: 'Material / Mineral',
  technology: 'Tecnologia / Engenharia',
  document: 'Documento / Tomo',
  language: 'Idioma / Dialeto',
  military_conflict: 'Guerra / Batalha',
  military_unit: 'Unidade Militar',
  currency: 'Moeda / Economia',
  trade_route: 'Rota Comercial',
  beast: 'Fera / Animal',
  flora: 'Flora / Planta',
  magic_system: 'Sistema de Magia',
  plane: 'Plano de Existência',
  cosmology: 'Cosmologia',
  monster: 'Monstro',
  quest: 'Missão',
  condition: 'Condição 5e',
};

class MentionIndexService {
  /**
   * Search unified entities across world entities and SRD compendium
   */
  searchEntities(
    query: string,
    worldEntities: WorldEntity[] = [],
    options?: { limit?: number; categoryFilter?: string }
  ): MentionItem[] {
    const q = query.trim().toLowerCase();
    const limit = options?.limit || 20;
    const results: MentionItem[] = [];

    // 1. Search World Entities first (highest priority)
    for (const ent of worldEntities) {
      if (options?.categoryFilter && options.categoryFilter !== 'all' && ent.category !== options.categoryFilter) {
        continue;
      }
      const matchName = ent.name.toLowerCase().includes(q);
      const matchSub = ent.subType?.toLowerCase().includes(q);
      const matchTag = ent.tags?.some((t) => t.toLowerCase().includes(q));

      if (q === '' || matchName || matchSub || matchTag) {
        results.push({
          id: ent.id,
          name: ent.name,
          type: ent.category as MentionEntityType,
          categoryLabel: CATEGORY_LABELS[ent.category] || ent.category,
          subType: ent.subType,
          source: 'world',
          previewText: ent.shortDesc || '',
          avatarUrl: ent.images && ent.images.length > 0 ? ent.images[0] : undefined,
          rawEntity: ent,
        });
      }
      if (results.length >= limit) return results;
    }

    // 2. Search SRD Spells
    if (!options?.categoryFilter || options.categoryFilter === 'all' || options.categoryFilter === 'spell') {
      for (const spell of ALL_SRD_SPELLS) {
        const matchName = spell.name.toLowerCase().includes(q);
        const matchEng = spell.englishName?.toLowerCase().includes(q);
        const matchSchool = spell.school?.toLowerCase().includes(q);

        if (q === '' || matchName || matchEng || matchSchool) {
          const spellId = spell.id || `spell-${spell.name.toLowerCase().replace(/\s+/g, '-')}`;
          results.push({
            id: spellId,
            name: spell.name,
            type: 'spell',
            categoryLabel: 'Magia SRD',
            subType: `${spell.school} • Nível ${spell.level}`,
            source: 'srd',
            previewText: spell.description.slice(0, 100) + '...',
            rawEntity: spell,
          });
        }
        if (results.length >= limit) return results;
      }
    }

    // 3. Search SRD Monsters
    if (!options?.categoryFilter || options.categoryFilter === 'all' || options.categoryFilter === 'monster' || options.categoryFilter === 'beast') {
      for (const monster of INITIAL_MONSTERS) {
        const matchName = monster.name.toLowerCase().includes(q);
        const matchType = monster.type?.toLowerCase().includes(q);

        if (q === '' || matchName || matchType) {
          const monsterId = `srd-monster:${monster.name.toLowerCase().replace(/\s+/g, '-')}`;
          results.push({
            id: monsterId,
            name: monster.name,
            type: 'monster',
            categoryLabel: 'Monstro SRD',
            subType: `ND ${monster.cr} • ${monster.type}`,
            source: 'srd',
            previewText: `CA ${monster.ac}, PV ${monster.hp}, Deslocamento ${monster.speed}`,
            rawEntity: monster,
          });
        }
        if (results.length >= limit) return results;
      }
    }

    // 4. Search SRD Items
    if (!options?.categoryFilter || options.categoryFilter === 'all' || options.categoryFilter === 'item') {
      for (const item of ALL_SRD_ITEMS) {
        const matchName = item.name.toLowerCase().includes(q);
        const matchEng = item.englishName?.toLowerCase().includes(q);
        const matchCat = item.category?.toLowerCase().includes(q);

        if (q === '' || matchName || matchEng || matchCat) {
          const itemId = item.id || `srd-item:${item.name.toLowerCase().replace(/\s+/g, '-')}`;
          results.push({
            id: itemId,
            name: item.name,
            type: 'item',
            categoryLabel: 'Item SRD',
            subType: `${item.rarity || 'Comum'} • ${item.category || item.type || 'Equipamento'}`,
            source: 'srd',
            previewText: item.description.slice(0, 100) + '...',
            rawEntity: item,
          });
        }
        if (results.length >= limit) return results;
      }
    }

    // 5. Search 5e Conditions
    if (!options?.categoryFilter || options.categoryFilter === 'all' || options.categoryFilter === 'condition') {
      for (const cond of CONDITIONS) {
        if (q === '' || cond.toLowerCase().includes(q)) {
          results.push({
            id: `cond:${cond.toLowerCase()}`,
            name: cond,
            type: 'condition',
            categoryLabel: 'Condição 5e',
            source: 'srd',
            previewText: `Condição de combate do D&D 5e: ${cond}`,
          });
        }
        if (results.length >= limit) return results;
      }
    }

    return results;
  }

  /**
   * Fetch complete preview data for a hover card
   */
  async getEntityPreview(
    type: string,
    id: string,
    fallbackName: string,
    worldEntities: WorldEntity[] = []
  ): Promise<MentionPreviewData> {
    // 1. Try finding in active WorldEntities
    const worldEnt = worldEntities.find(
      (e) => e.id === id || e.name.toLowerCase() === fallbackName.toLowerCase()
    );

    if (worldEnt) {
      let questStats = undefined;
      if (worldEnt.category === 'quest') {
        const qData = worldEnt.attributes || {};
        let objectives = [];
        try {
          objectives = typeof qData.questObjectives === 'string'
            ? JSON.parse(qData.questObjectives)
            : (Array.isArray(qData.questObjectives) ? qData.questObjectives : []);
        } catch {
          objectives = [];
        }

        const giverNpc = qData.questGiverNpcId
          ? worldEntities.find((e) => e.id === qData.questGiverNpcId)?.name
          : undefined;
        const targetLoc = qData.questTargetLocationId
          ? worldEntities.find((e) => e.id === qData.questTargetLocationId)?.name
          : undefined;

        questStats = {
          status: qData.questStatus || 'not_started',
          difficulty: qData.questDifficulty || 'medium',
          type: qData.questType || 'main',
          xpReward: Number(qData.questXpReward || 0),
          goldReward: Number(qData.questGoldReward || 0),
          giverNpcName: giverNpc,
          targetLocationName: targetLoc,
          objectives,
        };
      }

      let monsterStats = undefined;
      if (worldEnt.statSheet) {
        const sheet = worldEnt.statSheet;
        monsterStats = {
          cr: sheet.cr || '0',
          ac: sheet.ac,
          hp: sheet.hp,
          speed: sheet.speed || '9m',
          str: sheet.str,
          dex: sheet.dex,
          con: sheet.con,
          int: sheet.int,
          wis: sheet.wis,
          cha: sheet.cha,
          type: worldEnt.subType || worldEnt.category,
        };
      }

      return {
        id: worldEnt.id,
        name: worldEnt.name,
        type: worldEnt.category as MentionEntityType,
        categoryLabel: CATEGORY_LABELS[worldEnt.category] || worldEnt.category,
        subType: worldEnt.subType,
        status: worldEnt.status,
        shortDesc: worldEnt.shortDesc,
        fullContent: worldEnt.fullContent,
        imageUrl: worldEnt.images && worldEnt.images.length > 0 ? worldEnt.images[0] : undefined,
        tags: worldEnt.tags,
        questStats,
        monsterStats,
      };
    }

    // 2. Try finding in SRD Spells
    if (type === 'spell' || id.startsWith('spell-') || id.includes('srd-spell')) {
      const cleanId = id.replace('srd-spell:', '').replace('spell-', '');
      const spell = ALL_SRD_SPELLS.find(
        (s) => (s.id && s.id.toLowerCase() === cleanId.toLowerCase()) ||
               s.name.toLowerCase().includes(fallbackName.toLowerCase()) ||
               (s.englishName && s.englishName.toLowerCase().includes(fallbackName.toLowerCase()))
      );

      if (spell) {
        return {
          id: spell.id || id,
          name: spell.name,
          type: 'spell',
          categoryLabel: 'Magia SRD 5e',
          subType: `${spell.school} • Nível ${spell.level}`,
          shortDesc: spell.description,
          spellStats: {
            level: spell.level,
            school: spell.school,
            castingTime: spell.castingTime,
            range: spell.range,
            duration: spell.duration,
            damage: spell.damageSave?.damageDice || (spell as any).damage,
            save: spell.damageSave?.saveStat || (spell as any).save,
            classes: spell.classes,
          },
        };
      }
    }

    // 3. Try finding in SRD Monsters
    if (type === 'monster' || id.startsWith('srd-monster') || type === 'beast') {
      const cleanName = fallbackName.toLowerCase();
      const monster = INITIAL_MONSTERS.find(
        (m) => m.name.toLowerCase() === cleanName ||
               id.toLowerCase().includes(m.name.toLowerCase().replace(/\s+/g, '-'))
      );

      if (monster) {
        return {
          id: `srd-monster:${monster.name.toLowerCase()}`,
          name: monster.name,
          type: 'monster',
          categoryLabel: 'Monstro SRD 5e',
          subType: `${monster.size} ${monster.type} • ${monster.alignment}`,
          shortDesc: monster.abilities && monster.abilities.length > 0
            ? monster.abilities.map((a) => `${a.name}: ${a.desc}`).join(' | ')
            : `Monstro SRD 5e com ND ${monster.cr}.`,
          monsterStats: {
            cr: monster.cr,
            ac: monster.ac,
            hp: monster.hp,
            speed: monster.speed,
            str: monster.str,
            dex: monster.dex,
            con: monster.con,
            int: monster.int,
            wis: monster.wis,
            cha: monster.cha,
            type: monster.type,
            alignment: monster.alignment,
          },
        };
      }
    }

    // 4. Try finding in SRD Items
    if (type === 'item' || id.startsWith('srd-item')) {
      const cleanName = fallbackName.toLowerCase();
      const item = ALL_SRD_ITEMS.find(
        (i) => (i.id && i.id.toLowerCase() === id.toLowerCase()) ||
               i.name.toLowerCase() === cleanName ||
               (i.englishName && i.englishName.toLowerCase() === cleanName)
      );

      if (item) {
        return {
          id: item.id || id,
          name: item.name,
          type: 'item',
          categoryLabel: 'Item SRD 5e',
          subType: `${item.rarity || 'Comum'} • ${item.category || item.type || 'Equipamento'}`,
          shortDesc: item.description,
          itemStats: {
            category: item.category,
            rarity: item.rarity,
            cost: item.value || (item as any).cost,
            weight: item.weight,
            type: item.type,
          },
        };
      }
    }

    // 5. Try finding in Conditions
    if (type === 'condition' || id.startsWith('cond:')) {
      const condName = fallbackName || id.replace('cond:', '');
      return {
        id,
        name: condName,
        type: 'condition',
        categoryLabel: 'Condição 5e',
        shortDesc: `Efeito de condição de regras do D&D 5e (${condName}).`,
      };
    }

    // Default Fallback
    return {
      id,
      name: fallbackName,
      type: (type as MentionEntityType) || 'npc',
      categoryLabel: CATEGORY_LABELS[type] || 'Entidade',
      shortDesc: 'Informações detalhadas não encontradas.',
    };
  }

  /**
   * Helper to format a mention tag string
   */
  formatMentionTag(name: string, type: string, id: string): string {
    return `@[${name}](${type}:${id})`;
  }
}

export const mentionIndexService = new MentionIndexService();
