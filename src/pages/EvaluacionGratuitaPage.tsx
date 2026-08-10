import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import SEO from '@/components/SEO'
import SolicitudCreditoForm from '@/components/credito/SolicitudCreditoForm'

// El sexto decía «Honorarios solo al éxito de la gestión», y afirmaba lo
// contrario de la política: la gestión del crédito NO se cobra cuando el
// cliente compra su propiedad con SDM. «Al éxito de la gestión» describe justo
// el caso en que no se cobra —el crédito conseguido— y lo daba por cobrado.
//
// Iba listado como beneficio y con un check verde, en la página que capta las
// solicitudes. Era la peor de las tres superficies que declaraban honorarios.
//
// LA GRATUIDAD ES DE LA GESTIÓN CREDITICIA, NO DE LA COMPRA: las fichas de
// propiedad muestran «Comisión corredora 2 %», que es otra cosa. De ahí que
// diga «la gestión» y no «comprar con SDM».
const BENEFICIOS = [
  'Sin cobros anticipados',
  '+20 años de experiencia bancaria',
  'Gestionamos ante múltiples bancos',
  'Acompañamiento hasta la escritura',
  'Resultado en aprox. 5 días hábiles',
  'La gestión no tiene costo si compras con SDM',
]

export default function EvaluacionGratuitaPage() {
  return (
    <div className="sitio-publico min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <SEO
        title="Evaluación Hipotecaria Gratuita"
        description="Solicita tu preevaluación hipotecaria sin costo. Resultado en 5 días hábiles. Sin pagos anticipados."
        url="/evaluacion-gratuita"
      />

      {/* Header mínimo — solo logo, sin navegación */}
      <header className="flex items-center justify-center" style={{ padding: '20px 24px', backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border)' }}>
        <Link to="/" title="Volver al sitio SDM Capital" className="flex items-center gap-3.5">
          <div className="logo-stripes">
            <div className="logo-stripe logo-stripe--sky" />
            <div className="logo-stripe logo-stripe--green" />
            <div className="logo-stripe logo-stripe--navy" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[22px] font-semibold tracking-[3px]" style={{ color: 'var(--navy-dark)' }}>SDM</span>
            <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2, display: 'block' }}>Capital</span>
          </div>
        </Link>
      </header>

      {/* Hero persuasivo */}
      <section style={{ backgroundColor: '#1C2B3A', padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,48px)' }}>
        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          <div className="section-label section-label--light" style={{ marginBottom: 20, justifyContent: 'center' }}>
            Preevaluación Hipotecaria Sin Costo
          </div>
          <h1 className="font-serif font-light text-center tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.15, color: '#FFFFFF', maxWidth: 760, margin: '0 auto 20px' }}>
            ¿Quieres saber si calificas para un crédito hipotecario?
          </h1>
          <p className="text-center text-sdm-lg" style={{ fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.78)', maxWidth: 620, margin: '0 auto 48px' }}>
            Te hacemos una evaluación gratuita en 5 días hábiles. Sin papeleos innecesarios, sin pagos
            anticipados, con acompañamiento de principio a fin.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFICIOS.map(b => (
              <div key={b} className="flex items-start gap-3">
                <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', background: 'rgba(61,170,110,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
                  <Check size={13} color="#3DAA6E" />
                </div>
                <span className="text-sdm-base" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section style={{ backgroundColor: 'var(--off)', padding: 'clamp(48px,8vw,96px) clamp(20px,5vw,48px)' }}>
        <div
          style={{
            maxWidth: 680, margin: '0 auto', backgroundColor: '#FFFFFF',
            borderRadius: 4, boxShadow: '0 12px 40px rgba(15,37,53,0.08)',
            padding: 'clamp(28px,6vw,56px)',
          }}
        >
          <SolicitudCreditoForm
            title="Solicita tu evaluación gratuita"
            subtitle="Completa el formulario y Roberto te contactará a la brevedad."
            successTitle="¡Solicitud recibida!"
            successMessage="Roberto revisará tu caso y te contactará por WhatsApp a la brevedad. El resultado de tu preevaluación estará listo en aprox. 5 días hábiles."
          />
        </div>
      </section>

      {/* Footer mínimo */}
      <footer style={{ backgroundColor: '#1C2B3A', padding: '24px 24px', textAlign: 'center' }}>
        <p className="text-sdm-sm" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}>
          © 2026 SDM Capital SpA · sdmcapital.cl ·{' '}
          <Link to="/politica-de-privacidad" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}>
            Política de Privacidad
          </Link>
        </p>
      </footer>
    </div>
  )
}
