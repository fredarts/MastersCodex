const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function diagnose() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const campId = '8836d0f4-4718-48b4-84b7-be9ad6551056';

    console.log('=== CAMPAIGN_MEMBERS ===');
    const mems = await client.query('SELECT * FROM public.campaign_members WHERE campaign_id = $1', [campId]);
    console.log(mems.rows);

    console.log('\n=== CHARACTER_SHEETS ===');
    const sheets = await client.query('SELECT id, campaign_id, user_id, character_name, data->\'characterName\' as data_char_name, data->\'currency\' as currency, data->\'transactionHistory\' as tx_history FROM public.character_sheets WHERE campaign_id = $1 OR character_name IN (\'Lilith\', \'Kirion\', \'Karynna\')', [campId]);
    console.log(JSON.stringify(sheets.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

diagnose();
