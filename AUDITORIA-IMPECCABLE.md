# Auditoría Impeccable — sitio público de SDM Capital

**2026-08-10 · cinco skills, ningún cambio aplicado. `git diff src/` vacío.**

Alcance: Inicio, catálogo, ficha de propiedad y `/servicios`. El panel de
administración queda fuera.

Autoridades contra las que se mide, en este orden:

| documento | qué gobierna |
|---|---|
| `SISTEMA-DISENO.md` | tokens, escala tipográfica, radios, principios y las decisiones cerradas de §4 |
| `PRODUCT.md` | los dos usuarios principales, la posición, las cifras aprobadas |
| `GUIA-DE-VOZ-SDM.md` | voz, léxico, CTAs, política de pagos *(vive en `~/Downloads`, no en el repo)* |
| `AUDITORIA-VOZ-SDM.md` | 21 hallazgos de voz ya levantados *(ídem)* |

**Ninguna propuesta de este documento baja un contraste por debajo de su umbral.**
Donde una recomendación lo habría hecho, está descartada y anotada como tal.

---

## Cómo se obtuvo la evidencia

**Critique corrió en dos subagentes aislados**, como exige el método: A no vio la
salida del detector antes de emitir su juicio, y B no vio el juicio de A.

- **A** — revisión de diseño. `SISTEMA-DISENO.md` y `PRODUCT.md` leídos enteros,
  Chrome headless contra producción, 4 superficies × 390 y 1440 px, recorrido de
  tabulación de 22 paradas, apertura real de los modales de reserva y crédito.
- **B** — evidencia determinista. Detector con y sin alcance, y **20 cargas**
  (4 URLs × 390/768/1023/1024/1440) midiendo desborde, área táctil por *hit-test*,
  tamaños de fuente, encabezados, contraste calculado sobre **1.116 elementos con
  texto**, consola y nombres accesibles.
- **Yo** verifiqué a mano las afirmaciones P0/P1 de A antes de recogerlas. Dos
  cambiaron de forma; están señaladas donde corresponde.

Las secciones 2 a 5 son mías, sobre esa evidencia más escaneos de fuente propios.

> **El detector no cubre todo el sitio, y conviene saberlo.** B validó con sondas
> sintéticas que el motor sí dispara sobre `.tsx` (gradientes, paletas, fuentes),
> pero **no evalúa objetos `style` inline de JSX**. Este proyecto usa `style`
> inline masivamente —1.457 objetos según `SISTEMA-DISENO.md` §4.8—, así que el
> `[]` limpio del detector es real pero parcial. No es prueba de nada sobre esa
> superficie.

---

# 1 · CRITIQUE

**Método: dual-agente (A: revisión de diseño · B: detector + navegador).**

## Veredicto de especificidad

**El chrome está autorado para SDM. El contenido dentro del chrome es
intercambiable con cualquier corredora.** Esa distancia es el problema central.

Lo autorado es real: la cinta de UF/Dólar bajo el header habla a quien decide con
calculadora antes de que nadie lo afirme; el modal de crédito nombra a Roberto
Urrutia, declara los honorarios en prosa llana y lista los documentos exactos
—cotizaciones AFP de 24 meses con RUT del empleador, certificado CMF con Clave
Única—. Ese vocabulario **es** la prueba de la posición 1 de `PRODUCT.md`, y
funciona mejor que cualquier testimonio: no lo copia quien no ha armado carpetas.

Y después el catálogo abre con un volante de Instagram dentro de una tarjeta.

## Salud de diseño — 26/40

| # | Heurística | Puntaje | Problema clave |
|---|---|---|---|
| 1 | Visibilidad del estado | 3 | El modal de reserva entrega un código y un «Entendido», sin señal de que SDM tenga registro de nada |
| 2 | Correspondencia con el mundo real | 3 | Lo más fuerte del sitio. Resta: la ficha muestra «UF 1.779» y nunca su equivalente en pesos, **aunque el sitio conoce la UF del día** |
| 3 | Control y libertad | **2** | 82 propiedades sin control de orden ni paginación. El orden lo fija el admin |
| 4 | Consistencia y estándares | **2** | El verde hace tres trabajos; «Reservar esta propiedad» no es ninguna de las 5 variantes de botón |
| 5 | Prevención de errores | 3 | Genuinamente bueno: Comuna llega `disabled` con «Primero elige región»; los cortes de bono pie que no recortan se descartan solos |
| 6 | Reconocer antes que recordar | 3 | Los chips reponen el estado del filtro. Resta: el código de reserva hay que acarrearlo a mano |
| 7 | Flexibilidad y eficiencia | **2** | Para comparar 82 propiedades por UF/m² hay que abrir 82 fichas |
| 8 | Estética y minimalismo | **2** | Volantes dentro de las tarjetas; la descripción de la ficha como muro de viñetas sin jerarquía |
| 9 | Recuperación de errores | 3 | *Parcial: no se enviaron formularios fallidos.* Los dos vacíos del catálogo son ejemplares |
| 10 | Ayuda y documentación | 3 | El modal de crédito documenta alcance, plazo, honorarios y documentos. Nada explica qué es «bono pie» |

**26/40 — banda «Aceptable».** La forma importa más que el número: **2 en control,
consistencia y flexibilidad**, 3 en todo lo demás. El sitio está bien hecho y mal
decidido **en las dos pantallas donde se compra**.

## Lo que funciona, y hay que no romperlo

1. **Los estados vacíos del catálogo.** `SinArriendos` reconoce que el arriendo es
   línea de negocio y ofrece WhatsApp con el texto redactado;
   `ArriendosEnElCatalogo` dice **dónde están** y enlaza con el filtro puesto. La
   guarda `soloArriendo` es la parte fina: el mensaje solo aparece cuando el
   arriendo es el *único* recorte, porque combinado sería mentira.
2. **El foco de teclado.** 22 paradas recorridas, anillo visible en todas desde
   una sola regla global, `aria-current` correcto en el carrusel, `.area-44` en el
   botón de pausa. Razonado, no marcado en una casilla.
3. **El punto activo del carrusel** usa `--green` sobre foto —que sería infracción
   de §4.2 en solitario— pero lleva un anillo `--navy-deeper` a 17,92:1 que lo
   separa con independencia de la foto. **No tocar.**

## Hallazgos

### C-1 · P0 — Seis controles del hero están tapados, en todos los anchos

**Dónde.** `HeroSection` — el botón de pausa (22×22) y los 5 puntos del carrusel
(8×8, y 24×8 el primero), en `y=178–200`.

**Qué pasa.** B lo confirmó por *hit-test*, no por inspección visual: encima del
centro de cada control, `elementsFromPoint` devuelve un **botón del buscador**. El
panel `div.md:hidden` ocupa `t=177…b=511` y engulle el envoltorio de los
controles (`t=178, b=200, z-index:10`). A 768 y 1440 los tapa
`div.hidden.md:block`. Las capturas confirman que no hay rastro visual de los
puntos ni del botón.

**Son seis controles muertos: ni visibles ni pulsables, con `aria-label` correcto.**
Y es exactamente el modo de fallo que advierte el comentario de `globals.css:655`.

**Qué cuesta.** Diagnóstico de apilamiento, no rediseño: el envoltorio necesita
salir de debajo del panel de búsqueda. Una tarde, con verificación por *hit-test*
en los tres anchos.

**Choque con decisiones cerradas.** Ninguno.

> **A y B se contradijeron aquí, y B gana con mejor evidencia.** A midió los
> puntos en 8×8 y concluyó que «probablemente pasan 2.5.8 por la excepción de
> espaciado». B no los midió: los *pulsó*. No es que sean pequeños; es que no
> están.

### C-2 · P0 — El modal de reserva pide una transferencia y el monto solo existe en un comentario

**Dónde.** `ReservaModal.tsx:227`, paso 1: «Transfiere el monto de la reserva a
esta cuenta». A verificó el `innerText` completo del diálogo a 390 y 1440: no hay
cifra, ni rango, ni referencia a una cifra.

**El matiz que A no vio y yo verifiqué.** No es un olvido. `ReservaModal.tsx:277`
lo documenta:

> «Tampoco se menciona ningún monto: la reserva se acuerda con el ejecutivo, no
> se fija en esta pantalla.»

Está en el mismo bloque que explica por qué tampoco hay plazo, y el razonamiento
es correcto: no se promete lo que no se controla. **El defecto no es la decisión,
es que la decisión no llegó a la pantalla.** El equipo resolvió la ambigüedad
puertas adentro y el usuario se queda con ella.

**Agravante.** El sitio repite en tres superficies «Sin pagos adelantados,
nunca», y aquí pide una transferencia por adelantado. Son cosas distintas —la
reserva no es un honorario— pero **nada en pantalla lo dice**.

**Qué propone.** Dos frases, ningún token nuevo:
1. Decir en pantalla lo que el comentario ya sabe: «Te confirmamos el monto de la
   reserva por WhatsApp antes de que transfieras.»
2. Desactivar la contradicción aparente: «La reserva se descuenta del precio
   final. No es un honorario.»

**Qué cuesta.** Dos líneas de copy. La segunda **debe validarse contra el punto
`UNDECIDED` de honorarios de `PRODUCT.md`** y no puede precisar el momento del
cobro.

**Choque.** Ninguno con el sistema de diseño. Sí con `GUIA-DE-VOZ-SDM.md` §8, que
fija la redacción canónica de la política de pagos: la frase nueva tiene que
convivir con ella sin crear una sexta variante.

### C-3 · P1 — La ficha sirve a un usuario principal y deja fuera al otro

**Dónde.** El bloque de specs de `PropiedadDetailPage`: dormitorios, baños,
superficie total, superficie construida, estacionamientos, año de construcción.
**Los seis son criterios de vivienda.**

**Verificado por mí, no solo por A:** `dividendo_uf` existe en
`src/types/index.ts:240`, tiene **0 usos en superficies públicas** y 4 en todo
`src/` — o sea, solo admin. `rentabilidad` no existe. No hay UF/m², no hay
equivalente en CLP, y el bono pie aparece como insignia sin monto ni explicación.

**Por qué importa.** `PRODUCT.md`, principio 1, textual: «Optimizar la ficha para
uno a costa del otro es **romper la mitad del negocio**». La ficha está
optimizada para uno.

**Qué propone.** Extender la grilla de specs existente —no crear una sección
aparte, que rompería la lectura única— con `UF/m²` (calculado), `Dividendo
estimado` (desde el campo que ya está en el esquema), el equivalente en CLP bajo
el precio, y el monto del bono pie junto al porcentaje. **Ninguna celda le quita
nada al comprador de vivienda**, y el CLP le sirve a los dos.

**Qué cuesta.** Medio día. El dato de la UF ya está resuelto: el modal de crédito
la usa («Valor UF hoy: $40.846 CLP»).

**Choque.** Ninguno. Usa los mismos tokens y el mismo tratamiento con icono.

### C-4 · P1 — 82 propiedades sin orden ni paginación, con la capacidad ya escrita

**Dónde.** `/propiedades`. Medido: `docH` = 17.217 px a 1440 y **41.345 px a 390**
—unas 49 pantallas de teléfono—, un solo `<h1>` en toda la página, y las **tres
primeras tarjetas dicen «A consultar»**: quien decide con UF abre el catálogo y
no ve un número.

**Verificado por mí:** `applyCatalogOrder` (`PropiedadesPage.tsx:232`) ya
implementa `precio_alto`, `precio_bajo` y `aleatorio`. La capacidad existe y
funciona; la UI no la expone. El orden lo decide `catalogo_orden` desde el admin.

**Qué propone.** Un `<select className="input-line">` rotulado «ORDENAR» junto al
botón «FILTROS», persistido en la URL como los demás filtros. **Es exponer una
capacidad, no construir una.**

**Qué cuesta.** Un día con verificación. El canonical ya está resuelto a la ruta
limpia, así que no crea URLs indexables nuevas.

**Choque.** Ninguno.

### C-5 · P1 — Cuatro usos de `--green` que el barrido de §4.2 no podía encontrar

**Dónde.** A encontró tres; **yo verifiqué y son cuatro**:

| archivo:línea | qué | cómo está escrito | ratio | umbral |
|---|---|---|---|---|
| `PropiedadesPage.tsx:563` | texto del botón «Filtros» con el panel abierto | `color: panelOpen ? 'var(--green)' : …` | **2,93:1** | 4,5 ❌ |
| `PropiedadDetailPage.tsx:478` | anillo de la miniatura activa, galería | `boxShadow: '0 0 0 2px var(--green)'` | **2,93:1** | 3 ❌ |
| `PropiedadDetailPage.tsx:925` | anillo de la miniatura activa, **lightbox** | ídem | **2,93:1** | 3 ❌ |
| `PropiedadDetailPage.tsx:596` | chip de estado de conservación | `background: tag.dark ? … : 'var(--green)'` | **2,93:1** | 4,5 ❌ |

**Por qué sobrevivieron a dos pasadas.** §4.2 documenta que el barrido buscó
`color`, `background`, `background-color`, `bg-[var(--green)]` y
`text-[var(--green)]`. Los cuatro viven en **ternarios** y en **`boxShadow`**:
ninguna de esas cinco búsquedas los alcanza.

**Por qué importa.** Los dos anillos son el peor caso práctico: **son el único
indicador visual de qué foto estás viendo**, y a 2,93:1 sobre blanco desaparecen
bajo deuteranopia. `aria-current` está puesto, así que el hueco es solo visual.

**Qué propone.** Los cuatro a `--green-dark` (4,85:1). **Sube el contraste, no lo
baja**, y es la respuesta que §4.2 ya da.

**Qué cuesta.** Cuatro líneas. Más una nota a §4.2: el barrido debe incluir
`boxShadow`, `borderColor` y expresiones ternarias.

**Choque.** Ninguno: aplica §4.2, no la reabre.

> **Aquí A y B parecen contradecirse y no lo hacen.** B midió contraste sobre
> 1.116 elementos y encontró **0 fallos** en catálogo y ficha. Los cuatro de
> arriba viven en **estados** —panel abierto, miniatura seleccionada, chip
> latente—, y B midió el estado por defecto. A hizo clic. Son complementarios, y
> juntos dicen algo útil: **el sitio en reposo cumple; los estados no están
> barridos.**

### C-6 · P1 — Cuatro controles por debajo del mínimo AA, y `.area-44` no sirve sobre `<select>`

**Dónde.** B midió el área efectiva por *hit-test*, no por rectángulo, porque
`.area-44::after` amplía el toque de forma invisible al rect. Descartó así 36
falsos positivos. Lo que queda:

- **Los 4 `<select>` del buscador quedan en 22×22 efectivo.** El `::after` se
  computa pero `<select>` es un elemento reemplazado y Chrome no lo renderiza.
  Sobre `<button>` sí funciona.
- **30 controles por debajo de 24×24** (fallo de 2.5.8 AA), sobre todo los cuatro
  enlaces legales del pie a 16×16, presentes en las cuatro páginas.

**Qué propone.** Para los selects, una vía que no dependa del pseudo-elemento
(padding real o envoltorio). Para el pie, `.area-44` en los cuatro enlaces.

**Qué cuesta.** Bajo. El patrón ya existe.

**Choque.** Ninguno. `SISTEMA-DISENO.md` §1.6 ya registra el área táctil como
hueco sin token.

### C-7 · P1 — Dos botones sin nombre accesible

**Dónde.** Las flechas de la galería de la ficha: 36×36, contenido solo un `<svg>`,
sin `aria-label` ni `<title>`. **Son los únicos controles anónimos del sitio.**

**Choque.** Ninguno. Y contrasta con el resto, cuidado hasta el detalle («Ver la
foto 3 de 5», «Facebook de SDM Capital (se abre en una pestaña nueva)»).

### C-8 · P2 — Las imágenes deshacen el sistema de diseño

**Dónde.** La `imagen_principal` de varias propiedades es un **volante
publicitario**: segundo logo SDM compitiendo con el del header, tipografía ajena,
teléfono y correo quemados en el bitmap, cuerpo a ~6 pt. El recorte 4/3 corta la
última línea a varias. Los mismos datos —dormitorios, baños, m²— aparecen en mapa
de bits y otra vez en tipografía 200 px más abajo. Y como los volantes son
cuadrados, `PropertyCard` les aplica `objectFit: contain` y quedan con franjas
navy: una misma fila mezcla tarjetas a sangre con tarjetas enmarcadas.

En `/servicios`, la foto del servicio 01 son **dos hombres de traje dándose la
mano sobre una carpeta**.

**El agravante.** `HomePage.tsx` ya documenta esta lección: sacó su foto de apoyo
porque «era una alcancía rosada de banco de imágenes, que dice banca minorista
justo donde SDM vende asesoría». El razonamiento fue correcto **y no se propagó a
la página que se llama «Nuestros servicios»**.

**Qué propone.** Política editorial, no código: la `imagen_principal` es una
fotografía del inmueble **sin texto superpuesto**; los volantes pasan a imagen
secundaria de la galería, donde sí funcionan. Con las principales sin texto,
`isSquareImg` deja de dispararse y el pillarbox desaparece solo.

**Qué cuesta.** Trabajo de contenido sobre 82 fichas, no de ingeniería.

**Choque.** Ninguno.

### C-9 · P1 — El sitio publica hoy la cifra que `PRODUCT.md` marca como no aprobada

Cae fuera del mandato de diseño y se anota porque apareció en dos de las cuatro
superficies auditadas:

- El hero muestra **«2+ PAÍSES»**.
- `ServiciosPage.tsx:61`, **escrito en el componente**: «…tanto en Chile como en
  Paraguay.»
- `HomePage.tsx:421`, `description` de SEO: «…en Chile y Paraguay.»

`PRODUCT.md` es inequívoco: no confirmado, y «ningún trabajo futuro debe afirmar
que SDM opera en Paraguay». **Dos de las tres están escritas en el código**, así
que corregirlas exige deploy. El principio 4 —ninguna cifra sin respaldo— lo
cubre expresamente.

## Banderas por persona

**Comprador-inversionista:** `dividendo_uf` en el esquema y sin pintar · seis
specs y ninguna financiera · 82 propiedades sin orden · las tres primeras sin
precio · «UF 1.779» sin CLP mientras la cinta del header muestra la UF a 200 px ·
las condiciones comerciales en viñetas de texto plano con el mismo peso que
«Patio con cobertizo».

**Comprador-vivienda:** «BONO PIE 14%» sin explicar en ninguna superficie ·
la descripción de la ficha sin jerarquía (todo a 17 px, mismo color, mismo peso) ·
imagen principal con texto cortado por el recorte · **una tarjeta VENDIDA en
«Propiedades similares»** · las filas de specs no se alinean entre tarjetas
vecinas, así que no se puede leer «cuántos dormitorios tienen estas tres» en
horizontal.

**Quien llega por el crédito:** se le piden **RUT y sueldo líquido** —8 campos
obligatorios— sin una línea de privacidad ni enlace a la política **en el punto de
captura**. Es el perfil con más razones para desconfiar.

**Cualquiera, en un teléfono:** la botonera flotante **tapa el texto del cuerpo**
—`elementsFromPoint` en su centro devuelve el `<p>` de la descripción—; el
catálogo mide 41.345 px; en el buscador, «Todos los tipos» queda solapado por su
propio chevron.

---

# 2 · TYPESET

Medido contra la escala `text-sdm-*`. **Ninguna propuesta sale de la escala.** La
única que lo plantearía está descartada abajo, con su motivo.

Punto de partida: en el sitio público hay **159 usos de la escala contra 19
valores sueltos**. La adopción es buena y el detector con `--scope type` sale
limpio. El problema no es el cumplimiento; es dónde se rompe.

### T-1 · El extremo display de la escala está esquivado por completo

**Dónde.** Usos de los cuatro tokens display en todo `src/`:

| token | px | usos |
|---|---|---|
| `text-sdm-display-sm` | 28 | 27 |
| `text-sdm-display-md` | 40 | 10 |
| `text-sdm-display-lg` | 52 | **1** |
| `text-sdm-display-xl` | 72 | **0** |

Y en su lugar, **ocho rampas `clamp()` distintas** con píxeles crudos, todas en
titulares del sitio público:

| archivo:línea | rampa | techo |
|---|---|---|
| `HeroSection.tsx:351` | `clamp(52px, 6.5vw, 88px)` | 88 |
| `ServiciosPage.tsx:57` | `clamp(40px, 5vw, 64px)` | 64 |
| `ContactSection.tsx:52` | `clamp(36px, 4vw, 56px)` | 56 |
| `HomePage.tsx:444` | `clamp(32px, 6vw, 50px)` | 50 |
| `PropiedadesPage.tsx:546` | `clamp(28px, 5vw, 48px)` | 48 |
| `BlogPreviewSection.tsx:48` | `clamp(28px, 5vw, 48px)` | 48 |
| `BannerPromo.tsx:147` | `clamp(30px, 3.4vw, 42px)` | 42 |
| `HomePage.tsx:77` y `:282` | `clamp(28px, 4vw, 40px)` | 40 |

**Ocho techos distintos donde la escala ofrece cuatro pasos.**

**Por qué pasó, y por qué la escala no «falla».** Los tokens son valores fijos en
`rem`; los titulares necesitan ser fluidos. Quien escribió cada uno alcanzó
`clamp()` con números porque el token no expresa una rampa. **Eso no es un
defecto de la escala: es un hueco de forma, no de valores.**

**Qué propone.** Escribir las rampas **en términos de los tokens**, que es lo que
el propio repo ya hace bien en un sitio: `BlogPreviewSection.tsx:77` declara
`clamp(var(--sdm-text-2xl), …)`. Ese es el precedente interno.

Dos alcances posibles, y **no son lo mismo**:

- **(a) Sin cambio visual.** Sustituir solo los extremos que ya coinciden con un
  token (52 → `--sdm-display-lg`, 40 → `--sdm-display-md`, 28 →
  `--sdm-display-sm`) y dejar los techos intermedios como están. 8 ediciones,
  **cero cambio de píxeles**, y a partir de ahí la escala manda donde puede.
- **(b) Con cambio visual.** Consolidar los ocho techos en cuatro. Es una decisión
  de diseño, cambia el aspecto de cinco titulares, y **necesita aprobación
  explícita**.

**Qué cuesta.** (a) una hora. (b) un día más la revisión visual de cinco páginas.

**Choque.** Ninguno con §4. Añadir un quinto token display **sí** sería reabrir la
escala, y por eso no se propone.

### T-2 · Los numerales de Cormorant se leen como letras cuando van solos

**Dónde.** El sistema ya detectó y resolvió esto: `PropertyCard` pasa los specs a
sans, **con una excepción explícita para ≥24 px**. La excepción falla cuando el
numeral no tiene vecinos que lo desambigüen:

- Hero, 40 px: **«120+» se lee «I2O+»** y «15+» se lee «I5+». Son las cifras de
  confianza de la empresa.
- Ficha, 24 px: el «1» de ESTACIONAM. y el de «1989» se leen como I mayúscula.
- Modal de reserva: los pasos numerados se leen «I, 2, 3».

**Por qué la excepción no cubría esto.** El criterio «≥24 px es legible» se validó
contra «UF 1.779», donde el contexto salva al 1. Un dígito **aislado** no tiene
contexto.

**Qué propone.** Extender la regla que ya existe —numeral aislado a sans— en vez
de inventar una nueva. Es la solución del propio sistema aplicada a un caso que
no se había visto.

**Qué cuesta.** Bajo, y concentrado: hero, specs de la ficha, pasos del modal.

**Choque.** Ninguno. No está en §4 y no toca la pareja Cormorant/Inter.

### T-3 · La descripción de la ficha no tiene jerarquía tipográfica

**Dónde.** El cuerpo de `PropiedadDetailPage`, servido por `.prose-sdm`.
«Distribución», «Primer piso:», «Entorno y conectividad» y «• Antejardín» se
renderizan **todos a 17 px, mismo color, mismo peso**.

**Por qué importa a los dos usuarios.** Es el texto que más lee el comprador de
vivienda, y es donde el inversionista tiene enterrado lo decisivo: «Condiciones
comerciales / • Valor de venta: UF 1.779 / • Comisión de corretaje: 2%» pesa
exactamente lo mismo que «• Patio con cobertizo».

**Qué propone.** Dar a `.prose-sdm` un tratamiento de encabezado y de `<strong>`
con **tokens que ya existen**: `--sdm-text-lg` o `-xl` para los títulos internos,
`--sdm-peso-semi` (600, cara real desde el 2026-08-09) y `--navy-dark`. Ninguna
adición al sistema.

**Qué cuesta.** Medio día, más una revisión de los 82 textos, que están escritos
por editores y pueden no usar encabezados de forma consistente.

**Choque.** Ninguno.

### T-4 · Observación medida, sin propuesta: el suelo tipográfico es 11 px

B contó **61 elementos por debajo de 12 px**: 4 a 10 px (atribución de Google
Maps, terceros) y **57 a 11 px**, todos `text-sdm-xs` + `tracking-sdm-wide` en
rótulos en mayúsculas.

`typeset.md` recomienda 16 px como suelo de cuerpo; el cuerpo de este sitio es
`--sdm-text-base` = 15 px, y los rótulos 11.

**No se propone cambiarlo, y el motivo es que chocaría de frente con §4.5**, que
declara cerrados los rótulos en mayúsculas y su tracking ancho, con el argumento
—correcto— de que a ese tamaño el tracking amplio es lo que los hace legibles.
Subir el tamaño sin revisar el eje entero lo empeoraría. **Queda como dato, no
como hallazgo.**

---

# 3 · LAYOUT

Cada propuesta declara **en qué anchos aplica**. El detector con `--scope layout`
sale limpio; como dice su propia referencia, eso es un suelo y no prueba jerarquía.

### L-1 · El hueco de 768–1023 sobrevive en exactamente tres rejillas

**Dónde y en qué anchos.** Solo **768–1023 px**. Tras el arreglo del catálogo,
quedan tres, las tres `grid-cols-1 lg:grid-cols-2`:

| archivo:línea | qué es | costo medido al cruzar 1024 |
|---|---|---|
| `ServiciosPage.tsx:75` | las tarjetas de servicio | **−1.639 px de alto, −34 %** |
| `PropiedadDetailPage.tsx:409` | el cuerpo de la ficha | −135 px, −3 % |
| `BlogPreviewSection.tsx:58` | el bloque de blog del home | incluido en el −526 px del home |

El home y `ContactSection` ya usan `md:` y **no forman parte del problema**.

**Qué propone.** `lg:` → `md:` en las tres. Pero no son iguales:

- **`PropiedadDetailPage` y `BlogPreviewSection`: limpias.** Dos ediciones.
- **`ServiciosPage`: NO es limpia, y está medido.** A dos columnas en 768 cada
  celda vale **352 px**, y el CTA «Solicita una evaluación gratuita →» exige
  **361 px** sin envolver. Bajarla tal cual **rompe su botón principal por 9 px**.

**Qué cuesta.** Dos ediciones triviales y una decisión de diseño. Las salidas para
`/servicios` son acortar el rótulo del CTA, reducir su padding, o poner el corte
de esa página en 820 px en vez de en `md:`.

**Choque.** Ninguno con el sistema de diseño. **Sí con la voz**: acortar el CTA
toca `GUIA-DE-VOZ-SDM.md` §5 y el hallazgo B4 de la auditoría de voz, que pide
*un solo nombre* para ese trámite. Ver §6.

### L-2 · La ficha tiene 712 × 1.200 px de columna vacía en escritorio

**Dónde y en qué anchos.** `PropiedadDetailPage`, **≥1024 px**. Medido por A: entre
`y≈900` y `y≈2.100` la columna izquierda está completamente vacía mientras la
derecha corre el muro de viñetas.

**Por qué pasa.** `lg:grid-cols-2` con dos columnas de contenido muy desigual: la
izquierda termina y la derecha sigue.

**Qué propone.** Es el mismo espacio que reclama la propuesta **A-4** de bolder,
y hay que elegir una. Ver la contradicción en §6.

**Qué cuesta.** Reestructuración real de la ficha: medio día a un día, con
verificación en 390 / 768 / 1024 / 1440.

**Choque.** Ninguno.

### L-3 · El catálogo mide 41.345 px en móvil

**Dónde y en qué anchos.** `/propiedades`, **todos**; el número es de 390 px.
17.217 px a 1440. 82 tarjetas, sin paginación.

**Qué propone.** Es el mismo problema que C-4: el arreglo primario es exponer el
orden. La paginación o el scroll infinito es una decisión aparte, con costo de SEO
que hay que evaluar contra el sitemap de 113 URLs que ya existe.

**Qué cuesta.** Alto si se hace paginación; bajo si solo se expone el orden.

**Choque.** Ninguno.

### L-4 · La botonera flotante tapa el texto del cuerpo

**Dónde y en qué anchos.** `FloatingButtons`, **≤767 px**. Contenedor `fixed
bottom-6 right-5` en `x=318, w=52, h=106` sobre 390 de viewport. `elementsFromPoint`
en su centro devuelve el `<p>` de la descripción de la propiedad; en el home tapa
la estadística «PAÍSES».

**Qué propone.** Reserva de espacio al final del contenido, o desplazar la pila.
No es un cambio de identidad.

**Qué cuesta.** Bajo.

**Choque.** Ninguno.

### L-5 · La grilla de specs deja un dato huérfano a 390

**Dónde y en qué anchos.** Ficha, **390 px**: la grilla cae en 3+2+1 y «AÑO
CONST.» queda solo en su fila.

**Qué propone.** Es la misma grilla que C-3 quiere extender con UF/m² y dividendo.
**Las dos cosas se resuelven juntas**: con 8 celdas en vez de 6, el reparto a 390
sale parejo (4+4 o 2+2+2+2). Hacer una sin la otra es tocar la misma grilla dos
veces.

**Qué cuesta.** Se absorbe dentro de C-3.

**Choque.** Ninguno.

---

# 4 · CLARIFY

**Alcance deliberadamente recortado.** Ya existe `AUDITORIA-VOZ-SDM.md`, que mide
las 22 rutas contra la guía y levanta **5 hallazgos altos, 12 medios, 4 bajos y 5
avisos legales**: las tres razones sociales, los 15 años contra 20, las cinco
redacciones de la política de pagos, el corporativo genérico de Quiénes Somos y
Asociados, las flechas de los CTA, los dos taglines. **No lo duplico.**

Esta sección cubre lo que esa auditoría declara fuera de su alcance: **comprensión
y accionabilidad de los estados de interfaz**. Es el ángulo de `clarify`, no el de
voz.

### CL-1 · El estado vacío del catálogo está bien y hay que decirlo

`PropiedadesPage.tsx:740`: «Ninguna propiedad coincide con estos filtros. Prueba
quitando alguno o ampliando la comuna.» Dice el estado **y la acción de
recuperación**. `GUIA-DE-VOZ-SDM.md` §9 lo cita como el modelo de la casa. **No
tocar.**

### CL-2 · El momento de mayor riesgo no explica lo que el código ya sabe

Es C-2 visto desde el copy: el modal de reserva pide transferir sin decir cuánto,
y la razón —«se acuerda con el ejecutivo»— vive en un comentario. La regla de
`clarify` para errores y estados aplica igual a este: **decir qué pasa, y qué hacer
ahora.** Coste: dos frases.

### CL-3 · Se piden RUT y sueldo líquido sin una línea sobre qué pasa con ellos

**Dónde.** `SolicitudCreditoForm`, 8 campos obligatorios. No hay mención de
privacidad ni enlace a la política **en el punto de captura**, aunque el sitio la
tiene y es buena —declara incluso el asistente automatizado y el derecho a pedir
atención humana—.

**Qué propone.** Una línea junto al botón de envío, enlazando a
`/politica-de-privacidad`. `clarify` lo pide explícitamente: explicar por qué se
solicita la información cuando no es obvio, y tratar la privacidad con seriedad.

**Qué cuesta.** Una línea. **Es el hallazgo con mejor relación coste/beneficio del
documento.**

**Choque.** Ninguno.

### CL-4 · «Bono Pie 14%» es jerga sin glosa, y es la insignia más visible del catálogo

**Dónde.** `PropertyCard`, insignia de oportunidad; y en la ficha, sin monto.

**Por qué importa.** Es la barrera de jerga clásica, y cae justo sobre el
comprador de vivienda, que es **la mitad del negocio** según `PRODUCT.md`.

**Qué propone.** Una glosa breve donde se explique el término una vez —tooltip en
la insignia, o una línea en la ficha junto al monto—. Sin inventar cifras: el
porcentaje ya está en el dato.

**Qué cuesta.** Bajo.

**Choque.** Ninguno.

### CL-5 · Dos tarjetas distintas de `/servicios` abren la misma puerta sin decirlo

**Dónde.** Servicios 01 y 02 abren el mismo modal con la misma etiqueta.

**Qué propone.** O diferenciar el destino, o decir que es el mismo trámite. Hoy el
usuario no sabe si volvió al mismo sitio por error.

**Qué cuesta.** Bajo.

**Choque.** Toca el nombre del trámite, que es el hallazgo **B4** de la auditoría
de voz («evaluación» vs «preevaluación»). **Se resuelven juntos o se contradicen.**

### CL-6 · Dos botones sin nombre accesible

C-7 desde el ángulo del copy: las flechas de la galería necesitan `aria-label`.
El resto del sitio ya demuestra el estándar de la casa.

### CL-7 · «Cargando...» con tres puntos

Ya está levantado como **B2** en la auditoría de voz (`…` es un carácter, §5). Lo
recojo solo para señalar que en `PropiedadesPage.tsx:727` convive con un
**spinner inline**, mientras el sistema tiene componente `Esqueleto` con 15 usos y
el catálogo ya usa esqueletos con las proporciones de `PropertyCard` en otra rama
del mismo render. Es inconsistencia de patrón, no de copy.

---

# 5 · BOLDER

Encargo acotado: **no subir la intensidad del sitio**, sino encontrar dónde la
contención quita fuerza sin ganar nada. Cinco propuestas, ni una más.

**Prohibido y respetado en las cinco:** ningún gradiente nuevo, ninguna sombra
—§3 y §1.7: el sistema usa bordes finos y lo decidió a propósito—, ningún color
fuera de los tokens. Las cinco amplifican con lo que el sistema ya tiene.

### A-1 · El verde tiene que significar una cosa, y hoy significa tres

**Dónde.** `.btn-green` es, según la tabla §2.1, para **confirmar o guardar**. En
el sitio público es: «Buscar» (`SearchBar:399`), «Solicita tu preevaluación»
(`HomePage:307`) y «Ver disponibilidad» (`BannerPromo:56`). **Ninguno de los tres
confirma ni guarda.**

**La propuesta es restar, no sumar.** Dejar el verde para **una** acción —la
preevaluación, que es la que define a la empresa— y bajar «Buscar» y «Ver
disponibilidad» a la variante que les corresponde.

**Qué gana.** El acento recupera dirección. Hoy la acción que sostiene la posición
1 de `PRODUCT.md` es visualmente idéntica al *submit* de un buscador, separados por
~700 px en móvil.

**Qué arriesga.** «Buscar» pierde peso en el hero, que es donde más gente lo pulsa.
Es un intercambio real y hay que decidirlo con datos de uso, que no existen.

**Choque.** Ninguno: **aplica** §2.1 en vez de reabrirla.

### A-2 · El mejor titular del sitio está puesto en el tamaño más ordinario

**Dónde.** «¿El banco te dijo no?» —que `GUIA-DE-VOZ-SDM.md` §2 cita como el
ejemplo de «Directo»— se compone con `clamp(28px, 4vw, 40px)`: **la misma rampa
que un h2 de sección cualquiera** (`HomePage.tsx:77` y `:282` comparten
exactamente ese valor).

**Qué propone.** Subirlo un paso dentro de la escala. Es la única de las cinco que
toca tipografía, y no añade nada: usa un token que ya existe y hoy está sin uso
(`--sdm-display-lg`, 1 uso; `--sdm-display-xl`, 0).

**Qué gana.** El mensaje que distingue a SDM lee como el que distingue a SDM. Es
exactamente lo que pide el método: amplificar lo que el sistema ya posee.

**Qué arriesga.** Dos picos compitiendo en el home, si no se baja algo alrededor.
La regla del método es tajante: si todo sube, el bloque se aplana.

**Choque.** Con **T-1(b)**, que quiere consolidar las rampas. Ver §6.

### A-3 · La prueba más fuerte está escondida detrás de un clic

**Dónde.** El modal de crédito es el artefacto más convincente del sitio: nombra a
Roberto Urrutia, lista los documentos exactos, declara los honorarios. **Solo se ve
si abres el modal.** En la página, la prueba visible son tres cifras —120, 15, 2—
de las cuales `PRODUCT.md` **no aprobó una** (los 2 países).

**Qué propone.** Subir a la superficie la prueba que ya está escrita en
`financiamiento_prueba`: «Roberto Urrutia · Director Comercial · +20 años en
banca». Sin inventar nada, sin foto de stock.

**Qué gana.** Cambia una cifra sin respaldo por una persona con nombre. La guía
de voz lo dice en una línea: si la frase serviría igual para una consultora, no
sirve para SDM. «500 clientes» sirve para cualquiera; «armó carpetas 20 años en un
banco» no.

**Qué arriesga.** Personaliza la marca en un individuo. Es una decisión de negocio,
no de diseño.

**Choque.** Ninguno con el sistema. **Sí con la cifra de países**, que es C-9.

### A-4 · Los 712 px vacíos de la ficha son el único espacio que sobra en el sitio

**Dónde.** ≥1024 px, columna izquierda de la ficha, entre `y≈900` y `y≈2.100`.

**Qué propone.** Poner ahí las **condiciones comerciales** —valor, bono pie,
comisión 2 %— con el tratamiento estructurado que hoy tienen los specs, en vez de
enterradas en viñetas al final de la descripción.

**Qué gana.** Es la propuesta que más sirve a los dos usuarios a la vez: el
inversionista recupera lo decisivo, el de vivienda deja de leer un muro plano. Y
llena un vacío que hoy no dice nada.

**Qué arriesga.** Es la más cara de las cinco y la única que reestructura.

**Choque.** Con **L-2**, que reclama el mismo espacio. Ver §6.

### A-5 · Las tarjetas del catálogo abren sin un solo número

**Dónde.** Las **tres primeras** tarjetas dicen «A consultar». El elemento
dominante de la tarjeta —el precio, Cormorant 24 px— llega vacío tres veces
seguidas en la primera pantalla.

**Qué propone.** No es tipografía ni color: es **orden**. Es la misma palanca de
C-4, mirada desde la fuerza en vez de desde la usabilidad. Con el orden expuesto,
la primera pantalla deja de depender de `catalogo_orden = precio_alto`, que hoy
manda las «a consultar» al frente por diseño del propio comparador.

**Qué gana.** La primera impresión del catálogo pasa a tener cifras.

**Qué arriesga.** Nada visual. Es la propuesta más barata de las cinco y la única
que no toca un píxel.

**Choque.** Ninguno.

---

# 6 · DONDE LAS CINCO SE CONTRADICEN

Cinco herramientas opinando sobre lo mismo chocan. Estos son los choques reales,
con lo que hay que decidir antes de tocar nada.

### X-1 · `typeset` quiere consolidar las rampas · `bolder` quiere levantar una

**T-1(b)** propone reducir los ocho techos `clamp()` a los cuatro pasos de la
escala. **A-2** propone subir «¿El banco te dijo no?» por encima de su rampa
actual. Aplicadas en ese orden, la consolidación **aplana justo el titular que la
otra quiere levantar**: hoy comparte valor exacto con dos h2 genéricos del home.

**Cómo se resuelve.** No son incompatibles si se hacen juntas y en este orden:
consolidar a los tokens **asignando el paso por jerarquía y no por lo que había**.
El titular de financiamiento sube a `display-lg`; los h2 de sección bajan a
`display-md`. Hacer T-1 sola y A-2 después significa tocar el mismo valor dos
veces.

### X-2 · `layout` quiere dos columnas en `/servicios` · `clarify` y la voz gobiernan el CTA que lo impide

**L-1** propone `lg:` → `md:` en `ServiciosPage`. Medido: a dos columnas en 768 la
celda vale 352 px y el CTA exige **361 px**. La salida barata es acortar el
rótulo — pero ese rótulo es el trámite que **CL-5** y el hallazgo **B4** de la
auditoría de voz quieren unificar bajo un nombre único, y el nombre canónico del
home es el **más largo** de los dos («Solicita tu preevaluación gratuita»).

**Cómo se resuelve.** El orden importa: **primero se fija el nombre del trámite**,
después se mide si cabe. Al revés, el layout decide el copy por accidente de 9 px.

### X-3 · La guía de voz prohíbe la flecha que el sistema de diseño define

**`GUIA-DE-VOZ-SDM.md` §5**: «Sin flecha `→`. El botón ya se ve como botón.»
**`SISTEMA-DISENO.md` §2.1**: `.btn-text` es «texto con subrayado y `→`».

Es un choque **entre dos autoridades**, no una preferencia. La flecha no es un
adorno suelto: es parte de la definición de una de las cinco variantes de botón, y
`.btn-text` tiene 2 usos. La auditoría de voz (M3) propone quitar todas las
flechas del sitio, lo que redefine el componente.

**Cómo se resuelve.** Solo lo decide una persona. Las opciones son: (a) la voz
gana y `.btn-text` se redefine sin flecha en §2.1; (b) el sistema gana y la guía
excluye explícitamente a `.btn-text`; (c) se distingue *flecha de componente* de
*flecha escrita en el copy*, que es probablemente lo que las dos querían decir.
**Ninguna skill tiene autoridad para elegir.**

### X-4 · `layout` y `bolder` reclaman los mismos 712 px

**L-2** ve la columna vacía de la ficha como un defecto estructural. **A-4** la ve
como la oportunidad de subir las condiciones comerciales. Es el mismo espacio y
son dos intervenciones distintas: una reequilibra el reparto, la otra le da un
contenido nuevo.

**Cómo se resuelve.** A-4 absorbe a L-2: si el espacio recibe contenido, deja de
haber vacío que reequilibrar. Hacer L-2 primero —redistribuir para que no sobre—
deja a A-4 sin sitio donde caer.

### X-5 · `bolder` empuja hacia arriba donde `critique` mide inconsistencia

`critique` puntúa **2/4** en consistencia porque el verde hace tres trabajos. El
reflejo de `bolder` es amplificar; aplicado sin cuidado sobre el verde equivocado,
**profundiza justo la inconsistencia que critique mide**. Por eso A-1 está
formulada como una resta.

**Cómo se resuelve.** A-1 va **antes** que cualquier otra amplificación. Es
condición previa, no una propuesta paralela.

### X-6 · Las dos evaluaciones de critique se contradijeron sobre el carrusel

**A** midió los puntos en 8×8 y concluyó que «probablemente pasan 2.5.8 por la
excepción de espaciado». **B** hizo *hit-test* y encontró que los seis controles
están **tapados por el panel de búsqueda** en 390, 768 y 1440.

**Gana B, y el método explica por qué.** A midió geometría; B midió qué recibe el
clic. Un control puede tener el tamaño correcto y no existir. Queda como C-1, P0.

### X-7 · `typeset` recomienda un suelo de 16 px que el sistema cerró en §4.5

`typeset.md` pide 16 px como suelo de cuerpo. El sitio tiene el cuerpo en 15 px y
57 rótulos en 11 px. **§4.5 declaró cerrados los rótulos en mayúsculas** con su
tracking, y el argumento es correcto para ese tamaño.

**Cómo se resuelve.** No se resuelve: se respeta la decisión cerrada. Queda
anotado en T-4 como dato medido y **sin propuesta**, porque la única propuesta
posible sería reabrir §4.5.

---

## Lo que esta auditoría no cubre

- **El admin**, por consigna.
- **La voz y la consistencia del copy**, que ya cubre `AUDITORIA-VOZ-SDM.md` y no
  se duplica aquí.
- **Los objetos `style` inline de JSX**, que el detector no lee y son la forma
  dominante de estilo en este proyecto.
- **El contraste de 20 elementos** sobre el degradado del hero y sobre `<img>`:
  medirlo exige muestrear píxeles del fondo real, que no se hizo.
- **Formularios enviados con error**: la heurística 9 quedó evaluada solo sobre lo
  verificable sin enviar datos reales.
- **Si alguien nota algo de esto.** No hay analítica en esta medición.
