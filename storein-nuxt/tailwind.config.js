import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
          DEFAULT: '#F4F6F9',
          card:    '#FFFFFF',
          border:  '#DDE3EC',
        },
        text: {
          primary:   '#171717',
          secondary: '#4B5A3A',
          disabled:  '#9CB68A',
        },
        wholesale: {
          DEFAULT: '#f59e0b',
          dark:    '#b45309',
          light:   '#fef3c7',
          border:  'rgba(245,158,11,0.3)',
        },
        card: 'var(--color-card)',
        bg:   'var(--color-bg)',
        success: '#059669',
        warning: '#D97706',
        error:   '#DC2626',
        info:    '#2563EB',
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
        card:     '0 1px 4px rgba(0,0,0,0.08)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal:    '0 8px 32px rgba(0,0,0,0.16)',
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
