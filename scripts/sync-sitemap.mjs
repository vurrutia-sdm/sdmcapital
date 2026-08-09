// Genera public/sitemap.xml consultando Supabase, en el prebuild.
//
// El anterior estaba escrito a mano: 10 URLs, sin tocar desde el 6 de mayo, y
// para entonces el sitio tenía 82 fichas de propiedad y 13 artículos publicados
// que no aparecían en ninguna parte. Un sitemap que no se regenera envejece en
// silencio: no falla, no avisa, solo deja de describir el sitio.
//
// Mismo patrón que `sync-hero-preload.mjs` y `sync-contenido-seed.mjs`: script
// de prebuild, lee `.env` con el helper compartido, consulta con la anon key y
// escribe un archivo del repo.
//
// SI SUPABASE FALLA, SE DEJA EL SITEMAP ANTERIOR. Igual que la semilla. Un
// sitemap viejo describe el sitio de la última vez que el build tuvo red; un
// sitemap vacío o a medias le dice a Google que las páginas que faltan ya no
// existen, que es un daño real y no una simple desactualización.
//
// SOLO LO QUE RESPONDE 200. Las propiedades con `activo = false` y los
// artículos con `publicado = false` no entran: declarar una URL que devuelve
// «no encontrada» es peor que no declararla, porque gasta presupuesto de rastreo
// y baja la confianza en el resto del archivo.
//
// NO ENTRAN LAS URLS CON PARÁMETROS. Los filtros del catálogo —?estado=, ?tipo=,
// ?bono_pie=— generan miles de combinaciones que son la misma página con otro
// recorte, y todas se canonicalizan a la ruta limpia. Declararlas sería pedirle
// a Google que rastree lo que el canonical le está diciendo que ignore.

import fs from 'node:fs'
import path from 'node:path'
import { leerEnv } from './lib/entorno.mjs'

const RAIZ = path.resolve(import.meta.dirname, '..')
const DESTINO = path.join(RAIZ, 'public', 'sitemap.xml')
const BASE = 'https://sdmcapital.cl'
const TIMEOUT_MS = 10000

const aviso = (m) => console.log(`[sitemap] ${m}`)

// Las rutas fijas, con la frecuencia y prioridad que ya traía el archivo escrito
// a mano para las que existían. Las ocho nuevas —los dos catálogos por
// categoría, rental, vende, la evaluación y las tres legales— no estaban.
const FIJAS = [
  ['/', 'weekly', '1.0'],
  ['/propiedades', 'daily', '0.9'],
  ['/proyectos-nuevos', 'daily', '0.9'],
  ['/propiedades-usadas', 'daily', '0.9'],
  ['/quienes-somos', 'monthly', '0.8'],
  ['/servicios', 'monthly', '0.8'],
  ['/servicios/inversion-internacional', 'monthly', '0.7'],
  ['/servicios/inversion-chile', 'monthly', '0.7'],
  ['/servicios/financiamiento-personas', 'monthly', '0.7'],
  ['/servicios/financiamiento-empresas', 'monthly', '0.7'],
  ['/blog', 'weekly', '0.8'],
  ['/asociados', 'monthly', '0.6'],
  ['/rental', 'monthly', '0.7'],
  ['/vende-con-nosotros', 'monthly', '0.7'],
  ['/evaluacion-gratuita', 'monthly', '0.7'],
  ['/politica-de-privacidad', 'yearly', '0.3'],
  ['/condiciones-del-servicio', 'yearly', '0.3'],
  ['/eliminacion-de-datos', 'yearly', '0.3'],
]

// `/reserva/confirmacion` NO entra: es la página de retorno de una pasarela de
// pago. Solo tiene sentido con los datos de una transacción y no debe rastrearse.
// `/propiedades/:id/showcase` tampoco: es una vista de presentación en inglés
// de una sola propiedad, con el mismo contenido que su ficha.

function xmlEscape(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function fecha(valor) {
  if (!valor) return null
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

async function consultar(url, anon, ruta) {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${url}/rest/v1/${ruta}`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const filas = await res.json()
    if (!Array.isArray(filas)) throw new Error('respuesta inesperada')
    return filas
  } finally {
    clearTimeout(timeout)
  }
}

const env = leerEnv()
const url = env.VITE_SUPABASE_URL
const anon = env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  aviso('faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY; se deja el sitemap como esta')
  process.exit(0)
}

let props, posts
try {
  ;[props, posts] = await Promise.all([
    consultar(url, anon, 'propiedades?select=slug,id,updated_at&activo=eq.true&limit=1000'),
    consultar(url, anon, 'blog_posts?select=slug,updated_at,created_at&publicado=eq.true&limit=1000'),
  ])
} catch (e) {
  aviso(`no se pudo consultar Supabase (${e.name === 'AbortError' ? 'timeout' : e.message}); se deja el sitemap como esta`)
  process.exit(0)
}

const urls = []
for (const [ruta, freq, prio] of FIJAS) {
  urls.push({ loc: BASE + ruta, changefreq: freq, priority: prio })
}

let sinSlug = 0
for (const p of props) {
  const slug = (p.slug || '').trim() || p.id
  if (!slug) { sinSlug++; continue }
  urls.push({
    loc: `${BASE}/propiedades/${slug}`,
    lastmod: fecha(p.updated_at),
    changefreq: 'weekly',
    priority: '0.8',
  })
}

for (const a of posts) {
  const slug = (a.slug || '').trim()
  if (!slug) { sinSlug++; continue }
  urls.push({
    loc: `${BASE}/blog/${slug}`,
    // `updated_at` y no `created_at`: es la fecha del último cambio, que es lo
    // que `lastmod` significa. Ver el aviso de más abajo sobre la edición masiva.
    lastmod: fecha(a.updated_at) || fecha(a.created_at),
    changefreq: 'monthly',
    priority: '0.7',
  })
}

const cuerpo = urls
  .map((u) => {
    const partes = [`    <loc>${xmlEscape(u.loc)}</loc>`]
    if (u.lastmod) partes.push(`    <lastmod>${u.lastmod}</lastmod>`)
    partes.push(`    <changefreq>${u.changefreq}</changefreq>`)
    partes.push(`    <priority>${u.priority}</priority>`)
    return `  <url>\n${partes.join('\n')}\n  </url>`
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERADO POR scripts/sync-sitemap.mjs EN EL PREBUILD. NO EDITAR A MANO:
     el siguiente build lo sobreescribe. Para cambiar las rutas fijas, editar
     la constante FIJAS del script. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cuerpo}
</urlset>
`

const anterior = fs.existsSync(DESTINO) ? fs.readFileSync(DESTINO, 'utf8') : ''
if (anterior === xml) {
  aviso(`sin cambios (${urls.length} URLs)`)
} else {
  fs.writeFileSync(DESTINO, xml)
  aviso(`escrito: ${urls.length} URLs (${FIJAS.length} fijas, ${props.length} propiedades, ${posts.length} articulos)`)
}
if (sinSlug > 0) aviso(`${sinSlug} fila(s) sin slug ni id, omitidas`)

// AVISO SOBRE `lastmod` DE LOS ARTÍCULOS.
//
// Doce de los trece comparten `updated_at` del 2026-08-02 por una edición
// masiva, así que ese `lastmod` no describe un cambio de contenido real. No se
// sustituye por `created_at` a propósito: `created_at` describiría bien el
// pasado pero se quedaría congelado en cuanto alguien edite un artículo de
// verdad, y entonces el sitemap mentiría en la dirección contraria — diría que
// no cambió algo que sí cambió, que es el error que Google penaliza.
//
// La fecha se corrige sola en cuanto cada artículo se edite de verdad. Mientras
// tanto, Google ve trece artículos tocados el mismo día: no es exacto, pero es
// una imprecisión que se cura, no un dato falso que se perpetúa.
const mismaFecha = posts.filter((a) => fecha(a.updated_at) === '2026-08-02').length
if (mismaFecha >= 5) {
  aviso(`${mismaFecha} articulos comparten lastmod ${'2026-08-02'} (edicion masiva, no cambios reales)`)
}
