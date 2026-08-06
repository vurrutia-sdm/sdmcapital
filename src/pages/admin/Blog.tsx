// Pestaña "Blog" del admin — CRUD de blog_posts.
//
// Extraída de AdminPage.tsx sin cambios: mismo markup, mismos estilos, mismas
// queries. La clave de pestaña sigue siendo 'blog' — el orden de las pestañas se
// persiste en localStorage y renombrarla borraría esa preferencia.

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import type { BlogPost } from '@/types'
import { Field, Inp, Txa, Chk } from '@/components/admin/campos'
import { SaveBtn, Badge } from '@/components/admin/acciones'
import { ImageUploader } from '@/components/admin/ImageUploader'
import { RichTextEditor } from '@/components/admin/RichTextEditor'

export default function Blog() {
  const [posts, setPosts]     = useState<BlogPost[]>([])
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = () => supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).then(({ data }) => setPosts(data || []))
  useEffect(() => { load() }, [])

  const del = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (avisarError('No se pudo eliminar el artículo', error)) return
    load()
  }

  const makeSlug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const save = async () => {
    if (!editing) return
    setSaving(true)
    const { error } = editing.id
      ? await supabase.from('blog_posts').update(editing).eq('id', editing.id)
      : await supabase.from('blog_posts').insert([{ ...editing, publicado: editing.publicado || false, destacado: editing.destacado || false }])
    setSaving(false)
    if (avisarError('No se pudo guardar el artículo', error)) return
    setEditing(null); load()
  }

  return (
    <div>
      <div className="flex flex-col items-start gap-3 mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>Blog</h2>
        <button className="btn-green" onClick={() => setEditing({ titulo: '', slug: '', resumen: '', contenido: '', autor_nombre: 'Equipo SDM Capital', categoria: 'Mercado', publicado: false, destacado: false })}>+ Nuevo artículo</button>
      </div>

      {editing && (
        <div className="bg-white border border-[#e8edf2] p-8 mb-10 rounded-sm">
          <h3 className="font-serif font-light mb-6 text-sdm-2xl" style={{ color: 'var(--navy-dark)' }}>{editing.id ? 'Editar artículo' : 'Nuevo artículo'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Field label="Título"><Inp value={editing.titulo || ''} onChange={v => setEditing(p => ({ ...p, titulo: v, slug: p?.id ? p.slug : makeSlug(v) }))} /></Field>
            <Field label="Slug (URL)"><Inp value={editing.slug || ''} onChange={v => setEditing(p => ({ ...p, slug: v }))} /></Field>
            <Field label="Categoría"><Inp value={editing.categoria || ''} onChange={v => setEditing(p => ({ ...p, categoria: v }))} /></Field>
            <Field label="Autor"><Inp value={editing.autor_nombre || ''} onChange={v => setEditing(p => ({ ...p, autor_nombre: v }))} /></Field>
          </div>
          <div className="mb-6">
            <Field label="Imagen de portada">
              <ImageUploader currentUrl={editing.imagen_portada} folder="blog"
                onUploaded={url => setEditing(p => ({ ...p, imagen_portada: url }))} />
            </Field>
          </div>
          <div className="mb-4">
            <Field label="Resumen"><Txa rows={2} value={editing.resumen || ''} onChange={v => setEditing(p => ({ ...p, resumen: v }))} /></Field>
          </div>

          {/* ─── RICH TEXT EDITOR ─── */}
          <div className="mb-6">
            <Field label="Contenido completo">
              <RichTextEditor
                value={editing.contenido || ''}
                onChange={v => setEditing(p => ({ ...p, contenido: v }))}
              />
            </Field>
          </div>

          <div className="flex gap-6 mt-4 mb-6">
            <Chk label="Publicado" checked={!!editing.publicado} onChange={v => setEditing(p => ({ ...p, publicado: v }))} />
            <Chk label="Destacado" checked={!!editing.destacado} onChange={v => setEditing(p => ({ ...p, destacado: v }))} />
          </div>
          <div className="flex gap-3">
            <SaveBtn onClick={save} loading={saving} />
            <button onClick={() => setEditing(null)} className="btn-primary" style={{ background: 'var(--muted)' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Título','Categoría','Autor','Estado','Acciones'].map(h => <th key={h} className="text-left pb-3 pr-6 text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 400 }}>{h}</th>)}</tr></thead>
          <tbody>
            {posts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td className="py-4 pr-6"><div className="text-sdm-base" style={{ fontWeight: 500 }}>{p.titulo}</div><div className="text-sdm-sm" style={{ color: 'var(--muted)' }}>{p.slug}</div></td>
                <td className="py-4 pr-6 text-sdm-sm" style={{ color: 'var(--muted)' }}>{p.categoria}</td>
                <td className="py-4 pr-6 text-sdm-sm" style={{ color: 'var(--muted)' }}>{p.autor_nombre}</td>
                <td className="py-4 pr-6"><Badge label={p.publicado ? 'Publicado' : 'Borrador'} color={p.publicado ? 'var(--green)' : 'var(--muted)'} /></td>
                <td className="py-4"><div className="flex gap-3"><button className="text-sdm-sm" onClick={() => setEditing(p)} style={{ color: 'var(--navy)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit', fontWeight: 500 }}>Editar</button><button className="text-sdm-sm" onClick={() => del(p.id)} style={{ color: '#E24B4A', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'inherit' }}>Eliminar</button></div></td>
              </tr>
            ))}
            {posts.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-sdm-base" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>No hay artículos aún.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
