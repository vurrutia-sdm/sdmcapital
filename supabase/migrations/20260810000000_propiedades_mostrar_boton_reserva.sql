-- `mostrar_boton_flow` → `mostrar_boton_reserva`
--
-- El botón dejó de ser de Flow en el commit c737689: hoy abre `ReservaModal`,
-- que cobra por transferencia bancaria. El nombre de la columna quedó mintiendo.
--
-- ESTE ARCHIVO ES EL PASO 1 DE 4, Y SOLO AÑADE. No renombra ni borra nada,
-- porque el sitio en producción está leyendo `mostrar_boton_flow` ahora mismo:
--
--   1. (acá) añadir `mostrar_boton_reserva`, con backfill y el mismo default.
--   2. migrar el código a la columna nueva.
--   3. desplegar, y verificar en producción.
--   4. recién entonces, `ALTER TABLE propiedades DROP COLUMN mostrar_boton_flow`.
--
-- El paso 4 NO tiene archivo todavía, y no debe escribirse hasta que el paso 3
-- esté verificado. Entre el 2 y el 3 las dos columnas conviven: el admin nuevo
-- escribe la nueva y el sitio viejo lee la vieja, así que un cambio de bandera
-- hecho en esa ventana no se ve en producción hasta el deploy. Es una ventana
-- de minutos sobre una bandera que se toca una vez por propiedad; no justifica
-- un trigger que sincronice las dos.

-- Mismo tipo, mismo default y misma nulabilidad que la original
-- (`propiedades_dossiers_y_flow.sql:21`: `boolean DEFAULT true`, sin NOT NULL).
ALTER TABLE propiedades
  ADD COLUMN IF NOT EXISTS mostrar_boton_reserva boolean DEFAULT true;

-- El `DEFAULT true` de arriba ya dejó las 82 filas en `true`; este UPDATE es el
-- que recupera la única que estaba en `false` —el Hotel + Restaurante de
-- Futaleufú—. Se copia la columna tal cual, NULL incluido: hoy no hay ninguna
-- fila NULL, pero `mostrar_boton_flow !== false` trata NULL como «sí muestra» y
-- convertirlo a `true` acá cambiaría el dato en vez de moverlo.
UPDATE propiedades
   SET mostrar_boton_reserva = mostrar_boton_flow;
