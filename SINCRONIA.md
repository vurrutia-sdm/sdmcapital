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
| 2026-08-07 | UX copy — tanda 1 | Errores, confirmaciones de borrado y confirmación de guardado. **Tocó `src/lib/errores.ts`, que es ZONA COMPARTIDA** — solo el texto de la alerta; la firma y el log a consola quedan igual | Cerrada — commits `a1c53a9`, `8187a81`, `4cdcbd2` y `4ad82a8` |
| 2026-08-07 | UX copy — tanda 2 | Estados vacíos, consistencia de botones, tuteo, últimos emojis. **Tocó `src/types/index.ts`, que es ZONA COMPARTIDA** — borró `agente_id`, un campo cuya columna nunca existió | Cerrada — commits `153765c`, `55ac084`, `edf05b6`, `e9ed05e` y `36a093e` |
| 2026-08-07 | UX copy — tanda 3 | Las listas que se recortaban en silencio, más dos pendientes de la tanda 2 | Cerrada — commits `490fa33`, `59c5feb` y `b2df33d` |
| 2026-08-07 | UX copy — subida de fotos | La subida descartaba archivos en silencio. Solo `src/pages/admin/Propiedades.tsx` | Cerrada — commit `0d95c6d` |
| 2026-08-07 | UX copy — `<SEO>` en las rutas que faltaban | Blog, post, asociados, reserva, 404 y showcase. **Tocó `src/pages/`, dominio de la sesión web pública**, y `src/App.tsx` para la 404 | Cerrada — commit `209ec68`. **Deja dos pendientes: la Function del blog y el og-image roto** |
| 2026-08-07 | OG — imagen por defecto y Function del blog | **Invasión de dominio autorizada: `SEO.tsx` (og-image.jpg → .png) y `functions/blog/[slug].js` (nuevo, calcado de `propiedades/[id].js`).** `functions/` es de la sesión Sofía; no se tocó nada más de ahí | Cerrada — commits `b464c5b` y `42d61cb` |
| 2026-08-07 | Accesibilidad — tanda 1: contraste | **Cambio en zona compartida: correcciones de contraste WCAG AA en la paleta y en las clases de componente. Afecta a todo el sitio.** Tocó `src/styles/globals.css`; `tailwind.config.js` no hizo falta | Cerrada — commits `4a0c90c`, `fe9cc70`, `abb845d` y `60b144d` |
| 2026-08-07 | Sistema de color — tanda 1 | Insignias de estado y de oportunidad a variables semánticas, con contraste AA. **Tocó `src/styles/globals.css`, ZONA COMPARTIDA** | Cerrada — commit `12a46e2`. **`.btn-evaluacion` NO se eliminó: la condición de parada del encargo se disparó, ver el registro** |
| 2026-08-07 | Sistema de color — botón invertido | `.btn-evaluacion` eliminado, `.btn-inverse` creada. **Tocó `src/styles/globals.css`, ZONA COMPARTIDA** | Cerrada — commit `8c9770b` |
| 2026-08-07 | Color de estado — «Reservada» a tono frío | `--estado-reservada` de ámbar a petróleo, por daltonismo. **Tocó `src/styles/globals.css`, ZONA COMPARTIDA** | Cerrada — commit `f3d5860` |
| 2026-08-07 | Sistema de color — unificar la paleta paralela | **Los cinco colores del módulo de fichas pasan a la paleta oficial. La paleta paralela queda eliminada** | Cerrada — commits `2560d41`, `fcc24dc`, `788f51f` y `0768274` |
| 2026-08-08 | Sistema de color — el rojo de error | `--error: #A8384B` nace en **`src/styles/globals.css`, ZONA COMPARTIDA**, y reemplaza los 21 literales `#E24B4A` de admin y web pública. Antes, el precio rebajado de `PropiedadDetailPage` deja de usar el rojo y pasa a `--oportunidad`. **`Captacion.tsx` no se toca** — su uso queda pendiente | Cerrada — commits `95e7b25` y `c7ee2a7` |
| 2026-08-06 | Admin — sticky del header en móvil | **CAMBIO EN ZONA COMPARTIDA**: `src/styles/mobile.css` pasa de `overflow-x: hidden` a `clip`. Completa el cambio de `globals.css` — `html: clip` + `body: hidden` también rompe el `position: sticky`. **Afecta a todo el sitio debajo de 768px** | Cerrada — el header se pega en los 7 anchos medidos, commiteada, desplegada y verificada |
| 2026-08-06 | Admin — sticky del header | **CAMBIO EN ZONA COMPARTIDA**: `html` y `body` pasan de `overflow-x: hidden` a `clip`. `hidden` creaba contenedor de scroll y rompía el `position: sticky` del header del admin. `clip` recorta igual sin ese efecto. **Afecta a todo el sitio** | Cerrada — escritorio arreglado y verificado. **Debajo de 768px sigue roto**: `mobile.css` reintroduce `body { overflow-x: hidden }` |
| 2026-08-06 | Admin — Fase 3, escala tipográfica (fase 2, tanda 2) | **INVASIÓN DE DOMINIO** sobre `src/pages/` (fuera de `admin/`), `src/components/sections/` y `src/components/ui/`, para completar la migración iniciada en la tanda 1 | Cerrada — 29 archivos, 4 commits, desplegada y verificada. **Los 17 `em` quedan pendientes de tu revisión** |
| 2026-08-08 | Accesibilidad — tanda 2: etiquetas de formulario (paso 1) | Los tres formularios **públicos** pasan a `<label>` que envuelve al control: `ContactSection`, `SolicitudCreditoForm` y `VendeConNosotrosPage`. **`campos.tsx` NO se toca** — el paso 2 espera el visto bueno | Cerrada — commits `20d7fd4`, `e260e6e` y `5d3b007` |
| 2026-08-08 | Accesibilidad — tanda 2: etiquetas de formulario (paso 2) | `Field` envuelve a su control (152 campos del admin), nace `FieldGroup` para los 19 editores compuestos, y los `<select>` de `SearchBar` reciben rótulo asociado. **Toca `src/components/admin/campos.tsx` y `src/components/sections/SearchBar.tsx`** | Cerrada — commits `ed40ebe`, `7db6be7` y `03fed5c` |
| 2026-08-08 | Accesibilidad — tanda 2: cierre de los tres archivos | `PropiedadesPage`, `MapPicker` y `ElBarrancoShowcase` (9 campos), más el `aria-label` del input de URL de `ImageUploader`. **El barrido completo destapó 83 campos sin asociar en 10 archivos más** | Cerrada — commits `b184fa8` y `44e890a` |
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

### LA PALETA OFICIAL ES LA ÚNICA — 2026-08-07

Commits `2560d41`, `fcc24dc`, `788f51f`. **Los colores viven en
`src/styles/globals.css`. No se escriben literales hexadecimales en los
componentes.**

El módulo de fichas de cliente y agentes tenía una paleta completa propia — 164
usos, cero `var(--)` de la oficial. No fue deriva: entró de una en el commit
`8c9e412` (2026-06-24, 152 archivos), **dos meses después** de que la paleta
existiera en el primer deploy. Ya usaba la escala tipográfica oficial; lo único
desalineado era el color.

| paralelo | → oficial | ΔE | qué arregla |
|---|---|---|---|
| `#F5F7FA` | `--off` | 1.2 | nada, era invisible |
| `#DCE4EC` | `--border` | 2.6 | nada, umbral |
| **`#7A8FA6`** | **`--muted`** | 11.6 | **3.33 → 5.03:1** |
| **`#4DB870`** | **`--green-dark`** | 18.6 | **2.50 → 4.85:1** |

`#7A8FA6` era **peor que el `#7a8a96` que la Fase 1 ya había descartado** por no
cumplir: 3.33 contra 3.56. La corrección se aplicó a la variable y este módulo,
al no usarla, se la saltó. **Ése es el argumento contra los literales**: una
corrección centralizada no alcanza a quien no está centralizado.

#### Las dos excepciones

**`tarjeta.css` se queda con su tercera paleta.** Está justificada: se importa
`?raw` y se inyecta en un contenedor que `html-to-image` rasteriza a PDF, sin el
reset global. Define sus variables con ámbito propio en `.sdm-pcard, .sdm-sheet`.
Es autocontención deliberada, no desconocimiento.

**`Captacion.tsx` queda con 5 usos pendientes** —`#0D2240`, `#7A8FA6`, `#F5F7FA`
y `#4DB870` en su objeto `COLORS`— por ser dominio de la sesión Sofía. Necesita
autorización.

#### Lo que se revisó antes de tocar

- **Los 6 usos de `#DCE4EC` como texto** son los seis el mismo elemento: el `|`
  que separa «← Volver al admin» del título. Separador tipográfico, mismo rol
  que un borde, y **WCAG exime el texto puramente decorativo**, así que su
  1.28:1 no es incumplimiento. Merecería `aria-hidden`: hoy se lee como «barra
  vertical».
- **El aviso de `--muted` sobre `#0D2240` no se materializó.** Revisados los 36
  usos uno por uno, ninguno está sobre fondo oscuro. Los tres que un primer
  barrido marcó eran falsos positivos: lo que detectaba era el color de **texto
  de un hermano**, no un fondo.
- `#a0b4c4` de botones deshabilitados **no se toca**: WCAG exime los controles
  deshabilitados.

#### Los dos navy quedan pendientes

`#0D2240` (59 usos) y `#1A2E44` (14) siguen como literales. Ver la entrada
siguiente.

### `#0D2240` y `#1A2E44`: RESUELTO, los dos a `--navy-dark` — 2026-08-07

**No son el mismo rol con dos valores por descuido: hacen trabajos distintos.**

| | `#0D2240` | `#1A2E44` |
|---|---|---|
| como fondo | **20 usos** | **0** |
| como texto | 31 | 12 |

`#0D2240` **como fondo** son: el portón de sesión a pantalla completa
(`minHeight: 100vh`, dos por archivo × 5), los círculos de avatar con iniciales,
las barras de cabecera de la vista de impresión, el marcador de foto, y dos
botones. **Como texto** son títulos, nombres y valores, siempre sobre claro.

`#1A2E44` **nunca es fondo**. Sus 12 usos se reparten en dos grupos: el `color`
del `inputStyle` compartido de cada archivo (5), y el párrafo «Debes iniciar
sesión.» (7).

Comprobado que ese párrafo **no** está sobre el panel oscuro —hay una tarjeta
blanca en medio—, así que da 13.83:1 y no hay bug.

**Resuelto en el commit `0768274`: los dos a `--navy-dark`.** `#1A2E44` nunca
era fondo, así que no eran dos roles con dos valores sino un rol con dos valores
por descuido.

**Dos correcciones a la premisa, las dos medidas:**

1. **`--navy-dark` NO es más oscuro** que `#0D2240`. Tiene menos azul y algo más
   de luminancia (0.0168 contra 0.0160), así que el blanco encima **baja** de
   15.91 a 15.71. Es −0.20 sobre 15.7:1: imperceptible, y a 3,5× del umbral AA.
   No se detuvo porque ningún caso se acerca a fallar.
2. **En el PDF gasta MENOS tinta, no más:** la cobertura CMYK baja de **202 % a
   181 %**. La preocupación estaba invertida.

| los 21 fondos, texto encima | antes | después |
|---|---|---|
| portón «Verificando…», blanco 70 % (5) | 8.40 | 8.35 |
| avatares, iniciales blancas (6) | 15.91 | 15.71 |
| cabeceras de impresión (2) | 15.91 | 15.71 |
| botón «Imprimir» y «Agregar fotos» (3) | 15.91 | 15.71 |
| portón «Debes iniciar sesión» (5) | sin texto directo — hay una tarjeta blanca encima | |
| marcador de foto (1) | sin texto | |

| los 43 como texto sobre claro | antes | después |
|---|---|---|
| `#0D2240` sobre blanco | 15.91 | 15.71 |
| **`#1A2E44` sobre blanco** | 13.83 | **15.71** |
| `#0D2240` sobre `--off` | 15.22 | 15.04 |
| **`#1A2E44` sobre `--off`** | 13.24 | **15.04** |

### EL SEPARADOR «|» DE LAS CABECERAS ES DECORATIVO. NO «ARREGLARLO». — 2026-08-07

En las seis pantallas del módulo de fichas, la cabecera lleva
`← Volver al admin | Título`. Ese `|` es un `<span>` con `color: var(--border)`,
que da **1.28:1** sobre blanco.

**No es un incumplimiento.** WCAG exime el texto puramente decorativo, y esto es
un separador —el mismo papel que una línea de 1 px—, no contenido. Usa
`--border` a propósito, que es la variable de las separaciones decorativas (ver
la entrada de `--border` contra `--border-input`).

Si una auditoría automática lo marca, es un falso positivo.

**Lo que sí le falta es `aria-hidden`:** hoy un lector de pantalla lo anuncia
como «barra vertical» entre el enlace y el título. Pendiente, no hecho.

### Lo que queda de literales en el módulo de fichas — 2026-08-07

La paleta paralela **catalogada** —los cinco colores del diagnóstico— está
eliminada: cero apariciones. Pero hay una cola que el diagnóstico no había
contado, casi toda en `FichaClienteVer.tsx`, que es la vista de impresión:

| color | dónde | veredicto |
|---|---|---|
| `#aabccc` `#7a9ab8` `#9aafc2` | texto sobre las barras oscuras del PDF | **cumplen**: 4.69 a 8.06 |
| `#162e4a` | fondo de una barra de impresión | fondo, sin problema |
| `#c0cdd8` | color de iconos `<Image>` y `<ChevronRight>` sobre blanco | **1.62** — decorativos, pero el chevron indica navegación y 1.4.11 pediría 3:1 |
| `#e8edf2` | escrito como literal en vez de `var(--border)` | mismo valor, solo falta la variable |
| `#a0b4c4` | botones deshabilitados | exento |
| `#e24b4a` | errores | es el rojo de todo el proyecto, sin variable oficial |

Ninguno justifica otra tanda por sí solo, pero está anotado para que «cero
literales» no se lea como más de lo que es.

### LOS COLORES DE ESTADO SE VERIFICAN CON ΔE2000 BAJO DALTONISMO — 2026-08-07

Commit `f3d5860`. **El criterio, para cualquier color de estado que se agregue:**

| pregunta | medida | criterio |
|---|---|---|
| ¿se lee el texto sobre la insignia? | **ratio de luminancia** WCAG | ≥ 4.5:1 |
| ¿se distinguen dos estados entre sí? | **ΔE2000** | > 10 |
| ¿los distingue alguien con daltonismo? | **ΔE2000 sobre la simulación**, protanopia y deuteranopia | > 10 |

**Los tres hacen falta y miden cosas distintas.** El ratio dice si el texto se
lee; el ΔE dice si dos estados se diferencian. Un color puede cumplir 4.5:1
perfecto y ser indistinguible de su vecino.

#### Qué pasó con «Reservada»

En ámbar `#B45309` cumplía contraste (5.02:1) y **bajo deuteranopia daba ΔE2000
de 2.1 contra «Vendida»**: prácticamente el mismo color. El ámbar anterior
`#D97706` tampoco se salvaba. Rojo contra naranja es justo el par que esas
condiciones colapsan, y la deuteranopia es la forma más común —alrededor del
6 % de los hombres—.

Se buscó barriendo H165-300°, S30-95 %, L18-52 %, filtrando por contraste ≥4.5 y
ordenando por **el peor ΔE** contra los otros tres estados en las tres
condiciones. Ganó `#1F5F6B` — petróleo, H189° S55% L27%.

| | |
|---|---|
| contraste con blanco | **7.22:1** (antes 5.02) |
| peor ΔE de los nueve pares | **21.2** |
| distancia de `--navy` | 16.7 — familia adyacente, distinto |

**La agrupación es también semántica:** «Reservada» y «Arrendada» son ocupación
temporal y ahora son las dos frías; «Vendida» es lo único definitivo y se queda
sola en rojo.

#### La matriz completa, cinco estados × tres condiciones

Peor par en cada condición, excluyendo «Precio rebajado» vs «Bono Pie» que son
**el mismo color a propósito** (nunca coexisten):

| condición | peor par | ΔE |
|---|---|---|
| normal | Reservada vs Arrendada | 23.3 |
| protanopia | **Vendida vs Precio rebajado** | **10.2** |
| deuteranopia | Vendida vs Precio rebajado | 16.3 |

**El par más ajustado del sistema ya no es Vendida/Reservada sino Vendida contra
Precio rebajado bajo protanopia: 10.2**, justo en el umbral. Es rojo contra
verde, que es lo que la protanopia colapsa, y son de familias distintas —una de
estado y otra de oportunidad— así que pueden aparecer en la misma tarjeta. Pasa,
pero es el siguiente candidato a revisar si algún día se toca la paleta.

#### Costo

Cero: `+0,02 kB gzip`, y es ruido de compresión. Se cambió un valor hexadecimal.

### `.btn-evaluacion` eliminado · `.btn-inverse` es la contraparte que faltaba — 2026-08-07

Commit `8c9770b`.

#### Por qué se fue el dorado

Rompía **cuatro principios del sistema a la vez**: degradado donde el sistema
usa color plano, `box-shadow` donde usa bordes finos, negrita siendo el único
botón así, y un brillo animado en `:hover` donde el sistema dice movimiento
mínimo. Se eliminó con su `::after` y su `@keyframes`.

**La jerarquía que expresaba sí era correcta** —es el único de los tres botones
que convierte; los otros dos navegan a leer— así que lo que cambió es el
tratamiento, no el peso.

#### `.btn-inverse` NO es una excepción

`.btn-primary` es navy sobre claro; **`.btn-inverse` es claro sobre navy**.
Mismas propiedades salvo los dos colores: plana, sin sombra, sin degradado,
mismo peso (500), mismo radio, mismo padding.

Hacía falta porque sobre el panel `--navy-dark` de la sección de financiamiento
**`.btn-primary` es literalmente invisible**: el botón y el fondo son el mismo
color, `1.00:1`. No era «poca separación».

| | contra el panel | texto sobre el botón |
|---|---|---|
| `.btn-inverse` `#FFFFFF` | **15.71** | **15.71** |

Se llama `inverse` y no `invertido` para seguir a las cuatro clases que
sobreviven —`primary`, `green`, `outline`, `text`—, todas en inglés.
`evaluacion` era la única en español y era justo la que se iba.

Jerarquía resultante en esa sección, sobre panel `--navy-dark`:

| botón | tratamiento | separación del panel | rol |
|---|---|---|---|
| Personas | verde sólido | 3.24 | navega a leer |
| Empresas | contorno blanco | borde a 15.71 | navega a leer |
| **Evaluación** | **blanco sólido** | **15.71** | **convierte** — único `<button>` |

Los tres se distinguen por tratamiento, no solo por color, y el que convierte es
el más contrastado. Es el orden correcto.

### PARA SABER SI DOS COLORES SE DISTINGUEN, LA MEDIDA NO ES EL CONTRASTE

Quedó claro tres veces seguidas y conviene que no se repita:

| pregunta | medida correcta | medida que NO sirve |
|---|---|---|
| ¿se lee este texto sobre este fondo? | **ratio de luminancia** (WCAG 1.4.3) | — |
| ¿se distinguen estos dos colores? | **ΔE2000** | el ratio de luminancia: dos tonos opuestos de igual claridad dan ~1.0 y se ven clarísimamente distintos |
| ¿los distingue alguien con daltonismo? | **ΔE2000 sobre la simulación** | el ΔE2000 normal |

#### Aplicado: «Vendida» contra «Reservada»

**Sí coexisten en pantalla.** De las 53 propiedades activas hay **3 vendidas** y
**2 reservadas**, todas en la misma grilla de `/propiedades`, así que dos
tarjetas contiguas pueden llevar una de cada una.

| par | ΔE2000 |
|---|---|
| Vendida `#C0392B` vs Reservada **nueva** `#B45309` | **13.8** |
| Vendida vs Reservada **vieja** `#D97706` | 24.7 |
| Vendida vs Arrendada `#2563EB` | 44.4 |

A 13.8 **se distinguen** en visión normal —por encima de 10 son colores
distintos—, aunque oscurecer el ámbar para cumplir contraste costó casi la mitad
de la separación que había.

**El problema real es otro, y no estaba en el encargo:**

| simulación | Vendida | Reservada | ΔE2000 |
|---|---|---|---|
| protanopia | `#636329` | `#6C6C03` | **6.8** |
| **deuteranopia** | `#7C7C1A` | `#7E7E00` | **2.1** |

**Con deuteranopia —la forma más común de daltonismo, ~6 % de los hombres— las
dos insignias son prácticamente el mismo color.** 2.1 está en el umbral de lo
imperceptible. Y con el ámbar viejo tampoco se salvaba: rojo y naranja es
exactamente el par que estas condiciones colapsan.

Se distinguen por el **texto** de la insignia, que sí es distinto. Pero el color
no está aportando información para esos usuarios. Si se quiere que aporte, hay
que sacar «Reservada» de la franja rojo-naranja, no oscurecerla más. **No se
tocó: es decisión de diseño.**

#### Costo

`index.css` **−0,14 kB gzip**. Se borró más de lo que se agregó.

### Insignias: dos familias, y el rojo que significaba dos cosas — 2026-08-07

Commit `12a46e2`.

#### Las variables y qué significan

| variable | valor | blanco encima | qué comunica |
|---|---|---|---|
| `--estado-vendida` | `#C0392B` | **5.44** | la propiedad ya no está disponible |
| `--estado-reservada` | `#B45309` | **5.02** | tiene una reserva en curso |
| `--estado-arrendada` | `#2563EB` | **5.17** | ya no está disponible |
| `--oportunidad` | `#2D8055` | **4.85** | tiene una ventaja comercial |

**Son dos familias y no deben mezclarse.** *Estado* dice en qué situación está
la propiedad y ocupa la insignia de arriba; *oportunidad* dice qué ventaja tiene
y ocupa la de abajo. Pueden convivir una de cada una; dentro de cada familia son
excluyentes.

#### El rojo significaba dos cosas opuestas

`#c0392b` se usaba para «Vendida» **y** para «Precio rebajado»: un cierre y una
oportunidad, con el mismo color, en una grilla donde conviven. El rojo se queda
con «Vendida», que es lo que comunica.

«Precio rebajado» y «Bono Pie» comparten `--oportunidad` **a propósito**: nunca
coexisten —la insignia secundaria es una o la otra— y ahora se leen como familia
frente a las de estado. `--oportunidad` es `--green-dark`, o sea **no se agrega
un color nuevo** a la paleta.

El ámbar de «Reservada» sube manteniendo el tono: H32° → H26°, claridad 44 % →
37 %. Es el candidato más cercano al original que llega a 4.5.

**Nota de método:** para «¿se distinguen a simple vista?» el ratio de luminancia
**no sirve** —dos colores de tono opuesto e igual claridad dan ~1.0 y se ven
clarísimamente distintos—. La medida es la distancia de tono. `--oportunidad`
está a **143°** del rojo de «Vendida»; el ámbar, a **20°**, que es la
convergencia que ya tenía y que oscurecerlo acentúa un poco.

### `.btn-evaluacion` NO se eliminó: `.btn-primary` sería INVISIBLE ahí

Se pidió reemplazarlo por `.btn-primary` en sus dos usos. En uno funciona; en el
otro **no puede funcionar**, y el encargo traía una condición de parada para
justo esto.

| dónde | fondo del panel | `.btn-primary` sobre él |
|---|---|---|
| `ServiciosPage.tsx:86` | `bg-white` | **15.71** ✓ |
| `HomePage.tsx:275` | **`var(--navy-dark)`** | **1.00** ✗ |

El panel de la home es `--navy-dark` y `.btn-primary` tiene
`background: var(--navy-dark)`: **el mismo color exacto**. No es «poca
separación», es un botón que desaparece.

Separación de cada alternativa contra ese panel `#0F2535`:

| opción | separación | problema |
|---|---|---|
| dorado actual | 6.88 | rompe cuatro principios del sistema |
| `.btn-green` (`--green-dark`) | 3.24 | **queda idéntico al botón «Personas»** de la misma sección |
| blanco sólido | **15.71** | trata­miento nuevo, no existe en el sistema |

La jerarquía a preservar: «Personas» y «Empresas» **navegan a leer** y son un
par; el tercero **convierte** —es el único `<button>`, abre el modal— y va en
una fila aparte. Si el tercero se vuelve `.btn-green` queda igual que
«Personas» y se pierde justo lo que el dorado expresaba bien.

**Queda pendiente de decisión.** Mientras tanto `.btn-evaluacion` sigue en
`globals.css` con sus dos consumidores; no se borró nada a medias.

#### Costo

`index.css` **+0,06 kB gzip**.

### Contraste WCAG AA — tanda 1 — 2026-08-07

Ratios calculados con la fórmula de luminancia relativa de WCAG 2.1, validada
contra la referencia conocida `#767676` sobre blanco = **4.54**. Ningún número
de acá es estimado.

| qué | antes | después | criterio |
|---|---|---|---|
| `.btn-green` blanco sobre fondo | `--green` **2.93** | `--green-dark` **4.85** | 1.4.3 (4.5) |
| borde de campo público | `--border` **1.18** | `--border-input` **4.06** | 1.4.11 (3.0) |
| borde de foco del campo | `--green` **2.93** | `--green-dark` **4.85** | 1.4.11 |
| borde de campo del admin | `--sky`/`--sky-pale` **1.63** | `--border-input-admin` **3.71** | 1.4.11 |
| placeholder | `#9AA8B4` **2.43** | `#6B7681` **4.63** | 1.4.3 |
| «Verificando sesión…» | blanco 40 % **3.67** | blanco 70 % **8.35** | 1.4.3 |
| pie de tarjeta vacía | blanco 20 % **1.82** | blanco 60 % **5.14** | 1.4.3 |

#### `--border` y `--border-input` SON COSAS DISTINTAS. No unificarlas.

| variable | para qué | ratio sobre blanco |
|---|---|---|
| `--border` `#e8edf2` | **separaciones decorativas** — líneas de 1 px, divisiones de tabla, bordes de tarjeta | 1.18, **y está bien** |
| `--border-input` `#767F8A` | **límite de un CONTROL** de formulario | 4.06 |
| `--border-input-admin` `#5A81A2` | ídem sobre `--sky-pale` | 3.71 (y 4.12 sobre blanco) |

**1.4.11 aplica al límite de un control, no a una separación decorativa.** Subir
`--border` habría engordado todas las líneas finas del sitio para resolver un
criterio que no las alcanza. Son requisitos distintos y la variable separada es
lo que impide que alguien los junte «para simplificar».

#### `--green` no se toca: el problema es blanco ENCIMA de verde

| `--green` como texto, sobre… | ratio |
|---|---|
| blanco | 2.93 ✗ |
| `--off` | 2.80 ✗ |
| `--sky-pale` | 2.64 ✗ |
| `--navy` | 3.83 (solo texto grande) |
| `--navy-dark` | **5.37** ✓ |
| `--navy-deeper` | **6.12** ✓ |

**Y `--green-dark` es PEOR sobre fondo oscuro**: 2.31 sobre `--navy`, 3.24 sobre
`--navy-dark`. O sea el arreglo depende del fondo y **no se puede hacer un
buscar-y-reemplazar global de `--green` por `--green-dark`**. Sobre claro,
oscurecer; sobre oscuro, el verde de marca ya cumple.

Armonía: mismo tono (147° contra 149°), misma saturación (47 % contra 48 %),
solo 11 puntos menos de luminosidad. `--green-dark` ya existía en la paleta.
Quedan 13 elementos con `--green` de fondo —líneas, puntos del carrusel,
insignias— y no se tocan: no llevan texto encima.

#### El `.btn-outline` no está sobre el velo del hero

Se pidió medir dónde cae dentro del degradado a 390/768/1440. **La premisa no se
sostiene:** `.btn-outline` se usa en **dos** sitios y **ninguno** es el hero.

| dónde | color real | fondo real | ratio |
|---|---|---|---|
| `HomePage.tsx:268` | `#FFFFFF` pisado inline | `--navy-dark` sólido | **15.71** ✓ |
| `CotizacionesAdmin.tsx:861` | `--muted` pisado inline | blanco | **5.03** ✓ |

**Los dos consumidores pisan el color de la clase con un `style` inline**, así
que el `rgba(255,255,255,0.65)` que declara `.btn-outline` en `globals.css:135`
**nunca se renderiza**. El 1.93:1 del inventario describe un estado que no
existe en pantalla.

Lo que sí queda por revisar del segundo: su borde es `--border` sobre blanco,
1.18:1, y ahí sí es el límite de un control.

#### Encontrado de paso, sin tocar

- **`--sky` como texto sobre casi-blanco**: `BlogPostPage.tsx:82` pinta las
  iniciales del autor en `--sky` sobre `rgba(168,196,220,0.2)` sobre blanco —
  fondo efectivo `#EEF3F8`, ratio **1.62**. Es el peor par del sitio.
- **`--muted` sobre `--sky-light` (3.92) y sobre `--sky` (2.78)**: se buscaron y
  **no hay texto `--muted` sobre esos dos fondos**. Los usos de `--sky` como
  fondo son barras de progreso y avatares, sin texto `--muted` encima.
- **`Captacion.tsx:1126`** tiene el octavo «Verificando sesión…» con blanco al
  40 %. Es dominio de la sesión Sofía y quedó sin tocar.

#### Costo

`index.css` **+0,02 kB gzip**.

### `og-image.jpg` NUNCA EXISTIÓ, y el catch-all lo disimulaba — 2026-08-07

Commits `b464c5b` y `42d61cb`. Cierran los dos pendientes de la entrada de
abajo.

#### El bug de la imagen, y por qué tardó tanto en verse

`SEO.tsx` pedía `${BASE}/og-image.jpg`. En `public/` solo hay
**`og-image.png`** y `og-image.svg`. El `.jpg` **no existió nunca**.

No se notó porque el catch-all de SPA —`/*  /index.html  200` en
`public/_redirects`— devuelve `index.html` con **status 200** para cualquier
ruta. O sea la URL «funcionaba»: respondía 200, y el crawler recibía HTML donde
esperaba una imagen.

**Es la trampa del 404 ya documentada, mordiendo en un sitio nuevo.** Está
anotada desde la entrada del `.DS_Store`: *en este sitio ninguna URL devuelve
404 nunca, así que comprobar existencia por código de estado da falsos
positivos*. Acá el falso positivo llevaba meses.

**Cómo comprobar que un asset existe de verdad en este sitio:** mirar el
`content-type` **y** que el hash del cuerpo **no** coincida con el de `/`. Un
200 no prueba nada.

El valor correcto ya estaba escrito en el repo desde siempre:
`functions/propiedades/[id].js` usa `og-image.png`.

#### La Function del blog

`functions/blog/[slug].js`, calcada de la de propiedades. Misma detección de bot
por user-agent, misma consulta con la anon key y sus fallbacks de entorno, mismo
`escapeHtml` sobre todos los valores, mismo caché de 300 s.

Dos diferencias deliberadas con la de propiedades:

| | por qué |
|---|---|
| `og:type` = **`article`** y no `website` | es un artículo, y es lo que ya pasa `<SEO>` desde el cliente |
| filtro **`publicado=eq.true`** explícito | desde fuera no se distingue «RLS filtra los borradores» de «no hay borradores» —la anon key devuelve 13 filas y 0 despublicadas, compatible con ambas— y un borrador no debe filtrarse por el previsualizador de WhatsApp |

`DEFAULT_DESCRIPTION` es un **espejo** de la de `SEO.tsx`. Al escribirla de
memoria le sobraba una frase; se alineó comparando las dos cadenas. **Si se
cambia una, cambiar la otra.**

#### Lo que esto arregla y lo que no

Arregla la vista previa de **los artículos del blog**. El resto de las rutas
—`/blog`, `/asociados`, `/quienes-somos`, `/servicios`…— siguen sin Function, o
sea que para un crawler que no ejecuta JS siguen mostrando el título genérico.
Ahora al menos comparten **con imagen**, que es lo que arregla `b464c5b`.

Si algún día importa que esas rutas también se compartan bien, el patrón está
escrito dos veces y es mecánico.

### `<SEO>` en las seis rutas que faltaban — y dos cosas que quedan rotas — 2026-08-07

Commit `209ec68`. Las seis rutas que heredaban el título genérico ya ponen el
suyo: `/blog`, `/blog/:slug`, `/asociados`, `/reserva/confirmacion`, la 404 y el
showcase. Verificado navegándolas: ninguna cae ya en «SDM Capital | Inversión
Inmobiliaria Chile & Internacional».

`blog_posts` **sí** tenía los campos: `resumen` para la descripción e
`imagen_portada` para el `og:image`, más `resumen_en` para seguir el mismo
patrón bilingüe que el título.

El showcase va **en inglés** porque la página arranca en inglés — `lang` parte
en `'en'` y solo cambia si el visitante pulsa ES. Lleva las dos versiones y
sigue al toggle.

---

#### PENDIENTE 1 · El blog NO tiene Pages Function. WhatsApp sigue sin ver nada.

`functions/` tiene `api/imagen.js`, `api/subir.js` y `propiedades/[id].js`.
**No hay equivalente para `/blog/`.**

`propiedades/[id].js` existe justamente porque un crawler que no ejecuta
JavaScript no ve lo que `<SEO>` escribe en el cliente: detecta el user-agent del
bot (`facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|…`) y le devuelve HTML
con los meta ya puestos.

**Consecuencia:** lo de este commit arregla la pestaña del navegador, Google —que
sí ejecuta JS— y cualquier crawler moderno. **No arregla la vista previa de
WhatsApp ni la de LinkedIn para los artículos del blog**, que es el caso que
motivó la tarea. Para eso hace falta `functions/blog/[slug].js`, calcado de
`propiedades/[id].js`. **Es otra tarea y no está hecha.**

#### PENDIENTE 2 · El `og:image` por defecto apunta a un archivo que no existe

`SEO.tsx:12` dice:

```js
const DEFAULT_IMG = `${BASE}/og-image.jpg`
```

En `public/` hay **`og-image.png`** y **`og-image.svg`**. No hay `.jpg`. Y como
el sitio responde 200 a todo (ver la entrada del `.DS_Store`),
`https://sdmcapital.cl/og-image.jpg` devuelve **`index.html` con
`content-type: text/html`** — o sea el crawler pide una imagen y recibe HTML.

**Toda ruta que no pase su propia imagen comparte sin imagen.** Son todas menos
la ficha de propiedad y, desde este commit, el post del blog.

La Pages Function `propiedades/[id].js` **lo tiene bien**: usa
`og-image.png`. O sea el bug está solo en el componente del cliente, y el valor
correcto ya está escrito en el repo, a un carácter de distancia.

No se corrigió acá: `src/components/SEO.tsx` queda fuera del dominio anunciado
para esta tanda, que era `src/pages/`.

#### Costo

**+0,26 kB gzip.**

### SI EL CÓDIGO DESCARTA ALGO QUE EL USUARIO PIDIÓ, TIENE QUE DECIRLO — 2026-08-07

Commit `0d95c6d`. Generaliza el criterio de la entrada de abajo, que hablaba de
listas que se recortan al mostrarse. Esto es un grado peor:

> **Recortar al mostrar** = no ves algo.
> **Descartar al ejecutar** = crees que hiciste algo que no ocurrió.

`Propiedades.tsx` hacía `Array.from(files).slice(0, 20 - imagenes.length)` a
secas. Elegías 25 fotos con 0 cargadas, subían 20, y nada lo decía: quedabas
convencido de que la propiedad tenía 25.

**El comportamiento no cambió** —suben las que caben, se descarta el resto— y el
límite de 20 sigue siendo deliberado. Lo único que cambió es que ahora se avisa,
**antes** de subir y con el conteo real.

#### El navegador no puede impedirlo

Se verificó antes de escribir el aviso: `<input type="file">` tiene `multiple` y
`accept`, pero **HTML no define ningún atributo de cantidad máxima**. No hay
forma de que el selector del sistema operativo limite cuántos archivos se
eligen. Avisar después de elegir es la única vía.

#### Por qué `alert()` y no la píldora

No había mecanismo para avisos informativos: la píldora «Guardado correctamente»
es de éxito y `avisarError` es de fallo. Se usó `alert()` a propósito:

- El mensaje **tiene que interrumpir**. Aparece justo antes de una operación
  lenta que va a hacer algo distinto de lo que el usuario pidió.
- Un aviso no bloqueante se lo comería la barra de progreso de la subida, que
  arranca inmediatamente después.
- `alert()` ya es el mecanismo del panel para detener y hacer leer —lo usa
  `avisarError`—, así que no introduce una forma nueva.

**Si algún día hace falta un aviso informativo que no interrumpa, ahí sí
corresponde un componente nuevo.** Este caso no era ese.

#### El botón desaparecía sin explicar por qué

Con 20 fotos cargadas, el botón de agregar simplemente no se renderizaba
(`{imagenes.length < 20 && …}`). Otro silencio: no había forma de saber si
faltaba un permiso, si estaba roto, o si era el tope. Ahora en su lugar va el
motivo.

#### El 20 estaba escrito cuatro veces

Literal, a mano, en las líneas 279, 370, 372 y 707 del mismo archivo. Ahora es
`MAX_FOTOS` y vive una vez. **No hay otro tope de cantidad en el camino**:
`subirImagen.ts` y `functions/api/subir.js` limitan el **lado** de la imagen
(1920 px), no cuántas se suben. Tampoco hay uno en la base.

#### Costo

`AdminPage.js` **+0,20 kB gzip**. Medido worktree contra worktree.

### UNA LISTA QUE SE RECORTA TIENE QUE DECIRLO — 2026-08-07

**El criterio, para cualquier lista nueva:** si se muestra un subconjunto, hay
que decir que hay más. Si no, el usuario no puede distinguir «no hay más» de
«hay más y no te los muestro», y concluye lo primero. Cuando la lista es un
catálogo, esa conclusión es «no lo tenemos».

Y antes de anunciar el recorte, preguntarse si hace falta recortar. En los dos
casos de esta tanda **no hacía falta**, y se quitó el tope en vez de explicarlo.

| Commit | Qué |
|---|---|
| `490fa33` | el buscador del paso 2 deja de recortar a 12 |
| `59c5feb` | el PDF muestra todas las amenidades |
| `b2df33d` | el botón de El Barranco y la flecha de la confirmación de reserva |

#### El buscador de cotizaciones: el tope no lo justificaba nada

Era `.slice(0, 12)` sobre `propsFiltradas`. Si la propiedad buscada era la
decimotercera, no aparecía y nada lo indicaba.

- **Espacio:** el contenedor **ya scrollea** — `maxHeight: 220` con
  `overflowY: 'auto'`. La lista nunca creció hacia abajo indefinidamente, así
  que el tope no ganaba un píxel.
- **Rendimiento:** son 53 propiedades, y la lista solo se pinta cuando hay
  término de búsqueda, ya filtrada.

Verificado con el componente real y 35 propiedades que coinciden: salen las 35
y la caja scrollea.

#### El PDF: medir con cadenas ÚNICAS

Las amenidades iban recortadas a 6 en un documento que se le manda al cliente.

Renderizando el PDF de verdad con `@react-pdf/renderer`: 6, 12, 30 y **60**
amenidades caben en una página, y recién a las **200** pasa a dos —fluyendo, sin
cortar—. El bloque es un `<Text>` en una fila con `flex: 1` y sin altura fija,
así que ajusta línea y empuja. No había razón de espacio.

**Trampa de método:** la primera medición usó amenidades repetidas y dio
**bytes idénticos** para 12, 24 y 40, lo que parecía recorte del layout. Era la
compresión Flate del PDF colapsando cadenas iguales. Con cadenas únicas el
tamaño crece monótono y la respuesta se ve. **Para medir crecimiento de un PDF,
contenido único.**

#### El UUID de El Barranco era el correcto

`eccfd92d-713e-4e0a-a074-ff76daffd81e` resuelve a «Hotel + Restaurante ·
Futaleufú», slug `hotel-restaurante-futaleufu-futaleufu-10d`, activo. El destino
estaba bien; sobraba la palabra «listado». Ahora dice «Volver a la propiedad» /
«Back to the property» y navega **por slug**, que evita la redirección
UUID→slug.

#### Barrido: lo que se revisó y se dejó

| sitio | qué es | veredicto |
|---|---|---|
| `Equipo.tsx:70,106` | `.slice(0,2)` sobre un nombre | **iniciales**, no una lista |
| `Contenido.tsx:214,231` · `CotizacionesAdmin.tsx:1099` | ellipsis sobre `p.titulo` / `c.prop_titulo` | **títulos**, excepción aceptada |
| `Propiedades.tsx:112` | ellipsis sobre el nombre del dossier | ídem |
| `HomePage.tsx:232` | `.slice(0, 6)` de destacadas | intencional y documentado |

#### Pendientes

- **`Captacion.tsx`** (dominio Sofía): `.slice(0, 5)` en la conversación de un
  lead —línea 994— y los cinco `textOverflow: ellipsis` de las tarjetas de lead
  —141 y 779-783— sobre nombre, teléfono, comuna, presupuesto y plazo. Esos
  **no** son títulos: son datos que se cortan sin aviso.
- **`Propiedades.tsx:279`**, `Array.from(files).slice(0, 20 - imagenes.length)`.
  No estaba en el encargo y no es un recorte de render sino de **subida**: si
  seleccionas 25 fotos con 0 cargadas, cinco se descartan sin decir nada. Mismo
  defecto, otra superficie.

#### Costo

**−0,01 kB gzip.** Se borró código, no se agregó.

### UX copy tanda 2 — vacíos, consistencia, tuteo e iconos — 2026-08-07

| Commit | Qué |
|---|---|
| `153765c` | una sola forma de estado vacío, con salida |
| `55ac084` | botones de alta, «volver» y menú móvil |
| `edf05b6` | tuteo en los tres textos que trataban de usted |
| `e9ed05e` | los emojis que quedaban pasan a lucide |
| `36a093e` | `agente_id` fuera del tipo |

#### `agente_id` NO EXISTE. No reintroducirlo.

Estaba declarado en `Propiedad` (`src/types/index.ts`) pero **la columna nunca
existió**: PostgREST responde `42703 column propiedades.agente_id does not
exist`. Grep sobre `src/`, `functions/` y `supabase/` daba **una** aparición: la
propia declaración.

Un campo fantasma en el tipo es peor que no tenerlo, porque cualquiera que lea
`Propiedad` asume que puede pedirlo y se entera de que no existe recién cuando
el SELECT devuelve 400 en producción. Pasó de verdad: el texto que se encargó
para la confirmación de borrado de agentes en la tanda 1 daba por hecho una
relación agente↔ficha que **no existe** — las fichas copian `asesor_nombre` /
`asesor_telefono` / `asesor_correo`, no referencian nada.

**Si hace falta asociar propiedades a agentes, primero la migración, después el
tipo.**

#### Dos cosas del encargo que no eran lo que parecían

**Los tres botones «sin +» ya tenían uno.** Era un `<Plus>` de lucide, no un
carácter. Agregar un `+` literal habría dado dos plus en el mismo botón. La
inconsistencia real era de mecanismo —seis con el carácter, tres con el
icono— y se unificó en el icono, que es adonde fue el resto del proyecto.

**Lo mismo con «Volver al admin» y «Volver al cliente»:** llevan un `<ArrowLeft>`
justo antes, así que ya se leen con flecha. Solo los seis «← Ir al admin»
necesitaban cambio. Regla para el futuro: **antes de anteponer un signo,
comprobar si ya está puesto como icono.**

#### Los emojis eran catorce, no cuatro

El encargo listaba los cuatro que había detectado la auditoría, pero el criterio
de verificación pedía cero emojis en el admin y en la ficha, así que se barrió
entero: `✓ ✏️ 📄 📧 ⏳ 🗑 🔗 🅿 📦 🏗 🖨️ 📌`. Los `🅿 📦 🏗` convivían en la **misma
fila** con iconos lucide, o sea eran leftovers evidentes.

Los `⏳` ganaron giro de paso: `Loader2` con `animate-spin`, que es utilidad de
Tailwind y no necesita CSS nuevo. Antes el reloj de arena estaba quieto.

**Dos se quedan a propósito, no se olvidaron:**

| dónde | qué | por qué |
|---|---|---|
| `Propiedades.tsx:824` | `{p.internacional ? '🌐' : '🇨🇱'}` | el globo hace pareja con la bandera chilena, que es excepción documentada |
| `PropiedadDetailPage.tsx:24` | `symbol: '✉'` | los otros de `SHARE_NETWORKS` son glifos de texto (`𝕏`, `in`) y se pintan igual |

La flecha `↗` de «Descargar ↗» se mantiene: la fila ya lleva un `FileText` a la
izquierda y un segundo icono lucide al otro extremo competiría por la misma
línea. Además `↗` es flecha tipográfica, la misma excepción que `←` y `→`.

#### Estados vacíos: la regla

**«Todavía no hay X.» más una frase de acción cuando la haya.** El que más gana
es el público: «No se encontraron propiedades» no decía que el problema eran los
filtros ni que se pudieran aflojar.

Se alinearon también los vacíos de Cotizaciones y Tarjetas, que no estaban en el
encargo pero decían «No hay X todavía» — dejarlos habría arreglado siete de
nueve.

Verificado en iframes de ancho real: a 390 el texto público ocupa 3 líneas y a
1440 una, sin desbordar.

#### Costo

**+0,65 kB gzip.** Casi todo es `iconos.js` (+0,42), que crece porque entran
nueve iconos nuevos de lucide. Medido worktree contra worktree.

#### Encontrado de paso, sin tocar

- **`ElBarrancoShowcase.tsx:522`** dice «Volver al listado» / «Back to listing»
  pero navega a `/propiedades/eccfd92d-…`, que es **la ficha de una propiedad**,
  no un listado. La etiqueta miente. No se tocó: hay que decidir si cambia el
  destino o el texto.
- **`ReservaConfirmacionPage.tsx:50`** dice «Volver al inicio» sin flecha,
  mientras que el de `App.tsx:72` la lleva. Es un botón de acción primaria tras
  el pago, no un enlace de vuelta, así que se dejó.

### UX copy tanda 1 — errores, borrados y confirmación de guardado — 2026-08-07

| Commit | Qué |
|---|---|
| `a1c53a9` | los 6 `alert()` crudos del dominio pasan a `avisarError()` |
| `8187a81` | la alerta de `avisarError` habla al usuario |
| `4cdcbd2` | las 8 confirmaciones de borrado nombran el elemento |
| `4ad82a8` | los 14 paneles confirman el guardado |

#### EL DETALLE TÉCNICO DE `avisarError` SE QUEDA EN CONSOLA. NO QUITARLO.

La alerta ya **no** muestra `code`, `message`, `details` ni `hint`. Eso no
significa que sobren: `console.error` los sigue recibiendo completos, y es lo
que permitió encontrar que `prop_pais` no existía como columna. Si alguien ve
que la alerta no los usa y decide limpiar el `console.error`, se pierde la
única forma de diagnosticar un fallo de escritura en producción.

Lo que ve el usuario ahora:

```
{contexto}.

No se guardó ningún cambio. Vuelve a intentarlo; si sigue fallando, abre
la consola del navegador y pásame el detalle.
```

La segunda frase es la que faltaba. El formulario **ya** quedaba abierto con lo
escrito —para eso `avisarError` devuelve `true`— pero nunca se lo decía, así que
un fallo se leía como pérdida del trabajo.

#### El texto de Agentes que se pidió NO era cierto

Se encargó «¿Eliminar a X? Sus fichas asignadas quedan sin agente». **No pasa
eso.** `ficha_propiedades` no referencia al agente: copia `asesor_nombre`,
`asesor_telefono` y `asesor_correo` al crearse. Borrar un agente no borra
fichas ni las deja huérfanas — solo desaparece de la lista para elegir asesor,
y eso es lo que dice el texto que quedó.

De paso: **`agente_id` está declarado en `src/types/index.ts` pero la columna
no existe en la base** (`42703: column propiedades.agente_id does not exist`) y
nada la usa. Es un campo fantasma del tipo.

#### Los borrados recargaban la lista aunque fallaran

Los cuatro `alert()` de borrado no cortaban el flujo: llamaban a `load()`
igual, así que la lista se recargaba como si la operación hubiera salido bien.
Al pasar a `avisarError` ganaron el `return` que les faltaba.

#### La píldora de guardado SÍ se extrajo

Estaba duplicada literal en los cinco paneles que la tenían. Ahora vive una vez
en `src/components/admin/acciones.tsx` como `Guardado` + `useGuardado`, y la
usan **los catorce**. El hook se lleva también el temporizador, que estaba
copiado con duraciones distintas —2000 ms en Vende, 2500 en el resto— y ahora
es 2500 en todos, con limpieza al desmontar.

Al migrar, cuatro paneles quedaron importando `Check` sin usarlo. `strict` está
en `false` en `tsconfig.json` y **el build no lo detecta**: hay que mirarlo a
mano.

#### Costo

`AdminPage.js` +0,37 kB gzip; el chunk nuevo `acciones.js` +0,54 kB. Total
**+1,20 kB gzip**. Medido worktree contra worktree.

#### Pendientes de esta tanda

- **`Captacion.tsx`** (dominio Sofía): sus dos `alert()` crudos —línea 464,
  «No se pudo cambiar el modo», y 1115, «Error al eliminar»— y su confirmación
  «¿Cancelar esta visita?» siguen sin tocar.
- **`TarjetasEquipo.tsx:189`**, `alert('El nombre es obligatorio.')`: es una
  validación de formulario, no un error de Supabase, así que no entraba en la
  migración a `avisarError`. Sigue siendo el único mensaje de validación propio
  del admin.

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

---

### EL COLOR DE ERROR NO SE USA PARA NADA QUE NO SEA UN ERROR — 2026-08-08

`--error: #A8384B` reemplaza los 21 literales de `#E24B4A`. Pero lo que hay que
recordar no es el valor: es **por qué antes no había ningún valor posible**.

#### El bloqueo

`#E24B4A` fallaba WCAG 1.4.3 en los 18 usos de texto pequeño —3.93:1 sobre
blanco, 3.76 sobre `--off`, 3.54 sobre `--sky-pale`— y había que reemplazarlo.
Pero cualquier reemplazo tenía que cumplir dos condiciones a la vez:

1. **Contraste ≥ 4.5:1**, que obliga a oscurecer.
2. **Distinguirse de `--estado-vendida` #C0392B**, que comparte pantalla en el
   listado de propiedades. Oscurecer un rojo lo acerca a esa marca ladrillo, así
   que para separarse hay que **correrse en tono, hacia el magenta**.

Y ahí aparecía la tercera condición, que era la que cerraba la puerta:
`PropiedadDetailPage` usaba este mismo rojo para el **precio rebajado**, en la
única pantalla que lleva `--oportunidad` #2D8055. O sea que el rojo también
tenía que separarse del verde. Medido:

| candidato | contraste | ΔE vs Vendida (peor de 3) | ΔE vs Oportunidad (peor) |
|---|---|---|---|
| `#A8385D` carmín | 6.20 | 16.5 ✓ | **0.6** ✗ deuteranopia |
| `#A8384B` frambuesa | 6.30 | 11.4 ✓ | **5.8** ✗ deuteranopia |
| `#C0392B` (= Vendida) | 5.44 | **0.0** ✗ | 10.2 |
| `#E24B4A` (el de entonces) | **3.93** ✗ | 10.0 | **3.8** ✗ protanopia |

Cuanto más se corre al magenta para separarse de «Vendida», más colapsa contra
el verde bajo deuteranopia. Es el mismo choque rojo-verde que ya había obligado
a sacar «Reservada» del ámbar. **No existe un rojo que cumpla las tres.** Los
burdeos oscuros (`#6F203A`) lo consiguen, pero con contraste 10-11 dejan de
leerse como alerta.

#### La salida no fue de color, fue de semántica

El precio rebajado **nunca debió estar en el rojo de error**. Peor: la insignia
que va justo encima decía «Precio rebajado» en `--oportunidad` desde el cambio
anterior, así que la misma tarjeta afirmaba dos cosas opuestas sobre el mismo
hecho. La comparación ya la comunica el precio anterior tachado.

Con la rebaja en `--oportunidad`, el rojo dejó de convivir con el verde y la
tercera condición desapareció. `#A8384B` entra sin forzar nada.

#### LA REGLA

> **El color de error es solo para errores.** Un envío que falló, un registro
> que no se encontró, el texto de los botones «Eliminar». Nada más.
>
> No es una insignia de estado, no marca urgencia comercial, no señala una
> oferta. En el momento en que se usa para otra cosa, hereda las restricciones
> de esa otra cosa, y el rojo se queda sin margen para cumplir contraste.

Lo mismo vale al revés y ya había pasado una vez: `--estado-vendida` se usaba
también para «Precio rebajado» —el mismo rojo para un cierre y para una
oportunidad—. Es el segundo caso del mismo error en dos semanas.

#### Los números que quedaron

| | antes | ahora |
|---|---|---|
| sobre blanco | 3.93 ✗ | **6.30** ✓ |
| sobre `--off` | 3.76 ✗ | **6.03** ✓ |
| sobre `--sky-pale` | 3.54 ✗ | **5.67** ✓ |
| blanco encima (badge del PDF) | 3.93 ✗ | **6.30** ✓ |
| selector de estado, sobre su color al 13 % | `#FBE7E7` → 3.31 ✗ | `#F3E4E7` → **5.12** ✓ |
| precio rebajado, 40 px | 3.93 (pasaba por tamaño) | **4.85** ✓ con `--oportunidad` |

ΔE2000 de `--error` contra `--estado-vendida`, en visión normal / protanopia /
deuteranopia: **12.7 / 12.8 / 11.4**. Por encima de 10 en las tres.

#### `var()` no sirve cuando el color se opera en JS

Dos literales sobreviven a propósito, los dos comentados como espejo de
`--error`:

- **`CotizacionPDF.tsx`** — `@react-pdf/renderer` rasteriza fuera del DOM y no
  resuelve `var(--…)`. Misma razón que `tarjeta.css`.
- **`CotizacionesAdmin.tsx`, `ESTADO_COLORS`** — el selector de estado deriva su
  fondo concatenando el alfa: `ESTADO_COLORS[estado] + '22'`. Con una variable
  el resultado es la cadena `var(--error)22`, que **no es CSS válido**: React la
  escribe igual, el navegador la descarta y el fondo desaparece **solo en
  «Rechazada»**, sin ningún error en consola. Se detectó revisando el consumidor
  del mapa, no compilando.

  Generalizable: **antes de cambiar un hex por `var()`, mirar si alguien hace
  aritmética de cadena con ese valor.** El build pasa igual.

#### Pendiente

`Captacion.tsx:112` conserva su `red: '#E24B4A'` — dominio de la sesión Sofía.
Cuando esa sesión lo toque, el valor a poner es `#A8384B`, y conviene revisar si
ese mapa también concatena alfa.

---

### Accesibilidad — tanda 2, paso 1: los formularios públicos — 2026-08-08

WCAG 2.1 AA, criterios 1.3.1, 3.3.2 y 4.1.2. El diagnóstico de partida:
**104 campos en `src/`, cero con `id`, cero usos de `htmlFor` en todo el
repositorio.** De los 51 `<label>` existentes, 13 envolvían su campo —esos
funcionaban— y 38 quedaban yuxtapuestos, que es markup de etiqueta sin
asociación.

Este paso cubre los tres formularios **públicos**: los que completa alguien de
fuera de la corredora.

| Archivo | Campos |
|---|---:|
| `src/components/credito/SolicitudCreditoForm.tsx` | 8 |
| `src/pages/VendeConNosotrosPage.tsx` | 7 |
| `src/components/sections/ContactSection.tsx` | 4 |

#### UN PLACEHOLDER NO ES UNA ETIQUETA

> Es la trampa exacta que produjo los 104 campos. Los tres formularios se ven
> perfectamente etiquetados, y de hecho lo están **visualmente**: hay un rótulo
> encima de cada campo. Lo que no había era ninguna relación entre los dos
> elementos. El navegador no la infiere de la posición.
>
> Y donde no hay rótulo visible, el `placeholder` da la ilusión de que sí:
>
> - **Desaparece al escribir.** Justo cuando el usuario querría verificar qué
>   pedía el campo, ya no está.
> - **No sobrevive al autocompletado.** El campo queda relleno y mudo.
> - **No es un nombre accesible fiable.** Algunos lectores lo leen, otros no, y
>   ninguno lo hace en lugar de la etiqueta.
> - **No sirve para el clic.** No hay nada que pulsar para enfocar el campo, que
>   es lo que amplía el área de acierto para quien tiene poca motricidad fina.
>
> Como el formulario *parece* correcto en pantalla, nada delata el problema
> hasta que alguien lo recorre con un lector. Por eso llegaron a 104.

#### La solución: envolver, no generar ids

El `<div class="flex flex-col gap-2">` que agrupaba rótulo y campo pasa a ser
`<label>`, y el `<label>` yuxtapuesto de adentro pasa a `<span>`. Un `<label>`
que contiene a su control lo asocia sin `htmlFor` y sin `id`.

**El estilo se queda en el `<span>`, no sube al `<label>`.** No es cosmético:
`text-transform` y `letter-spacing` son propiedades **heredadas** y sí se
aplican al texto que el usuario escribe dentro de un `input`. `.input-line` no
fija ninguna de las dos. Poner el `labelStyle` en el elemento que ahora envuelve
habría dejado todo lo tecleado en mayúsculas y con 2px de separación entre
letras.

##### Por qué envolver y no `id` + `htmlFor`

Porque **`ContactSection` y el modal de crédito conviven en la misma página**,
en Home y en Servicios. Los dos tienen un campo «Email» y uno «Teléfono». Con
ids escritos a mano se habrían duplicado, y un `id` duplicado no falla: el
`htmlFor` se asocia al primero que encuentre y el segundo campo se queda mudo,
en silencio. Envolviendo no hay ningún id que colisionar. Verificado: cero ids
duplicados en las tres páginas.

##### La excepción: «Valor de la propiedad (UF)»

Su contenedor lleva, además del rótulo y el input, un `<p>` con el valor de la
UF del día. Envolver el contenedor entero habría metido ese texto dentro del
nombre accesible del campo —y encima es un texto que cambia solo—. Ahí el
`<label>` envuelve **solo al input** y el `<p>` queda fuera, como hermano. Los
`gap-2` anidados dan los mismos 8px de separación que había.

**Regla general:** el `<label>` envuelve exactamente el rótulo y el control.
Todo lo que sea texto de ayuda, error o estado se queda fuera, o pasa a formar
parte del nombre del campo.

#### `RadioGroup` tenía un `<label>` que no etiquetaba nada

Sus opciones son `<button>`, y un `<button>` no es un control etiquetable: un
`<label>` no puede asociársele ni envolviéndolo ni con `htmlFor`. El rótulo
«¿Qué quieres hacer?» era markup decorativo.

Pasa a `<span id>` más `role="group"` y `aria-labelledby` en el contenedor de
los botones. **El texto visible no cambia** —esa es la razón de usar
`aria-labelledby` sobre el rótulo que ya estaba, y no un `aria-label` invisible:
un rótulo que se ve sirve a todo el mundo, no solo a quien usa lector—. El `id`
sale de `useId()`, porque este formulario se monta también dentro del modal.

Queda **pendiente** que esos botones expongan estado de selección: hoy un lector
anuncia «botón», no «seleccionado». El arreglo completo es `role="radio"` +
`aria-checked` + navegación con flechas, y cambia el comportamiento de teclado,
así que no entra en una tanda de semántica pura.

#### Cómo se verificó — `labels.length`, no «se ve bien»

Con Chrome por CDP contra el build de producción, no leyendo el JSX:

| Prueba | Antes | Después |
|---|---|---|
| `el.labels.length` en los 19 campos | **0** | **1** en todos |
| clic en la etiqueta enfoca el campo | **0 de 19** | **19 de 19** |
| ids duplicados en la página | 0 (no había ids) | **0** |

Y el **nombre accesible real**, leído del árbol de accesibilidad
(`Accessibility.getPartialAXTree`), no de `textContent`:

- El `<select>` envuelto da «TIPO DE PROPIEDAD», **sin arrastrar el texto de sus
  `<option>`**. Chrome excluye el control incrustado al calcular el nombre.
- «VALOR DE LA PROPIEDAD (UF)» no incluye el valor del día.
- Los dos `role="group"` quedan con nombre.
- Los 19 con `origen: relatedElement`, que es lo que confirma que el nombre
  viene del `<label>` y no de un `placeholder` o un `title`.

`textContent` **no sirve** para esta verificación: en el `<select>` daba
«Tipo de propiedadCasaDepartamentoOficina…», que no es lo que anuncia el lector.

##### Trampa al medir: leer el árbol AX antes de que React renderice

La primera lectura contra producción dio los 19 nombres saliendo del
`placeholder`, como si el arreglo no hubiera llegado. No era eso: la sonda
esperaba un tiempo fijo tras `Page.navigate`, que alcanzaba en `localhost` y no
contra la red. El árbol de accesibilidad se leía antes de que el formulario
existiera.

Es un **falso negativo especialmente confuso**, porque el síntoma —«el nombre
viene del placeholder»— es idéntico al del defecto que se está arreglando. Se
descartó comparando el chunk servido en producción contra el local (`sha256`
idéntico) y pidiendo el DOM real. La sonda ahora espera a que exista
`form input` antes de pedir el árbol.

#### Que no cambió nada visualmente

Se construyó `HEAD` en un worktree aparte, se levantaron los dos builds en
paralelo y se capturó cada formulario. Los PNG salieron **idénticos byte a
byte** en los tres:

| Formulario | Antes | Después |
|---|---:|---:|
| `ContactSection` | 15.104 B | 15.104 B, mismo `sha256` |
| `SolicitudCreditoForm` | 39.587 B | 39.587 B, mismo `sha256` |
| `VendeConNosotrosPage` | 27.375 B | 27.375 B, mismo `sha256` |

Un `<label class="flex flex-col gap-2">` renderiza igual que el `<div>` que
reemplaza: la clase fija `display: flex`, que gana sobre el `inline` que trae
`<label>` por defecto. El riesgo del cambio está en quitar esa clase, no en el
cambio en sí.

#### Observación, no defecto

Los rótulos llevan `text-transform: uppercase`, y el nombre accesible sale con
el texto ya transformado («NOMBRE COMPLETO»). Algunos lectores deletrean las
palabras en mayúsculas. Es la tipografía del sitio y viene de antes; se anota
por si en una tanda futura se decide poner el texto en minúsculas y dejar las
mayúsculas al CSS.

#### El paso 2 está detenido a propósito

`src/components/admin/campos.tsx` **no se tocó**. Su `Field` concentra 171 usos
en 8 paneles del admin y el reporte previo está entregado, esperando decisión.
Los dos hallazgos que impiden aplicar ahí el mismo arreglo de forma mecánica:

- **19 `Field` no envuelven un control**, sino `ImageUploader` (16),
  `RichTextEditor` (2) y `PropImageManager` (1). Los tres traen **su propio
  `<label>` interno** alrededor de un `<input type="file">` oculto. Convertir
  `Field` en `<label>` anidaría etiquetas —inválido— y el rótulo del campo
  quedaría apuntando al selector de archivos: pulsarlo abriría el diálogo de
  subida.
- **`ImageUploader` tiene además un segundo control**, el input de solo lectura
  con la URL. Un `<label>` que envuelve dos controles asocia solo el primero.

Lo que sí quedó despejado: **ningún `Field` contiene más de un control directo**,
ninguno se usa para mostrar un valor de solo lectura, ninguno mezcla el control
con texto de ayuda, y **ningún `Chk` vive dentro de un `Field`** —los 9 son
hermanos—, así que por ese lado no hay riesgo de etiquetas anidadas.

#### Campos públicos que siguen sin etiqueta

No entran en el paso 1 y no son formularios de captación, pero son públicos:

| Dónde | Campos | Estado |
|---|---:|---|
| `SearchBar.tsx` | 3 `<select>` | **sin rótulo de ningún tipo**: ni `<label>`, ni `placeholder`, ni `aria-label`. El buscador del home |
| `PropiedadesPage.tsx` | 2 `<select>` | 2 `<label>` sueltos, sin asociar. Filtros del catálogo |
| `MapPicker.tsx` | 1 `<input>` | solo `placeholder` |
| `ElBarrancoShowcase.tsx` | 2 | 2 `<label>` sueltos y un `aria-label` |
| `TarjetasEquipo.tsx` | 1 | 1 `<label>` |

Un `<select>` sin nombre es el peor caso de la lista: no tiene `placeholder` que
dé siquiera una pista, así que un lector anuncia «cuadro combinado» y el valor
seleccionado, sin decir nunca de qué se trata la lista.

Verificado en producción tras el deploy: los 19 campos con `labels.length === 1`,
clic que enfoca en 19 de 19, cero ids duplicados y los 19 nombres con origen
`relatedElement`. En `/evaluacion-gratuita` se miden 7 de los 8 campos porque
«Tipo de propiedad» solo se monta cuando la acción elegida es «comprar».

---

### Accesibilidad — tanda 2, paso 2: el admin y el buscador — 2026-08-08

Cierra lo que el paso 1 dejó abierto. **171 campos del admin más los del
buscador del home.**

| Commit | Qué |
|---|---|
| `ed40ebe` | `Field` envuelve a su control — 152 campos |
| `7db6be7` | `FieldGroup` para los 19 editores compuestos |
| `03fed5c` | los `<select>` de `SearchBar` |

#### UN `<label>` QUE ENVUELVE LE HEREDA `text-transform` AL CAMPO

> Es la trampa central de este paso, y no se ve venir.
>
> El rótulo de `Field` llevaba `textTransform: 'uppercase'` y
> `tracking-sdm-wide` (2px). Al convertir el `<div>` contenedor en `<label>`,
> lo natural es dejar ese estilo donde estaba —ahora en el elemento que
> envuelve— y quedarse tranquilo, porque el rótulo se sigue viendo idéntico.
>
> **`text-transform` y `letter-spacing` son propiedades heredadas, y sí se
> aplican al texto que el usuario escribe dentro de un `input`.** No es un
> caso raro de CSS: es el comportamiento normal, y `.input-line` no fija
> ninguna de las dos, así que no hay nada que corte la herencia.
>
> El resultado habría sido que **todo lo que Víctor teclee en los 152 campos
> del admin salga en MAYÚSCULAS y con 2px de separación entre letras**. De una
> sola vez, en los 8 paneles.
>
> Y no se detecta:
>
> - `tsc` pasa en verde. No es un error de tipos.
> - No hay advertencia en consola. Es CSS válido y deliberado.
> - **El rótulo se ve exactamente igual**, que es lo que uno mira al revisar.
> - La captura de pantalla del formulario vacío también es idéntica.
>
> Solo aparece cuando alguien escribe. Un formulario recién cargado no lo
> delata.
>
> **La regla:** en un `<label>` que envuelve a su control, el estilo del
> rótulo va en un `<span>` interior, nunca en el `<label>`. Vale para
> `Field`, para `FieldGroup` y para los tres formularios públicos del paso 1.
>
> Verificado midiendo `getComputedStyle` del input, no mirando el JSX:
> `text-transform: none` y `letter-spacing: normal` en el campo, `uppercase`
> en el `<span>` del rótulo, con el texto tecleado intacto.

#### `FieldGroup` — la variante sin `<label>`

19 de los 171 `Field` no envolvían un control etiquetable:

| Componente | Usos |
|---|---:|
| `ImageUploader` | 16 |
| `RichTextEditor` | 2 |
| `PropImageManager` | 1 |

`ImageUploader` y `PropImageManager` traen **su propio `<label>`** alrededor de
un `<input type="file">` oculto. Un `<label>` por fuera anida etiquetas
—inválido— y apunta al primer descendiente etiquetable, que es justamente ese
selector: **pulsar el rótulo «Foto del destino» habría abierto el diálogo de
subida de archivos.** `ImageUploader` tiene además un segundo control, el input
de solo lectura con la URL, y un `<label>` solo asocia al primero.

`FieldGroup` usa `<span id>` + `role="group"` + `aria-labelledby`. Se ve igual
que un `Field`. El id sale de `useId()` y **no se escribe a mano**: ocho de
estos se montan a la vez en `Barranco` y cinco en `Contenido`, y dos ids
iguales no fallan — se asocian al primero y dejan al resto sin nombre, en
silencio.

##### El nombre lo dice el `role`

Se llamó `FieldGroup` y no `Campo`, `Grupo` ni `FieldSet` porque nombra
exactamente el `role="group"` que emite, y porque su hermano `Field` ya está en
inglés y sin abreviar. `FieldSet` habría sugerido un `<fieldset>`, que trae
`<legend>` y estilos propios del navegador.

#### La migración se hizo con un parser, no a mano

El mismo parser de bloques balanceados de la auditoría: localiza cada
`<Field>…</Field>`, mira si su contenido tiene un compuesto y reemplaza los dos
extremos. Las 19 líneas resultantes coincidieron una a una con las de la
auditoría previa.

Quedaron **152 pares `Field` y 19 pares `FieldGroup`**, que son los 171
originales, con las aperturas y los cierres balanceados en los 8 archivos.

> **Ojo al auditar:** `indexOf('<Field')` engancha también `<FieldGroup`. Los
> scripts de conteo necesitan `<Field(?![A-Za-z])`. La primera re-auditoría dio
> «70 bloques, 4 con más de un control» por esto, y no era un problema del
> código.

#### `SearchBar` — no hizo falta `aria-label`

Los `<select>` del buscador **ya tenían rótulo visible** —«Región», «Comuna»,
«Tipo», «Precio»—, puesto como `<div>`. Solo faltaba la asociación. El
contenedor pasa a `<label>` y el rótulo a `<span>`, sin tocar el texto ni el
diseño. Un rótulo que se ve sirve a todo el mundo; un `aria-label` invisible,
solo a quien usa lector.

**Los dos llevan `display: block` explícito**, y esto sí era necesario:
`<label>` y `<span>` son `inline` por defecto, y estos contenedores tenían
`padding`, `border` y `marginBottom`, que en inline no se comportan igual. Es
distinto de `Field`, donde la clase `flex flex-col gap-2` ya fijaba
`display: flex` y no hubo que agregar nada.

En el DOM se renderizan **4** `<select>`, no 3: el par tipo/precio sale de un
`.map` sobre dos entradas. Los cuatro quedaron asociados.

El buscador de escritorio no usa `<select>`: son dropdowns hechos con `<button>`
que llevan su texto dentro, así que ya tenían nombre accesible.

#### Cómo se verificó sin poder entrar al admin

`AdminPage` exige sesión de Supabase, así que los 8 paneles no se pueden
recorrer con el navegador. Pero **el arreglo de los 152 vive entero en `Field` y
el de los 19 en `FieldGroup`**: se montó un banco de pruebas temporal con los
componentes reales —`Field`, `FieldGroup`, `Inp`, `Txa`, `Sel`, `Chk`,
`ImageUploader` y `RichTextEditor`— y se midió ahí. `PropImageManager` no se
exporta desde `Propiedades.tsx`, así que se replicó su estructura interna
exacta, que es la propiedad bajo prueba.

El banco se borró al terminar. No quedó en el repositorio.

| Prueba | Antes | Después |
|---|---|---|
| `labels.length` en input, textarea y select de `Field` | 0 | **1** |
| `text-transform` computado del campo | `none` | **`none`** |
| `letter-spacing` computado del campo | `normal` | **`normal`** |
| texto tecleado | — | **«Depto en Las Condes», intacto** |
| nombre accesible de los `FieldGroup` | no existían | **4 de 4, origen `relatedElement`** |
| pulsar el rótulo de un `FieldGroup` | habría abierto el selector | **no enfoca nada** |
| `<label>` anidados | — | **0** |
| ids duplicados | — | **0**, con 4 ids de `useId()` (`:r0:`…`:r3:`) |
| `<select>` de `SearchBar` con label | `[0,0,0,0]` | **`[1,1,1,1]`** |

#### Comparación visual: 0 píxeles

No se compararon hashes de PNG sino **píxel a píxel**, decodificando las dos
imágenes en un canvas y contando las diferencias:

| Captura | Píxeles distintos |
|---|---:|
| banco de `Field` + `FieldGroup` (1280×1083) | **0** |
| `SearchBar` a 390px de ancho (500×333) | **0** |

##### El falso positivo del foco

La primera comparación del banco dio 776 píxeles distintos (0,056 %), y **656
de ellos estaban en una sola fila**, la 101, a lo ancho del primer campo. No era
el cambio: era `.input-line:focus`, el borde verde. La sonda de accesibilidad
había tecleado en ese input y, en una de las dos corridas, después pulsaba los
rótulos de los `FieldGroup` y con eso quitaba el foco.

**Una captura solo sirve para comparar si el estado es neutro.** Se repitió sin
teclear, sin pulsar y con `blur()` explícito antes de disparar, y dio 0.

Que el grueso de la diferencia caiga en una única fila horizontal es la firma de
un borde, no de un cambio de layout: si algo se hubiera movido, las diferencias
se repartirían por muchas filas.

#### Lo que NO se hizo, y por qué

**Los rótulos en mayúsculas: no había nada que cambiar.** El encargo pedía pasar
el texto a minúsculas y dejar las mayúsculas al CSS. Ya estaba así. De **243
rótulos localizados en `src/`, solo 4 están escritos en mayúsculas**, y los
cuatro son siglas legítimas: `RUT` una vez y `SDM` tres —y las de `SDM` ni
siquiera son rótulos de campo, son la marca en el header, el footer y la página
de evaluación—.

Las mayúsculas que se ven vienen todas de `text-transform: uppercase` en CSS. El
problema real es otro: **Chrome aplica `text-transform` al calcular el nombre
accesible.** El código dice `Nombre completo` y el árbol de accesibilidad
expone `NOMBRE COMPLETO`. Medido, no supuesto.

Así que mover las mayúsculas al CSS no arregla nada, porque ya están en el CSS.
Las únicas salidas de verdad son quitar `text-transform: uppercase` de los
rótulos —que **cambia el aspecto de todo el sitio**— o aceptarlo. Es una
decisión de diseño, no de semántica, y quedó **pendiente de Víctor**.

#### Pendiente

- El input de solo lectura con la URL dentro de `ImageUploader` no tiene nombre
  propio. Está dentro de un `FieldGroup` con nombre, así que hay contexto, pero
  un lector lo anuncia sin decir qué es.
- Los botones de `RadioGroup` en `SolicitudCreditoForm` siguen sin exponer
  estado de selección — ver el paso 1.
- `PropiedadesPage.tsx` (2 `<select>` con `<label>` sueltos), `MapPicker.tsx`
  (solo `placeholder`) y `ElBarrancoShowcase.tsx` (2 `<label>` sueltos) siguen
  sin asociar.

---

### Accesibilidad — tanda 2: cierre de los tres archivos — 2026-08-08

`PropiedadesPage` (5 filtros), `ElBarrancoShowcase` (3 campos) y `MapPicker`
(1). Los tres tenían **rótulo visible sin asociar**, así que se envolvió: ni un
solo `aria-label`, ni un cambio de texto, ni uno de diseño.

Más el `aria-label="URL de la imagen"` del input de solo lectura de
`ImageUploader`. **Ahí sí corresponde `aria-label`** y no un rótulo visible: es
un campo de apoyo para copiar, no un dato que se edite, y el `FieldGroup` que
lo contiene ya nombra al conjunto. Un segundo rótulo visible sería ruido.

| Archivo | Campos | `labels` antes → después |
|---|---:|---|
| `PropiedadesPage.tsx` | 5 | `[0,0,0,0,0]` → `[1,1,1,1,1]` |
| `ElBarrancoShowcase.tsx` | 3 | `[0,0,0]` → `[1,1,1]` |
| `MapPicker.tsx` | 1 | `[0]` → `[1]` |

Los 9 con origen `relatedElement`. Los filtros del catálogo no tenían **ningún**
nombre —ni `placeholder`—: el lector anunciaba «cuadro combinado» y nada más.

`S.formLabel` de `ElBarrancoShowcase` es el caso más claro de la trampa de
herencia: lleva `letterSpacing: '0.3em'` y `textTransform: uppercase`, y
`S.formInput` no fija ninguna de las dos. Se quedó en el `<span>`.

Comparación píxel a píxel con foco neutro: **0 diferencias en los tres**, y
`MapPicker` con las mismas dimensiones exactas, así que tampoco cambió el
layout.

---

## Dos criterios que se fijan acá

### 1. Los rótulos en mayúsculas se quedan. Es una excepción consciente

**No es un pendiente.** El texto ya está en minúsculas en el código —de 243
rótulos, solo 4 en mayúsculas, y los 4 son siglas: `RUT` y `SDM`×3—. Las
mayúsculas vienen de `text-transform: uppercase` en CSS.

El problema es que **Chrome aplica `text-transform` al calcular el nombre
accesible**: el código dice `Nombre completo` y el árbol de accesibilidad
expone `NOMBRE COMPLETO`. Algunos lectores deletrean las palabras en
mayúsculas.

Quitar `text-transform` arreglaría el nombre, pero **cambiaría el aspecto de
todos los formularios del sitio**, y el problema afecta solo a algunos
lectores. La relación entre lo que cuesta y lo que resuelve no da.

Queda así a propósito. Si alguien lo detecta en una auditoría futura, esto es
la respuesta: ya se evaluó y se decidió.

### 2. Al comparar capturas, el foco deja rastro

Una diferencia de píxeles **concentrada en una sola fila horizontal es la firma
de un borde**, no de un cambio de layout. Si algo se hubiera movido, las
diferencias se repartirían por muchas filas.

Pasó midiendo `Field`: 776 píxeles distintos, **656 de ellos en la fila 101**, a
lo ancho justo del primer campo. Era `.input-line:focus` —el borde verde—,
porque la sonda de accesibilidad había tecleado ahí y en una de las dos corridas
después pulsaba otros elementos y quitaba el foco.

**Una captura solo sirve para comparar si el estado es neutro en las dos
corridas:** sin teclear, sin pulsar y con `blur()` explícito antes de disparar.
Repetida así, la misma comparación dio 0.

Corolario del mismo caso: **la caja de recorte tiene que apuntar al mismo
elemento en las dos corridas.** Con `MapPicker` se usó
`input.closest('div')` y, como el envoltorio pasó a ser un `<label>`, en la
segunda corrida atrapó un `<div>` distinto: la captura salió de 656×62 a 656×98
sin que nada hubiera cambiado de tamaño. Con una caja estable —la raíz— dio
0 diferencias y las mismas dimensiones.

---

### El barrido completo de `src/`: quedan 83 campos sin asociar

Las tandas anteriores midieron lo que tenían delante —los `<Field>`, los
formularios públicos, `SearchBar`— y de ahí salió «quedan tres archivos». Era
incompleto. Un barrido de **todo `src/` con el parser de TypeScript** da otro
número.

| Archivo | Campos sin nombre |
|---|---:|
| `components/cotizaciones/CotizacionesAdmin.tsx` | 35 |
| `pages/admin/FichaClienteEditar.tsx` | 14 |
| `pages/admin/FichaClienteNueva.tsx` | 14 |
| `components/tarjetas/TarjetasEquipo.tsx` | 7 |
| `pages/admin/Agentes.tsx` | 3 |
| `pages/admin/FichaClienteDetalle.tsx` | 3 |
| `pages/admin/FichaClientesLista.tsx` | 3 |
| `pages/AdminPage.tsx` (el login) | 2 |
| `pages/admin/Contenido.tsx` | 1 |
| `pages/admin/Propiedades.tsx` | 1 |
| **total fuera de `Captacion.tsx`** | **83** |

`Captacion.tsx` suma 5 más y es dominio de la sesión Sofía.

#### `Fld` es el mismo defecto que tenía `Field`, dos veces

**42 de los 83** salen de un solo patrón: `CotizacionesAdmin` y
`TarjetasEquipo` definen **cada uno su propio `Fld`**, copia exacta del `Field`
viejo:

```jsx
function Fld({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label …>{label}</label>   {/* yuxtapuesto, no envuelve */}
      {children}
    </div>
  )
}
```

Arreglarlos es el mismo cambio de dos líneas ya validado en `Field`: el `<div>`
pasa a `<label>` y el `<label>` interior a `<span>` —con el estilo en el
`<span>`, o el texto tecleado sale en mayúsculas—. Cerraría 42 de golpe.

Los `FichaCliente*` (34) no tienen envoltorio: son campos sueltos y hay que
mirarlos uno a uno.

#### Los dos errores de medición que hubo que corregir

Anotados porque cualquiera que repita el barrido va a tropezar con ellos:

1. **Contar sobre el texto crudo cuenta los comentarios.** `Propiedades.tsx`
   tiene un comentario que menciona `<input type="file">` y aparecía como campo
   real.
2. **Blanquear los comentarios con expresiones regulares rompe el conteo de
   etiquetas.** Al hacerlo desapareció un `</label>`, la pila quedó abierta y
   **los 35 campos de `CotizacionesAdmin` pasaron a figurar como asociados**.
   Un falso negativo que da justo el resultado que uno quiere ver.

La versión fiable **parsea con el compilador de TypeScript** y recorre el AST de
JSX con la pila real de ancestros. Los comentarios, las cadenas y el anidamiento
dejan de importar.

> **Y hay que verificar qué asocia de verdad.** La primera pasada del barrido
> con AST dio 45 en vez de 83, porque se había supuesto que `Fld` asociaba, por
> parecerse a `Field`. Un envoltorio no asocia porque se llame parecido: hay que
> abrir su implementación.
