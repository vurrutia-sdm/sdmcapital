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
| 2026-08-05 | RLS / vistas de métricas | Migración `20260805000500`: `security_invoker` en las 4 vistas `metricas_*`, que evadían el RLS de las tablas de Sofía. Solo toca `supabase/migrations/` | Cerrada — aplicada y verificada con medición antes/después |
| 2026-08-05 | Admin — Fase 3, etapa 1 | Partir `AdminPage.tsx`. Primitivas a `src/components/admin/primitivas.tsx` y pestaña piloto a `src/pages/admin/Mensajes.tsx` | Cerrada — commiteada, desplegada y verificada |
| 2026-08-05 | Admin — Fase 3, etapa 2 | Helpers compartidos a `src/components/admin/`: `campos.tsx`, `layout.tsx`, `acciones.tsx`, `ImageUploader.tsx`. `primitivas.tsx` eliminado | Cerrada — commiteada, desplegada y verificada |
| 2026-08-05 | Admin — Fase 3, etapa 3 | Cuatro paneles a `src/pages/admin/`: `Blog`, `Equipo`, `Asociados`, `PaginasLegales` | Cerrada — commiteada, desplegada y verificada |
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

### Fase 3 — partir `AdminPage.tsx`. Etapa 1 de N — 2026-08-05

La Fase 3 que quedó planificada y sin iniciar el 2026-08-02 arrancó por acá.
`AdminPage.tsx` tenía 2.808 líneas y 29 componentes de nivel superior.

Hecho en esta etapa:

- `Sec` y `Full` viven ahora en **`src/components/admin/primitivas.tsx`**.
- La pestaña Mensajes vive en **`src/pages/admin/Mensajes.tsx`**. Se eligió
  como piloto por ser la más autocontenida: una tabla, sin props, sin helpers
  compartidos y sin estado de `AdminPage`.
- `AdminPage.tsx` quedó en 2.751 líneas.

#### Regla: todo componente extraído va a nivel de módulo

Ningún componente puede quedar definido dentro de otro, ni dentro de un
render, ni como arrow function creada en el cuerpo de un componente. Si al
partir un archivo queda uno anidado, hay que sacarlo al nivel superior.

No es estilo. `Sec` y `Full` estuvieron definidos dentro de `ContenidoAdmin`,
`BarrancoAdmin`, `RentalAdmin` y `VendeAdmin` —cuatro copias idénticas— y al
recrearse en cada render React los trataba como tipos de componente distintos:
desmontaba el árbol entero, la página perdía altura, el navegador llevaba el
scroll a 0 y no volvía. Tocar cualquier switch saltaba al inicio. La regla
está escrita también dentro de `primitivas.tsx`.

#### Las claves de pestaña NO se renombran

El orden de las pestañas se persiste en `localStorage` como un array de claves
(`STORAGE_KEY` en `AdminPage.tsx`). Renombrar una clave le borra la
configuración a Víctor. El componente pasó de `MensajesAdmin` a `Mensajes`,
pero la clave sigue siendo `'mensajes'`.

#### Chunks: sin movimiento

Verificado antes y después. `pdf` (2 MB) sigue fuera de la carga inicial del
admin, y `react` y `editor` conservaron el mismo hash.

| Chunk | Antes | Después |
|---|---|---|
| `AdminPage` | 169,57 kB | 169,57 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `react` | 147,89 kB | 147,89 kB |
| `index` | 238,90 kB | 238,90 kB |

**Es un refactor puro: mover código, no mejorarlo.** Las mejoras detectadas se
anotan y se hacen en una etapa aparte.

### Fase 3 — Etapa 2: helpers compartidos — 2026-08-05

`src/components/admin/` quedó así:

| Archivo | Qué contiene |
|---|---|
| `campos.tsx` | `Field`, `Inp`, `Txa`, `Chk`, `Sel` |
| `layout.tsx` | `Sec`, `Full` |
| `acciones.tsx` | `SaveBtn`, `Badge` |
| `ImageUploader.tsx` | `ImageUploader` |

`AdminPage.tsx`: 2.751 → 2.653 líneas.

#### `primitivas.tsx` fue eliminado

Se creó en la Etapa 1 con `Sec` y `Full`. Su contenido pasó a `layout.tsx` sin
cambios. El nombre no decía nada: "primitivas" habría terminado siendo el
cajón donde cae todo lo que no tiene otro lugar, que es exactamente el
problema que este refactor viene a resolver en `AdminPage.tsx`.

#### Por qué separado por tipo y no un archivo único

Un `helpers.tsx` con los diez componentes vuelve a crear un archivo que hay
que abrir para cualquier cosa, y del que todos los paneles importan aunque
usen una fracción. Separado por tipo, el import declara qué necesita cada
panel: `MensajesAdmin` no importa nada, `PaginasLegalesAdmin` solo
`acciones`, y los cuatro que usan la grilla solo `layout`.

También deja lugar obvio para lo que viene: cuando se extraigan los paneles
grandes, cada helper nuevo tiene un archivo donde entrar en vez de engordar
uno solo.

`ImageUploader` va en su propio archivo, con nombre en PascalCase, porque es
un componente con estado y con dependencias de `src/lib/` —`subirImagen` y
`thumbUrl`—, no un helper de presentación de tres líneas.

#### Qué NO se extrajo, a propósito

- `TBtn` — solo lo usa `RichTextEditor`, viaja con él.
- `DossierUploader`, `PropImageManager`, `CarouselPhotoManager`,
  `HomeDestacadasSelector` — van con sus paneles.

#### Chunks: sin movimiento

| Chunk | Etapa 1 | Etapa 2 |
|---|---|---|
| `AdminPage` | 169,57 kB | 169,57 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `react` | `react-DLA1cIuT.js` | mismo hash |
| `editor` | `editor-CRXeSJ56.js` | mismo hash |
| `index` | 238,90 kB | 238,90 kB |

### Fase 3 — Etapa 3: cuatro paneles mecánicos — 2026-08-05

| Antes | Ahora |
|---|---|
| `BlogAdmin` | `src/pages/admin/Blog.tsx` |
| `EquipoAdmin` | `src/pages/admin/Equipo.tsx` |
| `AsociadosAdmin` | `src/pages/admin/Asociados.tsx` |
| `PaginasLegalesAdmin` | `src/pages/admin/PaginasLegales.tsx` |

`AdminPage.tsx`: 2.656 → 2.286 líneas. Acumulado de la Fase 3: **2.808 → 2.286,
−522 líneas** en tres etapas.

`LEGAL_PAGES` se movió con `PaginasLegales`: es una constante local de
`AdminPage.tsx`, no de `src/types/`, y solo la usaba ese panel.

#### Dos símbolos que siguen viviendo en `AdminPage.tsx`

`RichTextEditor` y `useDragSort` quedaron exportados desde `AdminPage.tsx` y
los paneles extraídos los importan desde ahí:

- `RichTextEditor` — lo usan `Blog` y `PaginasLegales`. Se extrae junto con
  `TBtn` en una etapa posterior.
- `useDragSort` — lo usan `Equipo`, `Asociados` y `PropiedadesAdmin`.

**Esto crea un import circular**: `AdminPage` importa los paneles y los paneles
importan de `AdminPage`. Funciona porque ambos son declaraciones `function`,
que se hoistean, y porque nadie los invoca en tiempo de evaluación del módulo,
solo en render. Es transitorio y hay que deshacerlo: cuando `RichTextEditor`
se vaya a `src/components/admin/`, `useDragSort` debería irse con él o a su
propio módulo, y el ciclo desaparece.

Si alguna etapa futura mueve una de esas dos a un contexto que se ejecute en
tiempo de módulo, el ciclo deja de ser inocuo.

#### Los paneles NO se convirtieron en chunks aparte

Se importan de forma estática, así que siguen dentro del chunk `AdminPage`.
Es deliberado: un `lazy()` cambiaría el comportamiento de carga y esto es un
refactor puro.

#### Chunks

| Chunk | Etapa 2 | Etapa 3 |
|---|---|---|
| `AdminPage` | 169,57 kB | 169,60 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `react` | `react-DLA1cIuT.js` | mismo hash |
| `editor` | `editor-CRXeSJ56.js` | mismo hash |
| `index` | 238,90 kB | 238,90 kB |

Los 0,03 kB de más en `AdminPage` son los `export` y los `import` nuevos.

#### Pendiente para las próximas etapas

Quedan 17 componentes en `AdminPage.tsx`. Los grandes: `PropiedadesAdmin`
(426 líneas), `BarrancoAdmin` (403), `ContenidoAdmin` (321),
`PropImageManager` (145), `RentalAdmin` (143), `RichTextEditor` (123),
`VendeAdmin` (120).

### Sesión RLS vistas de métricas — 2026-08-05

Migración `20260805000500_rls_vistas_metricas.sql`, aplicada.

#### Una vista sin `security_invoker` es un bypass de RLS

`metricas_calidad`, `metricas_costo`, `metricas_descartes` y
`metricas_operacion` eran vistas con dueño `postgres` y sin
`security_invoker`. Una vista sin esa opción **se evalúa con los privilegios
de su dueño**, no con los de quien consulta. `postgres` es superusuario, así
que saltaba RLS por completo.

Con `GRANT SELECT` para `anon` sobre las cuatro, cualquiera con la anon key
del bundle leía a través de ellas las tablas internas de Sofía que están en
deny-all.

Medición con la anon key, antes y después de la migración:

| Vista | Antes | Después |
|---|---:|---:|
| `metricas_calidad` | 3 | 0 |
| `metricas_costo` | 3 | 0 |
| `metricas_descartes` | 1 | 0 |
| `metricas_operacion` | 3 | 0 |

Al mismo tiempo, `eventos_turno`, `mensajes_pendientes`, `decisiones_shadow` y
`eventos_procesados` devolvían 0 a `anon`. **Las tablas negaban el acceso y
las vistas lo concedían igual.**

#### Por qué este agujero es fácil de pasar por alto

No aparece en `pg_policies`: las vistas no tienen políticas. Tampoco aparece
en `pg_class` filtrado por `relkind = 'r'`, porque una vista es `relkind = 'v'`.
Una auditoría que solo mire tablas y políticas lo da por cerrado.

Para encontrarlas:

```sql
select c.relname, c.reloptions
from pg_class c
where c.relnamespace = 'public'::regnamespace and c.relkind = 'v';
```

Si `reloptions` no incluye `security_invoker=true`, la vista corre con los
privilegios de su dueño.

**Regla para el futuro: toda vista nueva sobre tablas con RLS debe crearse con
`WITH (security_invoker = true)`.** Lo mismo aplica a las funciones
`SECURITY DEFINER`.

#### Sobre los paneles

Ningún archivo de este repo consulta las cuatro vistas. Si algún panel del
admin las usara, quedaría vacío: el admin consulta como `authenticated`, y las
tablas base están en deny-all también para ese rol.

Si eso pasa, **no** agregar políticas para `authenticated` sobre las tablas
base. La salida correcta es una función `SECURITY DEFINER` acotada que
devuelva solo el agregado que el panel necesita.

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
