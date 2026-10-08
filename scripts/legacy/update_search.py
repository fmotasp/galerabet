import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()


old_state = """  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');"""

new_state = """  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [driveIndex, setDriveIndex] = useState<Record<string, DriveFileItem[]>>({});
  
  // Background fetch para indexar as pastas do Drive e permitir busca
  useEffect(() => {
    const fetchAllDrive = async () => {
      const driveAccesses = accesses.filter(a => a.siteUrl && a.siteUrl.includes('drive.google.com'));
      const newIndex = { ...driveIndex };
      
      for (const a of driveAccesses) {
        if (!newIndex[a.id]) {
          try {
            const extracted = extractDriveFileOrFolderId(a.siteUrl!);
            if (extracted) {
              let folderId = extracted.id;
              if (!extracted.isFolder) {
                const details = await getDriveFileDetails(folderId);
                if (details && details.mimeType === 'application/vnd.google-apps.folder') {
                  folderId = details.id;
                } else {
                  continue;
                }
              }
              const contents = await listDriveFolderContents(folderId);
              newIndex[a.id] = contents;
              // Atualiza o estado progressivamente para o usuário já ir pesquisando
              setDriveIndex(prev => ({ ...prev, [a.id]: contents }));
            }
          } catch (e) {
            console.warn('Erro ao indexar pasta do Drive em background', e);
          }
        }
      }
    };
    if (accesses.length > 0) {
      fetchAllDrive();
    }
  }, [accesses]);"""

content = content.replace(old_state, new_state)

# Now update the filter logic
old_filter = """  const filteredAccesses = useMemo(() => {
    let filtered = accesses;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }"""

new_filter = """  const filteredAccesses = useMemo(() => {
    let filtered = accesses;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) => {
          const matchTitle = a.title.toLowerCase().includes(q) || (a.category?.toLowerCase() || '').includes(q);
          const matchDrive = driveIndex[a.id] && driveIndex[a.id].some(file => file.name.toLowerCase().includes(q));
          return matchTitle || matchDrive;
        }
      );
    }"""
    
content = content.replace(old_filter, new_filter)


# Now in AccessRow, we can reuse the driveIndex if it's already fetched
old_row_fetch = """        const extracted = extractDriveFileOrFolderId(access.siteUrl!);
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
        
# Actually wait, we can pass driveIndex[access.id] to AccessRow, but AccessRow is defined above AccessesView in the same file.
# Let's pass preloadedDriveFiles to AccessRow
# First modify AccessRow props

old_row_props = """const AccessRow: React.FC<{ access: Access; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, onEdit, onDelete }) => {"""
new_row_props = """const AccessRow: React.FC<{ access: Access; preloadedDriveFiles?: DriveFileItem[]; onEdit: (a: Access) => void; onDelete: (id: string) => void }> = ({ access, preloadedDriveFiles, onEdit, onDelete }) => {"""
content = content.replace(old_row_props, new_row_props)

old_row_toggle = """  const toggleExpand = async () => {
    if (!isExpanded && isDriveLink && !hasFetchedDrive) {
      setIsLoadingDrive(true);
      try {
        const extracted = extractDriveFileOrFolderId(access.siteUrl!);"""

new_row_toggle = """  const toggleExpand = async () => {
    if (!isExpanded && isDriveLink && !hasFetchedDrive) {
      if (preloadedDriveFiles) {
        setDriveFiles(preloadedDriveFiles);
        setHasFetchedDrive(true);
        setIsExpanded(true);
        return;
      }
      setIsLoadingDrive(true);
      try {
        const extracted = extractDriveFileOrFolderId(access.siteUrl!);"""

content = content.replace(old_row_toggle, new_row_toggle)

# Now pass preloadedDriveFiles from the map
old_map = """                    <AccessRow
                      key={access.id}
                      access={access}
                      onEdit={setEditingAccess}
                      onDelete={handleDelete}
                    />"""
new_map = """                    <AccessRow
                      key={access.id}
                      access={access}
                      preloadedDriveFiles={driveIndex[access.id]}
                      onEdit={setEditingAccess}
                      onDelete={handleDelete}
                    />"""

content = content.replace(old_map, new_map)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated AccessesView to support background drive indexing and search")
