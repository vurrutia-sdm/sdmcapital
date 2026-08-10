import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import FloatingButtons from './FloatingButtons'

export default function Layout() {
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
