/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'signal-black': '#0B0F14',
        'signal-dark': '#141A21',
        'signal-gray': '#1E2630',
        'signal-border': '#2A3441',
        'signal-amber': '#FFB020',
        'signal-amber-glow': '#FFB02040',
        'signal-red': '#FF4444',
        'signal-red-glow': '#FF444440',
        'signal-emerald': '#10B981',
        'signal-emerald-glow': '#10B98140',
        'signal-purple': '#a855f7',
        'signal-purple-glow': '#a855f740',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 30px currentColor' },
        },
        shimmer: {
          '0%': { opacity: 0.5 },
          '50%': { opacity: 1 },
          '100%': { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
}
