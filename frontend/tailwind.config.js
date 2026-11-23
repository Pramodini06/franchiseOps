/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { 50:'#eff4ef',100:'#e2ebe2',200:'#c4d7c6',300:'#9fbea4',400:'#6c9677',500:'#3f7353',600:'#2f6243',700:'#244f37',800:'#1d402e',900:'#173526' },
        ink: { 800:'#1d402e', 900:'#173526' }
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
