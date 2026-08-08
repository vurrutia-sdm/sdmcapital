// Siembra el contenido del hero dentro de index.html para que el primer pintado
// ya sea el definitivo.
//
// El problema: los textos del hero viven en `contenido_sitio`, y `useContenido`
// los consulta recién después de que React monta. Hasta que llega la respuesta
// se pintan los defaults escritos en el código, así que el visitante lee «Tu
// socio» y a los ~600ms el texto cambia a «Tu socio confiable». Medido antes de
// este script: primer texto a 142ms, cambio a 807ms.
//
// Las alternativas se descartaron por medición, no por gusto:
//   · No pintar hasta tener datos deja el hero vacío ese mismo rato, y el <h1>
//     del hero es el candidato a LCP — se vería mejor y mediría peor.
//   · Cachear en localStorage no arregla la primera visita, que es la que
//     forma la impresión.
//   · Sincronizar los defaults a mano tapa el síntoma y se desincroniza en el
//     primer cambio del admin. De hecho ya había pasado: el default decía
//     «Chile y el extranjero» y «10 países» mucho después de que la operación
//     quedara en Chile y Paraguay.
//
// EL COMPROMISO, que es real y hay que tenerlo presente: la semilla es de la
// hora del build. Si Víctor edita un texto del hero desde el admin y no hay
// deploy, la semilla queda vieja — el primer pintado muestra lo anterior y la
// consulta en vivo lo corrige, o sea vuelve el flash. La diferencia con hoy es
// que el flash pasa de constante a intermitente: solo entre una edición y el
// siguiente deploy, y solo si la edición tocó el hero. Un deploy lo resincroniza.
//
// Si la consulta falla NO rompe el build: deja la semilla como esté y avisa. Se
// deja la anterior en vez de vaciarla porque una semilla de ayer sigue siendo
// mejor que ninguna — y ninguna es exactamente el comportamiento de antes de
// este script, así que el piso está garantizado igual.

import fs from 'node:fs'
import path from 'node:path'
import { leerEnv } from './lib/entorno.mjs'

const RAIZ = path.resolve(import.meta.dirname, '..')
const INDEX = path.join(RAIZ, 'index.html')
const MARCA_INI = '<!-- CONTENIDO_SEED:inicio -->'
const MARCA_FIN = '<!-- CONTENIDO_SEED:fin -->'
const ID = 'sdm-contenido-seed'

const aviso = (m) => console.warn(`[contenido-seed] ${m}`)

// Exactamente las claves que HeroSection.tsx le pide a `get()`. Si allá se
// agrega o se saca una, acá también: sembrar de más pesa sin servir, y sembrar
// de menos deja esa clave con el flash de siempre.
//
// Por ahora solo el hero. Los otros 15 componentes que usan `useContenido`
// tienen el mismo patrón y el mismo flash; se resuelven ampliando esta lista o
// sembrando la tabla entera, pero eso se decide con la medición del hero a la
// vista. Ver SINCRONIA.md.
const CLAVES = [
  'hero_titulo_1', 'hero_titulo_2', 'hero_titulo_3',
  'hero_subtitulo', 'hero_location',
  'stats_propiedades', 'stats_anios', 'stats_paises',
  'hero_imagen_url', 'hero_imagen_url_2', 'hero_imagen_url_3', 'hero_imagen_url_4', 'hero_imagen_url_5',
  'hero_pos_1', 'hero_pos_2', 'hero_pos_3', 'hero_pos_4', 'hero_pos_5',
]

// El contenido de `contenido_sitio` lo escribe Víctor desde el admin, así que
// desde acá es entrada no confiable: un `</script>` en cualquier texto cerraría
// el bloque y lo que siguiera se parsearía como HTML.
//
// Dentro de un <script> el parser de HTML trata todo como texto crudo y NO
// decodifica entidades, así que `&` y `"` viajan tal cual y no hay que tocarlos
// (escaparlos los rompería: llegarían como `&amp;` literal). Lo único que
// termina el bloque es la secuencia `</script`, y también `<!--` abre un
// comentario. Las dos empiezan por `<`, así que alcanza con escapar todos los
// `<` como \u003c — que dentro de JSON es exactamente el mismo carácter y
// JSON.parse lo devuelve intacto.
//
// Encima el bloque va con type="application/json": el navegador no lo ejecuta
// jamás, así que aunque este escape fallara no habría nada que ejecutar.
function aJsonSeguro(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

async function obtenerContenido() {
  const env = leerEnv()
  const base = env.VITE_SUPABASE_URL
  const key = env.VITE_SUPABASE_ANON_KEY
  if (!base || !key) { aviso('faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY; se deja la semilla como esta'); return null }

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), 10_000)
  try {
    const res = await fetch(
      `${base}/rest/v1/contenido_sitio?clave=in.(${CLAVES.join(',')})&select=clave,valor`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: ctrl.signal },
    )
    if (!res.ok) { aviso(`Supabase respondio ${res.status}; se deja la semilla como esta`); return null }
    const filas = await res.json()
    if (!Array.isArray(filas)) { aviso('respuesta inesperada de Supabase; se deja la semilla como esta'); return null }

    const semilla = {}
    for (const f of filas) {
      if (typeof f?.clave !== 'string' || typeof f?.valor !== 'string') continue
      if (!CLAVES.includes(f.clave)) continue   // in.() ya filtra, pero el objeto se inyecta: no se confia
      semilla[f.clave] = f.valor
    }
    if (!Object.keys(semilla).length) { aviso('no volvio ninguna clave del hero; se deja la semilla como esta'); return null }

    const faltantes = CLAVES.filter((c) => !(c in semilla))
    if (faltantes.length) console.log(`[contenido-seed] sin valor en la base (usan el default): ${faltantes.join(', ')}`)
    return semilla
  } catch (e) {
    aviso(`no se pudo consultar Supabase (${e.name === 'AbortError' ? 'timeout' : e.message}); se deja la semilla como esta`)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

const semilla = await obtenerContenido()
if (!semilla) process.exit(0)   // nunca falla el build

let html = fs.readFileSync(INDEX, 'utf8')
const i = html.indexOf(MARCA_INI)
const f = html.indexOf(MARCA_FIN)
if (i === -1 || f === -1) {
  aviso(`no encontre las marcas ${MARCA_INI} / ${MARCA_FIN} en index.html; no se toca nada`)
  process.exit(0)
}

const json = aJsonSeguro(semilla)
const bloque =
  `${MARCA_INI}\n` +
  `    <!-- Generado por scripts/sync-contenido-seed.mjs en cada build. NO editar a mano. -->\n` +
  `    <script type="application/json" id="${ID}">${json}</script>\n` +
  `    ${MARCA_FIN}`

const nuevo = html.slice(0, i) + bloque + html.slice(f + MARCA_FIN.length)
if (nuevo === html) {
  console.log(`[contenido-seed] sin cambios (${Object.keys(semilla).length} claves, ${Buffer.byteLength(json, 'utf8')} bytes)`)
} else {
  fs.writeFileSync(INDEX, nuevo)
  console.log(`[contenido-seed] actualizado -> ${Object.keys(semilla).length} claves, ${Buffer.byteLength(json, 'utf8')} bytes`)
}
