-- ── Páginas legales adicionales: Condiciones del Servicio y Eliminación de Datos ──
-- La tabla paginas_legales y sus políticas RLS ya existen (ver paginas_legales.sql).
-- Este archivo solo agrega las filas iniciales para las dos nuevas páginas.

-- Seed: contenido inicial de /condiciones-del-servicio
INSERT INTO paginas_legales (slug, titulo, contenido) VALUES (
  'condiciones-del-servicio',
  'Condiciones del Servicio',
  $$<p>Estas Condiciones del Servicio regulan el uso del sitio web sdmcapital.cl y los servicios de corretaje e intermediación inmobiliaria prestados por SDM Capital SpA ("SDM Capital", "nosotros"). Al utilizar este sitio o contactarnos a través de nuestros canales, incluido WhatsApp, aceptas las condiciones aquí descritas.</p>
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
<p>Última actualización: junio de 2026.</p>$$
)
ON CONFLICT (slug) DO NOTHING;

-- Seed: contenido inicial de /eliminacion-de-datos
INSERT INTO paginas_legales (slug, titulo, contenido) VALUES (
  'eliminacion-de-datos',
  'Eliminación de Datos',
  $$<p>En SDM Capital SpA ("SDM Capital", "nosotros") respetamos tu derecho a solicitar la eliminación de los datos personales que hayas compartido con nosotros a través de nuestro sitio web sdmcapital.cl o de nuestros canales de contacto, incluido WhatsApp.</p>
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
<p>Última actualización: junio de 2026.</p>$$
)
ON CONFLICT (slug) DO NOTHING;
