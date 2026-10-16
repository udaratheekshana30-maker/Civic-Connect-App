import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import type { Language, TextSize, UserProfile } from '@/types';
import { db } from './firebase';

export const userRef = (uid: string) => doc(db, 'users', uid);

/** Creates users/{uid} on first sign-in. Role is always "citizen" — rules forbid anything else. */
export async function ensureProfile(uid: string, init: Partial<Pick<UserProfile, 'name' | 'email' | 'phone' | 'language' | 'textSize'>>) {
  const ref = userRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    name: init.name ?? '',
    email: init.email ?? '',
    phone: init.phone ?? '',
    role: 'citizen',
    language: init.language ?? 'en',
    textSize: init.textSize ?? 'default',
    notifyPush: true,
    notifySms: false,
    notifyEmail: false,
    createdAt: serverTimestamp(),
  });
}

export function subscribeProfile(uid: string, cb: (p: UserProfile | null) => void, onError?: (e: unknown) => void) {
  return onSnapshot(userRef(uid), (s) => cb(s.exists() ? (s.data() as UserProfile) : null), onError);
}

type Editable = Partial<Pick<UserProfile, 'name' | 'phone' | 'notifyPush' | 'notifySms' | 'notifyEmail'>> & {
  language?: Language;
  textSize?: TextSize;
};

export const updateProfile = (uid: string, data: Editable) => updateDoc(userRef(uid), data);
