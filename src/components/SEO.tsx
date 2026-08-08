import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
}

const BASE = 'https://sdmcapital.cl'
const DEFAULT_IMG = `${BASE}/og-image.jpg`
const SITE_NAME = 'SDM Capital'

export default function SEO({ title, description, image, url, type = 'website' }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Inversión Inmobiliaria Chile & Internacional`
  const desc = description || 'Tu socio confiable en bienes raíces. Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el mundo.'
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
