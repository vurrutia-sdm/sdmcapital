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
type ExistingPhoto = { kind: 'existing'; id: string; url: string }
type NewPhoto     = { kind: 'new';      id: string; file: File; previewUrl: string }
type AnyPhoto     = ExistingPhoto | NewPhoto

type FormState = {
  tipo: string; operacion: string; direccion: string
  precioUF: string; supUtil: string; supTotal: string
  dormitorios: string; banos: string; estacionamientos: string
  descripcion: string
  asesorNombre: string; asesorTelefono: string; asesorCorreo: string
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 'var(--sdm-text-base)', color: 'var(--navy-dark)', background: '#fff',
  border: 'none', borderBottom: '1px solid var(--border)', padding: '7px 0', width: '100%',
}
const sel: React.CSSProperties = { ...inp, cursor: 'pointer' }

// El <label> ENVUELVE a su control: eso los asocia, sin htmlFor y sin ids que
// puedan colisionar entre las cinco copias de este componente.
//
// EL ESTILO DEL ROTULO VA EN EL <span>. `text-transform` y `letter-spacing`
// son heredadas y se aplican al texto que se escribe dentro del input; los
// estilos de campo de este archivo no fijan ninguna de las dos. Con el
// `uppercase` en el <label>, todo lo tecleado saldria en mayusculas sin que el
// build avise.
//
// No hace falta `display: block`: el contenedor ya trae `display: flex`.
function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  )
}

function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: '24px 28px', marginBottom: 20 }}>
      <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid #f0f4f8' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function storagePathFromUrl(url: string): string | null {
  const marker = '/fichas-fotos/'
  const i = url.indexOf(marker)
  return i !== -1 ? url.slice(i + marker.length) : null
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FichaClienteEditar() {
  const { authed, checking } = useAdminAuth()
  const { clienteId, fichaId } = useParams<{ clienteId: string; fichaId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [agenteId, setAgenteId] = useState('')
  const [form, setForm] = useState<FormState>({
    tipo: 'Departamento', operacion: 'Venta', direccion: '',
    precioUF: '', supUtil: '', supTotal: '',
    dormitorios: '', banos: '', estacionamientos: '',
    descripcion: '',
    asesorNombre: '', asesorTelefono: '', asesorCorreo: '',
  })
  const [photos, setPhotos] = useState<AnyPhoto[]>([])
  const [removedUrls, setRemovedUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const newPhotosRef = useRef<NewPhoto[]>([])

  // Track new photos for cleanup on unmount
  useEffect(() => {
    newPhotosRef.current = photos.filter((p): p is NewPhoto => p.kind === 'new')
  }, [photos])
  useEffect(() => () => {
    newPhotosRef.current.forEach(p => URL.revokeObjectURL(p.previewUrl))
  }, [])

  // Load agentes
  useEffect(() => {
    if (!authed) return
    supabase.from('sdm_agentes').select('id,nombre,telefono,correo').eq('activo', true).order('nombre')
      .then(({ data }) => setAgentes((data as Agente[]) || []))
  }, [authed])

  // Load ficha data
  useEffect(() => {
    if (!authed || !fichaId) return
    const load = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('ficha_propiedades').select('*').eq('id', fichaId).single()
      if (error || !data) { setLoading(false); return }
      const d = data as {
        tipo: string | null; operacion: string | null; direccion: string | null
        precio_uf: number | null; sup_util: number | null; sup_total: number | null
        dormitorios: number | null; banos: number | null; estacionamientos: number | null
        descripcion: string | null
        asesor_nombre: string | null; asesor_telefono: string | null; asesor_correo: string | null
        fotos: string[]
      }
      setForm({
        tipo: d.tipo || 'Departamento',
        operacion: d.operacion || 'Venta',
        direccion: d.direccion || '',
        precioUF: d.precio_uf != null ? String(d.precio_uf) : '',
        supUtil: d.sup_util != null ? String(d.sup_util) : '',
        supTotal: d.sup_total != null ? String(d.sup_total) : '',
        dormitorios: d.dormitorios != null ? String(d.dormitorios) : '',
        banos: d.banos != null ? String(d.banos) : '',
        estacionamientos: d.estacionamientos != null ? String(d.estacionamientos) : '',
        descripcion: d.descripcion || '',
        asesorNombre: d.asesor_nombre || '',
        asesorTelefono: d.asesor_telefono || '',
        asesorCorreo: d.asesor_correo || '',
      })
      const existingPhotos: ExistingPhoto[] = (d.fotos || []).map((url, i) => ({
        kind: 'existing', id: `existing-${i}`, url,
      }))
      setPhotos(existingPhotos)
      setLoading(false)
    }
    load()
  }, [authed, fichaId])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const addPhotos = (files: FileList) => {
    const remaining = 15 - photos.length
    if (remaining <= 0) return
    const items: NewPhoto[] = Array.from(files).slice(0, remaining).map(file => ({
      kind: 'new', id: Math.random().toString(36).slice(2), file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...items])
  }

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const item = prev.find(p => p.id === id)
      if (!item) return prev
      if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl)
      if (item.kind === 'existing') setRemovedUrls(r => [...r, item.url])
      return prev.filter(p => p.id !== id)
    })
  }

  // Sin trabajo al soltar: el orden vive en este estado hasta que se guarda la
  // ficha, igual que antes.
  const { arrastrando, filaProps, manijaProps } = usePointerSort(photos, setPhotos, () => {})

  const uploadNewPhotos = async (items: NewPhoto[]): Promise<string[]> => {
    const timestamp = Date.now()
    const urls: string[] = []
    for (let i = 0; i < items.length; i++) {
      const ext = items[i].file.name.split('.').pop() || 'jpg'
      const path = `${clienteId}/${timestamp}/edit_${i}.${ext}`
      const r = await subirImagen(items[i].file, 'fichas', `fichas/${path}`)
      if (!r) throw new Error(`Error subiendo foto ${i + 1}`)
      urls.push(r.url)
    }
    return urls
  }

  const save = async () => {
    if (!fichaId || !clienteId) return
    setSaving(true); setSaveError('')
    try {
      // Upload new photos
      const newItems = photos.filter((p): p is NewPhoto => p.kind === 'new')
      const newUrls = newItems.length > 0 ? await uploadNewPhotos(newItems) : []

      // Build final ordered URL list (preserving drag order)
      let newUrlIdx = 0
      const finalFotos = photos.map(p => {
        if (p.kind === 'existing') return p.url
        return newUrls[newUrlIdx++]
      })

      // Update DB
      const { error } = await supabase.from('ficha_propiedades').update({
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
        fotos: finalFotos,
      }).eq('id', fichaId)
      if (error) throw new Error(error.message)

      // Delete removed photos from storage (best-effort)
      const removedPaths = removedUrls.map(storagePathFromUrl).filter(Boolean) as string[]
      if (removedPaths.length > 0) {
        await supabase.storage.from('fichas-fotos').remove(removedPaths)
      }

      navigate(`/admin/ficha-cliente/${clienteId}/ficha/${fichaId}`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Error desconocido al guardar.')
      setSaving(false)
    }
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-dark)' }}>
      <span className="text-sdm-xl" style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Verificando sesión…</span>
    </div>
  )
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-dark)' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 4, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: 'var(--navy-dark)' }}>Debes iniciar sesión.</p>
        <Link to="/admin" style={{ color: 'var(--navy-dark)', fontWeight: 600 }}>← Volver al admin</Link>
      </div>
    </div>
  )

  const totalPhotos = photos.length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to={`/admin/ficha-cliente/${clienteId}/ficha/${fichaId}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Cancelar
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>Editar ficha</span>
        </div>
      </div>

      {loading ? (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="text-sdm-base" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Cargando ficha…</span>
        </div>
      ) : (
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
                }} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="">— Seleccionar asesor —</option>
                  {agentes.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </FLabel>
              <a className="text-sdm-sm" href="/admin/agentes" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--green-dark)', textDecoration: 'none', marginTop: 6, display: 'inline-block' }}>
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
          <SCard title={`Fotos (${totalPhotos}/15)`}>
            {photos.length > 0 && (
              <>
                {photos.length > 1 && (
                  <div className="text-sdm-sm" style={{ color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 9l4-4 4 4M5 15l4 4 4-4"/></svg>
                    Arrastra para reordenar
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10, marginBottom: 16 }}>
                  {photos.map((p, i) => {
                    const src = p.kind === 'existing' ? p.url : p.previewUrl
                    return (
                      <div key={p.id}
                        {...filaProps(i)}
                        style={{ opacity: arrastrando === i ? 0.45 : 1, position: 'relative', aspectRatio: '4/3', borderRadius: 4, overflow: 'hidden', cursor: 'grab', border: `2px solid ${p.kind === 'new' ? 'var(--green-dark)' : 'var(--border)'}`, userSelect: 'none' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />
                        <div className="text-sdm-xs" style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(13,34,64,0.75)', borderRadius: 2, padding: '1px 6px', fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>
                          {i + 1}
                        </div>
                        {p.kind === 'new' && (
                          <div className="text-sdm-xs tracking-sdm-wide" style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(77,184,112,0.9)', borderRadius: 2, padding: '1px 5px', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                            Nueva
                          </div>
                        )}
                        {/* Abajo a la DERECHA y no a la izquierda como en la
                            ficha nueva: ahi vive el badge "Nueva". */}
                        <span {...manijaProps} style={{ ...manijaProps.style, position: 'absolute', bottom: 0, right: 0, background: 'rgba(13,34,64,0.75)', borderRadius: '3px 0 3px 0', padding: '8px 10px', display: 'flex' }}>
                          <GripVertical size={14} strokeWidth={2} color="#fff" />
                        </span>
                        <button onClick={() => removePhoto(p.id)}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(226,75,74,0.9)', border: 'none', borderRadius: 2, color: '#fff', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit' }}>
                          <X size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            {totalPhotos < 15 && (
              <label className="text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy-dark)', color: '#fff', padding: '9px 20px', borderRadius: 2, cursor: 'pointer', fontWeight: 600, textTransform: 'uppercase', fontFamily: 'inherit' }}>
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

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="text-sdm-base tracking-sdm-wide" onClick={save} disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? 'var(--muted)' : 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '13px 28px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <Link className="text-sdm-base" to={`/admin/ficha-cliente/${clienteId}/ficha/${fichaId}`}
              style={{ display: 'flex', alignItems: 'center', padding: '13px 24px', background: 'var(--off)', border: '1px solid var(--border)', borderRadius: 2, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500 }}>
              Cancelar
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
