import { create } from 'zustand';
import { Access } from '../types';

interface AccessesState {
  accesses: Access[];
  accessCategories: string[];
  isLoadingAccesses: boolean;
  hasFetchedOnce: boolean;
  
  setAccesses: (updater: Access[] | ((prev: Access[]) => Access[])) => void;
  setAccessCategories: (cats: string[]) => void;
  setIsLoadingAccesses: (val: boolean) => void;
  setHasFetchedOnce: (val: boolean) => void;
}

export const useAccessesStore = create<AccessesState>((set) => ({
  accesses: [],
  accessCategories: ['Provedor', 'Assets', 'Plataforma'],
  isLoadingAccesses: true,
  hasFetchedOnce: false,

  setAccesses: (updater) => set((state) => ({ 
    accesses: typeof updater === 'function' ? updater(state.accesses) : updater 
  })),
  setAccessCategories: (cats) => set({ accessCategories: cats }),
  setIsLoadingAccesses: (val) => set({ isLoadingAccesses: val }),
  setHasFetchedOnce: (val) => set({ hasFetchedOnce: val }),
}));
