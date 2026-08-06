// Pestaña "Legal" del admin — textos de paginas_legales.
//
// Extraída de AdminPage.tsx sin cambios: mismo markup, mismos estilos, mismas
// queries. La clave de pestaña sigue siendo 'legal' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SaveBtn } from '@/components/admin/acciones'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

const LEGAL_PAGES: { slug: string; label: string; ruta: string }[] = [
  { slug: 'politica-de-privacidad',   label: 'Política de Privacidad',   ruta: '/politica-de-privacidad' },
  { slug: 'condiciones-del-servicio', label: 'Condiciones del Servicio', ruta: '/condiciones-del-servicio' },
  { slug: 'eliminacion-de-datos',     label: 'Eliminación de Datos',     ruta: '/eliminacion-de-datos' },
]

export default function PaginasLegales() {
  const [activeSlug, setActiveSlug] = useState(LEGAL_PAGES[0].slug)
  const active = LEGAL_PAGES.find(p => p.slug === activeSlug) || LEGAL_PAGES[0]

  const [contenido, setContenido] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setSaved(false); setError('')
    supabase.from('paginas_legales').select('contenido').eq('slug', activeSlug).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError('No se pudo cargar el contenido: ' + error.message)
        else setContenido(data?.contenido || '')
        setLoading(false)
      })
  }, [activeSlug])

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    const { error } = await supabase.from('paginas_legales').upsert(
      { slug: activeSlug, contenido, updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    )
    setSaving(false)
    if (error) { setError('Error al guardar: ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Páginas Legales</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={2} />Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {LEGAL_PAGES.map(p => (
          <button key={p.slug} onClick={() => setActiveSlug(p.slug)}
            className="rounded-sm"
            style={{
              padding: '9px 18px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              border: `1px solid ${activeSlug === p.slug ? 'var(--navy-dark)' : '#e8edf2'}`,
              background: activeSlug === p.slug ? 'var(--navy-dark)' : '#fff',
              color: activeSlug === p.slug ? '#fff' : 'var(--muted)',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: 13, color: '#E24B4A', marginBottom: 16 }}>{error}</p>}

      <div className="bg-white border border-[#e8edf2] rounded-sm p-8">
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
          Este texto se muestra públicamente en <code>{active.ruta}</code>. Usa los títulos (H2) para separar las secciones, igual que en el resto del sitio.
        </p>
        {loading
          ? <p style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando…</p>
          : <RichTextEditor key={activeSlug} value={contenido} onChange={setContenido} />}
      </div>
    </div>
  )
}
