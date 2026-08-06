import { useState, useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { FileText, Users, MessageCircle } from 'lucide-react'
import { REGIONES, getComunas } from '@/data/comunas-chile'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { subirImagen, subirArchivo } from '@/lib/subirImagen'
import { normalizeDossiers, dossierFileName } from '@/lib/dossiers'
import { thumbUrl } from '@/lib/imagenes'
import type { Propiedad, DossierItem } from '@/types'
import MapPicker from '@/components/ui/MapPicker'
import { Field, Inp, Chk, Sel } from '@/components/admin/campos'
import { SaveBtn, Badge } from '@/components/admin/acciones'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import { useDragSort } from '@/components/admin/useDragSort'
import Mensajes from '@/pages/admin/Mensajes'
import Blog from '@/pages/admin/Blog'
import Equipo from '@/pages/admin/Equipo'
import Asociados from '@/pages/admin/Asociados'
import PaginasLegales from '@/pages/admin/PaginasLegales'
import Contenido from '@/pages/admin/Contenido'
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
          {tab === 'contenido'    && <Contenido />}
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