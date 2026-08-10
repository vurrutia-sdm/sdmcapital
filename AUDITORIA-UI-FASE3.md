# Auditoría UI/UX — Fase 3

Contraste de lo que hay hoy contra las reglas de la skill `ui-ux-pro-max`
(prioridades 1–10) y contra las decisiones que el propio proyecto ya cerró en
[`SISTEMA-DISENO.md`](./SISTEMA-DISENO.md).

**No se tocó ningún archivo de código.** Todos los ratios de este documento están
calculados sobre los valores reales del código (fórmula WCAG 2.1 de luminancia
relativa), no estimados. Fecha: **2026-08-10**. Commit auditado: `06adb41`.

La identidad visual no se discute: no hay propuestas de paleta, tipografía ni
rebranding. Todo arreglo propuesto usa tokens que ya existen.

---

## Resumen ejecutivo

El sistema de tokens está en muy buen estado —contraste medido, `prefers-reduced-motion`
correcto, foco global, áreas táctiles de 44px, `role="dialog"` en los seis modales— y las
fases anteriores cerraron los ejes grandes. Lo que queda son **fugas en los bordes del
sistema**: superficies nuevas que no pasaron por la revisión (la barra de indicadores, la
página de confirmación de pago), estados que solo fallan sobre fotografía, y el
`SearchBar`, que es la herramienta principal del home y quedó fuera de tres reglas que el
resto del sitio sí cumple.

Quedan **2 hallazgos críticos**. El tercero —C1, el desfase del header, que escondía 27px
de contenido en todas las páginas desde 768px— **ya está resuelto**, igual que **todo el
eje de contraste**: doce pares corregidos en tres tandas, la última cerrada con un
barrido bidireccional de la regla 4.2 sobre las nueve rutas públicas.

| Severidad | Cantidad | Naturaleza |
|---|---|---|
| Crítico | 2 (de 3) | rompen contenido o dejan al teclado sin salida, en todas las páginas |
| Alto | **1 abierto** (de 11) | incumplen WCAG AA en superficies públicas |
| Medio | 11 | inconsistencia interna, valores fuera de escala, roce de usabilidad |
| Bajo | 5 | deuda cosmética y de mantenimiento |

### Estado

| # | Hallazgo | Estado |
|---|---|---|
| C1 | Desfase del header | ✅ **Resuelto** el 2026-08-10 |
| C2 | Botón «volver arriba» enfocable e invisible | pendiente |
| C3 | Escape en los desplegables del buscador | pendiente |
| A1 | Kicker del hero a 2,13:1 | ✅ **Resuelto** — tanda 1 |
| A2 | Fecha del artículo a 2,67:1 | ✅ **Resuelto** — tanda 1 |
| A3 | Rótulos de Rental a 3,68:1 | ✅ **Resuelto** — tanda 1 |
| A4 | Puntos del carrusel sin nombre accesible | pendiente |
| A5 | `aria-haspopup="listbox"` sin listbox | pendiente |
| A6 | Bordes del buscador con `--border` | ✅ **Resuelto** — tanda 1 |
| A7 | Emoji en la confirmación de pago | pendiente |
| A8 | `<select>` móviles a 13px (zoom iOS) | pendiente |
| A9 | `scrollIntoView` a `#contacto` sin offset | pendiente — **descubierto** al resolver C1 |
| A10 | Los cuatro pares del barrido de contraste | ✅ **Resuelto** — tanda 2 |
| A11 | Barrido bidireccional de la regla 4.2 | ✅ **Resuelto** — tanda 3 |
| M12 | Dos usos de color fuera de norma en admin | pendiente — **descubierto** en las tandas 2 y 3 |

> **El eje de contraste queda cerrado en el sitio público — verificado con un barrido
> bidireccional de la regla 4.2.** Doce pares corregidos en tres tandas. La afirmación se
> apoya en A11, que es el único barrido que miró las **dos** caras de la regla: los 47
> usos de `--green` y `--green-dark` de las nueve rutas públicas, medidos en el navegador
> contra su fondo efectivo y con el umbral que les toca por tamaño. Cero infracciones.
>
> Las dos tandas anteriores **no** bastaban para decirlo, y de hecho lo dije antes de
> tiempo: ver A11.
>
> En admin quedan dos, anotados en M12.

---

## CRÍTICO

### C1 · El header mide 91px desde 768px, pero el contenido se desplaza 64 — ✅ RESUELTO

> **Resuelto el 2026-08-10.** Token `--sdm-header: 65px` + `--sdm-barra: 0→26px` en
> `globals.css`, y las cuatro referencias escritas a mano migradas. Verificado en
> navegador a 375, 767, 768, 1024 y 1440px: **0px ocultos en los cinco**. El detalle
> está al final de esta sección.

**Dónde:** [`src/components/layout/Layout.tsx:10`](./src/components/layout/Layout.tsx#L10)
· [`src/components/layout/Header.tsx:69-70`](./src/components/layout/Header.tsx#L69)
· [`src/components/sections/HeroSection.tsx:246`](./src/components/sections/HeroSection.tsx#L246)

**Qué está mal.** `<header>` es `fixed top-0` y tiene dos hijos: el `<nav>` de `h-16`
(64px) y `BarraIndicadores`, que es `hidden md:flex` con `height: 26`. Desde 768px el
header ocupa **64 + 26 + 1px de borde = 91px**. Pero el desplazamiento del contenido
sigue calculado para el header de una sola fila:

```
Layout.tsx:10        <main className="flex-1 pt-16">        →  64px
HeroSection.tsx:246  height: calc(100vh - 64px)             →  64px
header real (≥768)   64 + 26 + 1                            →  91px
                                                    déficit →  27px
```

Los primeros **27px de cada página** quedan debajo del header en todos los anchos ≥768px.

**Por qué importa.** Afecta a las 17 rutas públicas a la vez, en tablet y en escritorio
—o sea la mayoría del tráfico de escritorio—. En el home se come la mitad del relleno
superior del hero; en las páginas con banda `--navy-dark` arriba (Servicios, Rental,
Quiénes Somos, artículo de blog) recorta el borde superior de la banda; y el `<h1>` de
varias queda pegado al borde del header.

Es una regresión de `2d380e5`. El mensaje de ese commit razona: *«DENTRO DEL HEADER, NO
ENCIMA. Una barra por encima obligaría a recalcular el desplazamiento del contenido en
todas las rutas»*. El razonamiento se quedó a medio camino: meterla **dentro** de un
elemento `fixed` sube su altura exactamente igual que ponerla encima. El recálculo hacía
falta de todos modos.

**El arreglo aplicado.** El alto del header pasa a ser un token:

```css
/* globals.css :root */
--sdm-header:       65px;   /* nav (64) + border-b del <header> (1) */
--sdm-barra:         0px;   /* barra de indicadores — 0 por debajo de 768 */
--sdm-header-total: calc(var(--sdm-header) + var(--sdm-barra));

@media (min-width: 768px) { :root { --sdm-barra: 26px; } }
```

**El borde de 1px va en `--sdm-header`, no en `--sdm-barra`.** El reparto que proponía
el borrador de esta auditoría —64 + 27— daba el total correcto a partir de 768, pero
dejaba 64 por debajo, y ahí el header mide **65**: el `border-b` es del `<header>` y
existe en los dos anchos. Con 65 + 26 cada token describe un elemento real y el total
sale exacto arriba y abajo.

Las cuatro referencias migradas:

| Archivo | Antes | Ahora |
|---|---|---|
| `Layout.tsx:10` | `className="flex-1 pt-16"` | `style={{ paddingTop: 'var(--sdm-header-total)' }}` |
| `HeroSection.tsx:246` | `calc(100vh - 64px)` | `calc(100vh - var(--sdm-header-total))` |
| `ServiciosPage.tsx:76` | `scrollMarginTop: 80` | `scrollMarginTop: 'var(--sdm-header-total)'` |
| `HomePage.tsx:400,403` | `matchMedia('(max-width: 768px)')` | `'(max-width: 767.98px)'` |

**Las dos últimas no estaban en el diagnóstico original**; salieron del barrido previo:

- **`ServiciosPage.tsx:76`** era un **cuarto** número calibrado a mano. El
  `scrollIntoView` de `ServiciosPage.tsx:33` alinea la sección con el borde del viewport,
  así que necesita compensar el header; con 80px contra un header de 91 la sección
  quedaba 11px tapada al entrar por `/servicios/<slug>`.
- **`HomePage.tsx:400,403`** cortaba en 768 exactos igual que `mobile.css`, y discrepaba
  con él: en 768 devolvía `true` —o sea 3 propiedades destacadas— mientras la hoja de
  estilos ya pintaba la grilla de **dos** columnas del tramo tablet. Tres tarjetas en dos
  columnas dejan una fila huérfana. Alineado a 767.98, en 768 son 6 en 2 columnas.

**Medición antes / después**, con `git stash` para capturar el estado previo:

| Ancho | header | `main` antes | ocultos | `main` ahora | ocultos |
|---|---|---|---|---|---|
| 375 | 65 | 64 | 1px | **65** | **0** |
| 767 | 65 | 64 | 1px | **65** | **0** |
| 768 | 91 | 64 | **27px** | **91** | **0** |
| 1024 | 91 | 64 | **27px** | **91** | **0** |
| 1440 | 91 | 64 | **27px** | **91** | **0** |

El salto 767→768 es limpio: header y relleno pasan de 65 a 91 a la vez, porque el token y
el `hidden md:flex` de la barra comparten el mismo corte de 768.

Verificado además: el borde superior de la banda `--navy-dark` cae exacto en el header en
los cinco anchos; el hero del home cumple `top + alto − innerHeight = 0` en los cinco; y
el anclaje de `/servicios/<slug>` aterriza a ±0,22px del borde del header (subpíxel del
desplazamiento suave).

> **`globals.css` y `Layout.tsx` pasan a ser zona compartida.** El alto del header vive
> ahora en un solo sitio, pero ese sitio alcanza a las 17 rutas públicas. Ver
> `SINCRONIA.md`.

---

### C2 · El botón «Volver al inicio» es enfocable mientras es invisible

**Dónde:** [`src/components/layout/FloatingButtons.tsx:27-33`](./src/components/layout/FloatingButtons.tsx#L27)

**Qué está mal.** El botón se oculta con `opacity-0 ... pointer-events-none`:

```tsx
className={`w-11 h-11 ... ${show ? 'opacity-100 translate-y-0'
                                 : 'opacity-0 translate-y-4 pointer-events-none'}`}
```

`pointer-events-none` desactiva el **ratón**. No saca al botón del orden de tabulación:
sigue siendo enfocable, sigue anunciándose como «Volver al inicio, botón», y sigue
activándose con Enter.

**Por qué importa.** Está en `Layout`, o sea en las 17 rutas públicas. Quien navega con
teclado llega a una parada de tabulación que no puede ver —el anillo de foco se dibuja
sobre un elemento con `opacity: 0`— y que no puede pulsar con el ratón. Es WCAG 2.4.7
(foco visible) y 2.4.3 (orden de foco significativo).

**El arreglo.** Que el estado oculto lo sea también para el teclado:

```tsx
<button
  onClick={scrollTop}
  aria-label="Volver al inicio"
  tabIndex={show ? 0 : -1}
  aria-hidden={!show}
  className={...}
>
```

---

### C3 · Los cuatro desplegables del buscador no se cierran con Escape

**Dónde:** [`src/components/sections/SearchBar.tsx:88-92`](./src/components/sections/SearchBar.tsx#L88)
y [`:152-156`](./src/components/sections/SearchBar.tsx#L152)

**Qué está mal.** `DropSelect` (Tipo, Precio) y `RegionComunaPicker` solo escuchan
`mousedown` fuera del componente:

```tsx
useEffect(() => {
  const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
  document.addEventListener('mousedown', fn)
  return () => document.removeEventListener('mousedown', fn)
}, [])
```

No hay manejador de `Escape`. Quien abre «Región o comuna...» con el teclado tiene 17
regiones —o hasta 52 comunas— por delante y **ninguna forma de cerrar el panel sin elegir
una**. Tabular hacia afuera tampoco lo cierra: el panel queda abierto tapando la fila de
filtros.

**Por qué importa.** El buscador es el elemento de conversión principal del home, y es
justo el patrón que `Header.tsx:90-100` ya resolvió, con este comentario:

> *«Escape cierra el desplegable que esté abierto. Sin esto, quien abre un menú con
> teclado no tiene forma de cerrarlo sin activar una de sus opciones.»*

El razonamiento está escrito en el proyecto; no llegó a este componente.

**El arreglo.** El mismo efecto del `Header`, en los dos componentes:

```tsx
useEffect(() => {
  if (!open) return
  const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
  window.addEventListener('keydown', alTeclear)
  return () => window.removeEventListener('keydown', alTeclear)
}, [open])
```

Conviene extraerlo a un hook —`useCerrarConEscape(open, setOpen)`— porque son cuatro
instancias y ya hay una quinta implementación en `Header`.

---

## ALTO

### A1 · El kicker del hero no se lee sobre foto clara — 2,13:1 — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 1).** `var(--green-dark)` → `var(--sky)`. Medido tras el
> cambio: **5,71 / 6,29 / 7,98 / 9,63** contra las cuatro luminancias de foto. El separador
> decorativo de `:280` se queda en `--green`.

**Dónde:** [`src/components/sections/HeroSection.tsx:279`](./src/components/sections/HeroSection.tsx#L279)

```tsx
<div className="... text-sdm-xs tracking-sdm-wide" style={{ ..., color: 'var(--green-dark)' }}>
  {/* «Inversión inmobiliaria · Chile & Paraguay» */}
```

**Qué está mal.** El kicker va arriba a la izquierda, donde el degradado
(`rgba(8,24,40,0.82)` al 0%, `HeroSection.tsx:254`) está en su punto más opaco. Pero
`--green-dark` es un verde **oscuro**, elegido para llevar blanco encima o para ir sobre
superficies claras. Sobre un fondo oscuro los dos son oscuros y el contraste se derrumba:

| color | foto blanca | foto clara | foto media | foto oscura |
|---|---|---|---|---|
| `--green-dark` #2D8055 | **2,13** ❌ | **2,35** ❌ | **2,98** ❌ | **3,59** ❌ |
| `--green` #3DAA6E | 3,53 ❌ | 3,89 ❌ | 4,94 ✅ | 5,96 ✅ |
| **`--sky` #A8C4DC** | **5,71** ✅ | **6,29** ✅ | **7,98** ✅ | **9,63** ✅ |

Falla en las cuatro condiciones, y a 11px en versalitas, que es el tamaño más exigente
del sitio.

**Por qué importa.** Es la primera línea de texto de la página principal. Las cinco fotos
del carrusel las carga el admin, así que el fondo real no es controlable: hoy son
exteriores con cielo, o sea la columna «foto clara».

Este caso es el reverso exacto de la decisión 4.2 del sistema de diseño. Esa regla dice
«`--green` solo sobre oscuro, `--green-dark` en cualquier otro caso», y el barrido del
2026-08-09 corrigió 29 usos en esa dirección. Acá el fondo **es** oscuro, así que
`--green-dark` es precisamente el que no corresponde — pero `--green` tampoco alcanza,
porque el degradado se aclara hacia la derecha y la foto manda.

**El arreglo.** `--sky`, que cumple en las cuatro condiciones con margen y ya es el
acento del hero: el `<em>` del `<h1>` (`HeroSection.tsx:299`) lo usa. El separador
decorativo de al lado (`:280`, `background: var(--green)`) se queda: es decoración y
1.4.11 no le aplica.

```tsx
style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--sky)' }}
```

> Añadir esta condición —«sobre fotografía no vale ninguno de los dos verdes»— como
> corolario de 4.2 en `SISTEMA-DISENO.md`. La regla actual, leída al pie de la letra,
> lleva al valor equivocado en este caso.

---

### A2 · La fecha del artículo de blog está a 2,67:1 — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 1).** Alfa 0.30 → 0.55. Medido: **5,68:1**. La cabecera
> queda entera por encima de AA: categoría 5,37 · fecha 5,68 · autor 5,68.

**Dónde:** [`src/pages/BlogPostPage.tsx:110`](./src/pages/BlogPostPage.tsx#L110)

```tsx
<span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{fecha}</span>
```

Sobre `--navy-dark` (`:107`) da **2,67:1**, contra los 4,5:1 que pide AA. Es el peor par
de texto plano del sitio. A su lado, la categoría en `--green` da 5,37:1 y el autor en
blanco 0.55 da 5,68:1: la fecha es la única de las tres que falla, y es un dato editorial
real, no decoración.

**El arreglo.** Subir a `rgba(255,255,255,0.55)` (**5,68:1**), que es la opacidad que ya
usan el autor tres líneas más abajo (`:125`) y otros seis subtítulos sobre `--navy-dark`
en el sitio. Cero valores nuevos.

---

### A3 · Los rótulos de la tarjeta destacada de Rental están a 3,68:1 — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 1).** Alfa 0.40 → 0.55. Medido: **5,68:1**, contra los
> 5,03 de la columna clara. La asimetría se invierte: ya no es la tarjeta destacada la
> menos legible.

**Dónde:** [`src/pages/RentalPage.tsx:137`](./src/pages/RentalPage.tsx#L137)

```tsx
color: c.destacado ? 'rgba(255,255,255,0.4)' : 'var(--muted)'
```

En la tarjeta «Recomendado» (fondo `--navy-dark`), los cuatro rótulos —Definición,
Duración, Gestión, Comisión— dan **3,68:1**. A 11px en versalitas.

Hay una asimetría de fondo: la columna clara usa `--muted`, que da 5,03:1, y la oscura
recibe un valor peor. La tarjeta *destacada* es la menos legible de las dos.

**El arreglo.** `rgba(255,255,255,0.55)` → **5,68:1**, igual que A2.

---

### A4 · Los puntos del carrusel del hero no tienen nombre accesible

**Dónde:** [`src/components/sections/HeroSection.tsx:164-179`](./src/components/sections/HeroSection.tsx#L164)

```tsx
{images.map((_, i) => (
  <button key={i} onClick={() => goTo(i)} style={{ width: ..., height: 8, ... }} />
))}
```

Cinco `<button>` sin texto, sin `aria-label` y sin `<title>`. El lector de pantalla
anuncia «botón» cinco veces seguidas. Es WCAG 4.1.2 (nombre, función, valor).

Llama la atención porque el botón de pausa de dos líneas más arriba (`:157`) **sí** lleva
`aria-label` y su comentario cita 2.2.2 explícitamente: la tanda de accesibilidad cubrió
el control de pausa y dejó fuera los puntos.

Segundo problema en el mismo bloque: el punto inactivo es `rgba(255,255,255,0.4)`
(`:172`) **sobre la fotografía**, sin overlay detrás —los puntos están en `zIndex: 10`,
por encima del degradado, que es `zIndex: 3`—. Sobre una foto clara el contraste es de
**1,00:1**: el punto desaparece. Es 1.4.11, que pide 3:1 para la parte visual que
identifica un control.

*(El tamaño de 8px sí está bien: con `gap: 18` el paso es de 26px y pasa 2.5.8 por la
excepción de separación. El comentario de `:148` documenta la medición.)*

**El arreglo.**

```tsx
<button
  key={i}
  onClick={() => goTo(i)}
  aria-label={`Ver la foto ${i + 1} de ${images.length}`}
  aria-current={i === current ? 'true' : undefined}
  style={{ ..., background: i === current ? 'var(--green)' : 'rgba(255,255,255,0.75)',
           boxShadow: '0 0 0 1px rgba(8,24,40,0.45)' }}
/>
```

El anillo de 1px en el navy del overlay es lo que garantiza el límite sobre cualquier
foto; subir la opacidad sola no basta contra un cielo blanco.

---

### A5 · `aria-haspopup="listbox"` promete un listbox que no existe

**Dónde:** [`src/components/sections/SearchBar.tsx:104`](./src/components/sections/SearchBar.tsx#L104)
y [`:199`](./src/components/sections/SearchBar.tsx#L199)

Los dos disparadores declaran `aria-haspopup="listbox"` y `aria-controls={panelId}`, pero
el panel al que apuntan es un `<div>` con `<button>` dentro. En todo el proyecto hay
**cero** `role="listbox"` y **cero** `role="option"` (verificado por grep).

**Por qué importa.** Un ARIA incorrecto es peor que ninguno. El lector anuncia «cuadro de
lista contraído»; al abrirlo el usuario espera navegar con flechas y oír «opción 3 de
17», y en cambio recibe una lista de botones sin posición ni conteo. Las teclas de flecha
no hacen nada.

**El arreglo.** Dos caminos, y el barato es correcto:

- **Recomendado — bajar la promesa.** Cambiar `aria-haspopup="listbox"` por
  `aria-haspopup="true"` y dejar los `<button>` como están. El patrón pasa a ser
  *disclosure*: `aria-expanded` + `aria-controls` ya lo describen bien, Tab recorre las
  opciones y Enter elige. Es exactamente el patrón que usa el `Header`.
- Implementar el listbox de verdad (`role="listbox"` en el panel, `role="option"` +
  `aria-selected` en cada opción, `aria-activedescendant`, flechas, Home/End) es
  reescribir los dos componentes. El propio archivo ya descartó un `radiogroup` en `Pill`
  (`:56-58`) por este mismo motivo.

---

### A6 · Los cuatro controles del buscador usan el borde decorativo — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 1).** `var(--border)` → `var(--border-input)` en las tres
> ramas inactivas (`:63`, `:110`, `:190`). Medido: **1,18 → 4,06:1**. El estado activo sigue
> en `--navy-dark`. Escritorio y móvil quedan por fin con el mismo token.

**Dónde:** [`SearchBar.tsx:63`](./src/components/sections/SearchBar.tsx#L63) (`Pill`)
· [`:110`](./src/components/sections/SearchBar.tsx#L110) (`DropSelect`)
· [`:190`](./src/components/sections/SearchBar.tsx#L190) (`RegionComunaPicker`)

Los tres, en estado no seleccionado, se delimitan con `var(--border)` (#e8edf2), que da
**1,18:1** sobre blanco.

La decisión 4.1 del sistema de diseño lo resuelve sin ambigüedad:

> *`--border` #e8edf2 (1,18:1) — separaciones **decorativas**. `--border-input` #767F8A
> (4,06:1) — límite de un **control**. 1.4.11 pide 3:1. Si dudas cuál usar: ¿el elemento
> se pulsa, se escribe o se selecciona? Entonces `--border-input`.*

Los tres son `<button>`. Los tres se pulsan.

Y la prueba de que es un descuido y no una decisión está en el mismo archivo: la versión
**móvil** de la misma píldora (`:374`) usa `border: '1px solid var(--border-input)'`, y
los cuatro `<label>` de los selects móviles (`:384`, `:393`, `:404`) también. El mismo
control tiene el borde correcto en móvil y el decorativo en escritorio.

**El arreglo.** `var(--border)` → `var(--border-input)` en las tres ramas inactivas. El
estado activo ya usa `--navy-dark` y no se toca.

---

### A7 · La confirmación de pago usa ✅ y ❌ como iconos de estado

**Dónde:** [`src/pages/ReservaConfirmacionPage.tsx:41`](./src/pages/ReservaConfirmacionPage.tsx#L41)
y [`:59`](./src/pages/ReservaConfirmacionPage.tsx#L59)

```tsx
<div className="text-5xl mb-4">✅</div>   {/* pago exitoso */}
<div className="text-5xl mb-4">❌</div>   {/* pago fallido */}
```

**Qué está mal.** Emoji como icono es un anti-patrón directo de la skill (prioridad 4:
*«SVG icons (no emoji)»*). Aquí suma tres problemas concretos:

1. **Se dibuja distinto en cada sistema.** El glifo lo pone la fuente de emoji del SO
   —Apple Color Emoji, Segoe UI Emoji, Noto—: cambia de forma, de verde y de tamaño según
   el dispositivo. A 48px es el elemento más grande de la pantalla.
2. **Está fuera de la paleta.** El verde de ✅ es el de Apple/Google, no `--green`.
3. **El lector de pantalla lee el nombre Unicode.** «Marca de verificación blanca» /
   «Cruz» en vez del estado. Y no llevan `aria-hidden`, así que se leen antes del `<h1>`
   que sí dice «¡Reserva confirmada!».

**Por qué importa.** Es la pantalla de confirmación de un pago con tarjeta. Es el momento
de máxima ansiedad de todo el sitio y el único donde el visitante entrega dinero: es
donde la señal visual tiene que ser inequívoca y de marca.

**El arreglo.** `lucide-react` ya es dependencia y el proyecto lo usa en todas partes:

```tsx
import { CheckCircle2, XCircle } from 'lucide-react'

<CheckCircle2 aria-hidden="true" size={48} className="mx-auto mb-4" style={{ color: 'var(--green-dark)' }} />
<XCircle      aria-hidden="true" size={48} className="mx-auto mb-4" style={{ color: 'var(--error)' }} />
```

---

### A8 · Los cinco `<select>` móviles del buscador provocan zoom en iOS

**Dónde:** [`SearchBar.tsx:386`](./src/components/sections/SearchBar.tsx#L386)
· [`:395`](./src/components/sections/SearchBar.tsx#L395) · [`:406`](./src/components/sections/SearchBar.tsx#L406)

```tsx
<select className="text-sdm-sm area-44" ...>
```

`text-sdm-sm` son 13px. **Safari en iOS hace zoom automático sobre cualquier control de
formulario con `font-size` menor a 16px**, y no vuelve al nivel anterior al cerrar el
selector: el usuario queda con la página ampliada y desplazada, y tiene que hacer pinch
para volver.

**Por qué importa.** Es el buscador de propiedades en el teléfono, la ruta principal del
tráfico móvil. Se dispara cinco veces seguidas si el usuario recorre Región → Comuna →
Tipo → Precio.

El proyecto ya conoce esta regla y la aplicó en el otro sitio: `.input-line`
(`globals.css:520`) declara `text-[16px]` explícitamente, contra la escala, y es el único
tamaño literal de esa clase.

**El arreglo.** Que los cinco `<select>` lleven 16px. Como el rótulo de arriba ya
identifica el campo, se puede mantener la densidad visual sin tocar el resto:

```tsx
<select className="area-44" style={{ ..., fontSize: '16px' }}>
```

La alternativa global —`maximum-scale=1` en el viewport— **no** debe usarse: desactiva el
zoom para todo el mundo y es el anti-patrón «Disable zoom» de la prioridad 5.

---

### A9 · Los cuatro `scrollIntoView` a `#contacto` no compensan el header

**Dónde:** [`Header.tsx:126`](./src/components/layout/Header.tsx#L126) (y `:129`)
· [`PropiedadDetailPage.tsx:741`](./src/pages/PropiedadDetailPage.tsx#L741)
· [`AsociadosPage.tsx:182`](./src/pages/AsociadosPage.tsx#L182)
· [`ServiciosPage.tsx:93`](./src/pages/ServiciosPage.tsx#L93)

> Descubierto en el barrido previo a C1. Es un defecto **distinto**: allá el desfase
> venía de un offset obsoleto, acá de que no hay offset ninguno.

```tsx
document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
```

**Qué está mal.** `scrollIntoView` con `block: 'start'` —el valor por defecto— alinea el
borde superior del elemento con el borde superior del **viewport**, no con el del
contenido visible. El header es `fixed`, así que se queda encima: los primeros 91px de la
sección de contacto quedan tapados al llegar. A diferencia de `ServiciosPage.tsx:76`,
aquí no hay `scroll-margin-top` que lo compense.

**Por qué importa.** Es el enlace «Contacto» del header, presente en las 17 rutas, más
tres CTA de conversión. Lo que queda tapado es el rótulo de sección y el arranque del
`<h2>` «Hablemos de tus metas»: el usuario aterriza en mitad del formulario sin ver de
qué es.

**El arreglo acordado.** Una sola regla, y no cuatro `scroll-margin-top` repartidos:

```css
/* globals.css */
html.sitio-publico { scroll-padding-top: var(--sdm-header-total); }
```

```tsx
// Layout.tsx — poner y quitar la clase en el <html>
useEffect(() => {
  document.documentElement.classList.add('sitio-publico')
  return () => document.documentElement.classList.remove('sitio-publico')
}, [])
```

`scroll-padding-top` va en el **contenedor de scroll**, que es `<html>`, no en el
elemento destino: por eso la clase sube ahí y no basta con la que ya lleva el `<div>` de
`Layout`. Cubre de una vez los cuatro `scrollIntoView`, cualquier `#ancla` futura y el
salto por URL con fragmento.

**Va acotada al sitio público a propósito.** El admin tiene su propio header con
`--admin-header-h: 80px` y es zona compartida (`SINCRONIA.md`); una regla global sobre
`html` le aplicaría los 91px del header público, que no es su medida. Con la clase, el
admin queda como está.

Al aplicarla, `ServiciosPage.tsx:76` **debe perder su `scrollMarginTop`**: `scroll-padding`
del contenedor y `scroll-margin` del destino **se suman**, y quedarían 182px de hueco.

---

### A10 · Los cuatro pares que el barrido de la tanda 1 destapó — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 2).** Ninguno estaba en el diagnóstico original: salieron
> de barrer los mismos valores problemáticos por el resto del proyecto después de aplicar
> la tanda 1.

| Dónde | Qué era | Antes | Ahora |
|---|---|---|---|
| `HeroSection.tsx:53` | `--green-dark` en el «+» de los contadores, sobre la misma foto que el kicker | 2,13–3,59 | **5,71–9,63** |
| `RentalPage.tsx:65` | borde blanco 0.30 del `<a>` «Busco arriendo» | 2,25–2,67 | **3,97–5,68** |
| `PropiedadesPage.tsx:257` | `<button>` × con borde `--border` | 1,18 | **4,06** |
| `PropiedadesPage.tsx:645` | chips de filtro con borde `--border` | 1,18 | **4,06** |

**`HeroSection.tsx:53` es el que importa**, porque demuestra que A1 estaba resuelto a
medias: el «+» de los tres contadores usaba el mismo `--green-dark` sobre la misma
fotografía, a diez líneas del kicker. A 28px cuenta como texto grande, así que su umbral
es 3:1 — y aun así fallaba en tres de las cuatro luminancias.

El valor vive una sola vez: `AnimatedStat` se instancia tres veces (propiedades, años,
países), así que los tres «+» no pueden separarse. Verificado en navegador: los tres y el
kicker computan `rgb(168, 196, 220)`.

**`RentalPage.tsx:65`** se midió contra el fondo real, que no es navy plano: es
`--navy-dark` con la foto del hero al 18 % encima. Ese compuesto es lo que baja el ratio
a 2,25 con una foto clara.

**Los dos de `PropiedadesPage`** son literalmente el caso de A6 repetido: `--border`
delimitando un `<button>`. El `hover:border-[var(--muted)]` de los chips **no** se tocó:
`--muted` (5,03:1) es más oscuro que `--border-input` (4,06:1), así que la progresión
reposo → hover sigue subiendo el contraste.

---

### A11 · Las dos caras de la regla 4.2, barridas por fin juntas — ✅ RESUELTO

> **Resuelto el 2026-08-10 (tanda 3).** Es el hallazgo que **corrige a esta propia
> auditoría**: tras la tanda 2 escribí que el eje de contraste quedaba cerrado en el sitio
> público. No lo estaba.

**Cómo apareció.** Midiendo en producción los rótulos de Rental para validar la tanda 2, el
selector capturó de paso el eyebrow «NUESTRAS COMISIONES» y computó `rgb(61,170,110)` sobre
blanco: **2,93:1**. Por casualidad, no por barrido.

**Por qué los dos barridos anteriores no lo vieron.** Los dos fueron **acotados a una sola
dirección de la regla**:

| Barrido | Qué buscó | Qué encontró | Qué dejó pasar |
|---|---|---|---|
| tanda 1 | `--green-dark` sobre fotografía | el kicker del hero | todo lo demás |
| tanda 2 | ídem, ampliado | el «+» de los contadores | `--green` sobre claro |
| **tanda 3** | **las dos caras, los dos tokens, todos los fondos** | los tres de abajo | — |

La decisión 4.2 tiene dos caras —«`--green` solo sobre oscuro» y «`--green-dark` en el
resto»— y además dos formas de manifestarse, como `color` y como `background` con texto
encima. El propio `SISTEMA-DISENO.md` avisa de esto: dice que 8 usos *«se encontraron ese
mismo día después de dar el eje por cerrado, porque el barrido anterior buscó `color:` y
estos eran `background:`»*. Volvió a pasar exactamente igual.

**Lo que encontró el barrido completo.** Tres infracciones públicas, todas corregidas:

| Dónde | Qué era | Antes | Ahora |
|---|---|---|---|
| `RentalPage.tsx:104` | `--green` como texto sobre blanco (11px) | 2,93 | **4,85** |
| `SolicitudCreditoForm.tsx:103` | `--green` de **fondo** con texto blanco (13px) | 2,93 | **4,85** |
| `SolicitudCreditoForm.tsx:102` | `--border` como borde de un control | 1,18 | **4,06** |

Las dos de `SolicitudCreditoForm` estaban en el **mismo control**: el selector de opciones
del formulario de crédito, que se abre desde el Inicio, `/servicios` y
`/evaluacion-gratuita`. Una cara fallaba en el estado elegido y la otra en el no elegido.

**El método, que es lo que hace la afirmación defendible.** No fue grep: fue medir en el
navegador los 47 usos de los dos tokens en las nueve rutas públicas, cada uno con

- su **fondo efectivo**, subiendo por el árbol hasta el primer ancestro con fondo opaco —no
  el fondo declarado, que en la mitad de los casos es `transparent`—, y
- el **umbral que le toca por tamaño**: 3:1 desde 24px, o desde 18,66px en negrita; 4,5:1
  en el resto.

Ese segundo punto evitó un falso positivo que ya había dado por bueno: los seis números de
«Nuestro proceso» en `/vende-con-nosotros` son `--green-dark` sobre `--navy-dark` a
**3,24:1**, y con el umbral plano de 4,5 los conté como infracción. Van a 40px, así que su
umbral es 3:1 y **cumplen**. Estuve a punto de «arreglar» seis valores correctos.

**Resultado del barrido, ya con los tres arreglos aplicados:**

```
  /                     12 usos   OK        /asociados             4 usos   OK
  /rental                6 usos   OK        /blog                  6 usos   OK
  /quienes-somos         7 usos   OK        /propiedades           1 uso    OK
  /servicios             0 usos   OK        /evaluacion-gratuita   0 usos   OK
  /vende-con-nosotros   11 usos   OK
```

**La lección, anotada también en `proyecto_sdm_maestro.md`:** un barrido acotado a una
dirección de una regla deja pasar la contraria, y como *encuentra* cosas, se siente
completo. Si la regla tiene dos caras, el barrido tiene que tener dos.

---

## MEDIO

### M1 · Las dos media queries de `mobile.css` se solapan en 768px exactos — ✅ RESUELTO

**Dónde:** [`src/styles/mobile.css:15`](./src/styles/mobile.css#L15) y [`:152`](./src/styles/mobile.css#L152)

```css
@media (max-width: 768px)                          { ... }   /* 21 reglas */
@media (min-width: 768px) and (max-width: 1024px)  { ... }
```

En **exactamente 768px** las dos coinciden. Ahí el sitio recibe a la vez el centrado del
pie móvil, el `padding: 16px` forzado, el grid de propiedades a 1 columna (`:46-49`) y el
de tablet a 2 columnas (`:158-160`). Gana el último por orden de cascada, pero el
resultado es accidental, no diseñado — y 768px es exactamente el ancho de un iPad en
vertical.

**El arreglo.** `@media (max-width: 767.98px)` en el primer bloque. Es la convención de
Bootstrap y evita el hueco de los anchos fraccionarios de los dispositivos con densidad
no entera.

> **Resuelto el 2026-08-10**, junto con C1: el token `--sdm-barra` abre en
> `min-width: 768px`, así que dejar el otro bloque en `max-width: 768px` habría añadido
> un tercer solape en el mismo ancho. Se alineó también
> `HomePage.tsx:400,403` (`matchMedia`), que cortaba igual en 768 — ver C1.
>
> **Queda un solape análogo sin tocar:** el bloque de tablet cierra en
> `max-width: 1024px` y la utilidad `lg:` abre en `min-width: 1024px`. En 1024 exactos
> —iPad en horizontal— conviven la grilla de 2 columnas del tramo tablet (que gana por
> `!important`) y las 3 de `lg:grid-cols-3`. Mismo defecto, un breakpoint más arriba.

---

### M2 · El rango 768–1023px no tiene diseño propio

**Cobertura de breakpoints medida sobre los `.tsx`:**

| prefijo | ancho | usos |
|---|---|---|
| `sm:` (640px) | 640 | **5** |
| `md:` (768px) | 768 | 60 |
| `lg:` (1024px) | 1024 | **279** |
| `xl:` (1280px) | 1280 | 35 |

El 74% de las decisiones responsive cuelgan de `lg:`. Entre 768 y 1023px el sitio muestra
la disposición **móvil** de casi todo —incluido el menú de hamburguesa, porque la
navegación de escritorio es `hidden lg:flex` (`Header.tsx:162`)— sobre un lienzo de casi
1000px. `mobile.css:152` parchea exactamente una regla de ese rango (el grid de
propiedades) con un `!important`, lo que confirma que el hueco ya se detectó una vez y se
tapó puntualmente.

**Por qué importa.** iPad vertical (768) y horizontal (1024) caen justo en los dos bordes.
En el catálogo de propiedades —la página que más importa— el visitante de tablet ve el
menú de teléfono y dos columnas de tarjetas muy anchas.

**El arreglo.** No es una corrección suelta sino una tanda: revisar en 768 y 1024 las
cuatro plantillas públicas (home, catálogo, ficha, página de contenido) y decidir si la
navegación de escritorio baja a `md:` y si las rejillas necesitan un paso intermedio.
Conviene medirlo antes de decidir, igual que se hizo con la migración a Tailwind (4.8).

---

### M3 · Dos rojos de error y dos verdes de éxito conviven fuera del sistema

**Dónde:** [`admin/Contenido.tsx:456`](./src/pages/admin/Contenido.tsx#L456), [`:556`](./src/pages/admin/Contenido.tsx#L556)
· [`admin/FichaClienteEditar.tsx:398`](./src/pages/admin/FichaClienteEditar.tsx#L398)
· [`admin/FichaClienteNueva.tsx:311`](./src/pages/admin/FichaClienteNueva.tsx#L311)
· [`admin/Propiedades.tsx:1202`](./src/pages/admin/Propiedades.tsx#L1202)

| valor | uso | ratio | veredicto |
|---|---|---|---|
| `#16a34a` | texto «activo» sobre blanco | **3,30** | ❌ AA |
| `#dc2626` | texto de error sobre `#fff3f3` | **4,45** | ❌ AA (por poco) |
| `#86efac` | borde de la insignia «activa» | **1,40** | ❌ 1.4.11 |
| `#fca5a5` | borde de la insignia «inactiva» | **1,90** | ❌ 1.4.11 |
| `--error` #A8384B | el token del sistema | 6,30 | ✅ |

Son colores de la paleta por defecto de Tailwind (`green-600`, `red-600`, `green-300`,
`red-300`) escritos a mano. El sistema ya tiene `--error` con su ratio medido, y la nota
de `globals.css:110-121` advierte específicamente que un segundo rojo vuelve a abrir el
problema de distinguibilidad contra `--estado-vendida` bajo daltonismo.

**El arreglo.** `#dc2626` → `var(--error)`. Para el par éxito/fallo de las insignias, el
proyecto ya tiene la solución correcta a la vista: `admin/Agentes.tsx:191` y
`admin/FichaClientesLista.tsx:187` usan `#1a6e3c` sobre `#f0faf4`, que da **5,89:1** y
cumple. Unificar los cinco sitios en ese par, y tokenizarlo si va a repetirse.

---

### M4 · Tres variantes de navy y dos de verde escritas a mano

```
#1C3D5C  ← el token --navy
#1a3d5c  ← 8 usos. Distinto: 0x1a ≠ 0x1c
#1a3c5e  ← 4 usos, ReservaConfirmacionPage
#1C2B3A  ← 3 usos, SolicitudCreditoModal + EvaluacionGratuitaPage
#0d2035  ← 5 usos (variante de --navy-dark #0F2535)

#3DAA6E  ← el token --green
#4CAF82  ← 3 usos. Sobre blanco da 2,71:1 (ElBarrancoBanner:56, :87)
#5C9B7E  ← 3 usos. Sobre #1C2B3A da 4,43:1 — falla por 0,07 (SolicitudCreditoModal:121)
```

Ninguna diferencia es perceptible; todas son ruido de mantenimiento. Las dos últimas
además incumplen AA.

`#4CAF82` es el verde de El Barranco, que es una marca aparte con su propia paleta
(`ElBarrancoShowcase.tsx:14`) — ahí es legítimo, pero `ElBarrancoBanner` lo pinta **sobre
blanco** dentro del sitio SDM, y ahí da 2,71:1.

**El arreglo.** Los de navy y `#5C9B7E` a los tokens equivalentes. Para
`ElBarrancoBanner`, usar el verde de El Barranco solo sobre su propio fondo oscuro, que
es donde rinde (5,81:1 sobre `--navy-dark`).

---

### M5 · `#e8edf2` escrito a mano 62 veces en 20 archivos

`--border` existe desde el principio y su valor es exactamente ese. Aun así aparece
literal en `Header.tsx` (6), `PropiedadDetailPage.tsx` (9), `RentalPage.tsx` (4),
`QuienesSomosPage.tsx` (4), `AsociadosPage.tsx` (3) y quince archivos más.

No hay error visual —el valor coincide— pero es la condición exacta que produjo la
divergencia de `muted` (#7a8a96 vs #5F7183) que documenta `tailwind.config.js`. El
principio del sistema es «el valor vive en un sitio».

**El arreglo.** Sustitución mecánica `border-[#e8edf2]` → `border-[var(--border)]` y
`'1px solid #e8edf2'` → `'1px solid var(--border)'`. Es buscar y reemplazar sin cambio
visual: se puede verificar con una captura antes/después.

> Cuidado con `mobile.css`: la trampa 5.6 avisa de que hay selectores por subcadena de
> atributo. Ninguno de los tres mira `#e8edf2`, así que este reemplazo es seguro —pero
> conviene comprobarlo antes de correrlo.

---

### M6 · `ReservaConfirmacionPage` está enteramente fuera del sistema

**Dónde:** [`src/pages/ReservaConfirmacionPage.tsx:32-66`](./src/pages/ReservaConfirmacionPage.tsx#L32)

Además de los emoji (A7), en 35 líneas la página usa:

| lo que hay | lo que dice el sistema |
|---|---|
| `rounded-2xl` (16px), `rounded-lg` (8px) | escala de 3 radios: 2 / 4 / 8px por tipo de elemento (1.4) |
| `shadow-lg` | «bordes finos en vez de sombras» (principio 3) |
| `bg-[#1a3c5e]`, `text-[#1a3c5e]` | `--navy` |
| `text-red-600` | `--error` |
| `<button className="w-full bg-... py-3 rounded-lg font-semibold">` | `.btn-primary` |
| `text-2xl font-bold` | escala `text-sdm-*` + `font-sdm-*`; el sistema no usa `bold` en títulos |

**Por qué importa.** Es una página pública, y es la última que ve un cliente que acaba de
pagar. Se lee como si perteneciera a otro sitio.

**El arreglo.** Reescribir las 35 líneas con `.btn-primary`, `rounded-sdm-contenedor`,
los tokens de color y los iconos de A7. Es la corrección de mejor relación
esfuerzo/resultado de toda la auditoría después de los críticos.

---

### M7 · Diez imágenes públicas sin `loading="lazy"`

**Dónde:** [`BlogPreviewSection.tsx:65`](./src/components/sections/BlogPreviewSection.tsx#L65), [`:89`](./src/components/sections/BlogPreviewSection.tsx#L89)
· [`ServiciosPage.tsx:101`](./src/pages/ServiciosPage.tsx#L101)
· [`QuienesSomosPage.tsx:121`](./src/pages/QuienesSomosPage.tsx#L121)
· [`AsociadosPage.tsx:144`](./src/pages/AsociadosPage.tsx#L144)
· [`BlogPostPage.tsx:134`](./src/pages/BlogPostPage.tsx#L134)
· `ElBarrancoShowcase.tsx:356, 584, 597, 605`

El patrón está bien establecido —`PropertyCard.tsx:97` lleva `loading="lazy"` y
`decoding="async"`, y catorce imágenes más también— pero estas diez quedaron fuera. Todas
están bajo el pliegue.

*(Los héroes de `RentalPage:56` y `VendeConNosotrosPage:92` **deben** seguir sin `lazy`:
son LCP y diferirlos empeoraría la métrica. Correcto como está.)*

**El arreglo.** `loading="lazy" decoding="async"` en las diez.

---

### M8 · El foco no vuelve al disparador al cerrar un desplegable del buscador

**Dónde:** [`SearchBar.tsx:120`](./src/components/sections/SearchBar.tsx#L120), [`:238`](./src/components/sections/SearchBar.tsx#L238), [`:249`](./src/components/sections/SearchBar.tsx#L249)

Al elegir una opción, el panel se desmonta con el foco dentro. El foco cae al `<body>` y
el siguiente Tab reinicia el recorrido desde el principio del documento. Es WCAG 2.4.3.

**El arreglo.** Guardar una `ref` al `<button>` disparador y llamar a `.focus()` en el
mismo manejador que hace `setOpen(false)`. Va junto con C3, que necesita la misma ref.

---

### M9 · El menú móvil no atrapa el foco ni marca la ruta activa

**Dónde:** [`Header.tsx:246-297`](./src/components/layout/Header.tsx#L246)

Dos cosas, las dos solo en móvil:

1. **Sin foco atrapado.** Con el menú abierto, Tab sigue recorriendo la página que hay
   detrás, que está visible y es pulsable. Los seis modales del sitio sí lo resuelven
   (`useDialogoModal` + `useBloquearScroll`); el menú de navegación no pasa por ahí.
2. **Sin estado activo.** Los catorce enlaces van todos en `--muted`, mientras que la
   navegación de escritorio distingue la ruta actual con `--navy-dark` vía
   `navLinkClass(isActive(...))` (`:141-142`). En el teléfono no hay forma de saber en qué
   página estás.

**El arreglo.** Para (2), aplicar `navLinkClass(isActive(l.to))` a los enlaces del bloque
móvil: la función ya existe y no hace falta nada más. Para (1), `useBloquearScroll` ya
está escrito y probado.

---

### M10 · Estados deshabilitados atenuados dos veces en el buscador

**Dónde:** [`SearchBar.tsx:229`](./src/components/sections/SearchBar.tsx#L229) (pestaña «Comuna»)
y [`:393-396`](./src/components/sections/SearchBar.tsx#L393) (select de comuna)

La pestaña «Comuna» deshabilitada lleva `color: 'var(--border)'` (1,18:1) **y**
`opacity: 0.5` encima → ~1,09:1. El select de comuna lleva `opacity: 0.5` en el `<label>`
**y** otro `opacity: 0.5` en el `<select>` → 0,25 efectivo.

WCAG exime del contraste a los controles deshabilitados, así que no es una infracción.
Pero el sistema fijó una sola regla —`opacity: 0.5`, elegida como punto medio de las tres
que convivían (`globals.css:497-501`)— y estos dos la aplican dos veces sobre un color que
ya era el más claro de la paleta. El resultado es un control que parece ausente en vez de
deshabilitado.

**El arreglo.** Una sola atenuación por control: quitar el `opacity` duplicado del
`<select>` y dejar `var(--muted)` en vez de `var(--border)` en la pestaña.

---

### M11 · La fila de lead de Captación no se abre con el teclado

**Dónde:** [`src/pages/admin/Captacion.tsx:1051`](./src/pages/admin/Captacion.tsx#L1051)

```tsx
<div onClick={onToggle} style={{ display: 'flex', ..., cursor: 'pointer' }}>
```

Es la cabecera de acordeón de cada lead: pulsarla despliega el detalle. Tiene
`cursor: pointer`, pero es un `<div>` sin `role="button"`, sin `tabIndex` y sin
`onKeyDown`. No recibe foco, no responde a Enter ni a Espacio, y no se anuncia como
control. Quien use el panel con teclado **no puede abrir ningún lead**: los únicos
elementos alcanzables de la fila son los botones «Editar» y «Eliminar» que van dentro.

Es admin —público interno— y por eso queda en Medio y no en Alto, pero es la vía principal
del panel de Captación.

**El arreglo.** No puede envolverse en un `<button>`, porque contiene los dos botones de
acción y un botón dentro de otro es marcado inválido — es la misma restricción que
`globals.css:547-554` describe para `.enlace-tarjeta`. Lo que corresponde es promover el
`<div>` a control:

```tsx
<div
  role="button"
  tabIndex={0}
  aria-expanded={abierto}
  onClick={onToggle}
  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
  style={{ ... }}
>
```

`e.preventDefault()` en Espacio no sobra: sin él la página se desplaza además de abrir el
lead.

---

### M12 · Los dos usos de color fuera de norma que quedan, los dos en admin

**Dónde:** [`src/pages/admin/Propiedades.tsx:1202`](./src/pages/admin/Propiedades.tsx#L1202)
· [`src/pages/admin/Equipo.tsx:116`](./src/pages/admin/Equipo.tsx#L116)

> Descubiertos en los barridos de las tandas 2 y 3. Es todo lo que queda del eje de
> contraste, y los dos son admin.

#### `admin/Equipo.tsx:116` — `--green` como texto sobre blanco

```tsx
<div className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--green)' }}>{m.cargo}</div>
```

**2,93:1.** Es el gemelo exacto de `RentalPage.tsx:104`, que se corrigió en la tanda 3: el
cargo de cada miembro del equipo, en `--green` sobre la tarjeta blanca del panel. El
arreglo es idéntico —`--green-dark`, 4,85:1— y no se aplicó solo porque esta tanda estaba
acotada al sitio público.

Con éste, los cuatro usos de `--green` como color de texto del proyecto quedan
clasificados: dos correctos sobre `--navy-dark` (5,37:1) y dos sobre blanco, de los cuales
uno ya está corregido y éste no.

#### `admin/Propiedades.tsx:1202` — la insignia de estado

```tsx
style={{ background: p.activo === false ? '#fff3f3' : '#f0faf4',
         border: `1px solid ${p.activo === false ? '#fca5a5' : '#86efac'}`, ... }}
```

**Qué está mal.** Es la píldora «Activa / Pausada» de cada fila del listado, y es un
control: se pulsa para alternar el estado. Su borde es lo que la delimita contra el fondo
blanco de la tabla, así que cae en 1.4.11 (3:1):

| valor | rol | sobre blanco |
|---|---|---|
| `#fca5a5` | borde de «Pausada» | **1,90** ❌ |
| `#86efac` | borde de «Activa» | **1,40** ❌ |

**Por qué se queda pendiente.** Los dos son de la paleta por defecto de Tailwind
(`red-300`, `green-300`) y arrastran el mismo problema que M3: son colores fuera del
sistema. Arreglarlos sueltos —subiéndolos hasta cumplir 3:1— dejaría dos literales más
que igual habría que migrar después. Corresponde hacerlo junto con M3, en una tanda de
admin que unifique de una vez los verdes y los rojos de las insignias en los tokens que
ya existen (`--error` y el `#1a6e3c` sobre `#f0faf4` que ya usan `Agentes` y
`FichaClientesLista`, 5,89:1).

Es admin —público interno, no indexable— y por eso queda en Medio y no en Alto.

---

## BAJO

### B1 · Emoji como icono en el panel de Captación

[`admin/Captacion.tsx:531`](./src/pages/admin/Captacion.tsx#L531) (`🎤 Nota de voz`),
[`:641`](./src/pages/admin/Captacion.tsx#L641) y [`:677`](./src/pages/admin/Captacion.tsx#L677)
(`✋` / `🤖` para el modo manual/Sofía).

Mismo anti-patrón que A7, con dos atenuantes: es admin —público interno, dispositivos
conocidos— y en `:641` el emoji comunica un estado que el texto de al lado ya dice. Baja
prioridad, pero `lucide-react` tiene `Mic`, `Hand` y `Bot`.

*(`admin/Propiedades.tsx:1192` usa `🌐`/`🇨🇱` **con** `aria-hidden="true"` y un `.sr-only`
al lado: la accesibilidad está resuelta. Queda el detalle de que la bandera de Chile no
se dibuja en Windows, donde se ve «CL».)*

### B2 · Caracteres tipográficos como iconos de éxito

[`ContactSection.tsx:60`](./src/components/sections/ContactSection.tsx#L60) y
[`VendeConNosotrosPage.tsx:164`](./src/pages/VendeConNosotrosPage.tsx#L164) usan `✓` como
confirmación de envío. No es emoji a color y hereda el color del texto, así que el daño es
mucho menor que en A7 — pero es un glifo de la fuente de texto haciendo de icono. `Check`
de `lucide-react` es consistente con el resto del sitio.

### B3 · Cinco duraciones de transición fuera de la escala

Medido sobre los `style` inline: 25 × `0.2s`, 24 × `0.15s`, y luego 5 × `0.5s`,
3 × `0.1s`, 2 × `0.3s`, 2 × `0.18s`, 1 × `0.4s`, 1 × `0.6s`.

Los tres tokens (`--sdm-mov-rapido/normal/lento`) cubren la mayoría. La cola de 0.1 / 0.18
/ 0.3 / 0.4 / 0.6 la decisión 1.5 ya la declaró explícitamente fuera de migración: *«son
diferencias que nadie distingue»*. **Ninguna** de las duraciones interactivas se sale del
rango 150–300ms que pide la skill (las de 0.5s y 0.6s son entradas del hero y del
showcase, no retroalimentación). Queda anotado, no es defecto.

### B4 · El sitio no tiene enlace de salto al contenido

`Layout.tsx` tiene `<main>`, y `Header` tiene `<nav>`, `<header>` y `<footer>`: los
landmarks están. Pero no hay «Saltar al contenido», y el header público expone 7 paradas
de tabulación en escritorio y 14 en móvil antes de la primera línea de contenido.

La skill lo marca como severidad **media** (§Accessibility, `skip-links`), y con landmarks
correctos un lector de pantalla puede saltar por regiones. El afectado real es quien navega
con teclado y sin lector. La clase `.sr-only` ya existe en `globals.css:569`, así que son
seis líneas en `Layout.tsx`:

```tsx
<a href="#contenido" className="sr-only focus:not-sr-only ...">Saltar al contenido</a>
...
<main id="contenido" className="flex-1" style={{ paddingTop: 'var(--sdm-header-total)' }}>
```

### B5 · `navLinkStyle(active)` recibe un parámetro que no usa

[`Header.tsx:133`](./src/components/layout/Header.tsx#L133). Desde que el color se movió a
`navLinkClass` (por la trampa 5.1), `navLinkStyle` ignora su argumento, pero las seis
llamadas siguen pasándolo. Sin efecto visual; invita a creer que el estilo depende del
estado activo cuando ya no.

---

## Tabla de quick wins

Arreglos de menos de 15 minutos, verificables de un vistazo. Ordenados por impacto.

| # | Archivo:línea | Cambio | Efecto | ⏱ |
|---|---|---|---|---|
| 1 | `FloatingButtons.tsx:27` | añadir `tabIndex={show ? 0 : -1}` y `aria-hidden={!show}` | quita una parada de foco invisible en 17 rutas | 2 min |
| ~~2~~ | ~~`HeroSection.tsx:279`~~ | ~~`var(--green-dark)` → `var(--sky)`~~ | ✅ **hecho** — tanda 1 | — |
| ~~3~~ | ~~`BlogPostPage.tsx:110`~~ | ~~`rgba(255,255,255,0.3)` → `0.55`~~ | ✅ **hecho** — tanda 1 | — |
| ~~4~~ | ~~`RentalPage.tsx:137`~~ | ~~`rgba(255,255,255,0.4)` → `0.55`~~ | ✅ **hecho** — tanda 1 | — |
| ~~5~~ | ~~`SearchBar.tsx:63,110,190`~~ | ~~`var(--border)` → `var(--border-input)`~~ | ✅ **hecho** — tanda 1 | — |
| 6 | `SearchBar.tsx:104,199` | `aria-haspopup="listbox"` → `"true"` | deja de prometer un widget que no existe | 2 min |
| 7 | `HeroSection.tsx:165` | `aria-label={\`Ver la foto ${i+1} de ${images.length}\`}` | 5 botones sin nombre → con nombre | 3 min |
| 8 | `ReservaConfirmacionPage.tsx:41,59` | `✅`/`❌` → `CheckCircle2`/`XCircle` de lucide | quita emoji de la pantalla de pago | 5 min |
| 9 | `SearchBar.tsx:386,395,406` | `fontSize: '16px'` en los 5 `<select>` | elimina el zoom de iOS en el buscador móvil | 5 min |
| ~~10~~ | ~~`mobile.css:15`~~ | ~~`max-width: 768px` → `767.98px`~~ | ✅ **hecho** el 2026-08-10, con C1 | — |
| 11 | `Header.tsx:252-295` | aplicar `navLinkClass(isActive(l.to))` a los enlaces móviles | marca la ruta activa en el teléfono | 5 min |
| 12 | 10 archivos (M7) | `loading="lazy" decoding="async"` | 10 imágenes menos en la carga inicial | 8 min |
| ~~13~~ | ~~`FichaClienteEditar.tsx:398`, `FichaClienteNueva.tsx:311`~~ | ~~`#dc2626` → `var(--error)`~~ | ✅ **hecho** — tanda 1 (5,81:1 sobre `#fff3f3`, no 6,30 que era contra blanco) | — |
| 14 | `Contenido.tsx:456,556` | `#16a34a` → `#1a6e3c` (el que ya usa Agentes) | 3,30:1 → 5,89:1. El `#dc2626` de esas mismas líneas ya pasó a `var(--error)` en la tanda 2 | 2 min |

**Quedan 8 arreglos, ~30 minutos.** De los 14 originales se cerraron seis: el #10 con C1,
y el #2, #3, #4, #5 y #13 en las dos tandas de contraste.

El eje de contraste del sitio público queda cerrado: nueve pares corregidos, todos
medidos contra el fondo real. Lo que sigue abierto son emojis, ARIA, foco y tokens.

Lo que **no** es quick win:

- ~~**C1 (desfase del header)**~~ — ✅ **hecho** el 2026-08-10. Tomó ~40 min con el
  barrido y la verificación en navegador, y acabó tocando seis archivos en vez de tres:
  el barrido encontró dos referencias más (ver C1).
- **C3 (Escape en el buscador)** — conviene extraer el hook `useCerrarConEscape` en vez de
  repetir el efecto cuatro veces. ~25 min con M8 incluido, que necesita las mismas refs.
- **A9 (`scrollIntoView` sin offset)** — la clase en `<html>` desde `Layout.tsx` más
  quitar el `scrollMarginTop` de `ServiciosPage.tsx:76`. ~15 min, pero hay que verificar
  los cuatro puntos de entrada y que el admin no se vea alcanzado.

---

## Lo que se revisó y está bien

Para que no se vuelva a auditar:

- **`prefers-reduced-motion`** — `globals.css:361`. Acorta en vez de eliminar, con
  `!important` que gana a los tokens. Verificado: ninguna animación del proyecto termina
  ocultando algo. `HeroSection:77-83` además nace pausado el carrusel.
- **Foco global** — `globals.css:318`. `--green-dark` con `outline-offset: 2px` cumple 3:1
  contra los cinco fondos del sistema. Ningún `outline: none` sin reemplazo en todo el
  proyecto (0 coincidencias).
- **`cursor: pointer`** — presente en todos los elementos pulsables revisados. Hay cuatro
  `<div onClick>` en el proyecto: tres son legítimos (`AdminPage.tsx:206`, overlay de
  cierre con `aria-hidden`; `admin/Propiedades.tsx:566`, `stopPropagation` de la caja de
  un modal; y un `<td>` que solo contiene `<button>` de verdad). El cuarto no lo es —
  ver M11.
- **Los cuatro estados de los cinco botones** — medidos y correctos (`SISTEMA-DISENO.md` 2.1).
- **`PropertyCard`** — `loading="lazy"`, `decoding="async"`, `aspectRatio: '4/3'` que
  reserva el espacio (CLS), `alt` con el título real, insignias con 4,85–7,22:1.
- **Puntos del carrusel, tamaño** — 8px con paso de 26px: pasan 2.5.8 por la excepción de
  separación. Medido en `HeroSection:148`.
- **Rótulos en versalitas** — decisión 4.5, cerrada. No es deuda.
- **Sombras y ausencia de escala de elevación** — decisión, no hueco (1.7).
- **Ausencia de tokens de espaciado** — hueco conocido y deliberado (1.6). No se reabre
  acá: 1.619 literales no se arreglan con tres tokens.
