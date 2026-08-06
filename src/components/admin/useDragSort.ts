// Reordenamiento por arrastre para las listas del admin.
//
// Lo usan PropiedadesAdmin, Equipo y Asociados. Vivía en AdminPage.tsx y los
// paneles ya extraídos lo importaban de vuelta desde ahí, lo que creaba un
// ciclo de imports; por eso se mueve a su propio módulo.
//
// Va en src/components/admin/ y no en src/hooks/ a propósito: src/hooks/ es
// zona compartida entre sesiones y esto es exclusivo del admin.

import { useState, useEffect, useRef } from 'react'

export function useDragSort<T extends { id: string }>(initialItems: T[], onReorder: (items: T[]) => void) {
  const [items, setItems] = useState<T[]>(initialItems)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const key = initialItems.map(i => i.id + (i as Record<string,unknown>).activo + (i as Record<string,unknown>).estado).join(',')
  useEffect(() => { setItems(initialItems) }, [key])

  const onDragStart = (idx: number) => { dragItem.current = idx }
  const onDragEnter = (idx: number) => { dragOver.current = idx }
  const onDragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const next = [...items]
    const dragged = next.splice(dragItem.current, 1)[0]
    next.splice(dragOver.current, 0, dragged)
    dragItem.current = null; dragOver.current = null
    setItems(next); onReorder(next)
  }
  return { items, setItems, onDragStart, onDragEnter, onDragEnd }
}
