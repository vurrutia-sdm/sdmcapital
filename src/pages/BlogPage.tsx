import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import type { BlogPost } from '@/types'

export default function BlogPage() {
  const { lang } = useLang()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('publicado', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen">
      <div className="px-8 lg:px-12 pt-14 pb-10 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 14 }}>Publicaciones</div>
        <h1 className="font-serif font-light" style={{ fontSize: 52, color: 'var(--navy-dark)', lineHeight: 1.05, letterSpacing: '-0.5px' }}>
          Blog <em>SDM Capital</em>
        </h1>
        <p style={{ fontSize: 16, fontWeight: 300, color: 'var(--muted)', marginTop: 10, lineHeight: 1.8 }}>
          Noticias, análisis y tendencias del mercado inmobiliario en Chile y el mundo.
        </p>
      </div>

      <div className="px-8 lg:px-12 py-14">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 320, background: 'var(--border)', borderRadius: 2, opacity: 0.4 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif italic" style={{ fontSize: 22, color: 'var(--muted)' }}>
              Próximamente nuevos artículos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {posts.map(post => {
              const titulo = lang === 'en' && post.titulo_en ? post.titulo_en : post.titulo
              const resumen = lang === 'en' && post.resumen_en ? post.resumen_en : post.resumen
              const fecha = new Date(post.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group block bg-white"
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{ height: 220, background: 'linear-gradient(160deg,#1a3d5c,#0d2035)', overflow: 'hidden', position: 'relative' }}>
                    {post.imagen_portada
                      ? <img src={post.imagen_portada} alt={titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="font-serif italic" style={{ fontSize: 15, color: 'rgba(255,255,255,0.2)' }}>{post.categoria}</span></div>
                    }
                    {post.destacado && (
                      <div className="absolute top-3 left-3 text-[13px] tracking-[2px] uppercase px-2.5 py-1" style={{ background: 'var(--green)', color: '#fff', borderRadius: 1 }}>
                        Destacado
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span style={{ fontSize: 13, color: 'var(--green)', letterSpacing: '2px', textTransform: 'uppercase' }}>{post.categoria}</span>
                      <span style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '1px' }}>{fecha}</span>
                    </div>
                    <h2 className="font-serif font-light mb-2" style={{ fontSize: 20, color: 'var(--navy-dark)', lineHeight: 1.25 }}>{titulo}</h2>
                    <p className="font-light" style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>{resumen}</p>
                    <div className="mt-4 text-[13px] tracking-[2px] uppercase border-b pb-0.5 inline-flex items-center gap-1" style={{ color: 'var(--navy)', borderColor: 'var(--navy)' }}>
                      Leer artículo →
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
