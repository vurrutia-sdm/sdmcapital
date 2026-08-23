-- Backfill: cerrar una gestión implica haberla contactado. No pueden quedar
-- leads con `cerrado_en` pero sin `contactado_en`.
UPDATE leads
   SET contactado_en = cerrado_en
 WHERE cerrado_en IS NOT NULL
   AND contactado_en IS NULL;

-- `resumen_diario`: `visitas_pendientes` medía `estado='pendiente'`, que
-- significa "Sofía ofreció coordinar" — no "hay una visita agendada". Ese
-- desajuste era el origen del rótulo equivocado en el resumen. Se reemplaza
-- por dos campos que sí miden lo que dicen:
--
-- `sin_contactar`: foto de stock actual (como antes `visitas_pendientes`, no
-- del período) de leads derivados que el equipo todavía no tocó — status en
-- vez de visitas, y ambos timestamps null para no volver a contar los que ya
-- se cerraron sin haberse marcado como contactados a mano.
--
-- `visitas_confirmadas`: visitas con estado='confirmada', el estado que sí
-- significa que hay una visita agendada. El Worker decide si la muestra.
--
-- DROP antes del CREATE: Postgres rechaza CREATE OR REPLACE cuando cambian
-- los nombres de las columnas de salida (SQLSTATE 42P13), aunque la posición
-- y el tipo se mantengan.
DROP FUNCTION IF EXISTS public.resumen_diario(date);

CREATE FUNCTION public.resumen_diario(p_fecha date)
RETURNS TABLE (
  conversaciones_nuevas integer,
  leads_calificados integer,
  sin_contactar integer,
  visitas_confirmadas integer,
  comunas_top jsonb,
  score_hot integer,
  score_warm integer,
  score_cold integer,
  score_sin integer
)
LANGUAGE sql
STABLE
AS $$
  WITH rango AS (
    SELECT
      (p_fecha::timestamp AT TIME ZONE 'America/Santiago')       AS desde,
      ((p_fecha + 1)::timestamp AT TIME ZONE 'America/Santiago') AS hasta
  ),
  leads_dia AS (
    SELECT l.*
    FROM public.leads l, rango
    WHERE l.created_at >= rango.desde AND l.created_at < rango.hasta
  ),
  comunas AS (
    SELECT jsonb_agg(t) AS valor
    FROM (
      SELECT comuna, count(*)::int AS n
      FROM leads_dia
      WHERE comuna IS NOT NULL AND comuna <> ''
      GROUP BY comuna
      ORDER BY count(*) DESC, comuna
      LIMIT 5
    ) t
  )
  SELECT
    (SELECT count(*)::int FROM leads_dia),
    (SELECT count(*)::int FROM public.visitas v, rango
       WHERE v.created_at >= rango.desde AND v.created_at < rango.hasta),
    (SELECT count(*)::int FROM public.leads
       WHERE status = 'derivado' AND contactado_en IS NULL AND cerrado_en IS NULL),
    (SELECT count(*)::int FROM public.visitas WHERE estado = 'confirmada'),
    COALESCE((SELECT valor FROM comunas), '[]'::jsonb),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'hot'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'warm'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'cold'),
    (SELECT count(*)::int FROM leads_dia WHERE score IS NULL);
$$;

NOTIFY pgrst, 'reload schema';
