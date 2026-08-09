import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { sanitizarContenido } from '@/lib/contenidoRico'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'
import type { BlogPost } from '@/types'
import { categoriaPrincipal } from '@/lib/blog'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang } = useLang()
  const { get } = useContenido()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [otros, setOtros] = useState<BlogPost[]>([])

  useEffect(() => {
    if (!slug) return
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('publicado', true).single()
      .then(({ data }) => { setPost(data); setLoading(false) })
  }, [slug])

  // UNA SOLA CONSULTA MÁS, Y NO CRECE CON EL CATÁLOGO. Trae cinco columnas de
  // tarjeta de los trece publicados —no el contenido— y el emparejado se hace
  // acá. Preguntar por categoría desde PostgREST exigiría un filtro OR por
  // término y traería lo mismo con más viajes.
  useEffect(() => {
    supabase.from('blog_posts')
      .select('id, slug, titulo, categoria, imagen_portada, created_at')
      .eq('publicado', true)
      .then(({ data }) => setOtros((data || []) as BlogPost[]))
  }, [])

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

  // ARTÍCULOS RELACIONADOS: POR TÉRMINO COMPARTIDO, no por el primero.
  //
  // `categoria` guarda listas escritas a mano —«Mercado, Inmobiliario, Credito
  // Hipotecario, Tasas»— y la tarjeta solo muestra el primer término. Medido
  // sobre los trece publicados:
  //
  //   por el primer término exacto      10 de 13 con >=1 · 3 sin ninguno
  //   por cualquier término compartido  12 de 13 con >=1 · 1 sin ninguno
  //
  // Agrupar por el primero deja fuera a tres y separa «Mercado» de «Mercado
  // Inmobiliario», que hablan de lo mismo. Se comparan todos los términos,
  // normalizados sin tildes ni mayúsculas, porque el dato lo escribe Víctor a
  // mano y «Inversión» e «inversion» son el mismo tema.
  const norm = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const terminos = (c?: string | null) =>
    new Set((c || '').split(',').map(norm).filter(Boolean))
  const mios = terminos(post.categoria)
  const relacionados = otros
    .filter(o => o.slug !== post.slug)
    .map(o => ({ o, n: [...terminos(o.categoria)].filter(x => mios.has(x)).length }))
    .filter(x => x.n > 0)
    .sort((a, b) => b.n - a.n || String(b.o.created_at).localeCompare(String(a.o.created_at)))
    .slice(0, 3)
    .map(x => x.o)

  const titulo    = lang === 'en' && post.titulo_en    ? post.titulo_en    : post.titulo
  const contenido = lang === 'en' && post.contenido_en ? post.contenido_en : post.contenido
  const resumen   = lang === 'en' && post.resumen_en   ? post.resumen_en   : post.resumen
  const fecha = new Date(post.created_at).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* El resumen y la portada del propio post. Sin esto los trece articulos
          compartian titulo y descripcion con la portada del sitio, que es justo
          lo que se ve al compartir uno. */}
      <SEO
        title={titulo}
        description={resumen || undefined}
        image={post.imagen_portada || undefined}
        url={`/blog/${post.slug}`}
        type="article"
      />
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
          {categoriaPrincipal(post.categoria) && <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'var(--green)', textTransform: 'uppercase' }}>{categoriaPrincipal(post.categoria)}</span>}
          <span className="text-sdm-sm tracking-sdm-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>{fecha}</span>
        </div>
        <h1
          className="font-serif font-normal tracking-sdm-tight"
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
            dangerouslySetInnerHTML={{ __html: sanitizarContenido(contenido) }}
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

      {/* NO SE DIBUJA CON MENOS DE DOS. Uno solo no es un bloque de
          relacionados: es una recomendación suelta que parece un descuido. Con
          el criterio de término compartido son 10 de los 13 los que llegan a
          dos; los otros tres no muestran nada, que es mejor que rellenar con lo
          más reciente y llamarlo «relacionado». */}
      {relacionados.length >= 2 && (
        <div className="px-8 lg:px-12 pb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="section-label" style={{ marginBottom: 20 }}>Artículos relacionados</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {relacionados.map(a => (
                <Link key={a.id} to={`/blog/${a.slug}`} className="group block" style={{ textDecoration: 'none' }}>
                  {a.imagen_portada && (
                    <div style={{ aspectRatio: '16/9', overflow: 'hidden', background: 'var(--off)', marginBottom: 10 }}>
                      <img src={a.imagen_portada} alt="" loading="lazy" decoding="async"
                        className="group-hover:scale-[1.03]"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }} />
                    </div>
                  )}
                  {categoriaPrincipal(a.categoria) && (
                    <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: 6 }}>
                      {categoriaPrincipal(a.categoria)}
                    </div>
                  )}
                  <div className="font-serif font-normal text-sdm-xl" style={{ color: 'var(--navy-dark)', lineHeight: 1.25 }}>
                    {a.titulo}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <ContactSection />
    </div>
  )
}