import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Home, Bath, Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import ContactSection from '@/components/sections/ContactSection'
import type { Propiedad } from '@/types'

export default function PropiedadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { lang } = useLang()
  const [prop, setProp] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    supabase.from('propiedades').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) console.error('Error cargando propiedad:', error)
        setProp(data)
        setLoading(false)
      })
  }, [id])

  const allImgs: string[] = prop ? [
    ...(prop.imagen_principal ? [prop.imagen_principal] : []),
    ...(prop.imagenes || []).filter((img: string) => img !== prop.imagen_principal),
  ] : []

  const prev = () => setImgIdx(i => (i - 1 + allImgs.length) % allImgs.length)
  const next = () => setImgIdx(i => (i + 1) % allImgs.length)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape')     setLightbox(false)
    }
    if (lightbox) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightbox, imgIdx, allImgs.length])

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--muted)' }}>Cargando…</div>
  if (!prop)   return <div className="min-h-screen flex items-center justify-center" style={{ color: 'var(--muted)' }}>Propiedad no encontrada.</div>

  const titulo = lang === 'en' && prop.titulo_en ? prop.titulo_en : prop.titulo

  const estado = prop.estado === 'en_venta' ? 'En venta' : prop.estado === 'en_arriendo' ? 'En arriendo' : prop.estado === 'vendida' ? 'Vendida' : 'Reservada'

  return (
    <div>
      {/* Breadcrumb */}
      <div className="px-8 lg:px-12 py-4 border-b border-[#e8edf2] flex items-center gap-2" style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/propiedades" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Propiedades</Link>
        <span>›</span>
        <span style={{ color: 'var(--navy-dark)', fontSize: 13 }}>{titulo}</span>
      </div>

      <div className="px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* ── Galería ── */}
          <div>
            {/* Imagen principal — clic para abrir lightbox */}
            <div
              className="w-full mb-3 relative overflow-hidden cursor-zoom-in"
              style={{ height: 420, background: 'linear-gradient(160deg,#1a3d5c,#0d2035)', borderRadius: 2 }}
              onClick={() => allImgs.length > 0 && setLightbox(true)}
            >
              {allImgs[imgIdx] ? (
                <img
                  src={allImgs[imgIdx]}
                  alt={titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', background: '#0d1e2e' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-serif italic" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }}>{titulo}</span>
                </div>
              )}

              {/* Hint ampliación */}
              {allImgs.length > 0 && (
                <div style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '4px 10px', borderRadius: 2, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Ver ampliada
                </div>
              )}

              {/* Flechas si hay más de 1 */}
              {allImgs.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); prev() }}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); next() }}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', color: '#fff', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImgs.map((img, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} className="flex-shrink-0 cursor-pointer" style={{ width: 76, height: 56, borderRadius: 2, overflow: 'hidden', outline: i === imgIdx ? '2px solid var(--green)' : '2px solid transparent', transition: 'outline 0.15s', background: '#0d1e2e' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Detalle ── */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {prop.destacada && (
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 2, background: 'var(--green)', color: '#fff', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Destacada</span>
              )}
              {prop.baja_precio && (
                <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 2, background: '#E24B4A', color: '#fff', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>↓ Baja de precio</span>
              )}
              <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 2, background: 'var(--navy-dark)', color: 'var(--sky)', fontWeight: 400, letterSpacing: '1px', textTransform: 'uppercase' }}>{prop.tipo}</span>
            </div>

            <h1 className="font-serif font-light mb-4" style={{ fontSize: 40, color: 'var(--navy-dark)', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              {titulo}
            </h1>

            <div className="flex items-center gap-2 mb-6" style={{ color: 'var(--muted)', fontSize: 15 }}>
              <MapPin size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
              {prop.comuna}, {prop.region}
            </div>

            {(prop.a_consultar || prop.precio_uf || prop.precio_usd || prop.precio_clp) && (
              <div className="mb-6 pb-6 border-b border-[#e8edf2]">
                {prop.baja_precio && prop.precio_anterior_uf && (
                  <div style={{ fontSize: 18, color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 4 }}>
                    UF {prop.precio_anterior_uf.toLocaleString('es-CL')} — precio anterior
                  </div>
                )}
                <div className="font-serif" style={{ fontSize: 44, fontWeight: 300, color: prop.baja_precio ? '#E24B4A' : 'var(--navy-dark)', lineHeight: 1 }}>
                  {prop.a_consultar
                    ? 'A consultar'
                    : prop.precio_uf
                    ? `UF ${prop.precio_uf.toLocaleString('es-CL')}`
                    : prop.precio_clp
                    ? `$ ${(prop.precio_clp as number).toLocaleString('es-CL')}`
                    : prop.precio_usd
                    ? `USD ${prop.precio_usd.toLocaleString()}`
                    : ''}
                </div>
                <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--muted)', marginTop: 6, letterSpacing: '1px', textTransform: 'uppercase' }}>{estado}</div>
              </div>
            )}

            {/* Specs principales — solo los que tienen valor */}
            {(() => {
              const p = prop as typeof prop & Record<string, unknown>
              const specs = [
                prop.dormitorios   ? { icon: <Home size={22} style={{ color: 'var(--navy)' }} />,     val: prop.dormitorios,       label: 'Dorm.' }       : null,
                prop.banos         ? { icon: <Bath size={22} style={{ color: 'var(--navy)' }} />,     val: prop.banos,             label: 'Baños' }       : null,
                prop.superficie_total ? { icon: <Maximize2 size={22} style={{ color: 'var(--navy)' }} />, val: `${prop.superficie_total} m²`, label: 'Sup. total' } : null,
                p.superficie_util  ? { icon: <Maximize2 size={22} style={{ color: 'var(--navy)', opacity: 0.6 }} />, val: `${p.superficie_util} m²`, label: 'Sup. construida' } : null,
                prop.estacionamientos ? { icon: <span style={{ fontSize: 20 }}>🅿</span>, val: prop.estacionamientos, label: 'Estacion.' } : null,
                prop.ano_construccion  ? { icon: <span style={{ fontSize: 20 }}>🏗</span>, val: prop.ano_construccion,  label: 'Año const.' } : null,
              ].filter(Boolean)

              if (specs.length === 0) return null
              return (
                <div className="flex gap-8 mb-8 pb-6 border-b border-[#e8edf2] flex-wrap">
                  {specs.map((s, i) => s && (
                    <div key={i} className="flex flex-col items-center gap-2">
                      {s.icon}
                      <div className="font-serif" style={{ fontSize: 26, fontWeight: 300, color: 'var(--navy-dark)' }}>{s.val}</div>
                      <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Descripción */}
            {prop.descripcion && (
              <div style={{ fontSize: 16, fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 24 }}>
                {prop.descripcion.split('\n').map((line, i) =>
                  line.trim() === ''
                    ? <br key={i} />
                    : <p key={i} style={{ marginBottom: 8 }}>{line}</p>
                )}
              </div>
            )}

            {/* Dossiers múltiples */}
            {(() => {
              const dossiers = prop.dossiers as string[] | undefined
              const legacy = prop.dossier_url
              // Solo usar legacy si no hay array dossiers nuevo
              const all = dossiers && dossiers.length > 0
                ? dossiers
                : legacy ? [legacy] : []
              if (!all.length) return null
              const getName = (url: string) => {
                try { return decodeURIComponent(url.split('/').pop() || '').replace(/^\d+_/, '') }
                catch { return 'Documento' }
              }
              return (
                <div className="mb-6">
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Documentos adjuntos</div>
                  <div className="flex flex-col gap-2">
                    {all.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-4 py-3 rounded-sm"
                        style={{ background: 'var(--sky-pale)', border: '1px solid var(--sky)', textDecoration: 'none', fontSize: 14, color: 'var(--navy)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dbeaf5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--sky-pale)'}
                      >
                        <span style={{ fontSize: 18 }}>📄</span>
                        <span style={{ flex: 1 }}>{getName(url)}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Descargar ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-3 flex-wrap">
              <a
                href={`https://wa.me/56931038954?text=Hola, me interesa la propiedad: ${titulo}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-green inline-flex"
              >
                Consultar por WhatsApp
              </a>
              <button
                onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary inline-flex"
              >
                Contactar agente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && allImgs.length > 0 && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightbox(false)}
        >
          {/* Cerrar */}
          <button
            onClick={() => setLightbox(false)}
            style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', zIndex: 10 }}
          >
            <X size={32} />
          </button>

          {/* Contador */}
          <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 14, letterSpacing: '2px' }}>
            {imgIdx + 1} / {allImgs.length}
          </div>

          {/* Imagen */}
          <img
            src={allImgs[imgIdx]}
            alt={titulo}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 2 }}
          />

          {/* Flechas */}
          {allImgs.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prev() }}
                style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', color: '#fff', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                <ChevronLeft size={24} />
              </button>
              <button onClick={e => { e.stopPropagation(); next() }}
                style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', color: '#fff', width: 48, height: 48, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Thumbnails strip */}
          {allImgs.length > 1 && (
            <div className="flex gap-2 overflow-x-auto" style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', maxWidth: '90vw', padding: '0 8px' }}>
              {allImgs.map((img, i) => (
                <div key={i} onClick={e => { e.stopPropagation(); setImgIdx(i) }}
                  style={{ width: 60, height: 44, borderRadius: 2, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', outline: i === imgIdx ? '2px solid var(--green)' : '2px solid transparent', opacity: i === imgIdx ? 1 : 0.55, transition: 'all 0.15s' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Video YouTube ── */}
      {prop.youtube_url && (() => {
        const raw = prop.youtube_url as string
        const match = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        const videoId = match?.[1]
        return videoId ? (
          <div className="px-8 lg:px-12 pb-12">
            <h2 className="font-serif font-light mb-6" style={{ fontSize: 28, color: 'var(--navy-dark)' }}>
              Video de la propiedad
            </h2>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 2, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Video propiedad"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              />
            </div>
          </div>
        ) : null
      })()}

      <ContactSection />
    </div>
  )
}
