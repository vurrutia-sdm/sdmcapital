-- Agrega prop_pais y prop_ciudad a cotizaciones.
--
-- Ambos campos existían en el tipo TypeScript desde que se implementó el
-- selector de País en el Paso 2 del wizard, pero nunca se crearon como
-- columnas. Como EMPTY_DRAFT manda siempre `prop_pais: 'Chile'`, todo INSERT
-- de cotización nueva moría con:
--
--   PGRST204 · Could not find the 'prop_pais' column of 'cotizaciones'
--             in the schema cache   (HTTP 400)
--
-- y como onSave descartaba el { error }, el wizard se cerraba como si hubiera
-- guardado. Nullable a propósito: son parte del snapshot de la propiedad, que
-- es opcional por diseño.

ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS prop_pais   text;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS prop_ciudad text;

-- Las cotizaciones ya guardadas son todas de propiedades en Chile.
UPDATE cotizaciones SET prop_pais = 'Chile' WHERE prop_pais IS NULL;

-- PostgREST cachea el esquema: sin recargarlo el 400 puede persistir unos
-- minutos aunque las columnas ya existan.
NOTIFY pgrst, 'reload schema';
