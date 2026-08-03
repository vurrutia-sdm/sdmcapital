// Sirve objetos de R2 desde el propio dominio del sitio.
//
// Por qué existe: el bucket se publica en imagenes.sdmcapital.cl, que NO manda
// cabecera `access-control-allow-origin`. Para una etiqueta <img> da igual —el
// navegador pinta la imagen sin pedir CORS—, pero @react-pdf/renderer descarga
// la imagen con fetch() para incrustarla en el PDF, y ahí el navegador sí exige
// CORS y la bloquea. Resultado: la foto de la propiedad no llegaba al PDF.
//
// Al pasar por acá la petición es del mismo origen que el admin, así que no hay
// CORS que negociar. Se lee con el binding `IMAGENES`, el mismo que usa subir.js.
//
// Si algún día se configura una regla CORS en el bucket, este proxy se puede
// borrar y `imagenParaPDF()` en src/lib/imagenes.ts vuelve a apuntar directo.

const CACHE_CONTROL = 'public, max-age=31536000, immutable'

// Mismos prefijos que subir.js, más `thumbs/`, que es de donde tira el PDF.
const PREFIJOS = ['thumbs/', 'propiedades/', 'blog/', 'equipo/', 'hero/', 'paginas/',
                  'servicios/', 'destinos/', 'asociados/', 'dossiers/', 'cotizaciones/',
                  'general/', 'rental/', 'vende/', 'fichas/']

function claveValida(clave) {
  if (typeof clave !== 'string' || !clave || clave.length > 300) return false
  if (clave.includes('..') || clave.startsWith('/') || clave.includes('//')) return false
  if (!/^[A-Za-z0-9/._-]+$/.test(clave)) return false
  return PREFIJOS.some((p) => clave.startsWith(p))
}

export async function onRequestGet({ request, env }) {
  if (!env.IMAGENES) return new Response('binding IMAGENES no configurado', { status: 500 })

  const clave = new URL(request.url).searchParams.get('k')
  if (!claveValida(clave)) return new Response('clave no permitida', { status: 400 })

  const objeto = await env.IMAGENES.get(clave)
  if (!objeto) return new Response('no encontrado', { status: 404 })

  const headers = new Headers()
  objeto.writeHttpMetadata(headers)
  headers.set('cache-control', CACHE_CONTROL)
  // El PDF se genera desde el mismo origen, pero la cabecera no estorba y deja
  // la puerta abierta a generarlo desde otro subdominio.
  headers.set('access-control-allow-origin', '*')

  return new Response(objeto.body, { headers })
}
