# SDM Capital — notas para Claude Code

## Antes de tocar nada: leer SINCRONIA.md

Varias sesiones de Claude Code trabajan sobre este repo en paralelo.
[`SINCRONIA.md`](./SINCRONIA.md) define qué archivos le corresponden a cada una y
dos reglas obligatorias:

1. **Commitear antes de deployar**, nunca al revés — el deploy toma el working
   tree completo, no lo commiteado.
2. **Correr `git status` al iniciar sesión** — si hay cambios sin commitear de
   otra sesión, detenerse y preguntar antes de editar.

Ahí mismo está el registro donde cada sesión anota en qué está trabajando.

## Migraciones de base de datos (Supabase)

El proyecto está linkeado a `ugfhgfpgxyfzafudxaeo`, así que el DDL se aplica
desde acá — siempre que la CLI esté autenticada con la cuenta correcta.

### Antes de cualquier DDL: verificar con qué cuenta quedó la CLI

El login de `supabase` es **global de la máquina, no por proyecto**. Al alternar
entre SDM y BookFindería hay que reloguearse cada vez. El link
(`supabase/.temp/project-ref`) no cambia, así que el repo se ve perfectamente
normal aunque la CLI esté apuntando a la cuenta equivocada.

```bash
supabase projects list
```

`ugfhgfpgxyfzafudxaeo` ("SDM New Website") tiene que aparecer en la lista, con
`"linked": true`. Si no está, la CLI quedó en la otra cuenta.

Síntoma cuando pasa eso:

```
Initialising login role...
unexpected login role status 403: {"message":"Your account does not have the
necessary privileges to access this endpoint. ..."}
Connect to your database by setting the env var correctly: SUPABASE_DB_PASSWORD
```

Ese 403 **no** es un problema de permisos dentro del proyecto: es que la cuenta
autenticada no ve el proyecto. Se resuelve con:

```bash
supabase login
```

El mensaje sugiere `SUPABASE_DB_PASSWORD` y es una pista falsa: lleva a
conectarse por fuera de la autenticación normal. **Nunca** pedir ni usar la
contraseña de la base para esquivar este error — la solución es reloguearse.

### Los 10 archivos SQL antiguos de `supabase/migrations/` NO deben renombrarse

Estos archivos no siguen el patrón `<timestamp>_descripcion.sql`:

```
captacion_propiedades.sql        paginas_legales.sql
ficha_clientes.sql               paginas_legales_extra.sql
propiedades_dossiers_y_flow.sql  propiedades_estados_resultado.sql
solicitudes_credito.sql          solicitudes_credito_extra.sql
tarjetas_equipo.sql              travel_guide.sql
```

La CLI los ignora justamente por eso, y esa es la protección que los mantiene
inofensivos. **Ya fueron aplicados a mano** contra la base de producción.

Si alguien los renombra al formato timestamp, el siguiente
`supabase migration up --linked` intentará ejecutarlos sobre una base donde ya
están aplicados. Al menos uno es destructivo:
`propiedades_dossiers_y_flow.sql` hace
`ALTER TABLE propiedades RENAME COLUMN dossiers TO dossiers_legacy`.

No renombrarlos. Se quedan como documentación histórica.

### Para DDL nuevo

1. Crear el archivo en `supabase/migrations/` con formato
   `<timestamp>_descripcion.sql` — por ejemplo
   `20260803000000_cotizaciones_pais_ciudad.sql`.
2. Verificar con `supabase migration list` que lo único pendiente sea ese
   archivo.
3. Aplicar con:

```bash
supabase migration up --linked
```

**Nunca** `supabase db push` ni `supabase migration repair`.

Nota: `supabase db query` no existe como subcomando de la CLI. Los subcomandos
de `supabase db` son `diff`, `dump`, `push`, `pull`, `reset` y `lint`.

## Build y deploy

`npm run build` corre `tsc && vite build`: el typecheck bloquea el build a
propósito, para que un error de tipos no llegue a producción. Hay un hook
`prebuild` (`scripts/sync-hero-preload.mjs`) que sincroniza el preload del hero.

Deploy a Cloudflare Pages:

```bash
unset CLOUDFLARE_API_TOKEN && npm run build && npx wrangler pages deploy dist --project-name=sdmcapitalpage
```

## Escrituras a Supabase

Toda operación de escritura debe recoger el `{ error }` y pasarlo por
`avisarError()` (`src/lib/errores.ts`), que loguea el objeto completo y muestra
code / message / details / hint. Un formulario nunca debe cerrarse ni perder lo
escrito cuando la escritura falla.

Motivo: durante meses el admin descartaba el `{ error }`. Un `INSERT` de
cotización fallaba con 400 porque `prop_pais` no existía como columna, y el
wizard se cerraba como si hubiera guardado — pérdida silenciosa de datos.

## Imágenes

Viven en R2 (`imagenes.sdmcapital.cl`), con variante de 400px bajo `thumbs/`.

- `thumbUrl()` — miniaturas en catálogo, tarjetas y galerías.
- `imagenParaPDF()` — para PDFs. El bucket **no** manda
  `access-control-allow-origin`, y `@react-pdf/renderer` descarga la imagen con
  `fetch()`, así que la petición directa la bloquea CORS. Se enruta por
  `/api/imagen` (`functions/api/imagen.js`), que sirve desde el mismo origen.
