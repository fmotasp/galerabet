import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# 1. Remove Acessar site from first column
link_html = """            {hasUrl && (
              <button onClick={handleVisitSite} className="text-left text-[11px] text-[#3b82f6] hover:underline flex items-center gap-1 mt-0.5">
                <LinkIcon className="w-3 h-3" /> Acessar site
              </button>
            )}"""
content = content.replace(link_html, "")

# 2. Modify Login column
# Old: <span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded truncate max-w-[150px]">{access.login}</span>
# New: <span className="text-sm text-slate-700 font-mono break-all">{access.login}</span>
content = content.replace('<span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded truncate max-w-[150px]">{access.login}</span>', '<span className="text-sm text-slate-700 font-mono break-all">{access.login}</span>')

# 3. Modify Password column
# Old: <span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-24 text-center">
# New: <span className="text-sm text-slate-700 font-mono min-w-[80px]">
content = content.replace('<span className="text-sm text-slate-700 font-mono bg-slate-100 px-2 py-1 rounded w-24 text-center">', '<span className="text-sm text-slate-700 font-mono min-w-[80px]">')

# 4. Add Acessar site button to actions column
# Old actions:
old_actions = """        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>"""

new_actions = """        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {hasUrl && (
            <button onClick={handleVisitSite} className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 bg-[#3b82f6]/10 text-[#3b82f6] rounded hover:bg-[#3b82f6]/20 transition-colors" title="Acessar site">
              <LinkIcon className="w-3.5 h-3.5" /> Acessar
            </button>
          )}
          <button onClick={() => onEdit(access)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded transition-colors" title="Editar">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => { if (window.confirm('Excluir este acesso?')) onDelete(access.id); }} className="p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded transition-colors" title="Excluir">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>"""
content = content.replace(old_actions, new_actions)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
