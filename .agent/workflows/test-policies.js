const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = 'c:/Users/Fred/Documents/game-dev/Masters Codex - The Campaign Forge Tool/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const serviceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('\nFetching active database RLS policies...');
  
  // We can query pg_policies since we are superuser (using RPC or direct query via service key)
  // Supabase JS client doesn't allow raw postgres queries directly.
  // But wait, we can execute a raw SQL query if we use the DATABASE_URL and the pg library!
  // Since pg is not installed, we can write a quick python script using sqlite or postgres if python has psycopg2,
  // or we can install pg using npm temporarily? No, we don't need npm.
  // Wait, does Supabase have a way to run pg_policies?
  // Let's check if pg package is installed. We can try to require('pg').
  try {
    const { Client } = require('pg');
    const dbUrl = getEnvVar('DATABASE_URL');
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    const res = await client.query(`
      SELECT policyname, tablename, cmd, qual 
      FROM pg_policies 
      WHERE schemaname = 'public' AND tablename IN ('sessions', 'scenes', 'campaigns');
    `);
    console.log('Policies found:');
    res.rows.forEach(r => {
      console.log(`- Table: ${r.tablename}, Name: ${r.policyname}, Cmd: ${r.cmd}, Qual: ${r.qual}`);
    });
    await client.end();
  } catch (e) {
    console.log('Could not use pg client directly:', e.message);
  }
}

run();
