/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f5ff',
          purple: '#bf00ff',
          green: '#00ff41',
          pink: '#ff0090',
          yellow: '#ffff00',
        },
        dark: {
          900: '#050508',
          800: '#0a0a0f',
          700: '#0f0f1a',
          600: '#151525',
          500: '#1a1a30',
          400: '#252540',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 245, 255, 0.5)',
        'neon-purple': '0 0 20px rgba(191, 0, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 65, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 144, 0.5)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'glitch': 'glitch 0.5s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '25%': { transform: 'translate(-2px, 1px)' },
          '50%': { transform: 'translate(2px, -1px)' },
          '75%': { transform: 'translate(-1px, 2px)' },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      }
    },
  },
  plugins: [],
}
