import type { Timestamp } from 'firebase/firestore';
import i18n from '@/i18n';
import type { Category, Language } from '@/types';

export const toDate = (t: Timestamp | Date | null | undefined): Date | null =>
  !t ? null : t instanceof Date ? t : typeof t.toDate === 'function' ? t.toDate() : null;

const locale = () => `${i18n.language || 'en'}-LK`;

function safeFormat(d: Date, opts: Intl.DateTimeFormatOptions) {
  try {
    return d.toLocaleString(locale(), opts);
  } catch {
    return d.toLocaleString('en-GB', opts);
  }
}

/** "8 Aug 2026" */
export const formatDate = (t: Timestamp | Date | null | undefined) => {
  const d = toDate(t);
  return d ? safeFormat(d, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

/** "8:15 AM" */
export const formatTime = (t: Timestamp | Date | null | undefined) => {
  const d = toDate(t);
  return d ? safeFormat(d, { hour: 'numeric', minute: '2-digit' }) : '';
};

/** "8 Aug, 8:15 AM" */
export const formatDateTime = (t: Timestamp | Date | null | undefined) => {
  const d = toDate(t);
  return d ? safeFormat(d, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
};

/** "Just now", "5 min ago", "3 h ago", "2 days ago", then the date. */
export function timeAgo(t: Timestamp | Date | null | undefined) {
  const d = toDate(t);
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return i18n.t('time.justNow');
  if (s < 3600) return i18n.t('time.minutes', { count: Math.floor(s / 60) });
  if (s < 86400) return i18n.t('time.hours', { count: Math.floor(s / 3600) });
  if (s < 86400 * 7) return i18n.t('time.days', { count: Math.floor(s / 86400) });
  return formatDate(d);
}

export const isToday = (t: Timestamp | Date | null | undefined) => {
  const d = toDate(t);
  return !!d && d.toDateString() === new Date().toDateString();
};

/** "350 m" / "1.4 km" */
export const formatDistance = (meters: number) =>
  meters < 1000 ? `${Math.round(meters / 10) * 10} m` : `${(meters / 1000).toFixed(1)} km`;

/** Category name in the current UI language (falls back to English). */
export function categoryName(c: Pick<Category, 'name_en' | 'name_si' | 'name_ta'> | undefined) {
  if (!c) return '';
  const lang = (i18n.language || 'en') as Language;
  return (lang === 'si' ? c.name_si : lang === 'ta' ? c.name_ta : c.name_en) || c.name_en;
}

export function categorySubtitle(c: Category | undefined) {
  if (!c) return '';
  const lang = (i18n.language || 'en') as Language;
  return (lang === 'si' ? c.subtitle_si : lang === 'ta' ? c.subtitle_ta : c.subtitle_en) || c.subtitle_en;
}

/** "Kasun Perera" → "KP" */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/** Sri Lankan mobile: "771234567" (9 digits after +94, leading 0 dropped). */
export const normalisePhone = (raw: string) => raw.replace(/\D/g, '').replace(/^94/, '').replace(/^0/, '');
export const isValidLkPhone = (raw: string) => /^7\d{8}$/.test(normalisePhone(raw));
