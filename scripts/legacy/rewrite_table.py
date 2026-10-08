import re

with open('src/components/tasks/TasksTableView.tsx', 'r') as f:
    content = f.read()

# Add Star icon import if not present
if 'Star' not in content:
    content = content.replace('Trash2,', 'Trash2, Star,')

# Replace the table view container
# We want to replace from {/* Table View Container */} to the end of the </div> that encloses it
start_marker = "{/* Table View Container */}"
end_marker = "      {/* Infinite Scroll Sentinel */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

new_table = """{/* Table View Container - Styled like the screenshot */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden text-slate-800 font-sans">
        
        {/* Header "Este mês" */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <h2 className="text-[#3b82f6] text-xl font-medium tracking-tight">Este mês</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-medium text-sm">
                <th className="w-1 px-0 py-3"></th>
                <th className="px-4 py-3 min-w-[250px] font-medium"></th>
                <th className="px-4 py-3 w-16 text-center font-medium">Resp.</th>
                <th className="px-4 py-3 min-w-[140px] text-center font-medium">Status</th>
                <th className="px-4 py-3 min-w-[140px] text-center font-medium">Timeline</th>
                <th className="px-4 py-3 min-w-[100px] text-center font-medium">Prazo</th>
                <th className="px-4 py-3 min-w-[120px] text-center font-medium">Prioridade</th>
                <th className="px-4 py-3 w-12 text-center text-slate-400">
                  <div className="flex justify-center"><div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center text-white text-lg leading-none cursor-pointer hover:bg-slate-400">+</div></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-700">Nenhuma demanda encontrada</h3>
                    <p className="text-sm text-slate-500 mt-1">Não há tarefas correspondentes aos filtros selecionados.</p>
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((task) => {
                  const statusConfig = getSpineStatusConfig(task.status);
                  
                  // Status style mapping based on standard names or fallback to config
                  let statusBg = 'bg-slate-400';
                  let statusText = 'text-white';
                  let statusLabel = statusConfig.label;
                  
                  const sLabel = statusLabel.toLowerCase();
                  if (sLabel.includes('feito') || sLabel.includes('conclu') || sLabel.includes('done')) {
                    statusBg = 'bg-[#00c875]'; // Green
                    statusLabel = 'Feito';
                  } else if (sLabel.includes('andamento') || sLabel.includes('progress')) {
                    statusBg = 'bg-[#fdab3d]'; // Orange
                    statusLabel = 'Em andamento';
                  } else if (sLabel.includes('parado') || sLabel.includes('block')) {
                    statusBg = 'bg-[#e2445c]'; // Red
                    statusLabel = 'Parado';
                  } else if (sLabel.includes('fazer') || sLabel.includes('todo')) {
                    statusBg = 'bg-[#c4c4c4]'; // Gray
                    statusLabel = 'A fazer';
                  } else {
                    // Fallback to configured colors if available
                    if (statusConfig.bg) {
                       statusBg = statusConfig.bg.replace('bg-', 'bg-').replace('/20', '');
                    }
                  }

                  // Timeline percentage
                  let timelinePct = 0;
                  if (statusBg === 'bg-[#00c875]') timelinePct = 100;
                  else if (statusBg === 'bg-[#fdab3d]') timelinePct = 60;
                  else if (statusBg === 'bg-[#e2445c]') timelinePct = 20;

                  // Format Due Date
                  let formattedDate = 'Sem prazo';
                  if (task.dueDate && task.dueDate !== 'Sem prazo') {
                    try {
                      // Attempt to parse e.g. "2026-05-12" or similar
                      const d = new Date(task.dueDate);
                      if (!isNaN(d.getTime())) {
                        const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
                        formattedDate = `${d.getDate()} ${months[d.getMonth()]}`;
                      } else {
                        formattedDate = task.dueDate;
                      }
                    } catch (e) {
                      formattedDate = task.dueDate;
                    }
                  }

                  // Priority stars (1 to 5)
                  const priorityMap: Record<string, number> = {
                    low: 1,
                    medium: 2,
                    high: 4,
                    critical: 5
                  };
                  let stars = task.points || priorityMap[task.priority] || 3;
                  if (stars > 5) stars = 5;
                  if (stars < 1) stars = 1;

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setEditingTask(task)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      {/* Left border indicator */}
                      <td className="p-0">
                        <div className="w-1 h-12 bg-blue-500 mx-auto rounded-full"></div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-2">
                        <div className="text-[15px] font-normal text-slate-700 truncate max-w-[300px]">
                          {task.title}
                        </div>
                      </td>

                      {/* Avatar */}
                      <td className="px-4 py-2">
                        <div className="flex justify-center">
                          <TaskMembersStack task={task} max={1} />
                        </div>
                      </td>

                      {/* Status Block */}
                      <td className="px-0 py-2" onClick={(e) => e.stopPropagation()}>
                        <div className={`w-full py-2 px-2 flex items-center justify-center text-white text-sm font-medium ${statusBg}`}>
                          <select
                            value={task.status}
                            onChange={(e) => moveTaskStatus(task.id, e.target.value as any)}
                            className="bg-transparent border-none text-white text-center appearance-none cursor-pointer focus:outline-none w-full text-center text-sm font-medium"
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          >
                            {spineStatuses.map((s) => (
                              <option key={s.id} value={s.id} className="text-slate-800 bg-white text-sm">
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center">
                          <div className="w-[80%] h-4 bg-slate-300 rounded-full overflow-hidden flex">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${timelinePct}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Prazo */}
                      <td className="px-4 py-2 text-center text-sm text-slate-600">
                        {formattedDate}
                      </td>

                      {/* Prioridade Stars */}
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= stars ? 'fill-[#ffcc00] text-[#ffcc00]' : 'fill-slate-300 text-slate-300'}`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Empty column for + */}
                      <td className="px-4 py-2 border-l border-slate-100/50">
                        <div className="w-full h-full"></div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

"""

new_content = content[:start_idx] + new_table + content[end_idx:]

with open('src/components/tasks/TasksTableView.tsx', 'w') as f:
    f.write(new_content)
print("Updated successfully")
