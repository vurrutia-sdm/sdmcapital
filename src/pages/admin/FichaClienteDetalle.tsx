import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2, ChevronRight, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { Guardado, useGuardado } from '@/components/admin/acciones'

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
type Cliente = {
  id: string
  nombre: string
  telefono: string | null
  correo: string | null
  created_at: string
}

type Ficha = {
  id: string
  cliente_id: string
  tipo: string | null
  operacion: string | null
  direccion: string | null
  precio_uf: number | null
  dormitorios: number | null
  banos: number | null
  fotos: string[]
  created_at: string
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 'var(--sdm-text-base)', color: '#1a2e44', background: '#fff',
  border: 'none', borderBottom: '1px solid #dce4ec', padding: '7px 0',
  outline: 'none', width: '100%',
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: '#7a8fa6', fontWeight: 500 }}>{label}</label>
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
export default function FichaClienteDetalle() {
  const { authed, checking } = useAdminAuth()
  const { clienteId } = useParams<{ clienteId: string }>()
  const navigate = useNavigate()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ nombre: '', telefono: '', correo: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [guardado, avisarGuardado] = useGuardado()

  const loadAll = async () => {
    if (!clienteId) return
    setLoading(true)
    const [{ data: c }, { data: f }] = await Promise.all([
      supabase.from('ficha_clientes').select('*').eq('id', clienteId).single(),
      supabase.from('ficha_propiedades').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
    ])
    if (c) { setCliente(c as Cliente); setEditForm({ nombre: (c as Cliente).nombre, telefono: (c as Cliente).telefono || '', correo: (c as Cliente).correo || '' }) }
    setFichas((f as Ficha[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) loadAll() }, [authed, clienteId])

  const saveEdit = async () => {
    if (!editForm.nombre.trim() || !clienteId) return
    setSaving(true)
    const { error } = await supabase.from('ficha_clientes').update({
      nombre: editForm.nombre.trim(),
      telefono: editForm.telefono.trim() || null,
      correo: editForm.correo.trim() || null,
    }).eq('id', clienteId)
    setSaving(false)
    if (avisarError('No se pudo guardar la ficha', error)) return
    avisarGuardado()
    setShowEdit(false)
    loadAll()
  }

  const deleteFicha = async (e: React.MouseEvent, ficha: Ficha) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar esta ficha de "${ficha.direccion || 'propiedad'}"? También se eliminarán las fotos.`)) return
    setDeleting(ficha.id)

    // Delete photos from storage
    const paths = ficha.fotos.map(storagePathFromUrl).filter(Boolean) as string[]
    if (paths.length > 0) {
      await supabase.storage.from('fichas-fotos').remove(paths)
    }

    const { error } = await supabase.from('ficha_propiedades').delete().eq('id', ficha.id)
    setDeleting(null)
    if (avisarError('No se pudo eliminar la ficha', error)) return
    loadAll()
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d2240' }}>
      <span className="text-sdm-xl" style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Verificando sesión…</span>
    </div>
  )
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d2240' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 4, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: '#1a2e44' }}>Debes iniciar sesión.</p>
        <Link to="/admin" style={{ color: '#0d2240', fontWeight: 600 }}>← Ir al admin</Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #dce4ec', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to="/admin/ficha-cliente" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#7a8fa6', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Clientes
          </Link>
          <span style={{ color: '#dce4ec' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: '#0d2240' }}>{cliente?.nombre || '…'}</span>
        </div>
        {clienteId && (
          <Link className="text-sdm-sm tracking-sdm-wide" to={`/admin/ficha-cliente/${clienteId}/nueva`}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4db870', color: '#fff', textDecoration: 'none', borderRadius: 2, padding: '9px 20px', fontWeight: 600 }}>
            <Plus size={15} /> Nueva ficha
          </Link>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div className="text-sdm-base" style={{ textAlign: 'center', padding: '60px 0', color: '#7a8fa6', fontStyle: 'italic' }}>Cargando…</div>
        ) : !cliente ? (
          <div className="text-sdm-base" style={{ textAlign: 'center', padding: '60px 0', color: '#e24b4a' }}>Cliente no encontrado.</div>
        ) : (
          <>
            {/* Cliente card */}
            <div style={{ background: '#fff', border: '1px solid #dce4ec', borderRadius: 4, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#0d2240', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="text-sdm-xl" style={{ color: '#fff', fontWeight: 700 }}>{cliente.nombre.charAt(0).toUpperCase()}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="text-sdm-lg" style={{ fontWeight: 600, color: '#0d2240', marginBottom: 4 }}>{cliente.nombre}</div>
                <div className="text-sdm-sm" style={{ color: '#7a8fa6', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {cliente.telefono && <span>{cliente.telefono}</span>}
                  {cliente.correo && <span>{cliente.correo}</span>}
                </div>
              </div>
              <Guardado visible={guardado} />
              <button className="text-sdm-sm" onClick={() => setShowEdit(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f7fa', border: '1px solid #dce4ec', borderRadius: 2, padding: '8px 16px', cursor: 'pointer', color: '#0d2240', fontFamily: 'inherit' }}>
                <Edit2 size={13} /> Editar
              </button>
            </div>

            {/* Fichas */}
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 700, textTransform: 'uppercase', color: '#0d2240', marginBottom: 12 }}>
              Fichas ({fichas.length})
            </div>

            {fichas.length === 0 ? (
              <div style={{ background: '#fff', border: '1px dashed #dce4ec', borderRadius: 4, padding: '48px 24px', textAlign: 'center' }}>
                <div className="text-sdm-base" style={{ color: '#7a8fa6', marginBottom: 16 }}>Sin fichas todavía.</div>
                <Link className="text-sdm-base" to={`/admin/ficha-cliente/${clienteId}/nueva`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#4db870', color: '#fff', textDecoration: 'none', borderRadius: 2, padding: '11px 24px', fontWeight: 600 }}>
                  <Plus size={15} /> Crear primera ficha
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fichas.map(f => {
                  const isDel = deleting === f.id
                  return (
                    <div key={f.id}
                      className="border border-[#dce4ec] hover:border-[#4db870] hover:shadow-[0_2px_8px_rgba(77,184,112,0.1)]"
                      onClick={() => navigate(`/admin/ficha-cliente/${clienteId}/ficha/${f.id}`)}
                      style={{ background: '#fff', borderRadius: 4, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', opacity: isDel ? 0.5 : 1 }}
                    >
                      {/* Thumb */}
                      <div style={{ width: 56, height: 42, borderRadius: 3, overflow: 'hidden', flexShrink: 0, background: '#e8edf2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {f.fotos && f.fotos.length > 0
                          ? <img src={f.fotos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Image size={16} style={{ color: '#c0cdd8' }} />
                        }
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-sdm-base" style={{ fontWeight: 600, color: '#0d2240', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.direccion || 'Sin dirección'}
                        </div>
                        <div className="text-sdm-sm" style={{ color: '#7a8fa6', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {f.tipo && <span>{f.tipo}</span>}
                          {f.operacion && <span>{f.operacion}</span>}
                          {f.precio_uf && <span style={{ color: '#0d2240', fontWeight: 600 }}>UF {f.precio_uf.toLocaleString('es-CL')}</span>}
                          <span>{new Date(f.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        {f.fotos && f.fotos.length > 0 && (
                          <span className="text-sdm-xs" style={{ color: '#7a8fa6', whiteSpace: 'nowrap' }}>{f.fotos.length} foto{f.fotos.length !== 1 ? 's' : ''}</span>
                        )}
                        <button className="text-sdm-sm" onClick={e => { e.stopPropagation(); navigate(`/admin/ficha-cliente/${clienteId}/ficha/${f.id}/editar`) }}
                          title="Editar ficha"
                          style={{ background: 'none', border: '1px solid #dce4ec', borderRadius: 2, cursor: 'pointer', color: '#0d2240', padding: '3px 10px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                          <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={e => deleteFicha(e, f)} disabled={isDel} title="Eliminar ficha"
                          style={{ background: 'none', border: 'none', cursor: isDel ? 'not-allowed' : 'pointer', color: '#e24b4a', padding: 4, display: 'flex', alignItems: 'center', opacity: isDel ? 0.5 : 1 }}>
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={16} style={{ color: '#c0cdd8' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,34,64,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '32px 36px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h2 className="text-sdm-xl" style={{ fontWeight: 600, color: '#0d2240', marginBottom: 28, fontFamily: 'inherit' }}>Editar cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FLabel label="Nombre *">
                <input autoFocus value={editForm.nombre} onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))} style={inp} />
              </FLabel>
              <FLabel label="Teléfono">
                <input value={editForm.telefono} onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))} style={inp} />
              </FLabel>
              <FLabel label="Correo">
                <input type="email" value={editForm.correo} onChange={e => setEditForm(f => ({ ...f, correo: e.target.value }))} style={inp} />
              </FLabel>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button className="text-sdm-base" onClick={saveEdit} disabled={saving || !editForm.nombre.trim()}
                style={{ flex: 1, background: saving || !editForm.nombre.trim() ? '#a0b4c4' : '#4db870', color: '#fff', border: 'none', borderRadius: 2, padding: '11px 0', fontWeight: 600, cursor: saving || !editForm.nombre.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button className="text-sdm-base" onClick={() => setShowEdit(false)}
                style={{ padding: '11px 20px', background: '#f5f7fa', border: '1px solid #dce4ec', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', color: '#7a8fa6' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
