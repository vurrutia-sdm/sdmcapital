// Reordenamiento por arrastre para las listas del admin.
//
// Lo usan los paneles Propiedades, Equipo y Asociados a través de `useDragSort`,
// y el sidebar de AdminPage a través de `usePointerSort` — el sidebar guarda su
// orden en localStorage y no lo sincroniza desde props, así que usa solo la
// mecánica y se salta el estado.
//
// Va en src/components/admin/ y no en src/hooks/ a propósito: src/hooks/ es
// zona compartida entre sesiones y esto es exclusivo del admin.
//
// ─── POR QUÉ POINTER EVENTS Y NO LA API HTML5 ────────────────────────────────
// Antes esto usaba `draggable` + onDragStart/onDragEnter/onDragEnd. Esa API no
// dispara desde eventos táctiles ni en iOS ni en Android: en el teléfono el
// arrastre sencillamente no existía, y por eso la manija estaba escondida
// debajo de lg. Pointer Events unifica ratón, dedo y lápiz en una sola API.
//
// Lo único que se pierde en el cambio es el fantasma semitransparente que
// dibujaba el navegador solo. Se reemplaza reordenando la lista en vivo durante
// el arrastre, que además muestra el resultado antes de soltar.

import { useState, useEffect, useRef, useId } from 'react'
import type { Dispatch, SetStateAction, CSSProperties, PointerEvent as EventoPuntero, MouseEvent as EventoRaton } from 'react'

type Oyente = [string, (e: PointerEvent) => void]

// Píxeles a recorrer antes de que esto cuente como arrastre. Sin umbral, el
// temblor de uno o dos píxeles que trae cualquier toque con el dedo bastaría
// para reordenar la lista al tocar la manija.
const UMBRAL = 6

export function usePointerSort<T>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  alSoltar: (items: T[]) => void,
) {
  const zona = useId()
  const [arrastrando, setArrastrando] = useState<number | null>(null)

  const desde = useRef<number | null>(null)
  const origen = useRef<{ x: number; y: number } | null>(null)
  const activo = useRef(false)
  const movio = useRef(false)
  const tragarClick = useRef(false)
  const oyentes = useRef<Oyente[] | null>(null)

  // El commit final sale de este ref y no de la clausura: durante el arrastre la
  // lista se reordena en vivo, así que al soltar hace falta el orden que quedó,
  // no el que había cuando se creó el handler.
  const ultimo = useRef(items)
  ultimo.current = items

  // Lo mismo con la función de guardado: los consumidores la pasan como arrow
  // inline, así que cambia de identidad en cada render. Los oyentes de window se
  // instalan una sola vez por arrastre y sobreviven a esos renders.
  const guardar = useRef(alSoltar)
  guardar.current = alSoltar

  // Con setPointerCapture todos los eventos siguen apuntando a la fila donde
  // empezó el arrastre, así que la fila de destino hay que buscarla por
  // coordenadas. La zona evita que dos listas de la misma pantalla se pisen.
  const indiceEn = (x: number, y: number) => {
    const fila = document.elementFromPoint(x, y)?.closest(`[data-orden-zona="${CSS.escape(zona)}"]`)
    const n = fila?.getAttribute('data-orden-idx')
    return n == null ? null : Number(n)
  }

  const soltarOyentes = () => {
    oyentes.current?.forEach(([tipo, fn]) => window.removeEventListener(tipo, fn as EventListener))
    oyentes.current = null
  }

  const limpiar = () => {
    soltarOyentes()
    desde.current = null; origen.current = null
    activo.current = false; movio.current = false
    setArrastrando(null)
  }

  useEffect(() => soltarOyentes, [])

  // El arrastre se sigue y se termina desde `window`, no desde la fila.
  //
  // Medido: si el `pointerup` dependiera de caer sobre una fila, soltar fuera de
  // la lista dejaba el reordenamiento hecho EN PANTALLA pero sin guardar — y el
  // commit salía después, pegado a un toque cualquiera y sin relación con él.
  // En una grilla de miniaturas de tres columnas soltar fuera es facilísimo, y
  // ahí el orden de las fotos es dato, no presentación. `setPointerCapture` no
  // alcanza para cubrirlo: si React desmonta la fila que capturó —le pasa a
  // cualquier lista con el índice dentro de la `key`— la captura se va con ella.
  const montarOyentes = () => {
    const mover = (e: PointerEvent) => {
      if (desde.current === null || origen.current === null) return

      if (!activo.current) {
        if (Math.hypot(e.clientX - origen.current.x, e.clientY - origen.current.y) < UMBRAL) return
        activo.current = true
        setArrastrando(desde.current)
      }

      const destino = indiceEn(e.clientX, e.clientY)
      if (destino === null || destino === desde.current) return

      const previo = desde.current
      desde.current = destino
      movio.current = true
      setArrastrando(destino)
      setItems(antes => {
        const next = [...antes]
        next.splice(destino, 0, next.splice(previo, 1)[0])
        return next
      })
    }

    const soltar = () => {
      const hubo = activo.current && movio.current
      // Se traga el click si hubo arrastre de verdad, aunque no haya cambiado
      // nada de orden: soltar sobre la posición de origen tampoco debería
      // contar como click.
      tragarClick.current = activo.current
      limpiar()
      if (hubo) guardar.current(ultimo.current)
    }

    const cancelar = () => { tragarClick.current = false; limpiar() }

    oyentes.current = [['pointermove', mover], ['pointerup', soltar], ['pointercancel', cancelar]]
    oyentes.current.forEach(([tipo, fn]) => window.addEventListener(tipo, fn as EventListener))
  }

  const filaProps = (i: number) => ({
    'data-orden-zona': zona,
    'data-orden-idx': i,

    onPointerDown: (e: EventoPuntero<HTMLElement>) => {
      // Zonas que no inician arrastre: botones de acción, toggles. Con la API
      // HTML5 esto se conseguía con `draggable={false}` sobre la celda; con
      // Pointer Events ese atributo no tiene ningún efecto y hace falta el
      // descarte explícito.
      if ((e.target as Element).closest('[data-orden-quieto]')) return

      // Con ratón se arrastra desde cualquier parte de la fila, igual que con la
      // API HTML5 que había antes: es la interacción que hoy se usa y no se
      // degrada. Con el dedo, solo desde la manija — si se pudiera arrastrar
      // desde cualquier parte no quedaría forma de scrollear la lista.
      if (e.pointerType === 'mouse') { if (e.button !== 0) return }
      else if (!(e.target as Element).closest('[data-orden-manija]')) return

      soltarOyentes()
      desde.current = i
      origen.current = { x: e.clientX, y: e.clientY }
      activo.current = false
      movio.current = false
      montarOyentes()
    },

    // Después de un arrastre el navegador manda igual un click, y en el sidebar
    // eso cambiaría de pestaña justo al terminar de ordenar. La API HTML5 se lo
    // tragaba sola; con Pointer Events hay que hacerlo a mano.
    onClickCapture: (e: EventoRaton) => {
      if (!tragarClick.current) return
      tragarClick.current = false
      e.preventDefault(); e.stopPropagation()
    },
  })

  // `touchAction: 'none'` solo acá y no en la fila entera: le dice al navegador
  // que un gesto que empieza sobre la manija no es un scroll. En el resto de la
  // fila el scroll sigue siendo del navegador, que es lo que queremos.
  const manijaProps = {
    'data-orden-manija': '',
    style: { touchAction: 'none', cursor: 'grab' } as CSSProperties,
  }

  return { arrastrando, filaProps, manijaProps }
}

export function useDragSort<T extends { id: string }>(initialItems: T[], onReorder: (items: T[]) => void) {
  const [items, setItems] = useState<T[]>(initialItems)

  const key = initialItems.map(i => i.id + (i as Record<string,unknown>).activo + (i as Record<string,unknown>).estado).join(',')
  useEffect(() => { setItems(initialItems) }, [key])

  const { arrastrando, filaProps, manijaProps } = usePointerSort(items, setItems, onReorder)
  return { items, setItems, arrastrando, filaProps, manijaProps }
}
