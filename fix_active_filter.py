import re

with open('src/components/tasks/useTasksFilter.ts', 'r') as f:
    content = f.read()

# Add setActiveFilter to props
old_props = """  currentUser: CurrentUserType | null;
  activeFilter: 'all' | 'mine' | 'flagged';
}"""
new_props = """  currentUser: CurrentUserType | null;
  activeFilter: 'all' | 'mine' | 'flagged';
  setActiveFilter?: (filter: 'all' | 'mine' | 'flagged') => void;
}"""
content = content.replace(old_props, new_props)

old_destruct = """  spineStatuses,
  currentUser,
  activeFilter,
}: UseTasksFilterProps) => {"""
new_destruct = """  spineStatuses,
  currentUser,
  activeFilter,
  setActiveFilter,
}: UseTasksFilterProps) => {"""
content = content.replace(old_destruct, new_destruct)

# Map activeFilter changes to selectedMember and reset it
sync_effect = """
  // Sync global activeFilter (from Cmd+K or Dashboard) to local selectedMember
  useEffect(() => {
    if (activeFilter === 'mine') {
      setSelectedMember('mine');
      if (setActiveFilter) setActiveFilter('all');
    }
  }, [activeFilter, setActiveFilter]);
"""

# Insert sync effect before selectedMember state
content = content.replace("  const [searchQuery, setSearchQuery] = useState<string>('');", sync_effect + "  const [searchQuery, setSearchQuery] = useState<string>('');")

# Remove activeFilter from the actual filter logic (since we only use selectedMember now, and flagged is dropped or ignored as per user request to only use the top box)
old_active_filter_logic = """      // Quick Active Filter (Cmd+K / Palette Filter: All, Mine, Flagged/Alerts)
      let matchesActiveFilter = true;
      if (activeFilter === 'mine') {
        matchesActiveFilter = isTaskAssignedToMe(t, currentUser);
      } else if (activeFilter === 'flagged') {
        const overdue = isTaskOverdue(t);
        const isUrgent = Boolean(t.isFlagged);
        let isSoonDue = false;
        const parsedDate = parseTaskDueDate(t.dueDate);
        if (parsedDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diff = parsedDate.getTime() - today.getTime();
          if (diff > 0 && diff <= 2 * 24 * 60 * 60 * 1000) isSoonDue = true;
        }
        matchesActiveFilter = isUrgent || overdue || isSoonDue;
      }

      return matchesClient && matchesMember && matchesSearch && matchesActiveFilter;"""

new_active_filter_logic = """      // Flagged/Alerts is handled here, but if activeFilter is 'flagged', we apply it silently. 
      // Note: 'mine' is now handled by selectedMember so activeFilter won't be 'mine' here.
      let matchesActiveFilter = true;
      if (activeFilter === 'flagged') {
        const overdue = isTaskOverdue(t);
        const isUrgent = Boolean(t.isFlagged);
        let isSoonDue = false;
        const parsedDate = parseTaskDueDate(t.dueDate);
        if (parsedDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diff = parsedDate.getTime() - today.getTime();
          if (diff > 0 && diff <= 2 * 24 * 60 * 60 * 1000) isSoonDue = true;
        }
        matchesActiveFilter = isUrgent || overdue || isSoonDue;
      }

      return matchesClient && matchesMember && matchesSearch && matchesActiveFilter;"""

content = content.replace(old_active_filter_logic, new_active_filter_logic)

with open('src/components/tasks/useTasksFilter.ts', 'w') as f:
    f.write(content)

print("Updated useTasksFilter.ts")
