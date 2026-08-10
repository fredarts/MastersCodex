const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  console.log('Connecting to PostgreSQL database for Spells Migration...');
  await client.connect();

  try {
    const migrationPath = path.join(__dirname, '../supabase/migrations/20260810_enhance_srd_spells_schema.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing migration 20260810_enhance_srd_spells_schema.sql...');
    await client.query(sql);
    console.log('Spells schema migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
