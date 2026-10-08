import { createClient } from '@supabase/supabase-js';

// Configurável por ambiente (.env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Os valores abaixo são o fallback atual.
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL || 'https://vrokxasiciqcbbfoqrjp.supabase.co';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
