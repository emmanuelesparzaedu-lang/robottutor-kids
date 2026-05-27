/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sky: { soft: '#E8F4FD', light: '#B8E0FF' },
        mint: { soft: '#E8F8F0', light: '#A8E6CF' },
        peach: { soft: '#FFF0E8', light: '#FFD4B8' },
        lavender: { soft: '#F0E8FF', light: '#D4B8FF' },
      },
      fontFamily: {
        kid: ['"Nunito"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(99, 179, 237, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(99, 179, 237, 0.8))' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};
