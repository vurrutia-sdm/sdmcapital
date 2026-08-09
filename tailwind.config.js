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
        // ESTOS CUATRO NO LLEVAN VALOR: APUNTAN A globals.css.
        //
        // Antes estaban escritos acá Y allá, y `muted` acabó valiendo dos cosas
        // —#7a8a96 en este archivo, #5F7183 en globals.css—. El primero da
        // 3,56:1 sobre blanco y no cumple AA: era el valor que la auditoría ya
        // había rechazado, corregido en globals.css y olvidado acá. Durante ese
        // tiempo `var(--muted)` pintaba el que cumple y `text-muted` el que no.
        //
        // Con `var()` el valor vive en UN SOLO SITIO y la divergencia deja de
        // ser posible por construcción. Sin test, sin script de prebuild, sin
        // dependencia nueva: no hay dos números que puedan separarse.
        //
        // EL COSTE: se pierden los modificadores de opacidad —`text-muted/50`
        // deja de funcionar—. Recuperarlos exigiría guardar el token como
        // canales sueltos (`--muted: 95 113 131`) y envolverlo en
        // `rgb(var(--muted) / <alpha-value>)`, que cambiaría cómo se escriben
        // los 306 `var(--muted)` del proyecto. Hoy no hay ni un solo uso de
        // esos modificadores, así que el coste es cero.
        //
        // NAVY, GREEN Y SKY NO ENTRAN. Están anidados —navy.DEFAULT, navy.dark,
        // navy.deeper— y no tienen equivalente exacto en globals.css. Forzarlos
        // obligaría a inventar tokens para que encajen, que es peor que la
        // duplicación que esto resuelve.
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        off: 'var(--off)',
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
      // Espejo de la escala de movimiento. La curva es la que Tailwind ya usa
      // por defecto: tokenizarla alinea las transiciones inline —49 de las
      // cuales no declaran ninguna— con las que llegan por clase.
      transitionDuration: {
        'sdm-rapido': 'var(--sdm-mov-rapido)',
        'sdm-normal': 'var(--sdm-mov-normal)',
        'sdm-lento':  'var(--sdm-mov-lento)',
      },
      transitionTimingFunction: {
        'sdm': 'var(--sdm-curva)',
      },
      // Espejo de la escala de peso. Solo los tres que las dos familias tienen
      // de verdad: Inter carga 300/400/500 y nada más, así que `font-semibold`
      // y `font-bold` producen negrita SINTÉTICA sobre Inter. No se tokenizan.
      fontWeight: {
        'sdm-ligero': 'var(--sdm-peso-ligero)',
        'sdm-normal': 'var(--sdm-peso-normal)',
        'sdm-medio':  'var(--sdm-peso-medio)',
      },
      // Espejo de la escala de radio de globals.css, con `var()` por la misma
      // razón que los cuatro colores: el valor vive en un solo sitio.
      // `extend` no borra los radios nativos de Tailwind — `rounded-full` sigue
      // existiendo, y es lo correcto para círculos y píldoras, que no entran en
      // la escala porque ahí el radio define la forma y no redondea una esquina.
      borderRadius: {
        'sdm-control':    'var(--sdm-radio-control)',
        'sdm-contenedor': 'var(--sdm-radio-contenedor)',
        'sdm-flotante':   'var(--sdm-radio-flotante)',
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
