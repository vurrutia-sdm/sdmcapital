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
