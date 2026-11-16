/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50:'#fff4ed',100:'#ffe6d5',200:'#fecbaa',300:'#fda874',400:'#fb7a3c',500:'#f25a14',600:'#e34409',700:'#bc3109',800:'#962910',900:'#7a2410' },
        ink: { 800:'#1f1a17', 900:'#15110f' }
      },
      keyframes: {
        pop: { '0%': { opacity: 0, transform: 'translateY(12px) scale(.98)' }, '100%': { opacity: 1, transform: 'none' } },
        slidein: { '0%': { opacity: 0, transform: 'translateX(24px)' }, '100%': { opacity: 1, transform: 'none' } }
      },
      animation: { pop: 'pop .18s ease-out', slidein: 'slidein .2s ease-out' }
    }
  },
  plugins: []
};
