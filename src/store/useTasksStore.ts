import { create } from 'zustand';
import { Task } from '../types';

interface TasksState {
  tasks: Task[];
  isLoadingTasks: boolean;
  hasFetchedOnce: boolean;
  
  setTasks: (updater: Task[] | ((prev: Task[]) => Task[])) => void;
  setIsLoadingTasks: (val: boolean) => void;
  setHasFetchedOnce: (val: boolean) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  isLoadingTasks: true,
  hasFetchedOnce: false,

  setTasks: (updater) => set((state) => ({ 
    tasks: typeof updater === 'function' ? updater(state.tasks) : updater 
  })),
  setIsLoadingTasks: (val) => set({ isLoadingTasks: val }),
  setHasFetchedOnce: (val) => set({ hasFetchedOnce: val }),
}));
