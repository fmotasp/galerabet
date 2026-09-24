import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

if 'Filter' not in content:
    content = content.replace("import { Search, Plus", "import { Search, Plus, Filter")

# Add state
state_block = """  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);"""
content = content.replace("  const [localSearch, setLocalSearch] = useState('');\n  const [isModalOpen, setIsModalOpen] = useState(false);", state_block)

# Add categories extraction and modify filter logic
old_filter_logic = """  const filteredAccesses = accesses.filter((acc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  });"""

new_filter_logic = """  const categories = Array.from(new Set(accesses.map(a => a.category).filter(Boolean))) as string[];
  
  const filteredAccesses = accesses.filter((acc) => {
    // 1. Filter by category
    if (selectedCategory !== 'all') {
      const cat = acc.category || 'Geral';
      if (selectedCategory === 'Geral' && acc.category) return false;
      if (selectedCategory !== 'Geral' && cat !== selectedCategory) return false;
    }

    // 2. Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  });"""
content = content.replace(old_filter_logic, new_filter_logic)

# Add Select UI
old_search_ui = """        <div className="flex items-center gap-3">
          <div className="relative">"""

new_search_ui = """        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="relative">
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
          </div>
          <div className="relative">"""
content = content.replace(old_search_ui, new_search_ui)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
