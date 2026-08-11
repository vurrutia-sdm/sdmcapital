// SDM Capital — ContactSection
import { useState } from 'react'
import { Check } from 'lucide-react'
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

  // Solo Dirección y Horario. Los teléfonos y el email subieron al footer, que
  // está en las 13 rutas públicas; esta sección solo se monta en 7, así que
  // repetirlos acá era duplicar en unas pocas lo que ya está en todas.
  //
  // Dirección y Horario se quedan porque el footer NO los lleva —ocupaban
  // cuatro renglones y no se consultan desde ahí— y no existen en ninguna otra
  // parte del sitio: no hay ruta /contacto, solo el ancla #contacto que apunta
  // a esta misma sección.
  const CONTACT_INFO = [
    {
      label: 'Dirección',
      lines: comaIdx >= 0 ? [direccion.slice(0, comaIdx), direccion.slice(comaIdx + 1).trim()] : [direccion],
    },
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
          <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(var(--sdm-display-sm),4vw,var(--sdm-display-md))', color: '#fff', lineHeight: 1.1 }}>
            Hablemos de <em>tus metas</em>
          </h2>
        </div>

        {/* Formulario centrado */}
        <div className="bg-white rounded-sm p-10 lg:p-14 mb-12">
          {status === 'ok' ? (
            <div className="py-12 text-center text-sdm-xl" style={{ color: 'var(--green-dark)' }}>
              <Check aria-hidden="true" size={22} strokeWidth={2} className="inline-block align-[-3px] mr-1.5" />
              Mensaje enviado. Te contactaremos pronto.
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
                <button type="submit" disabled={status === 'sending'} className="btn-primary text-sdm-sm" style={{ padding: '13px 48px' }}>
                  {status === 'sending' ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info de contacto — fila horizontal abajo.
            Dos elementos, no cuatro: al subir Teléfono y Email al footer, la
            grilla de `md:grid-cols-4` dejaba los dos restantes pegados a la
            izquierda con la mitad derecha vacía. Con dos columnas y ancho
            acotado quedan centrados en el espacio disponible.

            Se mantienen DOS columnas también en móvil: apilarlos de a uno
            subía la sección de 1038 a 1150px a 390, y con solo dos elementos
            caben de sobra. */}
        <div className="grid grid-cols-2 gap-6 mt-4 mx-auto" style={{ maxWidth: 620 }}>
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

