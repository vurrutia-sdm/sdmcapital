// Markup compartido (preview React + ventana de impresión) — diseño "Bone Minimal" validado.
// Todas las clases usan el prefijo sdm- (ver tarjeta.css).

export const TARJETA_DEFAULTS = {
  direccion: 'Badajoz 100, of. 1014, Las Condes',
  web: 'www.sdmcapital.cl',
}

export type TarjetaDatos = {
  nombre?: string | null
  cargo?: string | null
  telefono?: string | null
  email?: string | null
  direccion?: string | null
  web?: string | null
}

export const esc = (s?: string | null) =>
  (s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

const IC = {
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
}

const MONO =
  '<div class="sdm-mono"><div class="sdm-sdm">SDM</div><div class="sdm-bars"><i></i><i></i><i></i></div><div class="sdm-cap">CAPITAL</div></div>'

export function frontHTML(d: TarjetaDatos) {
  const direccion = d.direccion?.trim() || TARJETA_DEFAULTS.direccion
  const web = d.web?.trim() || TARJETA_DEFAULTS.web
  const filas = [
    d.telefono?.trim() ? `<div class="sdm-ci">${IC.phone}<span>${esc(d.telefono)}</span></div>` : '',
    d.email?.trim()    ? `<div class="sdm-ci">${IC.mail}<span>${esc(d.email)}</span></div>`    : '',
    `<div class="sdm-ci">${IC.pin}<span>${esc(direccion)}</span></div>`,
    `<div class="sdm-ci">${IC.globe}<span>${esc(web)}</span></div>`,
  ].filter(Boolean).join('')

  return `<div class="sdm-face sdm-f2">
  <div class="sdm-left">${MONO}<div class="sdm-kick">Real Estate</div></div>
  <div class="sdm-rule"></div>
  <div class="sdm-right">
    <div class="sdm-nm"><div class="sdm-name">${esc(d.nombre)}</div><div class="sdm-title">${esc(d.cargo)}</div></div>
    <div class="sdm-contacts">${filas}</div>
  </div>
</div>`
}

export function backHTML() {
  return `<div class="sdm-face sdm-f2b">
  <div class="sdm-barmini"><i></i><i></i><i></i></div>
  <div class="sdm-monoxl">${MONO}</div>
  <div class="sdm-tag">Tu socio confiable en bienes raíces</div>
</div>`
}

/** 8 marcas de corte (2 por esquina) para la página de impresión 110×70mm. */
export function cropsHTML() {
  const T = 0.2, L = 4.5
  const m: number[][] = []
  ;[10, 60].forEach(y => { m.push([1.5, y - T / 2, L, T]); m.push([104, y - T / 2, L, T]) })
  ;[10, 100].forEach(x => { m.push([x - T / 2, 1.5, T, L]); m.push([x - T / 2, 64, T, L]) })
  return m
    .map(a => `<div class="sdm-crop" style="left:${a[0]}mm;top:${a[1]}mm;width:${a[2]}mm;height:${a[3]}mm"></div>`)
    .join('')
}
