# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Dos usuarios principales, con el mismo peso.** No se elige uno: el sitio tiene
que servir a los dos, y las **mismas fichas** tienen que responder a los dos
criterios de decisión.

| | decide con |
|---|---|
| **Quien compra para invertir** | Números: UF, bono pie, dividendo, rentabilidad |
| **Quien compra para vivir** | Comuna, metros, dormitorios y fotos |

El de inversión suele tener capacidad de crédito y decide con calculadora. El de
vivienda decide por el inmueble; el financiamiento le preocupa pero no lo domina.

**Públicos reales pero secundarios en el diseño del sitio:** propietarios que
venden, propietarios que arriendan (SDM Rental) y quienes llegan buscando el
crédito antes que la propiedad.

## Product Purpose

SDM Capital (SDM Capital SpA) es una empresa chilena de **inversión inmobiliaria
y gestión de financiamiento**. Conecta personas con propiedades y les consigue el
crédito hipotecario para comprarlas.

El sitio existe para que un comprador —de inversión o de vivienda— encuentre la
propiedad y dé el paso siguiente: contactar, reservar o pedir la evaluación
hipotecaria. Si el visitante se va sin actuar, el sitio falló.

## Positioning

Cuatro afirmaciones, **en este orden de peso**, y encadenadas: la 1 es la raíz,
de ella sale la 2, la 2 hace posible la 3, y la 4 es alcance.

1. **Venimos de la banca.** +20 años **dentro** del banco, no frente a él: se
   sabe cómo se evalúa una carpeta y ante qué banco presentarla.
2. **Compra y financiamiento en la misma casa.** El mismo equipo consigue la
   propiedad y el crédito.
3. **Sin pagos adelantados, nunca.** Se cobra contra resultado, en ningún caso
   antes. El riesgo lo toma SDM.
4. **La cartera y la red de socios.** Acceso a proyectos, oficinas y unidades que
   no están en los portales, más asociados para cada etapa.

**La frontera exacta:** un corredor vecino puede decir «te ayudamos con el
crédito». No puede decir que viene de la banca, ni que gestiona el crédito sin
cobrarlo cuando la compra es con él.

## Operating Context

- **Catálogo** de propiedades con precio en UF, bono pie, dividendo estimado,
  comuna, metros y dormitorios. Dos ejes **ortogonales** que no deben fundirse:
  `estado` (en venta / en arriendo / vendida / reservada / arrendada) y
  `categoria` (usada / proyecto nuevo). Una propiedad puede ser nueva **y** estar
  en arriendo.
- **«Proyectos Nuevos» es una vitrina comercial**, no una categoría de
  inventario: excluye arriendos. «Propiedades Usadas» sí es categoría y los
  incluye.
- **WhatsApp es canal real de primer contacto**, atendido en su etapa inicial por
  un asistente automatizado (Sofía) que deriva a un asesor. Está declarado en la
  política de privacidad.
- **Reserva por transferencia bancaria.** El pago en línea (Flow) está
  desactivado.
- **Panel de administración** usado hoy por **una sola persona**, en escritorio y
  con ratón.
- Oficina: **Av. Apoquindo 5583, Las Condes, Santiago.** Lunes a viernes,
  09:00–18:00.
- Blog propio y red de asociados como superficies de respaldo.

## Capabilities and Constraints

- **22 rutas públicas** más el panel de administración tras sesión de Supabase.
- El contenido editable vive en Supabase: `contenido_sitio` (146 claves),
  `paginas_legales`, `blog_posts`, `propiedades`. Cambiar esos textos **no
  requiere deploy**; el texto escrito en componentes sí.
- **82 propiedades activas** en el inventario a la fecha de este registro.
- Imágenes en R2 (`imagenes.sdmcapital.cl`). Despliegue en Cloudflare Pages.
- **Vocabulario del rubro que el sitio ya usa y debe respetar:** UF, bono pie,
  dividendo, comuna, corredora, escritura, estudio de títulos, Conservador de
  Bienes Raíces, tasación, subsidio, leasing habitacional, FOGAES.

### Honorarios — política confirmada

- **Comisión de corredora: 2 %**, declarada en las fichas de propiedad.
- **La gestión del crédito no se cobra si el cliente compra con SDM** (propiedad
  nueva o usada). Si compra por fuera, **sí se cobra**.
- **Sin pagos adelantados en ninguna etapa.**
- **UNDECIDED:** el *momento* del cobro cuando el cliente compra por fuera. «Éxito
  de la gestión» (el banco aprueba) y «éxito de la operación» (la compra se
  cierra) no son lo mismo, y entre ambas fechas el cliente puede echarse atrás.
  Los textos vigentes dicen «contra el resultado» y **no deben inventar el
  momento** hasta que se defina.
- Las tres superficies que declaran honorarios se cambian juntas o ninguna:
  `contenido_sitio` (Inicio), el modal de solicitud de crédito y la página de
  evaluación gratuita.

## Brand Commitments

- Nombre: **SDM Capital** / SDM Capital SpA.
- Tagline vigente: **«Tu socio confiable en el mundo de los bienes raíces.»**
- **Roberto Urrutia, Director Comercial, +20 años en banca**, nombrado en el sitio
  como prueba de la posición 1. Los +20 años son **suyos**, no la trayectoria de
  la empresa; no deben mezclarse con los 15 años de SDM.
- **Voz: tuteo, español de Chile.** Nunca voseo.
- **El Barranco** (Hotel + Restaurante, Futaleufú) es una propiedad en
  exclusiva con **paleta y tipografía propias, deliberadamente distintas de las de
  SDM**, y su propio showcase. Esa separación es intencional y se mantiene.
- El pie de página acredita a **HaikuFlow** como desarrollador.

## Evidence on Hand

**Real y disponible:** 82 propiedades activas con fotografía propia; 13 artículos
de blog publicados; testimonios de clientes cargados en `contenido_sitio`; red de
asociados; el showcase de El Barranco.

**Cifras aprobadas para publicar** (confirmadas por Víctor):

| cifra | valor |
|---|---|
| Años de trayectoria de la empresa | **15** |
| Propiedades | **120** (acumulado, no el inventario actual de 82) |
| Clientes | **500** |
| Países | **2** — Chile y Paraguay |

**La operación en Paraguay está confirmada.** `stats_paises = 2` se sostiene, y
las menciones vigentes son correctas: el kicker del hero, `servicios_intro`
—«tanto en Chile como en Paraguay»— y la descripción SEO del inicio. **No hay que
cambiar nada en el sitio por este motivo.**

> El proyecto Supabase `sdm-paraguay` figura como `INACTIVE`, y **eso no lo
> contradice**: es infraestructura sin usar, no ausencia de operación. Quien
> vuelva a cruzar ese dato con el sitio no debe deducir de ahí que la cifra
> sobra — el error ya se cometió una vez.
>
> *Corregido el 2026-08-10.* Este documento registró Paraguay como no confirmado
> por un fallo al recoger la respuesta de Víctor sobre las cuatro cifras: las
> cuatro estaban aprobadas y solo se anotaron tres. La afirmación viajó desde
> aquí a `AUDITORIA-IMPECCABLE.md`, que la levantó como hallazgo P1.

**No inventar:** no hay benchmarks, premios, prensa, certificaciones ni precios de
servicio documentados más allá de lo anterior.

## Product Principles

1. **Una ficha, dos lecturas.** Cada propiedad tiene que responder a la vez al
   que decide con rentabilidad y al que decide con dormitorios. Optimizar la
   ficha para uno a costa del otro es romper la mitad del negocio.
2. **La banca es la raíz de todo lo que se promete.** Cada afirmación del sitio
   —integración, cobro contra resultado, acceso a cartera— debe poder rastrearse
   hasta ahí. Una promesa que no llegue a esa raíz es una promesa que un corredor
   vecino puede copiar.
3. **Se cobra contra resultado. Nada por adelantado.** Es política, no argumento
   de venta, y ninguna superficie puede sugerir lo contrario ni precisar un
   momento de cobro que todavía no está definido.
4. **Ninguna cifra se publica sin respaldo.** Las que están aprobadas, arriba.
   Las que no, no se usan aunque el hueco quede vacío.
5. **La accesibilidad es requisito, no mejora.** Ver abajo.

## Accessibility & Inclusion

Compromiso establecido y sostenido en el sitio público, verificable en el
historial del proyecto: contraste medido contra WCAG 2.1 AA (4,5:1 en texto,
3:1 en límites de control), nombres accesibles en todos los campos, indicadores
de foco que no dependen solo del tono, área táctil mínima de 24×24 y modales con
foco atrapado y devuelto.

**Excepción aceptada a sabiendas, y solo en el panel de administración:** el
reordenamiento de listas funciona con arrastre y no con teclado, lo que incumple
WCAG 2.1.1. Se aceptó porque es una pantalla interna que hoy usa una sola
persona con ratón. **Si el panel pasa a usarlo más de una persona, o alguien que
no puede usar ratón, hay que revertirlo.**
