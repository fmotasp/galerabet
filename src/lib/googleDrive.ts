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
            } catch {}

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

// Get stored access token or request one
export const getValidAccessToken = async (clientId?: string): Promise<string | null> => {
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

  return await requestDriveToken(clientId);
};

// Helper fetch wrapper to handle Google Drive token expiry and automatically request a new one on 401
const driveFetch = async (url: string, options: RequestInit = {}, customToken?: string): Promise<Response> => {
  let token = customToken || localStorage.getItem('spine_google_access_token');
  if (!token) {
    token = await getValidAccessToken();
  }
  if (!token) {
    throw new Error('No Google Drive access token available');
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  } as any;

  let response = await fetch(url, { ...options, headers });

  // If unauthorized (401), token has probably expired (expires in 1 hour).
  if (response.status === 401) {
    console.warn('Google Drive token expired or invalid (401). Refreshing token...');
    localStorage.removeItem('spine_google_access_token');
    const newToken = await requestDriveToken();
    if (newToken) {
      const retryHeaders = {
        ...(options.headers || {}),
        Authorization: `Bearer ${newToken}`,
      } as any;
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  return response;
};

// Find existing task folder in Google Drive by name to prevent duplicates
export const findDriveFolderByName = async (
  folderName: string,
  parentFolderId?: string,
  accessToken?: string
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    const parentId = parentFolderId || GOOGLE_DRIVE_CONFIG.ROOT_FOLDER_ID;
    const parentQuery = parentId ? `and '${parentId}' in parents` : '';
    const cleanName = folderName.replace(/'/g, "\\'");
    const query = `name = '${cleanName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false ${parentQuery}`;

    const response = await driveFetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,webViewLink)&pageSize=1`,
      {},
      accessToken
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
  accessToken?: string
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    const existing = await findDriveFolderByName(subfolderName, taskFolderId, accessToken);
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
    }, accessToken);

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
      }, accessToken);
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
    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, 'Arquivos Entregues', accessToken);
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
    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, 'Briefing', accessToken);
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
  accessToken?: string
): Promise<{ id: string; webViewLink: string } | null> => {
  try {
    // 1. Check if root task folder already exists with this exact name
    let mainFolder = await findDriveFolderByName(folderName, parentFolderId, accessToken);
    
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
      }, accessToken);

      if (!response.ok) {
        const err = await response.json();
        console.error('Failed to create drive folder:', err);
        return null;
      }

      const data = await response.json();
      mainFolder = { id: data.id, webViewLink: data.webViewLink || `https://drive.google.com/drive/folders/${data.id}` };

      // Make root task folder publicly editable
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
        }, accessToken);
      } catch (permErr) {
        console.warn('Could not set public edit permission on drive folder:', permErr);
      }
    }

    // 2. Automatically ensure the 3 subfolders exist inside this task folder: "Briefing", "Arquivos Entregues", and "PSD"
    try {
      await Promise.all([
        getOrCreateTaskSubfolder(mainFolder.id, 'Briefing', accessToken),
        getOrCreateTaskSubfolder(mainFolder.id, 'Arquivos Entregues', accessToken),
        getOrCreateTaskSubfolder(mainFolder.id, 'PSD', accessToken),
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
  file: File,
  taskFolderId: string,
  fileType: 'reference' | 'final' | 'general' | 'psd' = 'general',
  accessToken?: string
): Promise<DriveFileItem | null> => {
  try {
    const isPsd =
      fileType === 'psd' ||
      file.name.toLowerCase().endsWith('.psd') ||
      file.name.toLowerCase().endsWith('.psb') ||
      file.type === 'image/vnd.adobe.photoshop' ||
      file.type.includes('photoshop');

    // Determine appropriate subfolder: Briefing, PSD, or Arquivos Entregues
    const subfolderName =
      fileType === 'reference'
        ? 'Briefing'
        : isPsd
        ? 'PSD'
        : 'Arquivos Entregues';

    const subfolder = await getOrCreateTaskSubfolder(taskFolderId, subfolderName, accessToken);
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
      accessToken
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

// List files inside a Google Drive task folder
export const listDriveFolderFiles = async (
  folderId: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=createdTime desc`;

    const response = await driveFetch(url, {}, accessToken);

    if (!response.ok) return [];

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      ...f,
      type: f.description?.includes('reference')
        ? 'reference'
        : f.description?.includes('final')
        ? 'final'
        : 'general',
    }));
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
