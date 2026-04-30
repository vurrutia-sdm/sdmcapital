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

          {/* Sitio público — con Header + Footer */}
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/quienes-somos" element={<QuienesSomosPage />} />
            <Route path="/servicios" element={<ServiciosPage />} />
            <Route path="/servicios/:slug" element={<ServiciosPage />} />
            <Route path="/propiedades" element={<PropiedadesPage />} />
            <Route path="/propiedades/:id" element={<PropiedadDetailPage />} />
            <Route path="/asociados" element={<AsociadosPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LangProvider>
  )
}
