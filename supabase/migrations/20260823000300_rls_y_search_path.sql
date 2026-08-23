-- RLS: cerrar `envios_plantilla`, y `search_path` fijo en las 19 funciones.
--
-- La alerta que originó esto («tablas con RLS deshabilitado») estaba OBSOLETA:
-- las 26 tablas de `public` ya tienen RLS activo, y el advisor de seguridad no
-- devuelve ni un hallazgo de RLS. Sus 20 avisos eran 19
-- `function_search_path_mutable` y 1 `auth_leaked_password_protection`.
--
-- `migracion_r2` NO SE TOCA. Es el registro de la migración de imágenes y el
-- borrado de los 390 huérfanos de Supabase Storage está pendiente hasta el
-- 2026-09-01. Sin ese registro no hay mapa de qué se migró. Ya está en
-- deny-all (RLS activo, 0 políticas), así que no hacía falta tocarla igual.


-- ── 1. `envios_plantilla` baja a deny-all ────────────────────────────────────
--
-- Tenía UNA política: `ALL` con `qual = true` y `with_check = true` para
-- `authenticated`. No era un «Allow all» sobre `public` —`anon` nunca entró—
-- pero sí un permiso sin condición sobre las cuatro operaciones, y sin ningún
-- consumidor: la tabla no aparece en `src/` ni en `functions/`.
--
-- SE BORRA LA PERMISIVA, no se le suma una restrictiva encima: las permisivas
-- se combinan con OR, así que añadir otra política no habría anulado ésta.
--
-- Queda RLS + 0 políticas, igual que sus cuatro hermanas de Sofía
-- (`decisiones_shadow`, `eventos_procesados`, `eventos_turno`,
-- `mensajes_pendientes`). El Worker sigue escribiendo: usa `service_role`
-- (`index.js:2435`, `sbHeaders()` manda `SUPABASE_SERVICE_KEY`), que bypasea
-- RLS por definición.
DROP POLICY IF EXISTS envios_plantilla_all_auth ON public.envios_plantilla;


-- ── 2. Las 17 funciones que solo vivían en la base ───────────────────────────
--
-- DE 19 FUNCIONES, 17 NO ESTABAN VERSIONADAS EN NINGÚN REPO. Se aplicaron a
-- mano por el SQL Editor y solo existían en producción: si alguien las pisaba,
-- no había de dónde recuperarlas. Las únicas dos versionadas eran
-- `resumen_diario` y `seguimiento_candidatos`, de hoy mismo.
--
-- Los cuerpos de abajo son EXACTAMENTE lo que devolvía `pg_get_functiondef` el
-- 2026-08-23, volcados a este archivo por script y no transcritos a mano. Como
-- son idénticos a lo que ya está en la base, aplicarlos no cambia nada: el
-- objetivo es que queden en el repo.
--
-- Las 19 son SECURITY INVOKER y ninguna referencia un esquema fuera de
-- `public` —verificado sobre los cuerpos—, así que no hay `SECURITY DEFINER`
-- ni GRANT que preservar más allá del ACL, que `CREATE OR REPLACE` conserva.

CREATE OR REPLACE FUNCTION public.alerta_debe_enviar(p_clave text, p_minutos integer DEFAULT 60)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
declare v_ok boolean;
begin
  -- Atomico: si la clave no existe la crea; si existe, solo la actualiza cuando
  -- el ultimo aviso ya es mas viejo que la ventana. El RETURNING solo devuelve
  -- fila si hubo insert o update, y eso es exactamente 'te toca enviar'.
  -- Sin esto, dos workers concurrentes leerian el mismo timestamp viejo y
  -- mandarian dos correos.
  insert into config (clave, valor) values (p_clave, now()::text)
  on conflict (clave) do update set valor = now()::text
    where config.valor::timestamptz < now() - make_interval(mins => p_minutos)
  returning true into v_ok;
  return coalesce(v_ok, false);
end $function$;

CREATE OR REPLACE FUNCTION public.avance_shadow()
 RETURNS TABLE(leads_distintos bigint, turnos bigint, dias_corridos integer, pct_score integer, pct_ready integer, pct_handoff integer, criterio_cumplido boolean)
 LANGUAGE sql
 STABLE
AS $function$
  select count(distinct lead_id),
         count(*),
         coalesce(extract(day from (now() - min(creado_en)))::int, 0),
         coalesce(round(100.0 * count(*) filter (where coincide_score)   / nullif(count(*),0))::int, 0),
         coalesce(round(100.0 * count(*) filter (where coincide_ready)   / nullif(count(*),0))::int, 0),
         coalesce(round(100.0 * count(*) filter (where coincide_handoff) / nullif(count(*),0))::int, 0),
         (count(distinct lead_id) >= 20 or coalesce(extract(day from (now() - min(creado_en)))::int, 0) >= 14)
    from public.decisiones_shadow;
$function$;

CREATE OR REPLACE FUNCTION public.conversation_append(p_lead_id uuid, p_turnos jsonb, p_mensajes jsonb DEFAULT '[]'::jsonb, p_wa_phone text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
begin
  update public.leads
     set conversation = conversation || p_turnos,
         last_message_at = now()
   where id = p_lead_id;

  if not found then
    return false;
  end if;

  if p_wa_phone is not null and jsonb_array_length(p_mensajes) > 0 then
    insert into public.mensajes (lead_id, wa_phone, rol, contenido, tipo)
    select p_lead_id, p_wa_phone, m->>'rol', m->>'contenido', coalesce(m->>'tipo','texto')
      from jsonb_array_elements(p_mensajes) with ordinality as e(m, ord)
     order by e.ord;
  end if;

  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.conversation_desde_mensajes(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
  select coalesce(jsonb_agg(t order by t_ord), '[]'::jsonb)
    from (
      select case
               when rol = 'cliente' then jsonb_build_object('role','user','content',contenido)
               when rol = 'humano'  then jsonb_build_object('role','assistant','content','[Equipo SDM - mensaje manual]: ' || contenido)
               else                      jsonb_build_object('role','assistant','content',contenido)
             end as t,
             row_number() over (order by created_at asc, id asc) as t_ord
        from public.mensajes
       where lead_id = p_lead_id
    ) s;
$function$;

CREATE OR REPLACE FUNCTION public.conversation_rebuild(p_lead_id uuid)
 RETURNS jsonb
 LANGUAGE sql
AS $function$
  update public.leads
     set conversation = public.conversation_desde_mensajes(p_lead_id)
   where id = p_lead_id
  returning conversation;
$function$;

CREATE OR REPLACE FUNCTION public.generate_slug(titulo text, comuna text, dormitorios integer)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  base text;
  candidate text;
  counter int := 0;
BEGIN
  base := titulo || '-' || COALESCE(comuna, '') ||
    CASE WHEN dormitorios IS NOT NULL THEN '-' || dormitorios || 'd' ELSE '' END;
  
  -- Reemplazos manuales de tildes
  base := replace(base, 'á', 'a'); base := replace(base, 'Á', 'a');
  base := replace(base, 'é', 'e'); base := replace(base, 'É', 'e');
  base := replace(base, 'í', 'i'); base := replace(base, 'Í', 'i');
  base := replace(base, 'ó', 'o'); base := replace(base, 'Ó', 'o');
  base := replace(base, 'ú', 'u'); base := replace(base, 'Ú', 'u');
  base := replace(base, 'ü', 'u'); base := replace(base, 'Ü', 'u');
  base := replace(base, 'ñ', 'n'); base := replace(base, 'Ñ', 'n');
  
  base := lower(base);
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := trim(both '-' from base);
  
  candidate := base;
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM propiedades WHERE slug = candidate);
    counter := counter + 1;
    candidate := base || '-' || counter;
  END LOOP;
  RETURN candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.leads_con_historial_divergente()
 RETURNS TABLE(lead_id uuid, turnos_conv integer, filas_mensajes bigint, diferencia bigint)
 LANGUAGE sql
 STABLE
AS $function$
  select l.id,
         jsonb_array_length(l.conversation),
         count(m.id),
         jsonb_array_length(l.conversation) - count(m.id)
    from public.leads l
    left join public.mensajes m on m.lead_id = l.id
   group by l.id, l.conversation
  having jsonb_array_length(l.conversation) <> count(m.id);
$function$;

CREATE OR REPLACE FUNCTION public.leads_con_pendientes_huerfanos(p_antiguedad_seg integer)
 RETURNS TABLE(lead_id uuid)
 LANGUAGE sql
AS $function$
  select distinct p.lead_id
    from public.mensajes_pendientes p
    join public.leads l on l.id = p.lead_id
   where p.procesado_en is null
     and p.recibido_en < now() - make_interval(secs => p_antiguedad_seg)
     and (l.lease_hasta is null or l.lease_hasta < now());
$function$;

CREATE OR REPLACE FUNCTION public.lease_liberar(p_lead_id uuid, p_owner text)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  update public.leads
     set lease_owner = null, lease_hasta = null
   where id = p_lead_id and lease_owner = p_owner
  returning true;
$function$;

CREATE OR REPLACE FUNCTION public.lease_renovar(p_lead_id uuid, p_owner text, p_ttl_seg integer)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  update public.leads
     set lease_hasta = now() + make_interval(secs => p_ttl_seg)
   where id = p_lead_id and lease_owner = p_owner
  returning true;
$function$;

CREATE OR REPLACE FUNCTION public.lease_tomar(p_lead_id uuid, p_owner text, p_ttl_seg integer)
 RETURNS boolean
 LANGUAGE sql
AS $function$
  update public.leads
     set lease_owner = p_owner,
         lease_hasta = now() + make_interval(secs => p_ttl_seg)
   where id = p_lead_id
     and (lease_hasta is null or lease_hasta < now())
  returning true;
$function$;

CREATE OR REPLACE FUNCTION public.metricas_conversation()
 RETURNS TABLE(leads_con_historial bigint, chars_p95 integer, chars_max integer, tokens_p95_aprox integer, tokens_max_aprox integer, turnos_max integer)
 LANGUAGE sql
 STABLE
AS $function$
  select count(*),
         coalesce(percentile_cont(0.95) within group (order by length(conversation::text)), 0)::int,
         coalesce(max(length(conversation::text)), 0)::int,
         (coalesce(percentile_cont(0.95) within group (order by length(conversation::text)), 0) / 3.6)::int,
         (coalesce(max(length(conversation::text)), 0) / 3.6)::int,
         coalesce(max(jsonb_array_length(conversation)), 0)::int
    from public.leads
   where jsonb_array_length(conversation) > 0;
$function$;

CREATE OR REPLACE FUNCTION public.pendientes_atascados(p_horas integer DEFAULT 24)
 RETURNS bigint
 LANGUAGE sql
 STABLE
AS $function$
  select count(*) from public.mensajes_pendientes
   where procesado_en is null and recibido_en < now() - make_interval(hours => p_horas);
$function$;

CREATE OR REPLACE FUNCTION public.procesar_lote(p_lead_id uuid, p_owner text, p_turnos jsonb, p_ids_pendientes bigint[], p_ttl_seg integer, p_mensajes jsonb DEFAULT '[]'::jsonb, p_wa_phone text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
begin
  update public.leads
     set conversation    = conversation || p_turnos,
         last_message_at = now(),
         lease_hasta     = now() + make_interval(secs => p_ttl_seg)
   where id = p_lead_id and lease_owner = p_owner;

  if not found then
    return false;
  end if;

  if p_wa_phone is not null and jsonb_array_length(p_mensajes) > 0 then
    insert into public.mensajes (lead_id, wa_phone, rol, contenido, tipo)
    select p_lead_id, p_wa_phone, m->>'rol', m->>'contenido', coalesce(m->>'tipo','texto')
      from jsonb_array_elements(p_mensajes) with ordinality as e(m, ord)
     order by e.ord;
  end if;

  update public.mensajes_pendientes
     set procesado_en = now()
   where id = any(p_ids_pendientes) and procesado_en is null;

  return true;
end $function$;

CREATE OR REPLACE FUNCTION public.purgar_tablas()
 RETURNS TABLE(tabla text, borradas bigint)
 LANGUAGE plpgsql
AS $function$
declare n bigint;
begin
  delete from public.eventos_procesados where procesado_en < now() - interval '30 days';
  get diagnostics n = row_count;  tabla := 'eventos_procesados'; borradas := n; return next;

  delete from public.mensajes_pendientes
   where procesado_en is not null and procesado_en < now() - interval '7 days';
  get diagnostics n = row_count;  tabla := 'mensajes_pendientes'; borradas := n; return next;

  delete from public.decisiones_shadow where creado_en < now() - interval '90 days';
  get diagnostics n = row_count;  tabla := 'decisiones_shadow'; borradas := n; return next;

  delete from public.eventos_turno where creado_en < now() - interval '90 days';
  get diagnostics n = row_count;  tabla := 'eventos_turno'; borradas := n; return next;
end $function$;

CREATE OR REPLACE FUNCTION public.resumen_semanal()
 RETURNS TABLE(turnos bigint, leads bigint, usd numeric, pct_acierto_cache integer, degradados bigint, ms_p95 integer)
 LANGUAGE sql
 STABLE
AS $function$
  select count(*),
         count(distinct lead_id),
         round((coalesce(sum(tokens_input),0)*3.00 + coalesce(sum(tokens_output),0)*15.00
              + coalesce(sum(tokens_cache_write),0)*3.75 + coalesce(sum(tokens_cache_read),0)*0.30)/1000000.0, 4),
         coalesce(round(100.0*coalesce(sum(tokens_cache_read),0)
              / nullif(coalesce(sum(tokens_cache_read),0)+coalesce(sum(tokens_cache_write),0),0))::int, 0),
         count(*) filter (where resultado <> 'ok'),
         coalesce(percentile_cont(0.95) within group (order by ms_total)::int, 0)
    from public.eventos_turno
   where creado_en > now() - interval '7 days';
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end; $function$;


-- ── 3. `search_path` fijo ────────────────────────────────────────────────────
--
-- VA DESPUÉS DEL BLOQUE ANTERIOR Y NO ANTES, a propósito: un
-- `CREATE OR REPLACE FUNCTION` sin cláusula `SET` REINICIA la configuración de
-- la función, así que recrearlas después de los ALTER borraría el
-- `search_path` que acaban de fijar. Si alguna vez se vuelve a ejecutar solo el
-- bloque 2, hay que volver a correr éste.
--
-- `ALTER` y no recrear: es el cambio mínimo y no puede alterar el cuerpo por
-- accidente. Aplica a las 19 porque todas son `prokind = 'f'`.
--
-- El valor es `public` y no `''`: la receta de Supabase de vaciarlo exige
-- calificar cada referencia dentro del cuerpo, y estas funciones nombran sus
-- tablas sin esquema en varios sitios. `pg_catalog` se busca implícitamente
-- antes que nada, así que `public` basta para dejar el camino fijo.

ALTER FUNCTION public.alerta_debe_enviar(p_clave text, p_minutos integer) SET search_path = public;
ALTER FUNCTION public.avance_shadow() SET search_path = public;
ALTER FUNCTION public.conversation_append(p_lead_id uuid, p_turnos jsonb, p_mensajes jsonb, p_wa_phone text) SET search_path = public;
ALTER FUNCTION public.conversation_desde_mensajes(p_lead_id uuid) SET search_path = public;
ALTER FUNCTION public.conversation_rebuild(p_lead_id uuid) SET search_path = public;
ALTER FUNCTION public.generate_slug(titulo text, comuna text, dormitorios integer) SET search_path = public;
ALTER FUNCTION public.leads_con_historial_divergente() SET search_path = public;
ALTER FUNCTION public.leads_con_pendientes_huerfanos(p_antiguedad_seg integer) SET search_path = public;
ALTER FUNCTION public.lease_liberar(p_lead_id uuid, p_owner text) SET search_path = public;
ALTER FUNCTION public.lease_renovar(p_lead_id uuid, p_owner text, p_ttl_seg integer) SET search_path = public;
ALTER FUNCTION public.lease_tomar(p_lead_id uuid, p_owner text, p_ttl_seg integer) SET search_path = public;
ALTER FUNCTION public.metricas_conversation() SET search_path = public;
ALTER FUNCTION public.pendientes_atascados(p_horas integer) SET search_path = public;
ALTER FUNCTION public.procesar_lote(p_lead_id uuid, p_owner text, p_turnos jsonb, p_ids_pendientes bigint[], p_ttl_seg integer, p_mensajes jsonb, p_wa_phone text) SET search_path = public;
ALTER FUNCTION public.purgar_tablas() SET search_path = public;
ALTER FUNCTION public.resumen_diario(p_fecha date) SET search_path = public;
ALTER FUNCTION public.resumen_semanal() SET search_path = public;
ALTER FUNCTION public.seguimiento_candidatos(p_plantilla text, p_dias_min integer, p_dias_max integer, p_desde timestamp with time zone, p_limite integer) SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
