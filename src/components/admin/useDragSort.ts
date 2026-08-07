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

  // El commit final sale de este ref y no de la clausura: durante el arrastre la
  // lista se reordena en vivo, así que al soltar hace falta el orden que quedó,
  // no el que había cuando se creó el handler.
  const ultimo = useRef(items)
  ultimo.current = items

  // Con setPointerCapture todos los eventos siguen apuntando a la fila donde
  // empezó el arrastre, así que la fila de destino hay que buscarla por
  // coordenadas. La zona evita que dos listas de la misma pantalla se pisen.
  const indiceEn = (x: number, y: number) => {
    const fila = document.elementFromPoint(x, y)?.closest(`[data-orden-zona="${CSS.escape(zona)}"]`)
    const n = fila?.getAttribute('data-orden-idx')
    return n == null ? null : Number(n)
  }

  const limpiar = () => {
    desde.current = null; origen.current = null
    activo.current = false; movio.current = false
    setArrastrando(null)
  }

  const filaProps = (i: number) => ({
    'data-orden-zona': zona,
    'data-orden-idx': i,

    onPointerDown: (e: EventoPuntero<HTMLElement>) => {
      // Con ratón se arrastra desde cualquier parte de la fila, igual que con la
      // API HTML5 que había antes: es la interacción que hoy se usa y no se
      // degrada. Con el dedo, solo desde la manija — si se pudiera arrastrar
      // desde cualquier parte no quedaría forma de scrollear la lista.
      if (e.pointerType === 'mouse') { if (e.button !== 0) return }
      else if (!(e.target as Element).closest('[data-orden-manija]')) return

      desde.current = i
      origen.current = { x: e.clientX, y: e.clientY }
      activo.current = false
      movio.current = false
      e.currentTarget.setPointerCapture(e.pointerId)
    },

    onPointerMove: (e: EventoPuntero<HTMLElement>) => {
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
    },

    onPointerUp: () => {
      const hubo = activo.current && movio.current
      // Se traga el click si hubo arrastre de verdad, aunque no haya cambiado
      // nada de orden: soltar sobre la posición de origen tampoco debería
      // contar como click.
      tragarClick.current = activo.current
      limpiar()
      if (hubo) alSoltar(ultimo.current)
    },

    onPointerCancel: () => { tragarClick.current = false; limpiar() },

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
