// UF y dólar observado, desde mindicador.cl.
//
// FUENTE ÚNICA. Antes el `fetch` vivía dentro de `CotizacionesAdmin.tsx`, que
// es el chunk del admin —~2 MB, diferido a propósito—, así que el sitio público
// no podía reutilizarlo sin arrastrarlo entero. Se extrae acá para que el
// wizard de cotizaciones y la barra del header pidan lo mismo al mismo sitio.
//
// UNA PETICIÓN PARA LOS DOS. `mindicador.cl/api` devuelve los doce indicadores
// del día; el endpoint `/api/uf` que usaba el admin traía solo uno. Pedir el
// índice completo cuesta lo mismo y evita una segunda petición para el dólar.
//
// CADA INDICADOR TRAE SU PROPIA FECHA, Y HAY QUE RESPETARLA. El dólar observado
// no se publica fines de semana ni festivos: un domingo, la UF es de hoy y el
// dólar del viernes. Mostrar los dos bajo la fecha de hoy es decir que el dólar
// vale algo que no vale. Por eso `fecha` viaja con cada valor y no se sustituye
// por `new Date()`.
//
// ─── TRES INTENTOS, EN ESTE ORDEN ──────────────────────────────────────────
//
// La barra mostraba «UF —» y «DÓLAR —» las primeras horas de cada día, y la
// causa no era la fuente: era pedirle el dato a un solo sitio.
//
// `/api` es un documento DEL DÍA que arma mindicador, y en las primeras horas
// todavía no está poblado: los nodos `uf` y `dolar` faltan o vienen sin valor.
// Pero el valor existe. El Banco Central emite la UF diaria del 9 de cada mes
// al 9 del siguiente, así que `/api/uf` la tiene publicada con casi un mes de
// anticipación —comprobado: 252 nodos, el más nuevo a 29 días vista—. Que
// saliera vacía era un bug nuestro, no un límite del origen.
//
//   1. `/api` — un viaje para los dos indicadores. Acierta el resto del día.
//   2. `/api/<codigo>` — la serie de los últimos 30 días, SOLO para el que
//      faltó. En la ventana rota de la madrugada es el que trae el valor real.
//   3. `localStorage` — el último valor conocido, si los dos anteriores caen.
//
// El paso 3 es lo que permite que la barra jamás pinte un guión, y por eso
// `guardarCache()` descarta los nulos: una respuesta vacía no puede sobrescribir
// un valor bueno de ayer. Sin eso, una madrugada mala borraría el respaldo justo
// cuando hace falta.
//
// Ningún valor de respaldo está escrito a mano en este archivo. Cualquier cifra
// que se pinte salió alguna vez de mindicador, y viaja con la fecha en que se
// publicó para que quien la lea sepa de cuándo es.

export type Indicador = { valor: number; fecha: string }
export type Indicadores = { uf: Indicador | null; dolar: Indicador | null }

const API = 'https://mindicador.cl/api'
const TIMEOUT_MS = 6000
const CACHE_KEY = 'sdm:indicadores'

// La fecha de HOY en Chile, en `YYYY-MM-DD`.
//
// `new Date().toISOString().slice(0, 10)` —lo que había— da la fecha UTC. Chile
// va en UTC-4, así que desde las 20:00 de cada noche esa cuenta ya devolvía la
// de mañana, y la barra estampaba «al 11 ago» sobre datos que sí eran de hoy.
//
// `en-CA` es el atajo: es el único locale corriente cuyo formato de fecha corta
// ya es ISO, así que no hay que armar el string a mano desde las partes.
export function hoyEnChile(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

// `null` ante cualquier duda, nunca un cero ni un valor de otro día.
//
// Un cero en un indicador financiero no se lee como «no hay dato»: se lee como
// un dato. Por eso esto valida antes de dejar pasar, y es el mismo filtro que
// se aplica a lo que sale del `localStorage`: basura guardada por una versión
// vieja del formato no sobrevive a la lectura.
function leer(nodo: unknown): Indicador | null {
  if (!nodo || typeof nodo !== 'object') return null
  const n = nodo as { valor?: unknown; fecha?: unknown }
  const valor = typeof n.valor === 'number' ? n.valor : Number(n.valor)
  if (!Number.isFinite(valor) || valor <= 0) return null
  const fecha = typeof n.fecha === 'string' ? n.fecha : ''
  return { valor, fecha }
}

function leerCache(): Indicadores {
  try {
    const crudo = localStorage.getItem(CACHE_KEY)
    if (!crudo) return { uf: null, dolar: null }
    const d = JSON.parse(crudo) as Record<string, unknown>
    return { uf: leer(d.uf), dolar: leer(d.dolar) }
  } catch {
    return { uf: null, dolar: null }
  }
}

// Solo escribe lo que trae valor. Un `null` recién llegado conserva lo guardado.
function guardarCache(nuevo: Indicadores): void {
  const previo = leerCache()
  const fusion = { uf: nuevo.uf ?? previo.uf, dolar: nuevo.dolar ?? previo.dolar }
  if (!fusion.uf && !fusion.dolar) return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(fusion))
  } catch {
    // Modo privado o cuota llena. Se pierde el respaldo, no la petición.
  }
}

// Para pintar desde el primer frame, sin esperar la red.
//
// La barra arrancaba en `{ null, null }` y pintaba dos guiones durante los uno o
// dos segundos que tarda mindicador, en CADA carga de página, aunque la
// respuesta acabara llegando bien. Con esto arranca en el último valor conocido
// y la petición solo lo actualiza.
export function indicadoresCacheados(): Indicadores {
  return leerCache()
}

async function pedirJSON(url: string, signal: AbortSignal): Promise<unknown> {
  const r = await fetch(url, { signal })
  // mindicador responde 500 con cuerpo JSON en sus errores («Indicador
  // económico incorrecto»), así que hay que mirar el status y no el `.json()`.
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// El valor publicado más reciente que NO sea del futuro.
//
// La serie viene ordenada de más nueva a más vieja, pero tomar `serie[0]` a
// ciegas sería un error justo para la UF: es la que se publica con anticipación,
// así que el primer nodo puede ser de dentro de tres semanas. Mostrar eso como
// «la UF de hoy» es publicar una cifra que todavía no rige.
async function ultimoDeSerie(codigo: 'uf' | 'dolar', signal: AbortSignal): Promise<Indicador | null> {
  try {
    const d = (await pedirJSON(`${API}/${codigo}`, signal)) as { serie?: unknown }
    if (!Array.isArray(d.serie)) return null
    const hoy = hoyEnChile()
    for (const nodo of d.serie) {
      const i = leer(nodo)
      if (i && i.fecha && i.fecha.slice(0, 10) <= hoy) return i
    }
    return null
  } catch {
    return null
  }
}

export async function obtenerIndicadores(): Promise<Indicadores> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS)

  let raiz: Indicadores = { uf: null, dolar: null }
  try {
    const d = (await pedirJSON(API, ctrl.signal)) as Record<string, unknown>
    raiz = { uf: leer(d.uf), dolar: leer(d.dolar) }
  } catch {
    // Se sigue al paso 2. El timeout es compartido, así que los dos intentos
    // caben dentro de los mismos 6 s y una fuente caída no duplica la espera.
  }

  // Las dos series en paralelo, y solo la que falte: `??` deja pasar el valor
  // que ya vino sin gastar una petición. `ultimoDeSerie` no lanza, así que esto
  // no necesita su propio `catch` — lo peor que devuelve es el `null` que había.
  const [uf, dolar] = await Promise.all([
    raiz.uf ?? ultimoDeSerie('uf', ctrl.signal),
    raiz.dolar ?? ultimoDeSerie('dolar', ctrl.signal),
  ])
  clearTimeout(timeout)

  guardarCache({ uf, dolar })
  const previo = leerCache()
  return { uf: uf ?? previo.uf, dolar: dolar ?? previo.dolar }
}

// Formato chileno: miles con punto, decimales con coma.
export function formatear(v: number, decimales = 2): string {
  return v.toLocaleString('es-CL', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
}

// «7 ago» — corto porque va en una barra de una línea.
//
// Con `timeZone` explícito: mindicador fecha sus nodos a medianoche de Chile
// (`T04:00:00.000Z`), y un navegador en UTC-5 o más al oeste retrocedería esa
// marca al día anterior. La fecha de un indicador chileno se lee en Chile.
export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d
    .toLocaleDateString('es-CL', { day: 'numeric', month: 'short', timeZone: 'America/Santiago' })
    .replace('.', '')
}
