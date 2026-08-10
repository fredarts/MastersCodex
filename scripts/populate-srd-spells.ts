import { createClient } from '@supabase/supabase-js';
import { ALL_SRD_SPELLS } from '../lib/srd-spells-data';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateSpells() {
  console.log(`Starting population of ${ALL_SRD_SPELLS.length} D&D 5e SRD Spells...`);

  const payload = ALL_SRD_SPELLS.map((s) => ({
    id: s.id,
    name: s.name,
    english_name: s.englishName || null,
    level: s.level,
    school: s.school,
    casting_time: s.castingTime,
    range: s.range,
    duration: s.duration,
    concentration: s.concentration || false,
    ritual: s.ritual || false,
    components: typeof s.components === 'string' ? s.components : (s.components.raw || 'V, S'),
    components_detail: typeof s.components === 'object' ? s.components : {},
    target_area: s.targetArea || {},
    damage_save: s.damageSave || {},
    description: s.description,
    higher_levels: s.higherLevels || null,
    classes: s.classes || [],
  }));

  // Batch insert in chunks of 50 to ensure optimal performance
  const chunkSize = 50;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('srd_spells').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error inserting chunk ${i}..${i + chunk.length}:`, error);
    } else {
      console.log(`Successfully upserted spells ${i + 1} to ${i + chunk.length}`);
    }
  }

  console.log('Finished populating SRD spells!');
}

populateSpells();
