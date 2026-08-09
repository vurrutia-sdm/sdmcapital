// Open Graph para las rutas ESTÁTICAS del sitio público.
//
// `<SEO>` escribe los meta desde el cliente, y un crawler que no ejecuta
// JavaScript ve solo el index.html: el título genérico. Las fichas y los
// artículos ya tenían su Pages Function; estas cuatro rutas no, así que
// /blog, /asociados, /quienes-somos y /servicios se compartían todas iguales.
//
// Se llama desde `functions/`, no desde el cliente: es el mismo truco que
// `seo-compartido.js` —módulo hoja, sin dependencias, sin nada del navegador—
// para no tener cuatro copias del mismo render.
//
// LOS TEXTOS SALEN DE `contenido_sitio` CUANDO HAY CLAVE, y si no, del mismo
// texto que usa `<SEO>` hoy. Así lo que ve el crawler y lo que ve el navegador
// dicen lo mismo, y editar desde el admin cambia los dos.
//
// El TÍTULO, en cambio, no sale de `contenido_sitio` aunque haya claves
// parecidas: `blog_titulo` vale «Blog SDM Capital» y es el encabezado de la
// página, no un meta title. Interpolarlo daría «Blog SDM Capital | SDM Capital».
// Los títulos se quedan con el texto que ya pasa `<SEO>`.

import { SITE_NAME, DEFAULT_OG_IMAGE } from './seo-compartido.js'

export const BOT_UA_REGEX =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|iMessage|curl/i

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Las claves de `contenido_sitio` son párrafos de página, no meta descriptions:
// `asociados_intro` son casi 300 caracteres. Se recorta en el último espacio
// antes del límite para no cortar una palabra por la mitad.
export function recortar(texto, max = 200) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  const corte = t.slice(0, max)
  const espacio = corte.lastIndexOf(' ')
  return (espacio > max * 0.6 ? corte.slice(0, espacio) : corte).trimEnd() + '…'
}

// Lee varias claves de `contenido_sitio` de una sola vez. Devuelve `{}` ante
// cualquier problema: quien llama usa sus valores por defecto y el crawler
// recibe igual unos meta correctos, solo que no editados desde el admin.
export async function leerContenido(supabaseUrl, anonKey, claves) {
  try {
    const lista = claves.map((c) => `"${c}"`).join(',')
    const res = await fetch(
      `${supabaseUrl}/rest/v1/contenido_sitio?select=clave,valor&clave=in.(${encodeURIComponent(lista)})`,
      { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } }
    )
    if (!res.ok) return {}
    const filas = await res.json()
    if (!Array.isArray(filas)) return {}
    const mapa = {}
    for (const f of filas) {
      if (f && typeof f.clave === 'string' && typeof f.valor === 'string' && f.valor.trim()) {
        mapa[f.clave] = f.valor
      }
    }
    return mapa
  } catch {
    return {}
  }
}

export function renderOgHtml({ title, description, image, url }) {
  const safeTitle = escapeHtml(`${title} | ${SITE_NAME}`)
  const safeDescription = escapeHtml(recortar(description))
  const safeImage = escapeHtml(image || DEFAULT_OG_IMAGE)
  const safeUrl = escapeHtml(url)

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta http-equiv="refresh" content="0;url=${safeUrl}" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDescription}" />

<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDescription}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDescription}" />
<meta name="twitter:image" content="${safeImage}" />

<link rel="canonical" href="${safeUrl}" />
</head>
<body>
<p>Redirigiendo a <a href="${safeUrl}">${safeTitle}</a>...</p>
</body>
</html>`
}
