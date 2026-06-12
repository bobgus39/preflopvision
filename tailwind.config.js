/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [
    'bg-raise', 'bg-call', 'bg-mixed-rf', 'bg-mixed-rc', 'bg-fold-cell',
    'border-raise', 'border-call', 'border-gold',
    'text-raise', 'text-call', 'text-success',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D12',
        surface: '#1A1A24',
        'surface-2': '#252535',
        'surface-3': '#2E2E42',
        'surface-4': '#383855',
        gold: '#C9A84C',
        'gold-light': '#E8C76B',
        'gold-dark': '#9A7B32',
        raise: '#C9A84C',
        call: '#3498DB',
        'mixed-rf': '#E67E22',
        'mixed-rc': '#9B59B6',
        'fold-cell': '#1E1E2C',
        success: '#2ECC71',
        danger: '#E74C3C',
        cream: '#F0EAD6',
        'cream-dim': '#A09878',
        'cream-muted': '#706050',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-sm': '0 0 8px rgba(201,168,76,0.3)',
        'gold-md': '0 0 20px rgba(201,168,76,0.4)',
        'gold-lg': '0 0 40px rgba(201,168,76,0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow-gold': 'glowGold 2.5s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        glowGold: {
          '0%': { filter: 'drop-shadow(0 0 4px rgba(201,168,76,0.4))' },
          '100%': { filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.9))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
    },
  },
  plugins: [],
}
