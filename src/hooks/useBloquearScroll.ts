// Bloquea el scroll de la página mientras hay algo superpuesto encima.
//
// Extraído del cajón móvil de `AdminPage`, que es donde se resolvió primero y
// donde está medido. La nota larga de allá se resume acá:
//
// `overflow: hidden` sobre body NO alcanza en iOS: Safari sigue desplazando el
// documento igual. Lo único que lo detiene es sacar el body del flujo con
// `position: fixed` — y eso tiene un precio, porque el body deja de estar
// desplazado. Hay que compensarlo con `top: -scrollY` para que la página se vea
// donde estaba, y devolver el scroll a mano al cerrar. Sin esas dos cosas, cada
// vez que se cierra el modal la página aparece arriba del todo.
//
// Se guarda lo que HABÍA en `body.style`, no valores fijos: si mañana alguien
// escribe ahí desde otro lado, o si el efecto se interrumpe a medias, el sitio
// tiene que volver exactamente a como estaba y no a un `overflow: visible`
// inventado por nosotros.
//
// EFECTO CONOCIDO SOBRE `position: sticky`. Con el documento sin desplazar, un
// elemento sticky vuelve a su posición natural — a scroll 1200 queda 1200px por
// encima del viewport. No es un defecto de esta técnica sino de todas: `sticky`
// ES función del scroll. Medido en `AdminPage` con las tres variantes
// (`position: fixed`, `overflow: hidden` en body, y en html + body): las tres
// dan lo mismo. Un `position: fixed` no se ve afectado, así que el header del
// sitio público —que es fixed— se queda quieto.
import { useEffect } from 'react'

export function useBloquearScroll(activo: boolean) {
  useEffect(() => {
    if (!activo) return

    const estilo = document.body.style
    const previo = {
      overflow: estilo.overflow, position: estilo.position,
      top: estilo.top, left: estilo.left, right: estilo.right, width: estilo.width,
    }
    const scrollPrevio = window.scrollY

    estilo.overflow = 'hidden'
    estilo.position = 'fixed'
    estilo.top = `-${scrollPrevio}px`
    estilo.left = '0'
    estilo.right = '0'
    estilo.width = '100%'

    return () => {
      Object.assign(estilo, previo)
      // `instant` a propósito: globals.css pone `scroll-behavior: smooth` en
      // html, y sin esto la vuelta a la posición se ve como un salto animado.
      window.scrollTo({ top: scrollPrevio, behavior: 'instant' })
    }
  }, [activo])
}
