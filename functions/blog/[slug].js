// Cloudflare Pages Function: Open Graph dinámico para /blog/:slug
// Sirve meta tags específicas del artículo a crawlers (WhatsApp, Facebook, etc.)
// que no ejecutan JS, y deja pasar a usuarios reales hacia la SPA React.
//
// Calcada de functions/propiedades/[id].js, que resuelve exactamente el mismo
// problema para las fichas. Mismo patrón, misma forma de consultar Supabase,
// mismo escape de HTML.
//
// Por qué hace falta: `<SEO>` escribe los meta desde el cliente, y un crawler
// que no ejecuta JavaScript ve solo el index.html estático — o sea el título
// genérico del sitio. Los trece artículos se compartían iguales.

// Un solo sitio para lo que el cliente y las Functions tienen que decir igual.
// Antes la descripción estaba copiada a mano acá con un comentario pidiendo que
// no divergiera de `src/components/SEO.tsx`.
import { SITE_NAME, BASE_URL, DEFAULT_OG_IMAGE, DEFAULT_DESCRIPTION } from '../../src/lib/seo-compartido.js'
import { BUSCADOR_UA_REGEX, reescribirCabecera } from '../../src/lib/og-estatico.js'
import { schemaArticulo, bloqueJsonLd } from '../../src/lib/schema.js'

// Anon key pública (la misma que va embebida en el bundle del cliente) usada
// como fallback si no se configuran variables de entorno en Cloudflare Pages.
const SUPABASE_URL_FALLBACK = 'https://ugfhgfpgxyfzafudxaeo.supabase.co'
const SUPABASE_ANON_KEY_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZmhnZnBneHlmemFmdWR4YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTIzNjUsImV4cCI6MjA5MzA2ODM2NX0.3l_7lcMIBz-RAwDYW7je9sIjY2iyVHixdxrBgP7bW6Q'

const BOT_UA_REGEX =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|iMessage|curl/i

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderHtml(post, pageUrl) {
  // El español, igual que la Function de propiedades: no tiene criterio de
  // idioma y `titulo_en` / `resumen_en` vienen en null en las trece filas.
  const title = `${post.titulo || 'Artículo'} | ${SITE_NAME}`
  const description = post.resumen || DEFAULT_DESCRIPTION
  const image = post.imagen_portada || DEFAULT_OG_IMAGE

  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeImage = escapeHtml(image)
  const safeUrl = escapeHtml(pageUrl)

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
<meta property="og:type" content="article" />
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

export async function onRequestGet(context) {
  const { request, params, env, next } = context
  const userAgent = request.headers.get('user-agent') || ''

  if (!BOT_UA_REGEX.test(userAgent) && !BUSCADOR_UA_REGEX.test(userAgent)) {
    return next()
  }

  const slug = params.slug
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK

  try {
    // `publicado=eq.true` explícito y no confiando solo en RLS: desde fuera no
    // se puede distinguir «RLS filtra los borradores» de «no hay borradores»,
    // y un artículo sin publicar no debe filtrarse por el previsualizador de
    // WhatsApp.
    const query =
      `${supabaseUrl}/rest/v1/blog_posts` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&publicado=eq.true` +
      `&select=titulo,resumen,imagen_portada,slug` +
      `&limit=1`

    const supaRes = await fetch(query, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })

    if (!supaRes.ok) return next()

    const rows = await supaRes.json()
    const post = Array.isArray(rows) ? rows[0] : null

    // Sin post no se revienta: pasa al index.html y el SPA muestra su propio
    // "Artículo no encontrado".
    if (!post) return next()

    const pageUrl = `${BASE_URL}/blog/${post.slug || slug}`

    // El buscador recibe el index.html REAL con la cabecera reescrita, no el
    // documento mínimo: ese lleva un `meta refresh` a su propia URL y diez
    // palabras de cuerpo. Ver la nota de los dos filtros en `og-estatico.js`.
    if (BUSCADOR_UA_REGEX.test(userAgent)) {
      return reescribirCabecera(await next(), {
        jsonLd: bloqueJsonLd(schemaArticulo(post, pageUrl)),
        title: post.titulo || 'Artículo',
        description: post.resumen || DEFAULT_DESCRIPTION,
        image: post.imagen_portada,
        url: pageUrl,
      })
    }

    return new Response(renderHtml(post, pageUrl), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=300',
      },
    })
  } catch (err) {
    return next()
  }
}
