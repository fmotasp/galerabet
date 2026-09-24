const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function check() {
  const { data, error } = await supabase.from('tasks').select('priority').limit(1);
  console.log("Priority check:", data, error?.message);
}
check();
