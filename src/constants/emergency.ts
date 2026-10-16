import { Ambulance, CloudRain, Flame, Shield, Zap, type LucideIcon } from 'lucide-react-native';

// Text: i18n `emergency.contacts.<id>.name|note`.
export const emergencyContacts: { id: string; number: string; icon: LucideIcon }[] = [
  { id: 'police', number: '119', icon: Shield },
  { id: 'fire', number: '110', icon: Flame },
  { id: 'suwaseriya', number: '1990', icon: Ambulance },
  { id: 'disaster', number: '117', icon: CloudRain },
  { id: 'ceb', number: '1987', icon: Zap },
];
