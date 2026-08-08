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
      // ─── ESCALA TIPOGRÁFICA ───────────────────────────────────────────────
      //
      // Dos escalas conceptualmente distintas: `sdm-display-*` es Cormorant
      // Garamond weight 300 (títulos y precios) y `sdm-*` es Inter (cuerpo,
      // UI y formularios). Los mismos valores están duplicados como custom
      // properties en `:root` de src/styles/globals.css, para poder usarlos
      // desde `style={{}}` mientras se migran los ~780 literales inline.
      //
      // UNA SOLA REGLA, SIN EXCEPCIONES: todo token del sistema lleva el
      // prefijo `sdm-`, y la custom property equivalente es `--sdm-<nombre>`.
      //
      //   text-sdm-sm          ↔  var(--sdm-text-sm)
      //   text-sdm-display-lg  ↔  var(--sdm-display-lg)
      //   tracking-sdm-wide    ↔  var(--sdm-tracking-wide)
      //
      // En UI y tracking el prefijo es obligatorio: `xs`/`sm`/`base`/`lg`/
      // `xl`/`2xl` y `tight`/`normal`/`wide` son claves NATIVAS de Tailwind, y
      // redefinirlas cambiaría en silencio lo que hace `text-sm` para
      // cualquiera que lo escriba, contra lo que dice su documentación. En
      // display no haría falta, pero se pone igual: en una migración de ~780
      // literales una asimetría de nombres cuesta más que la verbosidad.
      fontSize: {
        // Display — Cormorant Garamond. lineHeight y letterSpacing van
        // empaquetados: sin ellos Tailwind aplicaría line-height 1.5, que en
        // un título de 72px es una regresión.
        'sdm-display-xl': ['4.5rem', { lineHeight: '1.02', letterSpacing: '-1px' }],
        'sdm-display-lg': ['3.25rem', { lineHeight: '1.05', letterSpacing: '-0.03125rem' }],
        'sdm-display-md': ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.03125rem' }],
        'sdm-display-sm': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.03125rem' }],
        // UI / cuerpo — Inter
        'sdm-xs':   '0.6875rem',
        'sdm-sm':   '0.8125rem',
        'sdm-base': '0.9375rem',
        'sdm-lg':   '1.0625rem',
        'sdm-xl':   '1.25rem',
        'sdm-2xl':  '1.5rem',
      },
      letterSpacing: {
        'sdm-tight':  '-0.03125rem',
        'sdm-normal': '0',
        'sdm-wide':   '0.125rem',
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
