import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Contenido = Record<string, string>

// La semilla que `scripts/sync-contenido-seed.mjs` deja escrita en index.html
// durante el build. Sirve para que el primer render ya pinte el texto definitivo
// en vez de los defaults del código, que se ven ~600ms hasta que contesta la
// consulta. Es solo el arranque: la consulta se hace igual y lo que vuelva pisa
// la semilla, porque la semilla es de la hora del build y envejece si alguien
// edita desde el admin sin deployar.
//
// Se lee una sola vez al importar el módulo: el <script> es estático, no cambia.
// Cualquier problema —bloque ausente, JSON roto, forma inesperada— devuelve null
// y el hook se comporta exactamente como antes. Un contenido mal sembrado nunca
// debe dejar la página en blanco.
function leerSemilla(): Contenido | null {
  if (typeof document === 'undefined') return null
  const crudo = document.getElementById('sdm-contenido-seed')?.textContent?.trim()
  if (!crudo) return null
  try {
    const datos: unknown = JSON.parse(crudo)
    if (!datos || typeof datos !== 'object' || Array.isArray(datos)) return null
    const map: Contenido = {}
    for (const [clave, valor] of Object.entries(datos as Record<string, unknown>)) {
      if (typeof valor === 'string') map[clave] = valor
    }
    return Object.keys(map).length ? map : null
  } catch {
    return null
  }
}

const semilla = leerSemilla()

let cache: Contenido | null = null

export function useContenido() {
  const [contenido, setContenido] = useState<Contenido>(cache || semilla || {})
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache) { setContenido(cache); setLoading(false); return }
    supabase.from('contenido_sitio').select('clave, valor')
      .then(({ data }) => {
        if (data) {
          const map: Contenido = {}
          data.forEach(({ clave, valor }) => { map[clave] = valor })
          cache = map
          setContenido(map)
        }
        setLoading(false)
      },
      // El segundo argumento, no `.catch`: lo que devuelve el builder de
      // supabase es un `PromiseLike`, que solo tiene `then`.
      //
      // supabase-js entrega los errores dentro de `{ error }` en vez de
      // rechazar, así que esto casi nunca corre. Está para que un rechazo raro
      // no deje `loading` en true para siempre: hay UI que espera esa bandera
      // para dejar de mostrar el esqueleto, y el contador del hero para saber
      // que su número ya no va a cambiar.
      () => setLoading(false))
  }, [])

  // Helper: get value with fallback
  const get = (key: string, fallback = '') => contenido[key] || fallback

  // `listo` = lo que se está mostrando ya es el valor final, no un provisorio en
  // camino a cambiar. Con semilla es true desde el primer render; sin semilla,
  // cuando contesta la consulta (haya datos o no — si falló, el default ES el
  // valor final). Lo usa el contador del hero, que no puede arrancar hacia un
  // objetivo que va a moverse. Distinto de `!loading`, que solo mira la consulta.
  const listo = !loading || semilla !== null

  return { contenido, get, loading, listo }
}

// Call this to invalidate cache after admin saves
export function invalidateContenidoCache() {
  cache = null
}
