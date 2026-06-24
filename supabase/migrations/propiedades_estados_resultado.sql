-- ── Estados de resultado para propiedades: vendida, reservada, arrendada ──────
--
-- Antes de aplicar esta migración, verifica si la columna "estado" de la tabla
-- "propiedades" tiene un CHECK constraint:
--
--   SELECT con.conname, pg_get_constraintdef(con.oid)
--   FROM pg_constraint con
--   JOIN pg_class rel ON rel.oid = con.conrelid
--   WHERE rel.relname = 'propiedades' AND con.contype = 'c'
--     AND pg_get_constraintdef(con.oid) ILIKE '%estado%';
--
-- Si esa consulta no devuelve filas: no existe constraint, el campo acepta
-- cualquier texto y los nuevos valores ('vendida', 'reservada', 'arrendada')
-- funcionan directamente desde la app sin necesidad de SQL adicional.
--
-- Si devuelve una fila: el bloque siguiente la reemplaza por una versión que
-- incluye los valores nuevos, sin tocar las filas existentes (los valores
-- 'en_venta', 'en_arriendo', 'vendida' y 'reservada' ya estaban permitidos).

DO $$
DECLARE
  c_name text;
BEGIN
  SELECT con.conname INTO c_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'propiedades' AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%estado%'
  LIMIT 1;

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE propiedades DROP CONSTRAINT %I', c_name);
    ALTER TABLE propiedades
      ADD CONSTRAINT propiedades_estado_check
      CHECK (estado IN ('en_venta', 'en_arriendo', 'vendida', 'reservada', 'arrendada'));
  END IF;
END $$;
