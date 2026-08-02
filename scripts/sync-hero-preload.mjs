// Sincroniza el <link rel="preload"> del hero en index.html con la primera
// imagen que HeroCarousel va a pintar realmente.
//
// Esa imagen NO es siempre `hero_imagen_url`: HeroSection arma el arreglo con
// las cinco claves en orden, descarta las vacias y el carrusel arranca en el
// indice 0 del resultado. Si alguien vacia la primera clave desde el admin, la
// que se pinta pasa a ser hero_imagen_url_2. Este script replica esa misma
// eleccion — precargar otra seria peor que no precargar nada: descarga una
// imagen que no se usa y compite por ancho de banda con la que si.
//
// Por qué existe: el hero se pinta con background-image que solo se conoce
// después de que React monta y consulta Supabase, así que la imagen no empieza a
// descargarse hasta tres eslabones dentro de la cadena. El preload la arranca en
// paralelo con el bundle. Como index.html es estático, la URL queda fija; este
// script la refresca en cada build para que no envejezca en silencio.
//
// Si la consulta falla NO rompe el build: deja el preload como esté y avisa.
// Un deploy bloqueado por Supabase caído sería peor que un preload viejo.

import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(import.meta.dirname, '..')
const INDEX = path.join(RAIZ, 'index.html')
const MARCA_INI = '<!-- HERO_PRELOAD:inicio -->'
const MARCA_FIN = '<!-- HERO_PRELOAD:fin -->'

const aviso = (m) => console.warn(`[hero-preload] ${m}`)

function leerEnv() {
  // Los archivos primero y process.env encima: las variables de entorno mandan,
  // que es lo convencional y lo que permite sobrescribir en CI o en pruebas.
  const env = {}
  for (const archivo of ['.env', '.env.local']) {
    const p = path.join(RAIZ, archivo)
    if (!fs.existsSync(p)) continue
    for (const linea of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return { ...env, ...process.env }
}

// Mismo orden que HeroSection.tsx. Si cambia alla, tiene que cambiar aca.
const CLAVES_HERO = [
  'hero_imagen_url',
  'hero_imagen_url_2',
  'hero_imagen_url_3',
  'hero_imagen_url_4',
  'hero_imagen_url_5',
]

async function obtenerUrlHero() {
  const env = leerEnv()
  const base = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) { aviso('faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY; se deja el preload como esta'); return null }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(
      `${base}/rest/v1/contenido_sitio?clave=in.(${CLAVES_HERO.join(',')})&select=clave,valor`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: ctrl.signal },
    )
    if (!res.ok) { aviso(`Supabase respondio ${res.status}; se deja el preload como esta`); return null }
    const filas = await res.json()
    if (!Array.isArray(filas)) { aviso('respuesta inesperada de Supabase; se deja el preload como esta'); return null }
    const porClave = new Map(filas.map((f) => [f.clave, (f.valor || '').trim()]))
    // La primera no vacia, en el orden de las claves: es la que pinta el carrusel.
    const clave = CLAVES_HERO.find((c) => porClave.get(c))
    const url = clave && porClave.get(clave)
    if (!url) { aviso('las cinco claves de hero estan vacias; se deja el preload como esta'); return null }
    if (!/^https?:\/\//.test(url)) { aviso(`${clave} no parece una URL (${String(url).slice(0, 40)}); se deja el preload como esta`); return null }
    if (clave !== CLAVES_HERO[0]) console.log(`[hero-preload] la primera imagen es ${clave} (${CLAVES_HERO[0]} esta vacia)`)
    return url
  } catch (e) {
    aviso(`no se pudo consultar Supabase (${e.name === 'AbortError' ? 'timeout' : e.message}); se deja el preload como esta`)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

const url = await obtenerUrlHero()
if (!url) process.exit(0)   // nunca falla el build

let html = fs.readFileSync(INDEX, 'utf8')
const i = html.indexOf(MARCA_INI)
const f = html.indexOf(MARCA_FIN)
if (i === -1 || f === -1) {
  aviso(`no encontre las marcas ${MARCA_INI} / ${MARCA_FIN} en index.html; no se toca nada`)
  process.exit(0)
}

const bloque =
  `${MARCA_INI}\n` +
  `    <!-- Generado por scripts/sync-hero-preload.mjs en cada build. NO editar a mano. -->\n` +
  `    <link rel="preload" as="image" fetchpriority="high" href="${url}" />\n` +
  `    ${MARCA_FIN}`

const nuevo = html.slice(0, i) + bloque + html.slice(f + MARCA_FIN.length)
if (nuevo === html) {
  console.log('[hero-preload] sin cambios')
} else {
  fs.writeFileSync(INDEX, nuevo)
  console.log(`[hero-preload] actualizado -> ${url}`)
}
