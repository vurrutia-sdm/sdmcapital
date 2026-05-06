import ContactSection from "@/components/sections/ContactSection"
import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import HeroSection from '@/components/sections/HeroSection'
import SearchBar from '@/components/sections/SearchBar'
import SEO from '@/components/SEO'
import PropertyCard from '@/components/ui/PropertyCard'
import type { Propiedad } from '@/types'

// ─── Sample data for empty DB ──────────────────────────────────────────────
const SAMPLE_PROPS: Propiedad[] = [
  { id:'1', titulo:'Casa aislada 3D 2B · Casas del Oeste, Cerrillos', descripcion:'', tipo:'casa', estado:'en_venta', precio_uf:3499, a_consultar:false, dormitorios:3, banos:2, superficie_total:126, region:'R. Metropolitana', comuna:'Cerrillos', pais:'Chile', imagenes:[], destacada:true, internacional:false, created_at:'', updated_at:'' },
  { id:'2', titulo:'Casa 2D 2B a pasos Metro Plaza Quilicura', descripcion:'', tipo:'casa', estado:'en_venta', precio_uf:3137, a_consultar:false, dormitorios:2, banos:2, superficie_total:80, region:'R. Metropolitana', comuna:'Quilicura', pais:'Chile', imagenes:[], destacada:true, internacional:false, created_at:'', updated_at:'' },
  { id:'3', titulo:'Hotel + Restaurante · Alto potencial turístico', descripcion:'', tipo:'hotel', estado:'en_venta', a_consultar:true, region:'Los Lagos', comuna:'Futaleufú', pais:'Chile', imagenes:[], destacada:false, internacional:false, created_at:'', updated_at:'' },
  { id:'4', titulo:'Casa seminueva 2D 1B · Valles del Sauce II', descripcion:'', tipo:'casa', estado:'en_venta', precio_uf:2099, a_consultar:false, dormitorios:2, banos:1, superficie_total:51, region:'Coquimbo', comuna:'Coquimbo', pais:'Chile', imagenes:[], destacada:false, internacional:false, created_at:'', updated_at:'' },
  { id:'5', titulo:'Hermosa casa 3D 2B · Condominio Viñas de Tobalaba', descripcion:'', tipo:'casa', estado:'en_venta', precio_uf:8600, a_consultar:false, dormitorios:3, banos:2, region:'R. Metropolitana', comuna:'Peñalolén', pais:'Chile', imagenes:[], destacada:true, internacional:false, created_at:'', updated_at:'' },
  { id:'6', titulo:'Casa 3D 3B con piscina · Condominio Valle Grande', descripcion:'', tipo:'casa', estado:'en_venta', precio_uf:4273, a_consultar:false, dormitorios:3, banos:3, region:'R. Metropolitana', comuna:'Lampa', pais:'Chile', imagenes:[], destacada:false, internacional:false, created_at:'', updated_at:'' },
]

const CITIES = [
  { key: 'miami',      name: 'Miami',      country: 'Florida, Estados Unidos',         count: '3', bg: 'linear-gradient(160deg,#1a3d5c,#0a1f30)', span2: true  },
  { key: 'punta_cana', name: 'Punta Cana', country: 'Rep. Dominicana',                 count: '5', bg: 'linear-gradient(160deg,#1a3528,#0a2018)', span2: false },
  { key: 'orlando',    name: 'Orlando',    country: 'Florida, EE.UU.',                  count: '2', bg: 'linear-gradient(160deg,#1a2d40,#0a1a28)', span2: false },
  { key: 'espana',     name: 'España',     country: 'Madrid · Barcelona',               count: '3', bg: 'linear-gradient(160deg,#2a1a2a,#180d18)', span2: false },
  { key: 'uruguay',    name: 'Uruguay',    country: 'Montevideo · Punta del Este',      count: '8', bg: 'linear-gradient(160deg,#1a2810,#0d1a08)', span2: false },
  { key: 'nueva_york', name: 'Nueva York', country: 'Estados Unidos',                  count: '—', bg: 'linear-gradient(160deg,#2a2010,#1a1208)', span2: false },
]

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
    if (items.length <= 1) return
    timer.current = setInterval(next, 5000)
    return () => clearInterval(timer.current)
  }, [current, items.length])

  if (items.length === 0) return null

  const item = items[current]

  return (
    <section style={{ paddingLeft: 'clamp(16px,5vw,48px)', paddingRight: 'clamp(16px,5vw,48px)', paddingTop: 80, paddingBottom: 80 }}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">

        {/* Columna izquierda — título fijo */}
        <div style={{ textAlign: 'center' }} className="lg:text-left">
          <div className="section-label" style={{ marginBottom: 18, justifyContent: 'center' }}>{t.sections.testimonios.label}</div>
          <h2 className="font-serif font-light" style={{ fontSize: 'clamp(28px,4vw,40px)', color: 'var(--navy-dark)', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
            {get('testimonios_titulo', 'Palabras de nuestros clientes')}
          </h2>
          <div style={{ width: 40, height: 1, background: 'var(--green)', margin: '24px auto 14px' }} />
          <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>
            {get('testimonios_subtitulo', t.sections.testimonios.sub)}
          </p>

          {/* Controles */}
          {items.length > 1 && (
            <div className="flex items-center gap-4 mt-10" style={{ justifyContent: 'center' }}>
              <button onClick={prev}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--navy-dark)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy-dark)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--navy-dark)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--navy-dark)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >↑</button>
              <button onClick={next}
                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--navy-dark)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--navy-dark)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--navy-dark)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--navy-dark)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >↓</button>
              <span style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '2px' }}>
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
              <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: item.url ? 12 : 0 }}>
                {item.autor}
              </div>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', textDecoration: 'none', borderBottom: '1px solid var(--green)', paddingBottom: 2 }}
                >
                  Conoce la historia →
                </a>
              )}
            </div>

            {/* Dots */}
            {items.length > 1 && (
              <div className="flex gap-2 mt-8" style={{ justifyContent: 'center' }}>
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
  const [props, setProps] = useState<Propiedad[]>(SAMPLE_PROPS)

  useEffect(() => {
    // Intentar cargar por IDs manuales guardados en contenido_sitio
    supabase.from('contenido_sitio').select('valor').eq('clave', 'home_destacadas_ids').single()
      .then(async ({ data }) => {
        if (data?.valor) {
          const ids: string[] = JSON.parse(data.valor)
          if (ids.length > 0) {
            const { data: props } = await supabase.from('propiedades').select('*').in('id', ids).neq('activo', false)
            if (props && props.length > 0) {
              // Respetar el orden de los IDs guardados
              const ordered = ids.map(id => props.find(p => p.id === id)).filter(Boolean) as Propiedad[]
              setProps(ordered)
              return
            }
          }
        }
        // Fallback: cargar las que tienen destacada=true
        supabase.from('propiedades').select('*').eq('destacada', true).neq('activo', false).limit(6)
          .then(({ data }) => { if (data && data.length > 0) setProps(data) })
      })
  }, [])

  const finImg = get('financiamiento_imagen', '')

  // Imágenes de destinos internacionales
  const cityImgs: Record<string, string> = {
    miami:      get('dest_miami_img', ''),
    punta_cana: get('dest_punta_cana_img', ''),
    orlando:    get('dest_orlando_img', ''),
    espana:     get('dest_espana_img', ''),
    uruguay:    get('dest_uruguay_img', ''),
    nueva_york: get('dest_nueva_york_img', ''),
  }

  return (
    <div>
      <SEO
        title="Inversión Inmobiliaria Chile & Internacional"
        description="Tu socio estratégico en bienes raíces. Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el mundo. Financiamiento sin pagos adelantados."
        url="/"
      />
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Search bar */}
      <SearchBar />

      {/* 3. Propiedades destacadas */}
      <section className="py-12 lg:py-24">
        <div style={{ paddingLeft: 'clamp(16px,5vw,48px)', paddingRight: 'clamp(16px,5vw,48px)' }}>
          <div className="mb-8 lg:mb-12" style={{ textAlign: 'center' }} >
            <div className="section-label" style={{ marginBottom: 12, justifyContent: 'center' }}>
              {get('props_label', t.sections.propiedades.label)}
            </div>
            <h2 className="font-serif font-light" style={{ fontSize: 'clamp(32px,6vw,50px)', color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
              {get('props_titulo', 'Oportunidades')} <em>{get('props_titulo_em', 'en Chile')}</em>
            </h2>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>
              {get('props_sub', t.sections.propiedades.sub)}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/propiedades" className="btn-text mt-4 inline-flex">
              {get('props_ver_todas', t.sections.propiedades.verTodas)}
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
          {props.slice(0, 6).map((p, i, arr) => {
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
            <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.9, color: 'rgba(255,255,255,0.5)', marginTop: 20 }}>
              {t.sections.financiamiento.body}
            </p>
          </div>
          <div className="flex gap-3 mt-8 justify-center lg:justify-start">
            <Link to="/servicios/financiamiento-personas" className="btn-green">
              {t.sections.financiamiento.personas}
            </Link>
            <Link to="/servicios/financiamiento-empresas" className="btn-outline">
              {t.sections.financiamiento.empresas}
            </Link>
          </div>
        </div>
        <div
          className="hidden lg:flex items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg,#0d2035,#162d45)', minHeight: 440 }}
        >
          {finImg
            ? <img src={finImg} alt="Financiamiento" className="w-full h-full object-cover" style={{ minHeight: 440 }} />
            : <span className="font-serif italic" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }}>Fotografía de apoyo</span>
          }
        </div>
      </div>

      {/* 6. Internacional — temporalmente oculta */}

      {/* 7. Testimonios — Carrusel */}
      <TestimoniosCarrusel get={get} t={t} />

      {/* 8. Contacto */}
      <ContactSection />
    </div>
  )
}
