import re

with open('src/components/tasks/TasksView.tsx', 'r') as f:
    content = f.read()

# Pass setActiveFilter
content = content.replace("activeFilter,\n  });", "activeFilter,\n    setActiveFilter,\n  });")

# Remove the banner completely
# The banner looks like:
#       {/* Quick Active Filter Pill (Cmd+K: Minhas Tarefas / Alertas) */}
#       {activeFilter !== 'all' && (
#         <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#181818] border border-[#2E2E2E] rounded-2xl w-full sm:w-auto animate-in fade-in slide-in-from-top-1">
#           ...
#           </button>
#         </div>
#       )}

banner_regex = re.compile(r"\{\/\* Quick Active Filter Pill.*?\n\s*\{\s*activeFilter \!\=\= \'all\'.*?<\/button>\n\s*<\/div>\n\s*\)\}", re.DOTALL)
if banner_regex.search(content):
    content = banner_regex.sub("", content)
else:
    print("WARNING: Could not find banner regex")

with open('src/components/tasks/TasksView.tsx', 'w') as f:
    f.write(content)

print("Updated TasksView.tsx")
