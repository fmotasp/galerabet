import re

with open('src/components/tasks/useTasksFilter.ts', 'r') as f:
    content = f.read()

old_sync = """  // Sync global activeFilter (from Cmd+K or Dashboard) to local selectedMember
  useEffect(() => {
    if (activeFilter === 'mine') {
      setSelectedMember('mine');
      if (setActiveFilter) setActiveFilter('all');
    }
  }, [activeFilter, setActiveFilter]);"""

new_sync = """  // Sync global activeFilter (from Cmd+K or Dashboard) to local selectedMember
  useEffect(() => {
    if (activeFilter === 'mine') {
      setSelectedMember('mine');
      if (setActiveFilter) setActiveFilter('all');
    } else if (activeFilter === 'flagged') {
      // User requested to remove the banner, so there's no UI to clear this.
      // We'll just reset it immediately to prevent getting trapped.
      if (setActiveFilter) setActiveFilter('all');
    }
  }, [activeFilter, setActiveFilter]);"""

content = content.replace(old_sync, new_sync)

# Ensure the flagged logic is also removed since it gets cleared anyway, but just in case:
# (Already handled, but let's be sure)

with open('src/components/tasks/useTasksFilter.ts', 'w') as f:
    f.write(content)

print("Updated flagged logic")
