import { createClient } from '@supabase/supabase-js';
import { INITIAL_MONSTERS, INITIAL_SPELLS, INITIAL_ITEMS } from '../lib/srd-data';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populate() {
  console.log('Starting SRD population...');

  // 1. Monsters
  console.log(`Inserting ${INITIAL_MONSTERS.length} monsters...`);
  const { error: errMonsters } = await supabase
    .from('srd_monsters')
    .upsert(
      INITIAL_MONSTERS.map(m => ({
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
        abilities: m.abilities,
        actions: m.actions
      }))
    );

  if (errMonsters) console.error('Error inserting monsters:', errMonsters);

  // 2. Spells
  console.log(`Inserting ${INITIAL_SPELLS.length} spells...`);
  const { error: errSpells } = await supabase
    .from('srd_spells')
    .upsert(
      INITIAL_SPELLS.map(s => ({
        id: s.id,
        name: s.name,
        level: s.level,
        school: s.school,
        casting_time: s.castingTime,
        range: s.range,
        components: s.components,
        duration: s.duration,
        description: s.description,
        classes: s.classes
      }))
    );

  if (errSpells) console.error('Error inserting spells:', errSpells);

  // 3. Items
  console.log(`Inserting ${INITIAL_ITEMS.length} items...`);
  const { error: errItems } = await supabase
    .from('srd_items')
    .upsert(
      INITIAL_ITEMS.map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        rarity: i.rarity,
        description: i.description,
        value: i.value
      }))
    );

  if (errItems) console.error('Error inserting items:', errItems);

  console.log('SRD population complete!');
}

populate();
