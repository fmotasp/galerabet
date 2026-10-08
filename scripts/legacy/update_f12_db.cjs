const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  console.log("Updating accesses...");
  const { data: accesses, error: err1 } = await supabase
    .from('accesses')
    .update({ category: 'F12 Bet' })
    .eq('category', 'F12');
  
  if (err1) console.error("Error updating accesses:", err1);
  else console.log("Accesses updated successfully.");

  console.log("Updating tasks...");
  const { data: tasks, error: err2 } = await supabase
    .from('tasks')
    .update({ project_name: 'F12 Bet' })
    .eq('project_name', 'F12');

  if (err2) console.error("Error updating tasks:", err2);
  else console.log("Tasks updated successfully.");
}

run();
