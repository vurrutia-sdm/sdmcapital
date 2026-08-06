-- Cierra la escritura anónima en propiedades, ficha_clientes,
-- ficha_propiedades y sdm_agentes.
--
-- El inventario de pg_policies mostró que las cuatro tenían políticas
-- PERMISSIVE sobre el rol `public` con FOR ALL / USING (true). `public`
-- incluye a `anon`, y la anon key viaja en el bundle del sitio: cualquiera
-- podía hacer DELETE o UPDATE sobre ellas.
--
-- En propiedades ya existía una política correcta (`propiedades_write`), pero
-- quedaba anulada: las políticas permisivas se combinan con OR, así que basta
-- una que diga USING (true) para que el resto no restrinja nada. Por eso acá
-- se eliminan las viejas en lugar de sumar otra encima.
--
-- Las políticas `Allow all` NO deben recrearse desde el dashboard. Si vuelven,
-- vuelve el agujero completo.
--
-- Criterio por tabla:
--   propiedades        lectura anónima solo de activas + escritura autenticada
--   ficha_clientes     lectura anónima (el cliente abre su ficha sin login)
--   ficha_propiedades  ídem
--   sdm_agentes        ídem
--
-- Verificado antes de aplicar: las 15 escrituras a estas tablas viven en
-- AdminPage.tsx y src/pages/admin/*, todas detrás de sesión de Supabase. No
-- hay ninguna ruta pública que escriba.

-- propiedades: lectura anónima solo de activas, escritura solo autenticada
ALTER TABLE public.propiedades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.propiedades;
DROP POLICY IF EXISTS "Allow all updates" ON public.propiedades;
DROP POLICY IF EXISTS "Allow authenticated updates" ON public.propiedades;
DROP POLICY IF EXISTS "propiedades_select" ON public.propiedades;
DROP POLICY IF EXISTS "propiedades_write" ON public.propiedades;

CREATE POLICY propiedades_select_anon
  ON public.propiedades FOR SELECT TO anon
  USING (activo IS TRUE);

CREATE POLICY propiedades_all_auth
  ON public.propiedades FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ficha_clientes: se mantiene la lectura anónima (el cliente abre la ficha
-- sin login), se quita la escritura
ALTER TABLE public.ficha_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.ficha_clientes;

CREATE POLICY ficha_clientes_select_anon
  ON public.ficha_clientes FOR SELECT TO anon USING (true);

CREATE POLICY ficha_clientes_all_auth
  ON public.ficha_clientes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ficha_propiedades: mismo criterio
ALTER TABLE public.ficha_propiedades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.ficha_propiedades;

CREATE POLICY ficha_propiedades_select_anon
  ON public.ficha_propiedades FOR SELECT TO anon USING (true);

CREATE POLICY ficha_propiedades_all_auth
  ON public.ficha_propiedades FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- sdm_agentes: mismo criterio
ALTER TABLE public.sdm_agentes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.sdm_agentes;

CREATE POLICY sdm_agentes_select_anon
  ON public.sdm_agentes FOR SELECT TO anon USING (true);

CREATE POLICY sdm_agentes_all_auth
  ON public.sdm_agentes FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
