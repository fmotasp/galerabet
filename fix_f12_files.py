import re

with open('src/components/files/FilesView.tsx', 'r') as f:
    content = f.read()

# Map F12 to F12 Bet in uniqueProjects
old_projects = """  const uniqueProjects = useMemo(() => {
    const projects = new Set(deliveredFiles.map(f => f.projectName));
    const sorted = Array.from(projects).sort((a, b) => a.localeCompare(b));
    return sorted;
  }, [deliveredFiles]);"""

new_projects = """  const normalizeProjectName = (name: string) => {
    if (name === 'F12') return 'F12 Bet';
    return name;
  };

  const uniqueProjects = useMemo(() => {
    const projects = new Set(deliveredFiles.map(f => normalizeProjectName(f.projectName)));
    const sorted = Array.from(projects).sort((a, b) => a.localeCompare(b));
    return sorted;
  }, [deliveredFiles]);"""
content = content.replace(old_projects, new_projects)

# Use normalizeProjectName in filtering
old_filter = """    if (selectedProject !== 'all') {
      filtered = filtered.filter(f => f.projectName === selectedProject);
    }"""
new_filter = """    if (selectedProject !== 'all') {
      filtered = filtered.filter(f => normalizeProjectName(f.projectName) === selectedProject);
    }"""
content = content.replace(old_filter, new_filter)

with open('src/components/files/FilesView.tsx', 'w') as f:
    f.write(content)

print("Updated FilesView.tsx")
