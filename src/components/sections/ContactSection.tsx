// SDM Capital — ContactSection
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import type { MensajeContacto } from '@/types'

export default function ContactSection() {
  const { get } = useContenido()
  const [form, setForm] = useState<MensajeContacto>({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

  const direccion = get('direccion', 'Av. Apoquindo 5583, Las Condes, Santiago')
  const comaIdx = direccion.indexOf(',')
  const horario = get('horario', 'Lunes a Viernes · 09:00 – 18:00')

  const CONTACT_INFO = [
    {
      label: 'Dirección',
      lines: comaIdx >= 0 ? [direccion.slice(0, comaIdx), direccion.slice(comaIdx + 1).trim()] : [direccion],
    },
    { label: 'Teléfono', lines: [get('telefono_1', '+56 9 3103 8954'), get('telefono_2', '+56 9 6191 2281')].filter(Boolean) },
    { label: 'Email',    lines: [get('email', 'contacto@sdmcapital.cl')] },
    { label: 'Horario',  lines: horario.split('·').map(s => s.trim()).filter(Boolean) },
  ]

  const set = (k: keyof MensajeContacto) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    const { error } = await supabase.from('contacto_mensajes').insert([form])
    setStatus(error ? 'error' : 'ok')
  }

  return (
    <section id="contacto" style={{ background: 'var(--navy-dark)' }}>
      <div className="px-8 lg:px-12 py-20 lg:py-24 max-w-5xl mx-auto">

        {/* Header centrado */}
        <div className="text-center mb-14">
          <div className="section-label section-label--light justify-center" style={{ marginBottom: 16 }}>
            Contáctanos
          </div>
          <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(36px,4vw,56px)', color: '#fff', lineHeight: 1.1 }}>
            Hablemos de <em>tus metas</em>
          </h2>
        </div>

        {/* Formulario centrado */}
        <div className="bg-white rounded-sm p-10 lg:p-14 mb-12">
          {status === 'ok' ? (
            <div className="py-12 text-center text-sdm-xl" style={{ color: 'var(--green)' }}>
              ✓ Mensaje enviado. Te contactaremos pronto.
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</span>
                  <input required className="input-line" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre completo" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Email</span>
                  <input required type="email" className="input-line" value={form.email} onChange={set('email')} placeholder="tu@email.com" />
                </label>
              </div>
              <label className="flex flex-col gap-2 mb-8">
                <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Teléfono</span>
                <input type="tel" className="input-line" value={form.telefono} onChange={set('telefono')} placeholder="+56 9 ···" />
              </label>
              <label className="flex flex-col gap-2 mb-10">
                <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)' }}>Mensaje</span>
                <textarea required className="input-line resize-none" rows={4} value={form.mensaje} onChange={set('mensaje')} placeholder="¿En qué te podemos ayudar?" />
              </label>
              {status === 'error' && (
                <p className="text-sdm-base" style={{ color: 'var(--error)', marginBottom: 16 }}>Error al enviar. Intenta de nuevo.</p>
              )}
              <div className="flex justify-center">
                <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-60 text-sdm-sm" style={{ padding: '13px 48px' }}>
                  {status === 'sending' ? 'Enviando…' : 'Enviar →'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info de contacto — fila horizontal abajo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
          {CONTACT_INFO.map(item => (
            <div key={item.label} className="text-center">
              <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--sky)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {item.label}
              </div>
              {item.lines.map((line, i) => (
                <div className="text-sdm-lg" key={i} style={{ fontWeight: 300, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
                  {line}
                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

