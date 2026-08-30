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
        sans:  ['Vazirmatn',      'Tahoma', 'system-ui', 'sans-serif'],
        fanum: ['VazirmatnFaNum', 'Tahoma', 'system-ui', 'sans-serif'],
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
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',

        // ── New glassmorphism token family (chunk 1) — additive, wired to
        // glass-theme.css's --brand/--text-*/--glass* vars. Named glass-text/
        // glass-brand/glass (not text/brand) so existing components using the
        // old tokens above don't silently repoint mid-migration; later chunks
        // will consciously move call sites to these as they restyle each file.
        'glass-text': {
          primary:   'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          disabled:  'var(--text-disabled)',
        },
        'glass-brand': {
          DEFAULT: 'var(--brand)',
          dark:    'var(--brand-dark)',
          light:   'var(--brand-light)',
        },
        glass: {
          DEFAULT: 'var(--glass)',
          strong:  'var(--glass-strong)',
          border:  'var(--glass-border)',
        },
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
