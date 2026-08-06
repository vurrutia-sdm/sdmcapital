// Pestaña "Asociados" del admin — CRUD de asociados.
//
// Extraída de AdminPage.tsx sin cambios: mismo markup, mismos estilos, mismas
// queries. La clave de pestaña sigue siendo 'asociados' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import type { Asociado } from '@/types'
import { Field, Inp, Txa, Chk } from '@/components/admin/campos'
import { SaveBtn } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { useDragSort } from '@/pages/AdminPage'

export default function Asociados() {
  const [items, setItems]     = useState<Asociado[]>([])
  const [editing, setEditing] = useState<Partial<Asociado> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('asociados').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
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
    setEditing(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este asociado?')) return
    const { error } = await supabase.from('asociados').delete().eq('id', id)
    if (avisarError('No se pudo eliminar el asociado', error)) return
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Asociados / Socios Comerciales</h2>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', logo: '', url: '', orden: items.length + 1, activo: true })}>+ Nuevo asociado</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>🖱 Arrastra las tarjetas para cambiar el orden.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar asociado' : 'Nuevo asociado'}</h3>
          <div className="mb-6 p-6 rounded-sm" style={{ background: 'var(--off)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16 }}>🏢 Logo de la empresa</div>
            <div className="flex items-center gap-6">
              {editing.logo
                ? <img src={editing.logo} alt="Logo" style={{ height: 56, objectFit: 'contain', border: '1px solid var(--border)', padding: 8, borderRadius: 4, background: '#fff', maxWidth: 160 }} />
                : <div style={{ width: 120, height: 56, border: '2px dashed var(--border)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--muted)' }}>Sin logo</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.logo} folder="asociados" onUploaded={url => setEditing(p => ({ ...p, logo: url }))} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>PNG con fondo transparente para mejor resultado.</p>
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
          <div key={a.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab flex flex-col items-center text-center">
            <span style={{ color: 'var(--muted)', fontSize: 18, marginBottom: 8, display: 'block' }}>⠿</span>
            {a.logo
              ? <img src={a.logo} alt={a.nombre} style={{ height: 44, objectFit: 'contain', maxWidth: '100%', marginBottom: 10 }} />
              : <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy-dark)' }}>{a.nombre}</span></div>
            }
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 4 }}>{a.nombre}</div>
            <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--sky)', textDecoration: 'none', marginBottom: 10 }} className="truncate w-full">{a.url}</a>
            <div className="flex gap-3 border-t pt-3 w-full justify-center" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditing(a)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button onClick={() => del(a.id)} style={{ fontSize: 12, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="col-span-4 py-12 text-center" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin asociados. Crea el primero.</div>}
      </div>
    </div>
  )
}
