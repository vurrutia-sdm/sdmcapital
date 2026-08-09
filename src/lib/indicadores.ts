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

export type Indicador = { valor: number; fecha: string }
export type Indicadores = { uf: Indicador | null; dolar: Indicador | null }

const API = 'https://mindicador.cl/api'
const TIMEOUT_MS = 6000

// `null` ante cualquier duda, nunca un cero ni un valor de otro día.
//
// Un cero en un indicador financiero no se lee como «no hay dato»: se lee como
// un dato. Y un valor cacheado de ayer es peor todavía, porque no hay forma de
// que quien mira lo distinga del de hoy. Quien llame decide qué pintar cuando
// esto devuelve `null` — la barra pinta guiones y el wizard deja el campo para
// que lo escriban a mano.
function leer(nodo: unknown): Indicador | null {
  if (!nodo || typeof nodo !== 'object') return null
  const n = nodo as { valor?: unknown; fecha?: unknown }
  const valor = typeof n.valor === 'number' ? n.valor : Number(n.valor)
  if (!Number.isFinite(valor) || valor <= 0) return null
  const fecha = typeof n.fecha === 'string' ? n.fecha : ''
  return { valor, fecha }
}

export async function obtenerIndicadores(): Promise<Indicadores> {
  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const r = await fetch(API, { signal: ctrl.signal })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const d = (await r.json()) as Record<string, unknown>
    return { uf: leer(d.uf), dolar: leer(d.dolar) }
  } catch {
    return { uf: null, dolar: null }
  } finally {
    clearTimeout(timeout)
  }
}

// Formato chileno: miles con punto, decimales con coma.
export function formatear(v: number, decimales = 2): string {
  return v.toLocaleString('es-CL', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
}

// «7 ago» — corto porque va en una barra de una línea.
export function fechaCorta(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }).replace('.', '')
}
