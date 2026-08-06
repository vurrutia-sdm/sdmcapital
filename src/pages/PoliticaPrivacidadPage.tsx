import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'

const P = '48px'

// Respaldo: se usa si la fila 'politica-de-privacidad' aún no existe en
// Supabase o si la consulta falla, para no dejar la página en blanco.
const FALLBACK_ES = `
<p>En SDM Capital SpA ("SDM Capital", "nosotros") respetamos tu privacidad y nos comprometemos a proteger los datos personales que compartes con nosotros a través de nuestro sitio web sdmcapital.cl y de nuestros canales de contacto, incluido WhatsApp.</p>
<p>Esta política explica qué información recopilamos, cómo la usamos y qué derechos tienes sobre ella, en conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada de Chile y su normativa vigente.</p>
<h2>Información que recopilamos</h2>
<p>Podemos recopilar la información que nos entregas directamente, como tu nombre, correo electrónico, número de teléfono y los detalles de tu consulta, cuando completas un formulario de contacto, solicitas información sobre una propiedad, o nos escribes por WhatsApp u otros canales. Cuando nos contactas por WhatsApp, también podemos registrar el contenido de los mensajes que nos envías (de texto o de voz) con el fin de atender tu solicitud.</p>
<h2>Uso de un asistente automatizado</h2>
<p>Para atender consultas de manera más rápida y a cualquier hora, una parte de nuestra atención inicial por WhatsApp es gestionada por un asistente virtual automatizado. Este asistente recopila la información que nos compartes para orientar tu consulta y derivarla a un asesor de nuestro equipo cuando corresponde. En cualquier momento puedes solicitar ser atendido directamente por una persona de nuestro equipo.</p>
<h2>Cómo usamos tu información</h2>
<p>Usamos tus datos para responder tus consultas, ponerte en contacto con nuestro equipo de asesores, ofrecerte información sobre propiedades y servicios de tu interés, coordinar visitas, y mejorar la experiencia que ofrecemos. No vendemos tu información, ni la compartimos con terceros para fines de marketing sin tu consentimiento. Podemos compartir datos con proveedores de servicios que nos ayudan a operar (por ejemplo, plataformas de mensajería y de gestión de la información), los cuales solo pueden usarlos para prestarnos dichos servicios.</p>
<h2>Cómo protegemos tu información</h2>
<p>Adoptamos medidas razonables de seguridad para proteger tus datos personales contra accesos no autorizados, pérdida o uso indebido. El acceso a esta información está limitado a las personas de nuestro equipo que lo necesitan para atender tu solicitud.</p>
<h2>Conservación de los datos</h2>
<p>Conservamos tus datos personales solo durante el tiempo necesario para cumplir con las finalidades descritas en esta política, o mientras exista una relación comercial o de contacto contigo. Luego, pueden ser eliminados o anonimizados.</p>
<h2>Tus derechos</h2>
<p>De acuerdo con la legislación chilena, puedes solicitarnos en cualquier momento el acceso, la rectificación (corrección), la cancelación (eliminación) o la oposición al uso de tus datos personales. Para ejercer estos derechos, escríbenos a través de nuestros canales de contacto disponibles en el sitio y atenderemos tu solicitud.</p>
<h2>Cambios a esta política</h2>
<p>Podemos actualizar esta política de privacidad ocasionalmente. La versión vigente siempre estará disponible en nuestro sitio web, con su fecha de última actualización.</p>
<h2>Contacto</h2>
<p>Si tienes preguntas sobre esta política o sobre cómo tratamos tus datos, contáctanos a través de los medios indicados en nuestro sitio web sdmcapital.cl.</p>
<p>Última actualización: junio de 2026.</p>
`

export default function PoliticaPrivacidadPage() {
  const { lang } = useLang()
  const sp = { paddingLeft: `clamp(16px, 5vw, ${P})`, paddingRight: `clamp(16px, 5vw, ${P})` }

  const [contenido, setContenido] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('paginas_legales').select('contenido').eq('slug', 'politica-de-privacidad').maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.contenido) setContenido(data.contenido)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      <SEO
        title={lang === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
        description={lang === 'es'
          ? 'Política de privacidad de SDM Capital: cómo recopilamos, usamos y protegemos tus datos personales.'
          : 'SDM Capital privacy policy: how we collect, use and protect your personal data.'}
        url="/politica-de-privacidad"
      />

      <div style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--navy-dark)', borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Legal' : 'Legal'}
        </div>
        <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, maxWidth: 700 }}>
          {lang === 'es' ? 'Política de ' : 'Privacy '}<em>{lang === 'es' ? 'Privacidad' : 'Policy'}</em>
        </h1>
      </div>

      <div style={{ ...sp, paddingTop: 64, paddingBottom: 96, maxWidth: 760, margin: '0 auto' }}>
        {lang === 'es' ? (
          loading ? (
            <p className="text-sdm-base" style={{ color: 'var(--muted)' }}>Cargando…</p>
          ) : (
            <div
              className="prose-sdm text-sdm-lg"
              style={{ color: 'var(--muted)', lineHeight: 1.9 }}
              dangerouslySetInnerHTML={{ __html: contenido || FALLBACK_ES }}
            />
          )
        ) : (
          <div className="text-sdm-lg" style={{ color: 'var(--muted)', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 24 }}>
              At SDM Capital ("we") we respect your privacy and are committed to protecting the personal data you share with us through our website sdmcapital.cl and our contact channels.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Information we collect
            </h2>
            <p style={{ marginBottom: 24 }}>
              We may collect information you provide directly, such as your name, email address, phone number and the details of your inquiry, when you fill out a contact form, request information about a property, or message us via WhatsApp or other channels.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              How we use your information
            </h2>
            <p style={{ marginBottom: 24 }}>
              We use your data to respond to your inquiries, connect you with our advisory team, provide information about properties and services you may be interested in, and improve the experience we offer on our site. We do not sell or share your information with third parties for marketing purposes without your consent.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              How we protect your information
            </h2>
            <p style={{ marginBottom: 24 }}>
              We take reasonable measures to protect your personal data against unauthorized access, loss or misuse. Access to this information is limited to members of our team who need it to handle your request.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Your rights
            </h2>
            <p style={{ marginBottom: 24 }}>
              You may request access to, correction of, or deletion of your personal data at any time by contacting us through the channels available on our website.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Contact
            </h2>
            <p style={{ marginBottom: 24 }}>
              If you have questions about this privacy policy or how we handle your data, contact us through the channels listed on our website sdmcapital.cl.
            </p>

            <p className="text-sdm-base" style={{ color: 'var(--border)', marginTop: 48 }}>
              Last updated: June 2026.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
