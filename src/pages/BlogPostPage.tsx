import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'
import type { BlogPost } from '@/types'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang } = useLang()
  const { get } = useContenido()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('publicado', true).single()
      .then(({ data }) => { setPost(data); setLoading(false) })
  }, [slug])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="font-serif italic text-sdm-xl" style={{ color: 'var(--muted)' }}>Cargando…</div>
    </div>
  )
  if (!post) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="font-serif italic text-sdm-2xl" style={{ color: 'var(--muted)' }}>Artículo no encontrado.</div>
      <Link to="/blog" className="btn-primary">← Volver al Blog</Link>
    </div>
  )

  const titulo    = lang === 'en' && post.titulo_en    ? post.titulo_en    : post.titulo
  const contenido = lang === 'en' && post.contenido_en ? post.contenido_en : post.contenido
  const fecha = new Date(post.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-8 lg:px-12 py-5 border-b border-[#e8edf2] flex items-center gap-2">
        <Link
          to="/blog"
          className="flex items-center gap-1.5 text-[13px] tracking-wide uppercase transition-colors text-[var(--muted)] hover:text-[var(--navy-dark)]"
          style={{ textDecoration: 'none' }}
        >
          <ChevronLeft size={12} /> Blog
        </Link>
        <span className="text-sdm-sm" style={{ color: 'var(--border)' }}>/</span>
        <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--navy-dark)' }}>{titulo}</span>
      </div>

      {/* Hero */}
      <div className="px-8 lg:px-12 py-16 border-b border-[#e8edf2]" style={{ background: 'var(--navy-dark)' }}>
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--green)', textTransform: 'uppercase' }}>{post.categoria}</span>
          <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{fecha}</span>
        </div>
        <h1
          className="font-serif font-light tracking-sdm-tight"
          style={{ fontSize: 'clamp(32px,4.5vw,58px)', color: '#fff', lineHeight: 1.1, maxWidth: 780 }}
        >
          {titulo}
        </h1>
        <div className="flex items-center gap-3 mt-8">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-light text-sm"
            style={{ background: 'rgba(168,196,220,0.2)', color: 'var(--sky)' }}
          >
            {post.autor_nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-sdm-base tracking-sdm-wide" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.55)' }}>
            {post.autor_nombre}
          </span>
        </div>
      </div>

      {/* Cover image */}
      {post.imagen_portada && (
        <div style={{ width: '100%', background: 'var(--off)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 0', maxHeight: 600, overflow: 'hidden' }}>
          <img src={post.imagen_portada} alt={titulo} style={{ maxWidth: '100%', maxHeight: 552, objectFit: 'contain', display: 'block' }} />
        </div>
      )}

      {/* Content */}
      <div className="px-8 lg:px-12 py-16">
        <div className="max-w-3xl mx-auto">

          {/* ─── RICH TEXT CONTENT ─── */}
          <div
            className="prose-sdm text-sdm-base"
            style={{ fontWeight: 300, color: 'var(--ink)' }}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contenido) }}
          />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
              {post.tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1.5 text-[13px] tracking-[1.5px] uppercase border"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted)', borderRadius: 1 }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 pt-8 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <Link to="/blog" className="btn-text">← Volver al Blog</Link>
            <a
              href={`https://wa.me/${get('whatsapp', '56937478846')}?text=Vi el artículo: ${titulo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-green text-[13px] py-2.5 px-5"
            >
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>

      <ContactSection />
    </div>
  )
}