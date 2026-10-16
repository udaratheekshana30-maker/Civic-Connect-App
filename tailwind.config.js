// Tokens ported from HCI_test_frontend/tailwind.config.js.
// Font sizes are NOT set through Tailwind classes: use <Txt variant=...> so the
// user's "Text size" setting can scale them (see src/components/ui/Txt.tsx).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2E7D32', dark: '#1B5E20', light: '#E8F5E9' },
        canvas: '#F7FAF7',
        surface: '#FFFFFF',
        line: '#E5E7EB',
        ink: '#1F2937',
        muted: '#6B7280',
        placeholder: '#9CA3AF',
        danger: { DEFAULT: '#DC2626', light: '#FEE2E2', dark: '#B91C1C' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7', dark: '#92400E' },
        info: { DEFAULT: '#2563EB', light: '#DBEAFE' },
        success: '#16A34A',
      },
      borderRadius: { card: '14px', btn: '12px' },
    },
  },
  plugins: [],
};
