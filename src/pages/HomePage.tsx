import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import HeroSection from '@/components/sections/HeroSection'
import SearchBar from '@/components/sections/SearchBar'
import ContactSection from '@/components/sections/ContactSection'
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

export default function HomePage() {
  const { t } = useLang()
  const { get } = useContenido()
  const [props, setProps] = useState<Propiedad[]>(SAMPLE_PROPS)

  useEffect(() => {
    supabase
      .from('propiedades')
      .select('*')
      .eq('destacada', true)
      .limit(6)
      .then(({ data }) => { if (data && data.length > 0) setProps(data) })
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
      {/* 1. Hero */}
      <HeroSection />

      {/* 2. Search bar */}
      <SearchBar />

      {/* 3. Propiedades destacadas */}
      <section className="px-4 lg:px-12 py-12 lg:py-24">
        <div className="mb-8 lg:mb-12">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="section-label" style={{ marginBottom: 12 }}>{t.sections.propiedades.label}</div>
              <h2 className="font-serif font-light" style={{ fontSize: 'clamp(32px,6vw,50px)', color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
                Oportunidades <em>en Chile</em>
              </h2>
              <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>
                {t.sections.propiedades.sub}
              </p>
            </div>
          </div>
          <Link to="/propiedades" className="btn-text mt-4 inline-flex">
            {t.sections.propiedades.verTodas}
          </Link>
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

      {/* 6. Internacional */}
      <section className="px-4 lg:px-12 py-12 lg:py-24" style={{ background: 'var(--off)' }}>
        {/* Header — centrado en mobile */}
        <div className="text-center lg:text-left mb-3 lg:mb-0">
          <div className="section-label justify-center lg:justify-start" style={{ marginBottom: 12 }}>
            {t.sections.internacional.label}
          </div>
          <h2 className="font-serif font-light" style={{ fontSize: 'clamp(36px,6vw,50px)', color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
            Explora el <em>mundo</em>
          </h2>
          <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', marginTop: 8, lineHeight: 1.8 }}>
            {t.sections.internacional.sub}
          </p>
        </div>

        {/* Ver todos — centrado debajo en mobile, a la derecha en desktop */}
        <div className="flex justify-center lg:justify-end mb-8 mt-4 lg:mt-0 lg:-mt-12">
          <Link to="/propiedades?internacional=true" className="btn-text">
            {t.sections.internacional.verTodos}
          </Link>
        </div>

        {/* Grid ciudades — 2 cols en mobile, layout original en desktop */}
        <div
          className="lg:grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {/* Mobile: 2 columnas simples */}
          <div className="lg:hidden contents">
            {CITIES.map(city => (
              <div key={city.name} className="relative overflow-hidden cursor-pointer rounded-sm" style={{ height: 140 }}>
                {cityImgs[city.key]
                  ? <img src={cityImgs[city.key]} alt={city.name} className="absolute inset-0 w-full h-full object-cover" />
                  : <div className="absolute inset-0" style={{ background: city.bg }} />
                }
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(10,20,30,.9) 0%,rgba(10,20,30,.1) 60%)' }} />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="font-serif font-light" style={{ fontSize: 18, color: '#fff', lineHeight: 1.1, marginBottom: 2 }}>{city.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 300, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(168,196,220,.85)' }}>{city.country}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: layout original con span */}
          <div
            className="hidden lg:grid"
            style={{
              gridColumn: '1 / -1',
              gridTemplateColumns: '1.6fr 1fr 1fr',
              gridTemplateRows: '230px 170px',
              gap: 1,
              background: 'var(--border)',
            }}
          >
            {CITIES.map(city => (
              <div
                key={city.name}
                className="relative overflow-hidden cursor-pointer group"
                style={{ gridRow: city.span2 ? 'span 2' : undefined }}
              >
                {cityImgs[city.key]
                  ? <img src={cityImgs[city.key]} alt={city.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                  : <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]" style={{ background: city.bg }} />
                }
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(10,20,30,.85) 0%,rgba(10,20,30,.08) 55%)' }} />
                <div className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[16px] rounded-full" style={{ border: '1px solid rgba(255,255,255,.22)', color: 'rgba(255,255,255,.55)' }}>↗</div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="font-serif font-light" style={{ fontSize: 22, color: '#fff', lineHeight: 1, marginBottom: 3 }}>{city.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(168,196,220,.85)' }}>
                    {city.country} · {city.count} {city.count !== '—' ? 'propiedades' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Testimonios */}
      <section className="px-8 lg:px-12 py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
          <div>
            <div className="section-label" style={{ marginBottom: 18 }}>{t.sections.testimonios.label}</div>
            <h2 className="font-serif font-light" style={{ fontSize: 40, color: 'var(--navy-dark)', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              Palabras de nuestros<br /><em>clientes</em>
            </h2>
            <div style={{ width: 40, height: 1, background: 'var(--green)', margin: '24px 0 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>
              {t.sections.testimonios.sub}
            </p>
          </div>
          <div className="lg:col-span-2 flex flex-col gap-11">
            {TESTIMONIALS.map(item => (
              <div key={item.num} className="grid gap-6 border-t pt-7" style={{ gridTemplateColumns: '56px 1fr', borderColor: 'var(--border)' }}>
                <div className="font-serif" style={{ fontSize: 44, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>{item.num}</div>
                <div>
                  <p className="font-serif italic font-light" style={{ fontSize: 17, color: 'var(--ink)', lineHeight: 1.7, marginBottom: 12 }}>
                    {item.quote}
                  </p>
                  <div style={{ fontSize: 13, fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {item.sig}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Contacto */}
      <ContactSection />
    </div>
  )
}
