import re

with open('src/components/tasks/TasksTableView.tsx', 'r') as f:
    content = f.read()

old_logic = """                  const statusConfig = getSpineStatusConfig(task.status);
                  
                  // Decode dynamic label color or fallback
                  const pillColor = `${statusConfig.bg || 'bg-slate-800'} ${statusConfig.color || 'text-slate-200'} border border-current/20`;"""

new_logic = """                  const statusConfig = getSpineStatusConfig(task.status);
                  let statusBg = 'bg-slate-400';
                  let statusLabel = statusConfig.label;
                  const sLabel = statusLabel.toLowerCase();
                  if (sLabel.includes('feito') || sLabel.includes('conclu') || sLabel.includes('done')) {
                    statusBg = 'bg-[#00c875]'; // Green
                  } else if (sLabel.includes('andamento') || sLabel.includes('process') || sLabel.includes('doing') || sLabel.includes('produ') || sLabel.includes('revis')) {
                    statusBg = 'bg-[#fdab3d]'; // Orange
                  } else if (sLabel.includes('parado') || sLabel.includes('stuck') || sLabel.includes('block') || sLabel.includes('pend')) {
                    statusBg = 'bg-[#e2445c]'; // Red
                  } else {
                    statusBg = 'bg-slate-700'; // Gray
                  }
                  const pillColor = `${statusBg} text-white border-transparent shadow-sm`;"""

content = content.replace(old_logic, new_logic)

with open('src/components/tasks/TasksTableView.tsx', 'w') as f:
    f.write(content)

print("Status color fixed")
