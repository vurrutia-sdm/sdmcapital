import { useEffect, useState } from 'react'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import ContactSection from '@/components/sections/ContactSection'
import type { Asociado } from '@/types'

const SAMPLE_ASOCIADOS: Asociado[] = [
  { id:'1', nombre:'Portal Inmobiliario', logo:'', url:'https://portalinmobiliario.com', descripcion:'El mayor portal de propiedades de Chile.', orden:1, activo:true },
  { id:'2', nombre:'Banco BCI',           logo:'', url:'https://bci.cl',                descripcion:'Financiamiento hipotecario de primer nivel.', orden:2, activo:true },
  { id:'3', nombre:'Banco Santander',     logo:'', url:'https://santander.cl',          descripcion:'Soluciones crediticias para personas y empresas.', orden:3, activo:true },
  { id:'4', nombre:'Notaría Santiago',    logo:'', url:'#',                             descripcion:'Tramitación notarial rápida y segura.', orden:4, activo:true },
  { id:'5', nombre:'CBRE Chile',          logo:'', url:'https://cbre.com',              descripcion:'Consultoría inmobiliaria internacional.', orden:5, activo:true },
  { id:'6', nombre:'Century 21 Chile',    logo:'', url:'https://century21.cl',          descripcion:'Red inmobiliaria global con presencia local.', orden:6, activo:true },
]

export default function AsociadosPage() {
  const { lang } = useLang()
  const [asociados, setAsociados] = useState<Asociado[]>(SAMPLE_ASOCIADOS)

  useEffect(() => {
    supabase.from('asociados').select('*').eq('activo', true).order('orden')
      .then(({ data }) => { if (data && data.length > 0) setAsociados(data) })
  }, [])

  return (
    <div>
      {/* Header */}
      <div className="px-8 lg:px-12 pt-14 pb-12 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 18 }}>
          {lang === 'es' ? 'Red de socios' : 'Partner network'}
        </div>
        <h1 className="font-serif font-light" style={{ fontSize: 'clamp(40px,5vw,64px)', color: 'var(--navy-dark)', lineHeight: 1.07, letterSpacing: '-0.5px' }}>
          Nuestros <em>asociados</em>
        </h1>
        <p className="font-light mt-5" style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560 }}>
          {lang === 'es'
            ? 'Trabajamos con una red selecta de socios estratégicos que nos permiten ofrecer a nuestros clientes el mejor servicio integral en cada etapa del proceso inmobiliario y financiero.'
            : 'We work with a select network of strategic partners that allow us to offer our clients the best comprehensive service at every stage of the real estate and financial process.'
          }
        </p>
      </div>

      {/* Texto editorial */}
      <section className="px-8 lg:px-12 py-16 border-b border-[#e8edf2]" style={{ background: 'var(--off)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            <h3 className="font-serif font-light mb-4" style={{ fontSize: 24, color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Alianzas <em>estratégicas</em>
            </h3>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
              {lang === 'es'
                ? 'Cada asociado ha sido seleccionado por su trayectoria, seriedad y compromiso con la excelencia en el servicio.'
                : 'Each partner has been selected for their track record, seriousness and commitment to service excellence.'
              }
            </p>
          </div>
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            <h3 className="font-serif font-light mb-4" style={{ fontSize: 24, color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Red <em>global</em>
            </h3>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
              {lang === 'es'
                ? 'Nuestra red abarca instituciones financieras, portales inmobiliarios, notarías y consultoras en Chile y el extranjero.'
                : 'Our network spans financial institutions, real estate portals, notaries and consultancies in Chile and abroad.'
              }
            </p>
          </div>
          <div>
            <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
            <h3 className="font-serif font-light mb-4" style={{ fontSize: 24, color: 'var(--navy-dark)', lineHeight: 1.25 }}>
              Servicio <em>integral</em>
            </h3>
            <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.85 }}>
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
        {/* Centrado automático: justify-center evita celdas vacías grises */}
        <div className="flex flex-wrap justify-center gap-px" style={{ background: 'var(--border)' }}>
          {asociados.map(a => (
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
                  <div className="font-serif font-light mb-2" style={{ fontSize: 18, color: 'var(--navy-dark)', letterSpacing: '1px' }}>
                    {a.nombre}
                  </div>
                  <div style={{ width: 28, height: 1, background: 'var(--green)', margin: '0 auto 8px' }} />
                </div>
              )}
              {a.descripcion && (
                <p className="text-center mt-3" style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)', letterSpacing: '0.5px', lineHeight: 1.6 }}>
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
          <h3 className="font-serif font-light mb-4" style={{ fontSize: 32, color: 'var(--navy-dark)' }}>
            Únete a nuestra <em>red</em>
          </h3>
          <p style={{ fontSize: 16, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
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
