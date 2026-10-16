import type { Timestamp } from 'firebase/firestore';

export type StatusKey = 'submitted' | 'review' | 'assigned' | 'progress' | 'resolved' | 'rejected';
export type CategoryGroupId = 'roads' | 'waste' | 'drainage' | 'electricity' | 'facilities' | 'other';
export type Severity = 'low' | 'medium' | 'high';
export type Language = 'en' | 'si' | 'ta';
export type TextSize = 'default' | 'large' | 'xl';
export type Role = 'citizen' | 'officer' | 'admin';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GeoPlace extends LatLng {
  address: string;
  /** city/town for the authority "area" filter */
  area?: string;
}

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
}

/** users/{uid} */
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: Role;
  language: Language;
  textSize: TextSize;
  notifyPush: boolean;
  notifySms: boolean;
  notifyEmail: boolean;
  createdAt: Timestamp | null;
}

/** categories/{id} */
export interface Category {
  id: string;
  group: CategoryGroupId;
  name_en: string;
  name_si: string;
  name_ta: string;
  subtitle_en: string;
  subtitle_si?: string;
  subtitle_ta?: string;
  /** shown as a quick chip on step 1 */
  suggested?: boolean;
  departmentId: string;
  isEmergency: boolean;
  order: number;
}

/** departments/{id} */
export interface Department {
  id: string;
  name: string;
  phone: string;
  email: string;
  area: string;
}

/** reports/{id} — the doc id is the readable short id, e.g. "CC1024" */
export interface Report {
  id: string;
  reporterId: string | null;
  /** only stored when the reporter did NOT choose anonymous */
  reporterName: string | null;
  isAnonymous: boolean;
  categoryId: string;
  group: CategoryGroupId;
  description: string;
  severity: Severity | null;
  seenAt: Timestamp | null;
  media: MediaItem[];
  location: GeoPlace;
  geohash: string;
  area: string;
  status: StatusKey;
  departmentId: string;
  supportCount: number;
  supporters: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  resolvedConfirmed: boolean | null;
}

/** reports/{id}/timeline/{id} */
export interface TimelineEntry {
  id: string;
  status: StatusKey;
  remark: string;
  byRole: Role;
  byName?: string;
  createdAt: Timestamp | null;
}

/** reports/{id}/additions/{id} */
export interface Addition {
  id: string;
  userId: string;
  text: string;
  media: MediaItem[];
  createdAt: Timestamp | null;
}

/** notifications/{id} */
export interface AppNotification {
  id: string;
  userId: string;
  reportId: string;
  title: string;
  body: string;
  type: 'status' | 'remark' | 'info';
  status?: StatusKey;
  read: boolean;
  createdAt: Timestamp | null;
}
