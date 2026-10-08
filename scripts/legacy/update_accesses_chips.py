import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Add registeredClients to useApp extraction
if 'registeredClients' not in content:
    content = content.replace("const { globalSearchQuery } = useApp();", "const { globalSearchQuery, registeredClients } = useApp();")

# Replace categories mapping to include icons
old_chips = """            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-gradient-to-r from-[#E4007E] to-[#ff4d4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#333]'}`}
              >
                {c}
              </button>
            ))}"""

new_chips = """            {categories.map((c) => {
              const clientData = registeredClients?.find(client => client.name.toLowerCase() === c.toLowerCase() || client.id === c);
              return (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === c ? 'bg-gradient-to-r from-[#E4007E] to-[#ff4d4d] text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-[#333]'}`}
              >
                {clientData?.icon ? (
                    <img
                      src={clientData.icon}
                      alt={c}
                      className="w-4 h-4 rounded-md object-contain shrink-0 drop-shadow-xs"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                ) : null}
                {c}
              </button>
              );
            })}"""

content = content.replace(old_chips, new_chips)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated AccessesView chips to include client icons")
