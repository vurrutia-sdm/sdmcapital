// SDM Capital — ContactSection
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MensajeContacto } from '@/types'

const CONTACT_INFO = [
  { label: 'Dirección', lines: ['Av. Apoquindo 5583', 'Las Condes, Santiago'] },
  { label: 'Teléfono',  lines: ['+56 9 3103 8954', '+56 9 6191 2281'] },
  { label: 'Email',     lines: ['contacto@sdmcapital.cl'] },
  { label: 'Horario',   lines: ['Lunes a Viernes', '09:00 – 18:00'] },
]

export default function ContactSection() {
  const [form, setForm] = useState<MensajeContacto>({ nombre: '', email: '', telefono: '', mensaje: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')

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
          <h2 className="font-serif font-light" style={{ fontSize: 'clamp(36px,4vw,56px)', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
            Hablemos de <em>tus metas</em>
          </h2>
        </div>

        {/* Formulario centrado */}
        <div className="bg-white rounded-sm p-10 lg:p-14 mb-12">
          {status === 'ok' ? (
            <div className="py-12 text-center" style={{ color: 'var(--green)', fontSize: 18 }}>
              ✓ Mensaje enviado. Te contactaremos pronto.
            </div>
          ) : (
            <form onSubmit={submit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Nombre</label>
                  <input required className="input-line" value={form.nombre} onChange={set('nombre')} placeholder="Tu nombre completo" />
                </div>
                <div className="flex flex-col gap-2">
                  <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Email</label>
                  <input required type="email" className="input-line" value={form.email} onChange={set('email')} placeholder="tu@email.com" />
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-8">
                <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Teléfono</label>
                <input type="tel" className="input-line" value={form.telefono} onChange={set('telefono')} placeholder="+56 9 ···" />
              </div>
              <div className="flex flex-col gap-2 mb-10">
                <label style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Mensaje</label>
                <textarea required className="input-line resize-none" rows={4} value={form.mensaje} onChange={set('mensaje')} placeholder="¿En qué te podemos ayudar?" />
              </div>
              {status === 'error' && (
                <p style={{ fontSize: 14, color: '#E24B4A', marginBottom: 16 }}>Error al enviar. Intenta de nuevo.</p>
              )}
              <div className="flex justify-center">
                <button type="submit" disabled={status === 'sending'} className="btn-primary disabled:opacity-60" style={{ padding: '13px 48px', fontSize: 12 }}>
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
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--sky)', marginBottom: 10, fontFamily: 'Inter, system-ui, sans-serif' }}>
                {item.label}
              </div>
              {item.lines.map((line, i) => (
                <div key={i} style={{ fontSize: 16, fontWeight: 300, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontFamily: 'Inter, system-ui, sans-serif', whiteSpace: 'nowrap' }}>
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

