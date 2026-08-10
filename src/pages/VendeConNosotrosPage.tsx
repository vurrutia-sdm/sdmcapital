import { useState } from 'react'
import { Check } from 'lucide-react'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'

const sp = { paddingLeft: 'clamp(16px, 5vw, 48px)', paddingRight: 'clamp(16px, 5vw, 48px)' }

const TIPOS_PROPIEDAD = ['Casa', 'Departamento', 'Oficina', 'Local comercial', 'Terreno']

interface FormState {
  nombre: string
  email: string
  telefono: string
  tipo_propiedad: string
  comuna: string
  precio_uf: string
  mensaje: string
}

// Pone en cursiva la última palabra del texto, manteniendo el resto normal
function emLast(text: string) {
  const words = text.trim().split(' ')
  const last = words.pop()
  return <>{words.length > 0 ? words.join(' ') + ' ' : ''}<em>{last}</em></>
}

export default function VendeConNosotrosPage() {
  const { get } = useContenido()

  const [form, setForm] = useState<FormState>({
    nombre: '', email: '', telefono: '', tipo_propiedad: 'Casa', comuna: '', precio_uf: '', mensaje: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.from('captacion_propiedades').insert([{
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono,
      tipo_propiedad: form.tipo_propiedad,
      comuna: form.comuna,
      precio_uf: form.precio_uf ? Number(form.precio_uf) : null,
      mensaje: form.mensaje,
      created_at: new Date().toISOString(),
    }])

    if (!error) {
      await supabase.functions.invoke('notify-captacion', {
        body: {
          record: {
            nombre: form.nombre,
            email: form.email,
            telefono: form.telefono,
            tipo_propiedad: form.tipo_propiedad,
            comuna: form.comuna,
            precio_uf: form.precio_uf,
            mensaje: form.mensaje,
          }
        }
      })
      setStatus('ok')
    } else {
      setStatus('error')
    }
  }

  const heroTitulo = get('vende_hero_titulo', 'Ponemos tu propiedad en venta')
  const heroSubtitulo = get('vende_hero_subtitulo', 'Somos expertos en soluciones inmobiliarias con más de 20 años de experiencia. Tenemos todas las herramientas para garantizar una venta ágil, segura y al mejor precio.')
  const heroImg = get('vende_hero_img', '')

  const pilaresTitulo = get('vende_pilares_titulo', 'Vende con el respaldo de un equipo especializado')
  const PILARES = [
    { num: get('vende_pilar1_num', '01'), titulo: get('vende_pilar1_titulo', 'Experiencia'), desc: get('vende_pilar1_desc', 'Profesionales con más de 20 años en banca e inversión inmobiliaria, orientados 100% al cliente.') },
    { num: get('vende_pilar2_num', '02'), titulo: get('vende_pilar2_titulo', 'Marketing'), desc: get('vende_pilar2_desc', 'Publicamos tu propiedad en Yapo, TocToc, Portal, Mercado Libre, Google Ads y Meta para maximizar la exposición.') },
    { num: get('vende_pilar3_num', '03'), titulo: get('vende_pilar3_titulo', 'Respaldo Legal'), desc: get('vende_pilar3_desc', 'Acompañamos todo el proceso: desde el estudio de títulos hasta la inscripción en el Conservador de Bienes Raíces.') },
  ]

  const formTitulo = get('vende_form_titulo', 'Comencemos el proceso')
  const formSubtitulo = get('vende_form_subtitulo', 'Cuéntanos sobre tu propiedad')

  return (
    <div className="min-h-screen">
      <SEO title="Vende con Nosotros — Asesoría y Venta de Propiedades" description="Pon tu propiedad en venta con SDM Capital. Marketing estratégico, asesoría y respaldo legal en todo el proceso." url="/vende-con-nosotros" />

      {/* Hero */}
      <div style={{ ...sp, paddingTop: 100, paddingBottom: 80, background: 'var(--navy-dark)', position: 'relative', overflow: 'hidden' }}>
        {heroImg && <img src={heroImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label section-label--light" style={{ marginBottom: 20 }}>Vende con Nosotros</div>
          <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,5vw,68px)', color: '#fff', lineHeight: 1.07, maxWidth: 700 }}>
            {emLast(heroTitulo)}
          </h1>
          <p className="font-light mt-6 border-l-2 pl-4 text-sdm-lg" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, borderColor: 'var(--green)', maxWidth: 560 }}>
            {heroSubtitulo}
          </p>
          <a className="text-sdm-xs tracking-sdm-wide" href="#contacto" style={{ display: 'inline-block', marginTop: 40, padding: '13px 28px', background: 'var(--green-dark)', color: '#fff', textDecoration: 'none', fontWeight: 500, textTransform: 'uppercase', borderRadius: 2 }}>Quiero vender mi propiedad</a>
        </div>
      </div>

      {/* Tres pilares */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Por qué elegirnos</div>
        <h2 className="font-serif font-light mb-16 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08, maxWidth: 640 }}>
          {pilaresTitulo}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {PILARES.map(p => (
            <div key={p.num}>
              <div className="font-serif text-sdm-base tracking-sdm-wide" style={{ color: 'var(--green-dark)', fontWeight: 500, marginBottom: 12 }}>{p.num}</div>
              <h3 className="font-serif font-light mb-4 text-sdm-2xl" style={{ color: 'var(--navy-dark)' }}>{p.titulo}</h3>
              <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8 }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo trabajamos */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--navy-dark)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>Nuestro proceso</div>
        <h2 className="font-serif font-light mb-16 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: '#fff', lineHeight: 1.08 }}>
          Cómo <em>trabajamos</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.08)' }}>
          {[
            { n: '01', texto: get('vende_paso_1', 'Análisis previo de tu propiedad y diagnóstico personalizado') },
            { n: '02', texto: get('vende_paso_2', 'Publicación estratégica en portales y redes sociales') },
            { n: '03', texto: get('vende_paso_3', 'Base de datos de compradores con crédito hipotecario aprobado') },
            { n: '04', texto: get('vende_paso_4', 'Acompañamiento en tasación y estudio de títulos') },
            { n: '05', texto: get('vende_paso_5', 'Redacción del borrador de escritura') },
            { n: '06', texto: get('vende_paso_6', 'Inscripción final en el Conservador de Bienes Raíces') },
          ].map((paso, i) => (
            <div key={paso.n} className="bg-[var(--navy-dark)] hover:bg-[rgba(61,170,110,0.08)]" style={{
              padding: '40px 32px',
              position: 'relative',
              borderLeft: i % 3 === 0 ? '3px solid var(--green)' : '3px solid transparent',
              transition: 'background 0.2s',
            }}
            >
              <div className="font-serif text-sdm-display-md" style={{ fontWeight: 300, color: 'var(--green-dark)', marginBottom: 20 }}>{paso.n}</div>
              <div style={{ width: 32, height: 3, background: 'var(--green)', marginBottom: 16 }} />
              <p className="text-sdm-base" style={{ fontWeight: 300, color: '#ffffff', lineHeight: 1.8 }}>{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formulario */}
      <section id="contacto" style={{ ...sp, paddingTop: 80, paddingBottom: 80 }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="section-label justify-center" style={{ marginBottom: 16 }}>{formSubtitulo}</div>
            <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
              {emLast(formTitulo)}
            </h2>
          </div>

          {status === 'ok' ? (
            <div className="py-12 text-center text-sdm-xl" style={{ color: 'var(--green-dark)' }}>
              <Check aria-hidden="true" size={22} strokeWidth={2} className="inline-block align-[-3px] mr-1.5" />
              ¡Gracias! Recibimos tu información y te contactaremos pronto.
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre completo</span>
                  <input required className="input-line" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre completo" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Email</span>
                  <input required type="email" className="input-line" value={form.email} onChange={set('email')} placeholder="tu@email.com" />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Teléfono</span>
                  <input type="tel" className="input-line" value={form.telefono} onChange={set('telefono')} placeholder="+56 9 ···" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Tipo de propiedad</span>
                  <select className="input-line" value={form.tipo_propiedad} onChange={set('tipo_propiedad')}>
                    {TIPOS_PROPIEDAD.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Comuna</span>
                  <input className="input-line" value={form.comuna} onChange={set('comuna')} placeholder="Ej: Las Condes" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Precio estimado (UF)</span>
                  <input type="number" min="0" className="input-line" value={form.precio_uf} onChange={set('precio_uf')} placeholder="Ej: 5000" />
                </label>
              </div>

              <label className="flex flex-col gap-2 mb-10">
                <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Mensaje / comentarios</span>
                <textarea className="input-line resize-none" rows={4} value={form.mensaje} onChange={set('mensaje')} placeholder="Cuéntanos más sobre tu propiedad…" />
              </label>

              {status === 'error' && (
                <p className="text-sdm-base" style={{ color: 'var(--error)', marginBottom: 16 }}>Error al enviar. Intenta de nuevo.</p>
              )}

              <div className="flex justify-center">
                <button type="submit" disabled={status === 'sending'} className="btn-primary text-sdm-sm" style={{ padding: '13px 36px' }}>
                  {status === 'sending' ? 'Enviando…' : 'Quiero vender mi propiedad →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
