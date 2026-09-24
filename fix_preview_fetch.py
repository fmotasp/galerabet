import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Update import
if 'listDriveFolderContents' not in content:
    content = content.replace(
        "import { fetchDriveItemsFromLink, DriveFileItem } from '../../lib/googleDrive';",
        "import { fetchDriveItemsFromLink, listDriveFolderContents, extractDriveFileOrFolderId, DriveFileItem } from '../../lib/googleDrive';"
    )

# Update fetch logic
old_fetch = """        const result = await fetchDriveItemsFromLink(access.siteUrl!);
        setDriveFiles(result.files || []);"""

new_fetch = """        const extracted = extractDriveFileOrFolderId(access.siteUrl!);
        if (extracted && extracted.isFolder) {
          const contents = await listDriveFolderContents(extracted.id);
          setDriveFiles(contents);
        } else {
          const result = await fetchDriveItemsFromLink(access.siteUrl!);
          setDriveFiles(result.files || []);
        }"""
        
content = content.replace(old_fetch, new_fetch)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated AccessesView to use listDriveFolderContents")
