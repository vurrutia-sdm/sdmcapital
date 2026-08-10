import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import FloatingButtons from './FloatingButtons'

export default function Layout() {
  // `ruta-publica` EN EL <html>, para que `scroll-padding-top` tenga dónde
  // aplicarse. Ver la regla en globals.css.
  //
  // VA EN EL <html> Y NO EN EL <div> DE ABAJO porque `scroll-padding` es una
  // propiedad del CONTENEDOR DE SCROLL, y acá el que hace scroll es el viewport,
  // o sea el elemento raíz. Puesta en el div no haría absolutamente nada — el
  // div no desplaza nada.
  //
  // Y ES UNA CLASE PROPIA, NO `sitio-publico`. Reutilizar ese nombre habría sido
  // lo obvio, pero `mobile.css` tiene DOCE reglas acotadas con `.sitio-publico X`
  // —varias por subcadena de atributo, la trampa 5.6— y todas cuentan con que
  // ese ancestro sea el `<div>` de aquí abajo. Con la clase también en el
  // `<html>`, `.sitio-publico [class*="px-8"]` pasaría a alcanzar el documento
  // entero en vez del subárbol público. Hoy no cambiaría nada visible porque no
  // hay portales —comprobado— pero son doce reglas con `!important` sobre un
  // archivo que el propio proyecto documenta como frágil. Un nombre nuevo cuesta
  // cero y no toca ninguna.
  //
  // SE QUITA AL DESMONTAR. El admin y `/evaluacion-gratuita` no cuelgan de este
  // Layout, y sin la limpieza heredarían el desplazamiento de un header que no
  // tienen: el admin usa `--admin-header-h` (80px) y su propio `sticky`.
  useEffect(() => {
    document.documentElement.classList.add('ruta-publica')
    return () => document.documentElement.classList.remove('ruta-publica')
  }, [])

  return (
    <div className="sitio-publico min-h-screen flex flex-col">
      {/* SALTAR AL CONTENIDO — WCAG 2.4.1 (evitar bloques).
          El header expone 7 paradas de tabulación en escritorio y 14 en el menú
          móvil ANTES de la primera línea de contenido, y hay que recorrerlas en
          cada una de las 17 rutas. Con landmarks correctos un lector de pantalla
          puede saltar por regiones; el afectado real es quien navega con teclado
          y sin lector, que no tiene esa vía.

          `.sr-only` lo saca de la vista sin sacarlo del árbol de accesibilidad
          —recorte de 1px, no `display: none`— y `focus:not-sr-only` lo devuelve
          al flujo en cuanto recibe el foco. Va PRIMERO en el DOM porque su valor
          es ser la primera parada.

          Aterriza bien gracias al `scroll-padding-top` de `html.ruta-publica`:
          el salto a `#contenido` alinea el <main> con el borde del viewport, y
          sin esa regla los primeros 91px habrían quedado bajo el header. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:left-4 focus:top-4 focus:px-4 focus:py-3 focus:bg-white focus:text-[var(--navy-dark)] text-sdm-sm tracking-sdm-wide"
        style={{ textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--border-input)', borderRadius: 'var(--sdm-radio-control)' }}
      >
        Saltar al contenido
      </a>
      <Header />
      {/* `paddingTop` con el token y no `pt-16`. El header es `fixed`, así que
          este relleno es lo ÚNICO que impide que el contenido se meta debajo, y
          su alto cambia a los 768px cuando aparece la barra de indicadores.
          `pt-16` eran 64px fijos contra un header de 65 u 91. */}
      <main id="contenido" tabIndex={-1} className="flex-1" style={{ paddingTop: 'var(--sdm-header-total)' }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}
