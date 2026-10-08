import re

with open('src/components/dashboard/DashboardActiveTasks.tsx', 'r') as f:
    content = f.read()

# Add slice
old_start = """export const DashboardActiveTasks: React.FC<DashboardActiveTasksProps> = React.memo(
  ({ tasks, isLoading, onTaskClick, onAddTaskClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return ("""

new_start = """export const DashboardActiveTasks: React.FC<DashboardActiveTasksProps> = React.memo(
  ({ tasks, isLoading, onTaskClick, onAddTaskClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Mostra no máximo as 20 tarefas mais recentes
    const limitedTasks = tasks.slice(0, 20);

    return ("""

content = content.replace(old_start, new_start)

# Replace tasks with limitedTasks in the render
content = content.replace("tasks.length", "limitedTasks.length")
content = content.replace("tasks.slice(0, 5)", "limitedTasks.slice(0, 5)")
content = content.replace("isExpanded ? tasks :", "isExpanded ? limitedTasks :")

with open('src/components/dashboard/DashboardActiveTasks.tsx', 'w') as f:
    f.write(content)

print("Tasks limited to 20")
