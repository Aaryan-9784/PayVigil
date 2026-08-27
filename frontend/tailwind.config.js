/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        warmwhite: {
          50: '#ffffff',
          100: '#fdfcf7',
          200: '#faf8f0',
          300: '#f5f2e3',
          400: '#eee9d3',
        },
        sunshine: {
          light: '#fef9c3',
          DEFAULT: '#fde047',
          accent: '#eab308',
          deep: '#b45309'
        },
        surface: {
          50: '#fdfcf9',
          100: '#f9f7f0',
          200: '#f1ede0',
          300: '#e5dec8',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 14px -2px rgba(161, 98, 7, 0.07), 0 1px 4px 0 rgba(0, 0, 0, 0.04)',
        'card-hover': '0 14px 30px -4px rgba(161, 98, 7, 0.14), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glow-yellow': '0 0 24px -2px rgba(234, 179, 8, 0.35)',
        'glow-gold': '0 0 24px -2px rgba(217, 119, 6, 0.25)',
      },
      animation: {
        'pulse-gentle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
