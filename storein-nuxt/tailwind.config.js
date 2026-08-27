import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app.vue',
    './error.vue',
    './pages/**/*.vue',
    './layouts/**/*.vue',
    './components/**/*.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['IRANSans',      'Tahoma', 'system-ui', 'sans-serif'],
        fanum: ['IRANSansFaNum', 'Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'rgb(var(--color-brand-rgb) / <alpha-value>)',
          dark:    'rgb(var(--color-brand-dark-rgb) / <alpha-value>)',
          light:   'rgb(var(--color-brand-light-rgb) / <alpha-value>)',
        },
        surface: {
          DEFAULT: '#101913',
          card:    '#1B2A21',
          border:  'rgba(255,255,255,0.08)',
        },
        text: {
          primary:   '#F2F0E8',
          secondary: '#96A697',
          disabled:  '#5A6459',
        },
        card: 'var(--color-card)',
        bg:   'var(--color-bg)',
        glass: {
          DEFAULT: 'var(--glass-bg)',
          strong:  'var(--glass-bg-strong)',
          border:  'var(--glass-border)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        xl:    '12px',
        '2xl': '16px',
      },
      boxShadow: {
        // Restrained 3-step scale — Level 2 (soft), hover (medium), Level 3 (floating).
        // Kept intentionally light — no huge blurred shadows that detach cards from the page.
        card:     '0 2px 8px rgba(0,0,0,0.24)',
        soft:     '0 2px 8px rgba(0,0,0,0.24)',
        medium:   '0 8px 24px rgba(0,0,0,0.32)',
        floating: '0 16px 40px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.05)',
        dropdown: '0 12px 32px rgba(0,0,0,0.36), 0 0 0 1px rgba(255,255,255,0.06)',
        modal:    '0 20px 48px rgba(0,0,0,0.44), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      zIndex: {
        header:   '100',
        dropdown: '200',
        modal:    '300',
        toast:    '400',
      },
    },
  },
  plugins: [rtl],
}
