-- Resumen diario del equipo (correo + WhatsApp, disparado desde el Worker de
-- Sofía). p_fecha es la fecha de calendario en Chile — nunca UTC, ver
-- SINCRONIA.md "TRAMPA · toISOString() devuelve UTC" — y el rango horario se
-- calcula acá con AT TIME ZONE para no repetir esa aritmética en el Worker.
--
-- leads_calificados usa `visitas`, no un timestamp en `leads`: `leads` no
-- tiene columna de cuándo pasó a ready, pero `visitas` se inserta una única
-- vez por lead, exactamente en esa transición (marcarLeadReady + createVisita
-- en index.js, capa 5). Es la misma fecha, vía la tabla que sí la guarda.
--
-- visitas_pendientes es una foto del stock actual (estado='pendiente'), no un
-- conteo del período: importa si hay trabajo esperando, no cuándo se generó.
CREATE OR REPLACE FUNCTION public.resumen_diario(p_fecha date)
RETURNS TABLE (
  conversaciones_nuevas integer,
  leads_calificados integer,
  visitas_pendientes integer,
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
    (SELECT count(*)::int FROM public.visitas WHERE estado = 'pendiente'),
    COALESCE((SELECT valor FROM comunas), '[]'::jsonb),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'hot'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'warm'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'cold'),
    (SELECT count(*)::int FROM leads_dia WHERE score IS NULL);
$$;

NOTIFY pgrst, 'reload schema';
