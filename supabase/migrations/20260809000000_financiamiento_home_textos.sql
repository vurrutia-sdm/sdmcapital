-- Textos del bloque de financiamiento del Inicio.
--
-- ES DML, NO DDL, y es deliberado. `contenido_sitio` se edita normalmente desde
-- el admin, pero acá hacía falta que la base y el código llegaran a producción
-- EN EL MISMO DESPLIEGUE, y el admin no puede hacer eso: sus escrituras van por
-- Supabase Auth desde el navegador de Víctor, no desde el build.
--
-- El problema concreto, medido: `financiamiento_titulo` y `financiamiento_body`
-- YA EXISTÍAN en la tabla con los valores del diseño anterior, y `get()`
-- devuelve el valor de la base por encima del default del código. Desplegar
-- solo el código habría pintado:
--
--   título   «¿Necesitas financiamiento? decir que sí?»   ← el viejo + la
--                                                            cursiva nueva
--   cuerpo   «Gestionamos créditos de consumo, hipotecarios y bancarización
--             para personas y empresas. Sin pagos adelantados.»
--
-- El cuerpo viejo es justamente el que NO refleja la política de honorarios, o
-- sea que el despliegue habría dejado en pie el texto que este trabajo corrige.
--
-- LA POLÍTICA QUE ESTOS TEXTOS DECLARAN:
--   · La preevaluación es gratuita siempre.
--   · Nunca hay pago adelantado.
--   · Si el cliente compra su propiedad con SDM —nueva o usada—, la gestión
--     del crédito NO se cobra. Si compra por fuera, sí.
--
-- Las mismas tres afirmaciones están en `SolicitudCreditoModal.tsx` y en
-- `EvaluacionGratuitaPage.tsx`. Si se cambia una, se cambian las tres.
--
-- `financiamiento_imagen` NO se borra: la fila se queda, simplemente ya no la
-- lee nadie. Borrar filas de `contenido_sitio` no hace falta para retirar un
-- campo, y un DELETE contra producción es un riesgo que este cambio no necesita.

INSERT INTO contenido_sitio (clave, valor) VALUES
  ('financiamiento_titulo',    '¿El banco te va a'),
  ('financiamiento_titulo_em', 'decir que sí?'),
  ('financiamiento_body',      'Hacemos la preevaluación hipotecaria y te acompañamos hasta la inscripción en el Conservador de Bienes Raíces. Si compras tu propiedad con nosotros, la gestión del crédito no tiene costo.'),
  ('financiamiento_condicion', 'Sin pagos adelantados en ninguna etapa. Si la compra la haces por fuera, la gestión sí se cobra.'),
  ('financiamiento_prueba',    'Roberto Urrutia · Director Comercial · +20 años en banca'),
  ('financiamiento_cta',       'Solicita tu preevaluación gratuita')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
