-- Carga del inventario de oficinas en arriendo de Santiago Centro:
-- 10 edificios, 42 unidades.
--
-- Valores comunes a los 10: tipo 'oficina', estado 'en_arriendo',
-- R. Metropolitana / Santiago / Chile, a_consultar = true (los precios se
-- manejan de forma interna y no se publican), activo = false (quedan como
-- borrador hasta que lleguen las fotos) y destacada = false.
--
-- Dos advertencias sobre los datos:
--
-- 1. Las direcciones son inferencias desde los códigos del catálogo original
--    (M130 = Miraflores 130, etc.). Van marcadas como pendientes de verificar
--    dentro de la propia descripción, para que quien revise la ficha lo vea.
--
-- 2. Edificio Las Américas declara 5.122 m² totales, pero el catálogo lista 9
--    pisos cuyas superficies individuales suman 5.808 — exactamente 686 de
--    más, que es el valor del piso 19. Es decir, hay un dato duplicado. Los 8
--    pisos con superficie confirmada suman 5.122 exactos, así que el piso 20
--    queda con m2 = null y nota "superficie por confirmar" en vez de un número
--    inventado.
--
-- Idempotente por slug: se puede volver a correr sin duplicar.

INSERT INTO propiedades (
  slug, titulo, descripcion, direccion, superficie_total, unidades,
  tipo, estado, region, comuna, pais,
  a_consultar, activo, destacada, internacional, imagenes
)
SELECT
  v.slug, v.titulo, v.descripcion, v.direccion, v.superficie_total, v.unidades,
  'oficina', 'en_arriendo', 'R. Metropolitana', 'Santiago', 'Chile',
  true, false, false, false, ARRAY[]::text[]
FROM (VALUES
  (
    'torre-los-andes',
    'Torre Los Andes',
    '<p>Edificio de oficinas en el eje Miraflores, Santiago Centro. 5 unidades disponibles en arriendo, desde 390 m².</p><p><em>Dirección referencial: Miraflores 130. Pendiente de verificar.</em></p>',
    'Miraflores 130',
    2123.14::numeric,
    '[{"piso":"3","m2":461},{"piso":"4","m2":422},{"piso":"5","m2":425.14},{"piso":"6","m2":425},{"piso":"7","m2":390}]'::jsonb
  ),
  (
    'edificio-fundacion',
    'Edificio Fundación',
    '<p>Edificio de oficinas en el eje Miraflores, Santiago Centro. 1 unidad disponible en arriendo, desde 668 m².</p><p><em>Dirección referencial: Miraflores 178. Pendiente de verificar.</em></p>',
    'Miraflores 178',
    668,
    '[{"piso":"23 a 25","m2":668}]'::jsonb
  ),
  (
    'edificio-las-americas',
    'Edificio Las Américas',
    '<p>Edificio de oficinas en el eje Miraflores, Santiago Centro. 9 unidades disponibles en arriendo, desde 225 m², una de ellas con superficie por confirmar.</p><p><em>Dirección referencial: Miraflores 222. Pendiente de verificar.</em></p>',
    'Miraflores 222',
    5122,
    '[{"piso":"5","m2":1109},{"piso":"6","m2":1116},{"piso":"701","m2":836},{"piso":"702","m2":250},{"piso":"8","m2":225},{"piso":"10","m2":400},{"piso":"13","m2":500},{"piso":"19","m2":686},{"piso":"20","m2":null,"nota":"superficie por confirmar"}]'::jsonb
  ),
  (
    'torre-centenario',
    'Torre Centenario',
    '<p>Edificio de oficinas en el eje Miraflores, Santiago Centro. 5 unidades disponibles en arriendo, desde 1.106 m².</p><p><em>Dirección referencial: Miraflores 383. Pendiente de verificar.</em></p>',
    'Miraflores 383',
    5650,
    '[{"piso":"14","m2":1144},{"piso":"15","m2":1144},{"piso":"16","m2":1106},{"piso":"17","m2":1128},{"piso":"18","m2":1128}]'::jsonb
  ),
  (
    'edificio-ahumada-con-moneda',
    'Edificio Ahumada con Moneda',
    '<p>Edificio de oficinas en el eje Ahumada, Santiago Centro. 3 unidades disponibles en arriendo, desde 750 m².</p><p><em>Dirección referencial: Ahumada 1025. Pendiente de verificar.</em></p>',
    'Ahumada 1025',
    2268,
    '[{"piso":"3","m2":750},{"piso":"5","m2":759},{"piso":"6","m2":759}]'::jsonb
  ),
  (
    'edificio-eurocentro',
    'Edificio Eurocentro',
    '<p>Edificio de oficinas en el eje Ahumada–Moneda, Santiago Centro. 4 unidades disponibles en arriendo, desde 931 m².</p><p><em>Dirección referencial: Moneda 970. Pendiente de verificar.</em></p>',
    'Moneda 970',
    3724,
    '[{"piso":"15","m2":931},{"piso":"18","m2":931},{"piso":"19","m2":931},{"piso":"20","m2":931}]'::jsonb
  ),
  (
    'edificio-ahumada-179',
    'Edificio Ahumada 179',
    '<p>Edificio de oficinas en el eje Ahumada, Santiago Centro. 5 unidades disponibles en arriendo, desde 564 m².</p><p><em>Dirección referencial: Ahumada 179. Pendiente de verificar.</em></p>',
    'Ahumada 179',
    2820,
    '[{"piso":"3","m2":564},{"piso":"9","m2":564},{"piso":"10","m2":564},{"piso":"11","m2":564},{"piso":"12","m2":564}]'::jsonb
  ),
  (
    'edificio-nueva-york-17',
    'Edificio Nueva York 17',
    '<p>Edificio de oficinas en el eje Nueva York, Santiago Centro. 2 unidades disponibles en arriendo, desde 293 m².</p><p><em>Dirección referencial: Nueva York 17. Pendiente de verificar.</em></p>',
    'Nueva York 17',
    591,
    '[{"piso":"5","m2":298},{"piso":"6","m2":293}]'::jsonb
  ),
  (
    'edificio-nueva-york-33-valores',
    'Edificio Nueva York 33 / Valores',
    '<p>Edificio de oficinas en el eje Nueva York, Santiago Centro. 4 unidades disponibles en arriendo, desde 178 m².</p><p><em>Dirección referencial: Nueva York 33. Pendiente de verificar.</em></p>',
    'Nueva York 33',
    1080,
    '[{"piso":"3","m2":338},{"piso":"15","m2":308},{"piso":"16","m2":256},{"piso":"17","m2":178}]'::jsonb
  ),
  (
    'edificio-andres-bello',
    'Edificio Andrés Bello',
    '<p>Edificio de oficinas en el eje Alameda, Santiago Centro. 4 unidades disponibles en arriendo, desde 280 m².</p><p><em>Dirección referencial: Alameda 886. Pendiente de verificar.</em></p>',
    'Alameda 886',
    1355,
    '[{"piso":"2","m2":460},{"piso":"5","m2":331},{"piso":"9","m2":284},{"piso":"10","m2":280}]'::jsonb
  )
) AS v(slug, titulo, descripcion, direccion, superficie_total, unidades)
WHERE NOT EXISTS (
  SELECT 1 FROM propiedades p WHERE p.slug = v.slug
);

NOTIFY pgrst, 'reload schema';
