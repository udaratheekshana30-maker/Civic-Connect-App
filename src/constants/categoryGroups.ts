import { Construction, Droplets, Ellipsis, Landmark, Lightbulb, Trash2, type LucideIcon } from 'lucide-react-native';
import type { CategoryGroupId } from '@/types';

// The six top-level groups from the design. Individual categories (Pothole,
// Garbage pile, ...) live in Firestore `categories/{id}` and point to a group.
// Text: i18n `categoryGroup.<id>.title|short|subtitle`.
export const categoryGroups: { id: CategoryGroupId; icon: LucideIcon }[] = [
  { id: 'roads', icon: Construction },
  { id: 'waste', icon: Trash2 },
  { id: 'drainage', icon: Droplets },
  { id: 'electricity', icon: Lightbulb },
  { id: 'facilities', icon: Landmark },
  { id: 'other', icon: Ellipsis },
];

export const groupIcon = (id: CategoryGroupId): LucideIcon =>
  categoryGroups.find((g) => g.id === id)?.icon ?? Ellipsis;
