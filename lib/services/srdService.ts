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
  preferRemote?: boolean;
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
  preferRemote?: boolean;
}

export interface ItemQueryFilter {
  searchQuery?: string;
  rarity?: string;
  type?: string;
  category?: string;
  attunementOnly?: boolean;
  page?: number;
  limit?: number;
  preferRemote?: boolean;
}

export const srdService = {
  async fetchMonsters(filter: MonsterQueryFilter = {}): Promise<SRDMonster[]> {
    const { searchQuery, cr, type, page = 1, limit = 500, preferRemote = false } = filter;

    // Supabase explicitly requested
    if (preferRemote && isSupabaseConfigured()) {
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

    // Primary: Local File Filter (Instant RAM search, 0 network overhead)
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
    if (type && type !== 'all') {
      results = results.filter((m) => m.type.toLowerCase().includes(type.toLowerCase()));
    }

    // Secondary: If local search yielded no results and preferRemote wasn't set, try Supabase (for custom DB monsters)
    if (results.length === 0 && !preferRemote && isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_monsters').select('*');
        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
        if (cr && cr !== 'all') {
          query = query.eq('cr', cr);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Erro na busca secundária de monstros no Supabase:', e);
      }
    }

    const from = (page - 1) * limit;
    return results.slice(from, from + limit);
  },

  async fetchSpells(filter: SpellQueryFilter = {}): Promise<SRDSpell[]> {
    const { searchQuery, level, school, className, concentration, ritual, shape, page = 1, limit = 500, preferRemote = false } = filter;

    // Supabase explicitly requested
    if (preferRemote && isSupabaseConfigured()) {
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

    // Primary: Local File Filter (Instant RAM search, 0 network overhead)
    let results = [...INITIAL_SPELLS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((s) => s.name.toLowerCase().includes(q) || (s.englishName && s.englishName.toLowerCase().includes(q)) || s.description.toLowerCase().includes(q));
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

    // Secondary: If local search yielded no results and preferRemote wasn't set, try Supabase
    if (results.length === 0 && !preferRemote && isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_spells').select('*');
        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
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
        console.warn('Erro na busca secundária de magias no Supabase:', e);
      }
    }

    const from = (page - 1) * limit;
    return results.slice(from, from + limit);
  },

  async fetchItems(filter: ItemQueryFilter = {}): Promise<SRDItem[]> {
    const { searchQuery, rarity, type, category, attunementOnly, page = 1, limit = 500, preferRemote = false } = filter;

    // Supabase explicitly requested
    if (preferRemote && isSupabaseConfigured()) {
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
            englishName: i.english_name || i.englishName,
            type: i.type,
            category: i.category,
            rarity: i.rarity,
            attunement: i.attunement,
            description: i.description,
            value: i.value,
          }));
        }
      } catch (e) {
        console.warn('Fallback para compêndio estático de itens local:', e);
      }
    }

    // Primary: Local File Filter (Instant RAM search, 0 network overhead)
    let results = [...INITIAL_ITEMS];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.englishName && i.englishName.toLowerCase().includes(q)) ||
          i.type.toLowerCase().includes(q) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          i.description.toLowerCase().includes(q)
      );
    }
    if (rarity && rarity !== 'all') {
      const targetRarity = rarity.trim().toLowerCase();
      results = results.filter((i) => {
        const itemRarity = i.rarity.trim().toLowerCase();
        if (targetRarity === 'rara' || targetRarity === 'raro') {
          return itemRarity === 'rara' || itemRarity === 'raro';
        }
        return itemRarity === targetRarity;
      });
    }
    if (type && type !== 'all') {
      results = results.filter((i) => i.type.toLowerCase().includes(type.toLowerCase()));
    }
    if (category && category !== 'all') {
      results = results.filter(
        (i) =>
          (i.category && i.category.toLowerCase() === category.toLowerCase()) ||
          i.type.toLowerCase().includes(category.toLowerCase())
      );
    }
    if (attunementOnly) {
      results = results.filter((i) => !!i.attunement && i.attunement !== (false as any));
    }

    // Secondary: If local search yielded no results and preferRemote wasn't set, try Supabase
    if (results.length === 0 && !preferRemote && isSupabaseConfigured()) {
      try {
        let query = supabase.from('srd_items').select('*');
        if (searchQuery) {
          query = query.textSearch('fts', searchQuery.trim().replace(/\s+/g, ' | '));
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((i: any) => ({
            id: i.id,
            name: i.name,
            englishName: i.english_name || i.englishName,
            type: i.type,
            category: i.category,
            rarity: i.rarity,
            attunement: i.attunement,
            description: i.description,
            value: i.value,
          }));
        }
      } catch (e) {
        console.warn('Erro na busca secundária de itens no Supabase:', e);
      }
    }

    const from = (page - 1) * limit;
    return results.slice(from, from + limit);
  },
};
