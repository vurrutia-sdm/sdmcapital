import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'

const SLUGS = [
  { slug: 'inversion-internacional', n: '01', key: 'inv_int', titulo: 'Inversión Internacional' },
  { slug: 'inversion-chile',         n: '02', key: 'inv_cl',  titulo: 'Inversión en Chile' },
  { slug: 'financiamiento-personas', n: '03', key: 'fin_per', titulo: 'Financiamiento Personas' },
  { slug: 'financiamiento-empresas', n: '04', key: 'fin_emp', titulo: 'Financiamiento Empresas' },
  { slug: 'bancarizacion-extranjero',n: '05', key: 'banco',   titulo: 'Bancarización en el Extranjero' },
]

const GRADIENTS = ['#1a3d5c','#1a3528','#252535','#351a1a','#2a1a35']

const scrollToContact = () => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })

// Parsear tags: "Label|url, Label2|url2, Label3"
function parseTags(raw: string): { label: string; url: string }[] {
  if (!raw.trim()) return []
  return raw.split(',').map(t => {
    const [label, url] = t.trim().split('|')
    return { label: label?.trim() || '', url: url?.trim() || '' }
  }).filter(t => t.label)
}

export default function ServiciosPage() {
  const { slug } = useParams<{ slug?: string }>()
  const { get } = useContenido()

  useEffect(() => {
    if (slug) {
      setTimeout(() => {
        document.getElementById(slug)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [slug])

  return (
    <div>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-14 pb-12 border-b border-[#e8edf2]" style={{ background: 'var(--navy-dark)' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 18 }}>Lo que hacemos</div>
        <h1 className="font-serif font-light" style={{ fontSize: 'clamp(40px,5vw,64px)', color: '#fff', lineHeight: 1.07, letterSpacing: '-0.5px' }}>
          Nuestros <em>servicios</em>
        </h1>
        <p className="font-light mt-5" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, maxWidth: 480 }}>
          Soluciones integrales en inversión inmobiliaria y financiamiento, tanto en Chile como en el extranjero.
        </p>
      </div>

      <div>
        {SLUGS
          .filter(s => get(`servicio_${s.key}_visible`, 'true') !== 'false')
          .map((s, i) => {
          const desc  = get(`servicio_${s.key}_desc`,    '')
          const img   = get(`servicio_${s.key}_imagen`,  '')
          const titulo = get(`servicio_${s.key}_titulo`, s.titulo)
          const tagsRaw = get(`servicio_${s.key}_tags`,  '')
          const tags = parseTags(tagsRaw)

          return (
            <div key={s.slug} id={s.slug}
              className="grid grid-cols-1 lg:grid-cols-2 gap-px border-b border-[#e8edf2]"
              style={{ background: 'var(--border)', scrollMarginTop: 80 }}
            >
              {/* Text side */}
              <div className={`bg-white px-8 lg:px-14 py-14 ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
                <div className="font-serif mb-5" style={{ fontSize: 44, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
                <h2 className="font-serif font-light mb-4" style={{ fontSize: 36, color: 'var(--navy-dark)', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
                  {titulo}
                </h2>
                {desc && (
                  <p className="font-light mb-8" style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 420 }}>
                    {desc}
                  </p>
                )}

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {tags.map((tag, ti) => (
                      tag.url
                        ? <a key={ti} href={tag.url} target="_blank" rel="noopener noreferrer"
                            className="px-3 py-1.5 text-[13px] tracking-[1.5px] uppercase border transition-colors"
                            style={{ borderColor: 'var(--green)', color: 'var(--green)', borderRadius: 1, textDecoration: 'none' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)'; e.currentTarget.style.color = '#fff' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--green)' }}>
                            {tag.label} ↗
                          </a>
                        : <span key={ti} className="px-3 py-1.5 text-[13px] tracking-[1.5px] uppercase border"
                            style={{ borderColor: 'var(--border)', color: 'var(--muted)', borderRadius: 1 }}>
                            {tag.label}
                          </span>
                    ))}
                  </div>
                )}

                <button onClick={scrollToContact} className="btn-primary inline-flex">
                  Más información →
                </button>
              </div>

              {/* Image side */}
              <div className={`flex items-center justify-center overflow-hidden ${i % 2 !== 0 ? 'lg:order-1' : ''}`}
                style={{ minHeight: 340, background: `linear-gradient(160deg,${GRADIENTS[i]},#0d2035)` }}>
                {img
                  ? <img src={img} alt={titulo} className="w-full h-full object-cover" style={{ minHeight: 340 }} />
                  : <span className="font-serif italic" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }}>{titulo}</span>
                }
              </div>
            </div>
          )
        })}
      </div>

      <ContactSection />
    </div>
  )
}
