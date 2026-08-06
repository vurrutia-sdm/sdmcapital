// Pestaña "Vende" del admin — textos de "Vende con Nosotros" en
// `contenido_sitio`. Guarda campo por campo, sin botón de guardar.
//
// Extraída de AdminPage.tsx sin cambios de comportamiento: mismos estilos,
// mismas queries. Los emojis pasaron a iconos de lucide-react más tarde. La clave de pestaña sigue siendo 'vende' — el orden de las pestañas
// se persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Check, FileText, Image, Landmark, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { invalidateContenidoCache } from '@/hooks/useContenido'
import { Sec, Full } from '@/components/admin/layout'
import { Field, Inp, Txa } from '@/components/admin/campos'
import { ImageUploader } from '@/components/admin/ImageUploader'

export default function Vende() {
  const [saved, setSaved] = useState(false)

  const [d, setD] = useState({
    vende_hero_titulo: 'Ponemos tu propiedad en venta',
    vende_hero_subtitulo: 'Somos expertos en soluciones inmobiliarias con más de 20 años de experiencia. Tenemos todas las herramientas para garantizar una venta ágil, segura y al mejor precio.',
    vende_pilares_titulo: 'Vende con el respaldo de un equipo especializado',
    vende_pilar1_num: '01', vende_pilar1_titulo: 'Experiencia', vende_pilar1_desc: 'Profesionales con más de 20 años en banca e inversión inmobiliaria, orientados 100% al cliente.',
    vende_pilar2_num: '02', vende_pilar2_titulo: 'Marketing', vende_pilar2_desc: 'Publicamos tu propiedad en Yapo, TocToc, Portal, Mercado Libre, Google Ads y Meta para maximizar la exposición.',
    vende_pilar3_num: '03', vende_pilar3_titulo: 'Respaldo Legal', vende_pilar3_desc: 'Acompañamos todo el proceso: desde el estudio de títulos hasta la inscripción en el Conservador de Bienes Raíces.',
    vende_proceso_titulo: 'Cómo trabajamos',
    vende_paso_1: 'Análisis previo de tu propiedad y diagnóstico personalizado',
    vende_paso_2: 'Publicación estratégica en portales y redes sociales',
    vende_paso_3: 'Base de datos de compradores con crédito hipotecario aprobado',
    vende_paso_4: 'Acompañamiento en tasación y estudio de títulos',
    vende_paso_5: 'Redacción del borrador de escritura',
    vende_paso_6: 'Inscripción final en el Conservador de Bienes Raíces',
    vende_form_titulo: 'Comencemos el proceso',
    vende_form_subtitulo: 'Cuéntanos sobre tu propiedad',
    vende_hero_img: '',
  })

  useEffect(() => {
    supabase.from('contenido_sitio').select('clave, valor').then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const set = (k: string) => (v: string) => {
    setD(prev => ({ ...prev, [k]: v }))
    supabase.from('contenido_sitio').upsert({ clave: k, valor: v }, { onConflict: 'clave' }).then(({ error }) => {
      if (avisarError('No se pudo guardar el campo', error)) return
      invalidateContenidoCache()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>Vende con Nosotros</h2>
        {saved && <span className="text-sdm-base" style={{ color: 'var(--green)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} strokeWidth={2} />Guardado correctamente</span>}
      </div>

      <Sec title={<><Image size={18} strokeWidth={1.75} />Hero</>}>
        <Full><Field label="Imagen de fondo Hero"><ImageUploader currentUrl={d.vende_hero_img} folder="vende" onUploaded={url => set('vende_hero_img')(url)} /></Field></Full>
        <Full><Field label="Título"><Inp value={d.vende_hero_titulo} onChange={set('vende_hero_titulo')} /></Field></Full>
        <Full><Field label="Subtítulo"><Txa value={d.vende_hero_subtitulo} onChange={set('vende_hero_subtitulo')} rows={3} /></Field></Full>
      </Sec>

      <Sec title={<><Landmark size={18} strokeWidth={1.75} />Pilares</>}>
        <Full><Field label="Título de la sección"><Inp value={d.vende_pilares_titulo} onChange={set('vende_pilares_titulo')} /></Field></Full>

        {[1, 2, 3].map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Pilar {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Número"><Inp value={(d as Record<string,string>)[`vende_pilar${n}_num`]} onChange={set(`vende_pilar${n}_num`)} /></Field>
                <Field label="Título"><Inp value={(d as Record<string,string>)[`vende_pilar${n}_titulo`]} onChange={set(`vende_pilar${n}_titulo`)} /></Field>
                <Full><Field label="Descripción"><Txa value={(d as Record<string,string>)[`vende_pilar${n}_desc`]} onChange={set(`vende_pilar${n}_desc`)} rows={3} /></Field></Full>
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      <Sec title={<><RefreshCw size={18} strokeWidth={1.75} />Proceso</>}>
        <Full><Field label="Título de la sección"><Inp value={d.vende_proceso_titulo} onChange={set('vende_proceso_titulo')} /></Field></Full>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <Full key={n}><Field label={`Paso ${n}`}><Inp value={(d as Record<string,string>)[`vende_paso_${n}`]} onChange={set(`vende_paso_${n}`)} /></Field></Full>
        ))}
      </Sec>

      <Sec title={<><FileText size={18} strokeWidth={1.75} />Formulario</>}>
        <Field label="Título"><Inp value={d.vende_form_titulo} onChange={set('vende_form_titulo')} /></Field>
        <Field label="Subtítulo (etiqueta superior)"><Inp value={d.vende_form_subtitulo} onChange={set('vende_form_subtitulo')} /></Field>
      </Sec>
    </div>
  )
}
