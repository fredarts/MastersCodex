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

// Use service role key to bypass RLS
const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  console.log('\nFetching RLS policies...');
  // We can query pg_policies using RPC or direct SQL, but we cannot run raw SQL via supabase client easily unless we have an RPC function.
  // Wait, let's see if there is an error in scenes view or table.
  // Let's fetch all sessions for campaign 'e23606f2-ba42-42fb-87f9-cbea332d3c9f' using the service key (which works).
  const { data: sessions, error: sessErr } = await supabase.from('sessions').select('*').eq('campaign_id', 'e23606f2-ba42-42fb-87f9-cbea332d3c9f');
  console.log('Sessions for campaign (Service Role):', sessions ? sessions.length : 0);

  // Let's fetch using the anon client key to see if RLS blocks it.
  const anonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const { data: anonSessions, error: anonSessErr } = await supabaseAnon.from('sessions').select('*').eq('campaign_id', 'e23606f2-ba42-42fb-87f9-cbea332d3c9f');
  console.log('Sessions for campaign (Anon Key):', anonSessions ? anonSessions.length : 0, 'Error:', anonSessErr);
}

run();
