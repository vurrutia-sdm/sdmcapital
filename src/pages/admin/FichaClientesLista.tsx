import { useState, useEffect, useId, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDialogoModal } from '@/hooks/useDialogoModal'
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
  ficha_propiedades: { id: string }[]
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 'var(--sdm-text-base)', color: 'var(--navy-dark)', background: '#fff',
  border: 'none', borderBottom: '1px solid var(--border)', padding: '7px 0', width: '100%',
}

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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FichaClientesLista() {
  // Diálogo modal: Escape, foco atrapado mientras está abierto y foco
  // devuelto al disparador al cerrar. Ver la nota del hook sobre por qué
  // atrapar mal es peor que no atrapar.
  const cajaModal = useRef<HTMLDivElement>(null)
  const tituloModalId = useId()
  const { authed, checking } = useAdminAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '', correo: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [guardado, avisarGuardado] = useGuardado()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('ficha_clientes')
      .select('*, ficha_propiedades(id)')
      .order('created_at', { ascending: false })
    setClientes((data as Cliente[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) load() }, [authed])

  const openModal = () => { setForm({ nombre: '', telefono: '', correo: '' }); setShowModal(true) }

  const saveCliente = async () => {
    if (!form.nombre.trim()) return
    setSaving(true)
    const { error } = await supabase.from('ficha_clientes').insert([{
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
    }])
    setSaving(false)
    if (avisarError('No se pudo guardar el cliente', error)) return
    avisarGuardado()
    setShowModal(false)
    load()
  }

  const deleteCliente = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este cliente y todas sus fichas? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    const { error } = await supabase.from('ficha_clientes').delete().eq('id', id)
    setDeleting(null)
    if (avisarError('No se pudo eliminar el cliente', error)) return
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

  const cerrarModal = useCallback(() => setShowModal(false), [])
  useDialogoModal(showModal, cajaModal, cerrarModal)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--off)', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al admin
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>Fichas para clientes</span>
          <Guardado visible={guardado} />
        </div>
        <button className="text-sdm-sm tracking-sdm-wide" onClick={openModal}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={15} /> Nuevo cliente
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div className="text-sdm-base" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontStyle: 'italic' }}>Cargando clientes…</div>
        ) : clientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="text-sdm-base" style={{ color: 'var(--muted)', marginBottom: 20 }}>Todavía no hay clientes. Crea el primero para armarle una ficha.</div>
            <button className="text-sdm-base" onClick={openModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '11px 24px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={15} /> Crear primer cliente
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clientes.map(c => {
              const fichaCount = c.ficha_propiedades.length
              const isDel = deleting === c.id
              return (
                // La tarjeta NO se envuelve en <Link>: contiene el botón de
                // eliminar, y un botón dentro de un enlace es inválido. El
                // enlace es el nombre, y se estira sobre la tarjeta con
                // `enlace-tarjeta` (globals.css), que le pone un ::after
                // absoluto. Con ratón se sigue pulsando entera; en el orden de
                // tabulación aparece un solo destino, el nombre, y el botón de
                // eliminar queda por encima gracias a su z-index.
                <div key={c.id}
                  className="border border-[var(--border)] hover:border-[var(--green-dark)] hover:shadow-[0_2px_8px_rgba(77,184,112,0.1)]"
                  style={{ background: '#fff', borderRadius: 4, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative' }}
                >
                  {/* Avatar inicial */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--navy-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="text-sdm-lg" style={{ color: '#fff', fontWeight: 700 }}>{c.nombre.charAt(0).toUpperCase()}</span>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 3 }}>
                      <Link to={`/admin/ficha-cliente/${c.id}`} className="enlace-tarjeta" style={{ color: 'inherit', textDecoration: 'none' }}>{c.nombre}</Link>
                    </div>
                    <div className="text-sdm-sm" style={{ color: 'var(--muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {c.telefono && <span>{c.telefono}</span>}
                      {c.correo && <span>{c.correo}</span>}
                      <span>{new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span className="text-sdm-sm" style={{ background: fichaCount > 0 ? '#f0faf4' : 'var(--off)', color: fichaCount > 0 ? '#1a6e3c' : 'var(--muted)', border: `1px solid ${fichaCount > 0 ? '#b6e4ca' : 'var(--border)'}`, borderRadius: 20, padding: '3px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {fichaCount} {fichaCount === 1 ? 'ficha' : 'fichas'}
                    </span>
                    <button onClick={e => deleteCliente(e, c.id)} disabled={isDel}
                      title="Eliminar cliente"
                      style={{ position: 'relative', zIndex: 2, background: 'none', border: 'none', cursor: isDel ? 'not-allowed' : 'pointer', color: 'var(--error)', padding: 4, display: 'flex', alignItems: 'center', opacity: isDel ? 0.5 : 1, flexShrink: 0 }}>
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight size={16} style={{ color: '#c0cdd8', flexShrink: 0 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(13,34,64,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          role="dialog" aria-modal="true" aria-labelledby={tituloModalId}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div ref={cajaModal} tabIndex={-1} style={{ background: '#fff', borderRadius: 6, padding: '32px 36px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <h2 id={tituloModalId} className="text-sdm-xl" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 28, fontFamily: 'inherit' }}>Nuevo cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <FLabel label="Nombre *">
                <input autoFocus value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} style={inp} placeholder="Nombre completo" onKeyDown={e => e.key === 'Enter' && saveCliente()} />
              </FLabel>
              <FLabel label="Teléfono">
                <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} style={inp} placeholder="+56 9 1234 5678" />
              </FLabel>
              <FLabel label="Correo">
                <input type="email" value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} style={inp} placeholder="cliente@email.com" />
              </FLabel>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              <button className="text-sdm-base" onClick={saveCliente} disabled={saving || !form.nombre.trim()}
                style={{ flex: 1, background: saving || !form.nombre.trim() ? '#a0b4c4' : 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '11px 0', fontWeight: 600, cursor: saving || !form.nombre.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Guardando…' : 'Crear cliente'}
              </button>
              <button className="text-sdm-base" onClick={() => setShowModal(false)}
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
