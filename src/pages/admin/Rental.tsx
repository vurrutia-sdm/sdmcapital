// Pestaña "Rental" del admin — textos de SDM Rental en `contenido_sitio`.
//
// Extraída de AdminPage.tsx sin cambios: mismo markup, mismos estilos, mismas
// queries. La clave de pestaña sigue siendo 'rental' — el orden de las pestañas
// se persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Home, Image, KeyRound, Scale, Users, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { invalidateContenidoCache } from '@/hooks/useContenido'
import { Sec, Full } from '@/components/admin/layout'
import { Field, Inp, Txa } from '@/components/admin/campos'
import { SaveBtn } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'

export default function Rental() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [d, setD] = useState({
    rental_hero_img: '',
    rental_hero_titulo: 'Tu propiedad, sin preocupaciones',
    rental_hero_subtitulo: 'SDM Rental se encarga de todo: buscamos arrendatarios, cobramos las rentas y administramos tu propiedad mes a mes. Tú solo recibes los resultados.',
    rental_quienes_titulo: '20 años de experiencia a tu servicio',
    rental_quienes_somos: 'Contamos con más de 20 años de experiencia en el sector comercial bancario e inmobiliario. Somos especialistas en soluciones adaptadas a cada cliente, con respaldo legal en todas nuestras operaciones y una red de marketing digital que posiciona tu propiedad donde los arrendatarios te buscan.',
    rental_prop_titulo: 'Arrienda sin complicaciones',
    rental_prop_subtitulo: 'Nos encargamos de cada etapa del proceso de arriendo para que tú no tengas que preocuparte de nada.',
    rental_check_1: 'Buscamos y seleccionamos arrendatarios con evaluación completa.',
    rental_check_2: 'Redactamos y formalizamos el contrato de arriendo.',
    rental_check_3: 'Cobramos las rentas y te transferimos mensualmente.',
    rental_check_4: 'Gestionamos mantenciones e incidencias por ti.',
    rental_check_5: 'Informes mensuales de tu propiedad.',
    rental_comision_trad_pct: '50%',
    rental_comision_trad_desc: 'de un mes de arriendo · pago único',
    rental_comision_adm_pct: '50% + 7%',
    rental_comision_adm_desc: 'pago único + 7% mensual sobre el arriendo',
    rental_arr_titulo: 'Encuentra tu próximo hogar',
    rental_arr_subtitulo: 'Tenemos propiedades disponibles en arriendo en Santiago y sus alrededores. Proceso simple, transparente y sin costos ocultos.',
    rental_comp_titulo: 'Compara tus opciones',
    rental_comp1_tipo: 'Arriendo Tradicional',
    rental_comp1_def: 'Tú mantienes el control directo de tu propiedad y la relación con el arrendatario.',
    rental_comp1_dur: 'Período fijo (ej. 1 año), renovable.',
    rental_comp1_ges: 'El propietario gestiona directamente.',
    rental_comp1_com: '50% de un mes de arriendo (única vez).',
    rental_comp2_tipo: 'Administración de Arriendo',
    rental_comp2_def: 'SDM Rental gestiona todo en tu nombre: inquilinos, cobros, mantención e incidencias.',
    rental_comp2_dur: 'Indefinida, hasta que cualquiera de las partes decida finalizar.',
    rental_comp2_ges: 'SDM Rental opera el inmueble por completo.',
    rental_comp2_com: '50% de un mes de arriendo (única vez) + 7% mensual sobre el arriendo.',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    supabase.from('contenido_sitio').select('clave, valor').then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('contenido_sitio').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    setSaving(false)
    if (avisarError('No se pudo guardar el contenido del sitio', error)) return
    invalidateContenidoCache()
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  // Sec y Full: definidos a nivel de módulo, junto a ContenidoAdmin.

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>SDM Rental</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      <Sec title={<><Image size={18} strokeWidth={1.75} />Hero</>}>
        <Full><Field label="Imagen de fondo"><ImageUploader currentUrl={d.rental_hero_img} folder="rental" onUploaded={url => setD(p => ({ ...p, rental_hero_img: url }))} /></Field></Full>
        <Full><Field label="Título"><Inp value={d.rental_hero_titulo} onChange={set('rental_hero_titulo')} /></Field></Full>
        <Full><Field label="Subtítulo"><Txa value={d.rental_hero_subtitulo} onChange={set('rental_hero_subtitulo')} rows={3} /></Field></Full>
      </Sec>

      <Sec title={<><Users size={18} strokeWidth={1.75} />Quiénes Somos Rental</>}>
        <Field label="Título"><Inp value={d.rental_quienes_titulo} onChange={set('rental_quienes_titulo')} /></Field>
        <Full><Field label="Texto"><Txa value={d.rental_quienes_somos} onChange={set('rental_quienes_somos')} rows={5} /></Field></Full>
      </Sec>

      <Sec title={<><Home size={18} strokeWidth={1.75} />Para Propietarios</>}>
        <Field label="Título"><Inp value={d.rental_prop_titulo} onChange={set('rental_prop_titulo')} /></Field>
        <Full><Field label="Subtítulo"><Txa value={d.rental_prop_subtitulo} onChange={set('rental_prop_subtitulo')} rows={2} /></Field></Full>
        <Full><Field label="Ítem 1"><Inp value={d.rental_check_1} onChange={set('rental_check_1')} /></Field></Full>
        <Full><Field label="Ítem 2"><Inp value={d.rental_check_2} onChange={set('rental_check_2')} /></Field></Full>
        <Full><Field label="Ítem 3"><Inp value={d.rental_check_3} onChange={set('rental_check_3')} /></Field></Full>
        <Full><Field label="Ítem 4"><Inp value={d.rental_check_4} onChange={set('rental_check_4')} /></Field></Full>
        <Full><Field label="Ítem 5"><Inp value={d.rental_check_5} onChange={set('rental_check_5')} /></Field></Full>
      </Sec>

      <Sec title={<><Wallet size={18} strokeWidth={1.75} />Comisiones</>}>
        <Field label="Arriendo Tradicional — %"><Inp value={d.rental_comision_trad_pct} onChange={set('rental_comision_trad_pct')} /></Field>
        <Field label="Arriendo Tradicional — descripción"><Inp value={d.rental_comision_trad_desc} onChange={set('rental_comision_trad_desc')} /></Field>
        <Field label="Administración Completa — %"><Inp value={d.rental_comision_adm_pct} onChange={set('rental_comision_adm_pct')} /></Field>
        <Field label="Administración Completa — descripción"><Inp value={d.rental_comision_adm_desc} onChange={set('rental_comision_adm_desc')} /></Field>
      </Sec>

      <Sec title={<><KeyRound size={18} strokeWidth={1.75} />Para Arrendatarios</>}>
        <Field label="Título"><Inp value={d.rental_arr_titulo} onChange={set('rental_arr_titulo')} /></Field>
        <Full><Field label="Subtítulo"><Txa value={d.rental_arr_subtitulo} onChange={set('rental_arr_subtitulo')} rows={2} /></Field></Full>
      </Sec>

      <Sec title={<><Scale size={18} strokeWidth={1.75} />Comparativo</>}>
        <Full><Field label="Título de la sección"><Inp value={d.rental_comp_titulo} onChange={set('rental_comp_titulo')} /></Field></Full>

        <Full>
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Columna 1</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tipo"><Inp value={d.rental_comp1_tipo} onChange={set('rental_comp1_tipo')} /></Field>
              <Field label="Gestión"><Inp value={d.rental_comp1_ges} onChange={set('rental_comp1_ges')} /></Field>
              <Full><Field label="Definición"><Txa value={d.rental_comp1_def} onChange={set('rental_comp1_def')} rows={2} /></Field></Full>
              <Field label="Duración"><Inp value={d.rental_comp1_dur} onChange={set('rental_comp1_dur')} /></Field>
              <Field label="Comisión"><Inp value={d.rental_comp1_com} onChange={set('rental_comp1_com')} /></Field>
            </div>
          </div>
        </Full>

        <Full>
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Columna 2 (Recomendado)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tipo"><Inp value={d.rental_comp2_tipo} onChange={set('rental_comp2_tipo')} /></Field>
              <Field label="Gestión"><Inp value={d.rental_comp2_ges} onChange={set('rental_comp2_ges')} /></Field>
              <Full><Field label="Definición"><Txa value={d.rental_comp2_def} onChange={set('rental_comp2_def')} rows={2} /></Field></Full>
              <Field label="Duración"><Inp value={d.rental_comp2_dur} onChange={set('rental_comp2_dur')} /></Field>
              <Field label="Comisión"><Inp value={d.rental_comp2_com} onChange={set('rental_comp2_com')} /></Field>
            </div>
          </div>
        </Full>
      </Sec>

      <div className="flex justify-end mt-4">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  )
}
