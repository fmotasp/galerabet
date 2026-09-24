import re

with open('src/components/tasks/TasksTableView.tsx', 'r') as f:
    content = f.read()

# Remove the header with the +
th_plus = """<th className="px-4 py-3 w-12 text-center text-slate-400">
                  <div className="flex justify-center"><div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-white text-lg leading-none cursor-pointer hover:bg-slate-400">+</div></div>
                </th>"""
content = content.replace(th_plus, "")

# Remove the empty cell in each row
td_plus = """                      {/* Empty column for + */}
                      <td className="px-4 py-2 border-l border-slate-100/50">
                        <div className="w-full h-full"></div>
                      </td>"""
content = content.replace(td_plus, "")

# Update colspan to 5
content = content.replace('colSpan={6}', 'colSpan={5}')

with open('src/components/tasks/TasksTableView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
