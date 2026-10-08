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

export const findDriveFolderByName = async (folderName, parentFolderId) => {
    const parentId = parentFolderId || '1HEgXlUHLxXjS-q0LJqFZQec0d3B2p2a_';
    const parentQuery = parentId ? `and '${parentId}' in parents` : '';
    const cleanName = folderName.replace(/'/g, "\\'");
    const query = `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentQuery}`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`;
    console.log('Fetching:', url);
    const response = await driveFetch(url, {});
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
};

async function test() {
   const taskTitleFallback = "(10/09) DESAFIO PIGGY MANIA *URG*";
   const mainFolder = await findDriveFolderByName(taskTitleFallback);
   console.log('Main:', mainFolder);
}
test();
async function test2() {
   const mainFolder = await findDriveFolderByName("(10/09) DESAFIO PIGGY MANIA *URG*");
   if(mainFolder) {
       const sub = await findDriveFolderByName("Arquivos Entregues", mainFolder.id);
       console.log('Sub:', sub);
       if(sub) {
           const query = `'${sub.id}' in parents and trashed = false`;
           const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=createdTime desc`;
           const res = await driveFetch(url, {});
           const data = await res.json();
           console.log('Files:', data.files);
       }
   }
}
test2();
