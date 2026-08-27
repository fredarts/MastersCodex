const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function fixLilithAndClean() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    const campId = '8836d0f4-4718-48b4-84b7-be9ad6551056';

    console.log('1. Restaurando PO de Lilith para 4333...');
    const lilithRes = await client.query(`
      UPDATE public.character_sheets
      SET data = jsonb_set(
          data,
          '{currency}',
          '{"po": 4333, "pp": 0, "pc": 0, "pe": 0, "pl": 0}'::jsonb
      ),
      updated_at = NOW()
      WHERE character_name = 'Lilith' AND campaign_id = $1
      RETURNING id, character_name, data->'currency' as currency, updated_at
    `, [campId]);
    console.log('Lilith restaurada:', lilithRes.rows);

    console.log('2. Removendo fichas de teste fantasmas (Aventureiro 2, Kiran)...');
    const deleteRes = await client.query(`
      DELETE FROM public.character_sheets
      WHERE campaign_id = $1 AND character_name IN ('Aventureiro 2', 'Kiran')
      RETURNING id, character_name
    `, [campId]);
    console.log('Fichas de teste removidas:', deleteRes.rows);

    console.log('3. Removendo de campaign_members se existirem...');
    const delMem = await client.query(`
      DELETE FROM public.campaign_members
      WHERE campaign_id = $1 AND character_name IN ('Aventureiro 2', 'Kiran')
      RETURNING id, character_name
    `, [campId]);
    console.log('Membros removidos:', delMem.rows);

  } catch (err) {
    console.error('Erro ao corrigir banco:', err);
  } finally {
    await client.end();
  }
}

fixLilithAndClean();
