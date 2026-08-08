import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react'
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
type Agente = {
  id: string
  nombre: string
  telefono: string | null
  correo: string | null
  activo: boolean
  created_at: string
}

type ModalForm = { nombre: string; telefono: string; correo: string; activo: boolean }

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 'var(--sdm-text-base)', color: 'var(--navy-dark)', background: '#fff',
  border: 'none', borderBottom: '1px solid var(--border)', padding: '7px 0',
  outline: 'none', width: '100%',
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Agentes() {
  const { authed, checking } = useAdminAuth()
  const [agentes, setAgentes] = useState<Agente[]>([])
  const [guardado, avisarGuardado] = useGuardado()
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; editing: Agente | null }>({ open: false, editing: null })
  const [form, setForm] = useState<ModalForm>({ nombre: '', telefono: '', correo: '', activo: true })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('sdm_agentes').select('*').order('nombre')
    setAgentes((data as Agente[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) load() }, [authed])

  const openCreate = () => {
    setForm({ nombre: '', telefono: '', correo: '', activo: true })
    setModal({ open: true, editing: null })
  }

  const openEdit = (a: Agente) => {
    setForm({ nombre: a.nombre, telefono: a.telefono || '', correo: a.correo || '', activo: a.activo })
    setModal({ open: true, editing: a })
  }

  const closeModal = () => setModal({ open: false, editing: null })

  const save = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const payload = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      activo: form.activo,
    }
    if (modal.editing) {
      const { error } = await supabase.from('sdm_agentes').update(payload).eq('id', modal.editing.id)
      setSaving(false)
      if (avisarError('No se pudo guardar el agente', error)) return
    } else {
      const { error } = await supabase.from('sdm_agentes').insert([payload])
      setSaving(false)
      if (avisarError('No se pudo crear el agente', error)) return
    }
    avisarGuardado()
    closeModal()
    load()
  }

  const toggleActivo = async (a: Agente) => {
    const { error } = await supabase.from('sdm_agentes').update({ activo: !a.activo }).eq('id', a.id)
    if (avisarError('No se pudo cambiar el estado del agente', error)) return
    load()
  }

  const del = async (id: string) => {
    // Las fichas NO referencian al agente: copian asesor_nombre / _telefono /
    // _correo al crearse. Borrar un agente no las toca ni las deja huérfanas;
    // solo desaparece de la lista para elegir asesor.
    const nombre = agentes.find(a => a.id === id)?.nombre?.trim()
    if (!confirm(nombre
      ? `¿Eliminar a ${nombre}? Las fichas ya creadas conservan sus datos: solo deja de aparecer al elegir asesor.`
      : '¿Eliminar este agente? Las fichas ya creadas conservan sus datos.')) return
    setDeleting(id)
    const { error } = await supabase.from('sdm_agentes').delete().eq('id', id)
    setDeleting(null)
    if (avisarError('No se pudo eliminar el agente', error)) return
    load()
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al admin
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>Agentes SDM Capital</span>
          <Guardado visible={guardado} />
        </div>
        <button className="text-sdm-sm tracking-sdm-wide" onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={15} /> Nuevo agente
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div className="text-sdm-base" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontStyle: 'italic' }}>Cargando agentes…</div>
        ) : agentes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="text-sdm-base" style={{ color: 'var(--muted)', marginBottom: 20 }}>Todavía no hay agentes. Crea el primero para asignarle fichas de cliente.</div>
            <button className="text-sdm-base" onClick={openCreate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '11px 24px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} /> Crear primer agente
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentes.map(a => (
              <div key={a.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 4, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Avatar */}
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: a.activo ? 'var(--navy-dark)' : '#c0cdd8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="text-sdm-lg" style={{ color: '#fff', fontWeight: 700 }}>{a.nombre.charAt(0).toUpperCase()}</span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                    <span className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>{a.nombre}</span>
                    <span className="text-sdm-xs" style={{ background: a.activo ? '#f0faf4' : 'var(--off)', color: a.activo ? '#1a6e3c' : 'var(--muted)', border: `1px solid ${a.activo ? '#b6e4ca' : 'var(--border)'}`, borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="text-sdm-sm" style={{ color: 'var(--muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {a.telefono && <span>{a.telefono}</span>}
                    {a.correo && <span>{a.correo}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button className="text-sdm-sm" onClick={() => toggleActivo(a)}
                    style={{ padding: '5px 12px', background: 'var(--off)', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer', color: 'var(--navy-dark)', fontFamily: 'inherit' }}>
                    {a.activo ? 'Pausar' : 'Activar'}
                  </button>
                  <button onClick={() => openEdit(a)} title="Editar"
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer', color: 'var(--navy-dark)', padding: '5px 8px', display: 'flex', alignItems: 'center', fontFamily: 'inherit' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => del(a.id)} disabled={deleting === a.id} title="Eliminar"
                    style={{ background: 'none', border: 'none', cursor: deleting === a.id ? 'not-allowed' : 'pointer', color: '#e24b4a', padding: 6, display: 'flex', alignItems: 'center', opacity: deleting === a.id ? 0.5 : 1 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear / editar */}
      {modal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,34,64,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: '#fff', borderRadius: 6, padding: '32px 36px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h2 className="text-sdm-xl" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 28, fontFamily: 'inherit' }}>
              {modal.editing ? 'Editar agente' : 'Nuevo agente'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FLabel label="Nombre *">
                <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inp} placeholder="Nombre completo" onKeyDown={e => e.key === 'Enter' && save()} />
              </FLabel>
              <FLabel label="Teléfono">
                <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inp} placeholder="+56 9 1234 5678" />
              </FLabel>
              <FLabel label="Correo">
                <input type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} style={inp} placeholder="agente@sdmcapital.cl" />
              </FLabel>
              <label className="text-sdm-base" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--navy-dark)' }}>
                <input type="checkbox" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  style={{ accentColor: 'var(--green-dark)', width: 15, height: 15 }} />
                Agente activo (aparece en el selector de fichas)
              </label>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button className="text-sdm-base" onClick={save} disabled={saving || !form.nombre.trim()}
                style={{ flex: 1, background: saving || !form.nombre.trim() ? '#a0b4c4' : 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '11px 0', fontWeight: 600, cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Guardando…' : modal.editing ? 'Guardar cambios' : 'Crear agente'}
              </button>
              <button className="text-sdm-base" onClick={closeModal}
                style={{ padding: '11px 20px', background: 'var(--off)', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', color: 'var(--muted)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
