/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#fcfbf7',
        'mint-green': '#f0f7f4',
        'forest-green': '#2d5a3d',
        'forest-green-light': '#4a7c5e',
        'warm-brown': '#8b7355',
        'pastel-pink': '#f5d6d6',
        'pastel-blue': '#d6e8f5',
        'pastel-yellow': '#f5f0d6',
        'pastel-green': '#d6f5d6',
        'soft-white': '#fefefe',
        'text-dark': '#3d3d3d',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', '"Hiragino Sans"', 'system-ui', 'sans-serif'],
        rounded: ['"Noto Sans JP"', '"M PLUS Rounded 1c"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-out forwards',
        'pop-in': 'popIn 0.3s ease-out forwards',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%': { opacity: '0', transform: 'scale(0) rotate(0deg)' },
          '50%': { opacity: '1', transform: 'scale(1.2) rotate(180deg)' },
          '100%': { opacity: '0', transform: 'scale(0) rotate(360deg)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}
