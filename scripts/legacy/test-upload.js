import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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
  const metadata = {
    name: "test-upload.txt",
    parents: ["1HY2fSiUJqi3zwePoPDSirrAc2_n0jUL6"] // Arquivos Entregues folder
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob(["Hello world test file"], { type: 'text/plain' }), 'test-upload.txt');

  const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name';
  const response = await driveFetch(url, { method: 'POST', body: form });
  
  const text = await response.text();
  console.log('Status:', response.status);
  console.log('Response:', text);
}
test();
