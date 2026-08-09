// Reordenamiento POR TECLADO para las listas del admin.
//
// `usePointerSort` resuelve ratón y dedo, pero está construido sobre Pointer
// Events: con teclado no hay forma de reordenar nada. Eso incumple 2.1.1, que
// pide que todo lo que se pueda hacer con puntero se pueda hacer con teclado.
//
// SE AGREGA AL LADO, NO SE TOCA EL ARRASTRE. Este archivo no importa nada de
// `useDragSort.ts` ni lo modifica: son dos caminos independientes hacia el mismo
// guardado. Si mañana se cambia el arrastre, esto sigue funcionando, y al revés.
//
// VA EN LOS DIEZ PUNTOS O EN NINGUNO. Media función —que ande en tres paneles y
// en siete no— es peor que ninguna: el usuario no tiene cómo saber dónde
// funciona, y el que se apoya en el teclado se queda sin saber si el problema es
// suyo o de la pantalla.

import { useEffect, useRef } from 'react'
import type { Dispatch, SetStateAction, CSSProperties } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

// EL FOCO SIGUE AL ELEMENTO MOVIDO, no se queda en la posición que dejó.
//
// Sin esto, mover tres veces seguidas exige buscar el foco cada vez: al
// reordenar, React vuelve a pintar y el botón que se acaba de pulsar queda en
// otra fila. Se anota qué botón hay que enfocar y el componente que lo posee
// —identificado por su clave, no por su posición— se enfoca a sí mismo cuando
// vuelve a renderizarse.
//
// Módulo y no estado de React a propósito: entre el clic y el re-render no hay
// ningún componente vivo que pueda llevar el dato, porque el que lo tenía se
// está desmontando de su posición vieja.
let focoPendiente: string | null = null

const BOTON: CSSProperties = {
  // 24×24 exactos: es el mínimo de 2.5.8. Al medirlos los dos y quedar
  // adyacentes, el criterio se cumple por tamaño y no hace falta separarlos.
  width: 24, height: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0, borderRadius: 3,
  border: '1px solid var(--border)', background: '#fff',
  fontFamily: 'inherit', flexShrink: 0,
}

export function ControlesOrden({
  zona, clave, nombre, puedeSubir, puedeBajar, onMover, apilado = false,
}: {
  /** Distingue listas distintas que coexisten en la misma pantalla. */
  zona: string
  /** Identidad estable del elemento. Con ella el foco lo encuentra tras moverse. */
  clave: string
  /** Para el nombre accesible. «Subir» a secas no dice subir QUÉ. */
  nombre: string
  puedeSubir: boolean
  puedeBajar: boolean
  onMover: (dir: -1 | 1) => void
  /** Vertical cuando la fila es alta; horizontal es lo predeterminado. */
  apilado?: boolean
}) {
  const base = `${zona}:${clave}`
  const subir = useRef<HTMLButtonElement>(null)
  const bajar = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focoPendiente !== `${base}:subir` && focoPendiente !== `${base}:bajar`) return
    const queria = focoPendiente.endsWith(':subir') ? subir : bajar
    const otro = queria === subir ? bajar : subir
    focoPendiente = null
    // Si el elemento llegó a un extremo, su botón queda inerte: el foco pasa al
    // otro en vez de quedarse en algo que ya no hace nada.
    const destino = queria.current?.getAttribute('aria-disabled') === 'true' ? otro : queria
    destino.current?.focus()
  })

  const pulsar = (dir: -1 | 1) => {
    if (dir === -1 ? !puedeSubir : !puedeBajar) return
    focoPendiente = `${base}:${dir === -1 ? 'subir' : 'bajar'}`
    onMover(dir)
  }

  // `aria-disabled` y NO `disabled`: un botón deshabilitado de verdad sale del
  // orden de tabulación, así que quien navega con teclado nunca lo encuentra y
  // no se entera de que existe ni de por qué no puede usarlo. Con `aria-disabled`
  // recibe foco, se anuncia como no disponible, y el clic no hace nada.
  const estilo = (activo: boolean): CSSProperties => ({
    ...BOTON,
    cursor: activo ? 'pointer' : 'default',
    color: activo ? 'var(--navy-dark)' : 'var(--border)',
  })

  return (
    <div
      // El arrastre no debe arrancar al pulsar estos botones.
      data-orden-quieto=""
      style={{ display: 'flex', flexDirection: apilado ? 'column' : 'row', gap: 2, flexShrink: 0 }}
    >
      <button ref={subir} type="button" style={estilo(puedeSubir)}
        aria-disabled={!puedeSubir} aria-label={`Subir «${nombre}»`}
        onClick={e => { e.stopPropagation(); pulsar(-1) }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}>
        <ChevronUp size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <button ref={bajar} type="button" style={estilo(puedeBajar)}
        aria-disabled={!puedeBajar} aria-label={`Bajar «${nombre}»`}
        onClick={e => { e.stopPropagation(); pulsar(1) }}
        onMouseDown={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}>
        <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  )
}

// El movimiento estándar de las diez listas: el MISMO `splice` que hace el
// arrastre, el mismo setter y el mismo guardado. Así el teclado no es un camino
// paralelo que pueda divergir — guarda por donde ya guardaba el arrastre.
export function moverEnLista<T>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  alSoltar: (items: T[]) => void,
) {
  return (i: number, dir: -1 | 1) => {
    const destino = i + dir
    if (destino < 0 || destino >= items.length) return
    const next = [...items]
    next.splice(destino, 0, next.splice(i, 1)[0])
    setItems(next)
    alSoltar(next)
  }
}
