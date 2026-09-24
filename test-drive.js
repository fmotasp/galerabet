import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vrokxasiciqcbbfoqrjp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyb2t4YXNpY2lxY2JiZm9xcmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczMzU2NDUsImV4cCI6MjEwMjkxMTY0NX0.Y7DZuU-iyNqHKRZacLC0ktIDDqiq_wKfm5M8k99Pnlc';

const driveFetch = async (url, options = {}) => {
  const proxyUrl = `${SUPABASE_URL}/functions/v1/drive-proxy`;
  const headers = {
    ...(options.headers || {}),
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'x-drive-url': url
  };
  return await fetch(proxyUrl, { ...options, headers });
};

async function test() {
  const query = `name = 'DIVIRTA-SE NO PIGGY MANIA (16/09)' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`);
  const data = await res.json();
  console.log('Main folder:', data);
  if(data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      const q2 = `name = 'Arquivos Entregues' and '${folderId}' in parents and trashed = false`;
      const res2 = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q2)}&fields=files(id,name)`);
      const data2 = await res2.json();
      console.log('Subfolder:', data2);
      if(data2.files && data2.files.length > 0) {
          const q3 = `'${data2.files[0].id}' in parents and trashed = false`;
          const res3 = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q3)}&fields=files(id,name)`);
          const data3 = await res3.json();
          console.log('Files:', data3);
      }
  }
}
test();
