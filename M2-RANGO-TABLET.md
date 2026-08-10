# M2 — El rango 768–1023 px

**Medición del 2026-08-10. No se cambió nada.** Todo lo de abajo está medido
sobre `sdmcapital.cl` en producción, con Chrome 151 headless emulando cada ancho
y leyendo el DOM ya pintado.

---

## Lo primero: el 74 % es cierto y es engañoso

El repo tiene **277 `lg:`** contra 59 `md:`, 34 `xl:` y 5 `sm:`. Eso es el 73,9 %
y confirma el diagnóstico de partida. Pero al separar por dominio:

| dónde | `lg:` |
|---|---|
| **Admin** (`pages/admin/`, `AdminPage`, `components/admin`, `cotizaciones`, `tarjetas`) | **212** |
| **Sitio público** | **65** |

**El 77 % de los `lg:` está en el admin**, que lo usa una sola persona en un
escritorio. El trabajo del sitio público no es de 277 sitios, es de 65. Y de esos
65:

| tipo | cuántos |
|---|---|
| afectan la **disposición** (`grid-cols`, `flex`, `hidden`, `order`, `grid`) | **19** |
| son **padding, gap o margen** | 44 (26 de ellos son el mismo `lg:px-12`) |

**El costo real del rango tablet son 19 decisiones en 11 archivos**, no 277.

---

## El método, y una advertencia sobre él

Se midieron cuatro plantillas a **768, 900, 1023, 1024 y 1280 px**. El 1024 y el
1280 no son el objeto del encargo: son el **control**. Sin ellos, «esta página
mide 4834 px de alto a 1023» no dice nada; con ellos se sabe que a 1024 mide
3195, y esa diferencia es exactamente el costo del rango.

Ninguna de las cuatro plantillas **desborda horizontalmente** en ningún ancho
medido. El problema no es que algo se salga: es espacio desperdiciado en unas y
contenido aplastado en otras.

---

## Hallazgo 1 · Las dos fallas son OPUESTAS, y una no estaba en el diagnóstico

El encargo describe el rango como «la disposición móvil de casi todo sobre un
lienzo de mil píxeles». Eso es exacto para tres de las cuatro plantillas. **Para
el catálogo es al revés**, y es la peor de las cuatro.

### Alto de página a 1023 contra 1024 — el costo del escalón que falta

| plantilla | 1023 px | 1024 px | diferencia |
|---|---|---|---|
| `/servicios` | 4834 | 3195 | **−1639 px · −34 %** |
| `/` (home) | 6480 | 5954 | −526 px · −8 % |
| ficha de propiedad | 4818 | 4683 | −135 px · −3 % |
| `/propiedades` (catálogo) | 14744 | 14834 | +90 px · **+0,6 %** |

`/servicios` es el caso extremo del diagnóstico: en el rango tablet es **un 51 %
más largo** de lo que necesita. Su rejilla `lg:grid-cols-2` mantiene una sola
columna hasta 1024, así que a 768 el texto ocupa la mitad izquierda y **la mitad
derecha queda en blanco**.

El catálogo casi no cambia, y por el motivo contrario.

---

## Hallazgo 2 · La rejilla del catálogo NO depende de `lg:`

`PropiedadesPage.tsx:688`:

```jsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, … }}>
```

Es un **`repeat(3, 1fr)` inline y fijo**, sin ningún prefijo responsive. Lo único
que lo mueve es `mobile.css`, que por debajo de 768 lo baja a una columna con un
selector de atributo. Entre 768 y 1023 nadie lo toca: **se pintan tres columnas
siempre.**

### Ancho real de la tarjeta de propiedad

| ancho de ventana | columnas | tarjeta | foto |
|---|---|---|---|
| 390 (móvil) | 1 | **352 px** | 352×264 |
| **768** | 3 | **243 px** | **243×182** |
| **900** | 3 | **287 px** | 287×215 |
| **1023** | 3 | **328 px** | 328×246 |
| 1024 | 3 | **307 px** | 307×230 |
| 1280 | 3 | **392 px** | 392×294 |

Una tarjeta de propiedad con foto, precio, título, comuna y tres métricas
metida en **243 px**. Es más estrecha que la misma tarjeta en un teléfono de
390 px.

**Y hay una anomalía dentro de la tabla:** de 1023 a 1024 la tarjeta **se
encoge** de 328 a 307 px. Al cruzar el breakpoint el contenedor pasa de `px-4` a
`lg:px-12`, y el padding nuevo se come más de lo que aporta el píxel de ventana.
La ventana crece y las tarjetas menguan.

### Lo que se ve a 768, mirado y no deducido

- «A consultar» y la insignia **EN ARRIENDO** colisionan en la misma línea.
- «— OVALLE · COQUIMB…» queda **cortado** contra el borde derecho de la tarjeta.
- «SANTIAGO · R. METROPOLITANA» envuelve a dos líneas.
- Los títulos de dos líneas desalinean la fila de métricas entre columnas.
- El botón flotante de WhatsApp tapa parte de la tercera columna.

---

## Hallazgo 3 · La navegación de escritorio NO cabe a 768. Ni a 1024.

Medido forzando la nav a `display:flex` con `white-space:nowrap`, o sea su ancho
intrínseco sin encogerse:

| elemento | ancho |
|---|---|
| Inicio | 70 px |
| Quiénes Somos | 143 px |
| SDM Rental | 114 px |
| Propiedades ▾ | 137 px |
| Proyectos Nuevos | 172 px |
| Servicios ▾ | 115 px |
| Contacto | 102 px |
| **total de los 7** | **850 px** |

Contra el espacio disponible, que es la ventana menos el logo (110 px) y el
padding de la barra:

| ventana | padding | disponible | ¿cabe? |
|---|---|---|---|
| **768** | 32+32 | 594 px | **NO — faltan 256 px** |
| **900** | 32+32 | 726 px | **NO — faltan 124 px** |
| **1023** | 32+32 | 849 px | **NO — falta 1 px** |
| 1024 | 48+48 | 818 px | **NO — faltan 32 px** |

**La respuesta a «¿puede la nav de escritorio bajar a `md:`?» es no**, y por un
margen grande: 256 px a 768. No es cuestión de apretar el `gap`.

> El dato incómodo es la última fila: **a 1024, donde la nav SÍ se muestra,
> tampoco cabe en línea.** No desborda porque los enlaces se encogen y el texto
> envuelve. O sea que el problema del rango tablet no empieza en 1023: empieza
> antes y ya está presente en el escritorio estrecho.

Para que los 7 quepan sin envolver harían falta 850 + 110 + 96 = **1056 px**.

---

## Hallazgo 4 · Ya existe un parche de tablet, y es frágil

`mobile.css` tiene esto:

```css
@media (min-width: 768px) and (max-width: 1024px) {
  /* NO borrar: entre 768 y 1024 la utilidad lg no esta activa, pero la CLASE
     si esta en el atributo, asi que el selector matchea. */
  .sitio-publico .lg\:grid-cols-3 { grid-template-columns: repeat(2, 1fr) !important; }
}
```

Funciona apuntando a la **clase escrita en el atributo** aunque la utilidad no
esté activa. Alguien ya chocó con esto y lo resolvió por fuera de Tailwind. Es
información, no reproche: **hay al menos tres mecanismos de responsive conviviendo**
—utilidades `lg:`, media queries en `mobile.css` y estilos inline— y cualquier
opción de abajo tiene que decidir con cuál se queda.

---

## Las opciones, con su costo

Sin recomendación única. Son acumulables: A es independiente de B, y C solo tiene
sentido después de B.

### Opción A — Parche CSS del catálogo · **1 línea**

Añadir al bloque de media query que ya existe:

```css
.sitio-publico [style*="repeat(3, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
```

- **Gana:** la tarjeta pasa de 243 a **367 px** a 768 y a 495 px a 1023. Arregla
  el peor defecto medido, que además es la página con más tráfico.
- **Cuesta:** una hora, incluida la verificación.
- **Riesgo:** hereda la fragilidad del truco de selector por atributo. Si alguien
  reformatea el `style` inline —un espacio de más en `repeat(3, 1fr)`— el
  selector deja de coincidir **en silencio**.
- **No arregla** los divs de relleno: ver la trampa de abajo.

### Opción B — Mover las 19 decisiones de `lg:` a `md:` · **2–3 días**

Los 19 sitios, por archivo:

| archivo | líneas |
|---|---|
| `ServiciosPage.tsx` | 75, 82, 104 |
| `Footer.tsx` | 103, 188 ×3 |
| `Header.tsx` | 191, 264, 276 |
| `RentalPage.tsx` | 79, 87 |
| `QuienesSomosPage.tsx` | 91, 105 |
| `BlogPreviewSection.tsx` | 58 |
| `AsociadosPage.tsx` | 69 |
| `BlogPage.tsx` | 38 |
| `PropiedadDetailPage.tsx` | 409 |
| `PropiedadesPage.tsx` | 511 |

- **Gana:** `/servicios` recupera los 1639 px, el home los 526, la ficha los 135.
- **Cuesta:** cada uno pide verificación propia; no es un buscar-y-reemplazar.
- **NO incluye `Header.tsx:191`**, que es la nav: el hallazgo 3 dice que no cabe.
- **Y `md:` en `/servicios` no sale gratis** — medido abajo.

#### La medición que decide el caso de `/servicios`

A dos columnas en 768, cada celda vale **352 px**. Contra lo que el contenido
exige sin envolver:

| elemento | ancho mínimo | ¿entra en 352? |
|---|---|---|
| CTA «Solicita una evaluación gratuita →» | **361 px** | **NO, por 9 px** |
| Título «Financiamiento Personas» | 377 px | no, envuelve (aceptable) |
| Fila de 3 etiquetas | 422 px | no, envuelve a 2 líneas |

Nueve píxeles. Bajar `/servicios` a `md:` **tal cual** rompe su botón principal.
Las salidas son acortar el rótulo del CTA, reducir su padding, o poner el
breakpoint de esa página en `min-width: 820px` en vez de en `md:`. Es una
decisión de diseño, no de implementación, y por eso queda acá y no resuelta.

### Opción C — Sustituir el inline del catálogo por clases · **medio día, con trampa**

`grid-cols-1 md:grid-cols-2 xl:grid-cols-3` en `PropiedadesPage.tsx:688`, y
borrar los dos parches de `mobile.css`.

- **Gana:** un solo mecanismo, sin `!important` ni selectores por atributo.
- **TRAMPA, y es la razón de que esto no sea un cambio de una línea:** las líneas
  690–691 rellenan la última fila con divs vacíos usando `% 3`:

  ```jsx
  {displayProps.length % 3 === 1 && <><div className="bg-white" /><div className="bg-white" /></>}
  {displayProps.length % 3 === 2 && <div className="bg-white" />}
  ```

  Comprobado en producción: la rejilla tiene **84 hijos para 82 propiedades**
  —`82 % 3 = 1`, luego 2 rellenos—. Con dos columnas `82 % 2 = 0` y no haría
  falta ninguno, pero el código seguiría metiendo **2 celdas vacías** al final.
  El relleno tiene que pasar a depender del número de columnas activo, que en CSS
  puro no se sabe desde JavaScript.
- La salida limpia es borrar los rellenos y resolverlo en CSS, pero eso cambia
  cómo se ve la última fila en los tres anchos, no solo en tablet.

### Opción D — No tocar el rango y arreglar solo la anomalía de 1024 · **1 hora**

De 1023 a 1024 la tarjeta encoge de 328 a 307 px porque el padding salta de
`px-4` a `lg:px-12`. Un `lg:px-8` en ese contenedor lo elimina.

- **Gana:** quita un defecto que se ve en escritorio, no solo en tablet.
- **Cuesta:** una hora. Es lo más barato de la lista.
- **No aborda M2**; se lista porque salió de la misma medición y sería raro
  perderlo.

---

## Dónde va el escalón intermedio, si se pone

Tomando como referencia el ancho de tarjeta que el diseño ya usa —352 px en móvil
y 392 px en escritorio—, el punto donde cada número de columnas alcanza ~350 px:

| columnas | ventana necesaria |
|---|---|
| 2 | **≥ 736 px** |
| 3 | **≥ 1148 px** |

O sea que **2 columnas es correcto en todo el rango 768–1023**, y que las 3
columnas de hoy no alcanzan un ancho sano hasta ~1150 px — bastante por encima
del 1024 donde arrancan. Si alguien quiere el reparto ideal y no el mínimo:
1 columna hasta 736, 2 hasta 1148, 3 desde ahí. Eso es `md:` y `xl:`, no `md:` y
`lg:`.

---

## Lo que esta medición NO cubre

- **El admin.** Sus 212 `lg:` no se midieron: lo usa una persona en escritorio y
  el encargo era el sitio público.
- **Orientación vertical real en tableta.** Se emuló el ancho, no un iPad: sin
  toque, sin la barra del navegador y sin `devicePixelRatio` 2.
- **`/blog`, `/asociados`, `/quienes-somos`, `/rental`, `/proyectos-nuevos`.**
  Tienen `lg:` de disposición y entran en la Opción B, pero las capturas y los
  altos son de las cuatro plantillas del encargo.
- **Si a alguien le importa este rango.** No hay analítica en esta medición. Los
  números dicen qué está mal, no cuánta gente lo ve.
