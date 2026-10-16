import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import i18n from '@/i18n';
import { useSettings } from '@/features/settings/store';
import type { Language } from '@/types';
import { auth } from './firebase';
import { ensureProfile } from './users';

const prefs = () => {
  const s = useSettings.getState();
  return { language: (s.language ?? i18n.language ?? 'en') as Language, textSize: s.textSize };
};

export async function signIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureProfile(cred.user.uid, { email: cred.user.email ?? '', name: cred.user.displayName ?? '', ...prefs() });
  return cred.user;
}

export async function signUp(name: string, email: string, phone: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await fbUpdateProfile(cred.user, { displayName: name.trim() });
  await ensureProfile(cred.user.uid, { name: name.trim(), email: email.trim(), phone, ...prefs() });
  return cred.user;
}

/** Firebase Anonymous Auth: can report and support, but has no email for recovery. */
export async function continueAnonymously() {
  const cred = await signInAnonymously(auth);
  await ensureProfile(cred.user.uid, prefs());
  return cred.user;
}

export const resetPassword = (email: string) => {
  auth.languageCode = i18n.language === 'en' ? 'en' : i18n.language; // reset email in the user's language
  return sendPasswordResetEmail(auth, email.trim());
};

export const signOut = () => fbSignOut(auth);
