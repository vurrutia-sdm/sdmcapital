// Derivación de URLs de miniatura.
//
// Las imágenes viven en R2 bajo https://imagenes.sdmcapital.cl. De cada archivo
// existe una variante de 400px de lado mayor bajo el prefijo `thumbs/`:
//
//   original:  https://imagenes.sdmcapital.cl/propiedades/xxx.jpg
//   miniatura: https://imagenes.sdmcapital.cl/thumbs/propiedades/xxx.jpg
//
// Se usa en tarjetas de catálogo y en las miniaturas de la galería. La imagen
// principal de una ficha, el carrusel del hero y cualquier vista a tamaño
// completo siguen usando el original.

const HOST_R2 = 'https://imagenes.sdmcapital.cl/'

/**
 * Devuelve la URL de la miniatura de 400px.
 * Si la URL no es de R2 —quedan algunas en Supabase Storage, como las de
 * `dossiers/` y el bucket `fichas-fotos`, que no se migraron— devuelve el
 * original sin tocar, para no fabricar una URL que daría 404.
 */
export function thumbUrl(url?: string | null): string {
  if (!url) return ''
  if (!url.startsWith(HOST_R2)) return url          // no es de R2: se deja igual
  if (url.startsWith(HOST_R2 + 'thumbs/')) return url // ya es miniatura
  return HOST_R2 + 'thumbs/' + url.slice(HOST_R2.length)
}

/**
 * URL para incrustar una imagen en un PDF de @react-pdf/renderer.
 *
 * El renderer descarga la imagen con fetch() y el bucket no manda
 * `access-control-allow-origin`, así que la petición directa a
 * imagenes.sdmcapital.cl la bloquea el navegador por CORS. Se enruta por
 * /api/imagen (mismo origen, ver functions/api/imagen.js) y se usa la variante
 * `thumbs/` de 400px: el PDF imprime la foto a 148pt de ancho, la original de
 * ~550 KB no aporta nada y multiplica el peso del archivo.
 *
 * Las URLs que no son de R2 —Supabase Storage, sobre todo— se devuelven tal
 * cual: no se pueden servir por el proxy y su CORS lo resuelve Supabase.
 */
export function imagenParaPDF(url?: string | null): string {
  if (!url) return ''
  if (!url.startsWith(HOST_R2)) return url
  const clave = thumbUrl(url).slice(HOST_R2.length)
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/api/imagen?k=${encodeURIComponent(clave)}`
}
