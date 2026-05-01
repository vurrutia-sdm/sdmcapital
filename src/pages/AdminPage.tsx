import { useState, useEffect, useRef } from 'react'
import { REGIONES, getComunas } from '@/data/comunas-chile'
import { supabase } from '@/lib/supabase'
import { invalidateContenidoCache } from '@/hooks/useContenido'
import type { Propiedad, BlogPost, MiembroEquipo, Asociado, MensajeContacto } from '@/types'

type Tab = 'propiedades' | 'blog' | 'equipo' | 'asociados' | 'mensajes' | 'contenido' | 'fotos'

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

// Inp y Txa usan estado LOCAL para evitar pérdida de foco en cada keystroke.
// Solo actualizan el padre en onBlur (cuando el usuario sale del campo).
function Inp({ value, onChange, type = 'text', placeholder = '' }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  const [local, setLocal] = useState(String(value ?? ''))
  // Sincronizar si el valor externo cambia (ej: al abrir otro registro)
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
      className="input-line"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onChange(local) }}
    />
  )
}

function Txa({ value, onChange, rows = 3 }: {
  value: string
  onChange: (v: string) => void
  rows?: number
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

// ─── IMAGE UPLOADER ───────────────────────────────────────────────────────────
function ImageUploader({ currentUrl, onUploaded, folder = 'general' }: { currentUrl?: string; onUploaded: (url: string) => void; folder?: string }) {
  const [uploading, setUploading] = useState(false)
  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const name = `${folder}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('imagenes').upload(name, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('imagenes').getPublicUrl(name)
      onUploaded(data.publicUrl)
    }
    setUploading(false)
  }
  return (
    <div className="flex items-center gap-4">
      {currentUrl && <img src={currentUrl} alt="" className="w-16 h-16 object-cover rounded" style={{ border: '1px solid var(--border)' }} />}
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

  useEffect(() => { setItems(initialItems) }, [initialItems.length])

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

// ─── DOSSIER UPLOADER — múltiples archivos ───────────────────────────────────
function DossierUploader({ urls, onChanged }: { urls: string[]; onChanged: (urls: string[]) => void }) {
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      const ext  = file.name.split('.').pop()
      const name = `dossiers/${Date.now()}_${file.name.replace(/[^a-z0-9.]/gi, '_')}`
      const { error } = await supabase.storage.from('imagenes').upload(name, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from('imagenes').getPublicUrl(name)
        newUrls.push(data.publicUrl)
      }
    }
    onChanged([...urls, ...newUrls])
    setUploading(false)
    e.target.value = ''
  }

  const remove = (url: string) => {
    if (!confirm('¿Eliminar este archivo?')) return
    onChanged(urls.filter(u => u !== url))
  }

  const fileName = (url: string) => {
    try { return decodeURIComponent(url.split('/').pop() || url).replace(/^\d+_/, '') }
    catch { return url.split('/').pop() || url }
  }

  return (
    <div>
      {/* Lista de archivos existentes */}
      {urls.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-sm" style={{ background: 'var(--sky-pale)', border: '1px solid var(--sky)' }}>
              <span style={{ fontSize: 18 }}>📄</span>
              <a href={url} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, fontSize: 13, color: 'var(--navy)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fileName(url)}
              </a>
              <button onClick={() => remove(url)}
                style={{ fontSize: 11, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Botón subir */}
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '9px 18px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {uploading ? 'Subiendo…' : `📎 Agregar archivos (${urls.length} subido${urls.length !== 1 ? 's' : ''})`}
        <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" multiple style={{ display: 'none' }} disabled={uploading} onChange={upload} />
      </label>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>PDF, Word, Excel. Puedes subir varios a la vez.</p>
    </div>
  )
}

// ─── PROP IMAGE MANAGER — galería multi-foto con drag & drop ─────────────────
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

  // Comprime imagen a max 1200px y calidad 82% antes de subir
  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.82)
      }
      img.src = url
    })

  const upload = async (files: FileList) => {
    setUploading(true)
    const newUrls: string[] = []
    const list = Array.from(files).slice(0, 20 - imagenes.length)
    for (let idx = 0; idx < list.length; idx++) {
      const file = list[idx]
      setProgress(`Comprimiendo ${idx + 1}/${list.length}…`)
      const compressed = await compressImage(file)
      const name = `propiedades/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`
      setProgress(`Subiendo ${idx + 1}/${list.length}…`)
      const { error } = await supabase.storage.from('imagenes').upload(name, compressed, { upsert: true, contentType: 'image/jpeg' })
      if (!error) {
        const { data } = supabase.storage.from('imagenes').getPublicUrl(name)
        newUrls.push(data.publicUrl)
      }
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
    // La portada siempre se puede elegir manualmente — no la cambiamos al arrastrar
    onChange(next, imagenPrincipal || next[0] || '')
  }

  return (
    <div>
      {/* Instrucción clara */}
      {imagenes.length > 0 && (
        <div style={{ fontSize: 13, color: 'var(--navy-dark)', background: 'var(--sky-pale)', border: '1px solid var(--sky)', borderRadius: 4, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📷</span>
          <span>Haz clic en <strong>"Portada"</strong> debajo de la foto que quieres como imagen principal.</span>
        </div>
      )}

      {/* Grid de fotos */}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
          {imagenes.map((url, i) => (
            <div key={url + i}>
              {/* Thumbnail */}
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
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

                {/* Badge portada */}
                {url === imagenPrincipal && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'var(--green)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textAlign: 'center', padding: '4px 0' }}>
                    ★ PORTADA
                  </div>
                )}

                {/* Grip */}
                <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.45)', borderRadius: 2, padding: '2px 3px' }}>
                  <svg width="7" height="10" viewBox="0 0 7 10" fill="white" opacity="0.7">
                    <circle cx="1.5" cy="1.5" r="1.2"/><circle cx="5.5" cy="1.5" r="1.2"/>
                    <circle cx="1.5" cy="5" r="1.2"/><circle cx="5.5" cy="5" r="1.2"/>
                    <circle cx="1.5" cy="8.5" r="1.2"/><circle cx="5.5" cy="8.5" r="1.2"/>
                  </svg>
                </div>

                {/* Botón eliminar */}
                <button
                  onClick={() => remove(i)}
                  title="Eliminar foto"
                  style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.9)', border: 'none', borderRadius: 2, color: '#fff', width: 22, height: 22, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
                >✕</button>
              </div>

              {/* Botón Portada — debajo de la foto, grande y claro */}
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

      {/* Upload button */}
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

// ─── PROPIEDADES ──────────────────────────────────────────────────────────────
function PropiedadesAdmin() {
  const [items, setItems]     = useState<Propiedad[]>([])
  const [editing, setEditing] = useState<Partial<Propiedad> | null>(null)
  const [saving, setSaving]   = useState(false)
  const load = () => supabase.from('propiedades').select('*').order('destacada', { ascending: false }).order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    // Mark first 6 as destacada
    const updates = reordered.map((p, i) => supabase.from('propiedades').update({ destacada: i < 6 }).eq('id', p.id))
    await Promise.all(updates)
    load()
  })

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta propiedad?')) return
    await supabase.from('propiedades').delete().eq('id', id); load()
  }

  const startEdit = (p: Propiedad) => {
    setEditing({ ...p })
    setTimeout(() => {
      document.getElementById('prop-edit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  }

  const save = async () => {
    if (!editing) return
    setSaving(true)
    if (editing.id) {
      await supabase.from('propiedades').update(editing).eq('id', editing.id)
    } else {
      await supabase.from('propiedades').insert([{ ...editing, imagenes: editing.imagenes || [], destacada: editing.destacada || false, internacional: editing.internacional || false, a_consultar: editing.a_consultar || false }])
    }
    setSaving(false); setEditing(null); load()
  }

  const blank = (): Partial<Propiedad> => ({ titulo: '', descripcion: '', tipo: 'casa', estado: 'en_venta', a_consultar: false, region: 'R. Metropolitana', comuna: '', pais: 'Chile', imagenes: [], destacada: false, internacional: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Propiedades</h2>
        <button className="btn-green" onClick={() => setEditing(blank())}>+ Nueva propiedad</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
        🖱 <strong>Arrastra</strong> las filas para reordenarlas. Las primeras <strong>6 propiedades</strong> se marcan automáticamente como Destacadas y aparecen en el Inicio.
      </p>

      {editing && (
        <div id="prop-edit-form" className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar propiedad' : 'Nueva propiedad'}</h3>

          {/* Datos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Título"><Inp value={editing.titulo || ''} onChange={v => setEditing(p => ({ ...p, titulo: v }))} /></Field>
            <Field label="Tipo">
              <Sel value={editing.tipo || 'casa'} onChange={v => setEditing(p => ({ ...p, tipo: v as Propiedad['tipo'] }))}
                options={[{value:'casa',label:'Casa'},{value:'departamento',label:'Departamento'},{value:'oficina',label:'Oficina'},{value:'parcela',label:'Parcela'},{value:'comercial',label:'Comercial'},{value:'hotel',label:'Hotel'},{value:'terreno',label:'Terreno'}]} />
            </Field>
            <Field label="Estado">
              <Sel value={editing.estado || 'en_venta'} onChange={v => setEditing(p => ({ ...p, estado: v as Propiedad['estado'] }))}
                options={[{value:'en_venta',label:'En venta'},{value:'en_arriendo',label:'En arriendo'},{value:'vendida',label:'Vendida'},{value:'reservada',label:'Reservada'}]} />
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

          {/* Precios */}
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>Precio</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Field label="Precio UF"><Inp type="number" value={editing.precio_uf || ''} onChange={v => setEditing(p => ({ ...p, precio_uf: Number(v) }))} placeholder="Ej: 3500" /></Field>
              <Field label="Precio CLP (Pesos Chilenos)"><Inp type="number" value={(editing as Record<string,unknown>).precio_clp as number || ''} onChange={v => setEditing(p => ({ ...p, precio_clp: Number(v) }))} placeholder="Ej: 120000000" /></Field>
              <Field label="Precio USD"><Inp type="number" value={editing.precio_usd || ''} onChange={v => setEditing(p => ({ ...p, precio_usd: Number(v) }))} placeholder="Opcional" /></Field>
            </div>
            <div className="mt-4 flex gap-6 flex-wrap">
              <Chk label="Precio a consultar (oculta los valores)" checked={!!editing.a_consultar} onChange={v => setEditing(p => ({ ...p, a_consultar: v }))} />
              <Chk
                label="↓ Baja de precio (muestra badge rojo)"
                checked={!!(editing as Record<string,unknown>).baja_precio}
                onChange={v => setEditing(p => ({ ...p, baja_precio: v }))}
              />
            </div>
            {(editing as Record<string,unknown>).baja_precio && (
              <div className="mt-4">
                <Field label="Precio anterior UF (aparece tachado)">
                  <Inp type="number" value={(editing as Record<string,unknown>).precio_anterior_uf as number || ''} onChange={v => setEditing(p => ({ ...p, precio_anterior_uf: Number(v) }))} placeholder="Ej: 4200" />
                </Field>
              </div>
            )}
          </div>

          {/* Características */}
          <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>Características</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Field label="Dormitorios"><Inp type="number" value={editing.dormitorios || ''} onChange={v => setEditing(p => ({ ...p, dormitorios: Number(v) }))} /></Field>
              <Field label="Baños"><Inp type="number" value={editing.banos || ''} onChange={v => setEditing(p => ({ ...p, banos: Number(v) }))} /></Field>
              <Field label="Superficie total m²"><Inp type="number" value={editing.superficie_total || ''} onChange={v => setEditing(p => ({ ...p, superficie_total: Number(v) }))} /></Field>
              <Field label="Superficie construida m²"><Inp type="number" value={editing.superficie_util || ''} onChange={v => setEditing(p => ({ ...p, superficie_util: Number(v) }))} /></Field>
              <Field label="Estacionamientos"><Inp type="number" value={editing.estacionamientos || ''} onChange={v => setEditing(p => ({ ...p, estacionamientos: Number(v) }))} placeholder="0" /></Field>
              <Field label="Año de construcción"><Inp type="number" value={(editing as Record<string,unknown>).ano_construccion as number || ''} onChange={v => setEditing(p => ({ ...p, ano_construccion: Number(v) }))} placeholder="Ej: 2018" /></Field>
            </div>
          </div>

          {/* Galería */}
          <div className="mb-6">
            <Field label="Galería de imágenes (hasta 20 fotos — arrastra para reordenar)">
              <PropImageManager
                imagenes={editing.imagenes || []}
                imagenPrincipal={editing.imagen_principal || ''}
                onChange={(imagenes, principal) => setEditing(p => ({ ...p, imagenes, imagen_principal: principal }))}
              />
            </Field>
          </div>

          {/* Video YouTube */}
          <div className="mb-6">
            <Field label="🎥 Link de YouTube (video tour de la propiedad)">
              <Inp
                value={(editing as Record<string,unknown>).youtube_url as string || ''}
                onChange={v => setEditing(p => ({ ...p, youtube_url: v }))}
                placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
              />
            </Field>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>Pega la URL completa de YouTube. El video se mostrará incrustado en la página de la propiedad.</p>
          </div>

          {/* Dossier */}
          <div className="mb-6" style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 14 }}>📄 Dossiers / Fichas técnicas</div>
            <DossierUploader
              urls={(editing as Record<string,unknown>).dossiers as string[] || []}
              onChanged={urls => setEditing(p => ({ ...p, dossiers: urls }))}
            />
          </div>

          {/* Descripción — ahora con textarea que respeta párrafos */}
          <div className="mb-6">
            <Field label="Descripción (Enter para nuevos párrafos, emojis permitidos ✅)">
              <textarea
                value={editing.descripcion || ''}
                onChange={e => setEditing(p => ({ ...p, descripcion: e.target.value }))}
                className="input-line resize-y"
                rows={8}
                style={{ height: 'auto', whiteSpace: 'pre-wrap' }}
                placeholder={"Describe la propiedad...\n\nPuedes escribir varios párrafos separados.\n\n✅ Se permiten emojis y saltos de línea."}
              />
            </Field>
          </div>

          <div className="flex gap-6 mb-6">
            <Chk label="Internacional" checked={!!editing.internacional} onChange={v => setEditing(p => ({ ...p, internacional: v }))} />
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
              {['','#','Propiedad','Tipo','Estado','Precio','','Acciones'].map(h => (
                <th key={h} className="text-left pb-3 pr-4" style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr
                key={p.id}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragEnter={() => onDragEnter(i)}
                onDragEnd={onDragEnd}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'grab', background: i < 6 ? 'rgba(61,170,110,0.04)' : 'transparent' }}
              >
                <td className="py-3 pr-2" style={{ color: 'var(--muted)', fontSize: 16, cursor: 'grab' }}>⠿</td>
                <td className="py-3 pr-4">
                  <span style={{ fontSize: 12, fontWeight: 700, color: i < 6 ? 'var(--green)' : 'var(--muted)' }}>{i + 1}</span>
                  {i < 6 && <span style={{ fontSize: 10, marginLeft: 4, color: 'var(--green)' }}>★</span>}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    {(p.imagen_principal || p.imagenes?.[0])
                      ? <img src={p.imagen_principal || p.imagenes[0]} alt="" className="w-10 h-10 object-cover rounded flex-shrink-0" />
                      : <div className="w-10 h-10 rounded flex-shrink-0" style={{ background: 'var(--navy)', opacity: 0.3 }} />
                    }
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, maxWidth: 220 }} className="truncate">{p.titulo}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.comuna}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4" style={{ fontSize: 13, color: 'var(--muted)' }}>{p.tipo}</td>
                <td className="py-3 pr-4"><Badge label={p.estado.replace('_',' ')} color={p.estado==='en_venta'?'var(--navy-dark)':p.estado==='en_arriendo'?'var(--green)':'#999'} /></td>
                <td className="py-3 pr-4" style={{ fontSize: 14 }}>{p.a_consultar ? 'Consultar' : p.precio_uf ? `UF ${p.precio_uf.toLocaleString('es-CL')}` : (p as Record<string,unknown>).precio_clp ? `$${((p as Record<string,unknown>).precio_clp as number).toLocaleString('es-CL')}` : p.precio_usd ? `USD ${p.precio_usd}` : '—'}</td>
                <td className="py-3 pr-4"><span>{p.internacional ? '🌐' : '🇨🇱'}</span></td>
                <td className="py-3">
                  <div className="flex gap-3">
                    <button onClick={() => startEdit(p)} style={{ fontSize: 13, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
                    <button onClick={() => del(p.id)} style={{ fontSize: 13, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={8} className="py-12 text-center" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin propiedades. Crea la primera.</td></tr>}
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
          <div className="mb-4"><Field label="Resumen"><Txa rows={2} value={editing.resumen || ''} onChange={v => setEditing(p => ({ ...p, resumen: v }))} /></Field></div>
          <Field label="Contenido completo"><Txa rows={12} value={editing.contenido || ''} onChange={v => setEditing(p => ({ ...p, contenido: v }))} /></Field>
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
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>🖱 Arrastra las filas para cambiar el orden de aparición en la página.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar miembro' : 'Nuevo miembro'}</h3>
          
          {/* Foto del miembro */}
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
          <div
            key={m.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab"
            style={{ borderTop: '3px solid var(--green)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span style={{ color: 'var(--muted)', fontSize: 20, cursor: 'grab' }}>⠿</span>
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
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>🖱 Arrastra las tarjetas para cambiar el orden de aparición.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar asociado' : 'Nuevo asociado'}</h3>

          {/* Logo del asociado */}
          <div className="mb-6 p-6 rounded-sm" style={{ background: 'var(--off)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16 }}>🏢 Logo de la empresa</div>
            <div className="flex items-center gap-6">
              {editing.logo
                ? <img src={editing.logo} alt="Logo" style={{ height: 56, objectFit: 'contain', border: '1px solid var(--border)', padding: 8, borderRadius: 4, background: '#fff', maxWidth: 160 }} />
                : <div style={{ width: 120, height: 56, border: '2px dashed var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>Sin logo</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.logo} folder="asociados" onUploaded={url => setEditing(p => ({ ...p, logo: url }))} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Sube el logo en PNG con fondo transparente para mejor resultado.</p>
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
          <div
            key={a.id}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragEnter={() => onDragEnter(i)}
            onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab flex flex-col items-center text-center"
          >
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
// ─── CAROUSEL PHOTO MANAGER ──────────────────────────────────────────────────
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
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const MAX = 1920
        let { width, height } = img
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.85)
      }
      img.src = url
    })

  const upload = async (i: number, file: File) => {
    setUploading(i)
    const compressed = await compressImage(file)
    const name = `hero/${Date.now()}_${i}.jpg`
    const { error } = await supabase.storage.from('imagenes').upload(name, compressed, { upsert: true, contentType: 'image/jpeg' })
    if (!error) {
      const { data } = supabase.storage.from('imagenes').getPublicUrl(name)
      const next = [...urls]; next[i] = data.publicUrl; setUrls(next)
    }
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
                  <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 11, fontWeight: 700, width: 20, height: 20, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i + 1}
                  </div>
                  <div style={{ position: 'absolute', top: 6, right: 28, background: 'rgba(0,0,0,0.5)', borderRadius: 3, padding: '2px 4px' }}>
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="white" opacity="0.8">
                      <circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/>
                      <circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/>
                      <circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/>
                    </svg>
                  </div>
                  <button onClick={() => remove(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.85)', border: 'none', borderRadius: 3, color: '#fff', width: 20, height: 20, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
                </>
              ) : (
                <label style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4 }}>
                  {uploading === i
                    ? <span style={{ fontSize: 11, color: 'var(--muted)' }}>Subiendo…</span>
                    : <>
                        <span style={{ fontSize: 20, color: 'var(--muted)' }}>+</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Foto {i + 1}</span>
                      </>
                  }
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading !== null}
                    onChange={e => { const f = e.target.files?.[0]; if (f) upload(i, f) }} />
                </label>
              )}
            </div>
            {/* Selector de posición — solo si tiene foto */}
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
        : <p style={{ fontSize: 12, color: 'var(--muted)' }}>{filled.length} foto{filled.length > 1 ? 's' : ''} en el carrusel · Arrastra para reordenar · Clic en ✕ para eliminar</p>
      }
    </div>
  )
}

function ContenidoAdmin() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [pagina, setPagina] = useState<'inicio'|'quienes'|'servicios'|'asociados'|'blog'|'contacto'>('inicio')
  const scrollPositions = useRef<Record<string, number>>({})

  const handlePaginaChange = (key: typeof pagina) => {
    scrollPositions.current[pagina] = window.scrollY
    setPagina(key)
    setTimeout(() => {
      window.scrollTo({ top: scrollPositions.current[key] || 0 })
    }, 50)
  }

  const [d, setD] = useState({
    // Inicio
    hero_imagen_url: '', hero_imagen_url_2: '', hero_imagen_url_3: '', hero_imagen_url_4: '', hero_imagen_url_5: '', hero_kicker: 'Inversión inmobiliaria · Chile & el mundo',
    hero_titulo_1: 'Tu socio', hero_titulo_2: 'en bienes', hero_titulo_3: 'raíces',
    hero_subtitulo: 'Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el extranjero. Financiamiento sin pagos adelantados.',
    hero_location: 'Las Condes · Santiago · Chile',
    stats_propiedades: '120', stats_anios: '15', stats_paises: '10', stats_clientes: '500',
    financiamiento_titulo: '¿Necesitas financiamiento?',
    financiamiento_body: 'Gestionamos créditos de consumo, hipotecarios y bancarización para personas y empresas en Chile y el extranjero. Sin pagos adelantados.',
    testimonial_1_texto: 'SDM Capital hizo posible el sueño de mi familia de adquirir nuestra primera vivienda en Santiago.',
    testimonial_1_autor: 'María Sánchez · Santiago, Chile',
    testimonial_1_url: '',
    testimonial_2_texto: 'Como inversionista internacional, SDM Capital simplificó todo el proceso.',
    testimonial_2_autor: 'Carlos González · Miami, Florida, EE. UU.',
    testimonial_2_url: '',
    testimonial_3_texto: 'Su conocimiento del mercado y atención personalizada hicieron que el proceso fuera completamente libre de estrés.',
    testimonial_3_autor: 'Isabel Ríos · Viña del Mar, Chile',
    testimonial_3_url: '',
    testimonios_titulo: 'Palabras de nuestros clientes',
    testimonios_subtitulo: 'La satisfacción de nuestros clientes es nuestra mejor carta de presentación.',
    // Quiénes Somos
    qs_titulo: 'Tu socio estratégico en bienes raíces',
    qs_subtitulo: 'SDM Capital es una empresa chilena especializada en inversión inmobiliaria y gestión de financiamiento, con más de 15 años conectando personas con oportunidades únicas.',
    qs_historia_1: 'SDM Capital nació con una visión clara: democratizar el acceso a inversiones inmobiliarias de calidad para personas y empresas en Chile.',
    qs_historia_2: 'A lo largo de más de 15 años, hemos construido una red de socios y alianzas estratégicas que nos permite ofrecer oportunidades únicas en Chile y en más de 10 países del mundo.',
    qs_historia_3: 'Hoy somos referentes en gestión de financiamiento y asesoría inmobiliaria, con un equipo de expertos comprometidos con los resultados de cada cliente.',
    // Servicios
    servicios_intro: 'Soluciones integrales en inversión inmobiliaria y financiamiento, tanto en Chile como en el extranjero.',
    servicio_inv_int_desc: 'Accede a oportunidades inmobiliarias en EE.UU., España, República Dominicana, Uruguay y más.',
    servicio_inv_cl_desc: 'Casas, departamentos, oficinas, parcelas y proyectos comerciales en todo Chile.',
    servicio_fin_per_desc: 'Gestión de crédito hipotecario y consumo para personas naturales. Sin pagos adelantados.',
    servicio_fin_emp_desc: 'Soluciones de financiamiento corporativo y leasing inmobiliario para empresas de todos los tamaños.',
    servicio_banco_desc: 'Te ayudamos a abrir cuentas bancarias y acceder a servicios financieros en el extranjero.',
    // Imágenes adicionales
    financiamiento_imagen: '',
    quienes_imagen_historia: '',
    servicio_inv_int_imagen: '',
    servicio_inv_cl_imagen: '',
    servicio_fin_per_imagen: '',
    servicio_fin_emp_imagen: '',
    servicio_banco_imagen: '',
    // Imágenes destinos internacionales
    dest_miami_img: '',
    dest_punta_cana_img: '',
    dest_orlando_img: '',
    dest_espana_img: '',
    dest_uruguay_img: '',
    dest_nueva_york_img: '',
    // Asociados
    asociados_intro: 'Trabajamos con una red selecta de socios estratégicos que nos permiten ofrecer a nuestros clientes el mejor servicio integral en cada etapa del proceso inmobiliario y financiero.',
    asociados_cta: 'Si tu empresa comparte nuestros valores de excelencia y transparencia, nos encantaría explorar una colaboración estratégica.',
    // Blog
    blog_titulo: 'Blog SDM Capital',
    blog_subtitulo: 'Noticias, análisis y tendencias del mercado inmobiliario en Chile y el mundo.',
    // Contacto
    empresa_nombre: 'SDM Capital', tagline: 'Tu socio confiable en el mundo de los bienes raíces.',
    direccion: 'Av. Apoquindo 5583, Las Condes, Santiago',
    telefono_1: '+56 9 3103 8954', telefono_2: '+56 9 6191 2281',
    email: 'contacto@sdmcapital.cl', horario: 'Lunes a Viernes · 09:00 – 18:00',
    whatsapp: '56931038954',
    facebook: 'https://www.facebook.com/sdmcapitalrestate',
    instagram: 'https://instagram.com/sdmcapital',
    tiktok: 'https://www.tiktok.com/@sdmcapital_realestate',
    linkedin: 'https://www.linkedin.com/company/sdmcapital/',
  })

  const set = (k: string) => (v: string) => setD(prev => ({ ...prev, [k]: v }))

  // Cargar datos existentes de Supabase al montar
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
    { key: 'inicio', label: '🏠 Inicio' }, { key: 'quienes', label: '👥 Quiénes Somos' },
    { key: 'servicios', label: '💼 Servicios' }, { key: 'asociados', label: '🤝 Asociados' },
    { key: 'blog', label: '📝 Blog' }, { key: 'contacto', label: '📍 Contacto y Redes' },
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

      {/* Page tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {PAGINAS.map(p => (
          <button key={p.key} onClick={() => handlePaginaChange(p.key)}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: pagina === p.key ? 600 : 300, borderRadius: 2, border: pagina === p.key ? '2px solid var(--green)' : '1px solid var(--border)', background: pagina === p.key ? 'var(--green)' : '#fff', color: pagina === p.key ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
            {p.label}
          </button>
        ))}
      </div>

      {pagina === 'inicio' && <>
        <Sec title="🖼 Fotos del hero — Carrusel (cambian automáticamente)">
          <Full>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
              Sube hasta 5 fotos. Se muestran en secuencia cada 5 segundos. <strong>Arrastra las tarjetas para cambiar el orden.</strong>
            </p>
            <CarouselPhotoManager d={d as unknown as Record<string, string>} setD={setD as unknown as (fn: (prev: Record<string, string>) => Record<string, string>) => void} />
          </Full>
        </Sec>
        <Sec title="📝 Título y subtítulo del hero">
          <Field label="Línea 1 del título"><Inp value={d.hero_titulo_1} onChange={set('hero_titulo_1')} /></Field>
          <Field label="Línea 2 del título"><Inp value={d.hero_titulo_2} onChange={set('hero_titulo_2')} /></Field>
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
        <Sec title="💰 Sección Financiamiento">
          <Field label="Título"><Inp value={d.financiamiento_titulo} onChange={set('financiamiento_titulo')} /></Field>
          <Full><Field label="Descripción"><Txa value={d.financiamiento_body} onChange={set('financiamiento_body')} rows={3} /></Field></Full>
          <Full>
            <Field label="Foto de apoyo (columna derecha)">
              <ImageUploader currentUrl={d.financiamiento_imagen} folder="paginas"
                onUploaded={url => setD(p => ({ ...p, financiamiento_imagen: url }))} />
            </Field>
          </Full>
        </Sec>
        <Sec title="🌎 Fotos de destinos internacionales">
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8, gridColumn: '1/-1', lineHeight: 1.7 }}>
            Estas fotos aparecen en los destinos del Home. Sin foto se muestra un fondo de color. Recomendado: fotos de ciudad, 16:9 horizontal.
          </p>
          {[
            { key: 'dest_miami_img',      label: '🏙 Miami' },
            { key: 'dest_punta_cana_img', label: '🏖 Punta Cana' },
            { key: 'dest_orlando_img',    label: '🎡 Orlando' },
            { key: 'dest_espana_img',     label: '🇪🇸 España' },
            { key: 'dest_uruguay_img',    label: '🇺🇾 Uruguay' },
            { key: 'dest_nueva_york_img', label: '🗽 Nueva York' },
          ].map(({ key, label }) => (
            <Full key={key}>
              <Field label={label}>
                <ImageUploader
                  currentUrl={(d as Record<string,string>)[key] || ''}
                  folder="destinos"
                  onUploaded={url => setD(p => ({ ...p, [key]: url }))}
                />
              </Field>
            </Full>
          ))}
        </Sec>
        <Sec title="💬 Experiencias — Testimonios">
          <Full><Field label="Título de la sección"><Inp value={d.testimonios_titulo} onChange={set('testimonios_titulo')} /></Field></Full>
          <Full><Field label="Subtítulo de la sección"><Inp value={d.testimonios_subtitulo} onChange={set('testimonios_subtitulo')} /></Field></Full>
          {[1,2,3].map(n => (
            <Full key={n}>
              <div style={{ background: 'var(--off)', borderRadius: 4, padding: '16px 20px', marginBottom: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 12 }}>Testimonio {n}</div>
                <Field label="Texto del testimonio">
                  <Txa value={(d as Record<string,string>)[`testimonial_${n}_texto`] || ''} onChange={set(`testimonial_${n}_texto`)} rows={3} />
                </Field>
                <Field label="Autor (Ej: María Sánchez · Santiago, Chile)">
                  <Inp value={(d as Record<string,string>)[`testimonial_${n}_autor`] || ''} onChange={set(`testimonial_${n}_autor`)} />
                </Field>
                <Field label='URL historia (aparece como "Conoce la historia →")'>
                  <Inp value={(d as Record<string,string>)[`testimonial_${n}_url`] || ''} onChange={set(`testimonial_${n}_url`)} placeholder="https://..." />
                </Field>
              </div>
            </Full>
          ))}
        </Sec>
      </>}

      {pagina === 'quienes' && <>
        <Sec title="👥 Quiénes Somos — Banner principal">
          <Field label="Título principal"><Inp value={d.qs_titulo} onChange={set('qs_titulo')} /></Field>
          <Full><Field label="Subtítulo"><Txa value={d.qs_subtitulo} onChange={set('qs_subtitulo')} rows={3} /></Field></Full>
        </Sec>
        <Sec title="📖 Historia de la empresa">
          <Full><Field label="Párrafo 1"><Txa value={d.qs_historia_1} onChange={set('qs_historia_1')} rows={3} /></Field></Full>
          <Full><Field label="Párrafo 2"><Txa value={d.qs_historia_2} onChange={set('qs_historia_2')} rows={3} /></Field></Full>
          <Full><Field label="Párrafo 3"><Txa value={d.qs_historia_3} onChange={set('qs_historia_3')} rows={3} /></Field></Full>
          <Full>
            <Field label="📷 Foto oficina / equipo (columna derecha de la historia)">
              <ImageUploader currentUrl={d.quienes_imagen_historia} folder="paginas"
                onUploaded={url => setD(p => ({ ...p, quienes_imagen_historia: url }))} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Recomendado: foto horizontal de la oficina o el equipo trabajando.</p>
            </Field>
          </Full>
        </Sec>
      </>}

      {pagina === 'servicios' && <>
        <Sec title="💼 Servicios — Introducción">
          <Full><Field label="Texto introductorio de la página"><Txa value={d.servicios_intro} onChange={set('servicios_intro')} rows={2} /></Field></Full>
        </Sec>
        <Sec title="📄 Descripciones e imágenes de cada servicio">
          <Full><Field label="Inversión Internacional — Descripción"><Txa value={d.servicio_inv_int_desc} onChange={set('servicio_inv_int_desc')} rows={3} /></Field></Full>
          <Full><Field label="Inversión Internacional — Foto (columna derecha)">
            <ImageUploader currentUrl={d.servicio_inv_int_imagen} folder="servicios" onUploaded={url => setD(p => ({ ...p, servicio_inv_int_imagen: url }))} />
          </Field></Full>
          <Full><Field label="Inversión en Chile — Descripción"><Txa value={d.servicio_inv_cl_desc} onChange={set('servicio_inv_cl_desc')} rows={3} /></Field></Full>
          <Full><Field label="Inversión en Chile — Foto">
            <ImageUploader currentUrl={d.servicio_inv_cl_imagen} folder="servicios" onUploaded={url => setD(p => ({ ...p, servicio_inv_cl_imagen: url }))} />
          </Field></Full>
          <Full><Field label="Financiamiento Personas — Descripción"><Txa value={d.servicio_fin_per_desc} onChange={set('servicio_fin_per_desc')} rows={3} /></Field></Full>
          <Full><Field label="Financiamiento Personas — Foto">
            <ImageUploader currentUrl={d.servicio_fin_per_imagen} folder="servicios" onUploaded={url => setD(p => ({ ...p, servicio_fin_per_imagen: url }))} />
          </Field></Full>
          <Full><Field label="Financiamiento Empresas — Descripción"><Txa value={d.servicio_fin_emp_desc} onChange={set('servicio_fin_emp_desc')} rows={3} /></Field></Full>
          <Full><Field label="Financiamiento Empresas — Foto">
            <ImageUploader currentUrl={d.servicio_fin_emp_imagen} folder="servicios" onUploaded={url => setD(p => ({ ...p, servicio_fin_emp_imagen: url }))} />
          </Field></Full>
          <Full><Field label="Bancarización Extranjero — Descripción"><Txa value={d.servicio_banco_desc} onChange={set('servicio_banco_desc')} rows={3} /></Field></Full>
          <Full><Field label="Bancarización Extranjero — Foto">
            <ImageUploader currentUrl={d.servicio_banco_imagen} folder="servicios" onUploaded={url => setD(p => ({ ...p, servicio_banco_imagen: url }))} />
          </Field></Full>
        </Sec>
      </>}

      {pagina === 'asociados' && <>
        <Sec title="🤝 Asociados — Textos de la página">
          <Full><Field label="Párrafo introductorio"><Txa value={d.asociados_intro} onChange={set('asociados_intro')} rows={3} /></Field></Full>
          <Full><Field label="CTA para nuevos socios"><Txa value={d.asociados_cta} onChange={set('asociados_cta')} rows={2} /></Field></Full>
        </Sec>
      </>}

      {pagina === 'blog' && <>
        <Sec title="📝 Blog — Encabezado">
          <Field label="Título de la página"><Inp value={d.blog_titulo} onChange={set('blog_titulo')} /></Field>
          <Field label="Subtítulo / descripción"><Inp value={d.blog_subtitulo} onChange={set('blog_subtitulo')} /></Field>
        </Sec>
      </>}

      {pagina === 'contacto' && <>
        <Sec title="🏢 Datos de la empresa">
          <Field label="Nombre empresa"><Inp value={d.empresa_nombre} onChange={set('empresa_nombre')} /></Field>
          <Field label="Tagline (footer)"><Inp value={d.tagline} onChange={set('tagline')} /></Field>
          <Field label="Dirección"><Inp value={d.direccion} onChange={set('direccion')} /></Field>
          <Field label="Horario"><Inp value={d.horario} onChange={set('horario')} /></Field>
          <Field label="Teléfono 1"><Inp value={d.telefono_1} onChange={set('telefono_1')} /></Field>
          <Field label="Teléfono 2"><Inp value={d.telefono_2} onChange={set('telefono_2')} /></Field>
          <Field label="Email"><Inp type="email" value={d.email} onChange={set('email')} /></Field>
          <Field label="WhatsApp (solo números)"><Inp value={d.whatsapp} onChange={set('whatsapp')} placeholder="56931038954" /></Field>
        </Sec>
        <Sec title="📱 Redes sociales">
          <Field label="Facebook"><Inp value={d.facebook} onChange={set('facebook')} placeholder="https://facebook.com/..." /></Field>
          <Field label="Instagram"><Inp value={d.instagram} onChange={set('instagram')} placeholder="https://instagram.com/..." /></Field>
          <Field label="TikTok"><Inp value={d.tiktok} onChange={set('tiktok')} placeholder="https://tiktok.com/@..." /></Field>
          <Field label="LinkedIn"><Inp value={d.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/company/..." /></Field>
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
    const ext = file.name.split('.').pop()
    const name = `${Date.now()}.${ext}`
    await supabase.storage.from('imagenes').upload(name, file, { upsert: true })
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
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>
          Sube fotos de propiedades, del equipo, asociados o el hero. Copia la URL y úsala donde necesites.
        </p>
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

// ─── SIDEBAR DRAG ─────────────────────────────────────────────────────────────
const DEFAULT_TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'propiedades', label: 'Propiedades',    icon: '🏠' },
  { key: 'blog',        label: 'Blog',            icon: '📝' },
  { key: 'equipo',      label: 'Equipo',          icon: '👥' },
  { key: 'asociados',   label: 'Asociados',       icon: '🤝' },
  { key: 'mensajes',    label: 'Mensajes',        icon: '💬' },
  { key: 'contenido',   label: 'Textos del sitio',icon: '✏️' },
  { key: 'fotos',       label: 'Imágenes',        icon: '🖼' },
]

const STORAGE_KEY = 'sdm_admin_tab_order'

function loadTabOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_TABS
    const order: string[] = JSON.parse(saved)
    // Reorder DEFAULT_TABS based on saved order, preserving any new tabs
    const sorted = order
      .map(key => DEFAULT_TABS.find(t => t.key === key))
      .filter(Boolean) as typeof DEFAULT_TABS
    // Add any tabs not in saved order (new features added later)
    DEFAULT_TABS.forEach(t => { if (!sorted.find(s => s.key === t.key)) sorted.push(t) })
    return sorted
  } catch {
    return DEFAULT_TABS
  }
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
    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(t => t.key)))
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-dark)' }}><div className="font-serif italic" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Verificando sesión…</div></div>
  if (!authed)  return <LoginForm />

  return (
    <div className="min-h-screen" style={{ background: 'var(--off)' }}>
      {/* Top bar */}
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

      <div className="flex">
        {/* Sidebar — draggable */}
        <aside className="w-56 min-h-[calc(100vh-57px)] bg-white border-r border-[#e8edf2] py-6 flex-shrink-0 sticky top-[57px] self-start">
          <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="var(--muted)">
              <circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/>
              <circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/>
              <circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/>
            </svg>
            Arrastra para ordenar
          </div>
          {tabs.map((t, i) => (
            <div
              key={t.key}
              draggable
              onDragStart={() => onTabDragStart(i)}
              onDragEnter={() => onTabDragEnter(i)}
              onDragEnd={onTabDragEnd}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-3 transition-all duration-150"
              style={{
                padding: '11px 16px', fontSize: 13,
                fontWeight: tab === t.key ? 600 : 300,
                color: tab === t.key ? 'var(--navy-dark)' : 'var(--muted)',
                background: tab === t.key ? 'var(--sky-pale)' : 'transparent',
                borderLeft: tab === t.key ? '3px solid var(--green)' : '3px solid transparent',
                cursor: 'grab', userSelect: 'none',
              }}
            >
              {/* Grip dots */}
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ opacity: 0.3, flexShrink: 0 }}>
                <circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/>
                <circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/>
                <circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/>
              </svg>
              <span style={{ fontSize: 16 }}>{t.icon}</span>
              {t.label}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 lg:p-10 min-w-0">
          {tab === 'propiedades' && <PropiedadesAdmin />}
          {tab === 'blog'        && <BlogAdmin />}
          {tab === 'equipo'      && <EquipoAdmin />}
          {tab === 'asociados'   && <AsociadosAdmin />}
          {tab === 'mensajes'    && <MensajesAdmin />}
          {tab === 'contenido'   && <ContenidoAdmin />}
          {tab === 'fotos'       && <FotosAdmin />}
        </main>
      </div>
    </div>
  )
}
