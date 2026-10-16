import { collection, doc, limit, onSnapshot, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import type { AppNotification } from '@/types';
import { db } from './firebase';

const col = collection(db, 'notifications');

export function subscribeNotifications(uid: string, cb: (n: AppNotification[]) => void, onError?: (e: unknown) => void) {
  // Filter-only + client-side sort: no composite index needed.
  const q = query(col, where('userId', '==', uid), limit(200));
  return onSnapshot(
    q,
    (s) =>
      cb(
        s.docs
          .map((d) => ({ ...(d.data() as Omit<AppNotification, 'id'>), id: d.id }))
          .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now())),
      ),
    onError,
  );
}

export const markRead = (id: string) => updateDoc(doc(col, id), { read: true });

export async function markAllRead(items: AppNotification[]) {
  const unread = items.filter((n) => !n.read);
  if (!unread.length) return;
  const batch = writeBatch(db);
  unread.forEach((n) => batch.update(doc(col, n.id), { read: true }));
  await batch.commit();
}
