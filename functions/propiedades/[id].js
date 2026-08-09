// Cloudflare Pages Function: Open Graph dinámico para /propiedades/:id
// Sirve meta tags específicas de la propiedad a crawlers (WhatsApp, Facebook, etc.)
// que no ejecutan JS, y deja pasar a usuarios reales hacia la SPA React.

// Un solo sitio para lo que el cliente y las Functions dicen igual.
import { SITE_NAME, BASE_URL, DEFAULT_OG_IMAGE } from '../../src/lib/seo-compartido.js'

// Anon key pública (la misma que va embebida en el bundle del cliente) usada
// como fallback si no se configuran variables de entorno en Cloudflare Pages.
const SUPABASE_URL_FALLBACK = 'https://ugfhgfpgxyfzafudxaeo.supabase.co'
const SUPABASE_ANON_KEY_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZmhnZnBneHlmemFmdWR4YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTIzNjUsImV4cCI6MjA5MzA2ODM2NX0.3l_7lcMIBz-RAwDYW7je9sIjY2iyVHixdxrBgP7bW6Q'

const BOT_UA_REGEX =
  /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slackbot|TelegramBot|Discordbot|iMessage|curl/i

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildDescription(prop) {
  const tipo = prop.tipo ? prop.tipo.charAt(0).toUpperCase() + prop.tipo.slice(1) : 'Propiedad'
  const segments = []

  if (prop.precio_uf != null) {
    segments.push(`UF ${Number(prop.precio_uf).toLocaleString('es-CL')}`)
  }

  const dormBano = [
    prop.dormitorios != null ? `${prop.dormitorios}D` : null,
    prop.banos != null ? `${prop.banos}B` : null,
  ]
    .filter(Boolean)
    .join('/')
  if (dormBano) segments.push(dormBano)

  segments.push(`${tipo} en ${prop.comuna}, ${prop.region}`)

  return segments.join(' · ')
}

function renderHtml(prop, pageUrl) {
  const title = `${prop.titulo || 'Propiedad'} | ${SITE_NAME}`
  const description = buildDescription(prop)
  const image = prop.imagen_principal || DEFAULT_OG_IMAGE

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

export async function onRequestGet(context) {
  const { request, params, env, next } = context
  const userAgent = request.headers.get('user-agent') || ''

  if (!BOT_UA_REGEX.test(userAgent)) {
    return next()
  }

  const slugOrId = params.id
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK

  try {
    const filterField = UUID_REGEX.test(slugOrId) ? 'id' : 'slug'
    const query =
      `${supabaseUrl}/rest/v1/propiedades` +
      `?${filterField}=eq.${encodeURIComponent(slugOrId)}` +
      `&select=titulo,descripcion,imagen_principal,precio_uf,dormitorios,banos,comuna,region,tipo,slug` +
      `&limit=1`

    const supaRes = await fetch(query, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    })

    if (!supaRes.ok) return next()

    const rows = await supaRes.json()
    const prop = Array.isArray(rows) ? rows[0] : null

    if (!prop) return next()

    // Links viejos con UUID → apuntar OG/canonical/refresh al slug actual
    const pageUrl = `${BASE_URL}/propiedades/${prop.slug || slugOrId}`

    return new Response(renderHtml(prop, pageUrl), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=300',
      },
    })
  } catch (err) {
    return next()
  }
}
