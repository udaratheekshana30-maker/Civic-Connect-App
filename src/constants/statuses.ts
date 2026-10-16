import { Building, CircleCheck, CircleX, HardHat, Inbox, Search, type LucideIcon } from 'lucide-react-native';
import type { StatusKey } from '@/types';

export interface StatusConfig {
  /** brand colour for icons, dots and map pins */
  color: string;
  /** darker shade of the same hue so labels pass WCAG AA on the tint */
  text: string;
  tint: string;
  icon: LucideIcon;
}

// Labels and plain-language explanations live in i18n: `status.<key>.label` / `.plain`.
export const statuses: Record<StatusKey, StatusConfig> = {
  submitted: { color: '#64748B', text: '#475569', tint: 'rgba(100,116,139,0.12)', icon: Inbox },
  review: { color: '#F59E0B', text: '#B45309', tint: 'rgba(245,158,11,0.12)', icon: Search },
  assigned: { color: '#7C3AED', text: '#6D28D9', tint: 'rgba(124,58,237,0.12)', icon: Building },
  progress: { color: '#2563EB', text: '#1D4ED8', tint: 'rgba(37,99,235,0.12)', icon: HardHat },
  resolved: { color: '#16A34A', text: '#15803D', tint: 'rgba(22,163,74,0.12)', icon: CircleCheck },
  rejected: { color: '#DC2626', text: '#B91C1C', tint: 'rgba(220,38,38,0.12)', icon: CircleX },
};

export const statusFlow: StatusKey[] = ['submitted', 'review', 'assigned', 'progress', 'resolved'];
