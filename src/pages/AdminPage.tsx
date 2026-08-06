import { useState, useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { FileText, Users, MessageCircle } from 'lucide-react'
import { REGIONES, getComunas } from '@/data/comunas-chile'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { subirImagen, subirArchivo } from '@/lib/subirImagen'
import { invalidateContenidoCache } from '@/hooks/useContenido'
import { normalizeDossiers, dossierFileName } from '@/lib/dossiers'
import { thumbUrl } from '@/lib/imagenes'
import type { Propiedad, DossierItem } from '@/types'
import MapPicker from '@/components/ui/MapPicker'
import { Sec, Full } from '@/components/admin/layout'
import { Field, Inp, Txa, Chk, Sel } from '@/components/admin/campos'
import { SaveBtn, Badge } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { useDragSort } from '@/components/admin/useDragSort'
import Mensajes from '@/pages/admin/Mensajes'
import Blog from '@/pages/admin/Blog'
import Equipo from '@/pages/admin/Equipo'
import Asociados from '@/pages/admin/Asociados'
import PaginasLegales from '@/pages/admin/PaginasLegales'
import Barranco from '@/pages/admin/Barranco'
import Rental from '@/pages/admin/Rental'
import Vende from '@/pages/admin/Vende'
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
    const { error } = await supabase.from('propiedades').update({ activo: newVal }).eq('id', p.id)
    // El cambio se pinta antes de confirmar; si la base lo rechaza hay que
    // devolver el interruptor a donde estaba o la pantalla queda mintiendo.
    if (avisarError('No se pudo cambiar la visibilidad de la propiedad', error)) {
      setItems(prev => prev.map(item => item.id === p.id ? { ...item, activo: isCurrentlyActive } : item))
    }
  }

  const { items: dragged, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    const updates = reordered.map((p, i) => supabase.from('propiedades').update({ destacada: i < 6 }).eq('id', p.id))
    const fallo = (await Promise.all(updates)).find(r => r.error)
    avisarError('No se pudo guardar el nuevo orden de las propiedades', fallo?.error ?? null)
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
    const { error } = await supabase.from('propiedades').delete().eq('id', id)
    if (avisarError('No se pudo eliminar la propiedad', error)) return
    load()
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
    const { error } = editing.id
      ? await supabase.from('propiedades').update(payload).eq('id', editing.id)
      : await supabase.from('propiedades').insert([{ ...payload, imagenes: editing.imagenes || [], destacada: false, internacional: false, a_consultar: editing.a_consultar || false }])

    setSaving(false)
    if (avisarError('No se pudo guardar la propiedad', error)) return

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
    banner_activo: 'false',
    banner_kicker: 'Oportunidad comercial',
    banner_imagen: '',
    banner_titulo: 'Oficinas en arriendo en Santiago Centro',
    banner_subtitulo: '42 oficinas disponibles · desde 178 m² · ejes Miraflores, Ahumada y Nueva York',
    banner_cta_texto: 'Ver disponibilidad',
    banner_cta_url: '/propiedades/oficinas-arriendo-santiago-centro',
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
    const { error } = await supabase.from('contenido_sitio').upsert(
      Object.entries(d).map(([clave, valor]) => ({ clave, valor })),
      { onConflict: 'clave' }
    )
    setSaving(false)
    if (avisarError('No se pudo guardar el contenido del sitio', error)) return
    invalidateContenidoCache()
    setSaved(true); setTimeout(() => setSaved(false), 2500)
  }

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
        {(() => {
          const activo = d.banner_activo === 'true'
          return (
            <Sec title={`${activo ? '👁' : '🚫'} Banner promocional`}>
              <Full>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.7 }}>
                  Pieza que aparece en el inicio, justo debajo del buscador. Se muestra a todos los
                  visitantes mientras esté activa: para retirarla, apaga este switch.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: activo ? '#f0faf4' : '#fff3f3', borderRadius: 4, border: `1px solid ${activo ? '#86efac' : '#fca5a5'}`, marginBottom: 8 }}>
                  <button onClick={() => setD(p => ({ ...p, banner_activo: activo ? 'false' : 'true' }))}
                    style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: activo ? 'var(--green)' : '#ccc', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 2, left: activo ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', display: 'block' }} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 500, color: activo ? '#16a34a' : '#dc2626' }}>{activo ? '✓ Visible en el inicio' : '⏸ Oculto'}</span>
                </div>
              </Full>
              <Full><Field label="Kicker (etiqueta superior)"><Inp value={d.banner_kicker} onChange={set('banner_kicker')} /></Field></Full>
              <Full><Field label="Título"><Inp value={d.banner_titulo} onChange={set('banner_titulo')} /></Field></Full>
              <Full><Field label="Subtítulo"><Txa value={d.banner_subtitulo} onChange={set('banner_subtitulo')} rows={2} /></Field></Full>
              <Field label="Texto del botón"><Inp value={d.banner_cta_texto} onChange={set('banner_cta_texto')} /></Field>
              <Field label="Enlace del botón"><Inp value={d.banner_cta_url} onChange={set('banner_cta_url')} /></Field>
              <Full>
                <Field label="Imagen (columna derecha)">
                  <ImageUploader currentUrl={d.banner_imagen} folder="banner" onUploaded={url => setD(p => ({ ...p, banner_imagen: url }))} />
                </Field>
              </Full>
            </Sec>
          )
        })()}
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
          {tab === 'blog'         && <Blog />}
          {tab === 'equipo'       && <Equipo />}
          {tab === 'asociados'    && <Asociados />}
          {tab === 'mensajes'     && <Mensajes />}
          {tab === 'contenido'    && <ContenidoAdmin />}
          {tab === 'fotos'        && <FotosAdmin />}
          {tab === 'barranco'     && <Barranco />}
          {tab === 'tarjetas'     && <TarjetasEquipo />}
          {tab === 'legal'        && <PaginasLegales />}
          {tab === 'rental'       && <Rental />}
          {tab === 'vende'        && <Vende />}
        </main>
      </div>
    </div>
  )
}