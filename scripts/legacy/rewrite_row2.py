import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# 1. Make actions always visible
# Replace `opacity-0 group-hover:opacity-100 transition-opacity` with just empty or remove it.
old_actions_class = 'className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"'
new_actions_class = 'className="flex items-center justify-end gap-2"'
content = content.replace(old_actions_class, new_actions_class)

# 2. Dynamic colors for Category
# Old code:
old_cat = """      <td className="px-4 py-3">
        {access.category ? (
           <span className="inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md uppercase">
             {access.category}
           </span>
        ) : (
           <span className="text-slate-400 text-xs">Geral</span>
        )}
      </td>"""

# I need to insert a function to determine colors inside AccessRow or just directly in the render.
# Let's write a small script inside the render for dynamic color.
new_cat = """      <td className="px-4 py-3">
        {(() => {
           if (!access.category) return <span className="text-slate-400 text-xs">Geral</span>;
           
           const cat = access.category.toLowerCase();
           let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200"; // default
           
           if (cat.includes("plataforma")) {
             colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
           } else if (cat.includes("provedor")) {
             colorClass = "text-violet-600 bg-violet-50 border-violet-200";
           } else if (cat.includes("sistema")) {
             colorClass = "text-blue-600 bg-blue-50 border-blue-200";
           } else if (cat.includes("banco") || cat.includes("financeiro")) {
             colorClass = "text-amber-600 bg-amber-50 border-amber-200";
           } else {
             colorClass = "text-slate-600 bg-slate-50 border-slate-200";
           }
           
           return (
             <span className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-md uppercase ${colorClass}`}>
               {access.category}
             </span>
           );
        })()}
      </td>"""

content = content.replace(old_cat, new_cat)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
