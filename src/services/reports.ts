import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  endAt,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAt,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { distanceBetween, geohashForLocation, geohashQueryBounds } from 'geofire-common';
import type { Addition, CategoryGroupId, GeoPlace, LatLng, MediaItem, Report, Role, Severity, StatusKey, TimelineEntry } from '@/types';
import { db } from './firebase';

const reportsCol = collection(db, 'reports');
const counterRef = doc(db, 'counters', 'reports');

const toReport = (d: DocumentSnapshot): Report => ({ ...(d.data() as Omit<Report, 'id'>), id: d.id });

export interface NewReport {
  uid: string;
  reporterName: string | null;
  isAnonymous: boolean;
  categoryId: string;
  group: CategoryGroupId;
  departmentId: string;
  description: string;
  severity: Severity | null;
  seenAt: Date | null;
  media: MediaItem[];
  location: GeoPlace;
}

/**
 * Creates reports/CC#### using a counter document so IDs are short and readable.
 * The transaction guarantees two people never get the same number.
 */
export async function submitReport(r: NewReport): Promise<string> {
  return runTransaction(db, async (tx) => {
    const counter = await tx.get(counterRef);
    const n: number = counter.exists() ? (counter.data().next as number) : 1000;
    const id = `CC${n}`;
    tx.set(counterRef, { next: n + 1 });
    tx.set(doc(reportsCol, id), {
      reporterId: r.uid,
      reporterName: r.isAnonymous ? null : r.reporterName,
      isAnonymous: r.isAnonymous,
      categoryId: r.categoryId,
      group: r.group,
      description: r.description.trim(),
      severity: r.severity,
      seenAt: r.seenAt ? Timestamp.fromDate(r.seenAt) : null,
      media: r.media,
      location: { lat: r.location.lat, lng: r.location.lng, address: r.location.address },
      geohash: geohashForLocation([r.location.lat, r.location.lng]),
      area: r.location.area || '',
      status: 'submitted' as StatusKey,
      departmentId: r.departmentId,
      supportCount: 0,
      supporters: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      resolvedConfirmed: null,
    });
    return id;
  });
}

// ---------- reading ----------

/** Newest first; a just-written doc (pending serverTimestamp) counts as "now". */
export const byNewest = <T extends { createdAt: Timestamp | null }>(a: T, b: T) =>
  (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now());

// Filter-only query + client-side sort: works with Firestore's automatic
// single-field index, so no composite index has to be deployed.
export function subscribeMyReports(uid: string, cb: (r: Report[]) => void, onError: (e: unknown) => void) {
  const q = query(reportsCol, where('reporterId', '==', uid), limit(200));
  return onSnapshot(q, (s) => cb(s.docs.map(toReport).sort(byNewest)), onError);
}

export function subscribeReport(id: string, cb: (r: Report | null) => void, onError: (e: unknown) => void) {
  return onSnapshot(doc(reportsCol, id), (s) => cb(s.exists() ? toReport(s) : null), onError);
}

export function subscribeTimeline(id: string, cb: (t: TimelineEntry[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db, 'reports', id, 'timeline'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...(d.data() as Omit<TimelineEntry, 'id'>), id: d.id }))), onError);
}

export function subscribeAdditions(id: string, cb: (a: Addition[]) => void, onError?: (e: unknown) => void) {
  const q = query(collection(db, 'reports', id, 'additions'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (s) => cb(s.docs.map((d) => ({ ...(d.data() as Omit<Addition, 'id'>), id: d.id }))), onError);
}

export type NearbyReport = Report & { distance: number };

/**
 * Reports within `radiusM` metres, using geohash ranges (geofire-common).
 * Geohash boxes over-fetch at the edges, so we filter by real distance after.
 */
export async function fetchNearby(center: LatLng, radiusM: number, max = 60): Promise<NearbyReport[]> {
  const c: [number, number] = [center.lat, center.lng];
  const bounds = geohashQueryBounds(c, radiusM);
  const snaps = await Promise.all(bounds.map(([s, e]) => getDocs(query(reportsCol, orderBy('geohash'), startAt(s), endAt(e), limit(max)))));
  const seen = new Set<string>();
  const out: NearbyReport[] = [];
  for (const snap of snaps) {
    for (const d of snap.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const r = toReport(d);
      const distance = distanceBetween([r.location.lat, r.location.lng], c) * 1000;
      if (distance <= radiusM) out.push({ ...r, distance });
    }
  }
  return out.sort((a, b) => a.distance - b.distance);
}

/** Same category, within ~100 m, not resolved/rejected → offer "support it instead". */
export async function findSimilar(center: LatLng, categoryId: string) {
  const near = await fetchNearby(center, 100, 30);
  return near.filter((r) => r.categoryId === categoryId && r.status !== 'resolved' && r.status !== 'rejected');
}

// ---------- citizen actions (field-limited by firestore.rules) ----------

export const setSupport = (reportId: string, uid: string, on: boolean) =>
  updateDoc(doc(reportsCol, reportId), {
    supporters: on ? arrayUnion(uid) : arrayRemove(uid),
    supportCount: increment(on ? 1 : -1),
  });

/** Reporter answers "Is this issue fixed?" — false reopens it for the officer. */
export const confirmResolved = (reportId: string, fixed: boolean) =>
  updateDoc(doc(reportsCol, reportId), { resolvedConfirmed: fixed });

export const addInfo = (reportId: string, uid: string, text: string, media: MediaItem[]) =>
  addDoc(collection(db, 'reports', reportId, 'additions'), { userId: uid, text: text.trim(), media, createdAt: serverTimestamp() });

export async function profileStats(uid: string) {
  const [reported, resolved, supported] = await Promise.all([
    getCountFromServer(query(reportsCol, where('reporterId', '==', uid))),
    getCountFromServer(query(reportsCol, where('reporterId', '==', uid), where('status', '==', 'resolved'))),
    getCountFromServer(query(reportsCol, where('supporters', 'array-contains', uid))),
  ]);
  return { reported: reported.data().count, resolved: resolved.data().count, supported: supported.data().count };
}

// ---------- officer / admin ----------

export function subscribeQueue(cb: (r: Report[]) => void, onError: (e: unknown) => void) {
  const q = query(reportsCol, orderBy('createdAt', 'desc'), limit(300));
  return onSnapshot(q, (s) => cb(s.docs.map(toReport)), onError);
}

export interface OfficerUpdate {
  report: Report;
  status: StatusKey;
  departmentId: string;
  remark: string;
  byRole: Role;
  byName: string;
}

/**
 * One atomic batch: update the report, add a timeline entry, and notify the
 * reporter. (Cloud Functions would need the paid Blaze plan, so the officer's
 * app does this and firestore.rules restrict it to officer/admin.)
 */
export async function officerUpdate(u: OfficerUpdate) {
  const batch = writeBatch(db);
  const ref = doc(reportsCol, u.report.id);
  const statusChanged = u.status !== u.report.status;
  batch.update(ref, {
    status: u.status,
    departmentId: u.departmentId,
    updatedAt: serverTimestamp(),
    // a new resolution needs a fresh confirmation from the citizen
    ...(statusChanged && u.status === 'resolved' ? { resolvedConfirmed: null } : {}),
  });
  batch.set(doc(collection(ref, 'timeline')), {
    status: u.status,
    remark: u.remark.trim(),
    byRole: u.byRole,
    byName: u.byName,
    createdAt: serverTimestamp(),
  });
  if (u.report.reporterId) {
    batch.set(doc(collection(db, 'notifications')), {
      userId: u.report.reporterId,
      reportId: u.report.id,
      // English fallback; the app shows a translated title from `status`.
      title: statusChanged ? `Your report is now: ${u.status}` : 'New update on your report',
      body: u.remark.trim(),
      type: statusChanged ? 'status' : 'remark',
      status: u.status,
      read: false,
      createdAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

export async function countBy(field: 'status' | 'categoryId', values: string[]) {
  const counts = await Promise.all(values.map((v) => getCountFromServer(query(reportsCol, where(field, '==', v)))));
  return Object.fromEntries(values.map((v, i) => [v, counts[i]!.data().count])) as Record<string, number>;
}

export const totalReports = async () => (await getCountFromServer(reportsCol)).data().count;
