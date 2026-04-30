import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'
import type { MiembroEquipo } from '@/types'

const SAMPLE_EQUIPO: MiembroEquipo[] = [
  { id:'1', nombre:'Sebastián Díaz', cargo:'Director General', cargo_en:'CEO', bio:'Más de 15 años de experiencia en inversión inmobiliaria en Chile y mercados internacionales. Especialista en estructuración de negocios y financiamiento.', bio_en:'Over 15 years of experience in real estate investment in Chile and international markets.', orden:1, activo:true },
  { id:'2', nombre:'Marcela Rodríguez', cargo:'Directora Comercial', cargo_en:'Commercial Director', bio:'Experta en desarrollo de negocios y relaciones con clientes. Lidera el área de captación y gestión de propiedades a nivel nacional.', bio_en:'Expert in business development and client relations.', orden:2, activo:true },
  { id:'3', nombre:'Andrés Morales', cargo:'Jefe de Inversiones', cargo_en:'Head of Investments', bio:'Especialista en análisis de mercado y valoración de activos inmobiliarios. Más de 10 años asesorando a inversionistas nacionales e internacionales.', bio_en:'Specialist in market analysis and real estate asset valuation.', orden:3, activo:true },
]

const VALORES = [
  { n:'01', titulo:'Transparencia', desc:'Operamos con total transparencia en cada transacción. Sin costos ocultos, sin pagos adelantados.' },
  { n:'02', titulo:'Experiencia',   desc:'Más de 15 años en el mercado nos respaldan. Conocemos el mercado chileno e internacional en profundidad.' },
  { n:'03', titulo:'Compromiso',    desc:'Cada cliente es único. Nos comprometemos a encontrar la mejor solución para cada persona y empresa.' },
  { n:'04', titulo:'Red Global',    desc:'Presencia en más de 10 países. Acceso a oportunidades inmobiliarias que otros no pueden ofrecer.' },
]

export default function QuienesSomosPage() {
  const { lang } = useLang()
  const { get } = useContenido()
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(SAMPLE_EQUIPO)

  useEffect(() => {
    supabase.from('equipo').select('*').eq('activo', true).order('orden')
      .then(({ data }) => { if (data && data.length > 0) setEquipo(data) })
  }, [])

  const historiaImg = get('quienes_imagen_historia', '')

  return (
    <div>
      {/* Hero band */}
      <div
        className="px-8 lg:px-12 py-24 border-b border-[#e8edf2]"
        style={{ background: 'var(--navy-dark)' }}
      >
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Quiénes Somos' : 'About Us'}
        </div>
        <h1
          className="font-serif font-light"
          style={{ fontSize: 'clamp(42px,5vw,68px)', color: '#fff', lineHeight: 1.07, letterSpacing: '-0.5px', maxWidth: 700 }}
        >
          Tu socio estratégico en<br /><em>bienes raíces</em>
        </h1>
        <p
          className="font-light mt-6 border-l-2 pl-4"
          style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, borderColor: 'var(--green)', maxWidth: 520 }}
        >
          {lang === 'es'
            ? 'SDM Capital es una empresa chilena especializada en inversión inmobiliaria y gestión de financiamiento, con más de 15 años conectando personas con oportunidades únicas en Chile y el extranjero.'
            : 'SDM Capital is a Chilean company specializing in real estate investment and financial management, with over 15 years connecting people with unique opportunities in Chile and abroad.'
          }
        </p>
      </div>

      {/* Valores */}
      <section className="px-8 lg:px-12 py-20 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Nuestros valores' : 'Our values'}
        </div>
        <h2 className="font-serif font-light mb-16" style={{ fontSize: 48, color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
          Lo que nos <em>define</em>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: 'var(--border)' }}>
          {VALORES.map(v => (
            <div key={v.n} className="bg-white p-8 lg:p-10">
              <div className="font-serif mb-6" style={{ fontSize: 44, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>{v.n}</div>
              <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
              <h3 className="font-serif font-light mb-3" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{v.titulo}</h3>
              <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Historia */}
      <section className="px-8 lg:px-12 py-20 border-b border-[#e8edf2]" style={{ background: 'var(--off)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <div className="section-label" style={{ marginBottom: 20 }}>{lang === 'es' ? 'Nuestra historia' : 'Our story'}</div>
            <h2 className="font-serif font-light mb-8" style={{ fontSize: 44, color: 'var(--navy-dark)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
              15 años construyendo <em>confianza</em>
            </h2>
            {[
              'SDM Capital nació con una visión clara: democratizar el acceso a inversiones inmobiliarias de calidad para personas y empresas en Chile.',
              'A lo largo de más de 15 años, hemos construido una red de socios y alianzas estratégicas que nos permite ofrecer oportunidades únicas en Chile y en más de 10 países del mundo.',
              'Hoy somos referentes en gestión de financiamiento y asesoría inmobiliaria, con un equipo de expertos comprometidos con los resultados de cada cliente.',
            ].map((p, i) => (
              <p key={i} className="font-light mb-5" style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9 }}>{p}</p>
            ))}
          </div>
          <div
            className="flex items-center justify-center overflow-hidden"
            style={{ height: 440, background: 'linear-gradient(160deg,#1a3d5c,#0d2035)', borderRadius: 2 }}
          >
            {historiaImg
              ? <img src={historiaImg} alt="Equipo SDM Capital" className="w-full h-full object-cover" style={{ borderRadius: 2 }} />
              : <span className="font-serif italic" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>Fotografía oficina / equipo</span>
            }
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="px-8 lg:px-12 py-20">
        <div className="section-label" style={{ marginBottom: 20 }}>El equipo</div>
        <h2 className="font-serif font-light mb-16" style={{ fontSize: 48, color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
          Las personas <em>detrás</em>
        </h2>
        {/* Grid adaptable: 1 col mobile, 2 col si hay 2, 3 col si hay 3+ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(equipo.length, 3)}, 1fr)`,
            gap: 1,
            background: 'var(--border)',
          }}
        >
          {equipo.map(m => {
            const cargo = m.cargo
            const bio   = m.bio
            return (
              <div key={m.id} className="bg-white group">
                {/* Photo — altura fija, foto completa sin cortar */}
                <div
                  className="overflow-hidden flex items-center justify-center"
                  style={{ height: 380, background: '#f0f4f7' }}
                >
                  {m.foto
                    ? <img
                        src={m.foto}
                        alt={m.nombre}
                        className="h-full w-full transition-transform duration-500 group-hover:scale-[1.02]"
                        style={{ objectFit: 'contain', objectPosition: 'center center' }}
                      />
                    : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#1a3d5c,#0d2535)' }}>
                        <div className="font-serif text-5xl font-light" style={{ color: 'rgba(168,196,220,0.4)', letterSpacing: '4px' }}>
                          {m.nombre.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                      </div>
                    )
                  }
                </div>
                <div className="p-7">
                  <h3 className="font-serif font-light mb-1" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{m.nombre}</h3>
                  <div style={{ fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 12 }}>{cargo}</div>
                  <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>{bio}</p>
                  {m.linkedin && (
                    <a href={m.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-4 text-[13px] tracking-[1.5px] uppercase border-b pb-0.5"
                      style={{ color: 'var(--navy)', borderColor: 'var(--navy)', textDecoration: 'none' }}
                    >
                      LinkedIn ↗
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <ContactSection />
    </div>
  )
}
