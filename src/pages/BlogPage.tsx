import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
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
      <SEO
        title="Blog"
        description="Artículos sobre mercado inmobiliario, financiamiento hipotecario e inversión en Chile."
      />
      <div className="px-8 lg:px-12 pt-14 pb-10 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 14 }}>Publicaciones</div>
        <h1 className="font-serif font-light text-sdm-display-lg" style={{ color: 'var(--navy-dark)' }}>
          Blog <em>SDM Capital</em>
        </h1>
        <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', marginTop: 10, lineHeight: 1.8 }}>
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
            <p className="font-serif italic text-sdm-2xl" style={{ color: 'var(--muted)' }}>
              Próximamente nuevos artículos.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: posts.length === 1
              ? 'minmax(300px, 480px)'
              : posts.length === 2
              ? 'repeat(2, minmax(300px, 1fr))'
              : 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border)',
            justifyContent: posts.length < 3 ? 'center' : 'stretch',
            margin: posts.length < 3 ? '0 auto' : '0',
            maxWidth: posts.length === 1 ? 480 : 'none',
          }}>
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
                  <div style={{ aspectRatio: '4/3', background: 'var(--off)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {post.imagen_portada
                      ? <img src={post.imagen_portada} alt={titulo} loading="lazy" decoding="async" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} className="transition-transform duration-500 group-hover:scale-[1.03]" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="font-serif italic text-sdm-base" style={{ color: 'var(--muted)' }}>{post.categoria}</span></div>
                    }
                    {post.destacado && (
                      <div className="absolute top-3 left-3 text-[13px] tracking-[2px] uppercase px-2.5 py-1" style={{ background: 'var(--green)', color: '#fff', borderRadius: 1 }}>
                        Destacado
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--green)', textTransform: 'uppercase' }}>{post.categoria}</span>
                      <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--muted)' }}>{fecha}</span>
                    </div>
                    <h2 className="font-serif font-light mb-2 text-sdm-xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25 }}>{titulo}</h2>
                    <p className="font-light text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{resumen}</p>
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
