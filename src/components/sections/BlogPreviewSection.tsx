import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import type { BlogPost } from '@/types'

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
      <p style={{ fontSize: 13, color: 'var(--muted)' }}>DEBUG: BlogPreviewSection montado — 0 posts encontrados</p>
    </section>
  )

  const [main, ...rest] = posts

  const getTitle = (p: BlogPost) => lang === 'en' && p.titulo_en ? p.titulo_en : p.titulo
  const getFecha = (p: BlogPost) => new Date(p.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderTop: '1px solid #e8edf2' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 16 }}>Artículos y noticias</div>
          <h2 className="font-serif font-light" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08, letterSpacing: '-0.5px' }}>
            Últimas <em>publicaciones</em>
          </h2>
        </div>
        <Link to="/blog"
          style={{ fontSize: 11, fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', textDecoration: 'none', borderBottom: '1px solid var(--navy-dark)', paddingBottom: 2, whiteSpace: 'nowrap' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--green)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--green)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--navy-dark)' }}
        >Ver todos los artículos →</Link>
      </div>

      {/* Layout editorial: 1 grande + 2 pequeños */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-px items-stretch" style={{ background: 'var(--border)' }}>

        {/* Post principal — grande */}
        <Link to={`/blog/${main.slug}`} className="group" style={{ textDecoration: 'none', background: '#fff', display: 'flex', flexDirection: 'column' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--off)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--off)' }}>
            {main.imagen_portada && (
              <img src={main.imagen_portada} alt={getTitle(main)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform 0.5s ease' }}
                className="group-hover:scale-[1.03]"
              />
            )}
          </div>
          <div style={{ padding: '32px 36px 40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              {main.categoria && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--green)' }}>{main.categoria}</span>}
              <span style={{ fontSize: 12, color: 'var(--border)' }}>·</span>
              <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--muted)' }}>{getFecha(main)}</span>
            </div>
            <h3 className="font-serif font-light" style={{ fontSize: 'clamp(22px,3vw,30px)', color: 'var(--navy-dark)', lineHeight: 1.2, letterSpacing: '-0.3px', marginBottom: 16, flex: 1 }}>{getTitle(main)}</h3>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', borderBottom: '1px solid currentColor', display: 'inline-block', paddingBottom: 2 }}>Leer artículo →</div>
          </div>
        </Link>

        {/* Posts secundarios — apilados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--border)' }}>
          {rest.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group" style={{ textDecoration: 'none', background: '#fff', display: 'flex', flexDirection: 'column', flex: 1 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--off)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >
              <div style={{ height: 180, overflow: 'hidden', background: 'var(--off)' }}>
                {post.imagen_portada && (
                  <img src={post.imagen_portada} alt={getTitle(post)}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transition: 'transform 0.5s ease' }}
                    className="group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  {post.categoria && <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--green)' }}>{post.categoria}</span>}
                  <span style={{ fontSize: 12, color: 'var(--border)' }}>·</span>
                  <span style={{ fontSize: 12, fontWeight: 300, color: 'var(--muted)' }}>{getFecha(post)}</span>
                </div>
                <h3 className="font-serif font-light" style={{ fontSize: 'clamp(16px,2vw,19px)', color: 'var(--navy-dark)', lineHeight: 1.25, letterSpacing: '-0.2px', flex: 1, marginBottom: 16 }}>{getTitle(post)}</h3>
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--navy-dark)', borderBottom: '1px solid currentColor', display: 'inline-block', paddingBottom: 1 }}>Leer →</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
