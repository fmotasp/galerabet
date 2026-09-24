import re

with open('src/components/tasks/TasksTableView.tsx', 'r') as f:
    content = f.read()

sort_ui = """          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as 'default' | 'title' | 'dueDate' | 'points')}
              className="appearance-none pl-4 pr-10 py-2.5 bg-[#222222] hover:bg-[#282828] border border-[#303030] rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-[#E4007E] cursor-pointer transition-colors"
            >
              <option value="default">Ordenar: padrão</option>
              <option value="title">Ordenar: nome</option>
              <option value="dueDate">Ordenar: prazo</option>
              <option value="points">Ordenar: pontos</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>"""

content = content.replace(sort_ui, "")

with open('src/components/tasks/TasksTableView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
