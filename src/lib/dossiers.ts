import type { DossierItem } from '@/types'

// Acepta tanto el formato legacy (string[] de URLs) como el nuevo ({url, titulo}[])
export function normalizeDossiers(raw: unknown): DossierItem[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => (typeof item === 'string' ? { url: item } : item as DossierItem))
    .filter((d): d is DossierItem => !!d && typeof d.url === 'string' && d.url.length > 0)
}

export function dossierFileName(url: string): string {
  try { return decodeURIComponent(url.split('/').pop() || url).replace(/^\d+_/, '') }
  catch { return url.split('/').pop() || url }
}

export function dossierTitle(d: DossierItem): string {
  return d.titulo?.trim() || dossierFileName(d.url)
}
