import { Plus, Printer } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { Guardado, useGuardado } from '@/components/admin/acciones'
import { Field } from '@/components/admin/campos'
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
      <h2 className="font-serif font-light mb-6 text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
        {isNew ? 'Nueva tarjeta' : 'Editar tarjeta'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Formulario */}
        <div className="bg-white p-6" style={{ border: '1px solid var(--border)', borderRadius: 2 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Nombre completo">
              <Inp value={draft.nombre} onChange={v => upd({ nombre: v })} placeholder="Nombre Apellido" />
            </Field>
            <Field label="Cargo">
              <Inp value={draft.cargo ?? ''} onChange={v => upd({ cargo: v })} placeholder="Asesor Comercial" />
            </Field>
            <Field label="Teléfono">
              <Inp value={draft.telefono ?? ''} onChange={v => upd({ telefono: v })} placeholder="(56) 9 0000 0000" />
            </Field>
            <Field label="Email">
              <Inp type="email" value={draft.email ?? ''} onChange={v => upd({ email: v })} placeholder="nombre@sdmcapital.cl" />
            </Field>
            <Field label="Dirección">
              <Inp value={draft.direccion ?? ''} onChange={v => upd({ direccion: v })} placeholder={TARJETA_DEFAULTS.direccion} />
            </Field>
            <Field label="Web">
              <Inp value={draft.web ?? ''} onChange={v => upd({ web: v })} placeholder={TARJETA_DEFAULTS.web} />
            </Field>
            <Field label="Orden">
              <Inp type="number" value={draft.orden ?? 0} onChange={v => upd({ orden: Number(v) })} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={onSave} disabled={saving} className="btn-green">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button onClick={onCancel} className="btn-primary" style={{ background: 'var(--muted)' }}>
              Cancelar
            </button>
            <button onClick={() => imprimirTarjeta(draft)} className="btn-primary">
              <Printer aria-hidden="true" size={14} strokeWidth={2} /> Imprimir / Guardar PDF
            </button>
          </div>
        </div>

        {/* Vista previa */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)' }}>
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
  const [guardado, avisarGuardado] = useGuardado()
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState<TarjetaDraft | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

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

    const { error } = editingId
      ? await supabase.from('tarjetas_equipo').update(payload).eq('id', editingId)
      : await supabase.from('tarjetas_equipo').insert(payload)

    setSaving(false)
    // No se llama a cancel(): si falló, el formulario sigue con lo escrito.
    if (avisarError('No se pudo guardar la tarjeta', error)) return

    avisarGuardado()
    await load()
    cancel()
  }

  const del = async (id: string) => {
    const nombre = tarjetas.find(t => t.id === id)?.nombre?.trim()
    if (!confirm(nombre ? `¿Eliminar la tarjeta de ${nombre}?` : '¿Eliminar esta tarjeta?')) return
    setDeleting(id)
    const { error } = await supabase.from('tarjetas_equipo').delete().eq('id', id)
    setDeleting(null)
    if (avisarError('No se pudo eliminar la tarjeta', error)) return
    await load()
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
          <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
            Tarjetas de Presentación
          </h2>
          <p className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 4 }}>
            {tarjetas.length} integrante{tarjetas.length !== 1 ? 's' : ''} del equipo
          </p>
          <div style={{ marginTop: 6 }}><Guardado visible={guardado} /></div>
        </div>
        <button onClick={openCreate} className="btn-green">
          <Plus aria-hidden="true" size={15} strokeWidth={2} /> Nueva tarjeta
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Cargando…</div>
      ) : tarjetas.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
          Todavía no hay tarjetas. Crea la primera.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tarjetas.map((t, i) => (
            <div
              key={t.id}
              className="bg-white flex flex-wrap items-center gap-x-3 gap-y-2 p-3 lg:flex-nowrap lg:gap-5 lg:p-4"
              style={{ border: '1px solid var(--border)', borderRadius: 2 }}
            >
              <div className="order-1 lg:order-none"><Miniatura tarjeta={t} /></div>

              <div className="order-3 w-full min-w-0 lg:order-none lg:w-auto lg:flex-1">
                <div className="text-sdm-lg" style={{ fontFamily: "'Lora', serif", fontWeight: 600, color: 'var(--navy-dark)' }}>
                  {t.nombre}
                </div>
                {t.cargo && (
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--green)', marginTop: 2 }}>
                    {t.cargo}
                  </div>
                )}
                <div className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 4 }}>
                  {[t.telefono, t.email].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>


              {/* Acciones. Debajo de lg: fila propia con borde superior, con
                  Imprimir / PDF junto a Editar y Eliminar en vez de flotando
                  encima del texto. 44px de alto tactil y 24px entre botones. */}
              <div className="order-4 w-full flex items-center justify-end gap-6 mt-1 pt-2 border-t border-[#e8edf2] lg:order-none lg:w-auto lg:flex-col lg:items-end lg:gap-2 lg:mt-0 lg:pt-0 lg:border-t-0" style={{ flexShrink: 0 }}>
                <button onClick={() => imprimirTarjeta(t)} className="btn-primary text-sdm-xs min-h-[44px] lg:min-h-0" style={{ padding: '8px 14px' }}>
                  <Printer aria-hidden="true" size={14} strokeWidth={2} /> Imprimir / PDF
                </button>
                <div className="flex items-center gap-6 lg:gap-3">
                  <button className="text-sdm-sm min-h-[44px] lg:min-h-0" onClick={() => openEdit(t)} style={{ color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>
                    Editar
                  </button>
                  <button className="text-sdm-sm min-h-[44px] lg:min-h-0" onClick={() => del(t.id)} disabled={deleting === t.id} style={{ color: 'var(--error)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>
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
