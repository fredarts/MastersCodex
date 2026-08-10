import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SRDMonster, SRDSpell, SRDItem } from '@/lib/types';
import { INITIAL_MONSTERS, INITIAL_SPELLS, INITIAL_ITEMS } from '@/lib/srd-data';
import { toast } from 'sonner';

export interface MonsterQueryFilter {
  searchQuery?: string;
  cr?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface SpellQueryFilter {
  searchQuery?: string;
  level?: number | 'all';
  school?: string;
  className?: string;
  concentration?: boolean;
  ritual?: boolean;
  shape?: string;
  page?: number;
  limit?: number;
}

export interface ItemQueryFilter {
  searchQuery?: string;
  rarity?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export const srdService = {
  async fetchMonsters(filter: MonsterQueryFilter = {}): Promise<SRDMonster[]> {
    const { searchQuery, cr, type, page = 1, limit = 500 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_monsters').select('*');

        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
        if (cr && cr !== 'all') {
          query = query.eq('cr', cr);
        }
        if (type && type !== 'all') {
          query = query.ilike('type', `%${type}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Fallback para compêndio estático de monstros local:', e);
      }
    }

    // Local Fallback Filter
    let results = INITIAL_MONSTERS.map((m) => ({
      ...m,
      tokenImageUrl: m.tokenImageUrl || `/assets/2d/Monstros/${m.name}.png`,
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((m) => m.name.toLowerCase().includes(q) || m.type.toLowerCase().includes(q));
    }
    if (cr && cr !== 'all') {
      results = results.filter((m) => m.cr === cr);
    }
    return results;
  },

  async fetchSpells(filter: SpellQueryFilter = {}): Promise<SRDSpell[]> {
    const { searchQuery, level, school, className, concentration, ritual, shape, page = 1, limit = 500 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_spells').select('*');

        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
        if (level !== undefined && level !== 'all') {
          query = query.eq('level', level);
        }
        if (school && school !== 'all') {
          query = query.eq('school', school);
        }
        if (concentration !== undefined) {
          query = query.eq('concentration', concentration);
        }
        if (ritual !== undefined) {
          query = query.eq('ritual', ritual);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            englishName: s.english_name || undefined,
            level: s.level,
            school: s.school,
            castingTime: s.casting_time,
            range: s.range,
            components: s.components_detail && Object.keys(s.components_detail).length > 0 ? s.components_detail : s.components,
            duration: s.duration,
            concentration: s.concentration || false,
            ritual: s.ritual || false,
            targetArea: s.target_area && Object.keys(s.target_area).length > 0 ? s.target_area : undefined,
            damageSave: s.damage_save && Object.keys(s.damage_save).length > 0 ? s.damage_save : undefined,
            description: s.description,
            higherLevels: s.higher_levels || undefined,
            classes: s.classes || [],
          }));
        }
      } catch (e) {
        console.warn('Fallback para compêndio estático de magias local:', e);
      }
    }

    // Local Fallback Filter
    let results = [...INITIAL_SPELLS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }
    if (level !== undefined && level !== 'all') {
      results = results.filter((s) => s.level === Number(level));
    }
    if (school && school !== 'all') {
      results = results.filter((s) => s.school.toLowerCase() === school.toLowerCase());
    }
    if (className && className !== 'all') {
      results = results.filter((s) => s.classes.some((c) => c.toLowerCase().includes(className.toLowerCase())));
    }
    if (concentration !== undefined) {
      results = results.filter((s) => !!s.concentration === concentration);
    }
    if (ritual !== undefined) {
      results = results.filter((s) => !!s.ritual === ritual);
    }
    if (shape && shape !== 'all') {
      results = results.filter((s) => s.targetArea?.shape === shape);
    }
    return results;
  },

  async fetchItems(filter: ItemQueryFilter = {}): Promise<SRDItem[]> {
    const { searchQuery, rarity, type, page = 1, limit = 500 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_items').select('*');

        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
        if (rarity && rarity !== 'all') {
          query = query.eq('rarity', rarity);
        }
        if (type && type !== 'all') {
          query = query.ilike('type', `%${type}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((i: any) => ({
            id: i.id,
            name: i.name,
            type: i.type,
            rarity: i.rarity,
            description: i.description,
            value: i.value,
          }));
        }
      } catch (e) {
        console.warn('Fallback para compêndio estático de itens local:', e);
      }
    }

    // Local Fallback Filter
    let results = [...INITIAL_ITEMS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
    }
    if (rarity && rarity !== 'all') {
      results = results.filter((i) => i.rarity.toLowerCase() === rarity.toLowerCase());
    }
    return results;
  },
};
