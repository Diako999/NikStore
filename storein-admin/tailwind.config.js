/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans:  ['IRANSans',     'Tahoma', 'system-ui', 'sans-serif'],
        fanum: ['IRANSansFaNum','Tahoma', 'system-ui', 'sans-serif'],
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
        surface: '#EEF1EA',
        card:    '#FFFFFF',
        border:  '#E5E7E0',
        text: {
          primary:   '#1C1C1C',
          secondary: '#6B7280',
          disabled:  '#A8AFA9',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error:   '#EF4444',
        info:    '#3B82F6',
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
