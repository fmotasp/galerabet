import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  const { data, error } = await supabase.from('tasks').select('id, title, cover_image_url');
  if (error) {
    console.error(error);
    return;
  }
  for (const t of data) {
    if (t.cover_image_url && t.cover_image_url.length > 500) {
      console.log(`Task "${t.title}" (${t.id}) has cover_image_url length: ${(t.cover_image_url.length / 1024).toFixed(1)} KB (Starts with: ${t.cover_image_url.slice(0, 30)})`);
    }
  }
}

inspect();
