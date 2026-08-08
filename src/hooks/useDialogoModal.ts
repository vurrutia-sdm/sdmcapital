// Comportamiento de teclado de un diálogo modal: Escape, foco atrapado y foco
// devuelto al cerrar.
//
// Se usa así, en el componente que renderiza el modal:
//
//   const caja = useRef<HTMLDivElement>(null)
//   useDialogoModal(abierto, caja, cerrar)
//   ...
//   <div role="dialog" aria-modal="true" aria-labelledby={tituloId} ref={caja}>
//
// ATRAPAR EL FOCO MAL ES PEOR QUE NO ATRAPARLO. Los dos modos de encerrar a
// alguien en la página, y cómo se evitan acá:
//
// 1. Un modal SIN NINGÚN elemento enfocable. Si el ciclo no encuentra a nadie a
//    quien pasarle el foco y aun así bloquea el Tab, el usuario queda atrapado
//    sin salida. Acá, si no hay enfocables, se enfoca el contenedor —que lleva
//    tabIndex={-1}— y el Tab NO se bloquea: se deja pasar. Es preferible que el
//    foco se escape a que no pueda moverse.
//
// 2. Un trap que NO SE LIBERA al desmontar. Si el componente se va sin quitar
//    el listener, el Tab sigue secuestrado sobre una página donde ya no hay
//    modal. Por eso todo cuelga de un único `useEffect` cuya función de limpieza
//    quita el listener SIEMPRE, se cierre como se cierre —con Escape, con el
//    botón, con un clic fuera o desmontando la ruta entera—.
import { useEffect, useRef, type RefObject } from 'react'

// Lo que el navegador considera enfocable. `:not([disabled])` y el filtro por
// tamaño descartan lo que está deshabilitado o escondido, que no recibe foco.
const ENFOCABLES = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useDialogoModal(
  abierto: boolean,
  caja: RefObject<HTMLElement | null>,
  cerrar: () => void,
) {
  // Quién tenía el foco antes de abrir.
  //
  // NO sirve leer `document.activeElement` cuando ya está abierto: si el modal
  // tiene un campo con `autoFocus`, React se lo da DURANTE el commit, o sea
  // antes de que corra este efecto. Lo que se leería entonces es un elemento de
  // adentro del modal, que al cerrarse desaparece del documento y deja el foco
  // en el <body>.
  //
  // Por eso se anota mientras el modal está CERRADO, siguiendo el foco de la
  // página. Al abrir, ese valor ya es el correcto.
  //
  // Y se ignora el foco que cae DENTRO de un diálogo. React inserta el modal y
  // aplica su `autoFocus` durante el commit, o sea ANTES de limpiar este oyente:
  // sin la guarda, el propio campo del modal se anotaba como disparador y al
  // cerrar el foco terminaba en el <body>.
  //
  // La guarda mira el DOM (`closest('[aria-modal]')`) y no el ref del
  // contenedor, porque cuando salta ese `autoFocus` el ref todavía puede estar
  // sin enganchar. El marcado, en cambio, ya está puesto.
  const previo = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (abierto) return
    const anotar = () => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el.closest('[aria-modal="true"]')) return
      previo.current = el
    }
    anotar()
    document.addEventListener('focusin', anotar)
    return () => document.removeEventListener('focusin', anotar)
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const nodo = caja.current
    if (!nodo) return

    // Si el modal se monta ya abierto, el efecto de arriba nunca corrió y no hay
    // nada anotado: ahí sí vale `activeElement`, porque todavía no se movió.
    const disparador = previo.current ?? (document.activeElement as HTMLElement | null)

    const enfocables = () =>
      [...nodo.querySelectorAll<HTMLElement>(ENFOCABLES)]
        .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)

    // Entrar: al primer enfocable, o al contenedor si no hay ninguno.
    const primeros = enfocables()
    ;(primeros[0] ?? nodo).focus?.()

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); cerrar(); return }
      if (e.key !== 'Tab') return

      const lista = enfocables()
      // Sin enfocables no se bloquea el Tab: ver el caso 1 de arriba.
      if (lista.length === 0) return

      const primero = lista[0]
      const ultimo = lista[lista.length - 1]
      const foco = document.activeElement

      // El ciclo se cierra a mano solo en los extremos. En el medio manda el
      // navegador, que respeta el orden real del documento.
      if (!e.shiftKey && foco === ultimo) { e.preventDefault(); primero.focus() }
      else if (e.shiftKey && foco === primero) { e.preventDefault(); ultimo.focus() }
      else if (!nodo.contains(foco)) { e.preventDefault(); primero.focus() }
    }

    document.addEventListener('keydown', alTeclear, true)
    return () => {
      document.removeEventListener('keydown', alTeclear, true)
      // Devolver el foco solo si sigue existiendo y sigue en el documento.
      if (disparador && document.contains(disparador)) disparador.focus?.()
    }
  }, [abierto, caja, cerrar])
}
