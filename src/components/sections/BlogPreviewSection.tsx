import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import type { BlogPost } from '@/types'
import { categoriaPrincipal } from '@/lib/blog'

const sp = { paddingLeft: 'clamp(16px, 5vw, 48px)', paddingRight: 'clamp(16px, 5vw, 48px)' }

export default function BlogPreviewSection() {
  const { lang } = useLang()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('BlogPreviewSection: montando...')
    supabase.from('blog_posts')
      .select('id, slug, titulo, titulo_en, categoria, imagen_portada, created_at')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data, error }) => {
        console.log('BlogPreviewSection data:', data)
        console.log('BlogPreviewSection error:', error)
        if (data && data.length > 0) setPosts(data as BlogPost[])
        setLoading(false)
      })
  }, [])

  if (loading) return null
  if (posts.length === 0) return (
    <section style={{ paddingLeft: 'clamp(16px, 5vw, 48px)', paddingRight: 'clamp(16px, 5vw, 48px)', paddingTop: 40, paddingBottom: 40 }}>
      <p className="text-sdm-sm" style={{ color: 'var(--muted)' }}>DEBUG: BlogPreviewSection montado — 0 posts encontrados</p>
    </section>
  )

  const [main, ...rest] = posts

  const getTitle = (p: BlogPost) => lang === 'en' && p.titulo_en ? p.titulo_en : p.titulo
  const getFecha = (p: BlogPost) => new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderTop: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 16 }}>Artículos y noticias</div>
          <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>
            Últimas <em>publicaciones</em>
          </h2>
        </div>
        <Link className="area-44 text-sdm-xs tracking-sdm-wide text-[var(--navy-dark)] border-b border-[var(--navy-dark)] hover:text-[var(--green-dark)] hover:border-[var(--green-dark)]" to="/blog"
          style={{ fontWeight: 400, textTransform: 'uppercase', textDecoration: 'none', paddingBottom: 2, whiteSpace: 'nowrap' }}
        >Ver todos los artículos →</Link>
      </div>

      {/* Layout editorial: 1 grande + 2 pequeños */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-px items-stretch" style={{ background: 'var(--border)' }}>

        {/* Post principal — grande */}
        <Link to={`/blog/${main.slug}`} className="group bg-white hover:bg-[var(--off)]" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--off)' }}>
            {main.imagen_portada && (
              <img loading="lazy" decoding="async" src={main.imagen_portada} alt={getTitle(main)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform 0.5s ease' }}
                className="group-hover:scale-[1.03]"
              />
            )}
          </div>
          <div style={{ padding: '32px 36px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              {categoriaPrincipal(main.categoria) && <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--green-dark)' }}>{categoriaPrincipal(main.categoria)}</span>}
              <span className="text-sdm-sm" style={{ color: 'var(--border)' }}>·</span>
              <span className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)' }}>{getFecha(main)}</span>
            </div>
            <h3 className="font-serif font-normal tracking-sdm-tight" style={{ fontSize: 'clamp(var(--sdm-text-2xl),3vw,var(--sdm-display-sm))', color: 'var(--navy-dark)', lineHeight: 1.2, marginBottom: 16, flex: 1 }}>{getTitle(main)}</h3>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid currentColor', display: 'inline-block', alignSelf: 'flex-start', paddingBottom: 2 }}>Leer artículo →</div>
          </div>
        </Link>

        {/* Posts secundarios — apilados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
          {rest.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group bg-white hover:bg-[var(--off)]" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ height: 180, overflow: 'hidden', background: 'var(--off)' }}>
                {post.imagen_portada && (
                  <img loading="lazy" decoding="async" src={post.imagen_portada} alt={getTitle(post)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform 0.5s ease' }}
                    className="group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  {categoriaPrincipal(post.categoria) && <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--green-dark)' }}>{categoriaPrincipal(post.categoria)}</span>}
                  <span className="text-sdm-sm" style={{ color: 'var(--border)' }}>·</span>
                  <span className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)' }}>{getFecha(post)}</span>
                </div>
                <h3 className="font-serif font-normal tracking-sdm-tight text-sdm-xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25, flex: 1, marginBottom: 16 }}>{getTitle(post)}</h3>
                <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid currentColor', display: 'inline-block', alignSelf: 'flex-start', paddingBottom: 1 }}>Leer →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
