import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useContenido } from '@/hooks/useContenido'

// ─── Contador animado ─────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    // Con «reduce», el número aparece directo. Contar de 0 a 120 es movimiento
    // igual que rotar una foto, y acá además el dato tarda 1,8s en ser legible.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
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
      <div className="font-serif text-sdm-display-md" style={{ fontWeight: 300, color: '#fff' }}>
        {count}<span className="text-sdm-display-sm" style={{ color: 'var(--green)' }}>{unit}</span>
      </div>
      <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
        {label}
      </div>
    </div>
  )
}

// ─── Carrusel de fotos ────────────────────────────────────────────────────────
const INTERVAL_MS = 5000 // Cambia cada 5 segundos

function HeroCarousel({ images, positions }: { images: string[]; positions: string[] }) {
  const [current, setCurrent] = useState(0)
  // 2.2.2 pide poder detener cualquier movimiento automático que dure más de 5
  // segundos. Este rota indefinidamente, así que necesita un control explícito.
  // Nace pausado si el sistema pide menos movimiento — ver el efecto de abajo.
  const [pausado, setPausado] = useState(false)
  const [prev, setPrev] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  // `prefers-reduced-motion: reduce` significa «no me muevas cosas sin que yo
  // lo pida». La rotación automática arranca detenida; los puntos y el botón
  // siguen funcionando, así que no se pierde ninguna foto.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const aplicar = () => setPausado(mq.matches)
    aplicar()
    mq.addEventListener('change', aplicar)
    return () => mq.removeEventListener('change', aplicar)
  }, [])

  useEffect(() => {
    if (images.length < 2 || pausado) return
    const timer = setInterval(() => {
      setPrev(current)
      setTransitioning(true)
      setCurrent(c => (c + 1) % images.length)
      // Limpiar prev después de la transición
      setTimeout(() => { setPrev(null); setTransitioning(false) }, 1200)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [images.length, current, pausado])

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
          className="absolute flex items-center"
          /* 18px entre puntos por 2.5.8: con 8px el paso era 16 y los círculos de
             24px se cortaban. Ahora 26. El punto sigue midiendo 8px. */
          style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10, gap: 18 }}
        >
          {/* El control de 2.2.2. Va junto a los puntos, que cambian de foto
              pero NO detienen la rotación: sin esto no había forma de pararla. */}
          <button
            type="button"
            onClick={() => setPausado(p => !p)}
            aria-label={pausado ? 'Reanudar el cambio automático de fotos' : 'Pausar el cambio automático de fotos'}
            className="area-44"
            style={{ width: 22, height: 22, marginRight: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(15,37,53,0.55)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', padding: 0 }}
          >
            {pausado ? <Play aria-hidden="true" size={10} fill="currentColor" /> : <Pause aria-hidden="true" size={10} fill="currentColor" />}
          </button>
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
        <div className="flex items-start gap-3 text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--green)' }}>
          <span style={{ width: 28, minWidth: 28, height: 1, background: 'var(--green)', display: 'inline-block', marginTop: 6 }} />
          <span>
            Inversión inmobiliaria<br />
            Chile &amp; el mundo
          </span>
        </div>

        {/* Headline */}
        <div>
          {/* El <h1> de la home. Las tres claves de contenido_sitio van dentro
              de UNO solo, no en tres encabezados: son una sola frase partida en
              renglones. El reset de Tailwind deja los encabezados en
              `font-size: inherit` y sin margen, así que el estilo es el mismo
              que tenía el <div>. */}
          <h1 className="font-serif tracking-sdm-tight" style={{ fontSize: 'clamp(52px,6.5vw,88px)', fontWeight: 300, lineHeight: 1.03, color: '#fff' }}>
            <span style={{ display: 'block' }}>{titulo1}</span>
            <span style={{ display: 'block' }}>
              {titulo2.startsWith('en ') ? (
                <>en <em style={{ fontStyle: 'italic', color: 'var(--sky)' }}>{titulo2.replace('en ', '')}</em></>
              ) : (
                <em style={{ fontStyle: 'italic', color: 'var(--sky)' }}>{titulo2}</em>
              )}
            </span>
            <span style={{ display: 'block', fontWeight: 600 }}>{titulo3}</span>
          </h1>
          <p className="text-sdm-base" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.8)', borderLeft: '2px solid var(--green)', paddingLeft: 16, maxWidth: 460, lineHeight: 1.85, marginTop: 24 }}>
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
              <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                {location}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
