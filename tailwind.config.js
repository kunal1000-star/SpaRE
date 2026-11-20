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
        spare: {
          dark: '#070A12',
          card: '#0F1626',
          border: '#1E293B',
          accent: '#3B82F6',
          college: '#38BDF8', // Cyan/sky for college
          gate: '#F59E0B',    // Amber/gold for GATE
          self: '#10B981',    // Emerald for Self learning
          revised: '#10B981',
          delayed: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'snappy': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'float-reverse': 'floatReverse 10s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s infinite',
        'modal-pop': 'modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pop-in': 'popIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'flame': 'flameFlicker 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0px, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0, -12px, 0) rotate(1.5deg)' },
        },
        floatReverse: {
          '0%, 100%': { transform: 'translate3d(0, 0px, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(0, 12px, 0) rotate(-1.5deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.3', transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { opacity: '0.6', transform: 'translate3d(0, 0, 0) scale(1.06)' },
        },
        shimmer: {
          '0%': { transform: 'translate3d(-100%, 0, 0)' },
          '100%': { transform: 'translate3d(200%, 0, 0)' },
        },
        modalPop: {
          '0%': { opacity: '0', transform: 'translate3d(0, 8px, 0) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'translate3d(0, 0, 0) scale(0.88)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
        },
        flameFlicker: {
          '0%': { transform: 'translate3d(0, 0, 0) scale(1) rotate(-2deg)' },
          '100%': { transform: 'translate3d(0, 0, 0) scale(1.12) rotate(2deg)' },
        }
      }
    },
  },
  plugins: [],
}
