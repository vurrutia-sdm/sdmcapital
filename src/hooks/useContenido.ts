import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Contenido = Record<string, string>

let cache: Contenido | null = null

export function useContenido() {
  const [contenido, setContenido] = useState<Contenido>(cache || {})
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
      })
  }, [])

  // Helper: get value with fallback
  const get = (key: string, fallback = '') => contenido[key] || fallback

  return { contenido, get, loading }
}

// Call this to invalidate cache after admin saves
export function invalidateContenidoCache() {
  cache = null
}
