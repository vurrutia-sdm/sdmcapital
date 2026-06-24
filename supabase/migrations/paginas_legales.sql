-- ── Páginas legales (contenido editable desde el admin) ──────────────────────

CREATE TABLE IF NOT EXISTS paginas_legales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  titulo text,
  contenido text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE paginas_legales ENABLE ROW LEVEL SECURITY;

-- Lectura pública: la página /politica-de-privacidad debe poder leerse sin login
CREATE POLICY "Lectura pública de páginas legales"
ON paginas_legales FOR SELECT
USING (true);

-- Escritura solo para usuarios autenticados (admin)
CREATE POLICY "Escritura de páginas legales para autenticados"
ON paginas_legales FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- Seed: contenido actual de /politica-de-privacidad (versión en español)
INSERT INTO paginas_legales (slug, titulo, contenido) VALUES (
  'politica-de-privacidad',
  'Política de Privacidad',
  $$<p>En SDM Capital SpA ("SDM Capital", "nosotros") respetamos tu privacidad y nos comprometemos a proteger los datos personales que compartes con nosotros a través de nuestro sitio web sdmcapital.cl y de nuestros canales de contacto, incluido WhatsApp.</p>
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
<p>Última actualización: junio de 2026.</p>$$
)
ON CONFLICT (slug) DO NOTHING;
