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
| 2026-08-05 | Admin — Fase 3, etapa 4 | Romper el ciclo de imports: `RichTextEditor` + `TBtn` y `useDragSort` a `src/components/admin/` | Cerrada — ciclo eliminado, commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, etapa 5 | Tres paneles a `src/pages/admin/`: `Rental`, `Vende`, `Barranco` | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, etapa 6 | `Contenido` a `src/pages/admin/Contenido.tsx`, con `CarouselPhotoManager` y `HomeDestacadasSelector` | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, etapa 7 (final) | `Propiedades` a `src/pages/admin/Propiedades.tsx`, con `PropImageManager`, `DossierUploader` y `slugify` | Cerrada — **refactor de `AdminPage.tsx` terminado**, commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, iconos | Reemplazar los emojis del admin por `lucide-react`. Dos commits: sidebar + encabezados, y controles + editor | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, limpieza | Borrar `FotosAdmin` y corregir los comentarios desactualizados | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — Fase 3, escala tipográfica (fase 1) | **Definición de tokens en ZONA COMPARTIDA** (`src/styles/globals.css` y `tailwind.config.js`). No toca componentes | Commiteada y pusheada, **sin desplegar** — no cambia nada visible |
| 2026-08-06 | Admin — Fase 3, escala tipográfica (fase 2, tanda 1) | Migrar los literales inline del **dominio admin** a los tokens: 25 archivos, 3 commits | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — layout móvil | Sidebar como cajón deslizante debajo de `lg`, header adaptado, `top-[57px]` corregido. Solo `AdminPage.tsx` | Cerrada — commiteada, desplegada y verificada |
| 2026-08-06 | Admin — móvil, ajustes internos | Encabezados de panel apilados debajo de `lg` (10 archivos) y separación de columnas en la tabla de Propiedades | Cerrada — commiteada, desplegada y verificada. **El centrado de textos no existía**; tablas sin layout móvil |
| 2026-08-07 | Admin — Tailwind: hover a CSS | **INVASIÓN DE DOMINIO** sobre `src/components/` y `src/pages/`: los 90 hover puros de JS pasan a `hover:` de CSS. Se limpian además 13 clases muertas de `globals.css` (**zona compartida**) | En curso |
| 2026-08-07 | Admin — acotar `mobile.css` al sitio público | **INVASIÓN DE DOMINIO**: `Layout`, `ElBarrancoShowcase` y `EvaluacionGratuitaPage` reciben `className="sitio-publico"` | Cerrada — 26 combinaciones del sitio público sin cambio, admin liberado |
| 2026-08-07 | Admin — limpieza de `mobile.css` | **CAMBIO EN ZONA COMPARTIDA**: se borran 6 reglas muertas. **Afecta a todo el sitio debajo de 768px** | Cerrada — de 26 reglas quedan 20 |
| 2026-08-07 | Admin — cierre del layout móvil | `Cotizaciones` a breakpoint `xl`, `TarjetasEquipo` apilado y grids responsive en `FichaCliente` Nueva/Editar | Cerrada — commiteada, desplegada y verificada |
| 2026-08-07 | Admin — Cotizaciones a tarjetas | Rediseño móvil de `CotizacionesAdmin` y eliminación de los 23 fondos `var(--off)` inline que disparaban el selector de `mobile.css` | Cerrada — commiteada, desplegada y verificada |
| 2026-08-07 | Admin — tablas a tarjetas | Rediseño móvil de las tablas de `Propiedades` y `Blog`, y corrección del `<thead>` desalineado de Propiedades | Cerrada — commiteada, desplegada y verificada |
| 2026-08-07 | Limpieza técnica | Alinear las versiones de TipTap para quitar `--legacy-peer-deps`, y precisar la condición de `SinArriendos`. **Tocó `package.json` y `package-lock.json`, que son ZONA COMPARTIDA** | Cerrada — commits `be3fa8a` y `441065c`. **El lockfile se regeneró entero**: si otra sesión tenía cambios en él, hay que reinstalar |
| 2026-08-07 | Cierre — tagline y línea de Captación | **Invasión de dominio autorizada por Víctor: una línea de `Captacion.tsx`** (`minmax(380px, 1fr)` → responsive). Sesión Sofía, no se tocó nada más de ese archivo. Además, tagline único en código y meta tags | Cerrada — commits `5916af3` y `1b2095c`. Quedan 3 claves de `contenido_sitio` por editar a mano desde el admin |
| 2026-08-07 | UX copy — tanda 1 | Errores, confirmaciones de borrado y confirmación de guardado. **Toca `src/lib/errores.ts`, que es ZONA COMPARTIDA** — cambia solo el texto de la alerta, no la firma ni el log a consola | En curso |
| 2026-08-06 | Admin — sticky del header en móvil | **CAMBIO EN ZONA COMPARTIDA**: `src/styles/mobile.css` pasa de `overflow-x: hidden` a `clip`. Completa el cambio de `globals.css` — `html: clip` + `body: hidden` también rompe el `position: sticky`. **Afecta a todo el sitio debajo de 768px** | Cerrada — el header se pega en los 7 anchos medidos, commiteada, desplegada y verificada |
| 2026-08-06 | Admin — sticky del header | **CAMBIO EN ZONA COMPARTIDA**: `html` y `body` pasan de `overflow-x: hidden` a `clip`. `hidden` creaba contenedor de scroll y rompía el `position: sticky` del header del admin. `clip` recorta igual sin ese efecto. **Afecta a todo el sitio** | Cerrada — escritorio arreglado y verificado. **Debajo de 768px sigue roto**: `mobile.css` reintroduce `body { overflow-x: hidden }` |
| 2026-08-06 | Admin — Fase 3, escala tipográfica (fase 2, tanda 2) | **INVASIÓN DE DOMINIO** sobre `src/pages/` (fuera de `admin/`), `src/components/sections/` y `src/components/ui/`, para completar la migración iniciada en la tanda 1 | Cerrada — 29 archivos, 4 commits, desplegada y verificada. **Los 17 `em` quedan pendientes de tu revisión** |
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

**Esto creó un import circular**: `AdminPage` importaba los paneles y los
paneles importaban de `AdminPage`. Funcionaba porque ambos son declaraciones
`function`, que se hoistean, y porque nadie los invocaba en tiempo de
evaluación del módulo, solo en render.

> **Deuda RESUELTA en la Etapa 4.** Ambos símbolos se movieron a
> `src/components/admin/` y no queda ningún import desde `src/pages/admin/`
> hacia `AdminPage.tsx`.

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

### Fase 3 — Etapa 4: ciclo de imports roto — 2026-08-05

| Símbolo | Ahora vive en |
|---|---|
| `RichTextEditor` + `TBtn` | `src/components/admin/RichTextEditor.tsx` |
| `useDragSort` | `src/components/admin/useDragSort.ts` |

`AdminPage.tsx`: 2.286 → 2.123 líneas. Acumulado de la Fase 3: **2.808 →
2.123, −685 líneas (−24,4%)** en cuatro etapas.

#### El ciclo desapareció

**No queda ningún import desde `src/pages/admin/` hacia `AdminPage.tsx`.**
`AdminPage.tsx` ya no exporta `RichTextEditor` ni `useDragSort`; el flujo de
dependencias va en una sola dirección:

```
src/components/admin/  ←  src/pages/admin/  ←  AdminPage.tsx
```

`TBtn` no se exporta desde `RichTextEditor.tsx`: solo lo usa ese archivo, así
que viaja con el editor y no forma parte de su API.

#### `useDragSort` va en `src/components/admin/`, no en `src/hooks/`

Es un hook, pero `src/hooks/` es zona compartida entre sesiones y esto es
exclusivo del admin. Ponerlo ahí obligaría a coordinar con las otras sesiones
cada vez que se toque.

#### Chunks — atención al de TipTap

El riesgo de esta etapa era que mover `RichTextEditor` de archivo alterara
cómo Vite agrupa TipTap. **No pasó: `editor` conservó el hash exacto.**

| Chunk | Etapa 3 | Etapa 4 |
|---|---|---|
| `AdminPage` | 169,60 kB | 169,57 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `editor` | `editor-CRXeSJ56.js` | **mismo hash**, 388,10 kB |
| `react` | `react-DLA1cIuT.js` | mismo hash |
| `index` | 238,90 kB | 238,90 kB |

`AdminPage` bajó 0,03 kB y volvió al tamaño de la Etapa 2: son los `export` y
los imports cruzados que dejaron de existir.

#### Pendiente para las próximas etapas

Quedan 15 componentes en `AdminPage.tsx`. Los grandes: `PropiedadesAdmin`
(426 líneas), `BarrancoAdmin` (403), `ContenidoAdmin` (321),
`PropImageManager` (145), `RentalAdmin` (143), `VendeAdmin` (120).

### Fase 3 — Etapa 5: Rental, Vende y Barranco — 2026-08-06

| Antes | Ahora | Líneas del archivo nuevo |
|---|---|---:|
| `RentalAdmin` | `src/pages/admin/Rental.tsx` | 156 |
| `VendeAdmin` | `src/pages/admin/Vende.tsx` | 103 |
| `BarrancoAdmin` | `src/pages/admin/Barranco.tsx` | 410 |

`AdminPage.tsx`: 2.123 → 1.496 líneas. Acumulado de la Fase 3: **2.808 →
1.496, −1.312 líneas (−46,7%)** en cinco etapas.

El diff de `AdminPage.tsx` son 633 borrados y **6 líneas agregadas**: los tres
`import` y los tres `tab === … && <Panel />`. Nada más cambió — los cuerpos de
las tres funciones se movieron byte a byte, verificados con `diff` contra el
extracto original.

#### Eran los tres paneles del bug de remontaje

`Sec` y `Full` estuvieron definidos **dentro** de estos tres (más
`ContenidoAdmin`), y esa es la causa documentada del salto de scroll. Ya vivían
a nivel de módulo en `src/components/admin/layout.tsx` desde la Etapa 2, y así
siguen: los tres archivos nuevos no definen ningún componente anidado.
Verificado: la única declaración a nivel de módulo de cada archivo es su
`export default function`.

#### Las claves de pestaña no se tocaron

`'rental'`, `'vende'` y `'barranco'` siguen igual. Solo cambió el nombre del
componente.

#### El ciclo sigue roto

**No queda ningún import desde `src/pages/admin/` hacia `AdminPage.tsx`.** Las
menciones a `AdminPage` que quedan en ese directorio son todas comentarios de
cabecera. Ninguno de los tres paneles necesitó estado ni handlers de
`AdminPage`: los tres son autocontenidos contra Supabase.

#### Chunks: sin movimiento

| Chunk | Etapa 4 | Etapa 5 |
|---|---|---|
| `AdminPage` | 169,57 kB | 169,57 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `editor` | `editor-CRXeSJ56.js` | mismo hash |
| `react` | `react-DLA1cIuT.js` | mismo hash |
| `index` | 238,90 kB | 238,90 kB |

`pdf` sigue **fuera** de la carga inicial del admin. Los imports estáticos del
chunk `AdminPage` son `react`, `router`, `index`, `errores`, `subirImagen`,
`editor` e `iconos`; `pdf` solo aparece dentro del array `__vite__mapDeps`, que
es la tabla de precarga de un `import()` dinámico.

#### Anotado y NO tocado

Los tres archivos conservan el comentario `// Sec y Full: definidos a nivel de
módulo, junto a ContenidoAdmin.`, que quedó desactualizado: `Sec` y `Full`
viven en `src/components/admin/layout.tsx` desde la Etapa 2, no junto a
`ContenidoAdmin`. Es un comentario, no comportamiento, y esta etapa es un
refactor puro. Corregirlo va en la etapa de limpieza.

#### Pendiente

Quedan 12 declaraciones de nivel superior en `AdminPage.tsx`. Las grandes:
`PropiedadesAdmin` (443 líneas), `ContenidoAdmin` (321), `PropImageManager`
(145), `CarouselPhotoManager` (107) y `HomeDestacadasSelector` (96).
`FotosAdmin`, `DossierUploader` y `slugify` son las que faltan además del
propio `AdminPage`.

### Fase 3 — Etapa 6: Contenido — 2026-08-06

| Antes | Ahora |
|---|---|
| `ContenidoAdmin` | `src/pages/admin/Contenido.tsx` |
| `CarouselPhotoManager` | idem — mismo archivo |
| `HomeDestacadasSelector` | idem — mismo archivo |

`src/pages/admin/Contenido.tsx`: 569 líneas.
`AdminPage.tsx`: 1.496 → **953** líneas. Acumulado de la Fase 3: **2.808 → 953,
−1.855 líneas (−66,1%)** en seis etapas.

El diff de `AdminPage.tsx` son 546 borrados y **3 líneas agregadas**.

#### Los tres van juntos porque `Contenido` es su único consumidor

Verificado con `grep` sobre `src/` y `functions/`: `CarouselPhotoManager` y
`HomeDestacadasSelector` no se usan en ningún otro lado. Por eso van a
`src/pages/admin/` y no a `src/components/admin/`, que es para lo compartido.

Los tres quedan **a nivel de módulo**; solo `Contenido` lleva `export default`.
Cero componentes anidados en el archivo.

Se movieron con ellos `HERO_KEYS`, `HERO_POS_KEYS` y `POSITION_OPTIONS`: son
constantes locales que solo usa `CarouselPhotoManager`.

#### Verificación byte a byte

`diff` del bloque completo (539 líneas: las tres constantes más los tres
componentes) contra el original en `HEAD`. **Una sola línea distinta**, que es
justamente el renombre pedido:

```
< function ContenidoAdmin() {
> export default function Contenido() {
```

`CarouselPhotoManager` y `HomeDestacadasSelector` quedaron idénticos hasta el
byte, y el cuerpo de `ContenidoAdmin` también salvo su firma.

#### Las claves de `contenido_sitio` no se tocaron

Ninguna clave cambió. Las del banner promocional —`banner_activo`,
`banner_titulo`, `banner_subtitulo`, `banner_cta_texto`, `banner_cta_url`— no
tienen migración: las crea este panel con el primer guardado. Renombrar
cualquiera de ellas rompería el banner en silencio, porque `BannerPromo` caería
a sus valores por defecto sin que nada fallara. La clave de pestaña sigue
siendo `'contenido'`.

#### Cinco imports quedaron huérfanos y `tsc` no los delató

`noUnusedLocals` está apagado en `tsconfig.json`, así que el build pasaba en
verde con ellos. Revisados a mano y eliminados de `AdminPage.tsx`:
`invalidateContenidoCache`, `Sec`, `Full`, `Txa` e `ImageUploader`.

El chunk `AdminPage` conservó **exactamente el mismo hash** antes y después de
quitarlos: Rollup ya los eliminaba por tree-shaking. Es limpieza de fuente, sin
efecto en el bundle.

#### Chunks

| Chunk | Etapa 5 | Etapa 6 |
|---|---|---|
| `AdminPage` | 169,57 kB | 169,56 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `editor` | `editor-CRXeSJ56.js` | **mismo hash** |
| `react` | `react-DLA1cIuT.js` | **mismo hash** |
| `index` | 238,90 kB | 238,90 kB |

`pdf` sigue fuera de la carga inicial del admin. Los imports estáticos del
chunk `AdminPage` son `react`, `router`, `index`, `errores`, `subirImagen`,
`editor` e `iconos`.

##### Por qué cambiaron hashes con el tamaño intacto

`pdf`, `index`, `subirImagen` y varios chunks de rutas cambiaron de hash sin
cambiar de tamaño. Se verificó descargando de producción los archivos de la
Etapa 5 y comparándolos: **el contenido es idéntico salvo los nombres de chunk
embebidos**. `pdf` difería en 32 bytes, `index` en 152, `subirImagen` en 8 —
todos dentro de rutas `nombre-<hash>.js`.

El cascade arranca donde tenía que arrancar: `AdminPage.tsx` cambió, así que su
chunk cambió de hash; `index` embebe `AdminPage-<hash>.js` en su mapa de rutas
lazy, así que cambió también; y todo lo que importa `index` fue detrás.

Conviene tenerlo presente al revisar etapas futuras: **comparar solo hashes da
falsos positivos.** Lo que discrimina es normalizar los `-<hash>.js` y comparar
el contenido.

#### Pendiente

Quedan 8 declaraciones de nivel superior en `AdminPage.tsx`, y las grandes son
ya solo dos: `PropiedadesAdmin` (426 líneas) y `PropImageManager` (145).
Además `FotosAdmin` (68), `DossierUploader` (62), `LoginForm`, `useAdminAuth`,
`slugify` y `loadTabOrder`, más las constantes de la sidebar y el propio
`AdminPage`.

### Fase 3 — Etapa 7: Propiedades. **Refactor cerrado** — 2026-08-06

| Antes | Ahora |
|---|---|
| `PropiedadesAdmin` | `src/pages/admin/Propiedades.tsx` |
| `PropImageManager` | idem — mismo archivo |
| `DossierUploader` | idem — mismo archivo |
| `slugify` | idem — mismo archivo |

`src/pages/admin/Propiedades.tsx`: 713 líneas.
`AdminPage.tsx`: 953 → **264** líneas. El diff son 692 borrados y 3 líneas
agregadas.

Se movieron con el panel `FECHA_ENTREGA_OPTIONS`, `AVANCE_OBRA_OPTIONS` y
`SUBSIDIO_OPTIONS`, identificadas como propias de este panel desde la Etapa 2.

#### `slugify` se movió aunque no estaba en la lista

Solo lo usa `PropiedadesAdmin` (una llamada, al construir el slug de la
propiedad). Dejarlo en `AdminPage.tsx` habría dejado una función muerta, así
que viajó con el panel. Verificado con `grep` sobre `src/`, `functions/` y
`scripts/`: `PropImageManager`, `DossierUploader` y `slugify` no se usan en
ningún otro lado.

#### Se borró el encabezado `// ─── SHARED UI ───`

Encabezaba las primitivas compartidas que salieron en la Etapa 2 y desde
entonces encabezaba las constantes de proyectos nuevos. Al irse esas
constantes quedaba colgado justo antes de `// ─── FOTOS ───`, sin nada debajo.

#### Verificación byte a byte

`diff` del bloque de 678 líneas contra el original en `HEAD`. **Una sola línea
distinta**, el renombre pedido:

```
< function PropiedadesAdmin() {
> export default function Propiedades() {
```

`PropImageManager`, `DossierUploader`, `slugify` y las tres constantes
quedaron idénticos hasta el byte.

#### RLS y subidas: no se tocó nada

Ninguna query cambió, ni la semántica de `activo`. La tabla `propiedades`
sigue con `anon` restringido a `activo IS TRUE` y `FOR ALL` solo para
`authenticated`; el admin entra autenticado. Las subidas siguen pasando por
`src/lib/subirImagen.ts` sin modificar. Ese pipeline apunta a `/api/subir`, una
Pages Function, y `vite.config.ts` no proxea `/api`: **las subidas no funcionan
en localhost**, se prueban en producción. Queda anotado en la cabecera del
archivo nuevo.

#### 18 imports huérfanos

Con `noUnusedLocals` apagado, `tsc` pasaba en verde con los 18. Revisados a
mano y eliminados de `AdminPage.tsx`: `REGIONES`, `getComunas`, `avisarError`,
`subirArchivo`, `normalizeDossiers`, `dossierFileName`, `thumbUrl`,
`Propiedad`, `DossierItem`, `MapPicker`, `Field`, `Inp`, `Chk`, `Sel`,
`SaveBtn`, `Badge`, `RichTextEditor` y `useDragSort`.

`AdminPage.tsx` quedó con solo dos imports de librería —`supabase` y
`subirImagen`, ambos para `FotosAdmin`— más React, el router, los iconos y los
once paneles.

#### Chunks

| Chunk | Etapa 6 | Etapa 7 |
|---|---|---|
| `AdminPage` | 169,56 kB | 169,56 kB |
| `pdf` | 2.054,86 kB | 2.054,86 kB |
| `editor` | `editor-CRXeSJ56.js` | **mismo hash** |
| `react` | `react-DLA1cIuT.js` | **mismo hash** |
| `index` | 238,90 kB | 238,90 kB |

`pdf` sigue fuera de los imports estáticos del chunk `AdminPage`, que son los
mismos siete de la Etapa 6: `react`, `router`, `index`, `errores`,
`subirImagen`, `editor` e `iconos`.

Comparando contenido normalizado contra los archivos de la Etapa 6 servidos en
producción: `pdf` y `subirImagen` **idénticos**. `index` difiere en 37
caracteres de 238.765, y son todos el mismo hecho: `errores` y `subirImagen`
intercambiaron posición en la tabla `__vite__mapDeps`, así que cada referencia
a esos índices se dio vuelta (3↔4). Se verificó que es una **permutación pura**:
las 9 rutas lazy precargan exactamente el mismo conjunto de chunks antes y
después. `AdminPage` sí cambió de verdad, con el mismo tamaño exacto — es el
renombrado de identificadores minificados al mover 678 líneas a un módulo
nuevo.

---

### Fase 3 — Iconos: emojis reemplazados por `lucide-react` — 2026-08-06

Los emojis se renderizaban distinto en cada sistema operativo, no heredaban
`currentColor` y no escalaban con la tipografía. `lucide-react` ya estaba
instalado y en uso en el sitio público. Los iconos se importan **por nombre**,
nunca el paquete completo.

Se hizo en **dos commits** para que, si algo se ve raro, se sepa en cuál está:

| Commit | Alcance |
|---|---|
| `a4884a6` | sidebar de pestañas (13) + encabezados de panel (48) |
| `81a8940` | controles, estados (≈30) + barra del editor (11) |

#### Tabla de equivalencias

**Sidebar** — `size={16} strokeWidth={1.75}`. Las claves de pestaña **no
cambiaron**; solo el icono.

| Clave | Antes | Ahora |
|---|---|---|
| `propiedades` | 🏠 | `Building2` |
| `cotizaciones` | 📋 | `ClipboardList` |
| `blog` | 📝 | `FileText` |
| `equipo` | 👥 | `Users` |
| `asociados` | 🤝 | `HeartHandshake` |
| `mensajes` | 💬 | `MessageCircle` |
| `contenido` | ✏️ | `PenLine` |
| `fotos` | 🖼 | `Image` |
| `barranco` | 🏨 | `Building2` |
| `tarjetas` | 💳 | `CreditCard` |
| `legal` | 🔒 | `Lock` |
| `rental` | 🏘 | `KeyRound` |
| `vende` | 🏷 | `Tag` |

**Encabezados de panel** — `size={18} strokeWidth={1.75}`.

🎬 `Clapperboard` · 🖼 `Image` · 🌊 `Waves` · 🏄 `Wind` · 🏨 `Building2` ·
🛏 `Bed` · 💡 `Lightbulb` · 📊 `BarChart3` · 📖 `BookOpen` · 📋 `ClipboardList` ·
💰 `Wallet` · 📝 `FileText` · 👁/🚫 `Eye`/`EyeOff` · 🗂 `FolderTree` ·
🏠 `Home` · 🌎 `Globe` · 💬 `MessageCircle` · 👥 `Users` · 💼 `Briefcase` ·
🤝 `HeartHandshake` · 🏢 `Building` · 📱 `Smartphone` · 🔑 `KeyRound` ·
⚖️ `Scale` · 🏛 `Landmark` · 🔁 `RefreshCw`

**Controles, estados y editor** — `size={14} strokeWidth={2}`.

✓ `Check` · ✕ `X` · ★ `Star` · ⠿ `GripVertical` · 🖱 `MousePointer2` ·
⏸ `Pause` · ↑↓↕ `ArrowUp`/`ArrowDown`/`ArrowUpDown` · 📄 `File` ·
📎 `Paperclip` · 📷 `Camera` · 🏢 `Building2` · ↗ `ExternalLink` ·
📍 `MapPin` · 🎥 `Youtube` · ⬅☰➡ `AlignLeft`/`AlignCenter`/`AlignRight` ·
• `List` · ❝ `Quote` · — `Minus` · 🔗 `Link` · 🔗̸ `Link2Off` · ↩↪ `Undo2`/`Redo2`

#### Cuatro cambios de tipo

| Símbolo | Antes | Ahora |
|---|---|---|
| `Sec.title` | `string` | `React.ReactNode` |
| `Field.label` | `string` | `React.ReactNode` |
| `Chk.label` | `string` | `React.ReactNode` |
| `DEFAULT_TABS.icon` | `string` | `LucideIcon` |

**Las claves de pestaña no se tocaron.** `localStorage` guarda solo `t.key`
(`AdminPage.tsx`, en el `setItem` del reordenado), nunca el icono, así que el
orden configurado sobrevive.

#### Excepciones — qué quedó sin tocar y por qué

| Qué | Dónde | Motivo |
|---|---|---|
| 🇬🇧 🇨🇱 | etiquetas EN/ES de `Barranco` | lucide **no tiene iconos de país**. Reemplazarlas pierde la información |
| 🌐 / 🇨🇱 | columna internacional de `Propiedades` | idem |
| 🇪🇸 🇺🇾 | destinos en `Contenido` | idem |
| `'6 → 12'` | `Barranco` — `brief_meses` y su placeholder | **es dato**, no icono: se escribe en `showcase_barranco` |
| `••••••••` | máscara de contraseña en `AdminPage` | es texto de placeholder |
| `→` `←` | texto de enlaces ("Ingresar →", "← Ir al admin") | convención tipográfica; reemplazarlos obligaría a tocar el layout de nueve enlaces |
| 🎤 ✋ 🤖 | `Captacion.tsx` | SINCRONIA.md lo asigna a la **sesión Sofía** |

Dos emojis se quitaron **sin reemplazo**, dejando solo el texto:

- **Ciudades en `Contenido`** (🏙 Miami, 🏖 Punta Cana, 🎡 Orlando, 🗽 Nueva
  York): no hay icono para la Estatua de la Libertad, y usar uno genérico para
  las cuatro borraba justamente la distinción que aportaban.
- **Opciones del `Sel` de `activo` en `Propiedades`** (✅ Activa / ⏸ Inactiva):
  `Sel` renderiza `<option>{label}</option>`, y **un `<option>` de HTML solo
  admite texto, no SVG**. No es una preferencia, es una restricción del
  elemento. El texto ya dice "visible en el sitio" / "oculta del sitio".

#### Detalles de implementación que conviene recordar

**Iconos dentro de prosa van `inline`, no `flex`.** Para las leyendas de
arrastre y el pie de la galería se usa
`style={{ display: 'inline', verticalAlign: '-0.2em' }}`. Meterlos en un
contenedor flex convierte cada nodo de texto en un ítem y se pierde el
espaciado entre palabras.

**El color semántico se hereda solo.** En los pares activa/pausada y
visible/oculto el color vive en el contenedor (`#16a34a` / `#dc2626`), así que
los iconos quedan del color correcto con `currentColor`, sin fijárselo.

**`RichTextEditor` ya importaba `Image` y `Link` de TipTap.** Los de lucide
entran como `ImageIcon` y `LinkIcon`. Sin el alias el build falla con
`TS2300: Duplicate identifier 'Image'`.

**El único cambio de layout es el mínimo para alinear.** `flex items-center
gap-2` en el `h3` de `Sec` y el `h2` de Barranco; `display: flex` en el
`label` de `Field` y en los sub-encabezados de `Propiedades`. Ninguno tenía
más de un hijo antes, así que el `gap` no alteró nada existente.

#### Chunks — cuánto costaron los iconos

| Chunk | Etapa 7 | Iconos | Delta |
|---|---:|---:|---:|
| `AdminPage` | 169,56 kB | 176,10 kB | **+6,54 kB** |
| `iconos` | 11,81 kB | 30,67 kB | **+18,86 kB** |
| `pdf` | 2.054,86 kB | 2.054,86 kB | — |
| `index` | 238,90 kB | 238,90 kB | — |
| `editor` | `editor-CRXeSJ56.js` | mismo hash | — |
| `react` | `react-DLA1cIuT.js` | mismo hash | — |

**Costo real: +25,40 kB sin comprimir, +3,98 kB en gzip** (`AdminPage` +0,57,
`iconos` +3,41). `iconos` ya era un import estático del chunk `AdminPage`
antes de esta etapa, así que ese es el aumento de la carga inicial del admin.

`pdf` sigue fuera de los imports estáticos del chunk `AdminPage`, que son los
mismos siete: `react`, `router`, `index`, `errores`, `subirImagen`, `editor` e
`iconos`.

Con el método normalizado, `pdf` e `index` quedaron **byte a byte idénticos**
a la Etapa 7 — esta vez ni siquiera se permutó la tabla `__vite__mapDeps`.

---

## Fase 3 cerrada — `AdminPage.tsx`, de 2.808 a 194 líneas

**−2.614 líneas, −93,1%.** Siete etapas de refactor puro, sin un solo cambio
de comportamiento, más la etapa de iconos y la de limpieza.

| Etapa | Qué salió | `AdminPage.tsx` |
|---|---|---:|
| — | punto de partida | 2.808 |
| 1 | `Sec`/`Full` a `primitivas.tsx`, piloto `Mensajes` | 2.751 |
| 2 | helpers a `campos` / `layout` / `acciones` / `ImageUploader` | 2.653 |
| 3 | `Blog`, `Equipo`, `Asociados`, `PaginasLegales` | 2.286 |
| 4 | `RichTextEditor` + `TBtn`, `useDragSort` — ciclo roto | 2.123 |
| 5 | `Rental`, `Vende`, `Barranco` | 1.496 |
| 6 | `Contenido` + `CarouselPhotoManager` + `HomeDestacadasSelector` | 953 |
| 7 | `Propiedades` + `PropImageManager` + `DossierUploader` | 264 |
| limpieza | `FotosAdmin` — panel legado, borrado | **194** |

### Qué quedó en `AdminPage.tsx`

Siete declaraciones, todas de armazón: el tipo `Tab`, `useAdminAuth`,
`LoginForm`, `DEFAULT_TABS`, `STORAGE_KEY`, `loadTabOrder` y el propio
`AdminPage`. Es lo que tiene que ser: autenticación, sidebar y enrutado de
pestañas.

`FotosAdmin` (68 líneas) sigue ahí **a propósito**. Es el panel legado que
mezcla Supabase Storage con R2 y está marcado para borrarse, no para
refactorizarse. Extraerlo sería trabajo tirado.

> **Ya no está.** Se eliminó en la etapa de limpieza del 2026-08-06.
> `AdminPage.tsx` quedó en 194 líneas.

### Las reglas que sobrevivieron a las siete etapas

1. **Todo componente a nivel de módulo.** `Sec` y `Full` definidos dentro de
   `ContenidoAdmin`, `BarrancoAdmin`, `RentalAdmin` y `VendeAdmin` fueron la
   causa del bug de remontaje: React los trataba como tipos distintos en cada
   render, desmontaba el árbol y el scroll saltaba al inicio.
2. **Las dependencias van en una sola dirección:**
   `src/components/admin/` ← `src/pages/admin/` ← `AdminPage.tsx`. Ningún
   archivo de `src/pages/admin/` importa de `AdminPage.tsx`. El ciclo que
   introdujo la Etapa 3 se cerró en la Etapa 4 y no volvió.
3. **Las claves de pestaña no se renombran.** Se persisten en `localStorage`
   como array (`STORAGE_KEY`); renombrar una borra el orden configurado. Los
   componentes cambiaron de nombre, las claves no.
4. **Refactor puro, verificado con `diff`.** De la Etapa 5 en adelante, cada
   cuerpo extraído se comparó byte a byte contra el original. La única línea
   distinta admitida es la de la firma.
5. **`noUnusedLocals` está apagado.** `tsc` no delata imports huérfanos; hay
   que revisarlos a mano después de cada extracción. Las etapas 6 y 7 dejaron
   5 y 18.
6. **Los hashes de chunk no sirven para comparar.** Un cambio en un chunk
   cascadea a todo lo que lo referencia. Hay que normalizar los `-<hash>.js` y
   comparar contenido.

### Lo anotado y no tocado

`Barranco.tsx`, `Rental.tsx` y `Vende.tsx` conservan el comentario
`// Sec y Full: definidos a nivel de módulo, junto a ContenidoAdmin.`, que
quedó desactualizado en la Etapa 2 —viven en `src/components/admin/layout.tsx`—
y más aún ahora que `ContenidoAdmin` es `Contenido` y está en otro archivo. Son
comentarios, no comportamiento. Corregirlos es trabajo de una etapa de
limpieza, junto con borrar `FotosAdmin`.

> **Deuda saldada** en la etapa de limpieza del 2026-08-06. No quedan
> referencias a nombres `*Admin` en `src/`.

### Fase 3 — Escala tipográfica, fase 1: los tokens — 2026-08-06

Solo definiciones. **No migra ni un literal**, y no toca ningún archivo de
`src/pages/` ni `src/components/`. El deploy va con la primera tanda de
migración.

Zona compartida: `src/styles/globals.css` y `tailwind.config.js`.

#### Los 13 tokens — nombres definitivos

**Una sola regla, sin excepciones:** todo token lleva el prefijo `sdm-`, y la
custom property equivalente es `--sdm-<nombre>`.

| Clase Tailwind | Custom property | Valor |
|---|---|---|
| `text-sdm-display-sm` | `var(--sdm-display-sm)` | 28px / 1.15 / −0.5px |
| `text-sdm-display-md` | `var(--sdm-display-md)` | 40px / 1.08 / −0.5px |
| `text-sdm-display-lg` | `var(--sdm-display-lg)` | 52px / 1.05 / −0.5px |
| `text-sdm-display-xl` | `var(--sdm-display-xl)` | 72px / 1.02 / −1px |
| `text-sdm-xs` | `var(--sdm-text-xs)` | 11px |
| `text-sdm-sm` | `var(--sdm-text-sm)` | 13px |
| `text-sdm-base` | `var(--sdm-text-base)` | 15px |
| `text-sdm-lg` | `var(--sdm-text-lg)` | 17px |
| `text-sdm-xl` | `var(--sdm-text-xl)` | 20px |
| `text-sdm-2xl` | `var(--sdm-text-2xl)` | 24px |
| `tracking-sdm-tight` | `var(--sdm-tracking-tight)` | −0.5px |
| `tracking-sdm-normal` | `var(--sdm-tracking-normal)` | 0 |
| `tracking-sdm-wide` | `var(--sdm-tracking-wide)` | 2px |

Los display llevan `lineHeight` y `letterSpacing` empaquetados en la clase de
Tailwind. Sin ellos Tailwind aplicaría `line-height: 1.5`, que en un título de
72px es una regresión. Las custom properties solo llevan el tamaño.

#### Por qué el prefijo `sdm-` en todo

En UI y tracking es **obligatorio**: `xs`/`sm`/`base`/`lg`/`xl`/`2xl` y
`tight`/`normal`/`wide` son claves **nativas** de Tailwind. Redefinirlas
habría cambiado en silencio `text-sm` de 14 a 13px en `BlogPostPage.tsx` y
`ReservaConfirmacionPage.tsx`, y `tracking-wide` de 0.025em a 2px en
`BlogPostPage.tsx` — tres archivos de la web pública que esta fase no toca.

En display **no haría falta**, y de hecho quedaron sin prefijo en el primer
commit. Se renombraron enseguida: la asimetría
—`text-sdm-sm` pero `text-display-lg`— es difícil de recordar, y en una
migración de ~780 literales garantiza que alguien escriba `text-sm` creyendo
que es el token de SDM y obtenga los 14px de Tailwind.

Verificado con `resolveConfig` que los defaults nativos quedan intactos:
`text-sm` sigue en `0.875rem` y `tracking-wide` en `0.025em`.

#### Se eliminó una tercera fuente de verdad

`globals.css` tenía clases `.display-xl` / `.display-lg` / `.display-md`
escritas a mano con **otros valores** que los del config:

| | `.display-*` de globals.css | `fontSize` del config | ahora |
|---|---:|---:|---:|
| xl | 72px | 76px | 72px |
| lg | 52px | 52px | 52px |
| md | 42px | 42px | 40px |
| sm | — | 32px | 28px |

Las tres estaban muertas: no aparecían en ningún `.tsx`, `.ts`, `index.html`
ni `functions/`, ni en las cinco tablas de contenido editable
(`paginas_legales`, `blog`, `propiedades`, `contenido_sitio`,
`showcase_barranco`). Se borraron.

#### Las clases utilitarias todavía no existen en el CSS

El JIT de Tailwind solo emite lo que encuentra en el contenido, así que
`text-sdm-sm` y compañía **no están en el bundle** hasta que el primer
componente las escriba. Es lo esperado. Las custom properties sí están desde
ya, porque `:root` se emite siempre.

#### Chunks

Los tres chunks JS quedaron **byte a byte idénticos**. Lo único que cambia es
el CSS: +241 bytes en el primer commit (13 tokens menos tres clases borradas)
y +52 más al renombrar.

### Fase 3 — Escala tipográfica, fase 2 · tanda 1: el admin — 2026-08-06

Migra los literales inline del dominio admin a las clases de Tailwind.
**25 archivos, 482 literales, 3 commits.**

| Commit | Alcance | fontSize | letterSpacing |
|---|---|---:|---:|
| `7413e15` | `components/admin/`, `cotizaciones/`, `tarjetas/` | 68 | 16 |
| `f5728b5` | los 17 paneles de `pages/admin/` | 307 | 68 |
| `5c73b73` | `AdminPage.tsx` | 16 | 8 |
| | **total** | **391** | **91** |

**Quedaron cero literales sin migrar** en el alcance.

#### ESTA MIGRACIÓN NO ES NEUTRA

Los valores cambian a propósito. Texto que medía 14px ahora mide 15; 22px
pasa a 24; 12px pasa a 13. **Los hashes de chunks no sirven como verificación
en esta fase** — a diferencia de todas las etapas del refactor anterior.

#### Tabla de conversión — la misma para la tanda de web pública

```
   9, 10, 11            →  text-sdm-xs          (11px)
  12, 13                →  text-sdm-sm          (13px)
  14, 15                →  text-sdm-base        (15px)
  16, 17                →  text-sdm-lg          (17px)
  18, 19, 20            →  text-sdm-xl          (20px)
  21, 22, 24, 26        →  text-sdm-2xl         (24px)
  28, 30, 32            →  text-sdm-display-sm  (28px)
  36, 38, 40, 42, 44    →  text-sdm-display-md  (40px)
  48, 52                →  text-sdm-display-lg  (52px)
  72, 96                →  text-sdm-display-xl  (72px)

  letter-spacing negativo          →  tracking-sdm-tight
  0 y positivos hasta 0.3px        →  tracking-sdm-normal
  positivos desde 0.5px            →  tracking-sdm-wide
```

Es **fija, sin excepciones**. No se decide caso por caso.

#### Siete literales no podían llevar `className`

Viven en constantes `React.CSSProperties` compartidas —`const inp` en los
cinco archivos de ficha de cliente, y `pill` en `CotizacionesAdmin.tsx`—, que
no son elementos JSX. Usan las custom properties, que existen exactamente
para este caso:

```js
const inp: React.CSSProperties = { fontSize: 'var(--sdm-text-base)', … }
```

Son 6 `fontSize` y 1 `letterSpacing`.

#### Un solo `lineHeight` absorbido

Los cuatro tokens display traen `lineHeight` y `letterSpacing` empaquetados,
así que un valor inline los pisaría. En todo el admin hubo **un solo caso**:
el porcentaje de conversión de `Captacion.tsx`, de 28px con `lineHeight`
inline. En la web pública habrá muchos más — ahí es donde viven los títulos
grandes.

#### Lo que `tsc` atrapó y una revisión visual no habría atrapado

Tres tags tenían el `className` **después** del `style`, y el transformador
solo miraba antes: quedaron con `className` duplicado. `tsc` los frenó con
`TS17001: JSX elements cannot have multiple attributes with the same name`.
Corregidos a mano en `Asociados.tsx:97`, `Equipo.tsx:106` y
`Propiedades.tsx:680`, conservando las clases que ya tenían.

**Para la tanda de web pública: buscar `style={{…}} className=` antes de
empezar.** Es el único patrón que rompe la transformación automática.

#### Componentes que no son elementos DOM

13 de los tags migrados son `Link` / `RouterLink` de react-router-dom.
Reenvían `className` al `<a>` subyacente, así que las clases aplican. Se
verificó que ningún icono de lucide recibiera una clase de texto: los iconos
llevan `size`, no `fontSize`.

#### Fuera de alcance, sin tocar

- `CotizacionPDF.tsx` — puntos tipográficos de `@react-pdf/renderer` sobre
  hoja carta, no píxeles de pantalla. Sistema aparte.
- `tarjeta.css` — usa `em` y un `11.33px` calculado para un ancho fijo de
  400px. Sistema aparte.
- Todo `src/pages/` fuera de `admin/`, `src/components/sections/` y
  `src/components/ui/` — sesión web pública, va en otra tanda.

#### El CSS creció, y es lo esperado

El JIT de Tailwind solo emite lo que encuentra en el contenido. Hasta esta
tanda las clases no existían en el bundle; ahora se emiten **9**:

`text-sdm-xs` · `text-sdm-sm` · `text-sdm-base` · `text-sdm-lg` ·
`text-sdm-xl` · `text-sdm-2xl` · `text-sdm-display-sm` ·
`tracking-sdm-normal` · `tracking-sdm-wide`

Faltan cuatro: `text-sdm-display-md`, `-lg`, `-xl` y `tracking-sdm-tight`. No
es un error — el admin no tiene tipografía por encima de 30px ni tracking
negativo. Aparecerán con la tanda de web pública.

CSS: 26.879 → 27.200 bytes (**+321**).

### Admin — layout móvil: el sidebar pasa a cajón — 2026-08-06

**El admin no tenía layout móvil.** No es que duplicara markup como el resto
del proyecto: simplemente nunca se adaptó. Cero `matchMedia`, cero
`innerWidth`; los breakpoints de Tailwind se usaban solo para grillas de
formulario (`md:grid-cols-2` y parientes, 28 apariciones), y del layout
general había **una sola**: `lg:p-10` en el `<main>`.

El `aside` medía `w-56` (224px fijos) y el `main` llevaba `ml-56` (otros 224
fijos). La aritmética era el problema entero.

#### Medido, no calculado

Chrome headless, `getBoundingClientRect`. **Cuidado con el método:** headless
tiene un piso de viewport de ~500px que ignora `--window-size`, así que las
primeras medidas móviles daban 500px y eran falsas. Lo que sirve es cargar la
página en **iframes del ancho real** dentro de una ventana grande.

| Viewport | Contenido antes | Contenido ahora |
|---:|---:|---:|
| 360px | **72px** | 328px |
| 390px | **102px** | 358px |
| 430px | 142px | 398px |
| 1024px | 736px | 736px |
| 1440px | 1136px | 1136px |

72px de ancho útil es más angosto que la palabra "Propiedades" en el serif de
28px de los títulos. De ahí que se rompieran letra por letra.

#### Qué se hizo

Debajo de `lg` (1024px) el `aside` es un cajón de 256px fuera de pantalla
(`-translate-x-full`) que se superpone con backdrop y **no empuja el layout**.
Lo abre una hamburguesa en el header; se cierra al elegir pestaña, al tocar el
backdrop, al navegar a una herramienta y con Escape. El `main` pierde el
`ml-56` y baja el padding a `p-4 lg:p-8 xl:p-10`.

**De `lg` para arriba no cambia nada.** Verificado a 1024 y 1440: aside en
x=0 w=224, main con `ml-56`, mismas medidas que antes.

Todo con breakpoints de Tailwind. El único estado en JS es abierto/cerrado.

#### El `top-[57px]` era un número mágico desalineado

El header mide **79,50px** medidos, y el aside arrancaba en 57. El header es
`sticky z-40` y el aside `fixed z-30`, así que le tapaba los primeros ~22px —
justamente la etiqueta "Arrastra para ordenar". Bug de escritorio,
preexistente.

Ahora hay **una sola definición**, `--admin-header-h: 80px`, declarada en el
div raíz del admin y referenciada por los dos:

```
header  lg:h-[var(--admin-header-h)]              ← la FUERZA
aside   lg:top-[var(--admin-header-h)]
        lg:h-[calc(100vh-var(--admin-header-h))]
```

Al forzarla en el header, no puede volver a desalinearse. Medido después:
header 80,0px, aside top 80,0px, sin solape. En móvil el cajón es `top-0
h-screen`, así que no depende de esa altura.

**Por qué no se rehizo como app-shell** (`h-screen flex flex-col` con scroll
interno en el `main`), que habría eliminado el número por completo:
`Contenido.tsx` guarda y restaura la posición con `window.scrollY` y
`window.scrollTo` al cambiar de página. Con scroll interno, `window.scrollY`
es siempre 0 y esa función se rompe en silencio.

#### El header móvil no se desbordaba: crecía

Medido, el header anterior daba **126px a 360px** y **110px entre 390 y 430**,
contra 80 en escritorio. No había overflow horizontal —`scrollWidth` igual al
viewport en todos los anchos—: los flex items partían su texto en varias
líneas.

Debajo de `lg` se ocultan el subtítulo "Panel Admin" y las etiquetas de "Ver
sitio" y "Cerrar sesión", que quedan solo con su icono. El header baja a
**63px** y entra en una línea. Se prefirió reducir antes que dejarlo envolver
porque el alto es lo escaso en un teléfono, y porque un header de alto
variable es la fragilidad que se acababa de quitar.

#### El arrastre no funciona en táctil, y ahora no lo aparenta

> **RESUELTO el 2026-08-07.** Se reimplementó con Pointer Events; la etiqueta y
> la manija vuelven a mostrarse debajo de `lg`. Ver «Admin móvil — cajón que
> bloquea el fondo y arrastre en táctil». Lo de abajo queda como registro del
> estado anterior.

El reordenamiento usa la **API HTML5 de drag and drop**: `draggable` con
`onDragStart` / `onDragEnter` / `onDragEnd`, sin un solo `onTouchStart` ni
`onPointerDown` en todo el admin. Esa API **no dispara desde eventos
táctiles** en iOS ni Android, así que en teléfono la etiqueta "Arrastra para
ordenar" mentía.

Debajo de `lg` se ocultan la etiqueta y la manija de cada fila. **El orden
guardado en `localStorage` se sigue respetando y renderizando igual**; solo no
se puede cambiar desde el teléfono. Reimplementarlo con Pointer Events es
trabajo aparte.

#### Sin tocar `globals.css`

El `overflow-x: hidden` del `body` queda como estaba, y la solución no depende
de él. El único archivo del diff es `AdminPage.tsx`.

Chunk `AdminPage`: 175,55 → 177,29 kB (**+1,74**).

### Admin móvil — encabezados, alineación y densidad — 2026-08-06

Segunda tanda de móvil, sobre el contenido interno de los paneles. Todo con
el breakpoint `lg`, igual que el cajón. **De `lg` para arriba no cambia nada**,
verificado a 1024 y 1440.

#### El encabezado de panel está repetido, no compartido

No hay componente. Es un `<div className="flex items-center justify-between
mb-N">` con un `<h2>` y una acción, **duplicado en 10 paneles**, cada uno con
su propio margen inferior: `Propiedades`, `Contenido`, `PaginasLegales`,
`Blog`, `Asociados`, `Barranco`, `Equipo`, `Rental`, `Vende` y
`CotizacionesAdmin`. El arreglo va en los 10.

Debajo de `lg` se apila —título arriba, acción abajo, `gap-3`— y de `lg` para
arriba vuelve a la fila, con `lg:gap-0` para que el escritorio quede idéntico.

**La acción no ocupa el ancho completo, a propósito.** Los grupos son
heterogéneos: unos son un solo botón (`+ Nueva propiedad`) y otros un par
estado + botón (`Guardado correctamente` + `SaveBtn`). Estirarlos pediría un
tratamiento distinto por panel, y un botón verde a todo el ancho bajo cada
título se lee como acción principal de página incluso cuando solo es guardar.

#### La densidad de la tabla era espaciado, no estructura

Medido con `getBoundingClientRect`: la tabla mide **619px dentro de un
contenedor de 328**, o sea que el `overflow-x-auto` ya funciona y scrollea. El
problema era solo la separación entre columnas al comprimirse a su ancho
mínimo:

| | título → tipo |
|---|---:|
| móvil, antes | **16px** |
| móvil, ahora | **32px** |
| 1440px | 218px (sin cambio) |

La celda del título pasó a `pr-8 lg:pr-4`. Como la tabla ya scrollea,
ensancharla 16px no aprieta nada.

#### El centrado de textos de ayuda NO EXISTE en el admin

Se buscó y **no se tocó nada**. Las 32 apariciones de `text-center` y
`textAlign: 'center'` del dominio son, las 32, exclusiones que el propio
encargo pedía respetar:

- estados vacíos (`No hay imágenes`, `Aún no hay propiedades`…)
- `Cargando…` y spinners
- las tarjetas de "Acceso restringido" de las 7 vistas con auth propia
- el badge `PORTADA` centrado dentro de su caja
- la tarjeta de `Asociados`, diseñada centrada (logo arriba, nombre abajo)
- el indicador de pasos del wizard de cotizaciones

Tampoco viene de otro lado. Verificado: `globals.css` **no tiene una sola
regla de `text-align`**; los estilos `.ProseMirror` del editor no centran; el
contenido guardado en `paginas_legales`, `blog` y `propiedades` tiene **cero**
`text-align: center`; y los únicos contenedores con centrado por flexbox son
los dos deliberados de arriba.

##### CERRADO: era contenido de base de datos, no estilo

Falsa alarma, resuelta el 2026-08-06. Lo que se veía centrado en **Páginas
Legales** es contenido guardado en la tabla, centrado en su momento desde el
botón de alineación del editor. Es **dato editable, no estilo**, así que no se
toca desde el código: se cambia desde el propio editor del admin.

La conclusión del análisis era correcta: el centrado no existía en el código.
Queda fuera de la lista de pendientes.

#### Pendiente: las tablas siguen sin layout móvil

`Propiedades` y `Blog` usan `<table className="w-full">` dentro de un
`overflow-x-auto`. En móvil eso significa **scroll horizontal**: la tabla de
Propiedades mide 635px contra 328 de pantalla, con 8 columnas en su ancho
mínimo. Funciona, pero obliga a arrastrar de lado para ver el estado o el
precio.

**Necesitan rediseño a tarjetas apiladas**, no más ajustes de espaciado. Queda
fuera de esta etapa a propósito y se decide aparte.

#### Sobre medir en headless

Chrome headless tiene un piso de viewport de ~500px que ignora
`--window-size`. Toda medida móvil hecha así es falsa. Lo que sirve es cargar
la página en **iframes del ancho real** dentro de una ventana grande.

Chunk `AdminPage`: 177,29 → 177,84 kB (**+0,55**).

### Fase 3 — Escala tipográfica, fase 2 · tanda 2: la web pública — 2026-08-06

Cierra la migración. **29 archivos, 4 commits.** Invasión de dominio sobre la
sesión web pública, anunciada antes de tocar.

| Commit | Superficie | fontSize | letterSpacing |
|---|---|---:|---:|
| `f952fb9` | home y catálogo + secciones compartidas | 113 | 56 |
| `0ff7989` | ficha de propiedad + crédito | 76 | 25 |
| `3c5b42e` | el último literal de la ficha (`'13px'` como string) | 1 | — |
| `4653bba` | institucionales, blog, legales, showcase | 155 | 51 |
| | **total** | **345** | **132** |

Se partió por **superficie visual, no por carpeta**, para que si algo se ve
mal se sepa en qué pantalla mirar.

#### 58 valores quedan sin migrar, a propósito

| Tipo | Cuántos | Motivo |
|---|---:|---|
| `clamp(...)` | 40 | tamaños responsive calculados, no literales |
| `letter-spacing` en `em` | 17 | **pendiente de revisión** (ver abajo) |
| ternario | 1 | `PropiedadDetailPage:115` elige 11 o 9 según el símbolo de la red |

El ternario merece una nota: sus dos valores caerían en `text-sdm-xs`, así que
unificarlo subiría el icono de LinkedIn de 9 a 11px. Se deja como está.

#### Los 17 `em` de El Barranco, sin convertir

El encargo mencionaba solo `ElBarrancoShowcase.tsx`; **`ElBarrancoBanner.tsx`
también tiene dos**. Equivalencias calculadas contra el `font-size` de cada
elemento:

| em | font-size | = px | archivos |
|---|---:|---:|---|
| 0.4em | 10px | **4,0px** | Showcase ×2, Banner ×1 |
| 0.35em | 10px | 3,5px | Showcase ×1 |
| 0.3em | 10px | 3,0px | Showcase ×2 |
| 0.25em | 10–11px | 2,5–2,8px | Showcase ×5, Banner ×1 |
| 0.2em | 10–11px | 2,0–2,2px | Showcase ×2 |
| 0.06em | clamp(32px…) | 1,9px | Showcase ×1 |
| 0.08em | 12px | **1,0px** | Showcase ×1 |

**Los 17 caerían en `tracking-sdm-wide` (2px)**, pero sus valores reales van de
1,0 a 4,0px.

##### DECIDIDO: quedan como están. NO los conviertas.

Excepción documentada, cerrada el 2026-08-06. Si abres
`ElBarrancoShowcase.tsx` o `ElBarrancoBanner.tsx` y ves `letterSpacing` en
`em` en vez de un token, **está bien y es deliberado**.

Los cuatro más abiertos son *eyebrows* en versalitas de 10px, y a ese tamaño en
mayúsculas el tracking amplio es justamente lo que los hace legibles — es el
mismo principio que el sistema de diseño aplica en `.section-label` (`sans`
uppercase de 13px con tracking de 3px). Colapsarlos a los 2px de
`tracking-sdm-wide` los rompe.

**Tampoco se crea un token propio.** Dos tokens de tracking ancho para
distinguir 2px de 4px es una distinción que nadie recuerda y que termina
aplicándose al azar. Vale más una excepción explícita en dos archivos que un
token mal usado en veinte.

#### Las constantes no pueden llevar `className`

27 literales viven en objetos `React.CSSProperties`, casi todos en el registro
de estilos `S` de `ElBarrancoShowcase`, que se aplica con `style={S.loQueSea}`.
Van con `var(--sdm-*)`, igual que en la tanda 1.

#### Los tres avisos de la tanda 1, comprobados

- **`style={{…}} className=`**: dos casos, `BlogPage:71` y `HomePage:82`, pero
  ninguno con `fontSize`, así que el transformador los ignoró. Aun así se le
  enseñó a buscar el `className` en **todo el tag** y no solo antes del
  `style`, que era el fallo de la tanda 1.
- **Constantes**: 27, resueltas con custom properties.
- **`lineHeight` sobre display**: 11 absorbidos, contra 1 en el admin. Se
  cumplió que serían bastantes más.

#### Ahora sí se emiten los 13 tokens

La tanda 1 dejaba 9. Con la web pública aparecen los cuatro que faltaban:
`text-sdm-display-md`, `-lg`, `-xl` y `tracking-sdm-tight` — los títulos
grandes y el tracking negativo viven acá, no en el admin.

| | delta |
|---|---:|
| CSS | +0,26 kB |
| chunk `index` | +2,24 kB |
| chunk `AdminPage` | +0,06 kB |

#### La escala queda completa

Todo el sitio usa los tokens, salvo dos sistemas aparte que quedan fuera **a
propósito y de forma permanente**:

- **`CotizacionPDF.tsx`** — puntos tipográficos de `@react-pdf/renderer` sobre
  hoja carta. No son píxeles de pantalla.
- **`tarjeta.css`** — `em` y un `11.33px` calculado para un ancho fijo de
  400px.

### `overflow-x: hidden` en html + body rompe TODO `position: sticky` — 2026-08-06

**Guardar esto.** Es la clase de trampa que cuesta días encontrar, porque el
síntoma aparece a metros de la causa: el header del admin subía con el scroll,
y el culpable estaba en dos líneas de `globals.css` que nadie relaciona con un
`sticky`.

#### El mecanismo

`overflow-x: hidden` convierte al elemento en **contenedor de scroll**. Un
`position: sticky` se pega a su contenedor de scroll más cercano, no al
viewport. Con `html` y `body` en `hidden`, ese contenedor deja de ser el
viewport y el sticky no se activa nunca.

`overflow-x: clip` recorta **exactamente igual** pero no crea contenedor de
scroll. Es la propiedad diseñada para este caso.

#### Medido, no deducido

Chrome, estructura real del admin, scroll de 600px, leyendo el `top` del
header. **Forzar `behavior: 'instant'`**: el `scroll-behavior: smooth` de `html`
anima y falsea la lectura si se mide enseguida — costó una medición entera
descubrirlo.

| `html` | `body` | header tras scrollear |
|---|---|---|
| `hidden` | `hidden` | top 0 → **−600** · se va |
| `hidden` | visible | top 0 → 0 · se pega |
| visible | `hidden` | top 0 → 0 · se pega |
| **`clip`** | **`clip`** | top 0 → **0** · se pega |
| `clip` | `hidden` | top 0 → **−600** · **se va** |

**Hacen falta las dos en `hidden` para romperlo.** Por eso las dos reglas de
`globals.css` van juntas y simétricas: dejar una sola sería un arreglo por
accidente que alguien "corregiría" más adelante reintroduciendo el bug.

#### `clip` no destapó ningún desborde

El riesgo era que `hidden` estuviera tapando overflow horizontal real. No lo
había. Home, catálogo, ficha de propiedad y showcase de El Barranco, a 360,
390, 1024 y 1440, con el build nuevo servido por `vite preview`: las 16
combinaciones renderizan contenido real y en ninguna el `scrollWidth` supera
al `innerWidth`.

#### La regla vive en TRES lugares, no en dos

Al aplicar el cambio en `globals.css` apareció un tercero:
**`src/styles/mobile.css`**, dentro de `@media (max-width: 768px)`. Dejaba
`html: clip` + `body: hidden` en teléfono, que —según la tabla de arriba—
**también rompe el sticky**.

| # | Archivo | Selector |
|---|---|---|
| 1 | `src/styles/globals.css` | `html` |
| 2 | `src/styles/globals.css` | `body` |
| 3 | `src/styles/mobile.css` | `body`, bajo `@media (max-width: 768px)` |

**Los tres son `clip`. Ninguno puede volver a `hidden`.**

La regla operativa para este proyecto es simple: *ninguna de las tres puede
ser `hidden`*. Dicho con precisión, lo que se midió es que rompe cuando `body`
queda en `hidden` mientras `html` no es `visible` — y `html` nunca es `visible`
acá. Con que una vuelva a `hidden`, el header del admin deja de pegarse otra
vez.

Verificado tras el cambio: **no queda ningún `overflow-x: hidden` en el CSS
compilado**, y el header se pega a 360, 390, 430, 767, 768, 1024 y 1440 — o
sea dentro y fuera de la media query. Sin desborde horizontal en home,
catálogo, ficha y showcase en ninguno de esos anchos.

De paso, `mobile.css` merece una revisión aparte: son overrides con
`!important` sobre selectores genéricos (`section.relative`, `header nav`) que
pueden estar peleando con Tailwind. En este cambio **solo se tocó la regla de
`overflow-x`**.

Vale la pena revisar `mobile.css` entero de paso: son overrides con `!important`
sobre selectores genéricos (`section.relative`, `header nav`) que pueden estar
peleando con Tailwind.

#### Nota de compatibilidad

`overflow: clip` necesita Chrome 90+, Firefox 81+ y **Safari 16+**. En Safari 15
y anteriores cae a `visible`, así que un desborde horizontal produciría barra
en vez de recorte. Como se verificó que no hay desbordes, el riesgo es
teórico — pero conviene saberlo si alguna sesión agrega contenido ancho.

### Admin móvil — las tablas pasan a tarjetas apiladas — 2026-08-07

Cierra el último pendiente grande del layout móvil del admin. Dos commits:
`8a2b27a` (bug del `<thead>`) y `4f57deb` (rediseño).

#### El bug del `<thead>`, que era preexistente

La tabla de `Propiedades` tiene **9 columnas pero el encabezado declaraba 8**:
la de la bandera (🌐 / 🇨🇱) no tenía `<th>`. Como los `<th>` se alinean a las
primeras columnas, desde ahí en adelante **todos los rótulos estaban corridos
una posición**: "Activo" rotulaba la bandera, "Acciones" rotulaba el toggle
Activa/Pausada, y la columna de acciones quedaba sin rótulo. El estado vacío
usaba además `colSpan={8}`.

Se agregó el `<th>` con la etiqueta **"País"**. No puede quedar vacía: el `key`
del `map` es el propio `label` y ya existe uno vacío —el de la manija de
arrastre—, así que dos vacíos colisionarían.

#### La técnica: un solo árbol de markup

Las dos son `<table>` semánticas reales, no divs con `display: table`. Debajo
de `lg` la tabla pasa a bloques y **cada `<tr>` a `flex flex-wrap`**, así sus
`<td>` se vuelven flex items que se reordenan con `order-*` y se dimensionan
con `w-full`. De `lg` para arriba vuelve a `table-row` / `table-cell`.

Eso resuelve el agrupamiento **sin envolver celdas en nada**, que era el
obstáculo real: no se pueden meter `<div>` entre `<tr>` y `<td>` sin romper la
tabla en escritorio. Se descartaron `display: contents` —soporte irregular
sobre elementos de tabla y bugs conocidos de accesibilidad— y el doble render,
que es la duplicación que este proyecto ya sufrió.

#### El truco del borde continuo en la línea de acciones

El toggle Activa/Pausada lleva `flex-1`. Así su `border-t` se estira hasta
encontrarse con el de la celda de acciones, y **entre los dos dibujan una sola
línea continua sin necesidad de un contenedor**. Sin eso quedaba un hueco sin
borde en el medio.

#### Medido, antes y después

| ancho | contenido | `display` de la tabla | tabla | precio | sep. Editar–Eliminar | alto táctil |
|---:|---:|---|---:|---:|---:|---:|
| 360 | 328 | `block` | 328 | 24px | **24px** | **44px** |
| 390 | 358 | `block` | 358 | 24px | 24px | 44px |
| 430 | 398 | `block` | 398 | 24px | 24px | 44px |
| 1024 | 736 | `table` | 826 | 15px | 12px | 20px |
| 1280 | 976 | `table` | 976 | 15px | 12px | 20px |
| 1440 | 1136 | `table` | 1136 | 15px | 12px | 20px |

En móvil la tabla mide **exactamente el ancho del contenido**: se acabó el
scroll horizontal. De `lg` para arriba, mismo `display`, mismo tamaño de precio
y misma separación y alto de botones que antes.

#### Dos estilos inline que habrían cambiado el escritorio

El peso del precio y la opacidad del slug se habían escrito como `style={{}}`
inline, que aplica en **todos** los anchos. Pasaron a clases responsive
—`font-medium lg:font-normal` y `opacity-70 lg:opacity-100`— antes de
commitear. Es el error fácil de este tipo de rediseño: el inline no entiende de
breakpoints.

#### Lo que NO se tocó

El arrastre para reordenar sigue oculto debajo de `lg` y **no se reimplementó**
con Pointer Events. ~~Pendiente~~ — hecho el 2026-08-07. A 1024 la tabla sigue midiendo 826px en un contenedor de
736 y scrolleando dentro de su `overflow-x-auto`: es el comportamiento de
siempre en ese ancho, y el rediseño se acotó a debajo de `lg` a propósito.

### La trampa del selector por subcadena de `mobile.css` — 2026-08-07

**Guardar esto.** Es la segunda trampa de CSS compartido de esta serie, y del
mismo tipo que la de `overflow-x: hidden`: el síntoma aparece lejos de la
causa.

#### El mecanismo

`src/styles/mobile.css:75-79`, dentro de `@media (max-width: 768px)`:

```css
[style*="background: var(--off)"] .section-label,
[style*="background: var(--off)"] h2,
[style*="background: var(--off)"] p,
[style*="background: var(--off)"] .flex.items-center {
  text-align: center !important;
}
```

Es un **selector por subcadena del atributo `style`**. No mira una clase ni un
componente: mira el texto literal del atributo. Cualquier elemento del sitio
que escriba `background: var(--off)` **inline** convierte a todos sus
descendientes `h2`, `p`, `.section-label` y `.flex.items-center` en texto
centrado, con `!important`, en teléfono.

#### Por qué costó encontrarlo

El síntoma era "las tarjetas del admin salen centradas en móvil". La búsqueda
natural —`text-center` y `textAlign` en los paneles— daba cero resultados
útiles: las 32 apariciones del admin son estados vacíos, spinners y badges.
La causa no estaba en el admin ni en `globals.css`, sino en un archivo de
overrides de la web pública.

Y explica también el "centrado de textos" que en su momento se cerró como
falsa alarma: lo de Páginas Legales era contenido de base de datos, sí, pero
**además había esta causa en código** que entonces no se encontró.

#### REGLA: en el admin no se usa fondo inline

`background: var(--off)` va **siempre** como clase `bg-[var(--off)]`, nunca
como `style` inline. Se convirtieron 24 elementos:

| Archivo | Cajas |
|---|---:|
| `Propiedades` | 7 |
| `Barranco` | 6 |
| `Contenido` | 3 |
| `Rental` | 2 |
| `Asociados` · `Equipo` · `Vende` · `CotizacionesAdmin` · `RichTextEditor` | 1 c/u |
| `AdminPage` (root, corregido antes) | 1 |

Medido a 390px sobre el CSS compilado, con una caja de cada forma:

| | `h2` | `p` | `.flex.items-center` |
|---|---|---|---|
| fondo **inline** | `center` | `center` | `center` |
| fondo **por clase** | `start` | `start` | `start` |

A 1440 ambos dan `start`, o sea que en escritorio nunca cambió nada.

**Los tres fondos inline de `src/components/sections/` se conservan**: ahí la
regla es intencional, es web pública.

El arreglo de fondo sería una línea en `mobile.css` —acotar el selector o
borrarlo—, pero es zona compartida y no estaba autorizado.

### Admin móvil — Cotizaciones a tarjetas — 2026-08-07

La lista de cotizaciones **no es una `<table>`**: es un `div` con CSS grid de
7 columnas, `90px 1fr 1fr 110px 120px 120px 110px`. Los fijos suman 550px, así
que a 390px la fila medía **674 dentro de 358** y, al no tener `overflow-x`,
se recortaba contra el `clip` del body: total, estado y acciones eran
inalcanzables **sin siquiera scroll**.

Al ser grid y no tabla, la conversión es más simple que en `Propiedades`:
debajo de `lg` la fila pasa a `flex-wrap` y sus hijos se reordenan con
`order-*`; en `lg` vuelve al grid. El `gridTemplateColumns` inline se ignora
solo mientras el `display` es `flex` — no hace falta tocarlo.

| ancho | contenido | `display` | fila scroll/client | alto | botón | separación |
|---:|---:|---|---|---:|---:|---:|
| 360 | 328 | `flex` | 326 / 326 | 196 | 44px | 24px |
| 390 | 358 | `flex` | 356 / 356 | 196 | 44px | 24px |
| 430 | 398 | `flex` | 396 / 396 | 196 | 44px | 24px |
| 1280 | 976 | `grid` | 974 / 974 | 61 | 31px | 4px |
| 1440 | 1136 | `grid` | 1134 / 1134 | 61 | 31px | 4px |

**Los contadores** pasan de `grid-cols-4` a `grid-cols-2 lg:grid-cols-4`. Se
eligió envolver en dos filas de dos y no comprimir: a 390px cada tarjeta
quedaba en 82px y la etiqueta más larga —`RECHAZADA`, versalitas de 11px con
2px de tracking— mide unos 100px. Comprimir obligaba a achicar el número, que
es el dato.

#### PENDIENTE: a 1024 exactos sigue recortándose

La fila mide **811 dentro de 734** y se recorta contra el `overflow: hidden`
de la caja. El grid pide 550px fijos más dos columnas flexibles y a ese ancho
no entra. Afecta a iPad horizontal y laptops chicos.

**Es preexistente**, no lo introdujo el rediseño, que se acotó a debajo de
`lg` a propósito. La salida sería subir el breakpoint de este panel a `xl`, o
darle `overflow-x-auto` a la caja.

### Admin móvil — los tres últimos paneles — 2026-08-07

Cierra el layout móvil del admin. Tres commits: `d25ca30`, `8b3a0b3` y
`317c44e`.

#### `Cotizaciones` usa `xl`, el resto del admin usa `lg`

**Es la única excepción del proyecto y tiene motivo.** Su grid pide **550px
fijos** —`90px 1fr 1fr 110px 120px 120px 110px`— más dos columnas flexibles.
A 1024 la fila medía 811 dentro de 734 y se recortaba contra el
`overflow: hidden` de la caja. Ningún otro panel tiene tantas columnas fijas.

Entre 1024 y 1279 se muestran las tarjetas, que ahí caben con holgura.

**No se usó `overflow-x-auto`** a propósito: sería la misma barra escondida
dentro del área de la tabla que ya dio problemas en `Propiedades`. Nadie la
descubre y se lee como contenido cortado.

| ancho | `display` | fila scroll/client | botón | separación |
|---:|---|---|---:|---:|
| 390 | `flex` | 356 / 356 | 44px | 24px |
| 1024 | `flex` | 734 / 734 | 44px | 24px |
| 1279 | `flex` | 989 / 989 | 44px | 24px |
| **1280** | `grid` | 974 / 974 | 31px | 4px |
| 1440 | `grid` | 1134 / 1134 | 31px | 4px |

Solo la lista cambió de breakpoint. El encabezado del panel y los cuatro
contadores siguen en `lg`: a 1024 los contadores dan 175px cada uno, de sobra
para `RECHAZADA`.

#### `TarjetasEquipo`

La fila tenía miniatura de 140px fijos + nombre en `flex-1` + los botones de
reordenar + `Imprimir / PDF` con `Editar` y `Eliminar`. A 358px al nombre le
quedaban ~56px: se partía una palabra por línea y el botón de imprimir
terminaba encima del texto.

Debajo de `lg` pasa a `flex-wrap` con `order-*`: miniatura con los `▲▼` a su
derecha, luego nombre y contacto a todo el ancho, y las acciones en fila
propia con borde superior. Medido: el nombre pasa de ~56px a **326px** a
390px de viewport.

Los `▲▼` tenían `padding: 2px 8px`, unos 20px de alto. Los cinco botones
pasan a 44px táctiles debajo de `lg`.

#### `FichaCliente` Nueva y Editar

Cuatro grids con `gridTemplateColumns` hard-coded, sin breakpoint. Pasan al
patrón que ya usaba el resto del admin:

```
'1fr 1fr'      →  grid-cols-1 md:grid-cols-2
'1fr 1fr 1fr'  →  grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

`FichaClienteVer:258` también tiene un `1fr 1fr` y **no se tocó**: es la página
de fotos del documento imprimible, no un formulario.

#### Cuidado al medir en iframes: faltan ~6px

Un iframe de `width=1024` tiene un viewport efectivo de ~1018 por la barra de
scroll vertical, así que `lg` (min-width 1024) **no matchea**. Una medición a
"1024" puede dar el layout de tablet y parecer un bug. Verificado con un test
aislado: a 1023 y 1024 da 2 columnas, a 1030 da 3.

Para comprobar un breakpoint exacto hay que medir unos píxeles por encima.

### `mobile.css` limpiado y acotado a `.sitio-publico` — 2026-08-07

El archivo nació el **2026-04-30** en `d91b373`, *"fix: mobile responsive"*, tres
meses antes del refactor del admin. Arregló el responsive de la web pública a
base de `!important` sobre selectores genéricos, y desde entonces venía
alcanzando al admin sin que nadie lo notara.

De **26 reglas quedan 20**; de **36 declaraciones con `!important`, 29**.

#### Ahora está acotado: `.sitio-publico`

Los nueve selectores genéricos van prefijados con `.sitio-publico`, clase que
llevan **`Layout`, `ElBarrancoShowcase` y `EvaluacionGratuitaPage`**.
`ReservaConfirmacionPage` no la lleva porque no usa ninguna regla.

**Se acotó en positivo, no con `:not()`.** Dos razones:

1. Hay **ocho rutas de admin** y solo una cuelga del root de `AdminPage`. Las
   otras siete —`FichaCliente` ×5, `Agentes` y `Captacion`— son rutas
   hermanas. Una clase en el root del admin dejaba siete sin proteger.
2. `:not(.admin *)` exige Safari 16.4.

**Consecuencia que conviene recordar: una ruta o panel nuevo queda protegido
por defecto.** Para que `mobile.css` le aplique hay que optar explícitamente
poniéndole la clase.

#### Las dos correcciones al diagnóstico

El diagnóstico previo dio por muertas dos reglas que **no lo estaban**. Las dos
fallas son instructivas:

**`section.relative` sí existe.** Hay un `<section class="relative …">` en el
home. El grep falló porque buscaba `<section className="relative` y la clase no
va en primera posición. **Buscar clases con grep posicional es poco fiable; lo
que decide es `querySelectorAll` sobre la página renderizada.**

**`.lg\:grid-cols-3` matchea aunque la utilidad no esté activa.** Entre 768 y
1024 la *utilidad* `lg:grid-cols-3` no aplica —su media query empieza en
1024—, pero **la clase sigue estando en el atributo**, así que el selector
`.lg\:grid-cols-3` la matchea igual. Sin esa regla el grid del home pasa de 2
columnas a 1.

> **La distinción que causó el error: "la utilidad no aplica" ≠ "el selector no
> matchea".** Una clase de Tailwind es un nombre en el atributo `class` esté
> activa o no; cualquier CSS puede engancharse a ella fuera de su breakpoint.

#### Los selectores por subcadena de atributo: no usar más

`[style*="…"]` y `[class*="…"]` **causaron los dos bugs de esta jornada**:

- `[style*="background: var(--off)"]` centraba con `!important` todo `h2`, `p`
  y `.flex.items-center` del admin, porque el root tenía ese fondo inline.
- El `overflow-x: hidden` de `body` rompía el `position: sticky` del header.
  (Distinto mecanismo, misma familia: reglas globales con efectos a distancia.)

No miran una clase ni un componente: miran el **texto literal** del atributo.
Cualquiera que escriba ese string, en cualquier parte del sitio, hereda el
efecto. Son cinco en este archivo y ahora están acotados, pero **no deben
escribirse más**.

#### Cómo se verificó

**Sitio público — que nada cambie.** Para cada uno de los nueve selectores se
contó cuántos elementos matchea y cuántos de esos están dentro de
`.sitio-publico`, en **13 páginas × 2 anchos**. Los 26 casos dan *todos
dentro*: 469 elementos por ancho, ninguno fuera. Si el conteo coincide,
prefijar no le quitó efecto a nada.

Se descartó una primera prueba que cargaba el CSS viejo y el nuevo en secuencia
y comparaba el estilo computado: **el DOM cambia entre medio** por animaciones
y carruseles, y daba falsos positivos —la misma página llegaba a reportar 285 y
148 nodos—.

**Admin — que quede libre.** Medido a 390, 767, 800 y 1040:

| | antes | ahora |
|---|---|---|
| `.font-serif` | `word-break: break-word` | `normal` |
| `.grid-cols-3` | 1 columna | 3 columnas |
| header padding | 16px forzado | 16px de `px-4`, sin forzar |
| `.btn-primary` justify | `center` | `normal` |
| `[style*=repeat(2]` | 12px | 0px |

**El `word-break: break-word` era el que hacía que los títulos del admin se
partieran letra por letra** cuando la columna era angosta.

#### Las reglas borradas, y las dos que se salvaron

Verificadas borrándolas del CSSOM en vivo y comparando el estilo computado:

| Borrada | Por qué era segura |
|---|---|
| `.px-8` | `[class*="px-8"]` matchea los mismos 35 elementos con las mismas declaraciones |
| `.font-serif.display` | 0 elementos |
| `.propiedades-grid` | 0 elementos; su única aparición era la propia regla |
| `[style*="gridTemplateColumns"]…` | **no puede matchear nunca**: React convierte a kebab-case |
| `.lg\:order-1, .lg\:order-2` | debajo de 768 el `order` ya es 0, igual que `unset` |
| `footer .lg\:grid-cols-4` | 9 elementos, todos idénticos con y sin ella |

Las dos que se salvaron —`section.relative` y el `.lg\:grid-cols-3` del bloque
tablet— quedaron con un comentario en el archivo explicando por qué no se
borran.

### EL TAGLINE ES UNO SOLO: «Tu socio confiable en bienes raíces» — 2026-08-07

Sin punto final cuando va como título; con punto cuando va como frase en el
footer o en un meta. **No inventar variantes.** Convivían cuatro:

| variante | dónde estaba |
|---|---|
| «Tu socio confiable en el mundo de los bienes raíces» | footer, i18n, defaults del admin |
| «Tu socio en bienes raíces» | hero, partido en 3 claves |
| «Tus Sueños en nuestras manos» | dorso de la tarjeta de presentación |
| **«Tu socio estratégico en bienes raíces»** | **meta tags, SEO, Quiénes Somos** |

La cuarta no estaba en el encargo y era la más visible de todas: es la que leen
Google y las vistas previas de WhatsApp y LinkedIn.

#### Lo que se cambió en código — commit `5916af3`

`index.html` (description, og:description, twitter:description), `SEO.tsx`,
`HomePage.tsx`, `QuienesSomosPage.tsx`, `markup.ts` (tarjeta),
`i18n.ts`, `Footer.tsx` y los 3 valores por defecto de `Contenido.tsx`.

#### Lo que NO se toca desde el código

Los valores **vivos** de `contenido_sitio` son contenido editable y se cambian
desde el admin. Lo que hay en `Contenido.tsx` es solo el respaldo para cuando
la clave no existe en la base.

| clave | valor actual | dónde se edita |
|---|---|---|
| `hero_titulo_1/2/3` | «Tu socio» / «en bienes» / «raíces» | Textos del sitio → **Inicio** → «Título y subtítulo del hero» → Línea 1, 2 y 3 |
| `qs_titulo` | «Tu socio estratégico en bienes raíces» | Textos del sitio → **Quiénes Somos** → «Título principal» |
| `footer_tagline` | «Tu socio confiable en el mundo de los bienes raíces.» | Textos del sitio → **Contacto y Redes** → «Texto del footer» |

#### La clave `tagline` está muerta

Existe en la base y en el mapa de defaults, pero **nadie la lee y no tiene
campo en el admin**. Por eso no se encontraba dónde editarla: no hay dónde, y
cambiarla no haría nada. El footer usa `footer_tagline`, que sí es otra clave.
Si algún día estorba, se borra; no se toca ahora porque no molesta.

Verificado que el tagline no aparece en `blog_posts` (13 filas),
`paginas_legales` (3) ni `propiedades` (53).

### La línea de Captación, y por qué `scrollWidth` no la detectaba — 2026-08-07

Commit `1b2095c`. Invasión de dominio autorizada, **una sola línea**:

```
minmax(380px, 1fr)  →  minmax(min(380px, 100%), 1fr)
```

| viewport | antes (tarjeta/caja) | después |
|---|---|---|
| 360 | 380/306 → **se salía 74 px** | 306/306 |
| 390 | 380/336 → **44 px** | 336/336 |
| 430 | 380/376 → **4 px** | 376/376 |
| 1024 | 477px × 2 | **idéntico** |
| 1440 | 518px × 2 | **idéntico** |

**Lo que hay que recordar:** el síntoma no era una barra de scroll horizontal
sino **contenido cortado**. `body` lleva `overflow-x: clip` en `globals.css`,
así que el desborde se recorta en vez de generar scroll, y
`scrollWidth - innerWidth` da **0 en los dos casos**. Esa métrica no sirve para
detectar este tipo de defecto en este sitio: hay que comparar el borde de la
tarjeta con el de su contenedor.

Y de nuevo: `Emulation.setDeviceMetricsOverride` **no se re-aplica** al abrir
una sesión CDP nueva sobre la misma pestaña. Cinco mediciones seguidas
reportaron los cinco el mismo viewport. **Iframes de ancho real**, como ya
estaba anotado.

### Editor de unidades, y la trampa de `undefined` con supabase-js — 2026-08-07

| Commit | Qué |
|---|---|
| `58d4fad` | suprimir la selección de texto mientras dura el arrastre |
| `c67cd20` | el editor de unidades |

#### `undefined` NO vacía una columna: la deja fuera del UPDATE

Es lo más importante de esta entrada y aplica a **cualquier campo opcional
que se edite desde el admin**, no solo a `unidades`.

`supabase-js` serializa el payload con `JSON.stringify`, y `JSON.stringify`
descarta las claves cuyo valor es `undefined`:

```js
JSON.stringify({ unidades: undefined })  // {}                    ← la columna ni se menciona
JSON.stringify({ unidades: null })       // {"unidades":null}     ← la columna queda en NULL
JSON.stringify({ unidades: [] })         // {"unidades":[]}       ← array vacío, que NO es NULL
```

O sea: si el formulario manda `undefined`, **el valor anterior sobrevive** al
guardado. Borrar todas las unidades y guardar habría dejado las 42 de siempre
en la base, y el admin habría dicho que guardó. Es la misma familia de fallo
silencioso que motivó `avisarError`.

Por eso la conversión vive en `save()` y no en el componente:

```js
unidades: editing.unidades?.length ? editing.unidades : null
```

**Regla para el futuro: para vaciar una columna desde el admin, `null`
explícito. Nunca `undefined`, nunca omitir la clave.**

#### `null` y `[]` se ven igual en la ficha, pero no son lo mismo

`PropiedadDetailPage` hace `Array.isArray(prop.unidades) ? prop.unidades : []`
y sale si el largo es 0, así que los dos estados no dibujan nada. La ficha
genérica de oficinas se vería igual con `[]`. Se manda `NULL` igual, porque es
lo que dice la migración y porque el RAG de Sofía —que vive en otro repo— sí
podría distinguirlos.

#### `m2`: null y 0 se distinguen sin inventar centinelas

`Inp` entrega **siempre** un string, así que `''` llega distinguible de `'0'`.
`''` ⇒ `null` (la ficha muestra "Por confirmar"), `'0'` ⇒ `0`. Verificado en el
payload: `[{"piso":"PB","m2":0}]` frente a `[{"piso":"23 a 25","m2":null}]`.

#### Dos defectos que aparecieron al probar, los dos reales

**1 · El setter no puede leer del closure.** El oyente que sigue el arrastre se
monta **una sola vez**, en el `pointerdown`. Si el adaptador de `setItems` lee
`items` de la clausura, cada paso del reordenamiento parte del array original.
Medido paso a paso: un arrastre de dos posiciones daba

```
paso  4  destino=1  → [20, 3, 23a25]      correcto
paso 10  destino=2  → [3, 23a25, 20]      partió otra vez del original
```

La cura es el ref actualizado en el acto, el mismo patrón que ya estaba en
`PropImageManager`. **Cualquier consumidor nuevo de `usePointerSort` que no
use un `useState` propio necesita ese ref.**

**2 · La selección de texto compite con el arrastre.** Con el ratón, arrastrar
por encima de las filas empieza a seleccionar texto. El sidebar no lo sufría
porque lleva `userSelect: 'none'` inline; la tabla de Propiedades y las listas
nuevas sí. Ahora el hook lo suprime en `document.body` solo mientras dura el
arrastre y lo restaura al soltar — no fijo en la fila, porque estas listas
llevan campos de texto adentro.

#### Costo

`AdminPage.js` +3,95 kB sin comprimir, **+0,81 kB gzip**. Medido worktree
contra worktree.

#### Método: el panel real contra un PostgREST falso

El admin pide sesión, así que no se puede manejar desde fuera, y escribir en
producción para probar no es opción. Se empaquetó el componente **real** con
esbuild apuntando `import.meta.env` a un servidor local que devuelve dos
propiedades fijas y **registra el cuerpo crudo de cada escritura**. Eso permite
ver exactamente qué JSON habría viajado, que es justo donde vive la trampa de
`undefined`.

Tres cosas que costaron y conviene no repetir:

- El bundle servido **sin `charset=utf-8`** se decodifica como latin-1 y revienta
  el regex de diacríticos de `slugify`. El servidor de pruebas tiene que mandar
  el charset.
- **`npm run build` vacía `dist/`**, y se lleva por delante los archivos de
  prueba que se hayan dejado ahí.
- React mapea `onBlur` a **`focusout`**, no a `blur`. Un `blur` sintético no
  dispara el `onBlur` deliberado de `Inp` y nada se propaga — parecía que los
  campos no guardaban.

Y dos falsos positivos que costaron más que los defectos reales: medir con las
filas **fuera del viewport** (los eventos sintéticos no llegan, y en táctil el
navegador lo toma como scroll y manda `pointercancel`), y localizar campos por
un `placeholder` que se repite cuatro veces en la página. Los selectores de
prueba van **relativos a la fila**, nunca globales.

### TipTap alineado — ya no hace falta `--legacy-peer-deps` — 2026-08-07

```bash
npm install        # a secas. Sin --legacy-peer-deps.
```

Verificado con una instalación desde cero, sin `node_modules` ni lockfile:
exit 0 y los 32 paquetes en 3.23.6.

#### El conflicto no era el que parecía

Se veía como «`@tiptap/extension-image` está en 3.23.4 y el resto en 3.23.1».
La causa de fondo es otra: **TipTap declara sus dependencias internas con
caret pero sus peers con versión exacta** —`peer @tiptap/core@"3.23.6"`—, así
que cualquier desfase de resolución rompe.

Dos intentos fallidos antes de dar con la forma correcta, los dos vale la pena
conocerlos:

| intento | qué pasó |
|---|---|
| todo en `^3.23.6` | árbol partido: 10 paquetes en 3.23.6 y 24 en 3.29.2 |
| versión exacta en las 9 declaradas | los 20 sub-paquetes de `starter-kit` son transitivos y siguen flotando |

Con el árbol partido **el build falla**, con doce errores de tipos:
`toggleBold`, `toggleHeading` y compañía desaparecen de `ChainedCommands`
porque las augmentaciones de tipos vienen de versiones distintas. Si alguien ve
esos errores, el diagnóstico es éste y no un problema del editor.

Lo que funciona es **`overrides` cubriendo los 32**, transitivos incluidos.
Están en `package.json`. **No quitarlos**: sin ellos el árbol se vuelve a
partir en la siguiente instalación.

#### Se queda en 3.23.x a propósito

Alinear en 3.29.2 también resolvería el conflicto, y de hecho es adonde flotan
los sub-paquetes solos. Pero son seis versiones menores de salto en el editor
del blog, de las páginas legales y de las descripciones de propiedad, sobre
contenido **ya publicado**. 3.23.1 → 3.23.6 es un parche. Si algún día hace
falta subir, que sea una etapa propia con su prueba de contenido.

#### El editor, probado

Con el componente real empaquetado con esbuild, cargando el mismo HTML que ya
hay publicado. Va y vuelve intacto: `h2`, negrita, cursiva, enlace con `target`
y `rel`, lista, cita, alineación, color e imagen. Los **16 controles** de la
barra responden, sin errores de consola.

Son **tres** los consumidores, no dos: `Blog`, `PaginasLegales` y también las
descripciones de `Propiedades`.

Nota de método: la primera pasada dio cuatro fallos y los cuatro eran de la
prueba, no del editor. Tres botones caían fuera de un viewport de 390 px que
había quedado del override móvil de las pruebas de arrastre —Chrome lo conserva
entre navegaciones—, y el de color fallaba porque asignar `.value` a un
`input[type=color]` no dispara el `onChange` de React: hay que usar el setter
nativo del prototipo. **Fijar el viewport al empezar cada prueba.**

### El `.DS_Store` público no existe — 2026-08-07

`sdmcapital.cl/.DS_Store` responde **200**, y por eso parece que expone el
archivo. No lo expone: devuelve `index.html`.

```
/.DS_Store              200   4901 bytes   sha 9af21f0f3f8b
/esto-no-existe-xyz123  200   4901 bytes   sha 9af21f0f3f8b
/                       200   4901 bytes   sha 9af21f0f3f8b
```

Los tres son el mismo archivo. Lo hace `public/_redirects`, que tiene un
catch-all de SPA:

```
/*  /index.html  200
```

**Consecuencia general, más allá del `.DS_Store`: en este sitio ninguna URL
devuelve 404 nunca.** Cualquier comprobación del tipo «¿existe este archivo en
producción?» hecha mirando el código de estado va a dar un falso positivo. Hay
que comparar el contenido, o el hash, contra el de `/`.

No había nada que borrar ni que ignorar: `.DS_Store` ya estaba en `.gitignore`
desde antes, y `git ls-files` no devolvía ninguno. Los cuatro que había en el
disco eran locales y sin versionar; se borraron, pero no generaron commit
porque no había nada que commitear.

### Ya no queda arrastre HTML5 en el proyecto — 2026-08-07

**Regla: no reintroducir `draggable` + `onDragStart` / `onDragEnter` /
`onDragEnd`.** Esa API no dispara desde eventos táctiles ni en iOS ni en
Android, así que cualquier reordenamiento escrito así nace roto en teléfono.
Para reordenar hay una sola herramienta: `usePointerSort` en
`src/components/admin/useDragSort.ts`.

Los únicos `draggable` que quedan en `src/` son de Leaflet (`MapPicker`,
`PropertyMap`) y no tienen nada que ver.

| Commit | Qué |
|---|---|
| `4352f9a` | el arrastre se termina desde `window`, no desde la fila |
| `a14eeae` | los dos de `Contenido` |
| `1347901` | `PropImageManager` + `[data-orden-quieto]` |
| `94f9697` | las dos fichas de cliente |

#### Cuatro de los cinco sitios son grilla, no lista

| sitio | forma | manija |
|---|---|---|
| `PropImageManager` | grilla 3/4/5 col | ya existía de adorno |
| `CarouselPhotoManager` | grilla 2/3/5 col | ya existía de adorno |
| `HomeDestacadasSelector` | **lista** | `GripVertical` suelto |
| `FichaClienteNueva` / `Editar` | grilla `auto-fill 110px` | **no tenían** |

`usePointerSort` **no asume una sola dimensión**: busca el destino con
`document.elementFromPoint` y reordena con `splice`, que es exactamente lo que
hacían las cuatro implementaciones HTML5. Verificado con un arrastre en
diagonal sobre una grilla de 3×3: `ABCDEFGHI` → `BCDEAFGHI`.

#### El bug que apareció al probar las grillas

Soltar **fuera** de la lista dejaba el reordenamiento hecho en pantalla pero
**sin guardar**, y el commit salía después pegado a un toque cualquiera y sin
relación con él. Medido: arrastrar y soltar afuera daba `commits []`, y el
siguiente toque simple disparaba el commit.

Estaba en el hook desde el principio, o sea también en el sidebar, Propiedades,
Equipo y Asociados. No se había visto porque en una lista de una columna se
suelta casi siempre sobre otra fila; en una grilla de tres columnas soltar
fuera es facilísimo.

`setPointerCapture` **no alcanza** para cubrirlo. Si React desmonta la fila que
capturó, la captura se va con ella — y le pasa a cualquier lista que lleve el
índice dentro de la `key`, como `PropImageManager` con `key={url + i}`. Y
aunque la fila sobreviva, un `pointerup` fuera del contenedor no llega a ningún
handler nuestro.

Ahora `pointermove` / `pointerup` / `pointercancel` se escuchan en **`window`**
mientras dura el arrastre, y se quitan al terminar y al desmontar. La función
de guardado va por un ref: los consumidores la pasan como arrow inline y cambia
de identidad en cada render, mientras que los oyentes se instalan una sola vez
por arrastre.

Nota de método: la primera versión de esta prueba comparaba el **orden** antes
y después y lo daba por bueno. El orden no era el problema —cambiaba
correctamente—; el que faltaba era el **commit**. Si se vuelve a probar un
reordenamiento, mirar lo que se guarda, no lo que se ve.

#### `[data-orden-quieto]`

Las celdas del toggle y de Editar/Eliminar de `Propiedades` llevaban
`draggable={false}` para no iniciar un arrastre desde ahí. Con Pointer Events
ese atributo **no tiene ningún efecto**, así que desde el `ae82003` de esta
misma tarde arrastrar el botón Eliminar reordenaba la fila. Ahora el descarte
es explícito: cualquier elemento dentro de `[data-orden-quieto]` no arranca un
arrastre. Verificado en los dos sentidos.

Si mañana se agrega un botón dentro de una fila arrastrable, ese atributo es la
forma de excluirlo.

#### Estados que no son un `useState`

Dos de los cinco no tenían un array en estado propio y hubo que darle al hook
un setter que entienda las dos formas de `SetStateAction`:

- **`CarouselPhotoManager`** — `urls` es una vista de `d` sobre las
  `HERO_KEYS`; el setter reescribe las claves.
- **`PropImageManager`** — `imagenes` es controlada por el formulario; el
  setter reenvía a `onChange`. Acá además el ref de apoyo se actualiza **en el
  acto** y no solo en el render: si dos movimientos del puntero caen en el
  mismo frame React los agrupa, y sin eso el segundo partiría del orden viejo y
  se comería el primero.

Las ranuras vacías del carrusel siguen sin llevar `filaProps`: ni se arrastran
ni son destino, igual que antes con `draggable={!!url}`.

#### Costo: cero

| | sin comprimir | gzip |
|---|---|---|
| `AdminPage.js` | −2,02 kB | −0,72 kB |
| `subirImagen.js` | +2,01 kB | +0,84 kB |
| **total** | **−0,03 kB** | **+0,06 kB** |

`subirImagen.js` crece exactamente lo que baja `AdminPage.js`: al usar el hook
también las fichas de cliente, Rollup lo movió al chunk compartido. Borrar
cuatro implementaciones duplicadas paga el hook compartido casi al peso.

Medido **worktree contra worktree**, como corresponde desde el sesgo detectado
en la etapa anterior.

### Admin móvil — cajón que bloquea el fondo y arrastre en táctil — 2026-08-07

Dos commits.

| Commit | Qué |
|---|---|
| `306b2c0` | con el cajón abierto el fondo no scrollea |
| `ae82003` | reordenar por arrastre con Pointer Events |

#### Bloquear el scroll cuesta el header sticky. Con TODAS las técnicas.

Esto no estaba previsto y es lo más útil de anotar. Cualquier forma de impedir
que el documento scrollee desprende un `position: sticky`, porque **`sticky` es
función del scroll**: si el documento deja de scrollear, el header vuelve a su
posición natural, que con la página a 1200 px está 1200 px por encima del
viewport.

Medido a 390×844 con las tres variantes, con la página a scroll 1200:

| técnica | ¿bloquea? | `header.top` |
|---|---|---|
| `body { position: fixed; top: -scrollY }` | **sí** | −1200 |
| `body { overflow: hidden }` | **no** — siguió scrolleando a 1936 | −1200 |
| `html` + `body { overflow: hidden }` | sí | −1200 |

Se eligió `position: fixed` porque es la única que funciona en iOS: ahí
`overflow: hidden` sobre body **no alcanza**, Safari sigue scrolleando igual.

El precio de `position: fixed` es que el body deja de estar desplazado, así que
hay que compensar con `top: -scrollY` y devolver el scroll a mano al cerrar. El
`scrollTo` va con **`behavior: 'instant'`**: `globals.css` pone
`scroll-behavior: smooth` en `html` y sin eso la vuelta se ve como un salto
animado. Es la tercera vez en esta sesión que ese `smooth` muerde.

Y para el header desprendido: mientras el cajón está abierto pasa a `fixed` y
el contenedor lleva un relleno igual a su alto —medido con
`getBoundingClientRect` justo antes de abrir, porque en móvil el header no usa
`--admin-header-h`— para que el contenido no salte al sacarlo del flujo.
Verificado: el contenido no se mueve **ni un píxel** al abrir ni al cerrar.

Los valores de `document.body.style` se guardan y se restauran, no se fuerzan a
un valor fijo: si el efecto se interrumpe, el sitio vuelve a como estaba y no a
un `overflow: visible` inventado por nosotros. Comprobado que `body` queda sin
atributo `style` residual.

#### El sidebar NO usaba `useDragSort`

Tenía su propia copia inline del mismo algoritmo, con sus propios
`dragTab` / `dragOverTab`. Eran dos implementaciones del mismo reordenamiento
en dos archivos. Ahora la mecánica vive una sola vez en **`usePointerSort`**, y
`useDragSort` es esa mecánica más la sincronización desde props que necesitan
los tres paneles. El sidebar usa `usePointerSort` directo porque su orden vive
en `localStorage` y en estado local: la sincronización de `useDragSort` ahí
sobraría y pelearía.

#### Ratón desde toda la fila, dedo solo desde la manija

No es una inconsistencia, es la única combinación que funciona. Con el dedo, si
se pudiera arrastrar desde cualquier parte de la fila **no quedaría forma de
scrollear la lista**. Con el ratón esa restricción no compra nada y achicaría
el blanco de la interacción que hoy se usa.

`touch-action: none` va **solo en la manija**, no en la fila: le dice al
navegador que un gesto que empieza ahí no es un scroll, y deja el resto de la
fila scrolleando como siempre.

Umbral de **6 px** antes de que cuente como arrastre: cualquier toque con el
dedo trae uno o dos px de temblor, y sin umbral un toque simple reordenaría.

Medido contra el hook real —empaquetado con esbuild, no una reimplementación
del test—:

| | resultado |
|---|---|
| ratón, arrastre desde el CUERPO de la fila | `ABCDEF` → `BCDAEF`, un commit |
| ratón, click posterior al arrastre | **no se dispara** |
| ratón, click simple | selecciona, orden intacto |
| dedo, arrastre desde la MANIJA | `ABCDEF` → `BCDAEF`, un commit |
| dedo, toque simple en la manija | no reordena |
| dedo, arrastre desde el CUERPO | orden intacto, la lista scrollea 0 → 370 px |

#### Lo único que se pierde

El fantasma semitransparente que dibujaba el navegador solo con la API HTML5.
No hay forma de conservarlo fuera de esa API. Se reemplaza reordenando la lista
**en vivo** durante el arrastre, que además muestra el resultado antes de
soltar.

#### Costo

`AdminPage.js` **+1,82 kB** sin comprimir, **+0,79 kB** gzip. Pointer Events es
más código que las ocho líneas de la API HTML5; se paga por tener la función en
el teléfono.

Nota de método: la primera medición dio `index.js` +0,41 kB y
`ReservaConfirmacionPage` +0,04 kB, dos chunks que este cambio no toca. Era
sesgo de comparar un build en worktree contra uno en el directorio principal.
Repetido **worktree contra worktree** esos dos desaparecen. Si se vuelve a
medir un delta de chunks: las dos puntas del mismo tipo de directorio.

#### Alcance mayor al anunciado

El brief acotaba el dominio a `AdminPage.tsx` y `useDragSort.ts`, dando por
hecho que el sidebar usaba el hook. Como no lo usaba, cambiar la API del hook
obligaba a tocar también sus tres consumidores: `Propiedades.tsx`,
`Equipo.tsx` y `Asociados.tsx`. Los tres ya tenían su `GripVertical`; solo hubo
que envolverla en `manijaProps`. En `Propiedades` además se destapó debajo de
`lg`, donde estaba oculta por el mismo motivo que la del sidebar: como la fila
es `flex-wrap` y la celda del título lleva `w-full`, la manija queda en su
propia franja arriba de la tarjeta.

### Fase 3 — Tailwind: hover a CSS y la migración masiva DESCARTADA — 2026-08-07

Cuatro commits. Ninguno migra `style={{}}` a clases: esta etapa solo hace lo
que **borra** código.

| Commit | Qué | Saldo |
|---|---|---|
| `f86250e` | 17 clases muertas fuera de `globals.css` | −15 líneas |
| `9748d55` | los 20 hover del admin pasan a `hover:` | −20 handlers |
| `9f8208f` | Header (20) y Footer (14) | −34 handlers |
| `8d5ca39` | las 10 páginas públicas restantes | −36 handlers |

#### La decisión: NO se migran los 1.457 `style={{}}`

El inventario del paso 0 midió el objetivo antes de tocarlo, y el número lo
desaconsejó:

| | |
|---|---|
| objetos `style={{}}` | **1.457** en 56 archivos |
| peso en el bundle | **115,8 kB**, el **3,2 %** |
| propiedad más repetida | `border` (158), después `lineHeight` (112) |

El 3,2 % no es lo que decide. Lo que decide es que **migrar transforma, no
elimina**: un `style={{ border: '1px solid var(--border)' }}` que pasa a
`className="border border-[var(--border)]"` sigue ocupando bytes, ahora en el
CSS en vez del JS. En `border` y `lineHeight` —las dos propiedades más
repetidas, 270 apariciones entre las dos— la migración no gana nada: Tailwind
genera una utilidad por valor distinto y el ahorro se lo come la clase.

Se descarta 1.457 ediciones de riesgo real sobre un sitio en producción a
cambio de un ahorro que no está demostrado. Si alguien lo vuelve a proponer,
el número que hay que rebatir es ese: **3,2 %, y transformando en vez de
eliminando**.

#### Lo que sí se hizo: hover

Los 90 `onMouseEnter`/`onMouseLeave` que solo cambiaban apariencia sí eran
JavaScript eliminable de verdad. Quedan **4** en todo el proyecto, los del
`Header` que abren los desplegables — ésos mueven estado, no color.
`Captacion.tsx` no tenía ninguno.

Con ellos se fueron tres `useState` de `ElBarrancoShowcase`, que existían solo
para escalar una imagen. El wrapper lleva `group` y el `<img>`
`group-hover:scale-[1.06]`.

**La trampa:** el `style` inline gana siempre sobre la clase. Si el handler
pisaba una propiedad que también estaba en el `style`, hay que **sacarla del
`style`** — dejarla anula el `hover:` en silencio, sin error de build y sin
que se note salvo pasando el mouse por encima.

#### El bundle SUBIÓ, y era previsible

Se esperaba que bajara. Medido contra `7d1994b`, construyendo las dos puntas:

| | sin comprimir | gzip |
|---|---|---|
| JS | **−5,49 kB** | −0,18 kB |
| CSS | **+3,54 kB** | +0,46 kB |
| **total** | **−1,91 kB** | **+0,28 kB** |

Sin comprimir baja; **gzipeado sube**, que es lo que se transfiere. El JS que
se borró era la misma cadena repetida 90 veces y gzip ya la reducía casi a
nada; las utilidades `hover:` que la reemplazan son cadenas distintas entre
sí. La razón para hacer este cambio es que hay 90 handlers menos que mantener,
no el peso.

#### Las 17 clases muertas eran 17, no 13

Se listaron 13 —"ocho de color"— y eran **doce**: `.text-navy`,
`.text-navy-dark`, `.text-green-sdm`, `.text-sky-sdm`, `.text-muted`,
`.bg-navy`, `.bg-navy-dark`, `.bg-navy-deeper`, `.bg-green-sdm`,
`.bg-sky-pale`, `.bg-off`, `.border-sdm`. Todas duplicaban lo que Tailwind ya
genera desde la paleta de `tailwind.config.js`.

Verificado con `querySelectorAll` sobre la página renderizada en 14 rutas —
**no con grep**, por lo que pasó con `section.relative` en `mobile.css`: un
`class="relative …"` donde la clase no va primera no aparece en un grep
posicional y se declara muerto lo que está vivo.

#### El `hover:` se queda pegado en táctil — y ya se quedaba antes

En Tailwind 3.4 `hover:` **no** va envuelto en `@media (hover: hover)`; eso es
opt-in vía `future.hoverOnlyWhenSupported`, y este proyecto no lo tiene. Así
que en teléfono el estado persiste tras el toque.

Medido en Chrome con touch emulado, dos botones idénticos lado a lado, uno con
`:hover` de CSS y otro con `onmouseenter`, tocando **uno por vez**:

| | reposo | tras tocarlo | tras tocar afuera |
|---|---|---|---|
| CSS `:hover` | verde | **navy** | verde |
| JS `onmouseenter` | verde | **navy** | verde |

Idénticos. La persistencia existía antes de la migración y existe después: el
navegador sintetiza `mouseenter` en el toque y no manda `mouseleave` hasta el
siguiente toque en otro lado. **No es una regresión** y no hay nada que
arreglar acá.

El primer intento de esta medición tocaba los dos botones seguidos, así que el
primero perdía el hover porque se tocó el segundo, no por el mecanismo. Si se
vuelve a medir: **un elemento por vez**.

### Fase 3 — Limpieza: `FotosAdmin` eliminado y comentarios al día — 2026-08-06

Dos commits. Cierra las dos deudas que el refactor fue dejando anotadas.

| Commit | Qué |
|---|---|
| `5d392f2` | borrado de `FotosAdmin` |
| `71dbb6d` | comentarios desactualizados |

#### Por qué se borró `FotosAdmin`

Leía de **Supabase Storage**, no de R2, que es donde viven las imágenes del
sitio desde hace meses. La documentación del proyecto ya decía que no debía
usarse para fotos de propiedades porque apunta a otra carpeta. Además los 390
archivos huérfanos de Supabase Storage se borran después del **2026-09-01**,
así que el panel iba a quedar listando archivos inexistentes.

Se eliminó el componente, su entrada en `DEFAULT_TABS`, su rama de render,
`'fotos'` del tipo `Tab` y los imports que quedaron huérfanos: `subirImagen` y
los iconos `Image`, `Check` y `X`, que solo usaba ese panel. **`supabase` se
queda**: lo usan `useAdminAuth`, `LoginForm` y el botón de cerrar sesión.

#### El riesgo era `localStorage`, y estaba cubierto

`STORAGE_KEY` persiste el orden de pestañas como array de claves. Si Víctor
tenía `'fotos'` guardado y la clave desaparece de `DEFAULT_TABS`, el admin
tenía que ignorarla sin romperse.

`loadTabOrder` **ya lo manejaba**, sin necesidad de tocarlo:

```js
const sorted = order.map(key => DEFAULT_TABS.find(t => t.key === key)).filter(Boolean)
DEFAULT_TABS.forEach(t => { if (!sorted.find(s => s.key === t.key)) sorted.push(t) })
```

`.find()` devuelve `undefined` para una clave desconocida, `.filter(Boolean)`
la descarta, y el `forEach` reincorpora las pestañas que falten. Se simularon
cuatro casos —`'fotos'` en medio del orden, `'fotos'` como única clave
guardada, sin nada guardado y JSON corrupto— y los cuatro dan 12 pestañas sin
huecos.

**La pestaña activa no se persiste** (`useState<Tab>('propiedades')`), así que
tampoco podía quedar apuntando a un panel inexistente.

#### Comentarios corregidos

| Archivo | Qué decía | Qué se hizo |
|---|---|---|
| `Barranco`, `Rental`, `Vende` | `// Sec y Full: definidos a nivel de módulo, junto a ContenidoAdmin.` | borrado — falso desde la Etapa 2 |
| 8 paneles | `Extraída de AdminPage.tsx sin cambios: mismo markup` | reescrito: la etapa de iconos **sí** cambió el markup |
| `layout.tsx` | `Las usan ContenidoAdmin, BarrancoAdmin, RentalAdmin y VendeAdmin` | nombres actuales |
| `useDragSort.ts` | `Lo usan PropiedadesAdmin, Equipo y Asociados` | nombres actuales |

`Blog.tsx` y `Mensajes.tsx` **conservan la redacción original** de la
cabecera: en esos dos sigue siendo exacta, porque la etapa de iconos no los
tocó. Verificado con `git diff --name-only` entre `6032ff1` y `81a8940`.

La nota histórica de `layout.tsx` sobre el bug de remontaje se conserva —es el
motivo de la regla— pero con los nombres actuales, para que se puedan
encontrar en el repo.

El commit de comentarios **no cambió ni una línea de código**, y el chunk
`AdminPage` conservó el hash exacto. Es la prueba de que fue solo prosa.

#### Chunks

| Chunk | Iconos | Limpieza | Delta |
|---|---:|---:|---:|
| `AdminPage` | 176,10 kB | **172,83 kB** | **−3,27 kB** |
| `pdf` | 2.054,86 kB | igual | — |
| `iconos` | 30,67 kB | **mismo hash** | — |
| `index` | 238,90 kB | igual | — |

`iconos` no bajó porque `Image`, `Check` y `X` los siguen usando otros
paneles; lo único que se fue es el uso que hacía `FotosAdmin`.

`pdf` sigue fuera de los imports estáticos del chunk `AdminPage`. `index`
difiere en 37 caracteres: `errores` y `subirImagen` volvieron a permutarse en
`__vite__mapDeps` porque `AdminPage.tsx` dejó de importar `subirImagen`.
Verificado que las 9 rutas lazy precargan el mismo conjunto de chunks.

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
