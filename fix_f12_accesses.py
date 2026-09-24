import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

old_categories = """  const categories = Array.from(new Set(accesses.map(a => a.category).filter(Boolean))) as string[];"""
new_categories = """  const normalizeCategory = (cat: string) => {
    if (cat === 'F12') return 'F12 Bet';
    return cat;
  };
  const categories = Array.from(new Set(accesses.map(a => a.category).filter(Boolean).map(normalizeCategory))) as string[];"""
content = content.replace(old_categories, new_categories)

old_filter = """    // 1. Filter by category
    if (selectedCategory !== 'all') {
      const cat = acc.category || 'Geral';
      if (selectedCategory === 'Geral' && acc.category) return false;
      if (selectedCategory !== 'Geral' && cat !== selectedCategory) return false;
    }"""
new_filter = """    // 1. Filter by category
    if (selectedCategory !== 'all') {
      const cat = normalizeCategory(acc.category || 'Geral');
      if (selectedCategory === 'Geral' && acc.category) return false;
      if (selectedCategory !== 'Geral' && cat !== selectedCategory) return false;
    }"""
content = content.replace(old_filter, new_filter)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated AccessesView.tsx")
