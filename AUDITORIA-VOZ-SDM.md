# Auditoría de voz de marca — sdmcapital.cl

**agosto 2026 · medido contra `GUIA-DE-VOZ-SDM.md`**

Fuente: `copy-sdm.md`, extracción literal de 22 rutas, 6 componentes comunes y
las 146 claves de `contenido_sitio`. Sin cambios aplicados.

---

## Resumen

**La voz existe y en algunos puntos es muy buena.** «Tú solo recibes los
resultados», «¿El banco te dijo no?», «Resultado en aprox. 5 días hábiles» y el
estado vacío del catálogo son copy de alguien que sabe escribir: directo,
concreto y en tuteo consistente. El tuteo no se rompe **en ninguna** de las 22
rutas, ni siquiera en las páginas legales, lo cual es raro y es un acierto.

**El problema no es el tono, son las contradicciones.** El sitio dice que tiene
15 años en el home y 20 en otras dos páginas. Enuncia su única política comercial
de cinco formas distintas. Usa tres razones sociales, y la que aparece junto a
los datos bancarios no coincide con la de la política de privacidad. Y en las dos
páginas donde debería demostrar por qué elegirlo —Quiénes Somos y Asociados—
escribe en el registro corporativo genérico que es exactamente lo que no lo
distingue de las corredoras grandes.

**5 hallazgos altos · 12 medios · 4 bajos · 5 avisos legales.**

---

## Hallazgos

### Severidad alta

| # | Hallazgo | Dónde | Sugerencia |
|---|---|---|---|
| A1 | **La trayectoria se contradice: 15 años contra 20.** El home dice «Más de 15 años» y `stats_anios` = 15. Rental titula «20 años de experiencia a tu servicio» y dice «más de 20 años en el sector comercial bancario e inmobiliario». Vende con nosotros: «más de 20 años de experiencia». Un visitante que recorre dos páginas ve dos empresas distintas | `hero_subtitulo`, `stats_anios`, `qs_historia_2`, `qs_subtitulo` · `rental_quienes_titulo`, `rental_quienes_somos` · `vende_hero_subtitulo`, `vende_pilar1_desc` | Fijar **un número** y propagarlo. Si los 20 son de Roberto en banca y los 15 de la empresa, decirlo así explícitamente |
| A2 | **La única política comercial, escrita de cinco formas.** «Sin pagos adelantados» · «Sin pagos adelantados en ninguna etapa. Si la compra la haces por fuera, la gestión sí se cobra» · «Sin costos ocultos, sin pagos adelantados» · «Sin cobros anticipados» · «La gestión no tiene costo si compras con SDM». Es la línea roja del negocio y no tiene redacción canónica | `financiamiento_body`, `financiamiento_condicion`, `servicio_fin_per_desc`, `QuienesSomosPage:16`, `EvaluacionGratuitaPage:18,23` | Aplicar la redacción canónica de la guía §8. Eliminar «cobros anticipados» como variante |
| A3 | **Tres razones sociales, y la del dinero no coincide.** El modal de reserva dice «SDM Capital Real Estate» junto al número de cuenta; la política de privacidad dice «SDM Capital SpA»; `empresa_nombre` dice «SDM Capital». Quien va a transferir compara el titular con lo que dice el sitio | `ReservaModal:23` · `paginas_legales` · `empresa_nombre` | Fijar la razón social pública. En el modal de reserva debe coincidir **exactamente** con el titular de la cuenta bancaria |
| A4 | **El eje declarado y el eje escrito no coinciden.** El negocio principal es corretaje, pero el sitio se posiciona como inversión: el kicker del hero dice «Inversión inmobiliaria · Chile», el `<title>` dice «Inversión Inmobiliaria Chile & Internacional», y Quiénes Somos abre con «especializada en inversión inmobiliaria y gestión de financiamiento». La palabra «corredora» no aparece en ninguna parte del copy | `hero_kicker`, `HomePage:420`, `qs_subtitulo`, `qs_historia_1` | Decidir si el posicionamiento cambia o si el copy se alinea al negocio |
| A5 | **Quiénes Somos y Asociados están escritas en corporativo genérico.** «Red selecta de socios estratégicos», «el mejor servicio integral», «referentes en gestión», «democratizar el acceso», «equipo de expertos comprometidos», «compromiso con la excelencia en el servicio». Son las dos páginas donde se juega la confianza, y suenan igual que cualquier competidor | `AsociadosPage:61,77,95,107` · `qs_historia_1,2,3`, `QuienesSomosPage:16-18,27` | Reescribir con hechos: con quiénes se trabaja, desde cuándo, qué pasa en cada etapa |

### Severidad media

| # | Hallazgo | Dónde | Sugerencia |
|---|---|---|---|
| M1 | Dos taglines distintos en dos claves: «Tu socio confiable en bienes raíces.» y «Tu socio confiable en el mundo de los bienes raíces.» | `footer_tagline` · `tagline` | Fijar uno y borrar el otro |
| M2 | El alcance geográfico cambia según la página: «Chile» en el kicker, «Chile & Internacional» en el título, «Chile y Paraguay» en Quiénes Somos y el blog | `hero_kicker` · `HomePage:420` · `qs_subtitulo` · `blog_subtitulo` | Una sola formulación |
| M3 | Los CTA conviven con y sin flecha: «Enviar →», «Leer artículo →», «Quiero vender mi propiedad →» contra «Ver disponibilidad», «Reservar esta propiedad», «Solicita tu preevaluación gratuita» | `ContactSection:89`, `BlogPreviewSection:54,78,102`, `VendeConNosotrosPage:216` · `banner_cta_texto`, `financiamiento_cta`, `PropiedadDetailPage:852` | Quitar todas las flechas (guía §5) |
| M4 | El mismo enlace, dos capitalizaciones: «Vende con Nosotros» en la página, «Vende con nosotros» en cabecera y pie | `VendeConNosotrosPage:95,89` · `Header:224` · `Footer:196` | Minúscula, salvo nombres propios |
| M5 | Dos mensajes de error de envío: «Error al enviar. Intenta de nuevo.» y «Ocurrió un error al enviar la solicitud. Intenta nuevamente.» | `ContactSection:85`, `VendeConNosotrosPage:211` · `SolicitudCreditoForm:207` | Una formulación (guía §9) |
| M6 | Dos formas de decir que no hay precio: «A consultar» y «Precio a consultar.» | `PropiedadesPage:311`, `PropiedadDetailPage:542` · `PropiedadDetailPage:393` | Unificar |
| M7 | Quiénes Somos repite literalmente el titular del home: «Tu socio confiable en bienes raíces» | `qs_titulo` = `hero_titulo_1..3` | La página necesita su propio titular |
| M8 | Bilingüe parcial: Quiénes Somos, Asociados, el showcase de El Barranco y las páginas legales tienen versión en inglés; las otras 18 rutas no | `QuienesSomosPage`, `AsociadosPage`, `ElBarrancoShowcase`, `paginas_legales` | Decidir si el sitio es bilingüe o si el inglés es solo para El Barranco |
| M9 | Vende con nosotros tiene 14 claves sin fila en `contenido_sitio`: todo su texto cae al valor por defecto del código y no se puede editar desde el panel | `vende_*` | Sembrar las filas o quitar el mecanismo |
| M10 | `stats_clientes` = 500 está en la tabla y no se muestra en ninguna parte del sitio | `stats_clientes` | Publicarlo o borrarlo |
| M11 | Seis de los ocho espacios de testimonio están vacíos | `testimonial_3..8_*` | Llenarlos o reducir el componente a dos |
| M12 | «Quiénes Somos» se usa como nombre de una sección dentro de Rental, y también es una página del sitio | `RentalPage:78` | Renombrar la sección de Rental |

### Severidad baja

| # | Hallazgo | Dónde | Sugerencia |
|---|---|---|---|
| B1 | «Intenta de nuevo» y «Intenta nuevamente» conviven | `ContactSection:85` · `SolicitudCreditoForm:207` | Elegir una |
| B2 | Puntos suspensivos con dos caracteres distintos: «Cargando…» contra «Verificando pago...» | `PropiedadDetailPage:371` · `ReservaConfirmacionPage:57` | Usar `…` siempre |
| B3 | Los servicios usan Title Case: «Financiamiento Personas», «Inversión en Chile», «Bancarización en el Extranjero» | `servicio_*_titulo` | Minúscula salvo nombre propio |
| B4 | «Solicita una evaluación gratuita» en Servicios contra «Solicita tu preevaluación gratuita» en el home: dos nombres para lo mismo | `ServiciosPage:101` · `financiamiento_cta` | Un solo nombre para el trámite |

---

## Reescrituras propuestas

### A2 · La política de pagos

**Hoy** (cinco versiones, esta es la más completa):
> Sin pagos adelantados en ninguna etapa. Si la compra la haces por fuera, la gestión sí se cobra.

**Propuesta canónica**:
> Sin pagos adelantados. La gestión de financiamiento no tiene costo si compras
> con SDM. Si la compra la haces por fuera, la gestión sí se cobra, y solo cuando
> el crédito está aprobado.

---

### A5 · Quiénes Somos — el bloque de historia

**Hoy**:
> SDM Capital nació con una visión clara: democratizar el acceso a inversiones
> inmobiliarias de calidad para personas y empresas en Chile.
>
> Hoy somos referentes en gestión de financiamiento y asesoría inmobiliaria, con
> un equipo de expertos comprometidos con los resultados de cada cliente.

**Propuesta** *(los datos concretos los completas tú)*:
> SDM Capital nació para que comprar una propiedad no dependa de saber moverse
> entre bancos.
>
> Somos corredora y gestionamos el financiamiento en la misma operación. Eso
> significa que cuando encuentras la propiedad, la carpeta del crédito ya está
> avanzando.

---

### A5 · Asociados — la introducción

**Hoy**:
> Trabajamos con una red selecta de socios estratégicos que nos permiten ofrecer
> a nuestros clientes el mejor servicio integral en cada etapa del proceso
> inmobiliario y financiero.

**Propuesta**:
> Trabajamos con bancos, notarías, tasadores y portales inmobiliarios. Cada uno
> cubre una etapa: el crédito, la escritura, la tasación, la difusión.

---

### M3 · Los llamados a la acción

| Hoy | Propuesta |
|---|---|
| Enviar → | Enviar |
| Leer artículo → | Leer artículo |
| Quiero vender mi propiedad → | Quiero vender mi propiedad |
| Ver todos los artículos → | Ver todos los artículos |
| Solicita una evaluación gratuita → | Solicita tu preevaluación gratuita |

---

## Avisos legales y de cumplimiento

Se listan aparte porque no son de estilo. **Ninguno es una opinión sobre el
negocio: son formulaciones que comprometen a SDM a un resultado que no controla.**

| # | Aviso | Dónde | Riesgo |
|---|---|---|---|
| L1 | **«Garantizar una venta ágil, segura y al mejor precio.»** Garantía explícita sobre precio y plazo en una operación que depende del mercado | `vende_hero_subtitulo` | Promesa de resultado sobre una transacción de alto monto |
| L2 | **«Juntos garantizamos una experiencia completa: desde la búsqueda de la propiedad hasta la obtención del financiamiento.»** Garantiza la obtención del crédito, que decide el banco | `AsociadosPage:107` | Compromete la aprobación crediticia |
| L3 | **«Resultado en aprox. 5 días hábiles.»** Plazo publicado para un trámite que depende de terceros. El «aprox.» ayuda pero no lo convierte en estimación | `EvaluacionGratuitaPage:22` | Expectativa de plazo en servicio financiero |
| L4 | **«El mejor servicio integral»** — superlativo sin criterio ni respaldo | `asociados_intro`, `AsociadosPage:61` | Afirmación comparativa no sustentada |
| L5 | **Cifras sin fuente**: 120 propiedades, 500 clientes, 15 años, 2 países. Ninguna aparece con periodo ni criterio de medición | `stats_*` | Cada una debe poder respaldarse si un cliente la pregunta |

**Lo que sí está bien resuelto**: los dos testimonios llevan nombre, ciudad y
enlace a la publicación original de Instagram, que es atribución verificable. Las
comisiones de Rental se publican con su base de cálculo (50% de un mes de
arriendo, 7% mensual), sin ambigüedad. Y la política de privacidad declara el uso
del asistente automatizado y el derecho a pedir atención humana, que es más de lo
que hace la mayoría.

---

## Lo que no cubre esta auditoría

- **El admin.** Fuera del alcance del copy extraído.
- **El contenido por pieza**: artículos del blog, títulos y descripciones de cada
  propiedad, fichas de equipo. Vive en la base y cambia con el inventario, así
  que necesita su propia revisión.
- **Sofía.** El agente de WhatsApp tiene su propio prompt en otro repositorio y
  es, en volumen, la voz de la marca que más gente lee.
- **Si alguien nota estas contradicciones.** No hay analítica en esta medición.
