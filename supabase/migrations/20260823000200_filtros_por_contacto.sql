-- Dejar de filtrar por `leads.status` y pasar a `contactado_en` / `cerrado_en`.
--
-- `status` tiene tres escritores y cinco valores. El Worker escribe 'nuevo',
-- 'calificando' y 'derivado' (index.js, `procesarLote`); el admin escribe
-- además 'visita_confirmada', que el Worker no conoce. Las dos funciones de
-- acá excluían leads por una lista de valores de `status`, y esa lista nunca
-- incluyó 'visita_confirmada': cualquier lead que el equipo cerrara pasando
-- por ese estado seguía contando como frío. `contactado_en` / `cerrado_en`
-- (migración `20260823000000`) no dependen de quién escriba `status`.
--
-- Ninguna de las dos cambia nombres ni tipos de columnas de salida, así que
-- `CREATE OR REPLACE` basta y no hace falta `DROP` (que sí haría falta con
-- SQLSTATE 42P13 — ver `20260823000100`, donde el rename de un campo obligó a
-- dropear). Al no dropear, el ACL sobrevive intacto: las dos quedan como están
-- hoy, PUBLIC/anon/authenticated/service_role con EXECUTE, y ambas siguen
-- siendo SECURITY INVOKER (nunca fueron DEFINER).

-- ─────────────────────────────────────────────────────────────────────────────
-- `seguimiento_candidatos`: PRIMERA VEZ QUE SE VERSIONA.
--
-- Esta función existía solo en la base, aplicada a mano por el SQL Editor. El
-- cuerpo de acá es el que devolvía `pg_get_functiondef` el 2026-08-23, con un
-- único cambio de lógica —la condición de exclusión— y su comentario
-- reescrito, porque el viejo describía una condición que ya no está.
-- Todo lo demás queda idéntico a propósito, incluido el formato.
CREATE OR REPLACE FUNCTION public.seguimiento_candidatos(
  p_plantilla text,
  p_dias_min integer,
  p_dias_max integer,
  p_desde timestamp with time zone,
  p_limite integer
)
RETURNS TABLE(
  lead_id uuid,
  wa_phone text,
  nombre text,
  comuna text,
  ult_cliente timestamp with time zone,
  dias_sin_responder numeric
)
LANGUAGE sql
STABLE
AS $function$
  with ult as (
    select m.lead_id,
           max(m.created_at) filter (where m.rol = 'cliente') as ult_cliente,
           (array_agg(m.rol order by m.created_at desc))[1]   as ultimo_rol
      from public.mensajes m group by m.lead_id
  )
  select l.id, l.wa_phone, btrim(l.nombre), btrim(l.comuna), u.ult_cliente,
         round((extract(epoch from (now() - u.ult_cliente)) / 86400.0)::numeric, 2)
    from public.leads l
    join ult u on u.lead_id = l.id
   where l.opt_out_at is null
     and l.modo = 'auto'
     -- Preguntarle "sigue buscando?" a alguien que el equipo ya tocó se
     -- contradice con lo que el equipo decidió. Antes esto se leía de una
     -- lista de valores de `status`, que dejaba fuera 'visita_confirmada'.
     and l.contactado_en is null and l.cerrado_en is null
     and coalesce(btrim(l.nombre), '') <> ''
     and coalesce(btrim(l.comuna), '') <> ''
     and u.ult_cliente is not null
     and u.ultimo_rol = 'sofia'
     and u.ult_cliente > p_desde
     and now() - u.ult_cliente >= make_interval(days => p_dias_min)
     and now() - u.ult_cliente <= make_interval(days => p_dias_max)
     and not exists (select 1 from public.visitas v
                      where v.lead_id = l.id and v.estado = 'confirmada')
     and not exists (select 1 from public.envios_plantilla e
                      where e.lead_id = l.id and e.plantilla = p_plantilla)
   order by u.ult_cliente
   limit p_limite
$function$;

-- ─────────────────────────────────────────────────────────────────────────────
-- `resumen_diario`: `sin_contactar` deja de mirar `status`.
--
-- Cambia UNA subconsulta respecto de `20260823000100`. El resto —el rango
-- horario en Chile, comunas_top, los cuatro scores, visitas_confirmadas— es
-- idéntico, y las columnas de salida no se tocan.
CREATE OR REPLACE FUNCTION public.resumen_diario(p_fecha date)
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
       WHERE contactado_en IS NULL AND cerrado_en IS NULL),
    (SELECT count(*)::int FROM public.visitas WHERE estado = 'confirmada'),
    COALESCE((SELECT valor FROM comunas), '[]'::jsonb),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'hot'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'warm'),
    (SELECT count(*)::int FROM leads_dia WHERE score = 'cold'),
    (SELECT count(*)::int FROM leads_dia WHERE score IS NULL);
$$;

NOTIFY pgrst, 'reload schema';
