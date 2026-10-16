import { create } from 'zustand';
import { defaultCategories, defaultDepartments } from '@/constants/defaultCatalog';
import { fetchCategories, fetchDepartments } from '@/services/catalog';
import type { Category, Department } from '@/types';

interface CatalogState {
  categories: Category[];
  departments: Department[];
  /** true when showing the built-in fallback (Firestore empty or unreachable) */
  usingFallback: boolean;
  loaded: boolean;
  load: () => Promise<void>;
  category: (id: string | null | undefined) => Category | undefined;
  department: (id: string | null | undefined) => Department | undefined;
}

// Categories/departments rarely change: load once per session, keep in memory.
export const useCatalog = create<CatalogState>((set, get) => ({
  categories: defaultCategories,
  departments: defaultDepartments,
  usingFallback: true,
  loaded: false,
  load: async () => {
    try {
      const [categories, departments] = await Promise.all([fetchCategories(), fetchDepartments()]);
      set({
        categories: categories.length ? categories : defaultCategories,
        departments: departments.length ? departments : defaultDepartments,
        usingFallback: !categories.length,
        loaded: true,
      });
    } catch {
      set({ loaded: true, usingFallback: true });
    }
  },
  category: (id) => get().categories.find((c) => c.id === id) ?? defaultCategories.find((c) => c.id === id),
  department: (id) => get().departments.find((d) => d.id === id) ?? defaultDepartments.find((d) => d.id === id),
}));
