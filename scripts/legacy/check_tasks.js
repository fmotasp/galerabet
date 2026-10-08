import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://vrokxasiciqcbbfoqrjp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc');

async function run() {
  const { count } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
  console.log(`Total tasks in DB: ${count}`);

  const { data } = await supabase.from('tasks').select('id, status');
  const statusCounts = {};
  data.forEach(t => {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  });
  console.log('Status counts:', statusCounts);
}
run();
