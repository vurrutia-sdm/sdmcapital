import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'

const SERVICIOS = [
  {
    slug: 'inversion-internacional',
    n: '01',
    titulo: 'Inversión Internacional',
    desc: 'Accede a oportunidades inmobiliarias en EE.UU., España, República Dominicana, Uruguay y más. Te acompañamos en cada paso del proceso de inversión en el extranjero.',
    paises: ['Estados Unidos', 'España', 'Rep. Dominicana', 'Uruguay'],
  },
  {
    slug: 'inversion-chile',
    n: '02',
    titulo: 'Inversión en Chile',
    desc: 'Casas, departamentos, oficinas, parcelas y proyectos comerciales en todo Chile. Asesoría integral desde la búsqueda hasta la escritura.',
    paises: ['R. Metropolitana', 'Valparaíso', 'Coquimbo', 'Los Lagos'],
  },
  {
    slug: 'financiamiento-personas',
    n: '03',
    titulo: 'Financiamiento Personas',
    desc: 'Gestión de crédito hipotecario y consumo para personas naturales. Sin pagos adelantados. Te ayudamos a encontrar el financiamiento que se adapta a tu situación.',
    paises: ['Chile', 'Internacional'],
  },
  {
    slug: 'financiamiento-empresas',
    n: '04',
    titulo: 'Financiamiento Empresas',
    desc: 'Soluciones de financiamiento corporativo y leasing inmobiliario para empresas de todos los tamaños. Estructuramos el financiamiento que tu empresa necesita.',
    paises: ['Chile', 'Internacional'],
  },
  {
    slug: 'bancarizacion-extranjero',
    n: '05',
    titulo: 'Bancarización en el Extranjero',
    desc: 'Te ayudamos a abrir cuentas bancarias y acceder a servicios financieros en el extranjero. Indispensable para quienes buscan invertir o establecerse fuera de Chile.',
    paises: ['EE.UU.', 'España', 'Uruguay', 'Rep. Dominicana'],
  },
]

const scrollToContact = () => {
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
}

export default function ServiciosPage() {
  const { slug } = useParams<{ slug?: string }>()
  const { get } = useContenido()

  const SERVICE_IMAGES: Record<string, string> = {
    'inversion-internacional': get('servicio_inv_int_imagen', ''),
    'inversion-chile':         get('servicio_inv_cl_imagen',  ''),
    'financiamiento-personas': get('servicio_fin_per_imagen', ''),
    'financiamiento-empresas': get('servicio_fin_emp_imagen', ''),
    'bancarizacion-extranjero':get('servicio_banco_imagen',   ''),
  }

  // Si viene con slug desde el menú, hace scroll al servicio correspondiente
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
        <div className="section-label section-label--light" style={{ marginBottom: 18 }}>
          Lo que hacemos
        </div>
        <h1 className="font-serif font-light" style={{ fontSize: 'clamp(40px,5vw,64px)', color: '#fff', lineHeight: 1.07, letterSpacing: '-0.5px' }}>
          Nuestros <em>servicios</em>
        </h1>
        <p className="font-light mt-5" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.9, maxWidth: 480 }}>
          Soluciones integrales en inversión inmobiliaria y financiamiento, tanto en Chile como en el extranjero.
        </p>
      </div>

      {/* Services list — cada sección tiene su ID para el scroll */}
      <div>
        {SERVICIOS.map((s, i) => (
          <div
            key={s.slug}
            id={s.slug}
            className="grid grid-cols-1 lg:grid-cols-2 gap-px border-b border-[#e8edf2]"
            style={{ background: 'var(--border)', scrollMarginTop: 80 }}
          >
            {/* Text side */}
            <div className={`bg-white px-8 lg:px-14 py-14 ${i % 2 !== 0 ? 'lg:order-2' : ''}`}>
              <div className="font-serif mb-5" style={{ fontSize: 44, fontWeight: 300, color: 'var(--border)', lineHeight: 1 }}>{s.n}</div>
              <div style={{ width: 28, height: 2, background: 'var(--green)', marginBottom: 16 }} />
              <h2 className="font-serif font-light mb-4" style={{ fontSize: 36, color: 'var(--navy-dark)', lineHeight: 1.15, letterSpacing: '-0.3px' }}>
                {s.titulo}
              </h2>
              <p className="font-light mb-8" style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 420 }}>
                {s.desc}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {s.paises.map(p => (
                  <span key={p} className="px-3 py-1.5 text-[13px] tracking-[1.5px] uppercase border" style={{ borderColor: 'var(--border)', color: 'var(--muted)', borderRadius: 1 }}>
                    {p}
                  </span>
                ))}
              </div>

              {/* Más información → scroll al formulario de contacto */}
              <button onClick={scrollToContact} className="btn-primary inline-flex">
                Más información →
              </button>
            </div>

            <div
              className={`flex items-center justify-center overflow-hidden ${i % 2 !== 0 ? 'lg:order-1' : ''}`}
              style={{ minHeight: 340, background: `linear-gradient(160deg,${['#1a3d5c','#1a3528','#252535','#351a1a','#2a1a35'][i]},#0d2035)` }}
            >
              {SERVICE_IMAGES[s.slug]
                ? <img src={SERVICE_IMAGES[s.slug]} alt={s.titulo} className="w-full h-full object-cover" style={{ minHeight: 340 }} />
                : <span className="font-serif italic" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }}>{s.titulo}</span>
              }
            </div>
          </div>
        ))}
      </div>

      <ContactSection />
    </div>
  )
}
