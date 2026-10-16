// Same tokens as tailwind.config.js, for places that need raw values
// (icon colours, native props like Switch trackColor, inline styles).
export const colors = {
  primary: '#2E7D32',
  primaryDark: '#1B5E20',
  primaryLight: '#E8F5E9',
  canvas: '#F7FAF7',
  surface: '#FFFFFF',
  line: '#E5E7EB',
  ink: '#1F2937',
  muted: '#6B7280',
  placeholder: '#9CA3AF',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  dangerDark: '#B91C1C',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  success: '#16A34A',
  white: '#FFFFFF',
} as const;

// RN (New Architecture) supports CSS-style boxShadow on Android.
export const shadows = {
  card: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  sheet: { boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' },
  raised: { boxShadow: '0 6px 16px rgba(46,125,50,0.35)' },
} as const;
