-- Acorta el texto del bloque de financiamiento del Inicio.
--
-- Mismo motivo que `20260809000000`: estas tres claves YA EXISTEN en la tabla y
-- `get()` devuelve el valor de la base por encima del default del código, así
-- que sin esto el despliegue seguiría pintando el texto largo.
--
-- Se va la mención al Conservador de Bienes Raíces y se va la línea de
-- condición entera. `financiamiento_condicion` queda huérfana: su campo del
-- admin se retira, pero LA FILA NO SE BORRA — misma regla que
-- `financiamiento_imagen`, un DELETE contra producción no hace falta para
-- retirar un campo.
--
-- POR QUÉ SE PUEDE QUITAR LA CONDICIÓN SIN PROMETER DE MÁS: existía para
-- responder a la pregunta que abría el cuerpo anterior —«si compras con
-- nosotros la gestión no tiene costo» invita a «¿y si no?»—. El cuerpo nuevo no
-- menciona la gratuidad, y «Sin pagos adelantados» es cierto tanto si el
-- cliente compra con SDM como si compra por fuera.
--
-- LA POLÍTICA COMPLETA SIGUE PUBLICADA donde el visitante decide, y ahí no se
-- acorta nada:
--   · `SolicitudCreditoModal.tsx`, bloque «Honorarios»
--   · `EvaluacionGratuitaPage.tsx`, sexto beneficio
--
-- El corte del par título/cursiva cae entre sujeto y predicado. Ver la nota del
-- componente en `HomePage.tsx` para las otras dos particiones que se probaron.

INSERT INTO contenido_sitio (clave, valor) VALUES
  ('financiamiento_titulo',    '¿El banco'),
  ('financiamiento_titulo_em', 'te dijo no?'),
  ('financiamiento_body',      'Hacemos la preevaluación hipotecaria y te acompañamos en todo el proceso. Sin pagos adelantados.')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor;
