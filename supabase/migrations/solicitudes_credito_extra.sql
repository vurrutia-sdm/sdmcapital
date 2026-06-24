-- ── Solicitudes de crédito: reemplaza adjuntos por sueldo promedio ────────────
-- La tabla solicitudes_credito y sus políticas RLS ya existen (ver solicitudes_credito.sql).
-- El formulario ya no sube documentos; en su lugar captura el sueldo líquido promedio.

ALTER TABLE solicitudes_credito ADD COLUMN IF NOT EXISTS sueldo_promedio numeric;
