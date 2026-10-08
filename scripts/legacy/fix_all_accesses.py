import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()


# --- 1. Fix hover button ---
old_hover_btn = """<a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity" title="Acessar no Drive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 hover:text-white">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                      <path d="M12 12v9"></path>
                      <path d="m8 17 4 4 4-4"></path>
                    </svg>
                  </a>"""

new_hover_btn = """<a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-3 flex items-center opacity-0 group-hover/file:opacity-100 transition-opacity px-2 py-1 bg-[#222] text-slate-300 hover:bg-[#333] hover:text-white rounded text-[10px] font-bold border border-[#333]" title="Acessar no Drive">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
                      <path d="M12 12v9"></path>
                      <path d="m8 17 4 4 4-4"></path>
                    </svg>
                    ABRIR
                  </a>"""
content = content.replace(old_hover_btn, new_hover_btn)

# --- 2. Fix Search Index ---
# Replace state
old_state = """  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Access | null>(null);

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);"""

new_state = """  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccess, setEditingAccess] = useState<Access | null>(null);
  const [driveIndex, setDriveIndex] = useState<Record<string, DriveFileItem[]>>({});

  useEffect(() => {
    fetchAccesses();
  }, [fetchAccesses]);

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
                } else continue;
              }
              const contents = await listDriveFolderContents(folderId);
              newIndex[a.id] = contents;
              setDriveIndex(prev => ({ ...prev, [a.id]: contents }));
            }
          } catch (e) {}
        }
      }
    };
    if (accesses.length > 0) fetchAllDrive();
  }, [accesses]);"""

content = content.replace(old_state, new_state)

# Replace filter logic
old_filter = """    // 2. Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );"""

new_filter = """    // 2. Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchDrive = driveIndex[acc.id] && driveIndex[acc.id].some(f => f.name.toLowerCase().includes(q));
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q) ||
      matchDrive
    );"""
content = content.replace(old_filter, new_filter)

# Pass preloadedDriveFiles to AccessRow
content = content.replace("onEdit={handleEdit} onDelete={deleteAccess} />", "preloadedDriveFiles={driveIndex[acc.id]} onEdit={handleEdit} onDelete={deleteAccess} />")


# --- 3. Replace category <select> with chips ---
old_select = """          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#1A1A1A] border border-[#333] text-sm text-white rounded-lg pl-9 pr-8 py-2 focus:outline-none focus:border-[#E4007E] focus:ring-1 focus:ring-[#E4007E] transition-all appearance-none cursor-pointer"
            >
              <option value="all">Todas categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Geral">Geral (Sem categoria)</option>
            </select>
          </div>"""

# Since the screenshot shows chips: "Todos", "Brasil Bet", "Caixa Bet", "Luva Bet" (which looks like active bg-[#E4007E])
# We will create a scrollable row of pills
new_chips = """          <div className="flex items-center gap-1.5 bg-[#222] p-1 rounded-xl overflow-x-auto shrink-0 max-w-full hide-scrollbar border border-[#333]">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-gradient-to-r from-[#E4007E] to-[#ff4d4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#333]'}`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-gradient-to-r from-[#E4007E] to-[#ff4d4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#333]'}`}
              >
                {c}
              </button>
            ))}
            <button
              onClick={() => setSelectedCategory('Geral')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'Geral' ? 'bg-gradient-to-r from-[#E4007E] to-[#ff4d4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#333]'}`}
            >
              Geral
            </button>
          </div>"""

# we need to make sure the header area accommodates the chips properly.
# Currently the header is:
# <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
content = content.replace(old_select, new_chips)


with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("All fixes applied")
