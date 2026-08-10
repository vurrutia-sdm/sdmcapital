-- Cierra la lectura anónima de las fichas de cliente.
--
-- `20260805000300` dejó estas dos políticas a propósito, con este criterio
-- escrito: «lectura anónima (el cliente abre su ficha sin login)». **Ese caso de
-- uso no existe.** Confirmado con Roberto: la ficha se le entrega al cliente
-- como PDF descargado, nunca como enlace a una URL del sitio.
--
-- Sin ese caso, la política concede lectura anónima a datos personales de
-- clientes —nombre, teléfono, correo— y a las propiedades asociadas, con la
-- anon key que viaja en el bundle público. Cualquiera podía leerlas enteras.
--
-- Las cinco pantallas que las consultan viven bajo `/admin/ficha-cliente/…` y
-- las cinco pasan por `useAdminAuth`, o sea por una sesión de Supabase, o sea
-- por el rol `authenticated`:
--
--   FichaClientesLista · FichaClienteDetalle · FichaClienteNueva
--   FichaClienteVer    · FichaClienteEditar
--
-- `ficha_clientes_all_auth` y `ficha_propiedades_all_auth` —FOR ALL TO
-- authenticated, USING (true)— siguen en pie y son las que usan. No se tocan.
--
-- El PDF tampoco depende de `anon`: `FichaClienteVer` lo genera con
-- `window.print()` sobre la página ya renderizada, sin ninguna consulta aparte.
--
-- Va sin `NOTIFY pgrst, 'reload schema'` a diferencia de sus vecinas: el caché
-- de PostgREST guarda tablas, columnas y funciones, no políticas. Una política
-- la evalúa Postgres en cada consulta y el efecto es inmediato. Poner el NOTIFY
-- acá sugeriría lo contrario.
--
-- SIN `IF EXISTS` A PROPÓSITO: si alguna de las dos ya no estuviera, esta
-- migración debe fallar y no seguir en silencio.

DROP POLICY ficha_clientes_select_anon ON public.ficha_clientes;
DROP POLICY ficha_propiedades_select_anon ON public.ficha_propiedades;

-- NO SE TOCA `sdm_agentes_select_anon`, que viene de la misma migración y con
-- el mismo criterio dudoso. Queda fuera porque nadie ha comprobado si algo
-- público lee esa tabla, y cerrarla «por simetría» sin esa comprobación es
-- exactamente lo que dejó estas dos abiertas. Anotado en SINCRONIA.md.
