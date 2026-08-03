import { useState, useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { FileText, Users, MessageCircle } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Image } from '@tiptap/extension-image'
import { REGIONES, getComunas } from '@/data/comunas-chile'
import { supabase } from '@/lib/supabase'
import { subirImagen, subirArchivo } from '@/lib/subirImagen'
import { invalidateContenidoCache } from '@/hooks/useContenido'
import { normalizeDossiers, dossierFileName } from '@/lib/dossiers'
import { thumbUrl } from '@/lib/imagenes'
import type { Propiedad, BlogPost, MiembroEquipo, Asociado, MensajeContacto, DossierItem } from '@/types'
import MapPicker from '@/components/ui/MapPicker'
import { CotizacionesAdmin } from '@/components/cotizaciones/CotizacionesAdmin'
import { TarjetasEquipo } from '@/components/tarjetas/TarjetasEquipo'

type Tab = 'propiedades' | 'blog' | 'equipo' | 'asociados' | 'mensajes' | 'contenido' | 'fotos' | 'barranco' | 'cotizaciones' | 'tarjetas' | 'legal' | 'rental' | 'vende'

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); setChecking(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => subscription.unsubscribe()
  }, [])
  return { authed, checking }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-dark)' }}>
      <div className="bg-white p-12 w-full max-w-sm" style={{ borderRadius: 2 }}>
        <div className="logo-stripes mb-6"><div className="logo-stripe logo-stripe--sky" /><div className="logo-stripe logo-stripe--green" /><div className="logo-stripe logo-stripe--navy" /></div>
        <h1 className="font-serif font-light mb-1" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Admin</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>SDM Capital · Panel de gestión</p>
        <form onSubmit={login} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-line" placeholder="admin@sdmcapital.cl" />
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-line" placeholder="••••••••" />
          </div>
          {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary justify-center mt-2">{loading ? 'Ingresando…' : 'Ingresar →'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</label>{children}</div>
}

function Inp({ value, onChange, type = 'text', placeholder = '', min, max }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: number
  max?: number
}) {
  const [local, setLocal] = useState(String(value ?? ''))
  const prevValue = useRef(String(value ?? ''))
  useEffect(() => {
    const str = String(value ?? '')
    if (str !== prevValue.current) {
      setLocal(str)
      prevValue.current = str
    }
  }, [value])
  return (
    <input
      type={type}
      value={local}
      placeholder={placeholder}
      min={min}
      max={max}
      className="input-line"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onChange(local) }}
    />
  )
}

function Txa({ value, onChange, rows = 3, placeholder }: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const [local, setLocal] = useState(value ?? '')
  const prevValue = useRef(value ?? '')
  useEffect(() => {
    if (value !== prevValue.current) {
      setLocal(value ?? '')
      prevValue.current = value ?? ''
    }
  }, [value])
  return (
    <textarea
      value={local}
      rows={rows}
      placeholder={placeholder}
      className="input-line resize-none"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onChange(local) }}
    />
  )
}
function Chk({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14, color: 'var(--muted)' }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--green)', width: 15, height: 15 }} />{label}</label>
}
function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} className="input-line" style={{ cursor: 'pointer' }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
}
function SaveBtn({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return <button onClick={onClick} disabled={loading} className="btn-green" style={{ alignSelf: 'flex-start' }}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
}
function Badge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 2, background: color, color: '#fff' }}>{label}</span>
}

// ─── PROYECTOS NUEVOS — opciones ───────────────────────────────────────────────
const FECHA_ENTREGA_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  { value: '2026', label: '2026' },
  { value: '2027', label: '2027' },
  { value: '2028', label: '2028' },
  { value: '2029', label: '2029' },
  { value: '2030', label: '2030' },
]

const AVANCE_OBRA_OPTIONS = [
  { value: '', label: 'Seleccionar...' },
  ...Array.from({ length: 21 }, (_, i) => ({ value: String(i * 5), label: `${i * 5}%` })),
]

const SUBSIDIO_OPTIONS = [
  { value: 'DS49', label: 'DS49 — Fondo Solidario de Elección de Vivienda' },
  { value: 'DS1_T1', label: 'DS1 Tramo 1 — Sectores Medios' },
  { value: 'DS1_T2', label: 'DS1 Tramo 2 — Sectores Medios' },
  { value: 'DS1_T3', label: 'DS1 Tramo 3 — Sectores Medios' },
  { value: 'DS19', label: 'DS19 — Integración Social y Territorial' },
  { value: 'DS52', label: 'DS52 — Subsidio de Arriendo Regular' },
  { value: 'DS52_especial', label: 'DS52 Especial — Personas Mayores y Discapacidad' },
  { value: 'sitio_propio', label: 'Construcción en Sitio Propio (DS1/DS49)' },
  { value: 'pequenos_condominios', label: 'Pequeños Condominios — Densificación Predial' },
  { value: 'DS10', label: 'DS10 — Habitabilidad Rural' },
  { value: 'DS27_mejoramiento', label: 'DS27 — Mejoramiento de Vivienda (Hogar Mejor)' },
  { value: 'DS27_ampliacion', label: 'DS27 — Ampliación de Vivienda (Hogar Mejor)' },
  { value: 'DS27_eficiencia', label: 'DS27 — Eficiencia Energética (Paneles/Colectores)' },
  { value: 'DS27_termico', label: 'DS27 — Acondicionamiento Térmico' },
  { value: 'condominios_sociales', label: 'Reparación de Condominios Sociales' },
  { value: 'pavimentacion', label: 'Programa de Pavimentación Participativa' },
  { value: 'leasing', label: 'Leasing Habitacional' },
  { value: 'FOGAES', label: 'FOGAES — Garantía Estatal' },
  { value: 'subsidio_tasa', label: 'Subsidio a la Tasa de Interés' },
]

// ─── IMAGE UPLOADER ───────────────────────────────────────────────────────────
function ImageUploader({ currentUrl, onUploaded, folder = 'general' }: { currentUrl?: string; onUploaded: (url: string) => void; folder?: string }) {
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
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '9px 18px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {uploading ? 'Subiendo…' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {currentUrl && (
        <input value={currentUrl} readOnly className="input-line flex-1" style={{ fontSize: 12, color: 'var(--muted)' }} onClick={e => (e.target as HTMLInputElement).select()} />
      )}
    </div>
  )
}

// ─── DRAG & DROP HOOK ─────────────────────────────────────────────────────────
function useDragSort<T extends { id: string }>(initialItems: T[], onReorder: (items: T[]) => void) {
  const [items, setItems] = useState<T[]>(initialItems)
  const dragItem = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const key = initialItems.map(i => i.id + (i as Record<string,unknown>).activo + (i as Record<string,unknown>).estado).join(',')
  useEffect(() => { setItems(initialItems) }, [key])

  const onDragStart = (idx: number) => { dragItem.current = idx }
  const onDragEnter = (idx: number) => { dragOver.current = idx }
  const onDragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null) return
    const next = [...items]
    const dragged = next.splice(dragItem.current, 1)[0]
    next.splice(dragOver.current, 0, dragged)
    dragItem.current = null; dragOver.current = null
    setItems(next); onReorder(next)
  }
  return { items, setItems, onDragStart, onDragEnter, onDragEnd }
}

// ─── DOSSIER UPLOADER ────────────────────────────────────────────────────────
function DossierUploader({ items, onChanged }: { items: DossierItem[]; onChanged: (items: DossierItem[]) => void }) {
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const newItems: DossierItem[] = []
    for (const file of Array.from(files)) {
      const r = await subirArchivo(file, 'dossiers')
      if (r) newItems.push({ url: r.url })
    }
    onChanged([...items, ...newItems])
    setUploading(false)
    e.target.value = ''
  }

  const remove = (url: string) => {
    if (!confirm('¿Eliminar este archivo?')) return
    onChanged(items.filter(d => d.url !== url))
  }

  const setTitulo = (url: string, titulo: string) => {
    onChanged(items.map(d => d.url === url ? { ...d, titulo } : d))
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {items.map((d, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-sm" style={{ background: 'var(--sky-pale)', border: '1px solid var(--sky)' }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, flexShrink: 0 }}>
                {dossierFileName(d.url)}
              </a>
              <input
                type="text"
                value={d.titulo || ''}
                placeholder="Título a mostrar (opcional)"
                onChange={e => setTitulo(d.url, e.target.value)}
                style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '1px solid var(--sky)', borderRadius: 2, background: '#fff', color: 'var(--ink)' }}
              />
              <button onClick={() => remove(d.url)}
                style={{ fontSize: 11, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '9px 18px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {uploading ? 'Subiendo…' : `📎 Agregar archivos (${items.length} subido${items.length !== 1 ? 's' : ''})`}
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple style={{ display: 'none' }} disabled={uploading} onChange={upload} />
      </label>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>PDF, Word, Excel. Puedes subir varios a la vez. Si dejas el título vacío, se muestra el nombre del archivo.</p>
    </div>
  )
}

// ─── PROP IMAGE MANAGER ───────────────────────────────────────────────────────
function PropImageManager({
  imagenes, imagenPrincipal, onChange,
}: {
  imagenes: string[]
  imagenPrincipal: string
  onChange: (imagenes: string[], principal: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState('')
  const dragIdx  = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.72)
      }
      img.src = url
    })

const upload = async (files: FileList) => {
    setUploading(true)
    const newUrls: string[] = []
    const list = Array.from(files).slice(0, 20 - imagenes.length)
    for (let idx = 0; idx < list.length; idx++) {
      const file = list[idx]
      setProgress(`Subiendo ${idx + 1}/${list.length}…`)
      const r = await subirImagen(file, 'propiedades')
      if (r) newUrls.push(r.url)
    }
    const next = [...imagenes, ...newUrls]
    onChange(next, imagenPrincipal || next[0] || '')
    setUploading(false)
    setProgress('')
  }

  const remove = (i: number) => {
    const next = imagenes.filter((_, idx) => idx !== i)
    const newPrincipal = imagenPrincipal === imagenes[i] ? (next[0] || '') : imagenPrincipal
    onChange(next, newPrincipal)
  }

  const setPrincipal = (url: string) => onChange(imagenes, url)

  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragEnter = (i: number) => { dragOver.current = i }
  const onDragEnd   = () => {
    if (dragIdx.current === null || dragOver.current === null || dragIdx.current === dragOver.current) return
    const next = [...imagenes]
    const dragged = next.splice(dragIdx.current, 1)[0]
    next.splice(dragOver.current, 0, dragged)
    dragIdx.current = null; dragOver.current = null
    onChange(next, imagenPrincipal || next[0] || '')
  }

  return (
    <div>
      {imagenes.length > 0 && (
        <div style={{ fontSize: 13, color: 'var(--navy-dark)', background: 'var(--sky-pale)', border: '1px solid var(--sky)', borderRadius: 4, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📷</span>
          <span>Haz clic en <strong>"Portada"</strong> debajo de la foto que quieres como imagen principal.</span>
        </div>
      )}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
          {imagenes.map((url, i) => (
            <div key={url + i}>
              <div
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                style={{
                  position: 'relative', aspectRatio: '4/3', borderRadius: 3,
                  overflow: 'hidden', cursor: 'grab',
                  border: url === imagenPrincipal ? '3px solid var(--green)' : '2px solid var(--border)',
                  boxShadow: url === imagenPrincipal ? '0 0 0 2px rgba(61,170,110,0.25)' : 'none',
                }}
              >
                <img src={thumbUrl(url)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {url === imagenPrincipal && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', padding: '4px 0' }}>
                    ★ PORTADA
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.45)', borderRadius: 2, padding: '2px 3px' }}>
                  <svg width="7" height="10" viewBox="0 0 7 10" fill="white" opacity="0.7">
                    <circle cx="1.5" cy="1.5" r="1.2"/><circle cx="5.5" cy="1.5" r="1.2"/>
                    <circle cx="1.5" cy="5" r="1.2"/><circle cx="5.5" cy="5" r="1.2"/>
                    <circle cx="1.5" cy="8.5" r="1.2"/><circle cx="5.5" cy="8.5" r="1.2"/>
                  </svg>
                </div>
                <button
                  onClick={() => remove(i)}
                  title="Eliminar foto"
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.9)', border: 'none', borderRadius: 2, color: '#fff', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
                >✕</button>
              </div>
              <button
                onClick={() => setPrincipal(url)}
                style={{
                  width: '100%', marginTop: 4, padding: '5px 0',
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
                  border: 'none', borderRadius: 2, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                  background: url === imagenPrincipal ? 'var(--green)' : 'var(--border)',
                  color: url === imagenPrincipal ? '#fff' : 'var(--muted)',
                }}
                onMouseEnter={e => { if (url !== imagenPrincipal) { e.currentTarget.style.background = 'var(--sky)'; e.currentTarget.style.color = 'var(--navy-dark)' } }}
                onMouseLeave={e => { if (url !== imagenPrincipal) { e.currentTarget.style.background = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' } }}
              >
                {url === imagenPrincipal ? '★ Portada' : 'Portada'}
              </button>
            </div>
          ))}
        </div>
      )}
      {imagenes.length < 20 && (
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '9px 20px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
          {uploading ? (progress || 'Procesando…') : `+ Agregar fotos (${imagenes.length}/20)`}
          <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={uploading}
            onChange={e => { if (e.target.files?.length) upload(e.target.files) }} />
        </label>
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, lineHeight: 1.6 }}>
        Arrastra para reordenar · ★ para elegir la imagen principal (borde verde) · ✕ para eliminar
      </p>
    </div>
  )
}

// ─── RICH TEXT EDITOR (TipTap) ────────────────────────────────────────────────
function TBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{
        padding: '4px 8px', borderRadius: 3, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 13, lineHeight: 1,
        background: active ? 'var(--navy-dark)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        fontWeight: active ? 700 : 400,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--border)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      // StarterKit 3.x ya trae link y underline. Registrarlos aparte los duplica
      // y TipTap avisa por consola; Link se configura desde el propio StarterKit.
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: [
          'min-height: 320px',
          'padding: 16px',
          'outline: none',
          'font-size: 15px',
          'line-height: 1.8',
          'color: var(--ink)',
          'font-weight: 300',
        ].join(';'),
      },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('URL de la imagen:')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const groups = [
    [
      <TBtn key="h2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título H2">H2</TBtn>,
      <TBtn key="h3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título H3">H3</TBtn>,
    ],
    [
      <TBtn key="b" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita"><strong>B</strong></TBtn>,
      <TBtn key="i" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva"><em>I</em></TBtn>,
      <TBtn key="u" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado"><span style={{ textDecoration: 'underline' }}>U</span></TBtn>,
      <TBtn key="s" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><s>S</s></TBtn>,
    ],
    [
      <TBtn key="al" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Izquierda">⬅</TBtn>,
      <TBtn key="ac" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar">☰</TBtn>,
      <TBtn key="ar" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Derecha">➡</TBtn>,
    ],
    [
      <TBtn key="ul" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista">• Lista</TBtn>,
      <TBtn key="ol" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">1. Lista</TBtn>,
      <TBtn key="bq" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita">❝</TBtn>,
      <TBtn key="hr" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador">—</TBtn>,
    ],
    [
      <TBtn key="link" onClick={addLink} active={editor.isActive('link')} title="Insertar enlace">🔗</TBtn>,
      <TBtn key="unlink" onClick={() => editor.chain().focus().unsetLink().run()} title="Quitar enlace">🔗̸</TBtn>,
      <TBtn key="img" onClick={addImage} title="Insertar imagen (URL)">🖼</TBtn>,
    ],
    [
      <TBtn key="undo" onClick={() => editor.chain().focus().undo().run()} title="Deshacer">↩</TBtn>,
      <TBtn key="redo" onClick={() => editor.chain().focus().redo().run()} title="Rehacer">↪</TBtn>,
    ],
  ]

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 10px',
        borderBottom: '1px solid var(--border)', background: 'var(--off)',
        alignItems: 'center',
      }}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: 1, marginRight: gi < groups.length - 1 ? 6 : 0, borderRight: gi < groups.length - 1 ? '1px solid var(--border)' : 'none', paddingRight: gi < groups.length - 1 ? 6 : 0 }}>
            {group}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, paddingLeft: 6, borderLeft: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Color:</span>
          <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} title="Color del texto"
            style={{ width: 26, height: 26, borderRadius: 3, border: '1px solid var(--border)', padding: 2, cursor: 'pointer', background: 'none' }} />
        </div>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror h2 { font-size: 22px; font-weight: 500; color: var(--navy-dark); margin: 20px 0 8px; font-family: 'Cormorant Garamond', Georgia, serif; }
        .ProseMirror h3 { font-size: 17px; font-weight: 600; color: var(--navy-dark); margin: 16px 0 6px; }
        .ProseMirror p  { margin: 0 0 12px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 22px; margin: 0 0 12px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote { border-left: 3px solid var(--sky); padding-left: 16px; margin: 16px 0; color: var(--muted); font-style: italic; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
        .ProseMirror a { color: var(--navy); text-decoration: underline; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
      `}</style>
    </div>
  )
}

// ─── PROPIEDADES ──────────────────────────────────────────────────────────────
function slugify(titulo: string, comuna?: string, dormitorios?: number) {
  const base = `${titulo}-${comuna || ''}${dormitorios ? `-${dormitorios}d` : ''}`
  return base
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function PropiedadesAdmin() {
  const [items, setItems]         = useState<Propiedad[]>([])
  const [editing, setEditing]     = useState<Partial<Propiedad> | null>(null)
  const [saving, setSaving]       = useState(false)
  const [sortField, setSortField] = useState<'tipo'|'estado'|'precio_uf'|null>(null)
  const [sortDir, setSortDir]     = useState<'asc'|'desc'>('asc')
  const [showInactive, setShowInactive] = useState(false)

  const load = () => supabase.from('propiedades').select('*').order('created_at', { ascending: true }).then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const toggleActivo = async (p: Propiedad) => {
    const isCurrentlyActive = p.activo !== false
    const newVal = !isCurrentlyActive
    setItems(prev => prev.map(item => item.id === p.id ? { ...item, activo: newVal } : item))
    await supabase.from('propiedades').update({ activo: newVal }).eq('id', p.id)
  }

  const { items: dragged, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    const updates = reordered.map((p, i) => supabase.from('propiedades').update({ destacada: i < 6 }).eq('id', p.id))
    await Promise.all(updates)
    load()
  })

  const displayItems = [...dragged]
    .filter(p => showInactive ? true : p.activo !== false)
    .sort((a, b) => {
      if (!sortField) return 0
      const aVal = sortField === 'precio_uf' ? (a.precio_uf || 0) : a[sortField] || ''
      const bVal = sortField === 'precio_uf' ? (b.precio_uf || 0) : b[sortField] || ''
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad?')) return
    await supabase.from('propiedades').delete().eq('id', id); load()
  }

  const startEdit = (p: Propiedad) => {
    setEditing({
      ...p,
      activo:               p.activo !== false,
      bono_pie:             !!p.bono_pie,
      bono_pie_porcentaje:  p.bono_pie_porcentaje || 0,
      bodegas:              p.bodegas || 0,
      estado_conservacion:  p.estado_conservacion || '',
      comision_porcentaje:  p.comision_porcentaje ?? 2,
      etapa_construccion:   p.etapa_construccion || undefined,
      fecha_entrega:        p.fecha_entrega || '',
      avance_obra:          p.avance_obra ?? undefined,
      subsidios:            Array.isArray(p.subsidios) ? p.subsidios : [],
      dossiers:             normalizeDossiers(p.dossiers),
      mostrar_boton_flow:   p.mostrar_boton_flow !== false,
    })
    setTimeout(() => {
      document.getElementById('prop-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const payload = {
      ...editing,
      activo:              editing.activo !== false,
      slug:                editing.slug || slugify(editing.titulo || '', editing.comuna, editing.dormitorios),
      bono_pie:            !!editing.bono_pie,
      bono_pie_porcentaje: editing.bono_pie_porcentaje ? Number(editing.bono_pie_porcentaje) : null,
      bodegas:             Number(editing.bodegas) || 0,
      estado_conservacion: editing.estado_conservacion || null,
      comision_porcentaje: Number(editing.comision_porcentaje ?? 2),
      etapa_construccion:  editing.etapa_construccion ?? null,
      fecha_entrega:       editing.fecha_entrega || null,
      avance_obra:         editing.avance_obra ?? null,
      subsidios:           editing.subsidios ?? [],
    }
    if (editing.id) {
      const { error } = await supabase.from('propiedades').update(payload).eq('id', editing.id)
      if (error) { alert('Error al guardar: ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('propiedades').insert([{ ...payload, imagenes: editing.imagenes || [], destacada: false, internacional: false, a_consultar: editing.a_consultar || false }])
      if (error) { alert('Error al crear: ' + error.message); setSaving(false); return }
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  const blank = (): Partial<Propiedad> => ({ titulo: '', descripcion: '', tipo: 'casa', estado: 'en_venta', categoria: 'usada', a_consultar: false, region: 'R. Metropolitana', comuna: '', pais: 'Chile', imagenes: [], destacada: false, internacional: false, activo: true, etapa_construccion: undefined, fecha_entrega: '', avance_obra: undefined, subsidios: [], dossiers: [], mostrar_boton_flow: true })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Propiedades</h2>
        <button className="btn-green" onClick={() => setEditing(blank())}>+ Nueva propiedad</button>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          🖱 <strong>Arrastra</strong> las filas para reordenarlas. Las primeras <strong>6</strong> aparecen en el Inicio.
        </p>
        <label className="flex items-center gap-2" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
          Mostrar pausadas
        </label>
      </div>

      {editing && (
        <div id="prop-edit-form" className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar propiedad' : 'Nueva propiedad'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Título"><Inp value={editing.titulo || ''} onChange={v => setEditing(p => ({ ...p, titulo: v }))} /></Field>
            <Field label="Tipo">
              <Sel value={editing.tipo || 'casa'} onChange={v => setEditing(p => ({ ...p, tipo: v as Propiedad['tipo'] }))}
                options={[{value:'casa',label:'Casa'},{value:'departamento',label:'Departamento'},{value:'oficina',label:'Oficina'},{value:'parcela',label:'Parcela'},{value:'comercial',label:'Comercial'},{value:'hotel',label:'Hotel'},{value:'terreno',label:'Terreno'}]} />
            </Field>
            <Field label="Categoría">
              <Sel value={editing.categoria || 'usada'} onChange={v => {
                if (v === 'proyecto_nuevo') {
                  setEditing(p => ({ ...p, categoria: v as Propiedad['categoria'], comision_porcentaje: 0 }))
                } else {
                  setEditing(p => ({ ...p, categoria: v as Propiedad['categoria'] }))
                }
              }}
                options={[{value:'usada',label:'Propiedad Usada'},{value:'proyecto_nuevo',label:'Proyecto Nuevo'}]} />
            </Field>
            <Field label="Estado de venta">
              <Sel value={editing.estado || 'en_venta'} onChange={v => setEditing(p => ({ ...p, estado: v as Propiedad['estado'] }))}
                options={[{value:'en_venta',label:'En venta'},{value:'en_arriendo',label:'En arriendo'},{value:'vendida',label:'Vendida'},{value:'reservada',label:'Reservada'},{value:'arrendada',label:'Arrendada'}]} />
            </Field>
            <Field label="Estado de publicación">
              <Sel
                value={editing.activo === false ? 'false' : 'true'}
                onChange={v => setEditing(p => ({ ...p, activo: v === 'true' }))}
                options={[
                  { value: 'true',  label: '✅ Activa — visible en el sitio' },
                  { value: 'false', label: '⏸ Inactiva — oculta del sitio' },
                ]}
              />
            </Field>
            <Field label="Región">
              <select
                value={editing.region || ''}
                onChange={e => setEditing(p => ({ ...p, region: e.target.value, comuna: '' }))}
                className="input-line w-full"
                style={{ fontFamily: 'inherit', fontSize: 15, color: 'var(--ink)', background: '#fff', border: 'none', borderBottom: '1px solid var(--border)', padding: '6px 0', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Seleccionar región...</option>
                {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Comuna">
              <select
                value={editing.comuna || ''}
                onChange={e => setEditing(p => ({ ...p, comuna: e.target.value }))}
                disabled={!editing.region}
                className="input-line w-full"
                style={{ fontFamily: 'inherit', fontSize: 15, color: editing.region ? 'var(--ink)' : 'var(--muted)', background: '#fff', border: 'none', borderBottom: '1px solid var(--border)', padding: '6px 0', outline: 'none', cursor: editing.region ? 'pointer' : 'not-allowed' }}
              >
                <option value="">{editing.region ? 'Seleccionar comuna...' : 'Primero elige una región'}</option>
                {getComunas(editing.region || '').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="País"><Inp value={editing.pais || 'Chile'} onChange={v => setEditing(p => ({ ...p, pais: v }))} /></Field>
          </div>

          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>Precio</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Precio UF"><Inp type="number" value={editing.precio_uf || ''} onChange={v => setEditing(p => ({ ...p, precio_uf: Number(v) }))} placeholder="Ej: 3500" /></Field>
              <Field label="Precio CLP"><Inp type="number" value={editing.precio_clp || ''} onChange={v => setEditing(p => ({ ...p, precio_clp: Number(v) }))} placeholder="Ej: 120000000" /></Field>
              <Field label="Precio USD"><Inp type="number" value={editing.precio_usd || ''} onChange={v => setEditing(p => ({ ...p, precio_usd: Number(v) }))} placeholder="Opcional" /></Field>
            </div>
            <div className="mt-4 flex gap-6 flex-wrap">
              <Chk label="Precio a consultar" checked={!!editing.a_consultar} onChange={v => setEditing(p => ({ ...p, a_consultar: v }))} />
              <Chk label="↓ Baja de precio" checked={!!editing.baja_precio} onChange={v => setEditing(p => ({ ...p, baja_precio: v }))} />
            </div>
            {editing.baja_precio && (
              <div className="mt-4">
                <Field label="Precio anterior UF (aparece tachado)">
                  <Inp type="number" value={editing.precio_anterior_uf || ''} onChange={v => setEditing(p => ({ ...p, precio_anterior_uf: Number(v) }))} placeholder="Ej: 4200" />
                </Field>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>Características</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Field label="Dormitorios"><Inp type="number" value={editing.dormitorios || ''} onChange={v => setEditing(p => ({ ...p, dormitorios: Number(v) }))} /></Field>
              <Field label="Baños"><Inp type="number" value={editing.banos || ''} onChange={v => setEditing(p => ({ ...p, banos: Number(v) }))} /></Field>
              <Field label="Superficie total m²"><Inp type="number" value={editing.superficie_total || ''} onChange={v => setEditing(p => ({ ...p, superficie_total: Number(v) }))} /></Field>
              <Field label="Superficie construida m²"><Inp type="number" value={editing.superficie_util || ''} onChange={v => setEditing(p => ({ ...p, superficie_util: Number(v) }))} /></Field>
              <Field label="Estacionamientos"><Inp type="number" value={editing.estacionamientos || ''} onChange={v => setEditing(p => ({ ...p, estacionamientos: Number(v) }))} placeholder="0" /></Field>
              <Field label="Bodegas"><Inp type="number" value={editing.bodegas || ''} onChange={v => setEditing(p => ({ ...p, bodegas: Number(v) }))} placeholder="0" /></Field>
              <Field label="Año construcción"><Inp type="number" value={editing.ano_construccion || ''} onChange={v => setEditing(p => ({ ...p, ano_construccion: Number(v) }))} placeholder="Ej: 2018" /></Field>
              <Field label="Estado conservación">
                <Sel value={editing.estado_conservacion || ''}
                  onChange={v => setEditing(p => ({ ...p, estado_conservacion: v as 'nuevo' | 'seminuevo' | '' }))}
                  options={[{value:'',label:'No especificado'},{value:'nuevo',label:'Nuevo'},{value:'seminuevo',label:'Seminuevo'}]} />
              </Field>
            </div>
          </div>

          {editing.categoria === 'proyecto_nuevo' && (
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>Información del Proyecto</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Etapa de construcción">
                  <Sel value={editing.etapa_construccion || ''}
                    onChange={v => setEditing(p => ({ ...p, etapa_construccion: v as Propiedad['etapa_construccion'] }))}
                    options={[
                      { value: '', label: 'Seleccionar...' },
                      { value: 'en_blanco', label: 'En Blanco' },
                      { value: 'en_verde', label: 'En Verde' },
                      { value: 'planos', label: 'En Planos' },
                      { value: 'inicio', label: 'Inicio de obras' },
                      { value: 'avanzado', label: 'Obra avanzada' },
                      { value: 'proxima_entrega', label: 'Próxima entrega' },
                      { value: 'entrega_inmediata', label: 'Entrega inmediata' },
                    ]} />
                </Field>
                <Field label="Fecha estimada de entrega">
                  <Sel value={editing.fecha_entrega || '2026'}
                    onChange={v => setEditing(p => ({ ...p, fecha_entrega: v }))}
                    options={FECHA_ENTREGA_OPTIONS} />
                </Field>
                <Field label="% Avance de obra">
                  <Sel value={editing.avance_obra !== undefined && editing.avance_obra !== null ? String(editing.avance_obra) : ''}
                    onChange={v => setEditing(p => ({ ...p, avance_obra: v === '' ? undefined : Number(v) }))}
                    options={AVANCE_OBRA_OPTIONS} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Subsidios aplicables">
                    <div style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '12px 16px', maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {SUBSIDIO_OPTIONS.map(opt => {
                        const selected = editing.subsidios || []
                        return (
                          <Chk key={opt.value} label={opt.label} checked={selected.includes(opt.value)}
                            onChange={checked => setEditing(p => {
                              const current = p?.subsidios || []
                              const next = checked ? [...current, opt.value] : current.filter(v => v !== opt.value)
                              return { ...p, subsidios: next }
                            })} />
                        )
                      })}
                    </div>
                  </Field>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>📍 Ubicación en mapa</div>
            <MapPicker
              address={editing.map_address || ''}
              lat={editing.map_lat}
              lng={editing.map_lng}
              onUpdate={({ address, lat, lng }) => setEditing(p => ({ ...p, map_address: address, map_lat: lat, map_lng: lng }))}
            />
          </div>

          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>💼 Comisión y Beneficios</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Comisión corredora (%)">
                <Inp type="number" value={editing.comision_porcentaje ?? 2}
                  onChange={v => setEditing(p => ({ ...p, comision_porcentaje: Number(v) }))} placeholder="2" />
              </Field>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Chk label="Bono Pie" checked={!!editing.bono_pie}
                  onChange={v => setEditing(p => ({ ...p, bono_pie: v }))} />
                {editing.bono_pie && (
                  <Field label="% Bono Pie">
                    <Inp type="number" value={editing.bono_pie_porcentaje || ''}
                      onChange={v => setEditing(p => ({ ...p, bono_pie_porcentaje: Number(v) }))} placeholder="Ej: 10" />
                  </Field>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Field label="Galería de imágenes (hasta 20 fotos)">
              <PropImageManager
                imagenes={editing.imagenes || []}
                imagenPrincipal={editing.imagen_principal || ''}
                onChange={(imagenes, principal) => setEditing(p => ({ ...p, imagenes, imagen_principal: principal }))}
              />
            </Field>
          </div>

          <div className="mb-6">
            <Field label="🎥 Link de YouTube">
              <Inp
                value={editing.youtube_url || ''}
                onChange={v => setEditing(p => ({ ...p, youtube_url: v }))}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </Field>
          </div>

          <div className="mb-6" style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>📄 Dossiers / Fichas técnicas</div>
            <DossierUploader
              items={editing.dossiers || []}
              onChanged={items => setEditing(p => ({ ...p, dossiers: items }))}
            />
          </div>

          <div className="mb-6" style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px' }}>
            <Chk label="Mostrar botón de pago Flow (Reserva esta propiedad)"
              checked={editing.mostrar_boton_flow !== false}
              onChange={v => setEditing(p => ({ ...p, mostrar_boton_flow: v }))} />
          </div>

          <div className="mb-6">
            <Field label="Descripción">
              <RichTextEditor
                value={editing.descripcion || ''}
                onChange={v => setEditing(p => ({ ...p, descripcion: v }))}
              />
            </Field>
          </div>

          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: '', field: null },
                { label: '#', field: null },
                { label: 'Propiedad', field: null },
                { label: 'Tipo', field: 'tipo' },
                { label: 'Estado', field: 'estado' },
                { label: 'Precio', field: 'precio_uf' },
                { label: 'Activo', field: null },
                { label: 'Acciones', field: null },
              ].map(({ label, field }) => (
                <th key={label} className="text-left pb-3 pr-4"
                  style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: field ? 'var(--navy)' : 'var(--muted)', fontWeight: 400, cursor: field ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
                  onClick={() => field && toggleSort(field as typeof sortField)}
                >
                  {label}{field && sortField === field ? (sortDir === 'asc' ? ' ↑' : ' ↓') : field ? ' ↕' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayItems.map((p, i) => (
              <tr
                key={p.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'grab', opacity: p.activo === false ? 0.5 : 1, background: p.activo === false ? '#fff8f8' : i < 6 ? 'rgba(61,170,110,0.04)' : 'transparent' }}
              >
                <td className="py-3 pr-2" style={{ color: 'var(--muted)', fontSize: 16 }}>⠿</td>
                <td className="py-3 pr-4">
                  <span style={{ fontSize: 12, fontWeight: 700, color: i < 6 ? 'var(--green)' : 'var(--muted)' }}>{i + 1}</span>
                  {i < 6 && <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--green)' }}>★</span>}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {(p.imagen_principal || p.imagenes?.[0])
                      ? <img src={thumbUrl(p.imagen_principal || p.imagenes[0])} alt="" loading="lazy" decoding="async" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                      : <div className="w-10 h-10 rounded flex-shrink-0" style={{ background: 'var(--navy)', opacity: 0.3 }} />
                    }
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, maxWidth: 220 }} className="truncate">{p.titulo}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.comuna}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4" style={{ fontSize: 13, color: 'var(--muted)' }}>{p.tipo}</td>
                <td className="py-3 pr-4"><Badge label={p.estado.replace('_',' ')} color={p.estado==='en_venta'?'var(--navy-dark)':p.estado==='en_arriendo'?'var(--green)':p.estado==='vendida'?'#c0392b':p.estado==='reservada'?'#d97706':p.estado==='arrendada'?'#2563eb':'#999'} /></td>
                <td className="py-3 pr-4" style={{ fontSize: 14 }}>{p.a_consultar ? 'Consultar' : p.precio_uf ? `UF ${p.precio_uf.toLocaleString('es-CL')}` : p.precio_clp ? `$${p.precio_clp.toLocaleString('es-CL')}` : p.precio_usd ? `USD ${p.precio_usd}` : '—'}</td>
                <td className="py-3 pr-4"><span>{p.internacional ? '🌐' : '🇨🇱'}</span></td>
                <td className="py-3 pr-4" draggable={false} onDragStart={e => e.preventDefault()}>
                  <button
                    onClick={e => { e.stopPropagation(); e.preventDefault(); toggleActivo(p) }}
                    onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
                    onPointerDown={e => e.stopPropagation()}
                    style={{ background: p.activo === false ? '#fff3f3' : '#f0faf4', border: `1px solid ${p.activo === false ? '#fca5a5' : '#86efac'}`, borderRadius: 4, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: p.activo === false ? '#dc2626' : '#16a34a', fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'block' }}>
                    {p.activo === false ? '⏸ Pausada' : '✓ Activa'}
                  </button>
                </td>
                <td className="py-3" draggable={false} onDragStart={e => e.preventDefault()}>
                  <div className="flex gap-3">
                    <button onClick={e => { e.stopPropagation(); startEdit(p) }} onMouseDown={e => e.stopPropagation()} style={{ fontSize: 13, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
                    <button onClick={e => { e.stopPropagation(); del(p.id) }} onMouseDown={e => e.stopPropagation()} style={{ fontSize: 13, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {displayItems.length === 0 && <tr><td colSpan={8} className="py-12 text-center" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin propiedades. Crea la primera.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── BLOG ─────────────────────────────────────────────────────────────────────
function BlogAdmin() {
  const [posts, setPosts]     = useState<BlogPost[]>([])
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []))
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return
    await supabase.from('blog_posts').delete().eq('id', id); load()
  }

  const makeSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing.id) await supabase.from('blog_posts').update(editing).eq('id', editing.id)
    else await supabase.from('blog_posts').insert([{ ...editing, publicado: editing.publicado || false, destacado: editing.destacado || false }])
    setSaving(false); setEditing(null); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Blog</h2>
        <button className="btn-green" onClick={() => setEditing({ titulo: '', slug: '', resumen: '', contenido: '', autor_nombre: 'Equipo SDM Capital', categoria: 'Mercado', publicado: false, destacado: false })}>+ Nuevo artículo</button>
      </div>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Título"><Inp value={editing.titulo || ''} onChange={v => setEditing(p => ({ ...p, titulo: v, slug: p?.id ? p.slug : makeSlug(v) }))} /></Field>
            <Field label="Slug (URL)"><Inp value={editing.slug || ''} onChange={v => setEditing(p => ({ ...p, slug: v }))} /></Field>
            <Field label="Categoría"><Inp value={editing.categoria || ''} onChange={v => setEditing(p => ({ ...p, categoria: v }))} /></Field>
            <Field label="Autor"><Inp value={editing.autor_nombre || ''} onChange={v => setEditing(p => ({ ...p, autor_nombre: v }))} /></Field>
          </div>
          <div className="mb-6">
            <Field label="Imagen de portada">
              <ImageUploader currentUrl={editing.imagen_portada} folder="blog"
                onUploaded={url => setEditing(p => ({ ...p, imagen_portada: url }))} />
            </Field>
          </div>
          <div className="mb-4">
            <Field label="Resumen"><Txa rows={2} value={editing.resumen || ''} onChange={v => setEditing(p => ({ ...p, resumen: v }))} /></Field>
          </div>

          {/* ─── RICH TEXT EDITOR ─── */}
          <div className="mb-6">
            <Field label="Contenido completo">
              <RichTextEditor
                value={editing.contenido || ''}
                onChange={v => setEditing(p => ({ ...p, contenido: v }))}
              />
            </Field>
          </div>

          <div className="flex gap-6 mt-4 mb-6">
            <Chk label="Publicado" checked={!!editing.publicado} onChange={v => setEditing(p => ({ ...p, publicado: v }))} />
            <Chk label="Destacado" checked={!!editing.destacado} onChange={v => setEditing(p => ({ ...p, destacado: v }))} />
          </div>
          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Título','Categoría','Autor','Estado','Acciones'].map(h => <th key={h} className="text-left pb-3 pr-6" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 400 }}>{h}</th>)}</tr></thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-4 pr-6"><div style={{ fontWeight: 500, fontSize: 14 }}>{p.titulo}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.slug}</div></td>
                <td className="py-4 pr-6" style={{ fontSize: 13, color: 'var(--muted)' }}>{p.categoria}</td>
                <td className="py-4 pr-6" style={{ fontSize: 13, color: 'var(--muted)' }}>{p.autor_nombre}</td>
                <td className="py-4 pr-6"><Badge label={p.publicado ? 'Publicado' : 'Borrador'} color={p.publicado ? 'var(--green)' : 'var(--muted)'} /></td>
                <td className="py-4"><div className="flex gap-3"><button onClick={() => setEditing(p)} style={{ fontSize: 13, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button><button onClick={() => del(p.id)} style={{ fontSize: 13, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button></div></td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="py-12 text-center" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>No hay artículos aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── EQUIPO ───────────────────────────────────────────────────────────────────
function EquipoAdmin() {
  const [items, setItems]     = useState<MiembroEquipo[]>([])
  const [editing, setEditing] = useState<Partial<MiembroEquipo> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('equipo').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    await Promise.all(reordered.map((m, i) => supabase.from('equipo').update({ orden: i + 1 }).eq('id', m.id)))
    load()
  })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing.id) await supabase.from('equipo').update(editing).eq('id', editing.id)
    else await supabase.from('equipo').insert([{ ...editing, activo: editing.activo !== false, orden: items.length + 1 }])
    setSaving(false); setEditing(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este miembro?')) return
    await supabase.from('equipo').delete().eq('id', id); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Equipo</h2>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', cargo: '', bio: '', orden: items.length + 1, activo: true })}>+ Nuevo miembro</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>🖱 Arrastra las filas para cambiar el orden de aparición.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar miembro' : 'Nuevo miembro'}</h3>
          <div className="mb-6 p-6 rounded-sm" style={{ background: 'var(--off)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16 }}>📷 Foto del miembro</div>
            <div className="flex items-center gap-6">
              {editing.foto
                ? <img src={editing.foto} alt="Foto" className="w-20 h-20 object-cover rounded-full" style={{ border: '3px solid var(--border)' }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif" style={{ background: 'var(--navy)', color: 'var(--sky)', fontSize: 24, border: '3px solid var(--border)' }}>{(editing.nombre || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.foto} folder="equipo" onUploaded={url => setEditing(p => ({ ...p, foto: url }))} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Recomendado: foto cuadrada, mínimo 400×400px.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Nombre completo"><Inp value={editing.nombre || ''} onChange={v => setEditing(p => ({ ...p, nombre: v }))} /></Field>
            <Field label="Cargo"><Inp value={editing.cargo || ''} onChange={v => setEditing(p => ({ ...p, cargo: v }))} placeholder="Ej: Director General" /></Field>
            <Field label="Email"><Inp type="email" value={editing.email || ''} onChange={v => setEditing(p => ({ ...p, email: v }))} /></Field>
            <Field label="Teléfono"><Inp value={editing.telefono || ''} onChange={v => setEditing(p => ({ ...p, telefono: v }))} /></Field>
            <Field label="LinkedIn URL"><Inp value={editing.linkedin || ''} onChange={v => setEditing(p => ({ ...p, linkedin: v }))} placeholder="https://linkedin.com/in/..." /></Field>
            <Field label="WhatsApp (solo números, sin +)"><Inp value={editing.whatsapp || ''} onChange={v => setEditing(p => ({ ...p, whatsapp: v }))} placeholder="56912345678" /></Field>
            <Field label="Orden"><Inp type="number" value={editing.orden || ''} onChange={v => setEditing(p => ({ ...p, orden: Number(v) }))} /></Field>
          </div>
          <Field label="Biografía"><Txa rows={4} value={editing.bio || ''} onChange={v => setEditing(p => ({ ...p, bio: v }))} /></Field>
          <div className="mt-4 mb-6"><Chk label="Activo (visible en el sitio)" checked={editing.activo !== false} onChange={v => setEditing(p => ({ ...p, activo: v }))} /></div>
          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((m, i) => (
          <div key={m.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab" style={{ borderTop: '3px solid var(--green)' }}>
            <div className="flex items-center gap-4 mb-4">
              <span style={{ color: 'var(--muted)', fontSize: 20 }}>⠿</span>
              {m.foto
                ? <img src={m.foto} alt={m.nombre} className="w-14 h-14 object-cover rounded-full" style={{ border: '2px solid var(--border)' }} />
                : <div className="w-14 h-14 rounded-full flex items-center justify-center font-serif flex-shrink-0" style={{ background: 'var(--navy)', color: 'var(--sky)', fontSize: 18 }}>{m.nombre.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              }
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)' }}>{m.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', letterSpacing: '0.5px' }}>{m.cargo}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-2">{m.bio}</p>
            <div className="flex gap-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditing(m)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button onClick={() => del(m.id)} style={{ fontSize: 12, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
              <Badge label={m.activo ? 'Activo' : 'Inactivo'} color={m.activo ? 'var(--green)' : 'var(--muted)'} />
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="py-12 text-center col-span-3" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin miembros. Crea el primero.</div>}
      </div>
    </div>
  )
}

// ─── ASOCIADOS ────────────────────────────────────────────────────────────────
function AsociadosAdmin() {
  const [items, setItems]     = useState<Asociado[]>([])
  const [editing, setEditing] = useState<Partial<Asociado> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('asociados').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    await Promise.all(reordered.map((a, i) => supabase.from('asociados').update({ orden: i + 1 }).eq('id', a.id)))
    load()
  })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing.id) await supabase.from('asociados').update(editing).eq('id', editing.id)
    else await supabase.from('asociados').insert([{ ...editing, activo: editing.activo !== false, logo: editing.logo || '', orden: items.length + 1 }])
    setSaving(false); setEditing(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este asociado?')) return
    await supabase.from('asociados').delete().eq('id', id); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Asociados / Socios Comerciales</h2>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', logo: '', url: '', orden: items.length + 1, activo: true })}>+ Nuevo asociado</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>🖱 Arrastra las tarjetas para cambiar el orden.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar asociado' : 'Nuevo asociado'}</h3>
          <div className="mb-6 p-6 rounded-sm" style={{ background: 'var(--off)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16 }}>🏢 Logo de la empresa</div>
            <div className="flex items-center gap-6">
              {editing.logo
                ? <img src={editing.logo} alt="Logo" style={{ height: 56, objectFit: 'contain', border: '1px solid var(--border)', padding: 8, borderRadius: 4, background: '#fff', maxWidth: 160 }} />
                : <div style={{ width: 120, height: 56, border: '2px dashed var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>Sin logo</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.logo} folder="asociados" onUploaded={url => setEditing(p => ({ ...p, logo: url }))} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>PNG con fondo transparente para mejor resultado.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Nombre de la empresa"><Inp value={editing.nombre || ''} onChange={v => setEditing(p => ({ ...p, nombre: v }))} /></Field>
            <Field label="URL del sitio web"><Inp value={editing.url || ''} onChange={v => setEditing(p => ({ ...p, url: v }))} placeholder="https://..." /></Field>
            <Field label="Orden"><Inp type="number" value={editing.orden || ''} onChange={v => setEditing(p => ({ ...p, orden: Number(v) }))} /></Field>
          </div>
          <Field label="Descripción breve"><Txa rows={2} value={editing.descripcion || ''} onChange={v => setEditing(p => ({ ...p, descripcion: v }))} /></Field>
          <div className="mt-4 mb-6"><Chk label="Activo (visible en el sitio)" checked={editing.activo !== false} onChange={v => setEditing(p => ({ ...p, activo: v }))} /></div>
          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sorted.map((a, i) => (
          <div key={a.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab flex flex-col items-center text-center">
            <span style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 8, display: 'block' }}>⠿</span>
            {a.logo
              ? <img src={a.logo} alt={a.nombre} style={{ height: 44, objectFit: 'contain', maxWidth: '100%', marginBottom: 10 }} />
              : <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy-dark)' }}>{a.nombre}</span></div>
            }
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 4 }}>{a.nombre}</div>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--sky)', textDecoration: 'none', marginBottom: 10 }} className="truncate w-full">{a.url}</a>
            <div className="flex gap-3 border-t pt-3 w-full justify-center" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditing(a)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button onClick={() => del(a.id)} style={{ fontSize: 12, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="col-span-4 py-12 text-center" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin asociados. Crea el primero.</div>}
      </div>
    </div>
  )
}

// ─── MENSAJES ─────────────────────────────────────────────────────────────────
function MensajesAdmin() {
  const [msgs, setMsgs] = useState<MensajeContacto[]>([])
  useEffect(() => {
    supabase.from('contacto_mensajes').select('*').order('created_at', { ascending: false }).then(({ data }) => setMsgs(data || []))
  }, [])
  const marcar = async (id: string) => {
    await supabase.from('contacto_mensajes').update({ leido: true }).eq('id', id)
    setMsgs(m => m.map(msg => msg.id === id ? { ...msg, leido: true } : msg))
  }
  const noLeidos = msgs.filter(m => !m.leido).length
  return (
    <div>
      <h2 className="font-serif font-light mb-8" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>
        Mensajes de contacto
        {noLeidos > 0 && <span className="ml-3 font-sans text-[14px] px-3 py-1 rounded-full" style={{ background: 'var(--green)', color: '#fff' }}>{noLeidos} nuevos</span>}
      </h2>
      <div className="flex flex-col gap-4">
        {msgs.map(m => (
          <div key={m.id} className="bg-white border p-6 rounded-sm" style={{ borderColor: m.leido ? 'var(--border)' : 'var(--green)' }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  {!m.leido && <span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />}
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--navy-dark)' }}>{m.nombre}</span>
                  <a href={`mailto:${m.email}`} style={{ fontSize: 14, color: 'var(--navy)', textDecoration: 'none' }}>{m.email}</a>
                  {m.telefono && <a href={`tel:${m.telefono}`} style={{ fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>{m.telefono}</a>}
                </div>
                <p style={{ fontSize: 15, color: 'var(--ink)', lineHeight: 1.7 }}>{m.mensaje}</p>
                {m.created_at && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>{new Date(m.created_at).toLocaleString('es-CL')}</p>}
              </div>
              <div className="flex gap-2">
                <a href={`mailto:${m.email}?subject=Re: Consulta SDM Capital`} className="btn-primary" style={{ fontSize: 11, padding: '8px 16px' }}>Responder</a>
                {!m.leido && <button onClick={() => m.id && marcar(m.id)} style={{ fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', padding: '8px 16px', borderRadius: 2, border: '1px solid var(--border)', color: 'var(--muted)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Marcar leído</button>}
              </div>
            </div>
          </div>
        ))}
        {msgs.length === 0 && <div className="text-center py-16" style={{ fontSize: 15, color: 'var(--muted)', fontStyle: 'italic' }}>No hay mensajes todavía.</div>}
      </div>
    </div>
  )
}

// ─── CONTENIDO ────────────────────────────────────────────────────────────────
const HERO_KEYS = ['hero_imagen_url','hero_imagen_url_2','hero_imagen_url_3','hero_imagen_url_4','hero_imagen_url_5'] as const
const HERO_POS_KEYS = ['hero_pos_1','hero_pos_2','hero_pos_3','hero_pos_4','hero_pos_5'] as const

const POSITION_OPTIONS = [
  { value: 'center center', label: 'Centro' },
  { value: 'center top',    label: 'Centro arriba' },
  { value: 'center bottom', label: 'Centro abajo' },
  { value: 'left center',   label: 'Izquierda' },
  { value: 'right center',  label: 'Derecha' },
  { value: '50% 20%',       label: 'Alto (20%)' },
  { value: '50% 30%',       label: 'Alto (30%)' },
  { value: '50% 40%',       label: 'Medio-alto' },
  { value: '50% 60%',       label: 'Medio-bajo' },
  { value: '50% 70%',       label: 'Bajo (70%)' },
  { value: '50% 80%',       label: 'Bajo (80%)' },
]

function CarouselPhotoManager({ d, setD }: { d: Record<string, string>; setD: (fn: (prev: Record<string, string>) => Record<string, string>) => void }) {
  const dragIdx  = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)
  const [uploading, setUploading] = useState<number | null>(null)

  const urls    = HERO_KEYS.map(k => d[k] || '')
  const setUrls = (newUrls: string[]) => {
    const update: Record<string, string> = {}
    HERO_KEYS.forEach((k, i) => { update[k] = newUrls[i] || '' })
    setD(prev => ({ ...prev, ...update }))
  }

  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragEnter = (i: number) => { dragOver.current = i }
  const onDragEnd   = () => {
    if (dragIdx.current === null || dragOver.current === null || dragIdx.current === dragOver.current) return
    const next = [...urls]
    const dragged = next.splice(dragIdx.current, 1)[0]
    next.splice(dragOver.current, 0, dragged)
    dragIdx.current = null; dragOver.current = null
    setUrls(next)
  }

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new window.Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1280
        let { width, height } = img
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.75)
      }
      img.src = url
    })

  const upload = async (i: number, file: File) => {
    setUploading(i)
    const r = await subirImagen(file, 'hero')
    if (r) { const next = [...urls]; next[i] = r.url; setUrls(next) }
    setUploading(null)
  }

  const remove = (i: number) => {
    const next = [...urls].filter((_, idx) => idx !== i)
    while (next.length < 5) next.push('')
    setUrls(next)
  }

  const filled = urls.filter(Boolean)

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {urls.map((url, i) => (
          <div key={i}>
            <div
              draggable={!!url}
              onDragStart={() => url && onDragStart(i)}
              onDragEnter={() => url && onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
              style={{ borderRadius: 4, border: url ? '2px solid var(--border)' : '2px dashed var(--border)', background: url ? 'transparent' : 'var(--off)', cursor: url ? 'grab' : 'default', overflow: 'hidden', position: 'relative', aspectRatio: '16/9', minHeight: 80 }}
            >
              {url ? (
                <>
                  <img src={url} alt={`Foto ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: d[HERO_POS_KEYS[i]] || 'center center', display: 'block' }} />
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <div style={{ position: 'absolute', top: 6, right: 28, background: 'rgba(0,0,0,0.5)', borderRadius: 3, padding: '2px 4px' }}>
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="white" opacity="0.8"><circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/><circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/><circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/></svg>
                  </div>
                  <button onClick={() => remove(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.85)', border: 'none', borderRadius: 3, color: '#fff', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
                </>
              ) : (
                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4 }}>
                  {uploading === i
                    ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>Subiendo…</span>
                    : <><span style={{ fontSize: 20, color: 'var(--muted)' }}>+</span><span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Foto {i + 1}</span></>
                  }
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading !== null} onChange={e => { const f = e.target.files?.[0]; if (f) upload(i, f) }} />
                </label>
              )}
            </div>
            {url && (
              <select
                value={d[HERO_POS_KEYS[i]] || 'center center'}
                onChange={e => setD(prev => ({ ...prev, [HERO_POS_KEYS[i]]: e.target.value }))}
                style={{ width: '100%', marginTop: 4, fontSize: 11, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 3, color: 'var(--navy-dark)', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
              >
                {POSITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
      {filled.length === 0
        ? <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>Sube al menos una foto para activar el carrusel.</p>
        : <p style={{ fontSize: 12, color: 'var(--muted)' }}>{filled.length} foto{filled.length > 1 ? 's' : ''} en el carrusel · Arrastra para reordenar</p>
      }
    </div>
  )
}

function HomeDestacadasSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [allProps, setAllProps] = useState<Propiedad[]>([])
  const [selected, setSelected] = useState<Propiedad[]>([])
  const dragIdx  = useRef<number | null>(null)
  const dragOver = useRef<number | null>(null)

  useEffect(() => {
    supabase.from('propiedades').select('id,titulo,imagen_principal,imagenes,precio_uf,a_consultar,activo,tipo,comuna')
      .neq('activo', false).order('created_at', { ascending: false })
      .then(({ data }) => setAllProps((data || []) as Propiedad[]))
  }, [])

  useEffect(() => {
    try {
      const ids: string[] = JSON.parse(value || '[]')
      const ordered = ids.map(id => allProps.find(p => p.id === id)).filter(Boolean) as Propiedad[]
      setSelected(ordered)
    } catch { setSelected([]) }
  }, [value, allProps])

  const ids = selected.map(p => p.id)

  const add = (p: Propiedad) => {
    if (selected.length >= 6 || ids.includes(p.id)) return
    const next = [...selected, p]
    setSelected(next)
    onChange(JSON.stringify(next.map(x => x.id)))
  }

  const remove = (id: string) => {
    const next = selected.filter(p => p.id !== id)
    setSelected(next)
    onChange(JSON.stringify(next.map(x => x.id)))
  }

  const onDragStart = (i: number) => { dragIdx.current = i }
  const onDragEnter = (i: number) => { dragOver.current = i }
  const onDragEnd   = () => {
    if (dragIdx.current === null || dragOver.current === null) return
    const next = [...selected]
    const [moved] = next.splice(dragIdx.current, 1)
    next.splice(dragOver.current, 0, moved)
    dragIdx.current = null; dragOver.current = null
    setSelected(next)
    onChange(JSON.stringify(next.map(x => x.id)))
  }

  const thumb = (p: Propiedad) => thumbUrl(p.imagen_principal || p.imagenes?.[0] || '')
  const precio = (p: Propiedad) => p.a_consultar ? 'A consultar' : p.precio_uf ? `UF ${p.precio_uf.toLocaleString('es-CL')}` : '—'
  const available = allProps.filter(p => !ids.includes(p.id))

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Elige hasta <strong>6 propiedades</strong> para el Inicio. Arrastra para reordenar.</p>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 10 }}>Seleccionadas ({selected.length}/6)</div>
        {selected.length === 0 && <div style={{ padding: '16px', background: 'var(--off)', borderRadius: 4, fontSize: 13, color: 'var(--muted)', textAlign: 'center' }}>Aún no hay propiedades seleccionadas.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selected.map((p, i) => (
            <div key={p.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#fff', border: '1px solid var(--border)', borderRadius: 4, cursor: 'grab' }}>
              <span style={{ color: 'var(--muted)', fontSize: 16 }}>⠿</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', minWidth: 20 }}>{i + 1}</span>
              {thumb(p) && <img src={thumb(p)} alt="" style={{ width: 48, height: 36, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.comuna} · {precio(p)}</div>
              </div>
              <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E24B4A', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
          ))}
        </div>
      </div>
      {selected.length < 6 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 10 }}>Disponibles — clic para agregar</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 400, overflowY: 'auto', padding: 4 }}>
            {available.map(p => (
              <div key={p.id} onClick={() => add(p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--off)', border: '1px solid transparent', borderRadius: 4, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = '#f0faf4' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'var(--off)' }}>
                {thumb(p) && <img src={thumb(p)} alt="" style={{ width: 40, height: 32, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{precio(p)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ContenidoAdmin() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [pagina, setPagina] = useState<'inicio'|'testimonios'|'quienes'|'servicios'|'asociados'|'blog'|'contacto'>('inicio')
  const scrollPositions = useRef<Record<string, number>>({})

  const handlePaginaChange = (key: typeof pagina) => {
    scrollPositions.current[pagina] = window.scrollY
    setPagina(key)
    setTimeout(() => { window.scrollTo({ top: scrollPositions.current[key] || 0 }) }, 50)
  }

  const [d, setD] = useState({
    hero_imagen_url: '', hero_imagen_url_2: '', hero_imagen_url_3: '', hero_imagen_url_4: '', hero_imagen_url_5: '',
    hero_kicker: 'Inversión inmobiliaria · Chile & el mundo',
    hero_titulo_1: 'Tu socio', hero_titulo_2: 'en bienes', hero_titulo_3: 'raíces',
    hero_subtitulo: 'Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el extranjero. Financiamiento sin pagos adelantados.',
    hero_location: 'Las Condes · Santiago · Chile',
    stats_propiedades: '120', stats_anios: '15', stats_paises: '10', stats_clientes: '500',
    financiamiento_titulo: '¿Necesitas financiamiento?',
    financiamiento_body: 'Gestionamos créditos de consumo, hipotecarios y bancarización para personas y empresas en Chile y el extranjero. Sin pagos adelantados.',
    testimonial_1_texto: 'SDM Capital hizo posible el sueño de mi familia de adquirir nuestra primera vivienda en Santiago.',
    testimonial_1_autor: 'María Sánchez · Santiago, Chile', testimonial_1_url: '',
    testimonial_2_texto: 'Como inversionista internacional, SDM Capital simplificó todo el proceso.',
    testimonial_2_autor: 'Carlos González · Miami, Florida, EE. UU.', testimonial_2_url: '',
    testimonial_3_texto: 'Su conocimiento del mercado y atención personalizada hicieron que el proceso fuera completamente libre de estrés.',
    testimonial_3_autor: 'Isabel Ríos · Viña del Mar, Chile', testimonial_3_url: '',
    testimonial_4_texto: '', testimonial_4_autor: '', testimonial_4_url: '',
    testimonial_5_texto: '', testimonial_5_autor: '', testimonial_5_url: '',
    testimonial_6_texto: '', testimonial_6_autor: '', testimonial_6_url: '',
    testimonial_7_texto: '', testimonial_7_autor: '', testimonial_7_url: '',
    testimonial_8_texto: '', testimonial_8_autor: '', testimonial_8_url: '',
    testimonios_titulo: 'Palabras de nuestros clientes',
    testimonios_subtitulo: 'La satisfacción de nuestros clientes es nuestra mejor carta de presentación.',
    props_label: 'Selección editorial', catalogo_orden: 'manual', home_destacadas_ids: '[]',
    props_titulo: 'Oportunidades', props_titulo_em: 'en Chile',
    props_sub: 'Propiedades curadas por nuestro equipo de expertos.',
    props_ver_todas: 'Ver todas las propiedades',
    qs_titulo: 'Tu socio estratégico en bienes raíces',
    qs_subtitulo: 'SDM Capital es una empresa chilena especializada en inversión inmobiliaria y gestión de financiamiento, con más de 15 años conectando personas con oportunidades únicas.',
    qs_historia_1: 'SDM Capital nació con una visión clara: democratizar el acceso a inversiones inmobiliarias de calidad para personas y empresas en Chile.',
    qs_historia_2: 'A lo largo de más de 15 años, hemos construido una red de socios y alianzas estratégicas que nos permite ofrecer oportunidades únicas en Chile y en más de 10 países del mundo.',
    qs_historia_3: 'Hoy somos referentes en gestión de financiamiento y asesoría inmobiliaria, con un equipo de expertos comprometidos con los resultados de cada cliente.',
    servicios_intro: 'Soluciones integrales en inversión inmobiliaria y financiamiento, tanto en Chile como en el extranjero.',
    servicio_inv_int_titulo: 'Inversión Internacional', servicio_inv_int_visible: 'true',
    servicio_inv_int_desc: 'Accede a oportunidades inmobiliarias en EE.UU., España, República Dominicana, Uruguay y más.',
    servicio_inv_int_tags: 'Estados Unidos,España,Rep. Dominicana,Uruguay',
    servicio_inv_cl_titulo: 'Inversión en Chile', servicio_inv_cl_visible: 'true',
    servicio_inv_cl_desc: 'Casas, departamentos, oficinas, parcelas y proyectos comerciales en todo Chile.',
    servicio_inv_cl_tags: 'R. Metropolitana,Valparaíso,Coquimbo,Los Lagos',
    servicio_fin_per_titulo: 'Financiamiento Personas', servicio_fin_per_visible: 'true',
    servicio_fin_per_desc: 'Gestión de crédito hipotecario y consumo para personas naturales. Sin pagos adelantados.',
    servicio_fin_per_tags: 'Chile,Internacional',
    servicio_fin_emp_titulo: 'Financiamiento Empresas', servicio_fin_emp_visible: 'true',
    servicio_fin_emp_desc: 'Soluciones de financiamiento corporativo y leasing inmobiliario para empresas de todos los tamaños.',
    servicio_fin_emp_tags: 'Chile,Internacional',
    servicio_banco_titulo: 'Bancarización en el Extranjero', servicio_banco_visible: 'false',
    servicio_banco_desc: 'Te ayudamos a abrir cuentas bancarias y acceder a servicios financieros en el extranjero.',
    servicio_banco_tags: 'EE.UU.,España,Uruguay,Rep. Dominicana',
    financiamiento_imagen: '', quienes_imagen_historia: '',
    servicio_inv_int_imagen: '', servicio_inv_cl_imagen: '',
    servicio_fin_per_imagen: '', servicio_fin_emp_imagen: '', servicio_banco_imagen: '',
    dest_miami_img: '', dest_punta_cana_img: '', dest_orlando_img: '',
    dest_espana_img: '', dest_uruguay_img: '', dest_nueva_york_img: '',
    asociados_intro: 'Trabajamos con una red selecta de socios estratégicos que nos permiten ofrecer a nuestros clientes el mejor servicio integral en cada etapa del proceso inmobiliario y financiero.',
    asociados_cta: 'Si tu empresa comparte nuestros valores de excelencia y transparencia, nos encantaría explorar una colaboración estratégica.',
    blog_titulo: 'Blog SDM Capital',
    blog_subtitulo: 'Noticias, análisis y tendencias del mercado inmobiliario en Chile y el mundo.',
    empresa_nombre: 'SDM Capital', tagline: 'Tu socio confiable en el mundo de los bienes raíces.',
    footer_tagline: 'Tu socio confiable en el mundo de los bienes raíces.',
    direccion: 'Av. Apoquindo 5583, Las Condes, Santiago',
    telefono_1: '+56 9 3103 8954', telefono_2: '+56 9 6191 2281',
    email: 'contacto@sdmcapital.cl', horario: 'Lunes a Viernes · 09:00 – 18:00',
    whatsapp: '56937478846',
    facebook: 'https://www.facebook.com/sdmcapitalrestate',
    instagram: 'https://instagram.com/sdmcapital',
    tiktok: 'https://www.tiktok.com/@sdmcapital_realestate',
    linkedin: 'https://www.linkedin.com/company/sdmcapital/',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    supabase.from('contenido_sitio').select('clave, valor').then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('contenido_sitio').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    invalidateContenidoCache()
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-6">
      <h3 className="font-serif font-light mb-6 pb-4 border-b border-[#e8edf2]" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  )
  const Full = ({ children }: { children: React.ReactNode }) => <div className="md:col-span-2">{children}</div>

  const PAGINAS = [
    { key: 'inicio', label: '🏠 Inicio' }, { key: 'testimonios', label: '💬 Testimonios' },
    { key: 'quienes', label: '👥 Quiénes Somos' }, { key: 'servicios', label: '💼 Servicios' },
    { key: 'asociados', label: '🤝 Asociados' }, { key: 'blog', label: '📝 Blog' },
    { key: 'contacto', label: '📍 Contacto y Redes' },
  ] as const

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Textos del sitio</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {PAGINAS.map(p => (
          <button key={p.key} onClick={() => handlePaginaChange(p.key)}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: pagina === p.key ? 600 : 300, borderRadius: 2, border: pagina === p.key ? '2px solid var(--green)' : '1px solid var(--border)', background: pagina === p.key ? 'var(--green)' : '#fff', color: pagina === p.key ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {p.label}
          </button>
        ))}
      </div>

      {pagina === 'inicio' && <>
        <Sec title="🖼 Fotos del hero — Carrusel">
          <Full>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>Sube hasta 5 fotos. <strong>Arrastra para reordenar.</strong></p>
            <CarouselPhotoManager d={d as unknown as Record<string, string>} setD={setD as unknown as (fn: (prev: Record<string, string>) => Record<string, string>) => void} />
          </Full>
        </Sec>
        <Sec title="📝 Título y subtítulo del hero">
          <Field label="Línea 1"><Inp value={d.hero_titulo_1} onChange={set('hero_titulo_1')} /></Field>
          <Field label="Línea 2"><Inp value={d.hero_titulo_2} onChange={set('hero_titulo_2')} /></Field>
          <Field label="Línea 3 (negrita)"><Inp value={d.hero_titulo_3} onChange={set('hero_titulo_3')} /></Field>
          <Field label="Kicker superior"><Inp value={d.hero_kicker} onChange={set('hero_kicker')} /></Field>
          <Full><Field label="Subtítulo"><Txa value={d.hero_subtitulo} onChange={set('hero_subtitulo')} rows={2} /></Field></Full>
          <Field label="Texto de ubicación"><Inp value={d.hero_location} onChange={set('hero_location')} /></Field>
        </Sec>
        <Sec title="📊 Estadísticas animadas">
          <Field label="Propiedades"><Inp type="number" value={d.stats_propiedades} onChange={set('stats_propiedades')} /></Field>
          <Field label="Años de experiencia"><Inp type="number" value={d.stats_anios} onChange={set('stats_anios')} /></Field>
          <Field label="Países"><Inp type="number" value={d.stats_paises} onChange={set('stats_paises')} /></Field>
          <Field label="Clientes satisfechos"><Inp type="number" value={d.stats_clientes} onChange={set('stats_clientes')} /></Field>
        </Sec>
        <Sec title="🗂 Orden del catálogo">
          <Full>
            <Field label="¿Cómo se ordenan las propiedades?">
              <Sel value={d.catalogo_orden || 'manual'} onChange={set('catalogo_orden')}
                options={[
                  { value: 'manual',      label: 'Manual — según el orden que elijo (arrastrando filas)' },
                  { value: 'precio_alto', label: 'Precio: más alto primero' },
                  { value: 'precio_bajo', label: 'Precio: más bajo primero' },
                  { value: 'aleatorio',   label: 'Aleatorio — cambia en cada visita' },
                ]} />
            </Field>
          </Full>
        </Sec>
        <Sec title="🏠 Propiedades destacadas en el Inicio">
          <Full><HomeDestacadasSelector value={d.home_destacadas_ids || '[]'} onChange={v => setD(p => ({ ...p, home_destacadas_ids: v }))} /></Full>
        </Sec>
        <Sec title="💰 Sección Financiamiento">
          <Field label="Título"><Inp value={d.financiamiento_titulo} onChange={set('financiamiento_titulo')} /></Field>
          <Full><Field label="Descripción"><Txa value={d.financiamiento_body} onChange={set('financiamiento_body')} rows={3} /></Field></Full>
          <Full><Field label="Foto de apoyo"><ImageUploader currentUrl={d.financiamiento_imagen} folder="paginas" onUploaded={url => setD(p => ({ ...p, financiamiento_imagen: url }))} /></Field></Full>
        </Sec>
        <Sec title="🌎 Fotos de destinos internacionales">
          {[
            { key: 'dest_miami_img', label: '🏙 Miami' }, { key: 'dest_punta_cana_img', label: '🏖 Punta Cana' },
            { key: 'dest_orlando_img', label: '🎡 Orlando' }, { key: 'dest_espana_img', label: '🇪🇸 España' },
            { key: 'dest_uruguay_img', label: '🇺🇾 Uruguay' }, { key: 'dest_nueva_york_img', label: '🗽 Nueva York' },
          ].map(({ key, label }) => (
            <Full key={key}><Field label={label}><ImageUploader currentUrl={(d as Record<string,string>)[key] || ''} folder="destinos" onUploaded={url => setD(p => ({ ...p, [key]: url }))} /></Field></Full>
          ))}
        </Sec>
      </>}

      {pagina === 'testimonios' && <>
        <Sec title="💬 Testimonios">
          <Full><Field label="Título"><Inp value={d.testimonios_titulo} onChange={set('testimonios_titulo')} /></Field></Full>
          <Full><Field label="Subtítulo"><Inp value={d.testimonios_subtitulo} onChange={set('testimonios_subtitulo')} /></Field></Full>
          {[1,2,3,4,5,6,7,8].map(n => (
            <Full key={n}>
              <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Testimonio {n}</div>
                <Field label="Texto"><Txa value={(d as Record<string,string>)[`testimonial_${n}_texto`] || ''} onChange={set(`testimonial_${n}_texto`)} rows={3} /></Field>
                <Field label="Autor"><Inp value={(d as Record<string,string>)[`testimonial_${n}_autor`] || ''} onChange={set(`testimonial_${n}_autor`)} /></Field>
                <Field label='URL historia'><Inp value={(d as Record<string,string>)[`testimonial_${n}_url`] || ''} onChange={set(`testimonial_${n}_url`)} placeholder="https://..." /></Field>
              </div>
            </Full>
          ))}
        </Sec>
      </>}

      {pagina === 'quienes' && <>
        <Sec title="👥 Quiénes Somos">
          <Field label="Título principal"><Inp value={d.qs_titulo} onChange={set('qs_titulo')} /></Field>
          <Full><Field label="Subtítulo"><Txa value={d.qs_subtitulo} onChange={set('qs_subtitulo')} rows={3} /></Field></Full>
          <Full><Field label="Párrafo 1"><Txa value={d.qs_historia_1} onChange={set('qs_historia_1')} rows={3} /></Field></Full>
          <Full><Field label="Párrafo 2"><Txa value={d.qs_historia_2} onChange={set('qs_historia_2')} rows={3} /></Field></Full>
          <Full><Field label="Párrafo 3"><Txa value={d.qs_historia_3} onChange={set('qs_historia_3')} rows={3} /></Field></Full>
          <Full><Field label="📷 Foto oficina / equipo"><ImageUploader currentUrl={d.quienes_imagen_historia} folder="paginas" onUploaded={url => setD(p => ({ ...p, quienes_imagen_historia: url }))} /></Field></Full>
        </Sec>
      </>}

      {pagina === 'servicios' && <>
        <Sec title="💼 Servicios — Introducción">
          <Full><Field label="Texto introductorio"><Txa value={d.servicios_intro} onChange={set('servicios_intro')} rows={2} /></Field></Full>
        </Sec>
        {[
          { key: 'inv_int', label: 'Inversión Internacional',        imgKey: 'servicio_inv_int_imagen' },
          { key: 'inv_cl',  label: 'Inversión en Chile',             imgKey: 'servicio_inv_cl_imagen'  },
          { key: 'fin_per', label: 'Financiamiento Personas',        imgKey: 'servicio_fin_per_imagen' },
          { key: 'fin_emp', label: 'Financiamiento Empresas',        imgKey: 'servicio_fin_emp_imagen' },
          { key: 'banco',   label: 'Bancarización en el Extranjero', imgKey: 'servicio_banco_imagen'   },
        ].map(({ key, label, imgKey }) => {
          const isVisible = (d as Record<string,string>)[`servicio_${key}_visible`] !== 'false'
          return (
            <Sec key={key} title={`${isVisible ? '👁' : '🚫'} ${label}`}>
              <Full>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isVisible ? '#f0faf4' : '#fff3f3', borderRadius: 4, border: `1px solid ${isVisible ? '#86efac' : '#fca5a5'}`, marginBottom: 8 }}>
                  <button onClick={() => setD(p => ({ ...p, [`servicio_${key}_visible`]: isVisible ? 'false' : 'true' }))}
                    style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: isVisible ? 'var(--green)' : '#ccc', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 2, left: isVisible ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isVisible ? '#16a34a' : '#dc2626' }}>{isVisible ? '✓ Visible' : '⏸ Oculto'}</span>
                </div>
              </Full>
              <Field label="Título"><Inp value={(d as Record<string,string>)[`servicio_${key}_titulo`] || ''} onChange={set(`servicio_${key}_titulo`)} /></Field>
              <Full><Field label="Descripción"><Txa value={(d as Record<string,string>)[`servicio_${key}_desc`] || ''} onChange={set(`servicio_${key}_desc`)} rows={3} /></Field></Full>
              <Full><Field label='Tags (separados por coma)'><Txa value={(d as Record<string,string>)[`servicio_${key}_tags`] || ''} onChange={set(`servicio_${key}_tags`)} rows={2} /></Field></Full>
              <Full><Field label="Foto"><ImageUploader currentUrl={(d as Record<string,string>)[imgKey] || ''} folder="servicios" onUploaded={url => setD(p => ({ ...p, [imgKey]: url }))} /></Field></Full>
            </Sec>
          )
        })}
      </>}

      {pagina === 'asociados' && <>
        <Sec title="🤝 Asociados">
          <Full><Field label="Párrafo introductorio"><Txa value={d.asociados_intro} onChange={set('asociados_intro')} rows={3} /></Field></Full>
          <Full><Field label="CTA para nuevos socios"><Txa value={d.asociados_cta} onChange={set('asociados_cta')} rows={2} /></Field></Full>
        </Sec>
      </>}

      {pagina === 'blog' && <>
        <Sec title="📝 Blog — Encabezado">
          <Field label="Título"><Inp value={d.blog_titulo} onChange={set('blog_titulo')} /></Field>
          <Field label="Subtítulo"><Inp value={d.blog_subtitulo} onChange={set('blog_subtitulo')} /></Field>
        </Sec>
      </>}

      {pagina === 'contacto' && <>
        <Sec title="🏢 Datos de la empresa">
          <Field label="Nombre empresa"><Inp value={d.empresa_nombre} onChange={set('empresa_nombre')} /></Field>
          <Full><Field label="Texto del footer"><Txa value={d.footer_tagline} onChange={set('footer_tagline')} rows={2} /></Field></Full>
          <Field label="Dirección"><Inp value={d.direccion} onChange={set('direccion')} /></Field>
          <Field label="Horario"><Inp value={d.horario} onChange={set('horario')} /></Field>
          <Field label="Teléfono 1"><Inp value={d.telefono_1} onChange={set('telefono_1')} /></Field>
          <Field label="Teléfono 2"><Inp value={d.telefono_2} onChange={set('telefono_2')} /></Field>
          <Field label="Email"><Inp type="email" value={d.email} onChange={set('email')} /></Field>
          <Field label="WhatsApp (solo números)"><Inp value={d.whatsapp} onChange={set('whatsapp')} placeholder="56931038954" /></Field>
        </Sec>
        <Sec title="📱 Redes sociales">
          <Field label="Facebook"><Inp value={d.facebook} onChange={set('facebook')} /></Field>
          <Field label="Instagram"><Inp value={d.instagram} onChange={set('instagram')} /></Field>
          <Field label="TikTok"><Inp value={d.tiktok} onChange={set('tiktok')} /></Field>
          <Field label="LinkedIn"><Inp value={d.linkedin} onChange={set('linkedin')} /></Field>
        </Sec>
      </>}

      <div className="flex justify-end mt-4">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  )
}

// ─── FOTOS ────────────────────────────────────────────────────────────────────
function FotosAdmin() {
  const [files, setFiles]   = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState('')

  const load = async () => {
    const { data } = await supabase.storage.from('imagenes').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
    if (data) setFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({ name: f.name, url: supabase.storage.from('imagenes').getPublicUrl(f.name).data.publicUrl })))
  }
  useEffect(() => { load() }, [])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await subirImagen(file, 'general')
    setUploading(false); load()
  }

  const del = async (name: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await supabase.storage.from('imagenes').remove([name]); load()
  }

  const copy = (url: string) => {
    navigator.clipboard.writeText(url); setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Gestión de imágenes</h2>
      </div>
      <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-8">
        <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 8 }}>Subir nueva imagen</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>Sube fotos y copia la URL para usarla donde necesites.</p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '11px 24px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {uploading ? 'Subiendo…' : '+ Seleccionar imagen'}
          <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
      {files.length === 0
        ? <div className="text-center py-16" style={{ fontSize: 15, color: 'var(--muted)', fontStyle: 'italic' }}>No hay imágenes. Sube la primera.</div>
        : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(f => (
              <div key={f.name} className="bg-white border border-[#e8edf2] rounded-sm overflow-hidden">
                <div style={{ height: 140, background: 'var(--off)', overflow: 'hidden' }}>
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => copy(f.url)} style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '7px 0', borderRadius: 2, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: copied === f.url ? 'var(--green)' : 'var(--navy-dark)', color: '#fff', transition: 'background 0.2s' }}>
                      {copied === f.url ? '✓ Copiada' : 'Copiar URL'}
                    </button>
                    <button onClick={() => del(f.name)} style={{ fontSize: 12, padding: '7px 10px', borderRadius: 2, border: '1px solid #fca5a5', cursor: 'pointer', background: 'none', color: '#E24B4A', fontFamily: 'inherit' }}>✕</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── BARRANCO ADMIN ───────────────────────────────────────────────────────────
function BarrancoAdmin() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [d, setD] = useState<Record<string, string>>({
    // ── Hero ──
    hero_titulo: 'Hotel El Barranco',
    hero_subtitulo: 'Where the river meets the mountains', hero_subtitulo_es: '',
    hero_tagline: "A fully operational boutique hotel and restaurant with 25 years of history, positioned at the gateway to one of the world's premier adventure destinations. Offered turnkey — ready to continue, ready to grow.",
    hero_tagline_es: '',
    banner_foto: '', banner_detalle_foto: '', destination_foto: '',
    hero_img_1: '', hero_img_2: '', hero_img_3: '', hero_img_4: '',
    // ── Destination ──
    destination_p1: 'Nested deep within Chilean Patagonia, Futaleufú is a name whispered among adventurers across the globe. Its river — a torrent of glacial turquoise — carries Class V+ rapids through valleys of impossible beauty. The kind of place that changes people.',
    destination_p1_es: '',
    destination_p2: 'El Barranco has welcomed guests at the center of it all for over two decades. Anglers from Montana, kayakers from Europe, families discovering Patagonia for the first time. The destination does the marketing. The hotel delivers the experience.',
    destination_p2_es: '',
    dest_eyebrow: 'The Destination', dest_eyebrow_es: '',
    dest_titulo: 'Futaleufú — A world unto itself', dest_titulo_es: '',
    dest_stat1_num: '25+', dest_stat1_label: 'Years in operation',
    dest_stat2_num: 'Class V+', dest_stat2_label: 'River rating',
    dest_stat3_num: '10', dest_stat3_label: 'Hotel rooms',
    dest_stat_1_label: 'Years in operation', dest_stat_1_label_es: '',
    dest_stat_2_label: 'River rating', dest_stat_2_label_es: '',
    dest_stat_3_label: 'Hotel rooms', dest_stat_3_label_es: '',
    // ── Activities ──
    act_1_img: '', actividad_1_titulo: 'Whitewater Rafting', actividad_1_titulo_es: '', actividad_1_sub: 'Class V+ · Río Futaleufú', actividad_1_sub_es: '',
    act_2_img: '', actividad_2_titulo: 'Fly Fishing',         actividad_2_titulo_es: '', actividad_2_sub: 'World-class trout · Patagonia', actividad_2_sub_es: '',
    act_3_img: '', actividad_3_titulo: 'Trekking & Riding',   actividad_3_titulo_es: '', actividad_3_sub: 'Valle Las Escalas · Glaciers',  actividad_3_sub_es: '',
    exp_eyebrow: 'The Experience', exp_eyebrow_es: '',
    exp_titulo: 'Adventures at your doorstep', exp_titulo_es: '',
    act_p: "Beyond the river: guided fly fishing on Lago Lonconao and Río Espolón, family floating, horseback riding through Valle Las Escalas, trekking to hidden glacier lakes, and kayaking across Patagonia's most pristine waterways.",
    act_p_es: '',
    // ── Property ──
    prop_eyebrow: 'The Property', prop_eyebrow_es: '',
    prop_titulo: 'Rooms, Restaurant & Amenities', prop_titulo_es: '',
    propiedad_desc: 'Designed in mountain architecture, El Barranco offers 10 fully equipped rooms — each approximately 24 m² with en-suite bathroom — alongside a 40-seat restaurant rooted in Patagonian cuisine. Lamb, trout, regional produce. The kind of table guests remember.',
    propiedad_desc_es: '',
    prop_foto1: '', prop_foto2: '', prop_foto3: '', prop_foto4: '',
    // ── Amenidades ──
    amenidad_1_titulo: '10 Rooms',         amenidad_1_titulo_es: '', amenidad_1_desc: '24 m² each, en-suite, fully furnished',          amenidad_1_desc_es: '',
    amenidad_2_titulo: 'Restaurant',       amenidad_2_titulo_es: '', amenidad_2_desc: '40 covers, full bar, liquor license',             amenidad_2_desc_es: '',
    amenidad_3_titulo: 'Wellness',         amenidad_3_titulo_es: '', amenidad_3_desc: 'Pool 5×7, sauna, massage room',                   amenidad_3_desc_es: '',
    amenidad_4_titulo: 'Residence',        amenidad_4_titulo_es: '', amenidad_4_desc: "Separate 2BD/2BA owner's house + office",         amenidad_4_desc_es: '',
    amenidad_5_titulo: 'Infrastructure',   amenidad_5_titulo_es: '', amenidad_5_desc: '17kW generator, pellet boiler, laundry',          amenidad_5_desc_es: '',
    amenidad_6_titulo: 'Parking',          amenidad_6_titulo_es: '', amenidad_6_desc: '5 vehicle capacity on-site',                      amenidad_6_desc_es: '',
    amenidad_7_titulo: 'Turnkey Sale',     amenidad_7_titulo_es: '', amenidad_7_desc: 'All furniture & equipment included',              amenidad_7_desc_es: '',
    amenidad_8_titulo: 'Registered Brand', amenidad_8_titulo_es: '', amenidad_8_desc: 'El Barranco — INAPI certified',                   amenidad_8_desc_es: '',
    // ── Investment Brief — The Story ──
    story_p1: "A business that runs itself for half the year — imagine what you could do with the other half.", story_p1_es: '',
    story_p2: "El Barranco currently operates only during peak season (6 months) due to the health of its current owners. The infrastructure is complete, the brand is established, the market is ready. A new operator stepping in with full-year ambition faces no capital expenditure barrier — only upside.", story_p2_es: '',
    story_p3: "Futaleufú's position as a year-round destination is growing. Winter fly fishing, wellness retreats, and off-season adventure travel represent untapped revenue lines that the existing installation can absorb immediately.", story_p3_es: '',
    opp_eyebrow: 'The Opportunity', opp_eyebrow_es: '',
    opp_titulo: 'An asset built to scale', opp_titulo_es: '',
    opp_tab_story: 'The Story', opp_tab_story_es: '',
    opp_tab_brief: 'Investment Brief', opp_tab_brief_es: '',
    brief_precio: 'USD 3M', brief_revenue: '$181M', brief_meses: '6 → 12', brief_guests: '1,975', brief_terreno: '1,100 m²',
    brief_note1: 'UF 68,000 — all assets, inventory, brand & IP included',
    brief_note2: '2022 — operating only 6 months of the year',
    brief_note3: 'Current vs. full-year potential with no additional capex',
    brief_note4: '2022 — from a 10-room boutique hotel',
    brief_note5: '650 m² built · established 2000 · north orientation',
    brief_note6: 'SDM Capital Real Estate · +56 9 3103 8954',
    brief_upside_titulo: 'The growth path is clear', brief_upside_titulo_es: '',
    brief_upside_texto: 'Extend operations to 8–12 months · Develop winter and wellness programming · Partner with international adventure operators already active in the region · Leverage 25 years of brand equity and an established digital presence.', brief_upside_texto_es: '',
    brief_legal_titulo: 'Legal standing', brief_legal_titulo_es: '',
    brief_legal_texto: 'Property documentation current · Active commercial restaurant license (including spirits) · Hotel operating license · INAPI registered brand · Tax ID Rol 33-006 · Minor areas pending regularization: massage room, sauna, laundry (standard process, no operational impact). Staff of 6–7 available to continue with new ownership.', brief_legal_texto_es: '',
    // ── Ficha Técnica — Infrastructure (7 filas) ──
    ficha_infra_1_key: 'Land area',           ficha_infra_1_key_es: '', ficha_infra_1_val: '1,100 m²',                   ficha_infra_1_val_es: '',
    ficha_infra_2_key: 'Built area',          ficha_infra_2_key_es: '', ficha_infra_2_val: '~650 m²',                    ficha_infra_2_val_es: '',
    ficha_infra_3_key: 'Year built',          ficha_infra_3_key_es: '', ficha_infra_3_val: '2000',                       ficha_infra_3_val_es: '',
    ficha_infra_4_key: 'Orientation',         ficha_infra_4_key_es: '', ficha_infra_4_val: 'North',                      ficha_infra_4_val_es: '',
    ficha_infra_5_key: 'Rooms',               ficha_infra_5_key_es: '', ficha_infra_5_val: '10 (24 m² + en-suite each)', ficha_infra_5_val_es: '',
    ficha_infra_6_key: 'Restaurant capacity', ficha_infra_6_key_es: '', ficha_infra_6_val: '40 guests',                  ficha_infra_6_val_es: '',
    ficha_infra_7_key: 'Pool',                ficha_infra_7_key_es: '', ficha_infra_7_val: '5 × 7 m',                   ficha_infra_7_val_es: '',
    // ── Ficha Técnica — Equipment (7 filas) ──
    ficha_equip_1_key: 'Kitchen',      ficha_equip_1_key_es: '', ficha_equip_1_val: 'Industrial ovens, range, blast chiller', ficha_equip_1_val_es: '',
    ficha_equip_2_key: 'Cold storage', ficha_equip_2_key_es: '', ficha_equip_2_val: 'Walk-in fridges & freezers',             ficha_equip_2_val_es: '',
    ficha_equip_3_key: 'Dishwashing',  ficha_equip_3_key_es: '', ficha_equip_3_val: 'Industrial dishwasher + dough mixer',    ficha_equip_3_val_es: '',
    ficha_equip_4_key: 'Laundry',      ficha_equip_4_key_es: '', ficha_equip_4_val: 'Washers, dryer, industrial press',       ficha_equip_4_val_es: '',
    ficha_equip_5_key: 'Energy',       ficha_equip_5_key_es: '', ficha_equip_5_val: 'Pellet boiler + 17kW generator',         ficha_equip_5_val_es: '',
    ficha_equip_6_key: 'Amenities',    ficha_equip_6_key_es: '', ficha_equip_6_val: 'Pool equipment, sauna, massage room',    ficha_equip_6_val_es: '',
    ficha_equip_7_key: 'Furniture',    ficha_equip_7_key_es: '', ficha_equip_7_val: 'All rooms, restaurant, common areas',    ficha_equip_7_val_es: '',
    // ── Ficha Técnica — Legal (6 filas) ──
    ficha_legal_1_key: 'Title deed',          ficha_legal_1_key_es: '', ficha_legal_1_val: 'Current',                      ficha_legal_1_val_es: '',
    ficha_legal_2_key: 'Restaurant license',  ficha_legal_2_key_es: '', ficha_legal_2_val: 'Active (incl. spirits)',         ficha_legal_2_val_es: '',
    ficha_legal_3_key: 'Hotel license',       ficha_legal_3_key_es: '', ficha_legal_3_val: 'Active',                        ficha_legal_3_val_es: '',
    ficha_legal_4_key: 'Brand registration',  ficha_legal_4_key_es: '', ficha_legal_4_val: 'INAPI — El Barranco',            ficha_legal_4_val_es: '',
    ficha_legal_5_key: 'Tax ID (Rol)',         ficha_legal_5_key_es: '', ficha_legal_5_val: '33-006',                        ficha_legal_5_val_es: '',
    ficha_legal_6_key: 'Address',             ficha_legal_6_key_es: '', ficha_legal_6_val: "B. O'Higgins 172, Futaleufú",   ficha_legal_6_val_es: '',
    // ── Ficha Técnica — Operations (6 filas) ──
    ficha_ops_1_key: 'Current season',    ficha_ops_1_key_es: '', ficha_ops_1_val: '6 months/year (peak)',         ficha_ops_1_val_es: '',
    ficha_ops_2_key: 'Potential season',  ficha_ops_2_key_es: '', ficha_ops_2_val: '8–12 months/year',             ficha_ops_2_val_es: '',
    ficha_ops_3_key: 'Staff',             ficha_ops_3_key_es: '', ficha_ops_3_val: '6–7 people',                   ficha_ops_3_val_es: '',
    ficha_ops_4_key: 'Sale type',         ficha_ops_4_key_es: '', ficha_ops_4_val: 'Turnkey — immediate takeover', ficha_ops_4_val_es: '',
    ficha_ops_5_key: "Owner's residence", ficha_ops_5_key_es: '', ficha_ops_5_val: 'Separate 2BD/2BA house',       ficha_ops_5_val_es: '',
    ficha_ops_6_key: 'Asking price',      ficha_ops_6_key_es: '', ficha_ops_6_val: 'UF 68,000 (~USD 3,000,000)',  ficha_ops_6_val_es: '',
    // ── Gallery ──
    details_eyebrow: 'Property Details', details_eyebrow_es: '',
    details_titulo: 'Technical overview', details_titulo_es: '',
    details_tab_infra: 'Infrastructure', details_tab_infra_es: '',
    details_tab_equip: 'Equipment Included', details_tab_equip_es: '',
    details_tab_legal: 'Legal', details_tab_legal_es: '',
    details_tab_ops: 'Operations', details_tab_ops_es: '',
    gallery_eyebrow: 'Gallery', gallery_eyebrow_es: '',
    gallery_titulo: 'The property in images', gallery_titulo_es: '',
    gallery_1: '', gallery_2: '', gallery_3: '', gallery_4: '',
    gallery_5: '', gallery_6: '', gallery_7: '',
    // ── Contact ──
    contact_eyebrow: 'Exclusive Listing', contact_eyebrow_es: '',
    contact_titulo: 'Begin your conversation', contact_titulo_es: '',
    precio_display: 'USD 3,000,000',
    precio_sub: 'UF 68,000 · Turnkey · Futaleufú, Chile', precio_sub_es: '',
    contacto_parrafo: 'Boutique hospitality assets with validated operations, a registered brand, and full infrastructure in world-class adventure destinations do not come to market often.', contacto_parrafo_es: '',
    contacto_telefono: '+56 9 3103 8954',
    contacto_empresa: 'SDM Capital Real Estate',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    supabase.from('showcase_barranco').select('clave, valor').then(({ data }) => {
      if (data) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }: { clave: string; valor: string }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('showcase_barranco').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    setSaving(false)
    if (error) { alert('Error al guardar: ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-6">
      <h3 className="font-serif font-light mb-6 pb-4 border-b border-[#e8edf2]" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  )
  const Full = ({ children }: { children: React.ReactNode }) => <div className="md:col-span-2">{children}</div>

  // Render helpers — EN 🇬🇧 / ES 🇨🇱 side by side
  const bi = (keyEn: string, keyEs: string, label: string) => (
    <>
      <Field label={`${label} EN 🇬🇧`}><Inp value={d[keyEn] ?? ''} onChange={set(keyEn)} /></Field>
      <Field label={`${label} ES 🇨🇱`}><Inp value={d[keyEs] ?? ''} onChange={set(keyEs)} placeholder="Vacío = usa EN" /></Field>
    </>
  )
  const biTxa = (keyEn: string, keyEs: string, label: string, rows = 3) => (
    <>
      <Full><Field label={`${label} EN 🇬🇧`}><Txa rows={rows} value={d[keyEn] ?? ''} onChange={set(keyEn)} /></Field></Full>
      <Full><Field label={`${label} ES 🇨🇱`}><Txa rows={rows} value={d[keyEs] ?? ''} onChange={set(keyEs)} placeholder="Vacío = usa EN" /></Field></Full>
    </>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>🏨 El Barranco — Showcase</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      {/* ── Hero ── */}
      <Sec title="🎬 Hero">
        <Field label="Título (igual EN/ES)"><Inp value={d.hero_titulo} onChange={set('hero_titulo')} /></Field>
        <div />
        {bi('hero_subtitulo', 'hero_subtitulo_es', 'Subtítulo')}
        {biTxa('hero_tagline', 'hero_tagline_es', 'Tagline / descripción')}
        <Full><Field label="Foto sección Destino">
          <ImageUploader currentUrl={d.destination_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, destination_foto: url }))} />
        </Field></Full>
        <Full><Field label="Foto banner principal (showcase)">
          <ImageUploader currentUrl={d.banner_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, banner_foto: url }))} />
        </Field></Full>
        <Full><Field label="Foto banner en página de propiedad">
          <ImageUploader currentUrl={d.banner_detalle_foto} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, banner_detalle_foto: url }))} />
        </Field></Full>
      </Sec>

      {/* ── Carousel ── */}
      <Sec title="🖼 Carousel Hero (4 fotos)">
        {(['hero_img_1', 'hero_img_2', 'hero_img_3', 'hero_img_4'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto carousel ${i + 1}`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Destino ── */}
      <Sec title="🌊 Sección Destino">
        {bi('dest_eyebrow', 'dest_eyebrow_es', 'Eyebrow / kicker')}
        {bi('dest_titulo', 'dest_titulo_es', 'Título de sección')}
        {biTxa('destination_p1', 'destination_p1_es', 'Párrafo 1')}
        {biTxa('destination_p2', 'destination_p2_es', 'Párrafo 2')}
        <Field label="Stat 1 — Número"><Inp value={d.dest_stat1_num}   onChange={set('dest_stat1_num')}   placeholder="25+" /></Field>
        <div />
        {bi('dest_stat_1_label', 'dest_stat_1_label_es', 'Stat 1 — Etiqueta')}
        <Field label="Stat 2 — Número"><Inp value={d.dest_stat2_num}   onChange={set('dest_stat2_num')}   placeholder="Class V+" /></Field>
        <div />
        {bi('dest_stat_2_label', 'dest_stat_2_label_es', 'Stat 2 — Etiqueta')}
        <Field label="Stat 3 — Número"><Inp value={d.dest_stat3_num}   onChange={set('dest_stat3_num')}   placeholder="10" /></Field>
        <div />
        {bi('dest_stat_3_label', 'dest_stat_3_label_es', 'Stat 3 — Etiqueta')}
      </Sec>

      {/* ── Actividades ── */}
      <Sec title="🏄 Actividades (3 cards)">
        {bi('exp_eyebrow', 'exp_eyebrow_es', 'Eyebrow / kicker')}
        {bi('exp_titulo', 'exp_titulo_es', 'Título de sección')}
        {([1, 2, 3] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Actividad {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bi(`actividad_${n}_titulo`, `actividad_${n}_titulo_es`, 'Título')}
                {bi(`actividad_${n}_sub`, `actividad_${n}_sub_es`, 'Subtítulo')}
                <Full><Field label="Foto">
                  <ImageUploader currentUrl={d[`act_${n}_img`]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [`act_${n}_img`]: url }))} />
                </Field></Full>
              </div>
            </div>
          </Full>
        ))}
        {biTxa('act_p', 'act_p_es', "Párrafo 'Beyond the river'")}
      </Sec>

      {/* ── La Propiedad ── */}
      <Sec title="🏨 La Propiedad">
        {bi('prop_eyebrow', 'prop_eyebrow_es', 'Eyebrow / kicker')}
        {bi('prop_titulo', 'prop_titulo_es', 'Título de sección')}
        {biTxa('propiedad_desc', 'propiedad_desc_es', 'Descripción introductoria', 4)}
        {(['prop_foto1', 'prop_foto2', 'prop_foto3', 'prop_foto4'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto propiedad ${i + 1} (grid 2×2)`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Amenidades ── */}
      <Sec title="🛏 Amenidades (8 cards)">
        {([1, 2, 3, 4, 5, 6, 7, 8] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '14px 18px', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 10 }}>Amenidad {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bi(`amenidad_${n}_titulo`, `amenidad_${n}_titulo_es`, 'Título')}
                {bi(`amenidad_${n}_desc`, `amenidad_${n}_desc_es`, 'Descripción')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── La Oportunidad ── */}
      <Sec title="💡 La Oportunidad — Encabezado y tabs">
        {bi('opp_eyebrow', 'opp_eyebrow_es', 'Eyebrow / kicker')}
        {bi('opp_titulo', 'opp_titulo_es', 'Título de sección')}
        {bi('opp_tab_story', 'opp_tab_story_es', 'Tab — The Story')}
        {bi('opp_tab_brief', 'opp_tab_brief_es', 'Tab — Investment Brief')}
      </Sec>

      {/* ── Investment Brief — Números ── */}
      <Sec title="📊 Investment Brief — Números">
        <Field label="Precio (num grande)"><Inp value={d.brief_precio}  onChange={set('brief_precio')}  placeholder="USD 3M" /></Field>
        <Field label="Revenue peak (CLP)"><Inp value={d.brief_revenue} onChange={set('brief_revenue')} placeholder="$181M" /></Field>
        <Field label="Meses operación"><Inp   value={d.brief_meses}   onChange={set('brief_meses')}   placeholder="6 → 12" /></Field>
        <Field label="Huéspedes mejor año"><Inp value={d.brief_guests} onChange={set('brief_guests')} placeholder="1,975" /></Field>
        <Field label="Terreno total"><Inp       value={d.brief_terreno} onChange={set('brief_terreno')} placeholder="1,100 m²" /></Field>
        <div />
        <Field label="Nota card 1 (precio)"><Inp     value={d.brief_note1} onChange={set('brief_note1')} /></Field>
        <Field label="Nota card 2 (revenue)"><Inp    value={d.brief_note2} onChange={set('brief_note2')} /></Field>
        <Field label="Nota card 3 (meses)"><Inp      value={d.brief_note3} onChange={set('brief_note3')} /></Field>
        <Field label="Nota card 4 (huéspedes)"><Inp  value={d.brief_note4} onChange={set('brief_note4')} /></Field>
        <Field label="Nota card 5 (terreno)"><Inp    value={d.brief_note5} onChange={set('brief_note5')} /></Field>
        <Field label="Nota card 6 (comisión)"><Inp   value={d.brief_note6} onChange={set('brief_note6')} /></Field>
        {bi('brief_upside_titulo', 'brief_upside_titulo_es', 'Upside box — título')}
        {biTxa('brief_upside_texto', 'brief_upside_texto_es', 'Upside box — texto')}
        {bi('brief_legal_titulo', 'brief_legal_titulo_es', 'Legal standing — título')}
        {biTxa('brief_legal_texto', 'brief_legal_texto_es', 'Legal standing — texto', 4)}
      </Sec>

      {/* ── The Story ── */}
      <Sec title="📖 The Story">
        {biTxa('story_p1', 'story_p1_es', 'Párrafo 1 (azul destacado)', 3)}
        {biTxa('story_p2', 'story_p2_es', 'Párrafo 2', 4)}
        {biTxa('story_p3', 'story_p3_es', 'Párrafo 3', 4)}
      </Sec>

      {/* ── Property Details — Encabezado y tabs ── */}
      <Sec title="📋 Property Details — Encabezado y tabs">
        {bi('details_eyebrow', 'details_eyebrow_es', 'Eyebrow / kicker')}
        {bi('details_titulo', 'details_titulo_es', 'Título de sección')}
        {bi('details_tab_infra', 'details_tab_infra_es', 'Tab — Infrastructure')}
        {bi('details_tab_equip', 'details_tab_equip_es', 'Tab — Equipment')}
        {bi('details_tab_legal', 'details_tab_legal_es', 'Tab — Legal')}
        {bi('details_tab_ops', 'details_tab_ops_es', 'Tab — Operations')}
      </Sec>

      {/* ── Ficha Técnica — Infrastructure ── */}
      <Sec title="📋 Ficha — Infrastructure (7 filas)">
        {([1,2,3,4,5,6,7] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_infra_${n}_key`, `ficha_infra_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_infra_${n}_val`, `ficha_infra_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Equipment ── */}
      <Sec title="📋 Ficha — Equipment Included (7 filas)">
        {([1,2,3,4,5,6,7] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_equip_${n}_key`, `ficha_equip_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_equip_${n}_val`, `ficha_equip_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Legal ── */}
      <Sec title="📋 Ficha — Legal (6 filas)">
        {([1,2,3,4,5,6] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_legal_${n}_key`, `ficha_legal_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_legal_${n}_val`, `ficha_legal_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Ficha Técnica — Operations ── */}
      <Sec title="📋 Ficha — Operations (6 filas)">
        {([1,2,3,4,5,6] as const).map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '12px 16px', marginBottom: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>Fila {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bi(`ficha_ops_${n}_key`, `ficha_ops_${n}_key_es`, 'Etiqueta')}
                {bi(`ficha_ops_${n}_val`, `ficha_ops_${n}_val_es`, 'Valor')}
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      {/* ── Gallery ── */}
      <Sec title="🖼 Galería (7 fotos)">
        {bi('gallery_eyebrow', 'gallery_eyebrow_es', 'Eyebrow / kicker')}
        {bi('gallery_titulo', 'gallery_titulo_es', 'Título de sección')}
        <Full><Field label="Foto 1 — grande 2×2 (izquierda)">
          <ImageUploader currentUrl={d.gallery_1} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, gallery_1: url }))} />
        </Field></Full>
        {(['gallery_2', 'gallery_3', 'gallery_4', 'gallery_5', 'gallery_6', 'gallery_7'] as const).map((k, i) => (
          <Full key={k}><Field label={`Foto ${i + 2}`}>
            <ImageUploader currentUrl={d[k]} folder="propiedades" onUploaded={url => setD(prev => ({ ...prev, [k]: url }))} />
          </Field></Full>
        ))}
      </Sec>

      {/* ── Contacto ── */}
      <Sec title="💰 Contacto — Precio y datos">
        {bi('contact_eyebrow', 'contact_eyebrow_es', 'Eyebrow / kicker')}
        {bi('contact_titulo', 'contact_titulo_es', 'Título de sección')}
        <Field label="Precio principal (grande, sin traducir)"><Inp value={d.precio_display} onChange={set('precio_display')} placeholder="USD 3,000,000" /></Field>
        <div />
        {bi('precio_sub', 'precio_sub_es', 'Precio subtexto')}
        {biTxa('contacto_parrafo', 'contacto_parrafo_es', 'Párrafo descriptivo')}
        <Field label="Teléfono"><Inp value={d.contacto_telefono} onChange={set('contacto_telefono')} /></Field>
        <Field label="Nombre empresa"><Inp value={d.contacto_empresa} onChange={set('contacto_empresa')} /></Field>
      </Sec>

      <div className="flex justify-end mt-4">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  )
}

// ─── PÁGINAS LEGALES ──────────────────────────────────────────────────────────
const LEGAL_PAGES: { slug: string; label: string; ruta: string }[] = [
  { slug: 'politica-de-privacidad',   label: 'Política de Privacidad',   ruta: '/politica-de-privacidad' },
  { slug: 'condiciones-del-servicio', label: 'Condiciones del Servicio', ruta: '/condiciones-del-servicio' },
  { slug: 'eliminacion-de-datos',     label: 'Eliminación de Datos',     ruta: '/eliminacion-de-datos' },
]

function PaginasLegalesAdmin() {
  const [activeSlug, setActiveSlug] = useState(LEGAL_PAGES[0].slug)
  const active = LEGAL_PAGES.find(p => p.slug === activeSlug) || LEGAL_PAGES[0]

  const [contenido, setContenido] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true); setSaved(false); setError('')
    supabase.from('paginas_legales').select('contenido').eq('slug', activeSlug).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError('No se pudo cargar el contenido: ' + error.message)
        else setContenido(data?.contenido || '')
        setLoading(false)
      })
  }, [activeSlug])

  const save = async () => {
    setSaving(true); setError(''); setSaved(false)
    const { error } = await supabase.from('paginas_legales').upsert(
      { slug: activeSlug, contenido, updated_at: new Date().toISOString() },
      { onConflict: 'slug' }
    )
    setSaving(false)
    if (error) { setError('Error al guardar: ' + error.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Páginas Legales</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {LEGAL_PAGES.map(p => (
          <button key={p.slug} onClick={() => setActiveSlug(p.slug)}
            className="rounded-sm"
            style={{
              padding: '9px 18px', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
              border: `1px solid ${activeSlug === p.slug ? 'var(--navy-dark)' : '#e8edf2'}`,
              background: activeSlug === p.slug ? 'var(--navy-dark)' : '#fff',
              color: activeSlug === p.slug ? '#fff' : 'var(--muted)',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {error && <p style={{ fontSize: 13, color: '#E24B4A', marginBottom: 16 }}>{error}</p>}

      <div className="bg-white border border-[#e8edf2] rounded-sm p-8">
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
          Este texto se muestra públicamente en <code>{active.ruta}</code>. Usa los títulos (H2) para separar las secciones, igual que en el resto del sitio.
        </p>
        {loading
          ? <p style={{ fontSize: 14, color: 'var(--muted)' }}>Cargando…</p>
          : <RichTextEditor key={activeSlug} value={contenido} onChange={setContenido} />}
      </div>
    </div>
  )
}

// ─── RENTAL ───────────────────────────────────────────────────────────────────
function RentalAdmin() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const [d, setD] = useState({
    rental_hero_img: '',
    rental_hero_titulo: 'Tu propiedad, sin preocupaciones',
    rental_hero_subtitulo: 'SDM Rental se encarga de todo: buscamos arrendatarios, cobramos las rentas y administramos tu propiedad mes a mes. Tú solo recibes los resultados.',
    rental_quienes_titulo: '20 años de experiencia a tu servicio',
    rental_quienes_somos: 'Contamos con más de 20 años de experiencia en el sector comercial bancario e inmobiliario. Somos especialistas en soluciones adaptadas a cada cliente, con respaldo legal en todas nuestras operaciones y una red de marketing digital que posiciona tu propiedad donde los arrendatarios te buscan.',
    rental_prop_titulo: 'Arrienda sin complicaciones',
    rental_prop_subtitulo: 'Nos encargamos de cada etapa del proceso de arriendo para que tú no tengas que preocuparte de nada.',
    rental_check_1: 'Buscamos y seleccionamos arrendatarios con evaluación completa.',
    rental_check_2: 'Redactamos y formalizamos el contrato de arriendo.',
    rental_check_3: 'Cobramos las rentas y te transferimos mensualmente.',
    rental_check_4: 'Gestionamos mantenciones e incidencias por ti.',
    rental_check_5: 'Informes mensuales de tu propiedad.',
    rental_comision_trad_pct: '50%',
    rental_comision_trad_desc: 'de un mes de arriendo · pago único',
    rental_comision_adm_pct: '50% + 7%',
    rental_comision_adm_desc: 'pago único + 7% mensual sobre el arriendo',
    rental_arr_titulo: 'Encuentra tu próximo hogar',
    rental_arr_subtitulo: 'Tenemos propiedades disponibles en arriendo en Santiago y sus alrededores. Proceso simple, transparente y sin costos ocultos.',
    rental_comp_titulo: 'Compara tus opciones',
    rental_comp1_tipo: 'Arriendo Tradicional',
    rental_comp1_def: 'Tú mantienes el control directo de tu propiedad y la relación con el arrendatario.',
    rental_comp1_dur: 'Período fijo (ej. 1 año), renovable.',
    rental_comp1_ges: 'El propietario gestiona directamente.',
    rental_comp1_com: '50% de un mes de arriendo (única vez).',
    rental_comp2_tipo: 'Administración de Arriendo',
    rental_comp2_def: 'SDM Rental gestiona todo en tu nombre: inquilinos, cobros, mantención e incidencias.',
    rental_comp2_dur: 'Indefinida, hasta que cualquiera de las partes decida finalizar.',
    rental_comp2_ges: 'SDM Rental opera el inmueble por completo.',
    rental_comp2_com: '50% de un mes de arriendo (única vez) + 7% mensual sobre el arriendo.',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  useEffect(() => {
    supabase.from('contenido_sitio').select('clave, valor').then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    await supabase.from('contenido_sitio').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    invalidateContenidoCache()
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-6">
      <h3 className="font-serif font-light mb-6 pb-4 border-b border-[#e8edf2]" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  )
  const Full = ({ children }: { children: React.ReactNode }) => <div className="md:col-span-2">{children}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>SDM Rental</h2>
        <div className="flex items-center gap-4">
          {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
          <SaveBtn onClick={save} loading={saving} />
        </div>
      </div>

      <Sec title="🖼 Hero">
        <Full><Field label="Imagen de fondo"><ImageUploader currentUrl={d.rental_hero_img} folder="rental" onUploaded={url => setD(p => ({ ...p, rental_hero_img: url }))} /></Field></Full>
        <Full><Field label="Título"><Inp value={d.rental_hero_titulo} onChange={set('rental_hero_titulo')} /></Field></Full>
        <Full><Field label="Subtítulo"><Txa value={d.rental_hero_subtitulo} onChange={set('rental_hero_subtitulo')} rows={3} /></Field></Full>
      </Sec>

      <Sec title="👥 Quiénes Somos Rental">
        <Field label="Título"><Inp value={d.rental_quienes_titulo} onChange={set('rental_quienes_titulo')} /></Field>
        <Full><Field label="Texto"><Txa value={d.rental_quienes_somos} onChange={set('rental_quienes_somos')} rows={5} /></Field></Full>
      </Sec>

      <Sec title="🏠 Para Propietarios">
        <Field label="Título"><Inp value={d.rental_prop_titulo} onChange={set('rental_prop_titulo')} /></Field>
        <Full><Field label="Subtítulo"><Txa value={d.rental_prop_subtitulo} onChange={set('rental_prop_subtitulo')} rows={2} /></Field></Full>
        <Full><Field label="Ítem 1"><Inp value={d.rental_check_1} onChange={set('rental_check_1')} /></Field></Full>
        <Full><Field label="Ítem 2"><Inp value={d.rental_check_2} onChange={set('rental_check_2')} /></Field></Full>
        <Full><Field label="Ítem 3"><Inp value={d.rental_check_3} onChange={set('rental_check_3')} /></Field></Full>
        <Full><Field label="Ítem 4"><Inp value={d.rental_check_4} onChange={set('rental_check_4')} /></Field></Full>
        <Full><Field label="Ítem 5"><Inp value={d.rental_check_5} onChange={set('rental_check_5')} /></Field></Full>
      </Sec>

      <Sec title="💰 Comisiones">
        <Field label="Arriendo Tradicional — %"><Inp value={d.rental_comision_trad_pct} onChange={set('rental_comision_trad_pct')} /></Field>
        <Field label="Arriendo Tradicional — descripción"><Inp value={d.rental_comision_trad_desc} onChange={set('rental_comision_trad_desc')} /></Field>
        <Field label="Administración Completa — %"><Inp value={d.rental_comision_adm_pct} onChange={set('rental_comision_adm_pct')} /></Field>
        <Field label="Administración Completa — descripción"><Inp value={d.rental_comision_adm_desc} onChange={set('rental_comision_adm_desc')} /></Field>
      </Sec>

      <Sec title="🔑 Para Arrendatarios">
        <Field label="Título"><Inp value={d.rental_arr_titulo} onChange={set('rental_arr_titulo')} /></Field>
        <Full><Field label="Subtítulo"><Txa value={d.rental_arr_subtitulo} onChange={set('rental_arr_subtitulo')} rows={2} /></Field></Full>
      </Sec>

      <Sec title="⚖️ Comparativo">
        <Full><Field label="Título de la sección"><Inp value={d.rental_comp_titulo} onChange={set('rental_comp_titulo')} /></Field></Full>

        <Full>
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Columna 1</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tipo"><Inp value={d.rental_comp1_tipo} onChange={set('rental_comp1_tipo')} /></Field>
              <Field label="Gestión"><Inp value={d.rental_comp1_ges} onChange={set('rental_comp1_ges')} /></Field>
              <Full><Field label="Definición"><Txa value={d.rental_comp1_def} onChange={set('rental_comp1_def')} rows={2} /></Field></Full>
              <Field label="Duración"><Inp value={d.rental_comp1_dur} onChange={set('rental_comp1_dur')} /></Field>
              <Field label="Comisión"><Inp value={d.rental_comp1_com} onChange={set('rental_comp1_com')} /></Field>
            </div>
          </div>
        </Full>

        <Full>
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Columna 2 (Recomendado)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Tipo"><Inp value={d.rental_comp2_tipo} onChange={set('rental_comp2_tipo')} /></Field>
              <Field label="Gestión"><Inp value={d.rental_comp2_ges} onChange={set('rental_comp2_ges')} /></Field>
              <Full><Field label="Definición"><Txa value={d.rental_comp2_def} onChange={set('rental_comp2_def')} rows={2} /></Field></Full>
              <Field label="Duración"><Inp value={d.rental_comp2_dur} onChange={set('rental_comp2_dur')} /></Field>
              <Field label="Comisión"><Inp value={d.rental_comp2_com} onChange={set('rental_comp2_com')} /></Field>
            </div>
          </div>
        </Full>
      </Sec>

      <div className="flex justify-end mt-4">
        <SaveBtn onClick={save} loading={saving} />
      </div>
    </div>
  )
}

// ─── VENDE CON NOSOTROS ───────────────────────────────────────────────────────
function VendeAdmin() {
  const [saved, setSaved] = useState(false)

  const [d, setD] = useState({
    vende_hero_titulo: 'Ponemos tu propiedad en venta',
    vende_hero_subtitulo: 'Somos expertos en soluciones inmobiliarias con más de 20 años de experiencia. Tenemos todas las herramientas para garantizar una venta ágil, segura y al mejor precio.',
    vende_pilares_titulo: 'Vende con el respaldo de un equipo especializado',
    vende_pilar1_num: '01', vende_pilar1_titulo: 'Experiencia', vende_pilar1_desc: 'Profesionales con más de 20 años en banca e inversión inmobiliaria, orientados 100% al cliente.',
    vende_pilar2_num: '02', vende_pilar2_titulo: 'Marketing', vende_pilar2_desc: 'Publicamos tu propiedad en Yapo, TocToc, Portal, Mercado Libre, Google Ads y Meta para maximizar la exposición.',
    vende_pilar3_num: '03', vende_pilar3_titulo: 'Respaldo Legal', vende_pilar3_desc: 'Acompañamos todo el proceso: desde el estudio de títulos hasta la inscripción en el Conservador de Bienes Raíces.',
    vende_proceso_titulo: 'Cómo trabajamos',
    vende_paso_1: 'Análisis previo de tu propiedad y diagnóstico personalizado',
    vende_paso_2: 'Publicación estratégica en portales y redes sociales',
    vende_paso_3: 'Base de datos de compradores con crédito hipotecario aprobado',
    vende_paso_4: 'Acompañamiento en tasación y estudio de títulos',
    vende_paso_5: 'Redacción del borrador de escritura',
    vende_paso_6: 'Inscripción final en el Conservador de Bienes Raíces',
    vende_form_titulo: 'Comencemos el proceso',
    vende_form_subtitulo: 'Cuéntanos sobre tu propiedad',
    vende_hero_img: '',
  })

  useEffect(() => {
    supabase.from('contenido_sitio').select('clave, valor').then(({ data }) => {
      if (data && data.length > 0) {
        const loaded: Record<string, string> = {}
        data.forEach(({ clave, valor }) => { loaded[clave] = valor })
        setD(prev => ({ ...prev, ...loaded }))
      }
    })
  }, [])

  const set = (k: string) => (v: string) => {
    setD(prev => ({ ...prev, [k]: v }))
    supabase.from('contenido_sitio').upsert({ clave: k, valor: v }, { onConflict: 'clave' }).then(() => {
      invalidateContenidoCache()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-6">
      <h3 className="font-serif font-light mb-6 pb-4 border-b border-[#e8edf2]" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  )
  const Full = ({ children }: { children: React.ReactNode }) => <div className="md:col-span-2">{children}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Vende con Nosotros</h2>
        {saved && <span style={{ fontSize: 14, color: 'var(--green)', fontWeight: 500 }}>✓ Guardado correctamente</span>}
      </div>

      <Sec title="🖼 Hero">
        <Full><Field label="Imagen de fondo Hero"><ImageUploader currentUrl={d.vende_hero_img} folder="vende" onUploaded={url => set('vende_hero_img')(url)} /></Field></Full>
        <Full><Field label="Título"><Inp value={d.vende_hero_titulo} onChange={set('vende_hero_titulo')} /></Field></Full>
        <Full><Field label="Subtítulo"><Txa value={d.vende_hero_subtitulo} onChange={set('vende_hero_subtitulo')} rows={3} /></Field></Full>
      </Sec>

      <Sec title="🏛 Pilares">
        <Full><Field label="Título de la sección"><Inp value={d.vende_pilares_titulo} onChange={set('vende_pilares_titulo')} /></Field></Full>

        {[1, 2, 3].map(n => (
          <Full key={n}>
            <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Pilar {n}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Número"><Inp value={(d as Record<string,string>)[`vende_pilar${n}_num`]} onChange={set(`vende_pilar${n}_num`)} /></Field>
                <Field label="Título"><Inp value={(d as Record<string,string>)[`vende_pilar${n}_titulo`]} onChange={set(`vende_pilar${n}_titulo`)} /></Field>
                <Full><Field label="Descripción"><Txa value={(d as Record<string,string>)[`vende_pilar${n}_desc`]} onChange={set(`vende_pilar${n}_desc`)} rows={3} /></Field></Full>
              </div>
            </div>
          </Full>
        ))}
      </Sec>

      <Sec title="🔁 Proceso">
        <Full><Field label="Título de la sección"><Inp value={d.vende_proceso_titulo} onChange={set('vende_proceso_titulo')} /></Field></Full>
        {[1, 2, 3, 4, 5, 6].map(n => (
          <Full key={n}><Field label={`Paso ${n}`}><Inp value={(d as Record<string,string>)[`vende_paso_${n}`]} onChange={set(`vende_paso_${n}`)} /></Field></Full>
        ))}
      </Sec>

      <Sec title="📝 Formulario">
        <Field label="Título"><Inp value={d.vende_form_titulo} onChange={set('vende_form_titulo')} /></Field>
        <Field label="Subtítulo (etiqueta superior)"><Inp value={d.vende_form_subtitulo} onChange={set('vende_form_subtitulo')} /></Field>
      </Sec>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const DEFAULT_TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'propiedades',  label: 'Propiedades',     icon: '🏠' },
  { key: 'cotizaciones', label: 'Cotizaciones',    icon: '📋' },
  { key: 'blog',         label: 'Blog',            icon: '📝' },
  { key: 'equipo',       label: 'Equipo',          icon: '👥' },
  { key: 'asociados',    label: 'Asociados',       icon: '🤝' },
  { key: 'mensajes',     label: 'Mensajes',        icon: '💬' },
  { key: 'contenido',    label: 'Textos del sitio',icon: '✏️' },
  { key: 'fotos',        label: 'Imágenes',        icon: '🖼' },
  { key: 'barranco',     label: 'El Barranco',     icon: '🏨' },
  { key: 'tarjetas',     label: 'Tarjetas',        icon: '💳' },
  { key: 'legal',        label: 'Páginas Legales', icon: '🔒' },
  { key: 'rental',       label: 'Rental',          icon: '🏘' },
  { key: 'vende',        label: 'Vende con nosotros', icon: '🏷' },
]

const STORAGE_KEY = 'sdm_admin_tab_order'

function loadTabOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_TABS
    const order: string[] = JSON.parse(saved)
    const sorted = order.map(key => DEFAULT_TABS.find(t => t.key === key)).filter(Boolean) as typeof DEFAULT_TABS
    DEFAULT_TABS.forEach(t => { if (!sorted.find(s => s.key === t.key)) sorted.push(t) })
    return sorted
  } catch { return DEFAULT_TABS }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { authed, checking } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('propiedades')
  const [tabs, setTabs] = useState(loadTabOrder)
  const dragTab = useRef<number | null>(null)
  const dragOverTab = useRef<number | null>(null)

  const onTabDragStart = (i: number) => { dragTab.current = i }
  const onTabDragEnter = (i: number) => { dragOverTab.current = i }
  const onTabDragEnd   = () => {
    if (dragTab.current === null || dragOverTab.current === null) return
    const next = [...tabs]
    const dragged = next.splice(dragTab.current, 1)[0]
    next.splice(dragOverTab.current, 0, dragged)
    dragTab.current = null; dragOverTab.current = null
    setTabs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(t => t.key)))
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-dark)' }}><div className="font-serif italic" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Verificando sesión…</div></div>
  if (!authed)  return <LoginForm />

  return (
    <div className="min-h-screen" style={{ background: 'var(--off)' }}>
      <div className="bg-white border-b border-[#e8edf2] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="logo-stripes"><div className="logo-stripe logo-stripe--sky"/><div className="logo-stripe logo-stripe--green"/><div className="logo-stripe logo-stripe--navy"/></div>
          <div>
            <div className="font-serif" style={{ fontSize: 18, color: 'var(--navy-dark)', letterSpacing: '2px' }}>SDM Capital</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Panel Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <a href="/" target="_blank" style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none' }}>Ver sitio ↗</a>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
        </div>
      </div>

      <div className="flex overflow-visible">
        <aside className="w-56 h-[calc(100vh-57px)] overflow-y-auto bg-white border-r border-[#e8edf2] py-6 flex-shrink-0 fixed top-[57px] left-0 z-30">
          <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="var(--muted)"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>
            Arrastra para ordenar
          </div>
          {tabs.map((t, i) => (
            <div key={t.key} draggable onDragStart={() => onTabDragStart(i)} onDragEnter={() => onTabDragEnter(i)} onDragEnd={onTabDragEnd}
              onClick={() => setTab(t.key)} className="flex items-center gap-3 transition-all duration-150"
              style={{ padding: '11px 16px', fontSize: 13, fontWeight: tab === t.key ? 600 : 300, color: tab === t.key ? 'var(--navy-dark)' : 'var(--muted)', background: tab === t.key ? 'var(--sky-pale)' : 'transparent', borderLeft: tab === t.key ? '3px solid var(--green)' : '3px solid transparent', cursor: 'grab', userSelect: 'none' }}>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ opacity: 0.3, flexShrink: 0 }}><circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/><circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/><circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/></svg>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </div>
          ))}
          {/* ── Herramientas ── */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px 8px' }}>Herramientas</div>
            <RouterLink to="/admin/ficha-cliente"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <FileText size={15} style={{ flexShrink: 0 }} />
              Ficha para cliente
            </RouterLink>
            <RouterLink to="/admin/agentes"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <Users size={15} style={{ flexShrink: 0 }} />
              Agentes
            </RouterLink>
            <RouterLink to="/admin/captacion"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <MessageCircle size={15} style={{ flexShrink: 0 }} />
              Captación
            </RouterLink>
          </div>
        </aside>

        <main className="flex-1 p-8 lg:p-10 min-w-0 ml-56">
          {tab === 'propiedades'  && <PropiedadesAdmin />}
          {tab === 'cotizaciones' && <CotizacionesAdmin />}
          {tab === 'blog'         && <BlogAdmin />}
          {tab === 'equipo'       && <EquipoAdmin />}
          {tab === 'asociados'    && <AsociadosAdmin />}
          {tab === 'mensajes'     && <MensajesAdmin />}
          {tab === 'contenido'    && <ContenidoAdmin />}
          {tab === 'fotos'        && <FotosAdmin />}
          {tab === 'barranco'     && <BarrancoAdmin />}
          {tab === 'tarjetas'     && <TarjetasEquipo />}
          {tab === 'legal'        && <PaginasLegalesAdmin />}
          {tab === 'rental'       && <RentalAdmin />}
          {tab === 'vende'        && <VendeAdmin />}
        </main>
      </div>
    </div>
  )
}