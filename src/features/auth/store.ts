import { useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { create } from 'zustand';
import i18n from '@/i18n';
import { auth, firebaseConfigured } from '@/services/firebase';
import { ensureProfile, subscribeProfile } from '@/services/users';
import { useSettings } from '@/features/settings/store';
import type { Role, UserProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  /** true until Firebase has restored (or not) the saved session */
  initializing: boolean;
  /** profile snapshot arrived or failed — so the splash never waits forever */
  profileSettled: boolean;
}

export const useAuth = create<AuthState>(() => ({
  user: null,
  profile: null,
  initializing: firebaseConfigured,
  profileSettled: false,
}));

export const useRole = (): Role => useAuth((s) => s.profile?.role ?? 'citizen');
export const isAuthority = (role: Role) => role === 'officer' || role === 'admin';

/** Display name for greetings / reports. */
export function useDisplayName() {
  const profile = useAuth((s) => s.profile);
  const user = useAuth((s) => s.user);
  return profile?.name || user?.displayName || '';
}

/** Mounted once in the root layout: keeps the store in sync with Firebase. */
export function AuthListener() {
  useEffect(() => {
    if (!firebaseConfigured) return;
    let unsubProfile: (() => void) | undefined;
    let appliedPrefsFor: string | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubProfile?.();
      unsubProfile = undefined;
      if (!user) {
        useAuth.setState({ user: null, profile: null, initializing: false, profileSettled: true });
        return;
      }
      useAuth.setState({ user, profileSettled: false });
      unsubProfile = subscribeProfile(
        user.uid,
        (profile) => {
          if (!profile) {
            // e.g. account created on another device before the doc was written
            ensureProfile(user.uid, { email: user.email ?? '', name: user.displayName ?? '' }).catch(() =>
              useAuth.setState({ profileSettled: true }),
            );
          }
          // First load per sign-in: the account's saved language/text size win.
          if (profile && appliedPrefsFor !== user.uid) {
            appliedPrefsFor = user.uid;
            const s = useSettings.getState();
            if (profile.language && profile.language !== s.language) {
              s.setLanguage(profile.language);
              i18n.changeLanguage(profile.language);
            }
            if (profile.textSize && profile.textSize !== s.textSize) s.setTextSize(profile.textSize);
          }
          // A missing doc is being created above; wait for the next snapshot.
          useAuth.setState({ profile, initializing: false, profileSettled: !!profile });
        },
        // e.g. rules not deployed yet: continue as a citizen rather than hang.
        () => useAuth.setState({ initializing: false, profileSettled: true }),
      );
    });

    return () => {
      unsubAuth();
      unsubProfile?.();
    };
  }, []);
  return null;
}
