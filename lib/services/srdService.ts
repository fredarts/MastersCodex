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
    const { searchQuery, cr, type, page = 1, limit = 50 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_monsters').select('*');

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
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
          return data.map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            size: m.size,
            alignment: m.alignment,
            ac: m.ac,
            hp: m.hp,
            speed: m.speed,
            cr: m.cr,
            xp: m.xp,
            str: m.str,
            dex: m.dex,
            con: m.con,
            int: m.int,
            wis: m.wis,
            cha: m.cha,
            abilities: m.abilities || [],
            actions: m.actions || [],
          }));
        }
      } catch (e) {
        console.warn('Fallback para compêndio estático de monstros local:', e);
      }
    }

    // Local Fallback Filter
    let results = [...INITIAL_MONSTERS];
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
    const { searchQuery, level, school, className, page = 1, limit = 50 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_spells').select('*');

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        if (level !== undefined && level !== 'all') {
          query = query.eq('level', level);
        }
        if (school && school !== 'all') {
          query = query.eq('school', school);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((s: any) => ({
            id: s.id,
            name: s.name,
            level: s.level,
            school: s.school,
            castingTime: s.casting_time,
            range: s.range,
            components: s.components,
            duration: s.duration,
            description: s.description,
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
    return results;
  },

  async fetchItems(filter: ItemQueryFilter = {}): Promise<SRDItem[]> {
    const { searchQuery, rarity, type, page = 1, limit = 50 } = filter;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_items').select('*');

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
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
