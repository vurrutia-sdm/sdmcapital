// Escape cierra un desplegable, y el foco vuelve a su disparador.
//
// Se usa así:
//
//   const disparador = useRef<HTMLButtonElement>(null)
//   useCerrarConEscape(open, () => setOpen(false), disparador)
//   ...
//   <button ref={disparador} aria-expanded={open} onClick={() => setOpen(v => !v)}>
//
// PARA QUÉ. Un panel que solo cierra con un clic fuera no tiene salida por
// teclado: quien abre «Región o comuna» se encuentra 17 regiones por delante y
// ninguna forma de desistir sin elegir una. Tabular fuera tampoco lo cierra, así
// que el panel queda abierto tapando lo que hay debajo.
//
// ─── POR QUÉ ESCUCHA EN `window` Y EN BURBUJA ──────────────────────────────
//
// Parece el detalle más arbitrario del hook y es el que evita el peor fallo:
// que Escape cierre DOS cosas a la vez.
//
// `useDialogoModal` escucha en `document` en fase de CAPTURA y llama a
// `stopPropagation()`. La captura baja antes de que nada burbujee, así que con
// un modal abierto su manejador corre primero y corta el evento: éste no llega
// a `window` y el desplegable de abajo no se entera. El modal se cierra solo.
//
// Si este hook escuchara también en captura, o antes en el árbol, los dos
// cerrarían con una sola pulsación y el usuario perdería un contexto que no
// pidió cerrar. La jerarquía correcta es esa: **lo más superficial cierra
// primero**, y sólo eso.
//
// Es además el patrón que ya usaban `Header.tsx` y el visor de fotos de
// `PropiedadDetailPage`, así que no introduce una tercera forma de hacer lo
// mismo — al contrario, este hook nace de unificar la de `Header`.
//
// ─── POR QUÉ DEVUELVE EL FOCO ──────────────────────────────────────────────
//
// El panel se DESMONTA al cerrarse. Si el foco estaba dentro —y con teclado
// siempre lo está—, al desaparecer el nodo el foco cae al `<body>` y el
// siguiente Tab reinicia el recorrido desde el principio del documento. Devolver
// el foco al disparador es lo que WCAG 2.4.3 pide y lo que hace que Escape se
// sienta como «volver» en vez de como «perderse».
//
// `disparador` es opcional: si no se pasa, el hook solo cierra. Sirve para los
// casos en que quien cierra no tiene un disparador único —el `Header` cierra
// tres desplegables con la misma pulsación—.
import { useEffect, type RefObject } from 'react'

export function useCerrarConEscape(
  abierto: boolean,
  cerrar: () => void,
  disparador?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      cerrar()
      // `document.contains` porque el disparador puede haberse desmontado —una
      // ruta que cambia, un panel que se va entero— entre el render y esta
      // pulsación. Enfocar un nodo huérfano no lanza error pero tampoco mueve el
      // foco, y deja el `activeElement` en el <body> sin que se note.
      const destino = disparador?.current
      if (destino && document.contains(destino)) destino.focus()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto, cerrar, disparador])
}
