import re

with open('src/lib/googleDrive.ts', 'r') as f:
    content = f.read()

new_function = """export const listDriveFolderContents = async (
  folderId: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=folder,name`;

    const response = await driveFetch(url, {}, accessToken);

    if (!response.ok) {
      console.warn(`[Google Drive] Falha ao listar conteúdos da pasta (${folderId})`);
      return [];
    }

    const data = await response.json();
    return (data.files || []).map((item: any) => ({
      ...item,
      type: 'general'
    }));
  } catch (error) {
    console.error('Error listing drive contents:', error);
    return [];
  }
};

"""

# Insert before fetchDriveItemsFromLink
content = content.replace("export const fetchDriveItemsFromLink = async (", new_function + "export const fetchDriveItemsFromLink = async (")

with open('src/lib/googleDrive.ts', 'w') as f:
    f.write(content)

print("Added listDriveFolderContents")
