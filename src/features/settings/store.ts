import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Language, TextSize } from '@/types';

interface SettingsState {
  /** null until the user picks one on the Language screen */
  language: Language | null;
  textSize: TextSize;
  onboarded: boolean;
  hydrated: boolean;
  setLanguage: (l: Language) => void;
  setTextSize: (s: TextSize) => void;
  setOnboarded: (v: boolean) => void;
}

// Device-local preferences. When signed in, language/textSize are also
// mirrored to users/{uid} (Phase 2) so they follow the account.
export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      language: null,
      textSize: 'default',
      onboarded: false,
      hydrated: false,
      setLanguage: (language) => set({ language }),
      setTextSize: (textSize) => set({ textSize }),
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    {
      name: 'cc.settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, textSize, onboarded }) => ({ language, textSize, onboarded }),
      onRehydrateStorage: () => () => useSettings.setState({ hydrated: true }),
    },
  ),
);

export const textScale: Record<TextSize, number> = { default: 1, large: 1.15, xl: 1.3 };
