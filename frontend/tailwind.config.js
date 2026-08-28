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
        razorpay: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffe',
          300: '#7cc5fd',
          400: '#36a8fa',
          500: '#0c83ff', // Razorpay Signature Blue
          600: '#006de6',
          700: '#0054b8',
          800: '#004797',
          900: '#0c2340', // Razorpay Navy Dark
          950: '#02042b', // Deep Space Navy
        },
        rzpnavy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0c2340',
          950: '#02042b',
        },
        rzpgreen: {
          DEFAULT: '#10b981',
          light: '#ecfdf5',
          dark: '#047857',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 14px -2px rgba(12, 35, 64, 0.06), 0 1px 4px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 16px 36px -4px rgba(12, 131, 255, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'glow-blue': '0 0 24px -2px rgba(12, 131, 255, 0.35)',
        'glow-navy': '0 0 24px -2px rgba(12, 35, 64, 0.25)',
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
