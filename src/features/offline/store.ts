import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { toast } from '@/components/ui/Toast';
import i18n from '@/i18n';
import { uploadMedia, type LocalMedia } from '@/services/cloudinary';
import { submitReport, type NewReport } from '@/services/reports';

// ---------- connectivity ----------

export const useNetwork = create<{ online: boolean }>(() => ({ online: true }));

// ---------- queued reports ----------

export type QueuedReport = Omit<NewReport, 'media' | 'seenAt'> & {
  localId: string;
  media: LocalMedia[];
  seenAt: string | null;
  queuedAt: number;
  lastError?: string;
};

interface QueueState {
  pending: QueuedReport[];
  flushing: boolean;
  enqueue: (r: Omit<QueuedReport, 'localId' | 'queuedAt'>) => void;
  remove: (localId: string) => void;
  flush: () => Promise<void>;
}

/**
 * Reports made offline (or that failed to send) wait here — persisted to
 * AsyncStorage — and are sent automatically when the connection returns.
 */
export const useOfflineQueue = create<QueueState>()(
  persist(
    (set, get) => ({
      pending: [],
      flushing: false,
      enqueue: (r) => set((s) => ({ pending: [...s.pending, { ...r, localId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, queuedAt: Date.now() }] })),
      remove: (localId) => set((s) => ({ pending: s.pending.filter((p) => p.localId !== localId) })),
      flush: async () => {
        if (get().flushing || !get().pending.length || !useNetwork.getState().online) return;
        set({ flushing: true });
        try {
          for (const item of [...get().pending]) {
            try {
              // Upload one by one, saving each URL so a later retry skips it.
              const media = [];
              for (const [i, m] of item.media.entries()) {
                const up = await uploadMedia(m);
                media.push(up);
                set((s) => ({
                  pending: s.pending.map((p) => (p.localId === item.localId ? { ...p, media: p.media.map((pm, j) => (j === i ? { ...pm, url: up.url } : pm)) } : p)),
                }));
              }
              const id = await submitReport({ ...item, media, seenAt: item.seenAt ? new Date(item.seenAt) : null });
              get().remove(item.localId);
              toast(i18n.t('offline.sent', { id }));
            } catch (e) {
              const msg = (e as Error)?.message ?? 'error';
              set((s) => ({ pending: s.pending.map((p) => (p.localId === item.localId ? { ...p, lastError: msg } : p)) }));
            }
          }
        } finally {
          set({ flushing: false });
        }
      },
    }),
    {
      name: 'cc.offlineQueue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ pending: s.pending }),
    },
  ),
);

/** Mounted once in the root layout. */
export function NetworkListener() {
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        const online = !!state.isConnected && state.isInternetReachable !== false;
        const was = useNetwork.getState().online;
        useNetwork.setState({ online });
        if (online && !was) useOfflineQueue.getState().flush();
      }),
    [],
  );
  // also try once at start (e.g. app was closed while offline)
  useEffect(() => {
    const t = setTimeout(() => useOfflineQueue.getState().flush(), 3000);
    return () => clearTimeout(t);
  }, []);
  return null;
}
