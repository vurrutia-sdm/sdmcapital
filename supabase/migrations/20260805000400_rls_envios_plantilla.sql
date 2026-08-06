-- Cierra envios_plantilla, la única tabla de `public` que quedaba con
-- relrowsecurity = false.
--
-- No tenía ninguna política, y el rol `anon` conserva grants de
-- SELECT/INSERT/UPDATE/DELETE/TRUNCATE sobre ella. Con la anon key del bundle
-- cualquiera podía leerla, llenarla de basura o vaciarla.
--
-- Es tabla de Sofía (registro de envíos de plantillas de WhatsApp). El Worker
-- vive en otro repo y accede con service_role, que no pasa por RLS. La
-- evidencia de que ese es el patrón: las otras tablas de Sofía
-- —eventos_turno, mensajes_pendientes, decisiones_shadow,
-- eventos_procesados— llevan meses recibiendo escrituras con RLS activo y
-- CERO políticas, o sea deny-all tanto para anon como para authenticated.
--
-- Por eso acá no se le agrega ninguna política a anon.

ALTER TABLE public.envios_plantilla ENABLE ROW LEVEL SECURITY;

CREATE POLICY envios_plantilla_all_auth
  ON public.envios_plantilla FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Sin política para anon: es una tabla interna. El Worker de Sofía
-- accede con service_role, que no pasa por RLS.

NOTIFY pgrst, 'reload schema';
