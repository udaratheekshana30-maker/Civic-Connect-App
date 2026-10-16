import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { useAuth } from '@/features/auth/store';
import { fetchNearby, subscribeMyReports, subscribeReport, subscribeTimeline, type NearbyReport } from '@/services/reports';
import type { LatLng, Report, TimelineEntry } from '@/types';

// ---------- my reports: one shared realtime subscription ----------

interface MyReportsState {
  items: Report[];
  loading: boolean;
  error: unknown;
  attempt: number;
  retry: () => void;
}

export const useMyReports = create<MyReportsState>((set) => ({
  items: [],
  loading: true,
  error: null,
  attempt: 0,
  retry: () => set((s) => ({ attempt: s.attempt + 1 })),
}));

/** Mounted once in the root layout. */
export function MyReportsListener() {
  const uid = useAuth((s) => s.user?.uid);
  const attempt = useMyReports((s) => s.attempt);
  useEffect(() => {
    if (!uid) {
      useMyReports.setState({ items: [], loading: false, error: null });
      return;
    }
    useMyReports.setState({ loading: true, error: null });
    return subscribeMyReports(
      uid,
      (items) => useMyReports.setState({ items, loading: false, error: null }),
      (error) => useMyReports.setState({ loading: false, error }),
    );
  }, [uid, attempt]);
  return null;
}

// ---------- one report + timeline (realtime) ----------

export function useReport(id: string | undefined) {
  const [report, setReport] = useState<Report | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const u1 = subscribeReport(
      id,
      (r) => {
        setReport(r);
        setLoading(false);
      },
      (e) => {
        setError(e);
        setLoading(false);
      },
    );
    const u2 = subscribeTimeline(id, setTimeline);
    return () => {
      u1();
      u2();
    };
  }, [id, attempt]);

  return { report, timeline, loading, error, retry: () => setAttempt((a) => a + 1) };
}

// ---------- nearby (one-shot query, refreshable) ----------

export function useNearby(center: LatLng | null, radiusM = 3000) {
  const [items, setItems] = useState<NearbyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const uid = useAuth((s) => s.user?.uid);
  const lat = center?.lat;
  const lng = center?.lng;

  const load = useCallback(async () => {
    if (lat == null || lng == null || !uid) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchNearby({ lat, lng }, radiusM));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusM, uid]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, setItems, loading, error, reload: load };
}
