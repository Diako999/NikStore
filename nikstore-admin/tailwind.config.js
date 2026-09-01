/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Vazirmatn',     'Tahoma', 'system-ui', 'sans-serif'],
        fanum: ['VazirmatnFaNum','Tahoma', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1A3620',
          dark:    '#122918',
          light:   '#3D5C44',
          50:      '#EEF1EA',
        },
        sidebar: {
          bg:         '#171717',
          hover:      '#232323',
          active:     '#3D5C44',
          text:       '#A3A3A3',
          activeText: '#EEF1EA',
          border:     '#232323',
        },
        // Additive-retoken: these used to be static hex (light-mode only).
        // Now backed by variables.css's [data-theme] tokens so every
        // existing bg-surface/bg-card/border-border/text-text-* call site
        // across the app responds to the dark/light toggle automatically,
        // while staying fully flat/opaque (no glass) — required for dense
        // tables/forms per the retheme spec.
        surface: 'var(--color-surface)',
        card:    'var(--color-card)',
        border:  'var(--color-border)',
        text: {
          primary:   'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          disabled:  'var(--color-text-disabled)',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',

        // ── New glassmorphism token family (chunk 1) — additive, wired to
        // glass-theme.css's --brand/--text-*/--glass* vars. Named glass-text/
        // glass-brand/glass (not text/primary) so existing components using
        // the old tokens above don't silently repoint mid-migration; later
        // chunks will consciously move call sites to these as they restyle.
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
      boxShadow: {
        card:     '0 1px 3px rgba(0,0,0,0.08)',
        sidebar:  '2px 0 8px rgba(0,0,0,0.15)',
        dropdown: '0 4px 16px rgba(0,0,0,0.12)',
        modal:    '0 8px 32px rgba(0,0,0,0.16)',
      },
      zIndex: {
        sidebar:  '50',
        header:   '40',
        dropdown: '60',
        modal:    '70',
        toast:    '80',
      },
    },
  },
  plugins: [],
}
