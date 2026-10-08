import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('projects').select('id, name, description, color_palette').ilike('name', '%Rios%');
  console.log(JSON.stringify(data, null, 2));
}
run();
