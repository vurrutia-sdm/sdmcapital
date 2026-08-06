import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapPin, Home, Bath, Maximize2, X, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import DOMPurify from 'dompurify'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import { useContenido } from '@/hooks/useContenido'
import ContactSection from '@/components/sections/ContactSection'
import ElBarrancoBanner from '@/components/ui/ElBarrancoBanner'
import SEO from '@/components/SEO'
import PropertyMap from '@/components/ui/PropertyMap'
import { normalizeDossiers, dossierTitle } from '@/lib/dossiers'
import { thumbUrl } from '@/lib/imagenes'
import type { Propiedad } from '@/types'

// ── ShareButtons ──────────────────────────────────────────────────────────────

const SHARE_NETWORKS = [
  { key: 'whatsapp', label: 'WhatsApp',    color: '#25D366', symbol: 'WA', getHref: (url: string, text: string) => `https://wa.me/?text=${text}%20${url}` },
  { key: 'facebook', label: 'Facebook',    color: '#1877F2', symbol: 'f',  getHref: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${url}` },
  { key: 'twitter',  label: 'X / Twitter', color: '#000000', symbol: '𝕏', getHref: (url: string, text: string) => `https://twitter.com/intent/tweet?url=${url}&text=${text}` },
  { key: 'linkedin', label: 'LinkedIn',    color: '#0A66C2', symbol: 'in', getHref: (url: string, text: string) => `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}` },
  { key: 'email',    label: 'Email',       color: '#4B5563', symbol: '✉',  getHref: (url: string, text: string) => `mailto:?subject=${text}&body=${url}` },
]

function ShareButtons({ titulo }: { titulo: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const pageUrl = encodeURIComponent(window.location.href)
  const pageText = encodeURIComponent(titulo)

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '8px 16px',
          background: '#fff',
          border: `1px solid ${copied ? '#3DAA6E' : '#e8edf2'}`,
          borderRadius: 2,
          color: copied ? '#3DAA6E' : '#0F2535',
          fontSize: 13,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          letterSpacing: '0.2px',
          cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { if (!copied) { e.currentTarget.style.borderColor = '#3DAA6E'; e.currentTarget.style.color = '#3DAA6E' } }}
        onMouseLeave={e => { if (!copied) { e.currentTarget.style.borderColor = '#e8edf2'; e.currentTarget.style.color = '#0F2535' } }}
      >
        <Share2 size={14} />
        {copied ? '¡Enlace copiado!' : 'Compartir'}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          background: '#fff',
          border: '1px solid #e8edf2',
          borderRadius: 4,
          boxShadow: '0 8px 28px rgba(15,37,53,0.13)',
          zIndex: 60,
          minWidth: 188,
          overflow: 'hidden',
        }}>
          {SHARE_NETWORKS.map(net => (
            <a
              key={net.key}
              href={net.getHref(pageUrl, pageText)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 14px',
                fontSize: 14,
                color: '#0F2535',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f4f8fb' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: net.color,
                color: '#fff',
                fontSize: net.symbol === '𝕏' ? 11 : net.symbol === 'in' ? 9 : 11,
                fontWeight: 700,
                flexShrink: 0,
                letterSpacing: '-0.5px',
              }}>
                {net.symbol}
              </span>
              {net.label}
            </a>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: '#e8edf2', margin: '2px 0' }} />

          {/* Copy link */}
          <button
            onClick={copyLink}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '9px 14px',
              fontSize: 14,
              color: '#0F2535',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              background: 'transparent',
              border: 'none',
              width: '100%',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f4f8fb' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: '#6B7280',
              color: '#fff',
              fontSize: 13,
              flexShrink: 0,
            }}>
              🔗
            </span>
            Copiar enlace
          </button>
        </div>
      )}
    </div>
  )
}

const ETAPA_LABELS: Record<string, string> = {
  en_blanco: 'En Blanco',
  en_verde: 'En Verde',
  planos: 'En Planos',
  inicio: 'Inicio de obras',
  avanzado: 'Obra avanzada',
  proxima_entrega: 'Próxima entrega',
  entrega_inmediata: 'Entrega inmediata',
}

const SUBSIDIO_LABELS: Record<string, string> = {
  DS49: 'DS49 Fondo Solidario',
  DS1_T1: 'DS1 Tramo 1',
  DS1_T2: 'DS1 Tramo 2',
  DS1_T3: 'DS1 Tramo 3',
  DS19: 'DS19 Integración Social',
  DS52: 'DS52 Arriendo',
  DS52_especial: 'DS52 Especial',
  sitio_propio: 'Sitio Propio',
  pequenos_condominios: 'Pequeños Condominios',
  DS10: 'DS10 Rural',
  DS27_mejoramiento: 'Hogar Mejor',
  DS27_ampliacion: 'DS27 Ampliación',
  DS27_eficiencia: 'Eficiencia Energética',
  DS27_termico: 'Acondicionamiento Térmico',
  condominios_sociales: 'Condominios Sociales',
  pavimentacion: 'Pavimentación',
  leasing: 'Leasing Habitacional',
  FOGAES: 'FOGAES',
  subsidio_tasa: 'Subsidio a la Tasa',
}

// Estados de resultado — banner destacado cerca del precio/título
const ESTADO_DESTACADO: Record<string, { label: string; sub: string; bg: string }> = {
  vendida:   { label: 'Vendida',   sub: 'Esta propiedad ya no está disponible', bg: '#c0392b' },
  arrendada: { label: 'Arrendada', sub: 'Esta propiedad ya no está disponible', bg: '#2563eb' },
  reservada: { label: 'Reservada', sub: 'Esta propiedad tiene una reserva en curso', bg: '#d97706' },
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const EL_BARRANCO_ID = 'eccfd92d-713e-4e0a-a074-ff76daffd81e'

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PropiedadDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { lang } = useLang()
  const { get } = useContenido()
  const [prop, setProp] = useState<Propiedad | null>(null)
  const [loading, setLoading] = useState(true)

  const [imgIdx, setImgIdx] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)

    // Links viejos con UUID → resolver el slug actual y redirigir 301
    if (UUID_REGEX.test(slug)) {
      supabase.from('propiedades').select('slug').eq('id', slug).single()
        .then(({ data, error }) => {
          if (!error && data?.slug) {
            window.location.replace(`/propiedades/${data.slug}`)
          } else {
            setProp(null)
            setLoading(false)
          }
        })
      return
    }

    supabase.from('propiedades').select('*').eq('slug', slug).single()
      .then(({ data, error }) => {
        if (error) console.error('Error cargando propiedad:', error)
        setProp(data)
        setLoading(false)
      })
  }, [slug])

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

  const estado = prop.estado === 'en_venta' ? 'En venta' : prop.estado === 'en_arriendo' ? 'En arriendo' : prop.estado === 'vendida' ? 'Vendida' : prop.estado === 'arrendada' ? 'Arrendada' : 'Reservada'
  const destacado = ESTADO_DESTACADO[prop.estado]
  const noDisponible = prop.estado === 'vendida' || prop.estado === 'arrendada'

  return (
    <div>
      <SEO
        title={titulo}
        description={`${prop.tipo ? prop.tipo.charAt(0).toUpperCase() + prop.tipo.slice(1) : 'Propiedad'} en ${prop.comuna}, ${prop.region}. ${prop.a_consultar ? 'Precio a consultar.' : prop.precio_uf ? `UF ${prop.precio_uf.toLocaleString('es-CL')}.` : ''} ${prop.descripcion?.slice(0, 120) || ''}`}
        image={prop.imagen_principal || prop.imagenes?.[0]}
        url={`/propiedades/${prop.slug || prop.id}`}
        type="article"
      />
      {/* Breadcrumb */}
      <div className="px-8 lg:px-12 py-4 border-b border-[#e8edf2] flex items-center gap-2" style={{ fontSize: 13, color: 'var(--muted)' }}>
        <Link to="/propiedades" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Propiedades</Link>
        <span>›</span>
        <span style={{ color: 'var(--navy-dark)', fontSize: 13 }}>{titulo}</span>
      </div>

      {/* ── Banner Showcase El Barranco ── */}
      {prop.id === EL_BARRANCO_ID && <ElBarrancoBanner />}

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
                    <img src={thumbUrl(img)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Detalle ── */}
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {prop.bono_pie && (
                <span style={{ fontSize: 11, padding: '5px 14px', borderRadius: 1, background: 'var(--green)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Bono Pie{prop.bono_pie_porcentaje ? ` ${prop.bono_pie_porcentaje}%` : ''}
                </span>
              )}
              {prop.baja_precio && (
                <span style={{ fontSize: 11, padding: '5px 14px', borderRadius: 1, background: '#c0392b', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Precio rebajado
                </span>
              )}
              <span style={{ fontSize: 11, padding: '5px 14px', borderRadius: 1, border: '1px solid var(--border)', color: 'var(--muted)', fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase' }}>
                {prop.tipo}
              </span>
            </div>

            {/* Banner destacado de estado — vendida / reservada / arrendada */}
            {destacado && (
              <div className="mb-5 px-5 py-3" style={{ background: destacado.bg, borderRadius: 2 }}>
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#fff' }}>
                  {destacado.label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
                  {destacado.sub}
                </div>
              </div>
            )}

            <h1 className="font-serif font-light mb-4" style={{ fontSize: 40, color: 'var(--navy-dark)', lineHeight: 1.1, letterSpacing: '-0.3px' }}>
              {titulo}
            </h1>

            <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--muted)', fontSize: 15 }}>
              <MapPin size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
              {prop.comuna}, {prop.region}
            </div>

            {/* ── Compartir ── */}
            <ShareButtons titulo={titulo} />

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
                prop.dormitorios      ? { icon: <Home size={22} style={{ color: 'var(--navy)' }} />,         val: prop.dormitorios,            label: 'Dorm.' }          : null,
                prop.banos            ? { icon: <Bath size={22} style={{ color: 'var(--navy)' }} />,         val: prop.banos,                  label: 'Baños' }          : null,
                prop.superficie_total ? { icon: <Maximize2 size={22} style={{ color: 'var(--navy)' }} />,   val: `${prop.superficie_total} m²`, label: 'Sup. total' }     : null,
                p.superficie_util     ? { icon: <Maximize2 size={22} style={{ color: 'var(--navy)', opacity: 0.6 }} />, val: `${p.superficie_util} m²`, label: 'Sup. construida' } : null,
                prop.estacionamientos ? { icon: <span style={{ fontSize: 20 }}>🅿</span>, val: prop.estacionamientos, label: 'Estacionam.' } : null,
                p.bodegas             ? { icon: <span style={{ fontSize: 20 }}>📦</span>,                   val: p.bodegas as number,         label: 'Bodegas' }         : null,
                prop.ano_construccion ? { icon: <span style={{ fontSize: 20 }}>🏗</span>,                   val: prop.ano_construccion,       label: 'Año const.' }      : null,
              ].filter(Boolean)

              if (specs.length === 0) return null
              return (
                <div className="flex gap-8 mb-6 pb-6 border-b border-[#e8edf2] flex-wrap items-start">
                  {specs.map((s, i) => s && (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 60 }}>
                      <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {s.icon}
                      </div>
                      <div className="font-serif" style={{ fontSize: 26, fontWeight: 300, color: 'var(--navy-dark)', lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', textAlign: 'center' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Estado conservación + Bono pie + Comisión */}
            {(() => {
              const p = prop as typeof prop & Record<string, unknown>
              const tags: { label: string; dark?: boolean }[] = []
              if (p.estado_conservacion) tags.push({ label: String(p.estado_conservacion).charAt(0).toUpperCase() + String(p.estado_conservacion).slice(1), dark: false })
              if (p.comision_porcentaje && prop.categoria !== 'proyecto_nuevo') tags.push({ label: `Comisión corredora ${p.comision_porcentaje}%`, dark: true })
              if (!tags.length) return null
              return (
                <div className="flex gap-3 mb-8 flex-wrap">
                  {tags.map((tag, i) => (
                    <span key={i} style={{
                      fontSize: 11,
                      padding: '6px 16px',
                      borderRadius: 1,
                      background: tag.dark ? '#4a4a4a' : 'var(--green)',
                      color: '#fff',
                      fontWeight: 500,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    }}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              )
            })()}

            {/* Descripción */}
            {prop.descripcion && (
              <div
                className="prose-sdm"
                style={{ fontSize: 16, fontWeight: 300, color: 'var(--muted)', marginBottom: 24 }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(prop.descripcion) }}
              />
            )}

            {/* Unidades disponibles — edificios con varios pisos en arriendo */}
            {(() => {
              const unidades = Array.isArray(prop.unidades) ? prop.unidades : []
              if (!unidades.length) return null

              const conSuperficie = unidades.filter(u => typeof u.m2 === 'number')
              const totalM2 = conSuperficie.reduce((suma, u) => suma + (u.m2 as number), 0)
              const hayPendientes = conSuperficie.length < unidades.length

              const rotulo: CSSProperties = {
                fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase',
                color: 'var(--muted)', fontWeight: 400,
                padding: '0 0 8px', borderBottom: '1px solid var(--border)',
              }
              const celda: CSSProperties = { padding: '10px 0', borderBottom: '1px solid var(--border)' }
              const cifra: CSSProperties = { fontSize: 20, fontWeight: 300, color: 'var(--navy-dark)', lineHeight: 1.2 }

              return (
                <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h2 className="font-serif font-light mb-4" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>
                    Unidades disponibles
                  </h2>

                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...rotulo, textAlign: 'left' }}>Piso</th>
                        <th style={{ ...rotulo, textAlign: 'right' }}>Superficie</th>
                      </tr>
                    </thead>

                    <tbody>
                      {unidades.map((u, i) => (
                        <tr key={i}>
                          <td style={{ ...celda, textAlign: 'left' }}>
                            <span className="font-serif" style={cifra}>{u.piso}</span>
                            {u.nota && (
                              <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--muted)', marginTop: 2 }}>
                                {u.nota}
                              </div>
                            )}
                          </td>
                          <td style={{ ...celda, textAlign: 'right' }}>
                            {typeof u.m2 === 'number' ? (
                              <span className="font-serif" style={cifra}>{u.m2.toLocaleString('es-CL')} m²</span>
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>Por confirmar</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    <tfoot>
                      <tr>
                        <td style={{ padding: '14px 0 0', textAlign: 'left', verticalAlign: 'bottom' }}>
                          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                            Total
                          </div>
                          <div className="font-serif" style={{ ...cifra, fontSize: 22 }}>
                            {unidades.length} {unidades.length === 1 ? 'unidad' : 'unidades'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 0 0', textAlign: 'right', verticalAlign: 'bottom' }}>
                          <div className="font-serif" style={{ ...cifra, fontSize: 22 }}>
                            {totalM2.toLocaleString('es-CL')} m²
                          </div>
                          {hayPendientes && (
                            <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--muted)', marginTop: 2 }}>
                              No incluye las unidades por confirmar
                            </div>
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })()}

            {/* Información del Proyecto — solo proyectos nuevos */}
            {prop.categoria === 'proyecto_nuevo' && (() => {
              const items: { label: string; value: string }[] = []
              if (prop.etapa_construccion && ETAPA_LABELS[prop.etapa_construccion]) items.push({ label: 'Etapa', value: ETAPA_LABELS[prop.etapa_construccion] })
              if (prop.fecha_entrega) items.push({ label: 'Fecha estimada de entrega', value: prop.fecha_entrega })
              if (prop.avance_obra !== undefined && prop.avance_obra !== null) items.push({ label: 'Avance de obra', value: `${prop.avance_obra}%` })
              const subsidios = prop.subsidios || []
              if (!items.length && !subsidios.length) return null
              return (
                <div className="mb-6 pb-6 border-b border-[#e8edf2]">
                  <h2 className="font-serif font-light mb-4" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>
                    Información del Proyecto
                  </h2>
                  {items.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {items.map((item, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 300, color: 'var(--ink)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {subsidios.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Subsidios aplicables</div>
                      <div className="flex flex-wrap gap-2">
                        {subsidios.map(value => (
                          <span key={value} style={{ fontSize: 11, padding: '5px 14px', borderRadius: 1, background: 'var(--navy)', color: '#fff', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                            {SUBSIDIO_LABELS[value] || value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Dossiers múltiples */}
            {(() => {
              const dossiers = normalizeDossiers(prop.dossiers)
              const legacy = prop.dossier_url
              const all = dossiers.length > 0
                ? dossiers
                : legacy ? [{ url: legacy }] : []
              if (!all.length) return null
              return (
                <div className="mb-6">
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Documentos adjuntos</div>
                  <div className="flex flex-col gap-2">
                    {all.map((d, i) => (
                      <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-4 py-3 rounded-sm"
                        style={{ background: 'var(--sky-pale)', border: '1px solid var(--sky)', textDecoration: 'none', fontSize: 14, color: 'var(--navy)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#dbeaf5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--sky-pale)'}
                      >
                        <span style={{ fontSize: 18 }}>📄</span>
                        <span style={{ flex: 1 }}>{dossierTitle(d)}</span>
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Descargar ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-3 flex-wrap">
              {noDisponible ? (
                <div
                  className="inline-flex items-center"
                  style={{ padding: '13px 24px', borderRadius: 6, background: 'var(--sky-pale)', color: 'var(--muted)', fontSize: 13, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}
                >
                  Esta propiedad ya no está disponible
                </div>
              ) : (
                <>
                  <a
                    href={`https://wa.me/${get('whatsapp', '56937478846')}?text=Hola, me interesa la propiedad: ${titulo}`}
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
                </>
              )}
            </div>

            {prop.mostrar_boton_flow !== false && !destacado && (
              <a
                href="https://www.flow.cl/uri/gHSdT2jVv"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '12px',
                  padding: '13px 24px',
                  border: '1px solid var(--navy-dark)',
                  borderRadius: '6px',
                  color: 'var(--navy-dark)',
                  fontSize: '13px',
                  fontWeight: 400,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'var(--navy-dark)';
                  el.style.color = 'white';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'transparent';
                  el.style.color = 'var(--navy-dark)';
                }}
              >
                <img src="/FLOW-HORIZONTAL-LOGO.png" alt="Flow" style={{ height: '20px', objectFit: 'contain' }} />
                <span>Reserva esta propiedad</span>
              </a>
            )}
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
                  <img src={thumbUrl(img)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

      {/* ── Banner Showcase El Barranco (inferior) ── */}
      {prop.id === EL_BARRANCO_ID && <ElBarrancoBanner clave="banner_foto" />}

      {/* Mapa */}
      {(prop.map_address || prop.comuna) && (
        <div className="px-8 lg:px-12 py-10 border-t border-[#e8edf2]">
          <PropertyMap
            address={prop.map_address}
            lat={prop.map_lat}
            lng={prop.map_lng}
            comuna={prop.comuna}
            region={prop.region}
          />
        </div>
      )}

      <ContactSection />
    </div>
  )
}
