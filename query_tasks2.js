import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDb() {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, status, activity_log')
    .ilike('title', '%LUVABET%')
    .limit(10);
    
  if (error) {
    console.error("Error fetching tasks:", error);
    return;
  }
  
  for (const task of data) {
    console.log(`\nTask: ${task.title}`);
    console.log(`Status: ${task.status}`);
    if (task.activity_log) {
      console.log("Recent activity:");
      const recent = task.activity_log.slice(-5);
      recent.forEach(act => {
        console.log(` - [${act.timestamp}] ${act.user}: ${act.details}`);
      });
    }
  }
}

checkDb();
