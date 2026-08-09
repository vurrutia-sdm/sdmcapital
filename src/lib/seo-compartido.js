// Constantes de SEO que comparten el cliente y las Pages Functions.
//
// POR QUÉ EXISTE ESTE ARCHIVO, Y POR QUÉ ES `.js` SIN TIPOS
//
// `<SEO>` escribe los meta desde el cliente; las Functions los escriben en el
// HTML para los crawlers que no ejecutan JavaScript. Los dos tienen que decir
// exactamente lo mismo, y hasta ahora la descripción por defecto estaba copiada
// a mano en los dos sitios con un comentario pidiendo que no divergieran.
//
// Los dos lados corren en runtimes distintos —el bundle de Vite y el Worker de
// Cloudflare— pero los dos se compilan con esbuild, así que un módulo hoja sin
// dependencias se puede importar desde ambos. Va en `.js` y sin `import type`
// para que no dependa del pipeline de TypeScript del cliente: las Functions se
// bundean por su cuenta y cuanto menos tengan que resolver, mejor.
//
// NO agregar nada que importe React, `@/…` ni nada del navegador. Este archivo
// tiene que poder cargarse en un Worker.

export const SITE_NAME = 'SDM Capital'
export const BASE_URL = 'https://sdmcapital.cl'
export const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`

export const DEFAULT_DESCRIPTION =
  'Tu socio confiable en bienes raíces. Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y Paraguay.'
