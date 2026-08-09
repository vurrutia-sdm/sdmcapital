import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import ContactSection from '@/components/sections/ContactSection'
import Esqueleto from '@/components/ui/Esqueleto'
import type { Asociado } from '@/types'

// Acá vivía SAMPLE_ASOCIADOS: seis fichas inventadas que nombraban a Portal
// Inmobiliario, BCI, Santander, CBRE y Century 21 como socios de SDM, con
// enlace a sus sitios reales. Se pintaban hasta que llegaba la consulta, y para
// siempre si fallaba. Afirmar una relación comercial que no existe es bastante
// peor que dejar el bloque vacío. Ver SINCRONIA.md.

export default function AsociadosPage() {
  const { lang } = useLang()
  const [asociados, setAsociados] = useState<Asociado[]>([])
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')

  useEffect(() => {
    let ignorar = false
    supabase.from('asociados').select('*').eq('activo', true).order('orden')
      .then(({ data, error }) => {
        if (ignorar) return
        // El `{ error }` se recoge de verdad: es lo que distingue «todavía no
        // hay socios» de «no se pudo cargar», y son dos cosas distintas.
        //
        // Ojo con el tiempo: supabase reintenta con espera creciente —medido a
        // los 116, 1119, 3121 y 7124 ms— así que ante una caída de red el
        // mensaje tarda unos 7 segundos en aparecer. Hasta entonces se ven los
        // esqueletos, que es lo correcto: todavía está intentando.
        if (error) { setEstado('error'); return }
        setAsociados(data || [])
        setEstado('listo')
      },
      // Red de seguridad, no el camino normal: se comprobó que ante un fallo
      // de red supabase RESUELVE con `{ error: 'TypeError: Failed to fetch' }`,
      // no rechaza. El segundo argumento queda por si algún día rechaza, porque
      // el precio de que no esté es que la sección se quede con los esqueletos
      // puestos para siempre.
      () => { if (!ignorar) setEstado('error') })
    return () => { ignorar = true }
  }, [])

  return (
    <div>
      <SEO
        title="Nuestros asociados"
        description="Red de socios y alianzas estratégicas de SDM Capital en Chile y el extranjero."
      />
      {/* Header */}
      <div className="px-8 lg:px-12 pt-14 pb-12 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 18 }}>
          {lang === 'es' ? 'Red de socios' : 'Partner network'}
        </div>
        <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(40px,5vw,64px)', color: 'var(--navy-dark)', lineHeight: 1.07 }}>
          Nuestros <em>asociados</em>
        </h1>
        <p className="font-light mt-5 text-sdm-lg" style={{ color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560 }}>
          {lang === 'es'
            ? 'Trabajamos con una red selecta de socios estratégicos que nos permiten ofrecer a nuestros clientes el mejor servicio integral en cada etapa del proceso inmobiliario y financiero.'
            : 'We work with a select network of strategic partners that allow us to offer our clients the best comprehensive service at every stage of the real estate and financial process.'
          }
        </p>
      </div>

      {/* Texto editorial */}
      <section className="px-8 lg:px-12 py-16 border-b border-[#e8edf2]" style={{ background: 'var(--off)' }}>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-16" style={{ padding: '0 clamp(16px,5vw,0px)' }}>
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            <h2 className="font-serif font-light mb-4 text-sdm-2xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Alianzas <em>estratégicas</em>
            </h2>
            <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
              {lang === 'es'
                ? 'Cada asociado ha sido seleccionado por su trayectoria, seriedad y compromiso con la excelencia en el servicio.'
                : 'Each partner has been selected for their track record, seriousness and commitment to service excellence.'
              }
            </p>
          </div>
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            {/* Decía «Red global» sobre un párrafo que acota la red a Chile y
                Paraguay: sobraba por su propia cuenta. Una red de socios sí
                puede ser más amplia que la operación —son cosas distintas—,
                pero este texto no dice eso. «Regional» va en paralelo con el
                valor 04 de /quienes-somos; «Red de socios» habría repetido la
                etiqueta de sección de esta misma página. */}
            <h2 className="font-serif font-light mb-4 text-sdm-2xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Red <em>regional</em>
            </h2>
            <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
              {lang === 'es'
                ? 'Nuestra red abarca instituciones financieras, portales inmobiliarios, notarías y consultoras en Chile y el extranjero.'
                : 'Our network spans financial institutions, real estate portals, notaries and consultancies in Chile and abroad.'
              }
            </p>
          </div>
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            <h2 className="font-serif font-light mb-4 text-sdm-2xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Servicio <em>integral</em>
            </h2>
            <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
              {lang === 'es'
                ? 'Juntos garantizamos una experiencia completa: desde la búsqueda de la propiedad hasta la obtención del financiamiento.'
                : 'Together we guarantee a complete experience: from property search to obtaining financing.'
              }
            </p>
          </div>
        </div>
      </section>

      {/* Grid de logos */}
      <section className="px-8 lg:px-12 py-16">
        <div className="section-label" style={{ marginBottom: 20 }}>
          Socios comerciales
        </div>
        {estado === 'error' && (
          <p className="text-sdm-base" style={{ color: 'var(--muted)', textAlign: 'center', padding: '48px 0' }}>
            No pudimos cargar los socios. Recarga la página para volver a intentarlo.
          </p>
        )}
        {/* Centrado automático: justify-center evita celdas vacías grises */}
        <div className="flex flex-wrap justify-center gap-px" style={{ background: 'var(--border)' }}>
          {estado === 'cargando' && Array.from({ length: 4 }, (_, i) => (
            // Mismo alto y ancho que la tarjeta real, para que el bloque no salte.
            <div key={`esq-${i}`} className="bg-white flex items-center justify-center p-10"
              style={{ minHeight: 180, width: 'calc(25% - 1px)', minWidth: 220 }}>
              <Esqueleto alto={56} ancho="70%" />
            </div>
          ))}
          {estado === 'listo' && asociados.map(a => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white flex flex-col items-center justify-center p-10 transition-colors duration-200 hover:bg-[#EDF4F9]"
              style={{ textDecoration: 'none', minHeight: 180, width: 'calc(25% - 1px)', minWidth: 220 }}
            >
              {a.logo ? (
                <img
                  src={a.logo}
                  alt={a.nombre}
                  className="max-h-14 max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <div className="text-center">
                  <div className="font-serif font-light mb-2 text-sdm-xl tracking-sdm-wide" style={{ color: 'var(--navy-dark)' }}>
                    {a.nombre}
                  </div>
                  <div style={{ width: 28, height: 1, background: 'var(--green)', margin: '0 auto 8px' }} />
                </div>
              )}
              {a.descripcion && (
                <p className="text-center mt-3 text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.6 }}>
                  {lang === 'en' ? (a.descripcion || a.descripcion) : a.descripcion}
                </p>
              )}
              <span className="mt-3 text-[13px] tracking-[2px] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color: 'var(--green)' }}>
                Visitar ↗
              </span>
            </a>
          ))}
        </div>
        <div className="mt-16 border border-[#e8edf2] p-10 text-center" style={{ borderRadius: 2 }}>
          <div className="section-label justify-center mb-4">
            {lang === 'es' ? '¿Quieres ser socio?' : 'Want to be a partner?'}
          </div>
          <h2 className="font-serif font-light mb-4 text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
            Únete a nuestra <em>red</em>
          </h2>
          <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
            {lang === 'es'
              ? 'Si tu empresa comparte nuestros valores de excelencia y transparencia, nos encantaría explorar una colaboración estratégica.'
              : 'If your company shares our values of excellence and transparency, we\'d love to explore a strategic collaboration.'
            }
          </p>
          <button
            onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-primary inline-flex"
          >
            Contáctanos →
          </button>
        </div>
      </section>

      <ContactSection />
    </div>
  )
}
