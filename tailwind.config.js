/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'translateY(-100%) scale(0.8)', opacity: '0' },
          '50%': { transform: 'translateY(0) scale(1.05)', opacity: '1' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        'scale-bounce': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        particle: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) translateX(50px) scale(0)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'float-up': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'translateY(-50px) scale(1.2)', opacity: '0' },
        },
      },
      animation: {
        'bounce-in': 'bounce-in 0.5s ease-out',
        'scale-bounce': 'scale-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'fade-in': 'fade-in 0.3s ease-out',
        'confetti': 'confetti 3s ease-out forwards',
        'particle': 'particle 1s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
        'float-up': 'float-up 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}

