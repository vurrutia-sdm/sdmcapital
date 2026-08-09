import { useEffect, useState, useRef } from 'react'
import { Pause, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import HeroSection from '@/components/sections/HeroSection'
import SearchBar from '@/components/sections/SearchBar'
import BannerPromo from '@/components/sections/BannerPromo'
import SEO from '@/components/SEO'
import ContactSection from '@/components/sections/ContactSection'
import BlogPreviewSection from '@/components/sections/BlogPreviewSection'
import PropertyCard from '@/components/ui/PropertyCard'
import Esqueleto from '@/components/ui/Esqueleto'
import SolicitudCreditoModal from '@/components/credito/SolicitudCreditoModal'
import type { Propiedad } from '@/types'

// Acá vivía SAMPLE_PROPS: seis propiedades inventadas que se pintaban hasta que
// llegaba la consulta. Ver la nota de Esqueleto.tsx y SINCRONIA.md.

// Mismas proporciones que PropertyCard —foto 4/3 y el cuerpo con p-5 lg:p-6—
// para que la grilla no cambie de alto cuando llegan las de verdad.
function EsqueletoPropiedad() {
  return (
    <div style={{ background: '#fff' }}>
      <Esqueleto aspecto="4/3" radio={0} />
      <div className="p-5 lg:p-6">
        <Esqueleto alto={26} ancho="45%" style={{ marginBottom: 10 }} />
        <Esqueleto alto={18} style={{ marginBottom: 6 }} />
        <Esqueleto alto={18} ancho="70%" style={{ marginBottom: 14 }} />
        <Esqueleto alto={16} ancho="55%" style={{ marginBottom: 16 }} />
        <div className="flex gap-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <Esqueleto alto={38} ancho={54} />
          <Esqueleto alto={38} ancho={54} />
          <Esqueleto alto={38} ancho={54} />
        </div>
      </div>
    </div>
  )
}


const TESTIMONIALS = [
  { num: '01', quote: '"SDM Capital hizo posible el sueño de mi familia de adquirir nuestra primera vivienda en Santiago. Asesoramiento personalizado y soluciones de financiamiento a medida."', sig: 'María Sánchez · Santiago, Chile' },
  { num: '02', quote: '"Como inversionista internacional, SDM Capital simplificó todo el proceso. Me ayudó a identificar oportunidades sólidas y mi cartera ha crecido significativamente."', sig: 'Carlos González · Miami, Florida, EE. UU.' },
  { num: '03', quote: '"Su conocimiento del mercado y atención personalizada hicieron que el proceso de compra en Viña del Mar fuera completamente libre de estrés."', sig: 'Isabel Ríos · Viña del Mar, Chile' },
]

// ─── CARRUSEL DE TESTIMONIOS ──────────────────────────────────────────────────
function TestimoniosCarrusel({ get, t }: { get: (k: string, d: string) => string; t: ReturnType<typeof useLang>['t'] }) {
  const items = [1,2,3,4,5,6,7,8].map(n => ({
    texto: get(`testimonial_${n}_texto`, n <= 3 ? (TESTIMONIALS[n-1]?.quote || '') : ''),
    autor: get(`testimonial_${n}_autor`, n <= 3 ? (TESTIMONIALS[n-1]?.sig || '') : ''),
    url:   get(`testimonial_${n}_url`, ''),
  })).filter(i => i.texto)

  const [current, setCurrent] = useState(0)
  // Mismo criterio que el carrusel del hero: rota indefinidamente, así que
  // 2.2.2 exige poder detenerlo. Nace pausado con `prefers-reduced-motion`.
  const [pausado, setPausado] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const timer = useRef<ReturnType<typeof setInterval>>()

  const goTo = (idx: number, dir: 'up' | 'down' = 'up') => {
    if (animating || items.length <= 1) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 400)
  }

  const next = () => goTo((current + 1) % items.length, 'up')
  const prev = () => goTo((current - 1 + items.length) % items.length, 'down')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aplicar = () => setPausado(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  useEffect(() => {
    if (items.length <= 1 || pausado) return
    timer.current = setInterval(next, 5000)
    return () => clearInterval(timer.current)
  }, [current, items.length, pausado])

  if (items.length === 0) return null

  const item = items[current]

  return (
    <section style={{ paddingLeft: 'clamp(16px,5vw,48px)', paddingRight: 'clamp(16px,5vw,48px)', paddingTop: 80, paddingBottom: 80 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">

        {/* Columna izquierda — título fijo */}
        <div style={{ textAlign: 'center' }} className="lg:text-left">
          <div className="section-label" style={{ marginBottom: 18, justifyContent: 'center' }}>{t.sections.testimonios.label}</div>
          <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(28px,4vw,40px)', color: 'var(--navy-dark)', lineHeight: 1.1 }}>
            {get('testimonios_titulo', 'Palabras de nuestros clientes')}
          </h2>
          <div style={{ width: 40, height: 1, background: 'var(--green)', margin: '24px auto 14px' }} />
          <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>
            {get('testimonios_subtitulo', t.sections.testimonios.sub)}
          </p>

          {/* Controles */}
          {items.length > 1 && (
            <div className="flex items-center gap-4 mt-10" style={{ justifyContent: 'center' }}>
              {/* El control de 2.2.2: las flechas cambian de testimonio pero no
                  detienen la rotación. */}
              <button
                type="button"
                onClick={() => setPausado(p => !p)}
                aria-label={pausado ? 'Reanudar el cambio automático de testimonios' : 'Pausar el cambio automático de testimonios'}
                className="area-44 bg-white text-[var(--navy-dark)] border border-[var(--border)] hover:bg-[var(--navy-dark)] hover:text-white"
                style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >
                {pausado ? <Play aria-hidden="true" size={14} fill="currentColor" /> : <Pause aria-hidden="true" size={14} fill="currentColor" />}
              </button>
              <button className="area-44 text-sdm-xl bg-white text-[var(--navy-dark)] border border-[var(--border)] hover:bg-[var(--navy-dark)] hover:text-white hover:border-[var(--navy-dark)]" onClick={prev}
                style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >↑</button>
              <button className="area-44 text-sdm-xl bg-white text-[var(--navy-dark)] border border-[var(--border)] hover:bg-[var(--navy-dark)] hover:text-white hover:border-[var(--navy-dark)]" onClick={next}
                style={{ width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              >↓</button>
              <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--muted)' }}>
                {String(current + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Columna derecha — testimonio animado */}
        <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div
            style={{
              overflow: 'hidden',
              opacity: animating ? 0 : 1,
              transform: animating
                ? `translateY(${direction === 'up' ? '-20px' : '20px'})`
                : 'translateY(0)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              textAlign: 'center',
            }}
          >
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 28, marginBottom: 4 }}>
              <p className="font-serif italic font-light" style={{ fontSize: 'clamp(18px,2.5vw,24px)', color: 'var(--ink)', lineHeight: 1.7, marginBottom: 20 }}>
                "{item.texto}"
              </p>
              <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: item.url ? 12 : 0 }}>
                {item.autor}
              </div>
              {item.url && (
                <a className="text-sdm-sm tracking-sdm-wide area-44" href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--green)', textDecoration: 'none', borderBottom: '1px solid var(--green)', paddingBottom: 2 }}
                >
                  Conoce la historia →
                </a>
              )}
            </div>

            {/* Dots */}
            {items.length > 1 && (
              /* 18px de separación y no 8: 2.5.8 (AA de WCAG 2.2) exime a un objetivo
                  menor de 24x24 solo si un círculo de 24px centrado en él no toca el
                  círculo ni la caja de un vecino. Con 8px el paso entre centros era
                  16px y los círculos se cortaban; con 18px queda en 26px y se
                  separan. Los puntos se siguen viendo de 8px: lo que cambia es el
                  aire entre ellos, no su tamaño. */
              <div className="flex mt-8" style={{ justifyContent: 'center', gap: 18 }}>
                {items.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    style={{ width: i === current ? 24 : 8, height: 8, borderRadius: 4, border: 'none', cursor: 'pointer', transition: 'all 0.3s', background: i === current ? 'var(--green)' : 'var(--border)', padding: 0 }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { t } = useLang()
  const { get } = useContenido()
  const [props, setProps] = useState<Propiedad[]>([])
  const [cargandoProps, setCargandoProps] = useState(true)
  const [creditoOpen, setCreditoOpen] = useState(false)

  // Los IDs de las destacadas salen de `useContenido`, no de una consulta
  // propia: así vienen sembrados en index.html y la selección ya es la correcta
  // en el primer render, en vez de resolverse a los ~300ms. El efecto depende
  // del valor, así que si la consulta en vivo trae otro —semilla vieja, o el
  // admin acaba de guardar— se vuelve a pedir con los IDs buenos.
  const destacadasIds = get('home_destacadas_ids', '')

  useEffect(() => {
    let ignorar = false

    // Las que tienen destacada=true. Es el camino cuando no hay selección
    // manual, y también el respaldo si los IDs guardados ya no existen.
    const porBandera = () => {
      supabase.from('propiedades').select('*').eq('destacada', true).neq('activo', false).limit(6)
        .then(({ data }) => {
          if (ignorar) return
          // Sin datos no se pinta nada. Antes quedaban las seis de muestra en
          // pantalla, para siempre si la consulta fallaba.
          if (data && data.length > 0) setProps(data)
          setCargandoProps(false)
        },
        // Red de seguridad: se comprobó que ante un fallo de red supabase
        // RESUELVE con `{ error }` en vez de rechazar, así que esta rama casi
        // nunca corre. Queda para que un rechazo raro no deje la grilla con los
        // seis esqueletos puestos, que sería otra forma de mentir sobre lo que
        // está pasando.
        () => { if (!ignorar) setCargandoProps(false) })
    }

    let ids: string[] = []
    try {
      const guardado: unknown = destacadasIds ? JSON.parse(destacadasIds) : []
      if (Array.isArray(guardado)) ids = guardado.filter((x): x is string => typeof x === 'string')
    } catch {
      // Un valor mal formado en la base no puede dejar el home sin destacadas:
      // antes este JSON.parse iba suelto y una comilla de más tiraba el efecto
      // entero, sin destacadas y sin respaldo.
      ids = []
    }

    if (ids.length === 0) { porBandera(); return () => { ignorar = true } }

    supabase.from('propiedades').select('*').in('id', ids).neq('activo', false)
      .then(({ data }) => {
        if (ignorar) return
        if (data && data.length > 0) {
          // Respetar el orden de los IDs guardados
          setProps(ids.map(id => data.find(p => p.id === id)).filter(Boolean) as Propiedad[])
          setCargandoProps(false)
        } else {
          porBandera()
        }
      },
      () => { if (!ignorar) setCargandoProps(false) })

    return () => { ignorar = true }
  }, [destacadasIds])

  const finImg = get('financiamiento_imagen', '')


  return (
    <div>
      <SEO
        title="Inversión Inmobiliaria Chile & Internacional"
        description="Tu socio confiable en bienes raíces. Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y Paraguay. Financiamiento sin pagos adelantados."
        url="/"
      />
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Search bar */}
      <SearchBar />

      {/* 2b. Banner promocional — se controla desde Contenido → Inicio */}
      <BannerPromo />

      {/* 3. Propiedades destacadas */}
      <section className="py-12 lg:py-24">
        <div style={{ paddingLeft: 'clamp(16px,5vw,48px)', paddingRight: 'clamp(16px,5vw,48px)' }}>
          <div className="mb-8 lg:mb-12" style={{ textAlign: 'center' }} >
            <div className="section-label" style={{ marginBottom: 12, justifyContent: 'center' }}>
              {get('props_label', t.sections.propiedades.label)}
            </div>
            <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,6vw,50px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
              {get('props_titulo', 'Oportunidades')} <em>{get('props_titulo_em', 'en Chile')}</em>
            </h2>
            <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>
              {get('props_sub', t.sections.propiedades.sub)}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/propiedades" className="btn-text mt-4 inline-flex area-44 area-44--arriba">
              {get('props_ver_todas', t.sections.propiedades.verTodas)}
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
          {cargandoProps && Array.from({ length: 6 }, (_, i) => <EsqueletoPropiedad key={`esq-${i}`} />)}
          {!cargandoProps && props.slice(0, 6).map((p, i, arr) => {
            const remainder = arr.length % 3
            const isLast = i === arr.length - 1
            return (
              <div key={p.id} style={{ background: '#fff', gridColumn: remainder === 1 && isLast ? 'span 3' : undefined }}>
                <PropertyCard propiedad={p} index={i} />
              </div>
            )
          })}
        </div>
      </section>

      {/* 5. Financiamiento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px mb-px" style={{ background: 'var(--border)' }}>
        <div
          className="flex flex-col justify-between px-8 lg:px-16 py-12 lg:py-16"
          style={{ background: 'var(--navy-dark)', minHeight: 380 }}
        >
          <div className="text-center lg:text-left">
            <div className="section-label section-label--light justify-center lg:justify-start" style={{ marginBottom: 18 }}>
              {t.sections.financiamiento.label}
            </div>
            <h2 className="font-serif font-light" style={{ fontSize: 'clamp(32px,5vw,44px)', lineHeight: 1.1, color: '#fff' }}>
              {t.sections.financiamiento.title.split('financiamiento')[0]}
              <br /><em style={{ color: 'var(--sky)' }}>financiamiento</em>?
            </h2>
            <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.9, color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>
              {get('financiamiento_body', t.sections.financiamiento.body)}
            </p>
          </div>
          <div className="flex gap-3 mt-8 justify-center lg:justify-start">
            <Link to="/servicios/financiamiento-personas" className="btn-green">
              {t.sections.financiamiento.personas}
            </Link>
            <Link
              to="/servicios/financiamiento-empresas"
              className="btn-outline bg-transparent hover:bg-[rgba(255,255,255,0.1)]"
              style={{ color: '#FFFFFF', border: '1.5px solid #FFFFFF' }}
            >
              {t.sections.financiamiento.empresas}
            </Link>
          </div>
          <div className="flex mt-3 justify-center lg:justify-start">
            <button onClick={() => setCreditoOpen(true)} className="btn-inverse">
              Solicita una evaluación gratuita →
            </button>
          </div>
        </div>
        <div
          className="hidden lg:flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg,#0d2035,#162d45)', minHeight: 440 }}
        >
          {finImg
            ? <img src={finImg} alt="Financiamiento" className="w-full h-full object-cover" style={{ minHeight: 440 }} />
            : <span className="font-serif italic text-sdm-lg" style={{ color: 'rgba(255,255,255,0.15)' }}>Fotografía de apoyo</span>
          }
        </div>
      </div>

      {/* 6. Internacional — temporalmente oculta */}

      {/* 7. Testimonios — Carrusel */}
      <TestimoniosCarrusel get={get} t={t} />

      {/* 8. Blog preview */}
      <BlogPreviewSection />

      {/* 9. Contacto */}
      <ContactSection />
      {creditoOpen && <SolicitudCreditoModal onClose={() => setCreditoOpen(false)} />}
    </div>
  )
}
