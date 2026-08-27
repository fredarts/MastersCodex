const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function diagnose() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    console.log('=== 1. CAMPANHA "NINHO DO DRAGÃO" ===');
    const campRes = await client.query(`
      SELECT id, title, invite_code, dm_id, party_members, created_at
      FROM public.campaigns
      WHERE title ILIKE '%ninho%' OR title ILIKE '%dragao%' OR title ILIKE '%dragão%'
    `);
    console.log(JSON.stringify(campRes.rows, null, 2));

    const campIds = campRes.rows.map(r => `'${r.id}'`).join(',');
    const campFilter = campIds ? `campaign_id IN (${campIds})` : 'TRUE';

    console.log('\n=== 2. MEMBROS DA CAMPANHA (campaign_members) ===');
    const memRes = await client.query(`
      SELECT id, campaign_id, user_id, character_name, role, avatar_url, token_type, joined_at
      FROM public.campaign_members
      WHERE ${campFilter} OR character_name ILIKE '%lilith%' OR character_name ILIKE '%kirion%' OR character_name ILIKE '%karynna%'
    `);
    console.log(JSON.stringify(memRes.rows, null, 2));

    console.log('\n=== 3. FICHAS DE PERSONAGENS (character_sheets) ===');
    const sheetRes = await client.query(`
      SELECT 
        id, 
        campaign_id, 
        user_id, 
        character_name, 
        data->'characterName' as json_name,
        data->'currency' as currency,
        data->'equipment' as equipment,
        jsonb_array_length(COALESCE(data->'transactionHistory', '[]'::jsonb)) as tx_count,
        updated_at
      FROM public.character_sheets
      WHERE ${campFilter} 
         OR character_name ILIKE '%lilith%' 
         OR character_name ILIKE '%kirion%' 
         OR character_name ILIKE '%karynna%'
         OR (data->>'characterName') ILIKE '%lilith%'
         OR (data->>'characterName') ILIKE '%kirion%'
         OR (data->>'characterName') ILIKE '%karynna%'
    `);
    console.log(JSON.stringify(sheetRes.rows, null, 2));

    console.log('\n=== 4. SESSÕES DE LOOT DA PARTY (party_loot_sessions) ===');
    const lootRes = await client.query(`
      SELECT id, campaign_id, title, status, currency, jsonb_array_length(items) as item_count, created_at, updated_at
      FROM public.party_loot_sessions
      WHERE ${campFilter}
      ORDER BY created_at DESC
      LIMIT 5
    `);
    console.log(JSON.stringify(lootRes.rows, null, 2));

  } catch (err) {
    console.error('Erro na consulta:', err);
  } finally {
    await client.end();
  }
}

diagnose();
