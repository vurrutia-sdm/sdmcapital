# Sincronía entre sesiones de Claude Code

Varias sesiones de Claude Code trabajan sobre este mismo repo en paralelo. Este
archivo define quién toca qué y las reglas para no pisarse.

## División de dominios

### Sesión Sofía / chatbot

- El Worker
- `functions/`
- Integraciones del bot

### Sesión web pública

- `src/pages/`
- `src/components/sections/`
- `src/components/ui/`

### Sesión admin

- `src/pages/AdminPage.tsx`
- `src/components/cotizaciones/`
- `src/components/tarjetas/`

> `src/pages/AdminPage.tsx` es de la sesión admin aunque viva bajo `src/pages/`,
> que por lo demás es de la sesión web pública. Lo mismo para el resto de
> `src/pages/admin/`.
>
> Hay zonas que ninguna sesión posee en exclusiva —`src/lib/`, `src/types/`,
> `src/hooks/`, `src/styles/globals.css`, `package.json`, `vite.config.ts`—.
> Tocarlas afecta a todas: revisar `git status` y avisar en el registro de abajo
> antes de modificarlas.

## Reglas obligatorias para todas las sesiones

### 1. Commitear antes de deployar, nunca al revés

El deploy toma el **working tree completo**, no lo commiteado. Si hay cambios sin
commitear —propios o de otra sesión— se van a producción igual, mezclados con lo
que sí querías desplegar, y sin quedar registrados en ningún commit.

Orden correcto:

```bash
git status          # verificar que solo esté lo tuyo
git add <archivos>  # nunca 'git add .' con varias sesiones activas
git commit -m "..."
npm run build && npx wrangler pages deploy dist --project-name=sdmcapitalpage
```

Si wrangler avisa `Your working directory is a git repo and has uncommitted
changes`, ese aviso no es cosmético: está diciendo que estás desplegando algo que
no está versionado.

### 2. Correr `git status` al iniciar sesión

Antes de editar cualquier archivo:

```bash
git status
```

Si aparecen cambios sin commitear que no son tuyos, **detente y pregunta**. No
edites, no commitees por tu cuenta, no hagas `git checkout` para "limpiar": ese
trabajo es de otra sesión y puede estar a medio terminar o ya desplegado.

## En qué está trabajando cada sesión

Cada sesión anota acá lo que tiene en curso, con fecha. Al terminar, se borra la
línea o se marca como cerrada.

| Fecha | Sesión | En qué está | Estado |
|---|---|---|---|
| 2026-08-02 | Admin | Cotizaciones: columnas `prop_pais`/`prop_ciudad` en Supabase, errores de escritura visibles en todo el admin (`avisarError`), catálogo como modo por defecto en el Paso 2, PDF bajo demanda | **Cerrada** — todo commiteado y desplegado |
| 2026-08-02 | Web pública | Componente `SinArriendos` en `PropiedadesPage.tsx` | Cerrado — commit `0b7e80a`, ya en producción |
| 2026-08-05 | Inventario oficinas | Carga de 10 edificios de oficinas en arriendo (42 unidades). Toca `src/types/index.ts`, `supabase/migrations/` y `src/pages/PropiedadDetailPage.tsx` | Commit `a1a0728`, pusheado |
| 2026-08-05 | Inventario oficinas (cambio de estrategia) | Los 10 edificios pasan a referencia interna permanente; se publica una ficha genérica en su lugar. Solo toca `supabase/migrations/` | Cerrada — commit `06d32b1`, migración aplicada y pusheada. Sin deploy propio: era SQL, no cambiaba el bundle |
| 2026-08-05 | Banner promocional | Barra promocional en el home controlada desde el admin. Toca `src/components/sections/BannerPromo.tsx`, `src/pages/HomePage.tsx` y `ContenidoAdmin` dentro de `src/pages/AdminPage.tsx` | Cerrada — commiteada y desplegada |
| 2026-08-05 | RLS / exposición de datos | Diagnóstico de lectura anónima en Supabase. Solo investigación | Cerrada — derivó en la migración `20260805000300` |
| 2026-08-05 | RLS / cierre de escritura anónima | Migración `20260805000300`: RLS en `propiedades`, `ficha_clientes`, `ficha_propiedades` y `sdm_agentes`. Solo toca `supabase/migrations/` | Cerrada — aplicada y verificada contra producción |
| 2026-08-05 | RLS / `envios_plantilla` | Migración `20260805000400`: RLS en la última tabla de `public` que lo tenía apagado. Tabla de Sofía. Solo toca `supabase/migrations/` | Cerrada — aplicada y verificada. **Falta confirmar que Sofía siga registrando envíos** |
| — | Sofía / chatbot | — | — |

### Sesión RLS — 2026-08-05

Diagnóstico inicial: **las 19 tablas de `public` eran legibles con la anon
key**, que viaja en el bundle del sitio. `propiedades` devolvía las 65 filas,
incluidas las 12 con `activo = false` y su `direccion`. El inventario de
`pg_policies` mostró además políticas PERMISSIVE sobre el rol `public` con
`FOR ALL / USING (true)`: como `public` incluye a `anon`, cualquiera podía
hacer DELETE o UPDATE sobre cuatro tablas.

Se aplicó la migración `20260805000300_rls_cerrar_escritura_anonima.sql` sobre
`propiedades`, `ficha_clientes`, `ficha_propiedades` y `sdm_agentes`.

#### Las políticas `Allow all` fueron ELIMINADAS. No recrearlas.

Se borraron `"Allow all"`, `"Allow all updates"`, `"Allow authenticated
updates"`, `propiedades_select` y `propiedades_write`.

El motivo de borrarlas en vez de sumar una política nueva encima: **las
políticas permisivas se combinan con OR**. Basta una que diga `USING (true)`
para que todas las demás dejen de restringir nada. De hecho `propiedades`
*ya tenía* una política de escritura correcta (`propiedades_write`), y estaba
completamente anulada por las permisivas que convivían con ella.

Si alguien recrea una `Allow all` desde el dashboard —es el default que ofrece
la UI al habilitar RLS— el agujero vuelve entero y en silencio: nada falla,
simplemente se vuelve a poder escribir sin autenticar.

#### Estado resultante

| Tabla | `anon` | `authenticated` |
|---|---|---|
| `propiedades` | SELECT solo `activo IS TRUE` | todo |
| `ficha_clientes` | SELECT | todo |
| `ficha_propiedades` | SELECT | todo |
| `sdm_agentes` | SELECT | todo |

La lectura anónima se conserva en las tres últimas porque el cliente abre su
ficha sin login.

#### Cómo verificar que sigue cerrado

Un `DELETE` con un filtro que no coincide con nada **no sirve** como prueba:
RLS no lanza error, filtra filas. Borrar 0 filas devuelve 204 tanto si la
escritura está permitida como si está bloqueada.

La prueba que sí discrimina es un `PATCH` sobre una fila **visible**, poniendo
una columna a su valor actual, con `Prefer: return=representation`: si
devuelve `[]` la escritura está bloqueada; si devuelve la fila, pasó. Al poner
el mismo valor, no cambia nada en ninguno de los dos casos.

#### Pendiente

Quedan sin revisar las otras 15 tablas de `public`. `cotizaciones` y
`contacto_mensajes` daban 0 filas en el diagnóstico, pero eso no distingue
"vacía" de "RLS la oculta": hay que confirmarlo antes de darlas por seguras.

### Sesión RLS `envios_plantilla` — 2026-08-05

Migración `20260805000400_rls_envios_plantilla.sql`, aplicada.

`envios_plantilla` era la única tabla de `public` con `relrowsecurity = false`.
Sin políticas y con grants de `SELECT/INSERT/UPDATE/DELETE/TRUNCATE` para
`anon`: con la anon key del bundle se podía leer, llenar de basura o vaciar.

Ahora tiene RLS activo y una sola política, `FOR ALL TO authenticated`. **No se
le agregó política a `anon` a propósito**: es una tabla interna y el Worker de
Sofía accede con `service_role`, que no pasa por RLS.

#### Las tablas internas de Sofía están en deny-all a propósito

| Tabla | RLS | Políticas |
|---|---|---|
| `decisiones_shadow` | activo | ninguna |
| `eventos_procesados` | activo | ninguna |
| `eventos_turno` | activo | ninguna |
| `mensajes_pendientes` | activo | ninguna |
| `migracion_r2` | activo | ninguna |
| `envios_plantilla` | activo | solo `authenticated` |

RLS activo con cero políticas significa **deny-all** para `anon` y para
`authenticated`. No es un descuido: Sofía lleva meses escribiendo en ellas
porque el Worker usa `service_role`, que salta RLS por completo.

**Consecuencia:** un panel del admin que lea esas tablas se va a ver vacío, y
eso es lo esperado. Si alguien "arregla" ese panel vacío agregando un
`Allow all` desde el dashboard, reabre exactamente el agujero que se acaba de
cerrar. La solución correcta para un panel así es leer por el Worker o por una
función con `service_role`, nunca abrirle la tabla a `anon`.

#### Verificación que quedó pendiente

`envios_plantilla` **ya estaba vacía antes** de aplicar la migración (0 filas
con RLS apagado). Por eso:

- El test de conteo no prueba nada: daba 0 antes y da 0 después.
- El test de `PATCH` idempotente era inaplicable: no hay ninguna fila que
  tocar.

Lo que sí se verificó es un `INSERT` anónimo, que ahora devuelve
`42501 · new row violates row-level security policy` con HTTP 401, sin crear
fila. Eso confirma que RLS bloquea.

Lo que **no** se pudo verificar: que Sofía siga registrando envíos. La tabla
estaba vacía antes, así que no hay línea base, y ahora `anon` ya no puede
leerla. Hay que comprobarlo desde el SQL Editor del dashboard:

```sql
select count(*), max(created_at) from public.envios_plantilla;
```

Si tras un envío real de plantilla ese conteo sigue en 0, el Worker está
usando la anon key y no `service_role`. En ese caso **no** agregar una política
para `anon`: hay que arreglar el Worker.

### Sesión banner promocional — 2026-08-05

Esta sesión entra en **`src/pages/AdminPage.tsx`, que es dominio de la sesión
admin** — concretamente en `ContenidoAdmin`, pestaña Inicio, para agregar la
sección "Banner promocional". Queda avisado acá porque es una invasión de
dominio, no un archivo compartido.

También toca `src/components/sections/` y `src/pages/HomePage.tsx`, que son de
la sesión web pública, y **`functions/api/subir.js`, que es dominio de la sesión
Sofía / chatbot**: se agregó `'banner/'` a la lista `PREFIJOS`. Sin ese prefijo
el endpoint rechaza la subida de la imagen del banner. Es una línea, pero está
en territorio ajeno.

Además se subieron `Sec` y `Full` a nivel de módulo en `AdminPage.tsx`. Estaban
definidos dentro de `ContenidoAdmin`, `BarrancoAdmin`, `RentalAdmin` y
`VendeAdmin` — cuatro copias idénticas. Al recrearse en cada render, React
desmontaba y remontaba el árbol completo, y la página saltaba al inicio con
cada cambio de switch. Si otra sesión vuelve a definirlos adentro, el bug
reaparece.

Las claves nuevas (`banner_activo`, `banner_titulo`, `banner_subtitulo`,
`banner_cta_texto`, `banner_cta_url`) viven en `contenido_sitio` y **no
requieren migración**: el admin las crea con el primer guardado y el
componente tiene los mismos valores por defecto vía `useContenido`.

### Sesión inventario oficinas — 2026-08-05

`src/pages/PropiedadDetailPage.tsx` es dominio de la **sesión web pública**, y
`src/types/index.ts` es zona compartida. Esta sesión los toca de todas formas
para el render de unidades; queda avisado acá. El admin y el banner del home
**no** se tocan — eso viene en una etapa posterior.

Migraciones `20260805000000` y `20260805000100` **ya aplicadas** contra
`ugfhgfpgxyfzafudxaeo`. La base cambió: `propiedades` tiene columna `unidades`
(jsonb, nullable) y 10 filas nuevas de tipo `oficina`.

### Cambio de estrategia — los 10 edificios NO se publican

Migración `20260805000200`, también aplicada.

Los 10 edificios cargados en `20260805000100` quedan **pausados de forma
permanente**: son referencia interna. Publicarlos expondría las direcciones de
la cartera del socio.

- **No borrarlos.** Los datos y las 42 unidades se conservan.
- **No activarlos.** `activo = false` es deliberado y definitivo, no un estado
  transitorio a la espera de fotos.

Lo que sí se publica es una ficha genérica, `oficinas-arriendo-santiago-centro`:
comunica volumen y rango de superficies sin decir dónde está nada. Va sin
`direccion`, sin `map_address` y sin `map_lat` / `map_lng` a propósito —
cualquiera de esos campos reintroduciría lo que se está protegiendo. Su
`unidades` es NULL para que la ficha no dibuje el desglose piso por piso.

Esa sí está publicada: se le cargaron 10 fotos desde el admin y quedó con
`activo = true` el 2026-08-05.

### Sesión admin cerrada el 2026-08-02

Último commit: `933fac8`. Árbol limpio y producción verificada contra `HEAD`
(mismos hashes de assets, chunks diferidos y `/api/imagen` respondiendo).

Trabajo de la sesión, en orden:

1. Accesibilidad: contraste WCAG AA, `focus-visible`, sanitización con DOMPurify,
   lazy loading de imágenes.
2. TypeScript: de 38 errores a 0, `tsc` incorporado al script de build,
   `thumbUrl()` en las miniaturas del catálogo.
3. Rendimiento del admin: PDF bajo demanda, el chunk de 2 MB fuera de la carga
   inicial, fallback de Suspense propio para `/admin`.
4. PDF de cotizaciones: imagen vía proxy de R2, UF fresca al abrir el wizard,
   letter-spacing legible.
5. Alta de cotizaciones: columnas `prop_pais`/`prop_ciudad`, errores de Supabase
   visibles en todo el admin, catálogo por defecto en el Paso 2.

**Fase 3 (tokens tipográficos): planificada, NO iniciada.** No se tocó ningún
archivo por este motivo. Queda como el siguiente trabajo pendiente de la sesión
admin.

Pendiente operativo **ya resuelto**: aquellos commits estaban solo en local,
pero desde el 2026-08-05 `main` está a la par con `origin/main`. No queda nada
sin pushear de esa sesión.
