import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'

const P = '48px'

// Respaldo: se usa si la fila 'condiciones-del-servicio' aún no existe en
// Supabase o si la consulta falla, para no dejar la página en blanco.
const FALLBACK_ES = `
<p>Estas Condiciones del Servicio regulan el uso del sitio web sdmcapital.cl y los servicios de corretaje e intermediación inmobiliaria prestados por SDM Capital SpA ("SDM Capital", "nosotros"). Al utilizar este sitio o contactarnos a través de nuestros canales, incluido WhatsApp, aceptas las condiciones aquí descritas.</p>
<h2>Objeto y alcance del servicio</h2>
<p>SDM Capital actúa como corredor e intermediario inmobiliario, conectando a personas interesadas en comprar, vender o arrendar propiedades con la contraparte correspondiente, y prestando asesoría durante el proceso. La prestación efectiva de cualquier servicio de corretaje, asesoría o intermediación se concreta mediante un acuerdo o mandato específico entre SDM Capital y el cliente, y no por el solo hecho de navegar este sitio o contactarnos.</p>
<h2>Información sobre las propiedades</h2>
<p>La información publicada en este sitio sobre propiedades —incluyendo precios, superficies, disponibilidad, imágenes, características y plazos— tiene carácter referencial e informativo. Dicha información puede cambiar sin previo aviso, estar sujeta a la disponibilidad real de la propiedad al momento de la consulta, y puede contener errores u omisiones involuntarias. Te recomendamos confirmar siempre los detalles relevantes directamente con nuestro equipo antes de tomar decisiones.</p>
<h2>Asistente virtual y canales de contacto</h2>
<p>Parte de la atención inicial por WhatsApp puede ser realizada por un asistente virtual automatizado, cuyo objetivo es orientar tu consulta y derivarla a un asesor de nuestro equipo. La información entregada por el asistente tiene carácter referencial y no constituye una oferta vinculante ni una asesoría profesional definitiva.</p>
<h2>Condiciones comerciales</h2>
<p>Las condiciones comerciales específicas de cada operación —incluyendo comisiones, plazos, forma de pago, exclusividad y demás términos— se acuerdan y formalizan por escrito mediante el contrato, mandato o documento correspondiente entre SDM Capital y el cliente. Ninguna comunicación previa, cotización referencial o información publicada en este sitio reemplaza dicho acuerdo.</p>
<h2>Limitación de responsabilidad</h2>
<p>SDM Capital pone a disposición este sitio y sus canales de contacto con fines informativos y de gestión comercial. En la medida permitida por la ley, SDM Capital no será responsable por daños o perjuicios derivados del uso de la información publicada en el sitio, de decisiones adoptadas en base a información referencial, ni de la indisponibilidad temporal del sitio o de los canales de comunicación. Esta limitación no afecta los derechos que la ley chilena reconoce de manera irrenunciable a los consumidores.</p>
<h2>Propiedad del contenido</h2>
<p>Los textos, imágenes, marcas y demás contenidos publicados en este sitio son de propiedad de SDM Capital o de terceros que han autorizado su uso, y no pueden ser reproducidos ni utilizados sin autorización previa.</p>
<h2>Modificaciones</h2>
<p>SDM Capital podrá actualizar estas Condiciones del Servicio en cualquier momento. La versión vigente estará siempre disponible en este sitio web.</p>
<h2>Ley aplicable</h2>
<p>Estas condiciones se rigen por las leyes de la República de Chile. Cualquier controversia derivada de su interpretación o aplicación se someterá a los tribunales competentes de Chile, sin perjuicio de las normas especiales de protección al consumidor que resulten aplicables.</p>
<h2>Contacto</h2>
<p>Si tienes preguntas sobre estas Condiciones del Servicio, contáctanos a través de los medios indicados en nuestro sitio web sdmcapital.cl.</p>
<p>Última actualización: junio de 2026.</p>
`

export default function CondicionesServicioPage() {
  const { lang } = useLang()
  const sp = { paddingLeft: `clamp(16px, 5vw, ${P})`, paddingRight: `clamp(16px, 5vw, ${P})` }

  const [contenido, setContenido] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('paginas_legales').select('contenido').eq('slug', 'condiciones-del-servicio').maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.contenido) setContenido(data.contenido)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      <SEO
        title={lang === 'es' ? 'Condiciones del Servicio' : 'Terms of Service'}
        description={lang === 'es'
          ? 'Condiciones del servicio de SDM Capital: alcance del servicio de corretaje, información de propiedades y condiciones comerciales.'
          : 'SDM Capital terms of service: scope of our brokerage service, property information and commercial terms.'}
        url="/condiciones-del-servicio"
      />

      <div style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--navy-dark)', borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Legal' : 'Legal'}
        </div>
        <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, maxWidth: 700 }}>
          {lang === 'es' ? 'Condiciones del ' : 'Terms of '}<em>{lang === 'es' ? 'Servicio' : 'Service'}</em>
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
              These Terms of Service govern the use of the website sdmcapital.cl and the real estate brokerage and intermediation services provided by SDM Capital SpA ("SDM Capital", "we"). By using this site or contacting us through our channels, including WhatsApp, you accept the terms described here.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Scope of the service
            </h2>
            <p style={{ marginBottom: 24 }}>
              SDM Capital acts as a real estate broker and intermediary, connecting people interested in buying, selling or renting properties with the relevant counterparty, and providing advice throughout the process. Any actual brokerage, advisory or intermediation service is formalized through a specific agreement between SDM Capital and the client, not merely by browsing this site or contacting us.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Property information
            </h2>
            <p style={{ marginBottom: 24 }}>
              Information published on this site about properties — including prices, sizes, availability, images, features and timelines — is for reference purposes only. It may change without notice, may be subject to the property's actual availability at the time of the inquiry, and may contain unintentional errors or omissions. We recommend always confirming relevant details directly with our team before making decisions.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Virtual assistant and contact channels
            </h2>
            <p style={{ marginBottom: 24 }}>
              Part of our initial WhatsApp assistance may be handled by an automated virtual assistant, whose purpose is to guide your inquiry and route it to a member of our team. Information provided by the assistant is for reference only and does not constitute a binding offer or definitive professional advice.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Commercial terms
            </h2>
            <p style={{ marginBottom: 24 }}>
              The specific commercial terms of each transaction — including commissions, timelines, payment terms, exclusivity and other conditions — are agreed and formalized in writing through the corresponding contract or mandate between SDM Capital and the client. No prior communication, reference quote or information published on this site replaces that agreement.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Limitation of liability
            </h2>
            <p style={{ marginBottom: 24 }}>
              SDM Capital makes this site and its contact channels available for informational and commercial purposes. To the extent permitted by law, SDM Capital will not be liable for damages arising from the use of information published on the site, decisions made based on reference information, or temporary unavailability of the site or communication channels. This limitation does not affect rights that Chilean law grants consumers on a non-waivable basis.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Content ownership
            </h2>
            <p style={{ marginBottom: 24 }}>
              The text, images, trademarks and other content published on this site are owned by SDM Capital or by third parties who have authorized their use, and may not be reproduced or used without prior authorization.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Changes
            </h2>
            <p style={{ marginBottom: 24 }}>
              SDM Capital may update these Terms of Service at any time. The current version will always be available on this website.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Governing law
            </h2>
            <p style={{ marginBottom: 24 }}>
              These terms are governed by the laws of the Republic of Chile. Any dispute arising from their interpretation or application will be submitted to the competent courts of Chile, without prejudice to applicable special consumer-protection rules.
            </p>

            <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Contact
            </h2>
            <p style={{ marginBottom: 24 }}>
              If you have questions about these Terms of Service, contact us through the channels listed on our website sdmcapital.cl.
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
