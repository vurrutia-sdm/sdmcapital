-- Cierra el bypass de RLS por vista en las cuatro vistas de métricas.
--
-- `metricas_calidad`, `metricas_costo`, `metricas_descartes` y
-- `metricas_operacion` son vistas sin `security_invoker` y con dueño
-- `postgres`. Una vista sin esa opción se evalúa con los privilegios de su
-- dueño; `postgres` es superusuario y salta RLS.
--
-- Como `anon` tiene GRANT SELECT sobre las cuatro, cualquiera con la anon key
-- del bundle podía leer a través de ellas los datos de las tablas internas de
-- Sofía que están en deny-all: eventos_turno, mensajes_pendientes,
-- decisiones_shadow y eventos_procesados.
--
-- Medido antes de aplicar, con la anon key:
--
--   metricas_calidad     3 filas      eventos_turno         0 filas
--   metricas_costo       3 filas      mensajes_pendientes   0 filas
--   metricas_descartes   1 fila       decisiones_shadow     0 filas
--   metricas_operacion   3 filas      eventos_procesados    0 filas
--
-- Las tablas negaban el acceso y las vistas lo concedían igual.
--
-- Con `security_invoker = true` la vista se evalúa con los permisos de quien
-- consulta, así que `anon` choca con el RLS de las tablas base, que ya es
-- correcto. No hace falta crear ni modificar ninguna política.
--
-- IMPORTANTE para el futuro: este agujero no aparece en `pg_policies` ni en
-- `pg_class` filtrado por `relkind = 'r'`. Toda vista nueva sobre tablas con
-- RLS debe crearse con `WITH (security_invoker = true)`.

ALTER VIEW public.metricas_calidad   SET (security_invoker = true);
ALTER VIEW public.metricas_costo     SET (security_invoker = true);
ALTER VIEW public.metricas_descartes SET (security_invoker = true);
ALTER VIEW public.metricas_operacion SET (security_invoker = true);

NOTIFY pgrst, 'reload schema';
