import re

with open('src/components/tasks/TasksTableView.tsx', 'r') as f:
    content = f.read()

# 1. Remove "Este mês" header
header_block = """        {/* Header "Este mês" */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-[#3b82f6] text-xl font-medium tracking-tight">Este mês</h2>
        </div>"""
content = content.replace(header_block, "")

# 2. Remove "Timeline" from Table Headers
th_timeline = """<th className="px-4 py-3 min-w-[140px] text-center font-medium">Timeline</th>"""
content = content.replace(th_timeline, "")

# 3. Remove "Prioridade" from Table Headers
th_priority = """<th className="px-4 py-3 min-w-[120px] text-center font-medium">Prioridade</th>"""
content = content.replace(th_priority, "")

# 4. Remove Timeline cell
td_timeline = """                      {/* Timeline */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center">
                          <div className="w-[80%] h-4 bg-slate-300 rounded-full overflow-hidden flex">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${timelinePct}%` }}></div>
                          </div>
                        </div>
                      </td>"""
content = content.replace(td_timeline, "")

# 5. Remove Prioridade Stars cell
td_priority = """                      {/* Prioridade Stars */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= stars ? 'fill-[#ffcc00] text-[#ffcc00]' : 'fill-slate-300 text-slate-300'}`}
                            />
                          ))}
                        </div>
                      </td>"""
content = content.replace(td_priority, "")

# Update colspan for the empty state
content = content.replace('colSpan={8}', 'colSpan={6}')

with open('src/components/tasks/TasksTableView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
