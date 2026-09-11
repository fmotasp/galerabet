import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log("Checking for triggers...");
  // Try querying pg_trigger via RPC if it exists, or just query tasks directly.
  // Wait, anon key can't query pg_trigger directly unless exposed.
  
  // Let's just fetch the task that the user was talking about.
  // "LUVABET_ESCOLHA SEU TRIO DE CASSINO.psd"
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, activity_log, created_at, updated_at, last_moved_at')
    .ilike('title', '%LUVABET%')
    .limit(5);
    
  console.log(JSON.stringify({data, error}, null, 2));
}

checkDb();
