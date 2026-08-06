-- Ficha genérica para la cartera de oficinas del centro de Santiago.
--
-- Cambio de estrategia respecto de 20260805000100: los 10 edificios cargados
-- ahí se quedan pausados de forma permanente (`activo = false`) como
-- referencia interna. No se publican porque expondrían las direcciones de la
-- cartera del socio. No se borran ni se activan.
--
-- Esta ficha los reemplaza de cara al público: comunica el volumen y el rango
-- de superficies sin decir dónde está nada. Por eso va sin `direccion`, sin
-- `map_address`, sin `map_lat` y sin `map_lng` — cualquiera de esos campos
-- reintroduciría en el sitio justo lo que se está protegiendo.
--
-- `unidades` queda en NULL a propósito: la tabla de la ficha se dibuja solo
-- cuando ese campo tiene contenido, y acá no corresponde mostrar el desglose
-- piso por piso.
--
-- `superficie_total` = 25.401 m², la suma de los 10 edificios (25.401,14
-- exactos, redondeado). `destacada = true` y `activo = false`: se publica
-- cuando se carguen las fotos desde el admin.
--
-- Los ejes sí se nombran: Miraflores, Ahumada y Nueva York son sectores, no
-- direcciones.
--
-- Idempotente por slug: se puede volver a correr sin duplicar.

INSERT INTO propiedades (
  slug, titulo, descripcion, superficie_total,
  tipo, estado, region, comuna, pais,
  a_consultar, activo, destacada, internacional, imagenes
)
SELECT
  'oficinas-arriendo-santiago-centro',
  'Oficinas en arriendo — Santiago Centro',
  '<p>Cartera de oficinas en el centro de Santiago: 42 unidades disponibles en arriendo, distribuidas en diez edificios.</p>'
  '<p>Las superficies van desde 178 m² hasta 1.144 m². El rango permite acomodar desde un estudio profesional hasta una empresa que necesita una planta completa.</p>'
  '<p>Los edificios se ubican sobre los ejes Miraflores, Ahumada y Nueva York, en el núcleo institucional y financiero de la comuna.</p>'
  '<p>Son espacios adecuados para empresas, estudios profesionales e instituciones.</p>'
  '<p>El detalle de cada edificio, los valores de arriendo y la coordinación de visitas se entregan de forma personalizada al tomar contacto.</p>',
  25401,
  'oficina', 'en_arriendo', 'R. Metropolitana', 'Santiago', 'Chile',
  true, false, true, false, ARRAY[]::text[]
WHERE NOT EXISTS (
  SELECT 1 FROM propiedades p WHERE p.slug = 'oficinas-arriendo-santiago-centro'
);

NOTIFY pgrst, 'reload schema';
