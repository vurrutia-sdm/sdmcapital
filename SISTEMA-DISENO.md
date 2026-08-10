# Sistema de diseño — SDM Capital

Referencia. Si buscas **qué usar**, está acá. Si buscas **cuándo se decidió y
por qué se probaron tres alternativas**, eso está en
[`SINCRONIA.md`](./SINCRONIA.md), que es el registro cronológico.

Cuando este documento y `SINCRONIA.md` se contradigan, manda éste.

Todas las cifras de este archivo están medidas contra el código, no
transcritas. Última verificación: **2026-08-09**.

---

## 1 · TOKENS

**58 custom properties** en [`src/styles/globals.css`](./src/styles/globals.css)
(`:root`) y **13 entradas de color** en
[`tailwind.config.js`](./tailwind.config.js), de las cuales 4 son punteros
`var()` a las anteriores.

### 1.1 Color

Los ratios están contra los tres fondos reales del sitio. **Negrita** = el par
en el que ese token se usa de verdad.

#### Marca

| token | valor | s/ blanco | s/ `--navy-dark` | s/ `--off` | para qué |
|---|---|---|---|---|---|
| `--navy` | `#1C3D5C` | **11,22** | 1,40 | 10,74 | azul de marca, texto y superficies |
| `--navy-dark` | `#0F2535` | **15,71** | 1,00 | 15,04 | titulares, fondo de `.btn-primary` |
| `--navy-deeper` | `#081828` | **17,92** | 1,14 | 17,15 | fondos muy oscuros, hover de `.btn-primary` |

> **`#1C2B3A` es un tercer navy, y se queda como literal a propósito.** No es un
> token y no debe migrarse a `--navy-dark`: la distancia sRGB entre los dos es
> **15,2**, o sea perceptible, y cambiarlo alteraría visualmente dos superficies
> de conversión. Cuatro usos: el panel izquierdo de
> [`SolicitudCreditoModal`](./src/components/credito/SolicitudCreditoModal.tsx)
> (`:43` fondo, `:140` texto) y la sección y el pie de
> [`EvaluacionGratuitaPage`](./src/pages/EvaluacionGratuitaPage.tsx) (`:51`, `:96`).
>
> Contrasta bien con lo que lleva encima —blanco 0.85 da 10,81:1, `--sky` 0.85 da
> 6,19:1— así que no hay motivo de accesibilidad para tocarlo.
>
> Lo acompaña **`#2E4057`** (3 usos, las cajas de honorarios del mismo modal),
> que está a 18,9 de `--navy` por la misma razón. Si algún día se unifican, va la
> pareja junta y es un cambio de diseño, no de mantenimiento.
>
> **Un barrido de literales de color NO debe marcar estos dos como deuda.**
| `--green` | `#3DAA6E` | 2,93 ❌ | **5,37** | 2,80 | verde de marca — **solo sobre oscuro**. Sus 29 usos sobre claro se corrigieron el 2026-08-09 |
| `--green-dark` | `#2D8055` | **4,85** | 3,24 | 4,64 | el verde cuando lleva blanco encima |
| `--sky` | `#A8C4DC` | 1,81 | **8,68** | 1,73 | azul claro sobre fondos oscuros |
| `--sky-light` | `#D4E6F1` | 1,28 | 12,26 | 1,23 | superficies teñidas |
| `--sky-pale` | `#EDF4F9` | 1,11 | 14,15 | 1,06 | fondo de campos del admin |

#### Neutros

| token | valor | s/ blanco | para qué |
|---|---|---|---|
| `--ink` | `#1a1a1a` | **17,40** | texto de cuerpo |
| `--muted` | `#5F7183` | **5,03** | texto secundario. El más usado del sistema: 306 `var()` |
| `--off` | `#F9FAFB` | 1,05 | fondo de sección alterno |
| `--border` | `#e8edf2` | 1,18 | **solo decorativo** — ver 4.1 |
| `--border-input` | `#767F8A` | **4,06** | borde de un control sobre blanco o `--off` |
| `--border-input-admin` | `#5A81A2` | **4,12** | ídem sobre `--sky-pale` |

#### Estado de propiedad — insignia con texto blanco

| token | valor | blanco encima |
|---|---|---|
| `--estado-vendida` | `#C0392B` | **5,44** |
| `--estado-reservada` | `#1F5F6B` | **7,22** |
| `--estado-arrendada` | `#2563EB` | **5,17** |
| `--oportunidad` | `#2D8055` | **4,85** |

#### Prioridad de lead — texto de color sobre fondo teñido

Cada uno lleva su fondo **para que el ratio se pueda verificar en un solo
sitio**. Cuando el fondo vivía como literal en `Captacion.tsx`, la relación
estaba partida en dos archivos.

| token | valor | fondo | ratio |
|---|---|---|---|
| `--lead-hot` | `#9A0410` | `--lead-hot-fondo` `#FDE2E1` | **7,15** |
| `--lead-warm` | `#A95704` | `--lead-warm-fondo` `#FDEDD6` | **4,51** |
| `--lead-cold` | `#2C5DA0` | `--lead-cold-fondo` `#DDE7F6` | **5,29** |

`--lead-warm` se reutiliza como fondo con texto blanco en el botón «Tomar
control» del banner de modo (5,18:1).

#### Error

| token | valor | s/ blanco | s/ `--off` | blanco encima |
|---|---|---|---|---|
| `--error` | `#A8384B` | **6,30** | **6,03** | **6,30** |

Un envío que no salió, un registro que no se encontró, y el texto de los
botones «Eliminar». **Nada más** — no es insignia de estado ni marca urgencia.

#### Estados de botón

| token | valor | resuelve a |
|---|---|---|
| `--btn-primary-hover` | `var(--navy-deeper)` | `#081828` |
| `--btn-primary-active` | `#04101A` | — |
| `--btn-green-hover` | `#246A46` | — |
| `--btn-green-active` | `#1D5539` | — |
| `--btn-inverse-hover` | `var(--sky-pale)` | `#EDF4F9` |
| `--btn-inverse-active` | `var(--sky-light)` | `#D4E6F1` |
| `--btn-text-hover` | `var(--navy-dark)` | `#0F2535` |
| `--btn-text-active` | `var(--navy-deeper)` | `#081828` |

#### Los cuatro nombres compartidos

`ink`, `muted`, `border` y `off` existen en los dos archivos. En
`tailwind.config.js` **no llevan valor**: apuntan con `var()` a las custom
properties, así que el valor vive en un solo sitio y no pueden divergir.

Coste asumido: se pierden los modificadores de opacidad (`text-muted/50`).
Cero usos hoy.

`navy`, `green` y `sky` **no** entran: están anidados
(`navy.DEFAULT`/`dark`/`deeper`) y no tienen equivalente exacto en
`globals.css`.

### 1.2 Tipografía — 13 tokens

Cada uno tiene su espejo exacto en `tailwind.config.js` (`fontSize`,
`letterSpacing`).

| token | rem | px | clase Tailwind |
|---|---|---|---|
| `--sdm-display-sm` | `1.75rem` | 28 | `text-sdm-display-sm` |
| `--sdm-display-md` | `2.5rem` | 40 | `text-sdm-display-md` |
| `--sdm-display-lg` | `3.25rem` | 52 | `text-sdm-display-lg` |
| `--sdm-display-xl` | `4.5rem` | 72 | `text-sdm-display-xl` |
| `--sdm-text-xs` | `0.6875rem` | 11 | `text-sdm-xs` |
| `--sdm-text-sm` | `0.8125rem` | 13 | `text-sdm-sm` |
| `--sdm-text-base` | `0.9375rem` | 15 | `text-sdm-base` |
| `--sdm-text-lg` | `1.0625rem` | 17 | `text-sdm-lg` |
| `--sdm-text-xl` | `1.25rem` | 20 | `text-sdm-xl` |
| `--sdm-text-2xl` | `1.5rem` | 24 | `text-sdm-2xl` |
| `--sdm-tracking-tight` | `-0.03125rem` | −0,5 | `tracking-sdm-tight` |
| `--sdm-tracking-normal` | `0` | 0 | `tracking-sdm-normal` |
| `--sdm-tracking-wide` | `0.125rem` | 2 | `tracking-sdm-wide` |

**Van en `rem` y no en `px` a propósito**: en `px` el token ignora la
preferencia de tamaño de fuente del navegador.

Familias: **Cormorant Garamond 300** para display (`.font-serif`), **Inter**
para UI y cuerpo (`.font-sans`).

**No hay tokens de interlínea.** Ver 1.6. Los de peso están en 1.3.

### 1.3 Peso tipográfico — 5 tokens

| token | valor | clase | usos hoy |
|---|---|---|---|
| `--sdm-peso-ligero` | `300` | `font-sdm-ligero` | 224 |
| `--sdm-peso-normal` | `400` | `font-sdm-normal` | 42 |
| `--sdm-peso-medio` | `500` | `font-sdm-medio` | 70 |
| `--sdm-peso-semi` | `600` | `font-sdm-semi` | 128 |
| `--sdm-peso-fuerte` | `700` | `font-sdm-fuerte` | 50 |

**Los cinco son caras reales.** Hasta el 2026-08-09 la escala tenía solo tres:
`index.html` cargaba `Inter:wght@300;400;500`, así que los 168 usos de 600 y
700 sobre Inter eran **negrita sintética** — el navegador los falsificaba
engordando los trazos.

**La razón desapareció al medir el coste.** Google sirve Inter como **fuente
variable**: un único `.woff2` cubre todo el rango, y los siete ficheros que
sirve para tres pesos son *exactamente los mismos* que para cinco, comparados
byte a byte. Cargar 600 y 700 no añadió ni una descarga.

Medido con caché fría, antes y después:

| | antes | después |
|---|---|---|
| peticiones a `fonts.gstatic` | 3 | **3** |
| el `.woff2` de Inter | `UcC73…Q5nw` 48.567 B | **el mismo** |
| CLS | 0,00240 | 0,00241 |
| FCP (3 muestras) | 172 / 180 / 168 ms | 168 / 148 / 164 ms |

Lo único que creció es la hoja CSS de Google, de 7.521 a 12.535 bytes — ~1 kB
con gzip, desde un dominio con `preconnect` ya establecido.

**Cómo se comprobó que las caras son reales y no sintéticas.** Midiendo el
ancho trazado del mismo texto a cada peso:

```
  antes    300→492,86   400→499,08   500→503,47   600→503,47   700→503,47
  después  300→492,86   400→499,08   500→503,47   600→507,86   700→512,24
```

Antes, 600 y 700 medían **exactamente lo mismo que 500**: el navegador usaba
la cara de 500 y engordaba encima. Ahora cada peso tiene su métrica, en pasos
regulares — el interpolado de una variable real.

**La escala no es por familia, y podría haberlo sido.** Cormorant carga
300/400/500/600, Lora 400/500/600/700 y Poppins 300/400/500/600. Ningún peso
de la escala falta en Inter, que lleva el grueso del texto de interfaz, así
que un solo juego sirve a todas. **`fuerte` (700) no existe en Cormorant ni en
Poppins**: ahí el navegador seguiría sintetizando, y por eso no debe usarse
sobre esas dos.

### 1.4 Radio — 3 tokens

Por **lo que es el elemento**, no por su tamaño.

| token | valor | clase | para qué |
|---|---|---|---|
| `--sdm-radio-control` | `2px` | `rounded-sdm-control` | botones, campos, insignias |
| `--sdm-radio-contenedor` | `4px` | `rounded-sdm-contenedor` | tarjetas, paneles, cajas |
| `--sdm-radio-flotante` | `8px` | `rounded-sdm-flotante` | modales, desplegables |

El radio mayor del flotante no es decoración: es lo que lo separa de la
superficie que tapa.

**Círculos y píldoras no entran en la escala.** Ahí el radio define la *forma*,
no redondea una esquina: un token de 8px rompe una píldora. Para eso está
`rounded-full`, que sigue existiendo.

**Los dos lenguajes propios ya se alinearon** (2026-08-09): Captación pasó 16
contenedores de 6 a 4px y su botón de 6 a 2px; SearchBar pasó sus 7 controles
de 8 a 2px, y sus 2 desplegables se quedaron en 8px porque ya eran flotantes.

**Lo que sigue pendiente:** ningún modal usa hoy 8px — tres van a 6, uno a 4 y
dos tienen las esquinas rectas. El token dice hacia dónde van, no dónde están.
Y quedan radios sueltos que no coinciden con ningún token; se corrigen cuando
se toque cada componente, no en una migración masiva (ver 4.8).

### 1.5 Movimiento — 3 duraciones y 1 curva

| token | valor | clase | usos hoy |
|---|---|---|---|
| `--sdm-mov-rapido` | `150ms` | `duration-sdm-rapido` | 43 |
| `--sdm-mov-normal` | `200ms` | `duration-sdm-normal` | 51 |
| `--sdm-mov-lento` | `500ms` | `duration-sdm-lento` | 11 |
| `--sdm-curva` | `cubic-bezier(0.4, 0, 0.2, 1)` | `ease-sdm` | — |

Los tres cubren 105 de las 134 transiciones. La cola —100, 180, 300, 400 y
600 ms— no se migra: son diferencias que nadie distingue.

**Lo que no entra en la escala:**

- Los **1200 y 5000 ms** del hero y del showcase son entradas y zooms lentos,
  no retroalimentación de interfaz.
- La **rotación de los carruseles** (`setInterval` a 1200 y 5500 ms). Un
  intervalo dice cada cuánto ocurre algo, no cuánto tarda: no es una
  transición.

**La curva es la de Tailwind, no el `ease` por defecto.** De las 134
transiciones, 77 llegan por clases `transition-*` que ya usan
`cubic-bezier(.4,0,.2,1)`; de las inline, 49 no declaran curva y heredan el
`ease` implícito. El token alinea los dos caminos en el que ya manda.

**`prefers-reduced-motion` gana a los tokens.** La media query fuerza
`transition-duration: 0.01ms !important`, aparece en el CSS después de las
definiciones y ninguna declaración de token lleva `!important`. Su criterio es
**acortar, no eliminar**.

### 1.6 Espaciado — sin tokens (hueco conocido)

`globals.css` no define ninguna custom property de espaciado y
`tailwind.config.js` **no extiende `spacing`**. Se usa la escala nativa de
Tailwind (20 de sus ~34 pasos, 713 apariciones) y, en paralelo, **1.619 valores
sueltos inline** — 484 `margin`, 416 dimensiones, 409 `padding`, 220 `gap`.

**La escala NO se define hasta que se decida migrar, y es deliberado.** Tres
tokens no resuelven 1.619 literales, y aplicarlos solo a lo nuevo dejaría dos
ritmos conviviendo hasta que se migrara — peor que uno inconsistente. Si algún
día se decide migrar, entonces se define. No antes.

Es el hueco más grande del sistema: 2,3 números escritos a mano por cada uso de
la escala.

Tampoco hay token de **interlínea** (137), ni de **blanco** (217 `#fff`/`#ffffff` más 9 opacidades distintas de
`rgba(255,255,255,α)`), ni de **área táctil** (`h-[44px]`/`w-[44px]` ×22, más la
clase `.area-44` que resuelve lo mismo por otra vía).

### 1.7 Sombras — sin tokens (decisión, no hueco)

**El sistema usa bordes finos en vez de sombras.** Por eso no hay escala de
elevación, y no debe crearse una sin revisar la decisión.

Quedan **19 sombras** (12 inline + 7 clases de Tailwind, 9 valores distintos)
contra **115 bordes de 1px**. Cero en `globals.css`: ninguna vive en el sistema,
todas son locales y todas son superficies flotantes — modales, la tarjeta del
mapa, dos tarjetas elevadas.

---

## 2 · COMPONENTES

### 2.1 Botones — la tabla de «usa este cuando…»

| clase | usos | qué es | **úsalo cuando** |
|---|---|---|---|
| `.btn-primary` | 24 | navy sólido, texto blanco | la acción principal **sobre fondo claro** |
| `.btn-inverse` | 1 | blanco sólido, texto navy | la acción principal **sobre fondo oscuro**. `.btn-primary` ahí es invisible: botón y fondo son el mismo color (1,00:1) |
| `.btn-green` | 12 | verde oscuro, texto blanco | **confirmar o guardar**: «Guardar cambios», «Nuevo artículo», enviar una cotización |
| `.btn-outline` | 2 | transparente con borde | secundario **sobre fondo oscuro o foto**, junto a un primario |
| `.btn-text` | 2 | texto con subrayado y `→` | terciario, en línea: «Ver todas las propiedades», «← Volver al Blog» |

Los cinco comparten geometría: `px-6 py-3`, 13 px, peso medio, mayúsculas,
`tracking` de 1,5 px y radio de control. `.btn-text` es la excepción: sin
relleno, con `border-b`.

#### Estados — los cuatro, en las cinco variantes

| variante | default | hover | active | disabled |
|---|---|---|---|---|
| `.btn-primary` | `#0F2535` 15,71 | `#081828` **17,92** | `#04101A` **19,19** | opacidad 0,5 |
| `.btn-inverse` | `#FFFFFF` 15,71 | `#EDF4F9` **14,15** | `#D4E6F1` **12,26** | opacidad 0,5 |
| `.btn-green` | `#2D8055` 4,85 | `#246A46` **6,51** | `#1D5539` **8,71** | opacidad 0,5 |
| `.btn-outline` | alfa .40 **3,67** | `#fff` **15,71** | `#fff` + borde .65 | opacidad 0,5 |
| `.btn-text` | `#1C3D5C` 11,22 | `#0F2535` **15,71** | `#081828` **17,92** | opacidad 0,5 |

**El hover cambia el color, nunca la opacidad.** Bajar la opacidad mezcla el
botón con el fondo y hunde el contraste del texto justo cuando el usuario está
apuntando: `.btn-green` pasaba de 4,85:1 a 4,01:1 con `opacity-90`.

**`:focus-visible` no lleva tratamiento por variante.** La regla global
`*:focus-visible { outline: 2px solid var(--green-dark); outline-offset: 2px }`
dibuja el anillo *fuera* del botón, así que contrasta con el fondo de página:
blanco 4,85 · `--off` 4,64 · `--sky-pale` 4,37 · `--navy-dark` 3,24 ·
`--navy-deeper` 3,70. Los cinco por encima del 3:1 de 1.4.11.

**Cargando no es deshabilitado.** Los cuatro `<label>` de subida de imagen
cambian su texto a «Subiendo…» y atenúan el fondo: eso es un estado de CARGA,
no de deshabilitado, y no se unifica con él. La diferencia importa: un
deshabilitado dice «no puedes», un cargando dice «espera».

**`:disabled` es una sola regla al 50 %**, y cubre `[aria-disabled="true"]`
porque 8 de los 23 elementos con estas clases son `<Link>` o `<a>`, donde el
atributo `disabled` no existe. WCAG **exime** a los deshabilitados del requisito
de contraste: el criterio es que se distinga del habilitado, no un ratio.

### 2.2 Campos de formulario

Viven en [`src/components/admin/campos.tsx`](./src/components/admin/campos.tsx).

| componente | usos | qué es |
|---|---|---|
| `Field` | 229 | rótulo + control. Un `<label>` que **envuelve** su campo |
| `FieldGroup` | 20 | lo mismo, para lo que **no** es un control etiquetable |
| `Inp` | 146 | input controlado |
| `Txa` | 29 | textarea |
| `Sel` | 12 | select |
| `Chk` | 9 | checkbox con rótulo |

**`Field` vs `FieldGroup`.** `Field` para un control etiquetable: un `<label>`
que contiene a su campo lo asocia sin `htmlFor` y sin `id`, y sin ids no hay
ninguno que pueda colisionar.

`FieldGroup` para los editores compuestos — `ImageUploader`, `RichTextEditor`,
`PropImageManager`. Un `<label>` por fuera de esos **anida etiquetas** y, peor,
apunta al primer descendiente etiquetable, que es el `<input type="file">`
oculto: pulsar «Foto del destino» abriría el diálogo de subida. Usa
`role="group"` + `aria-labelledby` con un id de `useId()`, porque varios se
montan más de una vez en la misma página.

**El estilo del rótulo va en el `<span>`, nunca en el `<label>`.** Ver 5.4.

`Inp` y `Txa` mantienen el valor en estado local y solo llaman a `onChange` en
el `onBlur`: evita que el panel entero se re-renderice con cada tecla.

**Alineación.** Cuando dos campos de una fila no comparten línea de base, el
arreglo va en la **fila** (`items-end` en la rejilla), no en `Field`. Ponerlo en
`Field` hundiría los campos cortos al fondo en las filas donde conviven con un
`<Txa>`.

### 2.3 `.input-line` — 42 usos

La clase de todo control de una línea: input, select y textarea. Borde inferior
en `--border-input`, sin caja.

Tiene **altura mínima derivada** (`calc(1.5em + 1.25rem + 1px)`) porque el
navegador impone al `<select>` `line-height: normal !important` desde su hoja de
agente de usuario: sin ella, un input medía 45 px y un select 41. No es una
altura fija — sale de la tipografía y del padding.

Es la única clase del sistema con `:focus` propio, y su indicador **no depende
solo del tono**. Ver 4.4.

### 2.4 Insignias

Tres familias que significan cosas distintas y **no se mezclan**.

**Estado** — en qué situación está la propiedad. Insignia de arriba,
excluyentes entre sí: `vendida`, `reservada`, `arrendada`.

**Oportunidad** — qué ventaja comercial tiene. Insignia de abajo, también
excluyentes, y **pueden convivir con una de estado**: «Precio rebajado», «Bono
Pie».

Las dos van con texto blanco sobre color sólido, definidas en
`ESTADO_BADGES` de [`PropertyCard.tsx`](./src/components/ui/PropertyCard.tsx).

**Prioridad de lead** — `hot` / `warm` / `cold`, en el panel de Captación.
A diferencia de las dos anteriores, es **texto de color sobre fondo teñido**, no
blanco sobre sólido. Nunca coinciden en pantalla con las otras dos.

**No hay componente `Badge` de insignia**: el marcado se repite inline. (Existe
un `Badge` en `admin/acciones.tsx`, pero es otra cosa.)

### 2.5 Modales — 6 diálogos

`SolicitudCreditoModal`, `PropiedadDetailPage`, `Agentes`,
`FichaClienteDetalle`, `FichaClientesLista`, `Propiedades`.

> **Corrección.** `SINCRONIA.md` tiene una sección titulada «Los modales: son
> CINCO» (línea 4678). Hoy son **seis**, más el hook. Vale este documento.

**No hay componente `Modal`.** La consistencia viene del hook
[`useDialogoModal`](./src/hooks/useDialogoModal.ts), que usan los 6; cada uno
escribe su propio marcado, overlay y caja.

Los seis tienen `role="dialog"`, `aria-modal`, cierre con Escape y bloqueo de
scroll vía [`useBloquearScroll`](./src/hooks/useBloquearScroll.ts).

Si escribes uno nuevo: usa los dos hooks. No inventes el foco atrapado ni el
bloqueo de scroll a mano.

### 2.6 Guardado y confirmación

| componente | usos | qué es |
|---|---|---|
| `Guardado` | 14 | la píldora «Guardado» tras una escritura correcta |
| `SaveBtn` | 11 | botón de guardar; usa `.btn-green` y muestra «Guardando…» |

Ambos en [`admin/acciones.tsx`](./src/components/admin/acciones.tsx), ambos con
`disabled` y `loading`.

**El diálogo de confirmación de guardado existe solo en Propiedades**, con
`role="dialog"`, `aria-modal`, foco atrapado, Escape, retorno del foco,
`useBloquearScroll` y botón primario de ≥44 px. **No se muestra si la escritura
falla.**

### 2.7 Esqueletos de carga

`Esqueleto` (15 usos) **no tiene variantes**: se parametriza con props sueltas
(`alto`, `ancho`, `aspecto`, `radio`, `style`) y cada sitio compone su forma.
Queda además 1 spinner inline que no pasa por él.

### 2.8 Otros

`SEO` (17) · `ImageUploader` (18) · `RichTextEditor` (3) · `PropertyCard` (2) ·
`MapPicker` (1) · `PropertyMap` (1).

Clases sueltas: `.section-label` (29) · `.area-44` (9) · `.admin-loading` (1) ·
`.sr-only` (1) · `.logo-stripe*` · `.prose-sdm`.

---

## 3 · PRINCIPIOS

**Bordes finos en vez de sombras.**
Por eso **no existe una escala de elevación** y no debe crearse una sin revisar
esta decisión. Una superficie se separa con un borde de 1 px, no con un
desenfoque. Las 19 sombras que quedan son excepciones locales de superficies
flotantes.

**Color plano, sin degradados.**
Fue una de las cuatro razones por las que `.btn-evaluacion` se eliminó.

**Movimiento mínimo.**
Sin brillos animados ni movimiento decorativo. `prefers-reduced-motion`
**acorta, no elimina**: quitar la transición entera hace que el cambio de estado
sea instantáneo y más difícil de seguir, no más accesible.

**El valor vive en un sitio.**
Cuando un valor existe en dos archivos, acaban divergiendo — pasó con `muted`
(#7a8a96 vs #5F7183) y con la paleta del PDF. Donde se puede, el segundo archivo
**apunta** al primero con `var()` en vez de copiarlo. Donde no se puede
(`CotizacionPDF.tsx`: `@react-pdf/renderer` rasteriza fuera del DOM y no
resuelve `var()`), el archivo lo dice en mayúsculas y lleva la tabla de
correspondencias.

**El contraste se mide, no se estima.**
Todo par texto/fondo del sistema tiene su ratio calculado, y los colores que
conviven en pantalla tienen además su ΔE2000 bajo protanopia y deuteranopia.

**Área táctil de 44×44 sin cambiar el tamaño visual.**
`.area-44` amplía el objetivo con un pseudo-elemento; el elemento se ve igual.

---

## 4 · DECISIONES CERRADAS — no reabrir

### 4.1 `--border` y `--border-input` son criterios distintos de WCAG

No se unifican.

- `--border` `#e8edf2` (1,18:1) — separaciones **decorativas**: líneas de 1 px,
  divisiones de tabla, bordes de tarjeta. WCAG 1.4.11 **no aplica** a
  decoración, así que 1,18:1 está bien.
- `--border-input` `#767F8A` (4,06:1) — límite de un **control**. 1.4.11 pide
  3:1.
- `--border-input-admin` `#5A81A2` — ídem sobre `--sky-pale`.

Si dudas cuál usar: ¿el elemento se pulsa, se escribe o se selecciona? Entonces
`--border-input`.

### 4.2 `--green` solo sobre oscuro — COMO TEXTO **Y** COMO FONDO

**La regla en una línea: `--green` solo vale cuando lo que hay al lado es
oscuro. En cualquier otro caso va `--green-dark`.**

| par | ratio | |
|---|---|---|
| `--green` sobre blanco | **2,93:1** | ❌ ni llega al umbral de texto grande |
| blanco sobre `--green` | **2,93:1** | ❌ el mismo par, al revés |
| `--green` sobre `--navy-dark` | **5,37:1** | ✅ su uso correcto |
| `--green-dark` sobre blanco | **4,85:1** | ✅ |
| blanco sobre `--green-dark` | **4,85:1** | ✅ |

`--green` **no se elimina**: sigue siendo el color de marca y sobre fondo
oscuro rinde bien.

**ESTA REGLA APLICA A LAS DOS CARAS, y hace falta decirlo porque redactada
como «el problema es blanco encima de verde» se escapó dos veces:**

- **Como color de texto.** Se corrigieron 29 usos el 2026-08-09, incluida la
  regla `.section-label` que pintaba los rótulos de sección de todo el sitio.
- **Como color de fondo con texto blanco encima.** Otros 8 usos, encontrados
  ese mismo día *después* de dar el eje por cerrado, porque el barrido anterior
  buscó `color:` y estos eran `background:`. Estaban en el botón «Buscar» del
  home, la insignia de categoría del blog, dos insignias de la ficha, los
  botones de Rental y Vende, el contador de Mensajes y dos controles del admin
  de propiedades.

Al buscar infracciones de este eje hay que mirar **`color`, `background`,
`background-color`, `bg-[var(--green)]` y `text-[var(--green)]`**. Mirar solo
una de las dos familias da el eje por limpio cuando no lo está.

### 4.3 Los colores de estado se verifican con ΔE2000, no solo con ratio

Bajo **protanopia y deuteranopia**, no solo en visión normal.

`--estado-reservada` es **fría** y no ámbar porque en ámbar daba ΔE2000 de
**2,1** contra `--estado-vendida` bajo deuteranopia — la forma más común de
daltonismo, ~6 % de los hombres —, o sea prácticamente el mismo color. En
`#1F5F6B` su peor ΔE contra los otros tres, en las tres condiciones, es **21,2**.

En la familia de lead, `--lead-warm` no se podía arreglar sin oscurecerlo
—ningún fondo lo salva— y al oscurecerlo colapsaba contra `--lead-hot` bajo
protanopia. Hubo que mover los dos. El peor par del sistema queda en ΔE **12,0**
bajo deuteranopia.

Por encima de 10 son colores distintos.

### 4.4 Un indicador de foco no puede depender solo del tono

El color solo daba 4,85:1 contra el fondo —cumple 1.4.11— pero **1,19:1 contra
el borde en reposo**: el cambio es de tono, casi no de luminancia, y con
daltonismo el campo enfocado se ve igual que el vecino. Por eso `.input-line`
lleva además un cambio no cromático.

### 4.5 Los rótulos en mayúsculas se quedan

`text-transform: uppercase` en los rótulos de campo y en los botones es la
tipografía del sitio y viene de antes. **No es un descuido pendiente.**

La auditoría de accesibilidad lo registró como *observación, no defecto*: el
nombre accesible sale ya transformado («NOMBRE COMPLETO») y algunos lectores de
pantalla deletrean las palabras en mayúsculas. Queda anotado por si alguna vez
se decide poner el texto en minúsculas y dejar las mayúsculas al CSS — pero eso
sería una tanda propia, no una corrección suelta.

Corolario del mismo eje: el `tracking` ancho de los rótulos en versalitas
**tampoco se colapsa**. A 10-13 px y en mayúsculas, el tracking amplio es lo que
los hace legibles; llevarlos a `tracking-sdm-wide` los rompe. Los cuatro
*eyebrows* que usan `em` en vez de un token están bien así.

### 4.6 `.btn-evaluacion` se eliminó — commit `8c9770b`

Rompía **cuatro principios a la vez**: degradado donde el sistema usa color
plano, `box-shadow` donde usa bordes finos, negrita siendo el único botón así, y
un brillo animado en hover donde el sistema dice movimiento mínimo.

La jerarquía que expresaba **sí** era correcta —es el único de los tres botones
que convierte—, así que lo que cambió fue el tratamiento, no el peso. Su lugar
lo ocupa `.btn-inverse`.

Se llama `inverse` y no `invertido` para seguir a las cuatro que sobreviven,
todas en inglés. `evaluacion` era la única en español y era justo la que se va.

### 4.7 El prefijo `sdm-` existe para no pisar las clases de Tailwind

`xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `tight`, `normal` y `wide` son claves
**nativas**. Redefinirlas cambiaría en silencio lo que hace `text-sm` para
cualquiera.

En las custom properties el prefijo no haría falta, pero se pone igual: en una
migración de ~780 literales, una asimetría de nombres cuesta más errores que la
verbosidad.

Excepción documentada: la escala de radio usa `rounded-sdm-control` y no
`rounded-sdm-radio-control`, porque `rounded-` ya significa radio.

### 4.8 La migración masiva a Tailwind está descartada — con medición

Inventario antes de tocar nada:

| | |
|---|---|
| objetos `style={{}}` | **1.457** en 56 archivos |
| peso en el bundle | **115,8 kB**, el **3,2 %** |
| propiedad más repetida | `border` (158), luego `lineHeight` (112) |

El 3,2 % no es lo que decide. Lo que decide es que **migrar transforma, no
elimina**: `style={{ border: '1px solid var(--border)' }}` que pasa a
`className="border border-[var(--border)]"` sigue ocupando bytes, ahora en el
CSS.

Lo que sí se hizo fue lo que **borra** código: 17 clases muertas fuera, y los 70
handlers de hover a `hover:`.

**Corolario, aplicado a la escala de radio:** los 155 radios sueltos tampoco se
migran. Es el mismo intercambio, y a diferencia del contraste esto no incumple
nada.

### 4.9 Los tokens de lead llevan sus fondos

Para que el ratio sea verificable en un solo sitio. Con el texto en
`globals.css` y el fondo como literal en `Captacion.tsx`, la relación de
contraste estaba partida en dos archivos y no había forma de comprobarla de un
vistazo.

---

## 5 · TRAMPAS

Las que muerden a quien escribe componentes. Todas verificadas contra el código.

### 5.1 El `style` inline gana siempre — también sobre `:hover`

Ya mordió en **cuatro elementos, repartidos en tres sitios**:

| sitio | qué pasa |
|---|---|
| `Propiedades.tsx:888` y `:900` | los `<select>` de Región y Comuna llevan `.input-line` **y además** un `borderBottom` inline en `--border` que la anula. La clase se corrigió en su momento y estos dos siguieron pintando el borde que no cumple |
| `HomePage.tsx:311` | `.btn-outline` con `style={{ color, border }}` inline: el `:hover` de la clase **nunca se aplica** |
| `CotizacionesAdmin.tsx:868` | `.btn-outline` con `style={{ color, border }}` inline: ídem |

Los dos últimos son además la razón de que el borde de `.btn-outline`
incumpliera 1.4.11 durante meses sin que nadie lo viera: la clase repartía un
valor que ningún consumidor llegaba a usar.

Si escribes un componente con estados, **no permitas que el consumidor le pase
`style` para el color**. Un inline en el estado normal gana también en hover,
focus y active.

### 5.2 `display: inline-block` no sobrevive dentro de un contenedor flex

Un hijo de un contenedor flex se **blockifica**: `inline-block` pasa a `block`
y `stretch` lo estira a lo ancho de la celda. En un elemento cuyo borde
inferior subraya su texto, eso deja una regla desnuda.

Medido en el bloque de blog del home: **638 px de línea para 128 px de texto**
en la tarjeta grande y 425 para 52 en las pequeñas. Se corrige con
`alignSelf: 'flex-start'`, que devuelve el elemento a su ancho de contenido.

No confundir con el caso legítimo: cuando la diferencia entre el ancho del
elemento y el de su texto es **padding** —las etiquetas de `/servicios`, las
pestañas del buscador, `.btn-outline`— el borde delimita una caja y debe
ocupar todo el ancho. La señal de que es un defecto es que el borde subraye
una palabra, no que envuelva una caja.

### 5.3 Las utilidades de Tailwind ganan por capa a las reglas de componente

`disabled:opacity-60` en el marcado vence a `.btn-primary:disabled` de
`globals.css`, aunque la especificidad sea la misma: las utilidades van en una
capa posterior.

Consecuencia práctica: **unificar un estado en la clase no unifica nada** si los
consumidores conservan su utilidad local. Hay que borrarlas.

### 5.4 Un `<label>` que envuelve hereda al control

`text-transform` y `letter-spacing` son propiedades **heredadas**, y se aplican
al texto que el usuario escribe dentro del input. Subirlas al `<label>` deja
todo lo tecleado en MAYÚSCULAS y con 2 px de separación entre letras, en los
152 campos del admin de una sola vez.

**No falla el build ni salta en consola: se descubre escribiendo.** Por eso el
estilo del rótulo va en el `<span>`.

### 5.5 `<img>` y `<a>` son arrastrables por defecto

En una lista con reordenamiento por arrastre, el arrastre nativo del navegador
compite con el de la lista. Es la razón por la que `useDragSort` migró de la API
HTML5 a Pointer Events.

### 5.6 Los selectores por subcadena de atributo en `mobile.css`

[`mobile.css`](./src/styles/mobile.css) tiene reglas como:

```css
.sitio-publico [style*="background: var(--off)"] .section-label
.sitio-publico [style*="grid-template-columns: repeat(2"]
.sitio-publico [class*="px-8"]
```

Dependen del **texto exacto** de un atributo. Cambiar `background: var(--off)`
por `backgroundColor: 'var(--off)'`, o reordenar las propiedades de un
`style={{}}`, **rompe la regla en silencio** — sin error de build y sin aviso en
consola.

Si tocas el `style` inline de una sección pública, comprueba `mobile.css`.

### 5.7 `overflow-x: hidden` rompe `position: sticky`

`overflow-x: hidden` convierte al elemento en contenedor de scroll, y con `html`
**y** `body` en `hidden` a la vez cualquier `sticky` del sitio deja de pegarse:
su contenedor de scroll pasa a ser ese ancestro en vez del viewport. Rompía el
header del admin.

La solución es `clip`, que recorta igual sin crear el contenedor. Van **las dos
juntas y simétricas**: dejar una sola sería un arreglo por accidente.

---

## Correcciones a `SINCRONIA.md` registradas acá

| dónde | decía | es |
|---|---|---|
| línea 4678 | «Los modales: son CINCO» | son **seis**, más el hook |
| — | la convención «radio 1-2px» | **no estaba escrita en ninguna parte**. Las 9 menciones de «radio» en `SINCRONIA.md` son casi todas del componente `RadioGroup`, y la única de `globals.css` era «mismo peso, mismo radio, mismo padding» describiendo que `.btn-inverse` iguala a `.btn-primary`. Era convención oral hasta la escala de 1.3 |
