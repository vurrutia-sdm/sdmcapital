import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  TarjetaFrente, TarjetaReverso,
  EMPTY_TARJETA, TARJETA_DEFAULTS,
  type Tarjeta, type TarjetaDraft,
} from './TarjetaCard'
import './tarjeta.css'

// `imprimir` arrastra jsPDF y html-to-image, que rollup agrupa en el mismo chunk
// que @react-pdf. Se carga al pulsar Imprimir, no al abrir el panel.
const imprimirTarjeta = async (tarjeta: Parameters<
  Awaited<typeof import('./imprimir')>['imprimirTarjeta']
>[0]) => (await import('./imprimir')).imprimirTarjeta(tarjeta)

// ─── Pequeñas piezas UI (mismo patrón que CotizacionesAdmin) ──────────────────
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Inp({
  value, onChange, type = 'text', placeholder = '',
}: {
  value: string | number | undefined
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      className="input-line"
      onChange={e => onChange(e.target.value)}
    />
  )
}

// ─── Vista previa (frente + reverso) ──────────────────────────────────────────
function PreviewPair({ tarjeta }: { tarjeta: TarjetaDraft }) {
  return (
    <div className="flex flex-col gap-6 items-center">
      <TarjetaFrente tarjeta={tarjeta} />
      <TarjetaReverso />
    </div>
  )
}

// ─── Miniatura para el listado ────────────────────────────────────────────────
const MINI_SCALE = 0.35
function Miniatura({ tarjeta }: { tarjeta: Tarjeta }) {
  return (
    <div style={{ width: 400 * MINI_SCALE, height: 222.2 * MINI_SCALE, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ transform: `scale(${MINI_SCALE})`, transformOrigin: 'top left', width: 400, height: 222.2 }}>
        <TarjetaFrente tarjeta={tarjeta} />
      </div>
    </div>
  )
}

// ─── Formulario de alta/edición ───────────────────────────────────────────────
function TarjetaForm({
  draft, setDraft, onSave, onCancel, saving, isNew,
}: {
  draft: TarjetaDraft
  setDraft: React.Dispatch<React.SetStateAction<TarjetaDraft | null>>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  isNew: boolean
}) {
  const upd = (patch: Partial<TarjetaDraft>) => setDraft(d => d ? { ...d, ...patch } : d)

  return (
    <div>
      <h2 className="font-serif font-light mb-6" style={{ fontSize: 28, color: 'var(--navy-dark)' }}>
        {isNew ? 'Nueva tarjeta' : 'Editar tarjeta'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Formulario */}
        <div className="bg-white p-6" style={{ border: '1px solid var(--border)', borderRadius: 2 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Fld label="Nombre completo">
              <Inp value={draft.nombre} onChange={v => upd({ nombre: v })} placeholder="Nombre Apellido" />
            </Fld>
            <Fld label="Cargo">
              <Inp value={draft.cargo ?? ''} onChange={v => upd({ cargo: v })} placeholder="Asesor Comercial" />
            </Fld>
            <Fld label="Teléfono">
              <Inp value={draft.telefono ?? ''} onChange={v => upd({ telefono: v })} placeholder="(56) 9 0000 0000" />
            </Fld>
            <Fld label="Email">
              <Inp type="email" value={draft.email ?? ''} onChange={v => upd({ email: v })} placeholder="nombre@sdmcapital.cl" />
            </Fld>
            <Fld label="Dirección">
              <Inp value={draft.direccion ?? ''} onChange={v => upd({ direccion: v })} placeholder={TARJETA_DEFAULTS.direccion} />
            </Fld>
            <Fld label="Web">
              <Inp value={draft.web ?? ''} onChange={v => upd({ web: v })} placeholder={TARJETA_DEFAULTS.web} />
            </Fld>
            <Fld label="Orden">
              <Inp type="number" value={draft.orden ?? 0} onChange={v => upd({ orden: Number(v) })} />
            </Fld>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={onSave} disabled={saving} className="btn-green">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={onCancel} className="btn-primary" style={{ background: 'var(--muted)' }}>
              Cancelar
            </button>
            <button onClick={() => imprimirTarjeta(draft)} className="btn-primary">
              🖨️ Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="flex flex-col items-center gap-3">
          <p style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Vista previa (90 × 50 mm)
          </p>
          <PreviewPair tarjeta={draft} />
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────
export function TarjetasEquipo() {
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState<TarjetaDraft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [moving,   setMoving]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tarjetas_equipo')
      .select('*')
      .order('orden', { ascending: true })
    setTarjetas((data ?? []) as Tarjeta[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    const maxOrden = tarjetas.reduce((m, t) => Math.max(m, t.orden ?? 0), 0)
    setEditingId(null)
    setEditing({ ...EMPTY_TARJETA, orden: maxOrden + 1 })
  }

  const openEdit = (t: Tarjeta) => {
    setEditingId(t.id)
    setEditing({
      nombre: t.nombre,
      cargo: t.cargo,
      telefono: t.telefono,
      email: t.email,
      direccion: t.direccion,
      web: t.web,
      orden: t.orden,
    })
  }

  const cancel = () => {
    setEditing(null)
    setEditingId(null)
  }

  const save = async () => {
    if (!editing || !editing.nombre?.trim()) {
      alert('El nombre es obligatorio.')
      return
    }
    setSaving(true)
    const payload = {
      nombre:    editing.nombre.trim(),
      cargo:     editing.cargo?.trim()     || null,
      telefono:  editing.telefono?.trim()  || null,
      email:     editing.email?.trim()     || null,
      direccion: editing.direccion?.trim() || TARJETA_DEFAULTS.direccion,
      web:       editing.web?.trim()       || TARJETA_DEFAULTS.web,
      orden:     editing.orden ?? 0,
    }

    if (editingId) {
      await supabase.from('tarjetas_equipo').update(payload).eq('id', editingId)
    } else {
      await supabase.from('tarjetas_equipo').insert(payload)
    }
    await load()
    setSaving(false)
    cancel()
  }

  const del = async (id: string) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return
    setDeleting(id)
    await supabase.from('tarjetas_equipo').delete().eq('id', id)
    await load()
    setDeleting(null)
  }

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= tarjetas.length) return
    const a = tarjetas[idx]
    const b = tarjetas[target]
    setMoving(a.id)
    await Promise.all([
      supabase.from('tarjetas_equipo').update({ orden: b.orden }).eq('id', a.id),
      supabase.from('tarjetas_equipo').update({ orden: a.orden }).eq('id', b.id),
    ])
    await load()
    setMoving(null)
  }

  // ── Vista formulario ────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <TarjetaForm
        draft={editing}
        setDraft={setEditing}
        onSave={save}
        onCancel={cancel}
        saving={saving}
        isNew={!editingId}
      />
    )
  }

  // ── Vista listado ────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-serif font-light" style={{ fontSize: 28, color: 'var(--navy-dark)' }}>
            Tarjetas de Presentación
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {tarjetas.length} integrante{tarjetas.length !== 1 ? 's' : ''} del equipo
          </p>
        </div>
        <button onClick={openCreate} className="btn-green">
          + Nueva tarjeta
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Cargando…</div>
      ) : tarjetas.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
          No hay tarjetas todavía. Crea la primera.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tarjetas.map((t, i) => (
            <div
              key={t.id}
              className="bg-white flex items-center gap-5 p-4"
              style={{ border: '1px solid var(--border)', borderRadius: 2 }}
            >
              <Miniatura tarjeta={t} />

              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "'Lora', serif", fontWeight: 600, fontSize: 16, color: 'var(--navy-dark)' }}>
                  {t.nombre}
                </div>
                {t.cargo && (
                  <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginTop: 2 }}>
                    {t.cargo}
                  </div>
                )}
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {[t.telefono, t.email].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>

              {/* Reordenar */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || moving === t.id}
                  title="Subir"
                  style={{ fontSize: 13, background: 'none', border: '1px solid var(--border)', borderRadius: 2, cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? 'var(--border)' : 'var(--navy-dark)', padding: '2px 8px' }}
                >▲</button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === tarjetas.length - 1 || moving === t.id}
                  title="Bajar"
                  style={{ fontSize: 13, background: 'none', border: '1px solid var(--border)', borderRadius: 2, cursor: i === tarjetas.length - 1 ? 'default' : 'pointer', color: i === tarjetas.length - 1 ? 'var(--border)' : 'var(--navy-dark)', padding: '2px 8px' }}
                >▼</button>
              </div>

              {/* Acciones */}
              <div className="flex flex-col items-end gap-2" style={{ flexShrink: 0 }}>
                <button onClick={() => imprimirTarjeta(t)} className="btn-primary" style={{ padding: '8px 14px', fontSize: 11 }}>
                  🖨️ Imprimir / PDF
                </button>
                <div className="flex gap-3">
                  <button onClick={() => openEdit(t)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
                    Editar
                  </button>
                  <button onClick={() => del(t.id)} disabled={deleting === t.id} style={{ fontSize: 12, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
                    {deleting === t.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
