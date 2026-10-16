import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { LocalMedia } from '@/services/cloudinary';
import type { GeoPlace, Severity } from '@/types';

export const MAX_MEDIA = 5;
export const MAX_DESCRIPTION = 500;

export interface Draft {
  categoryId: string | null;
  description: string;
  media: LocalMedia[];
  severity: Severity | null;
  /** ISO string; optional "when did you see it?" */
  seenAt: string | null;
  location: GeoPlace | null;
  anonymous: boolean;
}

const empty: Draft = {
  categoryId: null,
  description: '',
  media: [],
  severity: null,
  seenAt: null,
  location: null,
  anonymous: false,
};

interface DraftState extends Draft {
  update: (patch: Partial<Draft>) => void;
  reset: () => void;
  hasContent: () => boolean;
}

/**
 * The 4-step report flow shares this store. It's persisted to AsyncStorage on
 * every change, so closing the app mid-report doesn't lose the draft.
 */
export const useDraft = create<DraftState>()(
  persist(
    (set, get) => ({
      ...empty,
      update: (patch) => set(patch),
      reset: () => set(empty),
      hasContent: () => {
        const d = get();
        return !!(d.categoryId || d.description.trim() || d.media.length || d.location);
      },
    }),
    { name: 'cc.reportDraft', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
