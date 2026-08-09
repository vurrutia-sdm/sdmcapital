// Datos estructurados de fichas y artículos, para las Pages Functions.
//
// Módulo hoja, sin dependencias del navegador, igual que `seo-compartido.js` y
// `og-estatico.js`: lo importan las Functions, no el cliente.
//
// El `RealEstateAgent` de index.html NO SE TOCA y convive con estos. Son cosas
// distintas: aquel describe a la empresa —dirección, horario, coordenadas de la
// oficina— y estos describen el recurso de cada página. Van en bloques
// `<script type="application/ld+json">` separados, que es lo que corresponde:
// Google lee todos los bloques de la página y los une.
//
// ─── LO QUE NO SE EMITE, Y POR QUÉ ──────────────────────────────────────────
//
// `streetAddress` y `geo` quedan FUERA a propósito, aunque el dato exista.
//
// `map_address` está poblado en 79 de las 82 fichas y 64 de esos valores llevan
// número de calle —«Ana María Fresno 151», «El Cobre 539»—. Verificado en
// producción: ese texto NO aparece escrito en ninguna ficha; solo alimenta el
// mapa. Convertirlo en dato estructurado lo publicaría como texto legible por
// máquina e indexable, que es un escalón por encima de lo que hay hoy.
//
// Y hay un caso donde sería directamente una infracción: la ficha genérica
// `oficinas-arriendo-santiago-centro` existe para comunicar volumen SIN decir
// dónde está nada —es el acuerdo comercial de la sección 9— y su `map_address`
// dice «P.º Puente 598-504».
//
// `address` se queda con `addressLocality`, `addressRegion` y `addressCountry`,
// que están al 100 %, se muestran en cada tarjeta y en cada ficha, y no revelan
// ninguna calle.

import { SITE_NAME, BASE_URL, DEFAULT_OG_IMAGE } from './seo-compartido.js'

// Quita las claves cuyo valor está ausente, en profundidad.
//
// EL CERO NO ES SIEMPRE AUSENCIA, y por eso esto no filtra por `falsy`. Cero
// dormitorios o cero metros sí es «no hay dato» —lo tratamos antes de llegar
// acá—, pero una latitud de valor 0 sería un dato legítimo. La regla acá es
// literal: fuera `undefined`, `null`, cadena vacía y objeto sin claves.
export function limpiar(valor) {
  if (Array.isArray(valor)) {
    const arr = valor.map(limpiar).filter((v) => v !== undefined)
    return arr.length ? arr : undefined
  }
  if (valor && typeof valor === 'object') {
    const obj = {}
    for (const [k, v] of Object.entries(valor)) {
      const limpio = limpiar(v)
      if (limpio !== undefined) obj[k] = limpio
    }
    // `@type` solo no es un objeto con contenido
    return Object.keys(obj).filter((k) => k !== '@type').length ? obj : undefined
  }
  if (valor === null || valor === undefined) return undefined
  if (typeof valor === 'string' && !valor.trim()) return undefined
  return valor
}

// Convierte a número positivo o devuelve undefined.
// Acá SÍ el cero es ausencia: cero metros construidos o cero dormitorios es lo
// que trae una ficha que no cargó el dato, no una propiedad sin habitaciones.
function positivo(v) {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

function textoPlano(html, max = 600) {
  const t = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  const esp = corte.lastIndexOf(' ')
  return (esp > max * 0.6 ? corte.slice(0, esp) : corte) + '…'
}

// ─── PRECIO ──────────────────────────────────────────────────────────────────
//
// La UF TIENE CÓDIGO ISO 4217 PROPIO: `CLF`, Unidad de Fomento, distinto de
// `CLP`. Así que no hace falta convertir ni omitir: se declara en su moneda.
//
// No se calcula el equivalente en pesos a propósito. Exigiría el valor de la UF
// del día en cada build, quedaría obsoleto entre despliegues, y contradiría lo
// que la ficha muestra en pantalla.
//
// Las «a consultar» van SIN `offers`. Un `Offer` sin precio no aporta nada y un
// precio inventado sería peor que la ausencia.
function ofertaDe(prop) {
  if (prop.a_consultar) return undefined
  const uf = positivo(prop.precio_uf)
  const clp = positivo(prop.precio_clp)
  const usd = positivo(prop.precio_usd)
  let price, priceCurrency
  if (uf) { price = uf; priceCurrency = 'CLF' }
  else if (clp) { price = clp; priceCurrency = 'CLP' }
  else if (usd) { price = usd; priceCurrency = 'USD' }
  else return undefined

  // `vendida` y `arrendada` son cierres; el resto sigue ofreciéndose.
  const cerrada = prop.estado === 'vendida' || prop.estado === 'arrendada'
  return {
    '@type': 'Offer',
    price,
    priceCurrency,
    availability: cerrada
      ? 'https://schema.org/SoldOut'
      : prop.estado === 'reservada'
        ? 'https://schema.org/LimitedAvailability'
        : 'https://schema.org/InStock',
    url: undefined, // lo pone quien llama
  }
}

// ─── FICHA DE PROPIEDAD ──────────────────────────────────────────────────────
//
// DOS TIPOS EN UN MISMO NODO, y no es capricho: `RealEstateListing` extiende
// `WebPage`, así que hereda `name`, `description`, `url`, `image` y `offers`
// (esta última desde `CreativeWork`) pero NO define `floorSize`,
// `numberOfBedrooms`, `numberOfBathroomsTotal` ni `address`. Esas vienen de
// `Accommodation` y de `Place`. Declarar los dos tipos hace que todas las
// propiedades sean válidas en su tipo, en vez de colgar campos de un tipo que
// no los define.
//
// Se descartó `Product`: da resultado enriquecido con precio, pero Google lo
// documenta para retail y un inmueble no lo es. Usar el tipo equivocado para
// conseguir una estrella es peor negocio que no tenerla.
export function schemaPropiedad(prop, pageUrl) {
  const oferta = ofertaDe(prop)
  if (oferta) oferta.url = pageUrl

  const ficha = {
    '@type': ['RealEstateListing', 'Accommodation'],
    '@id': pageUrl,
    url: pageUrl,
    name: prop.titulo || undefined,
    description: textoPlano(prop.descripcion),
    image: prop.imagen_principal || DEFAULT_OG_IMAGE,
    floorSize: positivo(prop.superficie_total)
      ? { '@type': 'QuantitativeValue', value: positivo(prop.superficie_total), unitCode: 'MTK' }
      : undefined,
    // `numberOfBedrooms` y no `numberOfRooms`: el dato es dormitorios, y
    // `numberOfRooms` cuenta TODAS las habitaciones. Decir «3 habitaciones»
    // donde el dato son 3 dormitorios sería inventar.
    numberOfBedrooms: positivo(prop.dormitorios),
    numberOfBathroomsTotal: positivo(prop.banos),
    address: {
      '@type': 'PostalAddress',
      addressLocality: prop.comuna || undefined,
      addressRegion: prop.region || undefined,
      addressCountry: prop.pais || 'Chile',
    },
    offers: oferta,
  }

  return [limpiar(ficha), migaDePan([
    ['Inicio', BASE_URL + '/'],
    ['Propiedades', BASE_URL + '/propiedades'],
    [prop.titulo, pageUrl],
  ])]
}

// ─── ARTÍCULO ────────────────────────────────────────────────────────────────
export function schemaArticulo(post, pageUrl) {
  const art = {
    '@type': 'BlogPosting',
    '@id': pageUrl,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    headline: post.titulo || undefined,
    // Solo 2 de los 13 tienen `resumen`; para el resto sale del contenido, que
    // es lo mismo que ya hace la meta description de esta Function.
    description: textoPlano(post.resumen || post.contenido, 300) || undefined,
    image: post.imagen_portada || DEFAULT_OG_IMAGE,
    datePublished: post.created_at || undefined,
    dateModified: post.updated_at || post.created_at || undefined,
    articleSection: post.categoria || undefined,
    author: post.autor_nombre ? { '@type': 'Person', name: post.autor_nombre } : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${BASE_URL}/logo-sdm.png` },
    },
  }

  return [limpiar(art), migaDePan([
    ['Inicio', BASE_URL + '/'],
    ['Blog', BASE_URL + '/blog'],
    [post.titulo, pageUrl],
  ])]
}

// ─── MIGA DE PAN ─────────────────────────────────────────────────────────────
//
// Dos niveles más el propio recurso, reflejando la navegación real. NO se mete
// la categoría del artículo como nivel intermedio: no existe una ruta
// `/blog/categoria/:x`, y un breadcrumb que apunta a una URL inexistente es peor
// que uno corto.
function migaDePan(niveles) {
  const items = niveles
    .filter(([nombre]) => nombre && String(nombre).trim())
    .map(([nombre, url], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: String(nombre),
      item: url,
    }))
  return { '@type': 'BreadcrumbList', itemListElement: items }
}

// ─── SALIDA ──────────────────────────────────────────────────────────────────
//
// EL ESCAPE NO SE HACE A MANO. Los valores los escribe Víctor desde el admin y
// un título con comillas rompería el JSON, así que el objeto se construye en JS
// y se serializa con `JSON.stringify()`, que escapa comillas, saltos y barras
// por definición.
//
// El único caso que `JSON.stringify` NO cubre es la cadena `</script>` dentro de
// un valor: el navegador cerraría el bloque ahí mismo. Se rompe la secuencia con
// una barra escapada, que en JSON sigue siendo el mismo texto.
export function bloqueJsonLd(objetos) {
  const lista = objetos.filter(Boolean)
  if (!lista.length) return ''
  const grafo = lista.length === 1
    ? { '@context': 'https://schema.org', ...lista[0] }
    : { '@context': 'https://schema.org', '@graph': lista }
  const json = JSON.stringify(grafo).replace(/<\/script/gi, '<\\/script')
  return `<script type="application/ld+json">${json}</script>`
}
