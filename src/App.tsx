import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LangProvider } from '@/hooks/useLang'
import Layout from '@/components/layout/Layout'
import ScrollToTop from '@/components/layout/ScrollToTop'
import HomePage from '@/pages/HomePage'
import QuienesSomosPage from '@/pages/QuienesSomosPage'
import ServiciosPage from '@/pages/ServiciosPage'
import PropiedadesPage from '@/pages/PropiedadesPage'
import PropiedadDetailPage from '@/pages/PropiedadDetailPage'
import AsociadosPage from '@/pages/AsociadosPage'
import BlogPage from '@/pages/BlogPage'
import BlogPostPage from '@/pages/BlogPostPage'
import AdminPage from '@/pages/AdminPage'
import FichaClientesLista from '@/pages/admin/FichaClientesLista'
import FichaClienteDetalle from '@/pages/admin/FichaClienteDetalle'
import FichaClienteNueva from '@/pages/admin/FichaClienteNueva'
import FichaClienteVer from '@/pages/admin/FichaClienteVer'
import FichaClienteEditar from '@/pages/admin/FichaClienteEditar'
import Agentes from '@/pages/admin/Agentes'
import Captacion from '@/pages/admin/Captacion'
import ElBarrancoShowcase from '@/pages/ElBarrancoShowcase'
import ReservaConfirmacionPage from '@/pages/ReservaConfirmacionPage'
import RentalPage from '@/pages/RentalPage'
import VendeConNosotrosPage from '@/pages/VendeConNosotrosPage'
import PoliticaPrivacidadPage from '@/pages/PoliticaPrivacidadPage'
import CondicionesServicioPage from '@/pages/CondicionesServicioPage'
import EliminacionDatosPage from '@/pages/EliminacionDatosPage'
import EvaluacionGratuitaPage from '@/pages/EvaluacionGratuitaPage'

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 text-center">
      <div className="font-serif" style={{ fontSize: 96, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>404</div>
      <h1 className="font-serif font-light" style={{ fontSize: 36, color: 'var(--navy-dark)' }}>
        Página no <em>encontrada</em>
      </h1>
      <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.8 }}>
        La página que buscas no existe o fue movida.
      </p>
      <a href="/" className="btn-primary">← Volver al inicio</a>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Admin — sin layout público */}
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/ficha-cliente" element={<FichaClientesLista />} />
          <Route path="/admin/ficha-cliente/:clienteId" element={<FichaClienteDetalle />} />
          <Route path="/admin/ficha-cliente/:clienteId/nueva" element={<FichaClienteNueva />} />
          <Route path="/admin/ficha-cliente/:clienteId/ficha/:fichaId" element={<FichaClienteVer />} />
          <Route path="/admin/ficha-cliente/:clienteId/ficha/:fichaId/editar" element={<FichaClienteEditar />} />
          <Route path="/admin/agentes" element={<Agentes />} />
          <Route path="/admin/captacion" element={<Captacion />} />

          {/* Showcase El Barranco — experiencia inmersiva, sin header/footer */}
          <Route path="/propiedades/:id/showcase" element={<ElBarrancoShowcase />} />

          {/* Confirmación de reserva (retorno de Transbank) — sin header/footer */}
          <Route path="/reserva/confirmacion" element={<ReservaConfirmacionPage />} />

          {/* Landing campaña Meta Ads — sin header/footer del sitio */}
          <Route path="/evaluacion-gratuita" element={<EvaluacionGratuitaPage />} />

          {/* Sitio público — con Header + Footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/quienes-somos" element={<QuienesSomosPage />} />
            <Route path="/servicios" element={<ServiciosPage />} />
            <Route path="/servicios/:slug" element={<ServiciosPage />} />
            <Route path="/propiedades" element={<PropiedadesPage />} />
            <Route path="/propiedades-usadas" element={<PropiedadesPage />} />
            <Route path="/proyectos-nuevos" element={<PropiedadesPage />} />
            <Route path="/propiedades/:slug" element={<PropiedadDetailPage />} />
            <Route path="/asociados" element={<AsociadosPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/rental" element={<RentalPage />} />
            <Route path="/vende-con-nosotros" element={<VendeConNosotrosPage />} />
            <Route path="/politica-de-privacidad" element={<PoliticaPrivacidadPage />} />
            <Route path="/condiciones-del-servicio" element={<CondicionesServicioPage />} />
            <Route path="/eliminacion-de-datos" element={<EliminacionDatosPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
