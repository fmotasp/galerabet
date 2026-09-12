import { supabase } from './supabase';

// Google Drive Configuration & Helpers
export const GOOGLE_DRIVE_CONFIG = {
  API_KEY: 'AIzaSyBWN4Vid0xcWbXjZ_viFn0bnHJXwUGuGNw',
  CLIENT_ID: localStorage.getItem('spine_google_client_id') || '453469922467-7ilthrigsb787j0hjugvdumq7601aicb.apps.googleusercontent.com',
  ROOT_FOLDER_ID: localStorage.getItem('spine_google_root_folder_id') || '1HEgXlUHLxXjS-q0LJqFZQec0d3B2p2a_',
  SCOPES: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
  DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webContentLink?: string;
  webViewLink?: string;
  iconLink?: string;
  size?: string;
  createdTime?: string;
  type?: 'reference' | 'final' | 'general';
}

let tokenClient: any = null;
let gapiInited = false;
let gisInited = false;

// Initialize Google API client library
export const loadGoogleApi = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.gapi) {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
          });
          gapiInited = true;
          resolve(true);
        } catch (e) {
          console.error('Error initializing GAPI client:', e);
          resolve(false);
        }
      });
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
              discoveryDocs: GOOGLE_DRIVE_CONFIG.DISCOVERY_DOCS,
            });
            gapiInited = true;
            resolve(true);
          } catch (e) {
            console.error('Error initializing GAPI client:', e);
            resolve(false);
          }
        });
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    }
  });
};

// Request OAuth token for drive operations
export const requestDriveToken = (clientId?: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const cId = clientId || GOOGLE_DRIVE_CONFIG.CLIENT_ID;
    if (!cId) {
      console.warn('Google Client ID not configured');
      resolve(null);
      return;
    }

    const initGis = () => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: cId,
          scope: GOOGLE_DRIVE_CONFIG.SCOPES,
          callback: (tokenResponse: any) => {
            if (tokenResponse.error !== undefined) {
              console.error('Token error:', tokenResponse.error);
              resolve(null);
              return;
            }
            const token = tokenResponse.access_token;
            const expiry = String(Date.now() + 3500 * 1000);
            localStorage.setItem('spine_google_access_token', token);
            localStorage.setItem('spine_google_token_expiry', expiry);

            // Sync shared token to Supabase so team members don't need separate Google logins
            try {
              supabase.from('projects').upsert({
                id: 'google-drive-token',
                name: 'Google Drive Auth Token',
                category: 'System',
                description: token,
                logo_url: expiry,
                status: 'active',
              }).then();
            } catch (err) {}

            resolve(token);
          },
        });
        tokenClient.requestAccessToken({ prompt: '' });
      } catch (err) {
        console.error('Error initializing GIS:', err);
        resolve(null);
      }
    };

    if (window.google?.accounts?.oauth2) {
      initGis();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = initGis;
      script.onerror = () => resolve(null);
      document.body.appendChild(script);
    }
  });
};

// Get stored access token or optionally request one interactively
export const getValidAccessToken = async (
  clientId?: string,
  interactive: boolean = false
): Promise<string | null> => {
  const localToken = localStorage.getItem('spine_google_access_token');
  const expiry = Number(localStorage.getItem('spine_google_token_expiry')) || 0;

  if (localToken && (expiry === 0 || expiry > Date.now() + 60000)) {
    return localToken;
  }

  // Check cloud-synced token from Supabase
  try {
    const { data } = await supabase
      .from('projects')
      .select('description, logo_url')
      .eq('id', 'google-drive-token')
      .maybeSingle();

    if (data?.description) {
      const cloudExpiry = Number(data.logo_url) || 0;
      if (cloudExpiry > Date.now() + 60000) {
        localStorage.setItem('spine_google_access_token', data.description);
        localStorage.setItem('spine_google_token_expiry', String(cloudExpiry));
        return data.description;
      }
    }
  } catch (err) {
    console.warn('Could not check Supabase for Google token:', err);
  }

  // Only open the OAuth popup window if explicitly requested by user interaction
  if (interactive) {
    return await requestDriveToken(clientId);
  }

  return null;
};

// Helper fetch wrapper to handle Google Drive token expiry and fallback to API Key
const driveFetch = async (
  url: string,
  options: RequestInit = {},
  customToken?: string,
  interactive: boolean = false
): Promise<Response> => {
  let token = customToken || localStorage.getItem('spine_google_access_token');
  if (!token) {
    token = await getValidAccessToken(undefined, interactive);
  }

  // Se não tem token OAuth, tenta usar a API Key diretamente como query param
  if (!token) {
    const separator = url.includes('?') ? '&' : '?';
    const keyUrl = `${url}${separator}key=${GOOGLE_DRIVE_CONFIG.API_KEY}`;
    return await fetch(keyUrl, options);
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  } as any;

  let response = await fetch(url, { ...options, headers });

  // If unauthorized (401), token has probably expired -> tenta refresh ou fallback com API Key
  if (response.status === 401) {
    console.warn('Google Drive token expired or invalid (401).');
    localStorage.removeItem('spine_google_access_token');
    if (interactive) {
      const newToken = await requestDriveToken();
      if (newToken) {
        const retryHeaders = {
          ...(options.headers || {}),
          Authorization: `Bearer ${newToken}`,
        } as any;
        return await fetch(url, { ...options, headers: retryHeaders });
      }
    }

    // Fallback com API Key para pastas/arquivos públicos ou compartilhados
    const separator = url.includes('?') ? '&' : '?';
    const keyUrl = `${url}${separator}key=${GOOGLE_DRIVE_CONFIG.API_KEY}`;
    const keyHeaders = { ...(options.headers || {}) } as any;
    delete keyHeaders.Authorization;
    response = await fetch(keyUrl, { ...options, headers: keyHeaders });
  }

  return response;
};

// Find existing task folder in Google Drive by name to prevent duplicates
export const findDriveFolderByName = async (
  folderName: string,
  parentFolderId?: string,
  accessToken?: string,
  interactive: boolean = false
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    const parentId = parentFolderId || GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;
    const parentQuery = parentId ? `and '${parentId}' in parents` : '';
    const cleanName = folderName.replace(/'/g, "\\'");
    const query = `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentQuery}`;

    const response = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`,
      {},
      accessToken,
      interactive
    );

    if (!response.ok) return null;
    const data = await response.json();
    if (data.files && data.files.length > 0) {
      const folder = data.files[0];
      return {
        id: folder.id,
        webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      };
    }
    return null;
  } catch (err) {
    console.warn('Error searching drive folder by name:', err);
    return null;
  }
};

// Ensure subfolders ("Briefing" and "Arquivos Entregues") exist inside the task folder
export const getOrCreateTaskSubfolder = async (
  taskFolderId: string,
  subfolderName: string,
  accessToken?: string,
  interactive: boolean = false
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    const existing = await findDriveFolderByName(subfolderName, taskFolderId, accessToken, interactive);
    if (existing) return existing;

    const response = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: subfolderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [taskFolderId],
      }),
    }, accessToken, interactive);

    if (!response.ok) return null;
    const data = await response.json();

    // Make subfolder publicly editable
    try {
      await driveFetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'anyone',
          allowFileDiscovery: false,
        }),
      }, accessToken, interactive);
    } catch (permErr) {
      console.warn(`Could not set public edit permission on subfolder "${subfolderName}":`, permErr);
    }

    return {
      id: data.id,
      webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}`,
    };
  } catch (err) {
    console.warn(`Error creating subfolder "${subfolderName}":`, err);
    return null;
  }
};

// Get direct link to "Arquivos Entregues" subfolder in Google Drive
export const getTaskDeliveredFolderUrl = async (
  taskFolderId: string,
  accessToken?: string
): Promise<string> => {
  if (!taskFolderId) return '';
  try {
    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, 'Arquivos Entregues', accessToken, true);
    if (subfolder && subfolder.webViewLink) return subfolder.webViewLink;
    if (subfolder && subfolder.id) return `https://drive.google.com/drive/folders/${subfolder.id}`;
  } catch (e) {
    console.warn('Error fetching delivered subfolder url:', e);
  }
  return `https://drive.google.com/drive/folders/${taskFolderId}`;
};

// Get direct link to "Briefing" subfolder in Google Drive
export const getTaskBriefingFolderUrl = async (
  taskFolderId: string,
  accessToken?: string
): Promise<string> => {
  if (!taskFolderId) return '';
  try {
    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, 'Briefing', accessToken, true);
    if (subfolder && subfolder.webViewLink) return subfolder.webViewLink;
    if (subfolder && subfolder.id) return `https://drive.google.com/drive/folders/${subfolder.id}`;
  } catch (e) {
    console.warn('Error fetching briefing subfolder url:', e);
  }
  return `https://drive.google.com/drive/folders/${taskFolderId}`;
};

// Create or reuse a task folder in Google Drive (with "Briefing" and "Arquivos Entregues" inside)
export const createDriveFolder = async (
  folderName: string,
  parentFolderId?: string,
  accessToken?: string,
  interactive: boolean = true
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    // 1. Check if root task folder already exists with this exact name
    let mainFolder = await findDriveFolderByName(folderName, parentFolderId, accessToken, interactive);
    
    if (!mainFolder) {
      const parents = parentFolderId
        ? [parentFolderId]
        : GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID
        ? [GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID]
        : [];

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parents.length > 0 ? parents : undefined,
      };

      const response = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileMetadata),
      }, accessToken, interactive);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Google Drive API folder create error:', errorData);
        return null;
      }

      const folderData = await response.json();
      mainFolder = {
        id: folderData.id,
        webViewLink: folderData.webViewLink || `https://drive.google.com/drive/folders/${folderData.id}`,
      };

      // Set public edit permissions on the task folder
      try {
        await driveFetch(`https://www.googleapis.com/drive/v3/files/${folderData.id}/permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            role: 'writer',
            type: 'anyone',
            allowFileDiscovery: false,
          }),
        }, accessToken, interactive);
      } catch (permErr) {
        console.warn('Could not set public permission on drive folder:', permErr);
      }
    }

    // 2. Ensure default subfolders exist
    try {
      await Promise.all([
        getOrCreateTaskSubfolder(mainFolder.id, 'Briefing', accessToken, interactive),
        getOrCreateTaskSubfolder(mainFolder.id, 'Arquivos Entregues', accessToken, interactive),
        getOrCreateTaskSubfolder(mainFolder.id, 'PSD', accessToken, interactive),
      ]);
    } catch (subErr) {
      console.warn('Error creating default task subfolders:', subErr);
    }

    return mainFolder;
  } catch (error) {
    console.error('Error in createDriveFolder:', error);
    return null;
  }
};

// Upload a file directly to the appropriate subfolder inside the task folder
export const uploadFileToDrive = async (
  arg1: any,
  arg2: any,
  fileType: 'reference' | 'final' | 'general' | 'psd' | 'briefing' = 'general',
  accessToken?: string
): Promise<DriveFileItem | null> => {
  try {
    // Normaliza ordem de argumentos caso venha invertido (ex: folderId, file)
    let file: File = arg1;
    let taskFolderId: string = arg2;

    if (typeof arg1 === 'string' && arg2 && (typeof arg2 === 'object')) {
      taskFolderId = arg1;
      file = arg2;
    }

    if (!file || !taskFolderId) {
      console.warn('uploadFileToDrive: arquivo ou pasta de destino não informados.');
      return null;
    }

    const fileName = (file.name || 'arquivo').toLowerCase();
    const isPsd =
      fileType === 'psd' ||
      fileName.endsWith('.psd') ||
      fileName.endsWith('.psb') ||
      (file.type && (file.type === 'image/vnd.adobe.photoshop' || file.type.includes('photoshop')));

    // Determine appropriate subfolder: Briefing, PSD, or Arquivos Entregues
    const subfolderName =
      fileType === 'reference' || fileType === 'briefing'
        ? 'Briefing'
        : isPsd
        ? 'PSD'
        : 'Arquivos Entregues';

    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, subfolderName, accessToken, true);
    const targetFolderId = subfolder ? subfolder.id : taskFolderId;

    const metadata = {
      name: file.name,
      parents: [targetFolderId],
      description: `Tipo: ${fileType} | Subpasta: ${subfolderName} | Enviado via Sistema de Demandas`,
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    form.append('file', file);

    const response = await driveFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime',
      {
        method: 'POST',
        body: form,
      },
      accessToken,
      true
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Failed to upload file to drive:', err);
      return null;
    }

    const data = await response.json();

    // Make the file publicly viewable so it displays as thumbnail inside the app
    try {
      await driveFetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }, accessToken);
    } catch (permErr) {
      console.warn('Could not set public permission on drive file:', permErr);
    }

    return {
      ...data,
      type: fileType,
    };
  } catch (error) {
    console.error('Error in uploadFileToDrive:', error);
    return null;
  }
};

// List files inside a Google Drive task folder (including subfolders if it's a folder of folders)
export const listDriveFolderFiles = async (
  folderId: string,
  accessToken?: string,
  recursive: boolean = true
): Promise<DriveFileItem[]> => {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=createdTime desc`;

    const response = await driveFetch(url, {}, accessToken);

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Google Drive] Falha ao listar pasta (${folderId}): ${response.status}`, errText);
      return [];
    }

    const data = await response.json();
    const items = data.files || [];

    const directFiles: DriveFileItem[] = [];
    const subfolders: any[] = [];

    for (const item of items) {
      if (item.mimeType === 'application/vnd.google-apps.folder') {
        subfolders.push(item);
      } else {
        directFiles.push({
          ...item,
          type: item.description?.includes('reference')
            ? 'reference'
            : item.description?.includes('final')
            ? 'final'
            : 'general',
        });
      }
    }

    // Se houver subpastas (ex: a pasta no Drive contém pastas por formato ou tema), busca os arquivos de dentro delas também
    if (recursive && subfolders.length > 0) {
      const subFilesArrays = await Promise.all(
        subfolders.map((sf) => listDriveFolderFiles(sf.id, accessToken, false))
      );
      for (const sfFiles of subFilesArrays) {
        directFiles.push(...sfFiles);
      }
    }

    return directFiles;
  } catch (error) {
    console.error('Error listing drive files:', error);
    return [];
  }
};

// List all briefing reference files inside the task's "Briefing" subfolder
export const listTaskBriefingFiles = async (
  taskFolderId?: string,
  taskTitleFallback?: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    let folderId = taskFolderId;
    if (!folderId && taskTitleFallback) {
      const mainFolder = await findDriveFolderByName(taskTitleFallback, undefined, accessToken);
      if (mainFolder) folderId = mainFolder.id;
    }
    if (!folderId) return [];

    const briefingSubfolder = await getOrCreateTaskSubfolder(folderId, 'Briefing', accessToken);
    if (!briefingSubfolder) return [];

    return await listDriveFolderFiles(briefingSubfolder.id, accessToken);
  } catch (e) {
    console.warn('Error fetching task briefing files:', e);
    return [];
  }
};

// List all delivered files inside the task's "Arquivos Entregues" & "PSD" subfolders
export const listTaskDeliveredFiles = async (
  taskFolderId?: string,
  taskTitleFallback?: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    let folderId = taskFolderId;
    if (!folderId && taskTitleFallback) {
      const mainFolder = await findDriveFolderByName(taskTitleFallback, undefined, accessToken);
      if (mainFolder) folderId = mainFolder.id;
    }
    if (!folderId) return [];

    const deliveredSubfolder = await getOrCreateTaskSubfolder(folderId, 'Arquivos Entregues', accessToken);
    const psdSubfolder = await getOrCreateTaskSubfolder(folderId, 'PSD', accessToken);

    const [delFiles, psdFiles] = await Promise.all([
      deliveredSubfolder ? listDriveFolderFiles(deliveredSubfolder.id, accessToken) : [],
      psdSubfolder ? listDriveFolderFiles(psdSubfolder.id, accessToken) : [],
    ]);

    const combined = [...delFiles, ...psdFiles];
    const map = new Map<string, DriveFileItem>();
    combined.forEach((f) => map.set(f.id, f));
    return Array.from(map.values());
  } catch (e) {
    console.warn('Error fetching task delivered files:', e);
    return [];
  }
};


// Delete a folder or file from Google Drive (by ID or by Task Title fallback)
export const deleteDriveFolder = async (
  folderOrFileId?: string,
  folderNameFallback?: string,
  accessToken?: string
): Promise<boolean> => {
  try {
    // 1. If folder ID is provided, delete directly
    if (folderOrFileId) {
      const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${folderOrFileId}`, {
        method: 'DELETE',
      }, accessToken);

      if (response.ok || response.status === 204 || response.status === 404) {
        console.log(`[Google Drive] Pasta ID ${folderOrFileId} excluída com sucesso.`);
        return true;
      }
    }

    // 2. If no folderId or delete failed, search by folder name inside root folder and delete
    if (folderNameFallback) {
      const parentQuery = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID
        ? `and '${GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID}' in parents`
        : '';
      const query = `name = '${folderNameFallback.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentQuery}`;
      
      const searchRes = await driveFetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
        {},
        accessToken
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        for (const file of searchData.files || []) {
          await driveFetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
            method: 'DELETE',
          }, accessToken);
          console.log(`[Google Drive] Pasta "${file.name}" (ID: ${file.id}) excluída com sucesso.`);
        }
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('Error deleting Google Drive folder:', error);
    return false;
  }
};

// Upload employee avatar photo to Google Drive under Funcionarios/{employeeName}/
export const uploadEmployeeAvatarToDrive = async (
  file: File,
  employeeName: string,
  accessToken?: string
): Promise<{ url: string; fileId: string } | null> => {
  try {
    const token = accessToken || await getValidAccessToken(undefined, true);
    if (!token) return null;

    const rootId = GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;

    // 1. Get or create "Funcionarios" root folder
    let funcionariosFolder = await findDriveFolderByName('Funcionarios', rootId, token, true);
    if (!funcionariosFolder) {
      const res = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Funcionarios',
          mimeType: 'application/vnd.google-apps.folder',
          parents: rootId ? [rootId] : [],
        }),
      }, token, true);
      if (!res.ok) return null;
      const d = await res.json();
      funcionariosFolder = { id: d.id, webViewLink: d.webViewLink || '' };
    }

    // 2. Get or create subfolder with employee name
    const safeName = employeeName.trim() || 'Funcionario';
    let empFolder = await findDriveFolderByName(safeName, funcionariosFolder.id, token, true);
    if (!empFolder) {
      const res = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,webViewLink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: safeName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [funcionariosFolder.id],
        }),
      }, token, true);
      if (!res.ok) return null;
      const d = await res.json();
      empFolder = { id: d.id, webViewLink: d.webViewLink || '' };
    }

    // 2.5 Delete old avatars if any exist in the employee folder
    try {
      const q = `'${empFolder.id}' in parents and trashed = false`;
      const listRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, {
        method: 'GET'
      }, token);
      if (listRes.ok) {
        const listData = await listRes.json();
        for (const oldFile of listData.files || []) {
          await driveFetch(`https://www.googleapis.com/drive/v3/files/${oldFile.id}`, {
            method: 'DELETE'
          }, token);
        }
      }
    } catch (e) {
      console.warn("Could not delete old avatars", e);
    }

    // 3. Upload photo file into employee folder
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `avatar.${ext}`;
    const metadata = {
      name: fileName,
      parents: [empFolder.id],
      description: `Avatar de ${safeName}`,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const uploadRes = await driveFetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
      { method: 'POST', body: form },
      token,
      true
    );
    if (!uploadRes.ok) return null;
    const uploadData = await uploadRes.json();
    const fileId = uploadData.id;

    // 4. Make file publicly readable
    try {
      await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'reader', type: 'anyone' }),
      }, token);
    } catch (err) {}

    // 5. Return public URL
    const url = `https://lh3.googleusercontent.com/d/${fileId}`;
    return { url, fileId };
  } catch (err) {
    console.error('Error uploading employee avatar:', err);
    return null;
  }
};

/**
 * Extrai o ID do Google Drive a partir de qualquer formato de URL (arquivo individual ou pasta) ou do próprio ID.
 */
export const extractDriveFileOrFolderId = (urlOrId: string): { id: string; isFolder: boolean } | null => {
  if (!urlOrId) return null;
  const str = urlOrId.trim();

  // Se for link de pasta (/folders/...)
  const folderMatch = str.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { id: folderMatch[1], isFolder: true };
  }

  // Se for link de arquivo (/file/d/... ou /d/...)
  const fileMatch = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return { id: fileMatch[1], isFolder: false };
  }

  // Parâmetro ?id=...
  const idMatch = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return { id: idMatch[1], isFolder: false };
  }

  // Se já for apenas um ID sem barras
  if (!str.includes('/') && str.length >= 15) {
    return { id: str, isFolder: false };
  }

  return null;
};

/**
 * Busca detalhes de um arquivo único do Google Drive
 */
export const getDriveFileDetails = async (
  fileId: string,
  accessToken?: string
): Promise<DriveFileItem | null> => {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description`;
    const response = await driveFetch(url, {}, accessToken);
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.warn('Erro ao obter detalhes do arquivo do Drive:', err);
    return null;
  }
};

/**
 * Extrai o ID da pasta do Google Drive a partir de qualquer formato de URL ou do próprio ID.
 */
export const extractDriveFolderId = (urlOrId: string): string | null => {
  const result = extractDriveFileOrFolderId(urlOrId);
  return result ? result.id : null;
};

/**
 * Lista todos os arquivos contidos em um link do Drive:
 * - Se o link for de uma PASTA: lista todos os arquivos da pasta
 * - Se o link for de um ARQUIVO direto: retorna as informações daquele arquivo
 */
export const fetchDriveItemsFromLink = async (
  urlOrId: string,
  accessToken?: string
): Promise<{ files: DriveFileItem[]; isFolder: boolean }> => {
  try {
    const extracted = extractDriveFileOrFolderId(urlOrId);
    if (!extracted) return { files: [], isFolder: false };

    // Se identificou como pasta pelo link
    if (extracted.isFolder) {
      const files = await listDriveFolderFiles(extracted.id, accessToken);
      return { files, isFolder: true };
    }

    // Tenta primeiro ver os detalhes do arquivo
    const file = await getDriveFileDetails(extracted.id, accessToken);
    if (file) {
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const files = await listDriveFolderFiles(file.id, accessToken);
        return { files, isFolder: true };
      }
      return { files: [file], isFolder: false };
    }

    // Fallback: se for arquivo e não conseguiu via API autenticada (ex: link compartilhado com permissão pública)
    if (!extracted.isFolder) {
      return {
        files: [
          {
            id: extracted.id,
            name: 'Key Visual (Arquivo Google Drive)',
            mimeType: 'image/jpeg',
            thumbnailLink: `https://lh3.googleusercontent.com/d/${extracted.id}`,
            webViewLink: urlOrId,
            webContentLink: `https://drive.google.com/uc?export=download&id=${extracted.id}`,
          },
        ],
        isFolder: false,
      };
    }

    // Se for pasta mas a API não listou itens (ex: sem autenticação), retorna item para preview da pasta
    return { files: [], isFolder: true };
  } catch (err) {
    console.warn('Erro ao buscar itens do link do Drive:', err);
    const extracted = extractDriveFileOrFolderId(urlOrId);
    if (extracted && !extracted.isFolder) {
      return {
        files: [
          {
            id: extracted.id,
            name: 'Key Visual (Arquivo Google Drive)',
            mimeType: 'image/jpeg',
            thumbnailLink: `https://lh3.googleusercontent.com/d/${extracted.id}`,
            webViewLink: urlOrId,
            webContentLink: `https://drive.google.com/uc?export=download&id=${extracted.id}`,
          },
        ],
        isFolder: false,
      };
    }
    return { files: [], isFolder: false };
  }
};

/**
 * Lista todos os arquivos (imagens, vídeos, PSDs, arquivos) contidos em uma pasta de KVs no Google Drive
 */
export const listKvDriveFiles = async (
  folderUrlOrId: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  const res = await fetchDriveItemsFromLink(folderUrlOrId, accessToken);
  return res.files;
};


