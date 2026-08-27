const { Client } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function enableRealtimeIdentity() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  try {
    console.log('Configurando REPLICA IDENTITY FULL e Realtime Publication...');
    await client.query(`
      ALTER TABLE public.character_sheets REPLICA IDENTITY FULL;
      ALTER TABLE public.party_loot_sessions REPLICA IDENTITY FULL;
      ALTER TABLE public.campaign_members REPLICA IDENTITY FULL;
      
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'character_sheets'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.character_sheets;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_publication_tables 
          WHERE pubname = 'supabase_realtime' AND tablename = 'party_loot_sessions'
        ) THEN
          ALTER PUBLICATION supabase_realtime ADD TABLE public.party_loot_sessions;
        END IF;
      END $$;
    `);
    console.log('Realtime configurado com sucesso!');
  } catch (err) {
    console.error('Erro ao configurar realtime:', err);
  } finally {
    await client.end();
  }
}

enableRealtimeIdentity();
