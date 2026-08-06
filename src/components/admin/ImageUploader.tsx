// Subida de una imagen suelta desde el admin.
//
// El pipeline de subida no vive acá: está en `src/lib/subirImagen.ts`, que
// procesa en el navegador y sube a R2 por `/api/subir`. Este componente solo
// pone la UI y reporta la URL resultante por `onUploaded`.
//
// `folder` es el prefijo dentro del bucket y tiene que estar en la lista
// blanca `PREFIJOS` de `functions/api/subir.js`, o el endpoint rechaza la
// subida.
//
// A nivel de módulo. Ver la nota en `layout.tsx`.

import { useState } from 'react'
import { subirImagen } from '@/lib/subirImagen'
import { thumbUrl } from '@/lib/imagenes'

export function ImageUploader({ currentUrl, onUploaded, folder = 'general' }: { currentUrl?: string; onUploaded: (url: string) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false)
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const r = await subirImagen(file, folder)
    if (r) onUploaded(r.url)
    setUploading(false)
  }
  return (
    <div className="flex items-center gap-4">
      {currentUrl && <img src={thumbUrl(currentUrl)} alt="" loading="lazy" decoding="async" className="w-16 h-16 object-cover rounded" style={{ border: '1px solid var(--border)' }} />}
      <label className="text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '9px 18px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600, textTransform: 'uppercase' }}>
        {uploading ? 'Subiendo…' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {currentUrl && (
        <input value={currentUrl} readOnly className="input-line flex-1 text-sdm-sm" style={{ color: 'var(--muted)' }} onClick={e => (e.target as HTMLInputElement).select()} />
      )}
    </div>
  )
}
