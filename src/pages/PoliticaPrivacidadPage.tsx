import SEO from '@/components/SEO'
import { useLang } from '@/hooks/useLang'

const P = '48px'

export default function PoliticaPrivacidadPage() {
  const { lang } = useLang()
  const sp = { paddingLeft: `clamp(16px, 5vw, ${P})`, paddingRight: `clamp(16px, 5vw, ${P})` }

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
        <h1 className="font-serif font-light" style={{ fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px', maxWidth: 700 }}>
          {lang === 'es' ? 'Política de ' : 'Privacy '}<em>{lang === 'es' ? 'Privacidad' : 'Policy'}</em>
        </h1>
      </div>

      <div style={{ ...sp, paddingTop: 64, paddingBottom: 96, maxWidth: 760, margin: '0 auto' }}>
        {lang === 'es' ? (
          <div style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 24 }}>
              En SDM Capital ("nosotros") respetamos tu privacidad y nos comprometemos a proteger los datos personales que nos compartes a través de nuestro sitio web sdmcapital.cl y nuestros canales de contacto.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Información que recopilamos
            </h2>
            <p style={{ marginBottom: 24 }}>
              Podemos recopilar información que tú nos entregas directamente, como tu nombre, correo electrónico, número de teléfono y los detalles de tu consulta, cuando completas un formulario de contacto, solicitas información sobre una propiedad o nos escribes por WhatsApp u otros canales.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Cómo usamos tu información
            </h2>
            <p style={{ marginBottom: 24 }}>
              Usamos tus datos para responder tus consultas, ponerte en contacto con nuestro equipo de asesores, ofrecerte información sobre propiedades y servicios de tu interés, y mejorar la experiencia que ofrecemos en nuestro sitio. No vendemos ni compartimos tu información con terceros para fines de marketing sin tu consentimiento.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Cómo protegemos tu información
            </h2>
            <p style={{ marginBottom: 24 }}>
              Adoptamos medidas razonables para proteger tus datos personales contra accesos no autorizados, pérdida o uso indebido. El acceso a esta información está limitado a las personas de nuestro equipo que lo necesitan para atender tu solicitud.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Tus derechos
            </h2>
            <p style={{ marginBottom: 24 }}>
              Puedes solicitarnos en cualquier momento el acceso, la corrección o la eliminación de tus datos personales, escribiéndonos a través de nuestros canales de contacto disponibles en el sitio.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Contacto
            </h2>
            <p style={{ marginBottom: 24 }}>
              Si tienes preguntas sobre esta política de privacidad o sobre cómo tratamos tus datos, contáctanos a través de los medios indicados en nuestro sitio web sdmcapital.cl.
            </p>

            <p style={{ fontSize: 14, color: 'var(--border)', marginTop: 48 }}>
              Última actualización: junio de 2026.
            </p>
          </div>
        ) : (
          <div style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 24 }}>
              At SDM Capital ("we") we respect your privacy and are committed to protecting the personal data you share with us through our website sdmcapital.cl and our contact channels.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Information we collect
            </h2>
            <p style={{ marginBottom: 24 }}>
              We may collect information you provide directly, such as your name, email address, phone number and the details of your inquiry, when you fill out a contact form, request information about a property, or message us via WhatsApp or other channels.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              How we use your information
            </h2>
            <p style={{ marginBottom: 24 }}>
              We use your data to respond to your inquiries, connect you with our advisory team, provide information about properties and services you may be interested in, and improve the experience we offer on our site. We do not sell or share your information with third parties for marketing purposes without your consent.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              How we protect your information
            </h2>
            <p style={{ marginBottom: 24 }}>
              We take reasonable measures to protect your personal data against unauthorized access, loss or misuse. Access to this information is limited to members of our team who need it to handle your request.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Your rights
            </h2>
            <p style={{ marginBottom: 24 }}>
              You may request access to, correction of, or deletion of your personal data at any time by contacting us through the channels available on our website.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Contact
            </h2>
            <p style={{ marginBottom: 24 }}>
              If you have questions about this privacy policy or how we handle your data, contact us through the channels listed on our website sdmcapital.cl.
            </p>

            <p style={{ fontSize: 14, color: 'var(--border)', marginTop: 48 }}>
              Last updated: June 2026.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
