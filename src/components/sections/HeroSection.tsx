import { useEffect, useRef, useState } from 'react'
import { useContenido } from '@/hooks/useContenido'

// ─── Contador animado ─────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])
  return count
}

function AnimatedStat({ n, unit, label }: { n: number; unit: string; label: string }) {
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useCounter(n, 1600, active)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
      <div className="font-serif" style={{ fontSize: 38, fontWeight: 300, color: '#fff', lineHeight: 1 }}>
        {count}<span style={{ fontSize: 28, color: 'var(--green)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 400, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

// ─── Carrusel de fotos ────────────────────────────────────────────────────────
const INTERVAL_MS = 5000 // Cambia cada 5 segundos

function HeroCarousel({ images, positions }: { images: string[]; positions: string[] }) {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (images.length < 2) return
    const timer = setInterval(() => {
      setPrev(current)
      setTransitioning(true)
      setCurrent(c => (c + 1) % images.length)
      // Limpiar prev después de la transición
      setTimeout(() => { setPrev(null); setTransitioning(false) }, 1200)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [images.length, current])

  const goTo = (idx: number) => {
    if (idx === current) return
    setPrev(current)
    setTransitioning(true)
    setCurrent(idx)
    setTimeout(() => { setPrev(null); setTransitioning(false) }, 1200)
  }

  if (images.length === 0) {
    return (
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,#1a3d5c 0%,#0d2035 55%,#071524 100%)' }} />
    )
  }

  return (
    <>
      {/* Imagen anterior — se desvanece */}
      {prev !== null && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${images[prev]})`,
            backgroundSize: 'cover',
            backgroundPosition: positions[prev] || 'center center',
            opacity: transitioning ? 0 : 1,
            transition: 'opacity 1.2s ease',
            zIndex: 1,
          }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${images[current]})`,
          backgroundSize: 'cover',
          backgroundPosition: positions[current] || 'center center',
          opacity: 1,
          transition: 'opacity 1.2s ease',
          zIndex: 2,
        }}
      >
        {/* Preload hint para el navegador */}
        {images[current] && (
          <link rel="preload" as="image" href={images[current]} />
        )}
      </div>

      {/* Dots de navegación */}
      {images.length > 1 && (
        <div
          className="absolute flex gap-2"
          style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === current ? 'var(--green)' : 'rgba(255,255,255,0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ─── Hero principal ───────────────────────────────────────────────────────────
export default function HeroSection() {
  const { get } = useContenido()

  const kicker    = get('hero_kicker',     'Inversión inmobiliaria · Chile & el mundo')
  const titulo1   = get('hero_titulo_1',   'Tu socio')
  const titulo2   = get('hero_titulo_2',   'en bienes')
  const titulo3   = get('hero_titulo_3',   'raíces')
  const subtitulo = get('hero_subtitulo',  'Más de 15 años conectando personas con oportunidades inmobiliarias en Chile y el extranjero. Financiamiento sin pagos adelantados.')
  const location  = get('hero_location',   'Las Condes · Santiago · Chile')
  const statProp  = Number(get('stats_propiedades', '120'))
  const statAnios = Number(get('stats_anios',        '15'))
  const statPais  = Number(get('stats_paises',       '10'))

  // Fotos del carrusel — hero_imagen_url_1 hasta hero_imagen_url_5
  // También acepta el campo original hero_imagen_url como primera imagen
  const heroImages = [
    get('hero_imagen_url',   ''),
    get('hero_imagen_url_2', ''),
    get('hero_imagen_url_3', ''),
    get('hero_imagen_url_4', ''),
    get('hero_imagen_url_5', ''),
  ]

  const heroPositions = [
    get('hero_pos_1', 'center center'),
    get('hero_pos_2', 'center center'),
    get('hero_pos_3', 'center center'),
    get('hero_pos_4', 'center center'),
    get('hero_pos_5', 'center center'),
  ]

  // Solo las fotos que tienen URL, con sus posiciones correspondientes
  const filled = heroImages.reduce<{ img: string; pos: string }[]>((acc, img, i) => {
    if (img) acc.push({ img, pos: heroPositions[i] })
    return acc
  }, [])

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: 'calc(100vh - 64px)', minHeight: 540, maxHeight: 920 }}
    >
      <HeroCarousel images={filled.map(f => f.img)} positions={filled.map(f => f.pos)} />

      <div
        className="absolute inset-0"
        style={{
          background: filled.length > 0
            ? 'linear-gradient(100deg,rgba(8,24,40,0.82) 0%,rgba(8,24,40,0.5) 55%,rgba(8,24,40,0.12) 100%)'
            : 'none',
          zIndex: 3,
        }}
      />

      {/* Contenido encima de todo */}
      <div className="relative h-full flex flex-col justify-between px-8 lg:px-16 py-12 lg:py-14" style={{ zIndex: 4 }}>

        {/* Kicker */}
        <div className="flex items-start gap-3" style={{ fontSize: 11, fontWeight: 400, letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--green)' }}>
          <span style={{ width: 28, minWidth: 28, height: 1, background: 'var(--green)', display: 'inline-block', marginTop: 6 }} />
          <span>
            Inversión inmobiliaria<br />
            Chile &amp; el mundo
          </span>
        </div>

        {/* Headline */}
        <div>
          <div className="font-serif" style={{ fontSize: 'clamp(52px,6.5vw,88px)', fontWeight: 300, lineHeight: 1.03, letterSpacing: '-1.5px', color: '#fff' }}>
            <span style={{ display: 'block' }}>{titulo1}</span>
            <span style={{ display: 'block' }}>
              {titulo2.startsWith('en ') ? (
                <>en <em style={{ fontStyle: 'italic', color: 'var(--sky)' }}>{titulo2.replace('en ', '')}</em></>
              ) : (
                <em style={{ fontStyle: 'italic', color: 'var(--sky)' }}>{titulo2}</em>
              )}
            </span>
            <span style={{ display: 'block', fontWeight: 600 }}>{titulo3}</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 300, color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid var(--green)', paddingLeft: 16, maxWidth: 460, lineHeight: 1.85, marginTop: 24 }}>
            {subtitulo}
          </p>
        </div>

        {/* Stats + location */}
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div className="flex gap-12">
            <AnimatedStat n={statProp}  unit="+" label="Propiedades" />
            <AnimatedStat n={statAnios} unit="+" label="Años" />
            <AnimatedStat n={statPais}  unit="+" label="Países" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--green)' }} />
              <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                {location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
