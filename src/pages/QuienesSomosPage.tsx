import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'
import type { MiembroEquipo } from '@/types'

const SAMPLE_EQUIPO: MiembroEquipo[] = [
  { id:'1', nombre:'Sebastián Díaz', cargo:'Director General', cargo_en:'CEO', bio:'Más de 15 años de experiencia en inversión inmobiliaria en Chile y mercados internacionales.', bio_en:'Over 15 years of experience in real estate investment in Chile and international markets.', orden:1, activo:true },
  { id:'2', nombre:'Marcela Rodríguez', cargo:'Directora Comercial', cargo_en:'Commercial Director', bio:'Experta en desarrollo de negocios y relaciones con clientes.', bio_en:'Expert in business development and client relations.', orden:2, activo:true },
  { id:'3', nombre:'Andrés Morales', cargo:'Jefe de Inversiones', cargo_en:'Head of Investments', bio:'Especialista en análisis de mercado y valoración de activos inmobiliarios.', bio_en:'Specialist in market analysis and real estate asset valuation.', orden:3, activo:true },
]

const VALORES = [
  { n:'01', titulo:'Transparencia', desc:'Operamos con total transparencia en cada transacción. Sin costos ocultos, sin pagos adelantados.' },
  { n:'02', titulo:'Experiencia',   desc:'Más de 15 años en el mercado nos respaldan. Conocemos el mercado chileno e internacional en profundidad.' },
  { n:'03', titulo:'Compromiso',    desc:'Cada cliente es único. Nos comprometemos a encontrar la mejor solución para cada persona y empresa.' },
  { n:'04', titulo:'Red Global',    desc:'Presencia en más de 10 países. Acceso a oportunidades inmobiliarias que otros no pueden ofrecer.' },
]

const P = '48px' // padding lateral desktop
const PM = '16px' // padding lateral mobile — usamos CSS variable trick

export default function QuienesSomosPage() {
  const { lang } = useLang()
  const { get } = useContenido()
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(SAMPLE_EQUIPO)

  useEffect(() => {
    supabase.from('equipo').select('*').eq('activo', true).order('orden')
      .then(({ data }) => { if (data && data.length > 0) setEquipo(data) })
  }, [])

  const historiaImg = get('quienes_imagen_historia', '')

  // Padding responsivo sin clases Tailwind
  const sp = { paddingLeft: `clamp(16px, 5vw, ${P})`, paddingRight: `clamp(16px, 5vw, ${P})` }

  return (
    <div className="min-h-screen">
      <SEO title="Quiénes Somos" description="SDM Capital — Más de 15 años conectando personas con oportunidades inmobiliarias. Conoce nuestro equipo de expertos en bienes raíces y financiamiento." url="/quienes-somos" />

      {/* Hero band */}
      <div style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--navy-dark)', borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Quiénes Somos' : 'About Us'}
        </div>
        <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,5vw,68px)', color: '#fff', lineHeight: 1.07, maxWidth: 700 }}>
          Tu socio estratégico en<br /><em>bienes raíces</em>
        </h1>
        <p className="font-light mt-6 border-l-2 pl-4 text-sdm-lg" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, borderColor: 'var(--green)', maxWidth: 520 }}>
          {lang === 'es'
            ? 'SDM Capital es una empresa chilena especializada en inversión inmobiliaria y gestión de financiamiento, con más de 15 años conectando personas con oportunidades únicas en Chile y el extranjero.'
            : 'SDM Capital is a Chilean company specializing in real estate investment and financial management, with over 15 years connecting people with unique opportunities in Chile and abroad.'
          }
        </p>
      </div>

      {/* Valores */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Nuestros valores' : 'Our values'}
        </div>
        <h2 className="font-serif font-light mb-16 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
          Lo que nos <em>define</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
          {VALORES.map(v => (
            <div key={v.n} className="bg-white p-8 lg:p-10">
              <div className="font-serif mb-6 text-sdm-display-md" style={{ fontWeight: 300, color: 'var(--border)' }}>{v.n}</div>
              <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
              <h3 className="font-serif font-light mb-3 text-sdm-2xl" style={{ color: 'var(--navy-dark)' }}>{v.titulo}</h3>
              <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderBottom: '1px solid #e8edf2', background: 'var(--off)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <div className="section-label" style={{ marginBottom: 20 }}>{lang === 'es' ? 'Nuestra historia' : 'Our story'}</div>
            <h2 className="font-serif font-light mb-8 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,44px)', color: 'var(--navy-dark)', lineHeight: 1.1 }}>
              15 años construyendo <em>confianza</em>
            </h2>
            {[
              'SDM Capital nació con una visión clara: democratizar el acceso a inversiones inmobiliarias de calidad para personas y empresas en Chile.',
              'A lo largo de más de 15 años, hemos construido una red de socios y alianzas estratégicas que nos permite ofrecer oportunidades únicas en Chile y en más de 10 países del mundo.',
              'Hoy somos referentes en gestión de financiamiento y asesoría inmobiliaria, con un equipo de expertos comprometidos con los resultados de cada cliente.',
            ].map((p, i) => (
              <p key={i} className="font-light mb-5 text-sdm-lg" style={{ color: 'var(--muted)', lineHeight: 1.9 }}>{p}</p>
            ))}
          </div>
          <div className="flex items-center justify-center overflow-hidden" style={{ height: 440, background: 'linear-gradient(160deg,#1a3d5c,#0d2035)', borderRadius: 2 }}>
            {historiaImg
              ? <img src={historiaImg} alt="Equipo SDM Capital" className="w-full h-full object-cover" style={{ borderRadius: 2 }} />
              : <span className="font-serif italic text-sdm-lg" style={{ color: 'rgba(255,255,255,0.2)' }}>Fotografía oficina / equipo</span>
            }
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80 }}>
        <div className="section-label" style={{ marginBottom: 20 }}>El equipo</div>
        <h2 className="font-serif font-light mb-16 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
          Las personas <em>detrás</em>
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(equipo.length, 3)}, 1fr)`, gap: 1, background: 'var(--border)' }}>
          {equipo.map(m => {
            const cargo = m.cargo
            const bio   = m.bio
            return (
              <div key={m.id} className="bg-white group">
                <div style={{ height: 'clamp(240px, 40vw, 400px)', background: '#f4f6f8', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' }}>
                  {m.foto
                    ? <img src={m.foto} alt={m.nombre} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }} />
                    : <div className="flex items-center justify-center w-full h-full" style={{ background: 'linear-gradient(160deg,#1a3d5c,#0d2035)' }}>
                        <span className="font-serif text-white opacity-20 italic text-sdm-base">{m.nombre}</span>
                      </div>
                  }
                </div>
                <div className="p-6 lg:p-8">
                  <h3 className="font-serif font-light mb-1 text-sdm-2xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.1 }}>{m.nombre}</h3>
                  <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--green)', marginBottom: 12 }}>{cargo}</div>
                  {bio && (
                    <div style={{ marginBottom: 20 }}>
                      {bio.split('\n').filter(Boolean).map((parrafo, i) => (
                        <p className="text-sdm-base" key={i} style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 10 }}>
                          {parrafo}
                        </p>
                      ))}
                    </div>
                  )}
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 mr-4 text-[13px] tracking-[1.5px] uppercase border-b pb-0.5"
                      style={{ color: 'var(--navy)', borderColor: 'var(--navy)', textDecoration: 'none' }}
                    >LinkedIn ↗</a>
                  )}
                  {m.whatsapp && (
                    <a href={`https://wa.me/${m.whatsapp}?text=Hola ${m.nombre}, me contacto desde SDM Capital`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-sm text-sdm-sm tracking-sdm-wide"
                      style={{ background: '#25D366', color: '#fff', textDecoration: 'none', fontWeight: 600, textTransform: 'uppercase' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section style={{ paddingLeft: 'clamp(16px, 5vw, 48px)', paddingRight: 'clamp(16px, 5vw, 48px)', paddingTop: 80, paddingBottom: 80, borderTop: '1px solid #e8edf2' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Red de Asociados</div>
        <h2 className="font-serif font-light mb-6 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
          Nuestros <em>asociados</em>
        </h2>
        <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560, marginBottom: 40 }}>
          Trabajamos con una red de socios estratégicos en Chile y el extranjero para ofrecer las mejores oportunidades a nuestros clientes.
        </p>
        <a className="text-sdm-xs tracking-sdm-wide border border-[var(--navy-dark)] text-[var(--navy-dark)] bg-transparent hover:bg-[var(--navy-dark)] hover:text-white" href="/asociados" style={{ display: 'inline-block', fontWeight: 400, textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', borderRadius: 2, transition: 'all 0.2s' }}
        >Ver todos los asociados</a>
      </section>

      <ContactSection />
    </div>
  )
}
