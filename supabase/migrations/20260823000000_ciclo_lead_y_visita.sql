-- Ciclo de gestión del lead y de la visita.
--
-- `leads.contactado_en` / `cerrado_en` / `resultado` son un eje nuevo, aparte
-- de `status`. NO se toca `status`: la lee el Worker de Sofía en index.js:1750
-- y no debe tener un segundo escritor. `resultado` es nullable a propósito:
-- existe un botón de cierre rápido que no pide resultado.
--
-- `visitas.realizada_en` tampoco toca el CHECK ni los valores de `estado`.
-- 'pendiente' lo sigue escribiendo el Worker en ganoCarreraReady.

ALTER TABLE leads
  ADD COLUMN contactado_en timestamptz,
  ADD COLUMN cerrado_en timestamptz,
  ADD COLUMN resultado text
    CHECK (resultado IN ('vendido_arrendado', 'no_califico', 'no_respondio', 'compro_por_fuera'));

ALTER TABLE visitas
  ADD COLUMN realizada_en timestamptz;

-- Backfill: las visitas en estado='realizada' de hoy no son visitas — Roberto
-- y Manuel las marcaron a mano para cerrar gestiones ya terminadas, antes de
-- que existiera este campo. Se mueven al eje del lead: cerrado_en = now(),
-- resultado null porque en su momento no se registró resultado.
--
-- El orden importa: primero se marca el lead usando el criterio (visitas en
-- 'realizada'), recién después se revierte esa misma visita a 'pendiente'.
-- Invertido, el segundo UPDATE borra el criterio que necesita el primero.
UPDATE leads
   SET cerrado_en = now(), resultado = null
 WHERE id IN (SELECT lead_id FROM visitas WHERE estado = 'realizada');

UPDATE visitas
   SET estado = 'pendiente'
 WHERE estado = 'realizada';
