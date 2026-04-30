/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1C3D5C',
          dark: '#0F2535',
          deeper: '#081828',
        },
        green: {
          sdm: '#3DAA6E',
          dark: '#2D8055',
          pale: '#E8F5EE',
        },
        sky: {
          sdm: '#A8C4DC',
          light: '#D4E6F1',
          pale: '#EDF4F9',
        },
        ink: '#1a1a1a',
        muted: '#7a8a96',
        border: '#e8edf2',
        off: '#F9FAFB',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['76px', { lineHeight: '1.02', letterSpacing: '-1px' }],
        'display-lg': ['52px', { lineHeight: '1.08', letterSpacing: '-0.5px' }],
        'display-md': ['42px', { lineHeight: '1.1', letterSpacing: '-0.3px' }],
        'display-sm': ['32px', { lineHeight: '1.15', letterSpacing: '-0.2px' }],
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
