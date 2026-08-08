import { useState, useRef, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, GripVertical, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { subirImagen } from '@/lib/subirImagen'
import { usePointerSort } from '@/components/admin/useDragSort'

type Agente = { id: string; nombre: string; telefono: string | null; correo: string | null }

// ── Auth ──────────────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
type PhotoItem = { id: string; file: File; url: string }

type FormState = {
  tipo: string; operacion: string; direccion: string
  precioUF: string; supUtil: string; supTotal: string
  dormitorios: string; banos: string; estacionamientos: string
  descripcion: string
  asesorNombre: string; asesorTelefono: string; asesorCorreo: string
}

const INIT: FormState = {
  tipo: 'Departamento', operacion: 'Venta', direccion: '',
  precioUF: '', supUtil: '', supTotal: '',
  dormitorios: '', banos: '', estacionamientos: '',
  descripcion: '',
  asesorNombre: '', asesorTelefono: '', asesorCorreo: '',
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 'var(--sdm-text-base)', color: '#1a2e44', background: '#fff',
  border: 'none', borderBottom: '1px solid #dce4ec', padding: '7px 0',
  outline: 'none', width: '100%',
}

const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: '#7a8fa6', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #dce4ec', borderRadius: 4, padding: '24px 28px', marginBottom: 20 }}>
      <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0d2240', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f4f8' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FichaClienteNueva() {
  const { authed, checking } = useAdminAuth()
  const { clienteId } = useParams<{ clienteId: string }>()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(INIT)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [agenteId, setAgenteId] = useState('')
  const photosRef = useRef<PhotoItem[]>([])

  useEffect(() => { photosRef.current = photos }, [photos])
  useEffect(() => () => { photosRef.current.forEach(p => URL.revokeObjectURL(p.url)) }, [])

  useEffect(() => {
    if (!authed) return
    supabase.from('sdm_agentes').select('id,nombre,telefono,correo').eq('activo', true).order('nombre')
      .then(({ data }) => setAgentes((data as Agente[]) || []))
  }, [authed])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const addPhotos = (files: FileList) => {
    const remaining = 15 - photos.length
    if (remaining <= 0) return
    const items: PhotoItem[] = Array.from(files).slice(0, remaining).map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      url: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...items])
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const item = prev.find(p => p.id === id)
      if (item) URL.revokeObjectURL(item.url)
      return prev.filter(p => p.id !== id)
    })
  }

  // Sin trabajo al soltar: el orden vive en este estado hasta que se guarda la
  // ficha, igual que antes.
  const { arrastrando, filaProps, manijaProps } = usePointerSort(photos, setPhotos, () => {})

  const uploadPhotos = async (items: PhotoItem[]): Promise<string[]> => {
    const timestamp = Date.now()
    const urls: string[] = []
    for (let i = 0; i < items.length; i++) {
      const ext = items[i].file.name.split('.').pop() || 'jpg'
      const path = `${clienteId}/${timestamp}/${i}.${ext}`
      const r = await subirImagen(items[i].file, 'fichas', `fichas/${path}`)
      if (!r) throw new Error(`Error subiendo foto ${i + 1}`)
      urls.push(r.url)
    }
    return urls
  }

  const save = async () => {
    if (!clienteId) return
    setSaving(true); setSaveError('')
    try {
      const fotoUrls = photos.length > 0 ? await uploadPhotos(photos) : []
      const payload = {
        cliente_id: clienteId,
        tipo: form.tipo || null,
        operacion: form.operacion || null,
        direccion: form.direccion.trim() || null,
        precio_uf: form.precioUF ? parseFloat(form.precioUF) : null,
        sup_util: form.supUtil ? parseFloat(form.supUtil) : null,
        sup_total: form.supTotal ? parseFloat(form.supTotal) : null,
        dormitorios: form.dormitorios ? parseInt(form.dormitorios) : null,
        banos: form.banos ? parseInt(form.banos) : null,
        estacionamientos: form.estacionamientos ? parseInt(form.estacionamientos) : null,
        descripcion: form.descripcion.trim() || null,
        asesor_nombre: form.asesorNombre.trim() || null,
        asesor_telefono: form.asesorTelefono.trim() || null,
        asesor_correo: form.asesorCorreo.trim() || null,
        fotos: fotoUrls,
      }
      const { data, error } = await supabase.from('ficha_propiedades').insert([payload]).select().single()
      if (error) throw new Error(error.message)
      navigate(`/admin/ficha-cliente/${clienteId}/ficha/${(data as { id: string }).id}`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error desconocido al guardar.')
      setSaving(false)
    }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d2240' }}>
      <span className="text-sdm-xl" style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Verificando sesión…</span>
    </div>
  )
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d2240' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 4, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: '#1a2e44' }}>Debes iniciar sesión.</p>
        <Link to="/admin" style={{ color: '#0d2240', fontWeight: 600 }}>← Volver al admin</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dce4ec', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to={`/admin/ficha-cliente/${clienteId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7a8fa6', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al cliente
          </Link>
          <span style={{ color: '#dce4ec' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: '#0d2240' }}>Nueva ficha</span>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Propiedad */}
        <SCard title="Datos de la propiedad">
          <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2">
            <FLabel label="Tipo de propiedad">
              <select value={form.tipo} onChange={set('tipo')} style={sel}>
                {['Departamento','Casa','Oficina','Local comercial','Terreno'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FLabel>
            <FLabel label="Operación">
              <select value={form.operacion} onChange={set('operacion')} style={sel}>
                {['Venta','Arriendo','Arriendo con opción de compra'].map(o => <option key={o}>{o}</option>)}
              </select>
            </FLabel>
            <div style={{ gridColumn: '1 / -1' }}>
              <FLabel label="Dirección / Sector">
                <input value={form.direccion} onChange={set('direccion')} style={inp} placeholder="Ej: Las Condes, Santiago" />
              </FLabel>
            </div>
            <FLabel label="Precio en UF">
              <input type="number" value={form.precioUF} onChange={set('precioUF')} style={inp} placeholder="Ej: 4500" />
            </FLabel>
            <FLabel label="Superficie útil m²">
              <input type="number" value={form.supUtil} onChange={set('supUtil')} style={inp} placeholder="Ej: 75" />
            </FLabel>
            <FLabel label="Superficie total m²">
              <input type="number" value={form.supTotal} onChange={set('supTotal')} style={inp} placeholder="Ej: 90" />
            </FLabel>
            <FLabel label="Dormitorios">
              <input type="number" value={form.dormitorios} onChange={set('dormitorios')} style={inp} placeholder="Ej: 3" />
            </FLabel>
            <FLabel label="Baños">
              <input type="number" value={form.banos} onChange={set('banos')} style={inp} placeholder="Ej: 2" />
            </FLabel>
            <FLabel label="Estacionamientos">
              <input type="number" value={form.estacionamientos} onChange={set('estacionamientos')} style={inp} placeholder="Ej: 1" />
            </FLabel>
            <div style={{ gridColumn: '1 / -1' }}>
              <FLabel label="Descripción">
                <textarea value={form.descripcion} onChange={set('descripcion')} rows={6} style={{ ...inp, resize: 'none', lineHeight: 1.75 }} placeholder="Describe la propiedad para la ficha del cliente…" />
              </FLabel>
            </div>
          </div>
        </SCard>

        {/* Contacto SDM */}
        <SCard title="Contacto SDM Capital">
          <div style={{ marginBottom: 20 }}>
            <FLabel label="Seleccionar asesor guardado">
              <select value={agenteId} onChange={e => {
                const id = e.target.value
                setAgenteId(id)
                const a = agentes.find(x => x.id === id)
                if (a) setForm(f => ({ ...f, asesorNombre: a.nombre, asesorTelefono: a.telefono || '', asesorCorreo: a.correo || '' }))
              }} style={{ ...sel }}>
                <option value="">— Seleccionar asesor —</option>
                {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </FLabel>
            <a className="text-sdm-sm" href="/admin/agentes" target="_blank" rel="noopener noreferrer"
              style={{ color: '#4db870', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>
              Gestionar agentes →
            </a>
          </div>
          <div className="grid grid-cols-1 gap-y-5 gap-x-6 md:grid-cols-2 lg:grid-cols-3">
            <FLabel label="Nombre">
              <input value={form.asesorNombre} onChange={set('asesorNombre')} style={inp} placeholder="Juan Pérez" />
            </FLabel>
            <FLabel label="Teléfono">
              <input value={form.asesorTelefono} onChange={set('asesorTelefono')} style={inp} placeholder="+56 9 8765 4321" />
            </FLabel>
            <FLabel label="Correo">
              <input type="email" value={form.asesorCorreo} onChange={set('asesorCorreo')} style={inp} placeholder="asesor@sdmcapital.cl" />
            </FLabel>
          </div>
        </SCard>

        {/* Fotos */}
        <SCard title={`Fotos (${photos.length}/15)`}>
          {photos.length > 0 && (
            <>
              {photos.length > 1 && (
                <div className="text-sdm-sm" style={{ color: '#7a8fa6', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l4-4 4 4M5 15l4 4 4-4"/></svg>
                  Arrastra para reordenar
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
                {photos.map((p, i) => (
                  <div key={p.id}
                    {...filaProps(i)}
                    style={{ opacity: arrastrando === i ? 0.45 : 1, position: 'relative', aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', cursor: 'grab', border: '2px solid #dce4ec', userSelect: 'none' }}>
                    <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                    <div className="text-sdm-xs" style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(13,34,64,0.75)', borderRadius: 2, padding: '1px 6px', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                      {i + 1}
                    </div>
                    <span {...manijaProps} style={{ ...manijaProps.style, position: 'absolute', bottom: 0, left: 0, background: 'rgba(13,34,64,0.75)', borderRadius: '0 3px 0 3px', padding: '8px 10px', display: 'flex' }}>
                      <GripVertical size={14} strokeWidth={2} color="#fff" />
                    </span>
                    <button onClick={() => removePhoto(p.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.9)', border: 'none', borderRadius: 2, color: '#fff', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {photos.length < 15 && (
            <label className="text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0d2240', color: '#fff', padding: '9px 20px', borderRadius: 2, cursor: 'pointer', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'inherit' }}>
              + Agregar fotos
              <input type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => { if (e.target.files?.length) { addPhotos(e.target.files); e.target.value = '' } }} />
            </label>
          )}
        </SCard>

        {saveError && (
          <div className="text-sdm-base" style={{ background: '#fff3f3', border: '1px solid #fca5a5', borderRadius: 4, padding: '12px 16px', marginBottom: 16, color: '#dc2626' }}>
            {saveError}
          </div>
        )}

        <button className="text-sdm-base tracking-sdm-wide" onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? '#7a8fa6' : '#4db870', color: '#fff', border: 'none', borderRadius: 2, padding: '13px 28px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {saving ? (photos.length > 0 ? `Subiendo fotos y guardando…` : 'Guardando…') : 'Guardar ficha'}
        </button>
      </div>
    </div>
  )
}
