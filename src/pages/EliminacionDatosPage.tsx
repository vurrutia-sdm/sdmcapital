import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'

const P = '48px'

// Respaldo: se usa si la fila 'eliminacion-de-datos' aún no existe en
// Supabase o si la consulta falla, para no dejar la página en blanco.
const FALLBACK_ES = `
<p>En SDM Capital SpA ("SDM Capital", "nosotros") respetamos tu derecho a solicitar la eliminación de los datos personales que hayas compartido con nosotros a través de nuestro sitio web sdmcapital.cl o de nuestros canales de contacto, incluido WhatsApp.</p>
<h2>Cómo solicitar la eliminación de tus datos</h2>
<p>Si deseas que eliminemos tus datos personales, escríbenos a través de cualquiera de estos canales indicando tu nombre y el número de teléfono o correo con el que nos contactaste, señalando que solicitas la eliminación de tus datos personales:</p>
<ul>
  <li>WhatsApp: +56 9 3103 8954 / +56 9 6191 2281</li>
  <li>Correo electrónico: contacto@sdmcapital.cl</li>
  <li>Cualquier otro canal de contacto indicado en nuestro sitio web sdmcapital.cl</li>
</ul>
<h2>Qué datos eliminamos</h2>
<p>Eliminaremos los datos personales que hayamos recopilado a través de tu interacción con nuestro sitio web y con nuestros canales de WhatsApp, incluyendo —según corresponda— tu nombre, número de teléfono, correo electrónico, y el contenido de la conversación o consulta registrada con nuestro equipo o con nuestro asistente virtual.</p>
<h2>Plazo de procesamiento</h2>
<p>Procesaremos tu solicitud dentro de un plazo razonable, que en condiciones normales no debería superar los 30 días corridos desde su recepción. Te confirmaremos por el mismo medio una vez que la eliminación se haya completado.</p>
<h2>Excepciones</h2>
<p>En algunos casos podremos conservar cierta información cuando exista una obligación legal, contractual o regulatoria que lo justifique (por ejemplo, registros asociados a una operación comercial ya formalizada), únicamente por el tiempo necesario para dicho fin.</p>
<h2>Más información</h2>
<p>Para más detalles sobre cómo recopilamos y tratamos tus datos personales, revisa nuestra <a href="/politica-de-privacidad">Política de Privacidad</a>.</p>
<p>Última actualización: junio de 2026.</p>
`

export default function EliminacionDatosPage() {
  const { lang } = useLang()
  const sp = { paddingLeft: `clamp(16px, 5vw, ${P})`, paddingRight: `clamp(16px, 5vw, ${P})` }

  const [contenido, setContenido] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('paginas_legales').select('contenido').eq('slug', 'eliminacion-de-datos').maybeSingle()
      .then(({ data, error }) => {
        if (!error && data?.contenido) setContenido(data.contenido)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen">
      <SEO
        title={lang === 'es' ? 'Eliminación de Datos' : 'Data Deletion'}
        description={lang === 'es'
          ? 'Cómo solicitar la eliminación de tus datos personales recopilados por SDM Capital a través de la web y WhatsApp.'
          : 'How to request the deletion of your personal data collected by SDM Capital through our website and WhatsApp.'}
        url="/eliminacion-de-datos"
      />

      <div style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--navy-dark)', borderBottom: '1px solid #e8edf2' }}>
        <div className="section-label section-label--light" style={{ marginBottom: 20 }}>
          {lang === 'es' ? 'Legal' : 'Legal'}
        </div>
        <h1 className="font-serif font-light" style={{ fontSize: 'clamp(32px,5vw,56px)', color: '#fff', lineHeight: 1.1, letterSpacing: '-0.5px', maxWidth: 700 }}>
          {lang === 'es' ? 'Eliminación de ' : 'Data '}<em>{lang === 'es' ? 'Datos' : 'Deletion'}</em>
        </h1>
      </div>

      <div style={{ ...sp, paddingTop: 64, paddingBottom: 96, maxWidth: 760, margin: '0 auto' }}>
        {lang === 'es' ? (
          loading ? (
            <p style={{ fontSize: 15, color: 'var(--muted)' }}>Cargando…</p>
          ) : (
            <div
              className="prose-sdm"
              style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9 }}
              dangerouslySetInnerHTML={{ __html: contenido || FALLBACK_ES }}
            />
          )
        ) : (
          <div style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.9 }}>
            <p style={{ marginBottom: 24 }}>
              At SDM Capital SpA ("SDM Capital", "we") we respect your right to request the deletion of the personal data you have shared with us through our website sdmcapital.cl or our contact channels, including WhatsApp.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              How to request deletion of your data
            </h2>
            <p style={{ marginBottom: 24 }}>
              If you would like us to delete your personal data, write to us through any of these channels, including your name and the phone number or email you used to contact us, and stating that you are requesting the deletion of your personal data:
            </p>
            <ul style={{ paddingLeft: 24, marginBottom: 24, listStyleType: 'disc' }}>
              <li style={{ marginBottom: 6 }}>WhatsApp: +56 9 3103 8954 / +56 9 6191 2281</li>
              <li style={{ marginBottom: 6 }}>Email: contacto@sdmcapital.cl</li>
              <li style={{ marginBottom: 6 }}>Any other contact channel listed on our website sdmcapital.cl</li>
            </ul>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              What data we delete
            </h2>
            <p style={{ marginBottom: 24 }}>
              We will delete the personal data we have collected through your interaction with our website and our WhatsApp channels, including — as applicable — your name, phone number, email address, and the content of the conversation or inquiry recorded with our team or our virtual assistant.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Processing time
            </h2>
            <p style={{ marginBottom: 24 }}>
              We will process your request within a reasonable timeframe, which under normal circumstances should not exceed 30 calendar days from receipt. We will confirm through the same channel once the deletion has been completed.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              Exceptions
            </h2>
            <p style={{ marginBottom: 24 }}>
              In some cases, we may retain certain information when there is a legal, contractual or regulatory obligation that justifies it (for example, records associated with a transaction that has already been formalized), only for as long as necessary for that purpose.
            </p>

            <h2 className="font-serif font-light" style={{ fontSize: 24, color: 'var(--navy-dark)', marginTop: 40, marginBottom: 16 }}>
              More information
            </h2>
            <p style={{ marginBottom: 24 }}>
              For more details on how we collect and process your personal data, see our <a href="/politica-de-privacidad" style={{ color: 'var(--navy)', textDecoration: 'underline' }}>Privacy Policy</a>.
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
