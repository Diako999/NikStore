import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Vazirmatn', 'Tahoma', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          light: 'var(--brand-light)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          disabled: 'var(--text-disabled)',
        },
        glass: {
          DEFAULT: 'var(--glass)',
          strong: 'var(--glass-strong)',
          border: 'var(--glass-border)',
        },
        gold: {
          DEFAULT: '#E7C878',
          light: '#FBEFC8',
        },
        danger: {
          DEFAULT: '#D9534F',
          light: '#F2938F',
        },
      },
      spacing: {
        18: '4.5rem',
        sidebar: '264px',
        'sidebar-collapsed': '76px',
      },
      borderRadius: {
        card: '18px',
        panel: '22px',
      },
      backdropBlur: {
        16: '16px',
        18: '18px',
        20: '20px',
        22: '22px',
      },
      boxShadow: {
        glass: 'var(--glass-shadow)',
      },
    },
  },
  plugins: [rtl],
}
