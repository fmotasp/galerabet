import re

with open('src/lib/googleDrive.ts', 'r') as f:
    content = f.read()

old_list_logic = """export const listDriveFolderContents = async (
  folderId: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    const query = `'${folderId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=folder,name`;"""

new_list_logic = """export const listDriveFolderContents = async (
  folderId: string,
  accessToken?: string
): Promise<DriveFileItem[]> => {
  try {
    # We explicitly request only folders to make it blazingly fast and match user requirement
    const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      query
    )}&supportsAllDrives=true&includeItemsFromAllDrives=true&pageSize=1000&fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,iconLink,size,createdTime,description)&orderBy=name`;"""

new_list_logic = new_list_logic.replace("# We explicitly request", "// We explicitly request")

content = content.replace(old_list_logic, new_list_logic)

with open('src/lib/googleDrive.ts', 'w') as f:
    f.write(content)

print("Updated listDriveFolderContents query")
