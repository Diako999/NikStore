import rtl from 'tailwindcss-rtl'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app.vue',
    './pages/**/*.vue',
    './components/**/*.vue',
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
      },
      spacing: {
        18: '4.5rem',
      },
      borderRadius: {
        card: '18px',
        hero: '40px',
      },
      backdropBlur: {
        16: '16px',
        18: '18px',
        20: '20px',
        22: '22px',
      },
    },
  },
  plugins: [rtl],
}
