-- MEJORA 1: título personalizado para documentos adjuntos (dossiers)
-- La columna actual `dossiers` es text[] (array de URLs). La migramos a jsonb
-- con forma [{url, titulo}], conservando la columna vieja como respaldo.

ALTER TABLE propiedades RENAME COLUMN dossiers TO dossiers_legacy;

ALTER TABLE propiedades ADD COLUMN dossiers jsonb DEFAULT '[]'::jsonb;

UPDATE propiedades
SET dossiers = COALESCE(
  (SELECT jsonb_agg(jsonb_build_object('url', d, 'titulo', null))
   FROM unnest(dossiers_legacy) AS d),
  '[]'::jsonb
)
WHERE dossiers_legacy IS NOT NULL;

-- Ejecutar solo después de confirmar que el sitio muestra bien los documentos:
-- ALTER TABLE propiedades DROP COLUMN dossiers_legacy;

-- MEJORA 2: control por propiedad para el botón de pago Flow
ALTER TABLE propiedades ADD COLUMN mostrar_boton_flow boolean DEFAULT true;

-- Desactivar el botón Flow para el Hotel en Futaleufú
UPDATE propiedades
SET mostrar_boton_flow = false
WHERE id = 'eccfd92d-713e-4e0a-a074-ff76daffd81e' AND comuna = 'Futaleufú';
