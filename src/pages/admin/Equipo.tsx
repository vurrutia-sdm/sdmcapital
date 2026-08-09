// Pestaña "Equipo" del admin — CRUD de equipo.
//
// Extraída de AdminPage.tsx sin cambios de comportamiento: mismos estilos,
// mismas queries. Los emojis pasaron a iconos de lucide-react más tarde. La clave de pestaña sigue siendo 'equipo' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { Camera, GripVertical, MousePointer2, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import type { MiembroEquipo } from '@/types'
import { Field, Inp, Txa, Chk } from '@/components/admin/campos'
import { SaveBtn, Badge, Guardado, useGuardado } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { useDragSort } from '@/components/admin/useDragSort'

export default function Equipo() {
  const [items, setItems]     = useState<MiembroEquipo[]>([])
  const [guardado, avisarGuardado] = useGuardado()
  const [editing, setEditing] = useState<Partial<MiembroEquipo> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('equipo').select('*').order('orden').then(({ data }) => setItems(data || []))
  useEffect(() => { load() }, [])

  const { items: sorted, arrastrando, filaProps, manijaProps } = useDragSort(items, async (reordered) => {
    const fallo = (await Promise.all(reordered.map((m, i) => supabase.from('equipo').update({ orden: i + 1 }).eq('id', m.id)))).find(r => r.error)
    // CORTA ANTES DEL `load()`, igual que Propiedades y Asociados. Un PATCH por
    // fila no es una transacción: si falla a media lista, unas quedan con el
    // orden nuevo y otras con el viejo, y recargar pinta esa mezcla como si
    // fuera lo que se pidió, encima del aviso que acaba de decir que algo falló.
    // Sin recargar, la lista se queda como la dejó el arrastre y se puede
    // reintentar soltando otra vez.
    if (avisarError('No se pudo guardar el nuevo orden del equipo', fallo?.error ?? null)) return
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
    avisarGuardado()
    setEditing(null); load()
  }

  const del = async (id: string) => {
    const nombre = items.find(m => m.id === id)?.nombre?.trim()
    if (!confirm(nombre
      ? `¿Eliminar a ${nombre} del equipo? Deja de aparecer en Quiénes Somos.`
      : '¿Eliminar este miembro del equipo? Deja de aparecer en Quiénes Somos.')) return
    const { error } = await supabase.from('equipo').delete().eq('id', id)
    if (avisarError('No se pudo eliminar el miembro del equipo', error)) return
    load()
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-3 mb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <div className="flex items-center gap-4"><h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>Equipo</h2><Guardado visible={guardado} /></div>
        <button className="btn-green" onClick={() => setEditing({ nombre: '', cargo: '', bio: '', orden: items.length + 1, activo: true })}><Plus aria-hidden="true" size={15} strokeWidth={2} /> Nuevo miembro</button>
      </div>
      <p className="text-sdm-base" style={{ color: 'var(--muted)', marginBottom: 24 }}><MousePointer2 size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-0.2em' }} /> Arrastra las filas para cambiar el orden de aparición.</p>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6 text-sdm-2xl" style={{ color: 'var(--navy-dark)' }}>{editing.id ? 'Editar miembro' : 'Nuevo miembro'}</h3>
          <div className="mb-6 p-6 rounded-sm bg-[var(--off)]" style={{ border: '1px solid var(--border)' }}>
            <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 600, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Camera size={14} strokeWidth={2} />Foto del miembro</div>
            <div className="flex items-center gap-6">
              {editing.foto
                ? <img src={editing.foto} alt="Foto" className="w-20 h-20 object-cover rounded-full" style={{ border: '3px solid var(--border)' }} />
                : <div className="w-20 h-20 rounded-full flex items-center justify-center font-serif text-sdm-2xl" style={{ background: 'var(--navy)', color: 'var(--sky)', border: '3px solid var(--border)' }}>{(editing.nombre || '?').split(' ').map((n: string) => n[0]).join('').slice(0,2)}</div>
              }
              <div className="flex-1">
                <ImageUploader currentUrl={editing.foto} folder="equipo" onUploaded={url => setEditing(p => ({ ...p, foto: url }))} />
                <p className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 8 }}>Recomendado: foto cuadrada, mínimo 400×400px.</p>
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
          <div key={m.id} {...filaProps(i)}
            className="bg-white border border-[#e8edf2] rounded-sm p-5 cursor-grab" style={{ borderTop: '3px solid var(--green)', opacity: arrastrando === i ? 0.45 : 1 }}>
            <div className="flex items-center gap-4 mb-4">
              <span {...manijaProps} className="flex items-center" style={{ ...manijaProps.style, padding: 10, margin: -10, flexShrink: 0 }}>
                <GripVertical size={18} strokeWidth={2} style={{ color: 'var(--muted)' }} />
              </span>
              {m.foto
                ? <img src={m.foto} alt={m.nombre} className="w-14 h-14 object-cover rounded-full" style={{ border: '2px solid var(--border)' }} />
                : <div className="w-14 h-14 rounded-full flex items-center justify-center font-serif flex-shrink-0 text-sdm-xl" style={{ background: 'var(--navy)', color: 'var(--sky)' }}>{m.nombre.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              }
              <div>
                <div className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>{m.nombre}</div>
                <div className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--green)' }}>{m.cargo}</div>
              </div>
            </div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }} className="line-clamp-2 text-sdm-sm">{m.bio}</p>
            <div className="flex gap-3 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
              <button className="text-sdm-sm" onClick={() => setEditing(m)} style={{ color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button>
              <button className="text-sdm-sm" onClick={() => del(m.id)} style={{ color: 'var(--error)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button>
              <Badge label={m.activo ? 'Activo' : 'Inactivo'} color={m.activo ? 'var(--green)' : 'var(--muted)'} />
            </div>
          </div>
        ))}
        {sorted.length === 0 && <div className="py-12 text-center col-span-3 text-sdm-base" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Sin miembros. Crea el primero.</div>}
      </div>
    </div>
  )
}
