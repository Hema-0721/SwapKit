/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          600: '#1A56A0', // Core primary CTA
          700: '#144682',
        },
        secondary: {
          50: '#f0fdf4',
          600: '#1A6E3C', // Success, Free Corner
          700: '#12522b',
        },
        warning: {
          700: '#7A4500', // Barter, Warning Alerts
        },
        danger: {
          800: '#8B1A1A', // Error, destructive
        },
        background: '#F7F9FC',
        surface: '#FFFFFF',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
