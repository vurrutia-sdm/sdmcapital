// Pestaña "Equipo" del admin — CRUD de equipo.
//
// Extraída de AdminPage.tsx sin cambios de comportamiento: mismos estilos,
// mismas queries. Los emojis pasaron a iconos de lucide-react más tarde. La clave de pestaña sigue siendo 'equipo' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Camera, GripVertical, MousePointer2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import type { MiembroEquipo } from '@/types'
import { Field, Inp, Txa, Chk } from '@/components/admin/campos'
import { SaveBtn, Badge } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { useDragSort } from '@/components/admin/useDragSort'

export default function Equipo() {
  const [items, setItems]     = useState<MiembroEquipo[]>([])
  const [editing, setEditing] = useState<Partial<MiembroEquipo> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('equipo').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, onDragStart, onDragEnter, onDragEnd } = useDragSort(items, async (reordered) => {
    const fallo = (await Promise.all(reordered.map((m, i) => supabase.from('equipo').update({ orden: i + 1 }).eq('id', m.id)))).find(r => r.error)
    avisarError('No se pudo guardar el nuevo orden del equipo', fallo?.error ?? null)
    load()
  })

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const { error } = editing.id
      ? await supabase.from('equipo').update(editing).eq('id', editing.id)
      : await supabase.from('equipo').insert([{ ...editing, activo: editing.activo !== false, orden: items.length + 1 }])
    setSaving(false)
    if (avisarError('No se pudo guardar el miembro del equipo', error)) return
    setEditing(null); load()
  }

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este miembro?')) return
    const { error } = await supabase.from('equipo').delete().eq('id', id)
    if (avisarError('No se pudo eliminar el miembro del equipo', error)) return
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Equipo</h2>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', cargo: '', bio: '', orden: items.length + 1, activo: true })}>+ Nuevo miembro</button>
      </div>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}><MousePointer2 size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-0.2em' }} /> Arrastra las filas para cambiar el orden de aparición.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6" style={{ fontSize: 24, color: 'var(--navy-dark)' }}>{editing.id ? 'Editar miembro' : 'Nuevo miembro'}</h3>
          <div className="mb-6 p-6 rounded-sm" style={{ background: 'var(--off)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={14} strokeWidth={2} />Foto del miembro</div>
            <div className="flex items-center gap-6">
              {editing.foto
                ? <img src={editing.foto} alt="Foto" className="w-20 h-20 object-cover rounded-full" style={{ border: '3px solid var(--border)' }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif" style={{ background: 'var(--navy)', color: 'var(--sky)', fontSize: 24, border: '3px solid var(--border)' }}>{(editing.nombre || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.foto} folder="equipo" onUploaded={url => setEditing(p => ({ ...p, foto: url }))} />
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>Recomendado: foto cuadrada, mínimo 400×400px.</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Nombre completo"><Inp value={editing.nombre || ''} onChange={v => setEditing(p => ({ ...p, nombre: v }))} /></Field>
            <Field label="Cargo"><Inp value={editing.cargo || ''} onChange={v => setEditing(p => ({ ...p, cargo: v }))} placeholder="Ej: Director General" /></Field>
            <Field label="Email"><Inp type="email" value={editing.email || ''} onChange={v => setEditing(p => ({ ...p, email: v }))} /></Field>
            <Field label="Teléfono"><Inp value={editing.telefono || ''} onChange={v => setEditing(p => ({ ...p, telefono: v }))} /></Field>
            <Field label="LinkedIn URL"><Inp value={editing.linkedin || ''} onChange={v => setEditing(p => ({ ...p, linkedin: v }))} placeholder="https://linkedin.com/in/..." /></Field>
            <Field label="WhatsApp (solo números, sin +)"><Inp value={editing.whatsapp || ''} onChange={v => setEditing(p => ({ ...p, whatsapp: v }))} placeholder="56912345678" /></Field>
            <Field label="Orden"><Inp type="number" value={editing.orden || ''} onChange={v => setEditing(p => ({ ...p, orden: Number(v) }))} /></Field>
          </div>
          <Field label="Biografía"><Txa rows={4} value={editing.bio || ''} onChange={v => setEditing(p => ({ ...p, bio: v }))} /></Field>
          <div className="mt-4 mb-6"><Chk label="Activo (visible en el sitio)" checked={editing.activo !== false} onChange={v => setEditing(p => ({ ...p, activo: v }))} /></div>
          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((m, i) => (
          <div key={m.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)} onDragEnd={onDragEnd}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab" style={{ borderTop: '3px solid var(--green)' }}>
            <div className="flex items-center gap-4 mb-4">
              <GripVertical size={18} strokeWidth={2} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              {m.foto
                ? <img src={m.foto} alt={m.nombre} className="w-14 h-14 object-cover rounded-full" style={{ border: '2px solid var(--border)' }} />
                : <div className="w-14 h-14 rounded-full flex items-center justify-center font-serif flex-shrink-0" style={{ background: 'var(--navy)', color: 'var(--sky)', fontSize: 18 }}>{m.nombre.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              }
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)' }}>{m.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--green)', letterSpacing: '0.5px' }}>{m.cargo}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-2">{m.bio}</p>
            <div className="flex gap-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <button onClick={() => setEditing(m)} style={{ fontSize: 12, color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button onClick={() => del(m.id)} style={{ fontSize: 12, color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
              <Badge label={m.activo ? 'Activo' : 'Inactivo'} color={m.activo ? 'var(--green)' : 'var(--muted)'} />
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="py-12 text-center col-span-3" style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Sin miembros. Crea el primero.</div>}
      </div>
    </div>
  )
}
