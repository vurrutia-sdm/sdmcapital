// Pestaña "Asociados" del admin — CRUD de asociados.
//
// Extraída de AdminPage.tsx sin cambios de comportamiento: mismos estilos,
// mismas queries. Los emojis pasaron a iconos de lucide-react más tarde. La clave de pestaña sigue siendo 'asociados' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Building2, GripVertical, MousePointer2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import type { Asociado } from '@/types'
import { Field, Inp, Txa, Chk } from '@/components/admin/campos'
import { SaveBtn, Guardado, useGuardado } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { useDragSort } from '@/components/admin/useDragSort'

export default function Asociados() {
  const [items, setItems]     = useState<Asociado[]>([])
  const [guardado, avisarGuardado] = useGuardado()
  const [editing, setEditing] = useState<Partial<Asociado> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('asociados').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, arrastrando, filaProps, manijaProps } = useDragSort(items, async (reordered) => {
    const fallo = (await Promise.all(reordered.map((a, i) => supabase.from('asociados').update({ orden: i + 1 }).eq('id', a.id)))).find(r => r.error)
    avisarError('No se pudo guardar el nuevo orden de los asociados', fallo?.error ?? null)
    load()
  })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const { error } = editing.id
      ? await supabase.from('asociados').update(editing).eq('id', editing.id)
      : await supabase.from('asociados').insert([{ ...editing, activo: editing.activo !== false, logo: editing.logo || '', orden: items.length + 1 }])
    setSaving(false)
    if (avisarError('No se pudo guardar el asociado', error)) return
    avisarGuardado()
    setEditing(null); load()
  }

  const del = async (id: string) => {
    const nombre = items.find(a => a.id === id)?.nombre?.trim()
    if (!confirm(nombre
      ? `¿Eliminar a ${nombre}? Deja de aparecer en la página de asociados.`
      : '¿Eliminar este asociado? Deja de aparecer en la página de asociados.')) return
    const { error } = await supabase.from('asociados').delete().eq('id', id)
    if (avisarError('No se pudo eliminar el asociado', error)) return
    load()
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <div className="flex items-center gap-4"><h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>Asociados / Socios Comerciales</h2><Guardado visible={guardado} /></div>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', logo: '', url: '', orden: items.length + 1, activo: true })}><Plus aria-hidden="true" size={15} strokeWidth={2} /> Nuevo asociado</button>
      </div>
      <p className="text-sdm-base" style={{ color: 'var(--muted)', marginBottom: 24 }}><MousePointer2 size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-0.2em' }} /> Arrastra las tarjetas para cambiar el orden.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6 text-sdm-2xl" style={{ color: 'var(--navy-dark)' }}>{editing.id ? 'Editar asociado' : 'Nuevo asociado'}</h3>
          <div className="mb-6 p-6 rounded-sm bg-[var(--off)]" style={{ border: '1px solid var(--border)' }}>
            <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} strokeWidth={2} />Logo de la empresa</div>
            <div className="flex items-center gap-6">
              {editing.logo
                ? <img src={editing.logo} alt="Logo" style={{ height: 56, objectFit: 'contain', border: '1px solid var(--border)', padding: 8, borderRadius: 4, background: '#fff', maxWidth: 160 }} />
                : <div className="text-sdm-sm" style={{ width: 120, height: 56, border: '2px dashed var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Sin logo</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.logo} folder="asociados" onUploaded={url => setEditing(p => ({ ...p, logo: url }))} />
                <p className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 8 }}>PNG con fondo transparente para mejor resultado.</p>
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
          <div key={a.id} {...filaProps(i)}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab flex flex-col items-center text-center"
            style={{ opacity: arrastrando === i ? 0.45 : 1 }}>
            <span {...manijaProps} className="flex items-center" style={{ ...manijaProps.style, padding: 10, margin: '-10px -10px -2px' }}>
              <GripVertical size={16} strokeWidth={2} style={{ color: 'var(--muted)' }} />
            </span>
            {a.logo
              ? <img src={a.logo} alt={a.nombre} style={{ height: 44, objectFit: 'contain', maxWidth: '100%', marginBottom: 10 }} />
              : <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><span className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>{a.nombre}</span></div>
            }
            <div className="text-sdm-sm" style={{ fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 4 }}>{a.nombre}</div>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sky)', textDecoration: 'none', marginBottom: 10 }} className="truncate w-full text-sdm-sm">{a.url}</a>
            <div className="flex gap-3 border-t pt-3 w-full justify-center" style={{ borderColor: 'var(--border)' }}>
              <button className="text-sdm-sm" onClick={() => setEditing(a)} style={{ color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button className="text-sdm-sm" onClick={() => del(a.id)} style={{ color: 'var(--error)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="col-span-4 py-12 text-center text-sdm-base" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin asociados. Crea el primero.</div>}
      </div>
    </div>
  )
}
