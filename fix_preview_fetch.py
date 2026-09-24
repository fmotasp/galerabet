import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

if 'getDriveFileDetails' not in content:
    content = content.replace(
        "import { fetchDriveItemsFromLink, listDriveFolderContents, extractDriveFileOrFolderId, DriveFileItem } from '../../lib/googleDrive';",
        "import { listDriveFolderContents, extractDriveFileOrFolderId, getDriveFileDetails, DriveFileItem } from '../../lib/googleDrive';"
    )

old_fetch = """        const extracted = extractDriveFileOrFolderId(access.siteUrl!);
        if (extracted && extracted.isFolder) {
          const contents = await listDriveFolderContents(extracted.id);
          setDriveFiles(contents);
        } else {
          const result = await fetchDriveItemsFromLink(access.siteUrl!);
          setDriveFiles(result.files || []);
        }"""

new_fetch = """        const extracted = extractDriveFileOrFolderId(access.siteUrl!);
        if (extracted) {
          let folderId = extracted.id;
          
          // Se não foi identificado explicitamente como pasta na URL, pode ser um open?id=... que é pasta
          if (!extracted.isFolder) {
            const details = await getDriveFileDetails(folderId);
            if (details && details.mimeType === 'application/vnd.google-apps.folder') {
               folderId = details.id;
            } else {
               // Se for um arquivo mesmo, não mostra nada (queremos só pastas de jogos)
               setDriveFiles([]);
               setHasFetchedDrive(true);
               setIsLoadingDrive(false);
               return;
            }
          }
          
          const contents = await listDriveFolderContents(folderId);
          setDriveFiles(contents);
        } else {
          setDriveFiles([]);
        }"""

content = content.replace(old_fetch, new_fetch)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated AccessesView to handle any folder link robustly")
