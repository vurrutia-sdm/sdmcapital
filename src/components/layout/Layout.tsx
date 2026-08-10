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
      <Header />
      {/* `paddingTop` con el token y no `pt-16`. El header es `fixed`, así que
          este relleno es lo ÚNICO que impide que el contenido se meta debajo, y
          su alto cambia a los 768px cuando aparece la barra de indicadores.
          `pt-16` eran 64px fijos contra un header de 65 u 91. */}
      <main className="flex-1" style={{ paddingTop: 'var(--sdm-header-total)' }}>
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  )
}
