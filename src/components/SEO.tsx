import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

// Un solo sitio para lo que este componente y las Pages Functions tienen que
// decir igual. Antes la descripción por defecto estaba escrita acá y copiada a
// mano en las Functions, con un comentario pidiendo que no divergieran.
//
// El `.png` del og-image, de paso: og-image.jpg NUNCA existió en public/. El
// catch-all de la SPA lo disimulaba devolviendo index.html con status 200, así
// que el crawler pedía una imagen y recibía HTML.
import { BASE_URL as BASE, DEFAULT_OG_IMAGE as DEFAULT_IMG, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo-compartido.js'

export default function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Inversión Inmobiliaria Chile & Internacional`
  const desc = description || DEFAULT_DESCRIPTION
  const img = image || DEFAULT_IMG
  const canonical = url ? `${BASE}${url}` : BASE

  useEffect(() => {
    // Title
    document.title = fullTitle

    // Helper
    const setMeta = (sel: string, val: string, attr = 'content') => {
      let el = document.querySelector(sel) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        const [attrName, attrVal] = sel.replace('meta[', '').replace(']', '').split('=')
        el.setAttribute(attrName.trim(), attrVal.replace(/"/g, '').trim())
        document.head.appendChild(el)
      }
      el.setAttribute(attr, val)
    }

    setMeta('meta[name="description"]', desc)
    setMeta('meta[property="og:title"]', fullTitle)
    setMeta('meta[property="og:description"]', desc)
    setMeta('meta[property="og:image"]', img)
    setMeta('meta[property="og:url"]', canonical)
    setMeta('meta[property="og:type"]', type)
    setMeta('meta[name="twitter:title"]', fullTitle)
    setMeta('meta[name="twitter:description"]', desc)
    setMeta('meta[name="twitter:image"]', img)

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.rel = 'canonical'
      document.head.appendChild(link)
    }
    link.href = canonical
  }, [fullTitle, desc, img, canonical, type])

  return null
}
