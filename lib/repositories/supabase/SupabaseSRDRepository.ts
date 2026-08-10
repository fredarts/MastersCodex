import { SRDMonster, SRDSpell, SRDItem } from '../../types';
import { supabase } from '../../supabase'; // Supabase client normal do browser/app

export class SupabaseSRDRepository {
  async searchMonsters(query?: string): Promise<SRDMonster[]> {
    let request = supabase.from('srd_monsters').select('*');
    
    if (query && query.trim() !== '') {
      // Usa a coluna 'fts' tsvector criada pela migração
      request = request.textSearch('fts', query.trim().replace(/\s+/g, ' | '));
    }
    
    const { data, error } = await request.limit(50);
    if (error) {
      console.error('Error fetching monsters:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      alignment: row.alignment,
      ac: row.ac,
      hp: row.hp,
      speed: row.speed,
      cr: row.cr,
      xp: row.xp,
      str: row.str,
      dex: row.dex,
      con: row.con,
      int: row.int,
      wis: row.wis,
      cha: row.cha,
      abilities: row.abilities,
      actions: row.actions
    }));
  }

  async searchSpells(query?: string): Promise<SRDSpell[]> {
    let request = supabase.from('srd_spells').select('*');
    
    if (query && query.trim() !== '') {
      request = request.textSearch('fts', query.trim().replace(/\s+/g, ' | '));
    }
    
    const { data, error } = await request.limit(50);
    if (error) {
      console.error('Error fetching spells:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      englishName: row.english_name || undefined,
      level: row.level,
      school: row.school,
      castingTime: row.casting_time,
      range: row.range,
      components: row.components_detail && Object.keys(row.components_detail).length > 0 ? row.components_detail : row.components,
      duration: row.duration,
      concentration: row.concentration || false,
      ritual: row.ritual || false,
      targetArea: row.target_area && Object.keys(row.target_area).length > 0 ? row.target_area : undefined,
      damageSave: row.damage_save && Object.keys(row.damage_save).length > 0 ? row.damage_save : undefined,
      description: row.description,
      higherLevels: row.higher_levels || undefined,
      classes: row.classes || []
    }));
  }

  async searchItems(query?: string): Promise<SRDItem[]> {
    let request = supabase.from('srd_items').select('*');
    
    if (query && query.trim() !== '') {
      request = request.textSearch('fts', query.trim().replace(/\s+/g, ' | '));
    }
    
    const { data, error } = await request.limit(50);
    if (error) {
      console.error('Error fetching items:', error);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      rarity: row.rarity,
      description: row.description,
      value: row.value
    }));
  }
}

// Singleton export
export const srdRepository = new SupabaseSRDRepository();
