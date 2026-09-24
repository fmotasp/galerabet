import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Refactoring AccessRow
old_row_start = """  const hasUrl = !!access.siteUrl;

  return (
    <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="p-0">
        <div className="w-1 h-12 bg-blue-500 mx-auto rounded-full"></div>
      </td>"""

new_row_start = """  const hasUrl = !!access.siteUrl;

  const cat = access.category ? access.category.toLowerCase() : '';
  let colorClass = "text-slate-600 bg-slate-50 border-slate-200";
  let indicatorBg = "bg-slate-400";
  
  if (cat.includes("plataforma")) {
    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200";
    indicatorBg = "bg-emerald-500";
  } else if (cat.includes("provedor")) {
    colorClass = "text-violet-600 bg-violet-50 border-violet-200";
    indicatorBg = "bg-violet-500";
  } else if (cat.includes("sistema")) {
    colorClass = "text-blue-600 bg-blue-50 border-blue-200";
    indicatorBg = "bg-blue-500";
  } else if (cat.includes("banco") || cat.includes("financeiro")) {
    colorClass = "text-amber-600 bg-amber-50 border-amber-200";
    indicatorBg = "bg-amber-500";
  } else {
    indicatorBg = "bg-slate-400";
  }

  return (
    <tr className="hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0">
      <td className="p-0">
        <div className={`w-1 h-12 ${indicatorBg} mx-auto rounded-full`}></div>
      </td>"""

content = content.replace(old_row_start, new_row_start)

# Now remove the old category logic
old_cat_td = """      <td className="px-4 py-3">
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

new_cat_td = """      <td className="px-4 py-3">
        {access.category ? (
          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold tracking-wider border rounded-md uppercase ${colorClass}`}>
            {access.category}
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Geral</span>
        )}
      </td>"""

content = content.replace(old_cat_td, new_cat_td)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
