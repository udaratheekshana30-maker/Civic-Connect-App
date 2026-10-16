import type { Report } from '@/types';
import { toDate } from '@/utils/format';

const OVERDUE_DAYS = 7;

export const ageDays = (r: Report) => {
  const d = toDate(r.createdAt);
  return d ? (Date.now() - d.getTime()) / 86_400_000 : 0;
};

export const isOpen = (r: Report) => r.status !== 'resolved' && r.status !== 'rejected';
export const isReopened = (r: Report) => r.status === 'resolved' && r.resolvedConfirmed === false;
export const isOverdue = (r: Report) => isOpen(r) && ageDays(r) > OVERDUE_DAYS;

/**
 * Queue order: citizen-reopened first, then severity, community support and age.
 * Closed reports sink to the bottom.
 */
export function priorityScore(r: Report) {
  if (isReopened(r)) return 10_000 + r.supportCount;
  if (!isOpen(r)) return -1000 - ageDays(r);
  const sev = r.severity === 'high' ? 300 : r.severity === 'medium' ? 150 : r.severity === 'low' ? 50 : 100;
  return sev + r.supportCount * 20 + Math.min(ageDays(r), 30) * 5 + (r.status === 'submitted' ? 40 : 0);
}
