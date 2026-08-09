// Cloudflare Pages Function: Open Graph para /servicios
//
// Sin ella, un crawler que no ejecuta JS ve el index.html estático y comparte
// esta ruta con el título genérico del sitio, igual que las otras tres.
//
// Calcada del patrón de `functions/blog/[slug].js`: mismo filtro por
// user-agent, mismo escape de HTML, mismo `next()` ante cualquier problema.

import { BASE_URL } from '../src/lib/seo-compartido.js'
import { BOT_UA_REGEX, leerContenido, renderOgHtml } from '../src/lib/og-estatico.js'

const SUPABASE_URL_FALLBACK = 'https://ugfhgfpgxyfzafudxaeo.supabase.co'
const SUPABASE_ANON_KEY_FALLBACK =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZmhnZnBneHlmemFmdWR4YWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0OTIzNjUsImV4cCI6MjA5MzA2ODM2NX0.3l_7lcMIBz-RAwDYW7je9sIjY2iyVHixdxrBgP7bW6Q'

export async function onRequestGet(context) {
  const { request, env, next } = context
  if (!BOT_UA_REGEX.test(request.headers.get('user-agent') || '')) return next()

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL || SUPABASE_URL_FALLBACK
  const anon = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK

  try {
    const c = await leerContenido(supabaseUrl, anon, ['servicios_intro'])
    return new Response(renderOgHtml({
      title: 'Servicios',
      description: c.servicios_intro || 'Inversión inmobiliaria en Chile e internacional, financiamiento hipotecario y bancarización.',
      url: `${BASE_URL}/servicios`,
    }), {
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        'cache-control': 'public, max-age=300',
      },
    })
  } catch {
    return next()
  }
}
