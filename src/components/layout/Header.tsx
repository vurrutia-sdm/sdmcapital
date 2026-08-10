import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCerrarConEscape } from '@/hooks/useCerrarConEscape'
import { useBloquearScroll } from '@/hooks/useBloquearScroll'
import { obtenerIndicadores, formatear, fechaCorta } from '@/lib/indicadores'
import type { Indicador, Indicadores } from '@/lib/indicadores'
import { Menu, X, ChevronDown } from 'lucide-react'

const SERVICES = [
  { slug: 'financiamiento-personas', label: 'Financiamiento Personas' },
  { slug: 'financiamiento-empresas', label: 'Financiamiento Empresas' },
  { slug: 'inversion-internacional', label: 'Inversión Internacional' },
]

// Barra de indicadores del header. Ver `src/lib/indicadores.ts`.
//
// VA DENTRO DEL HEADER Y NO ENCIMA. El header es `fixed top-0`; una barra por
// encima obligaría a recalcular el desplazamiento del contenido en todas las
// rutas y a tocar el `sticky` del admin, que es zona compartida. Como segunda
// línea del propio header crece con su contenido y no hay offset que ajustar.
//
// RESERVA SU ALTO DESDE EL PRIMER FRAME con guiones. Si apareciera al llegar el
// dato empujaría el contenido hacia abajo y sumaría CLS: la barra existe desde
// el primer pintado y lo único que cambia es el texto de dentro.
//
// LA PETICIÓN NO BLOQUEA EL PINTADO: sale en un `useEffect`, después del primer
// render, y si falla se queda en guiones. Nunca un cero ni un valor de ayer.
// El número, no su rótulo, es el dato. Blanco sobre `--navy-dark` da 15,71:1
// contra los 8,68:1 del rótulo en `--sky`, y el peso medio lo separa sin
// necesidad de subir el tamaño.
function Cifra({ children }: { children: React.ReactNode }) {
  return <span style={{ color: '#fff', fontWeight: 'var(--sdm-peso-medio)', letterSpacing: 'var(--sdm-tracking-normal)' }}>{children}</span>
}

function BarraIndicadores() {
  const [ind, setInd] = useState<Indicadores>({ uf: null, dolar: null })

  useEffect(() => { obtenerIndicadores().then(setInd) }, [])

  const hoy = new Date()
  const hoyISO = hoy.toISOString().slice(0, 10)
  const hoyTexto = hoy.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  // CADA INDICADOR CON SU FECHA, NO CON LA DE HOY. El dólar observado no se
  // publica fines de semana ni festivos: un domingo la UF es de hoy y el dólar
  // del viernes. Se anota «(al 7 ago)» SOLO cuando la fecha del indicador no es
  // la de hoy, así que en un día hábil normal la barra queda limpia y el aviso
  // aparece justo cuando hace falta.
  const sufijo = (i: Indicador | null) =>
    i && i.fecha && i.fecha.slice(0, 10) !== hoyISO ? ` (al ${fechaCorta(i.fecha)})` : ''

  return (
    /* FONDO --navy-dark, Y SE DESCARTÓ --off CON UNA MEDICIÓN.
       Compartiendo el blanco y el `--muted` del navbar, la barra se leía como
       una segunda fila de menú. `--off` contra blanco da 1,05:1 —medido— y a
       esa distancia el ojo no registra dos superficies: habría dejado el mismo
       problema con una línea más. `--navy-dark` sí separa, y es la superficie
       que el sistema ya usa para decir «esto es otra banda».

       Y TRATAMIENTO TIPOGRÁFICO PROPIO, que es la mitad del arreglo. Un menú es
       una fila de textos del mismo peso y color; en cuanto el número pesa más
       que su rótulo deja de leerse como enlace. Los rótulos van en `--sky` y
       los números en blanco con `--sdm-peso-medio`.

       Los números salen de `tracking-sdm-wide`: la separación amplia ayuda a
       leer una palabra en versalitas y estorba en una cifra, donde separa los
       dígitos de sus propios miles.

       Mismo alto de 26px: no crece. */
    <div
      className="hidden md:flex items-center justify-end gap-4 px-8 lg:px-12 text-sdm-xs tracking-sdm-wide"
      style={{ height: 26, background: 'var(--navy-dark)', color: 'var(--sky)', textTransform: 'uppercase' }}
    >
      <span>{hoyTexto}</span>
      <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
      <span>UF <Cifra>{ind.uf ? formatear(ind.uf.valor) : '—'}</Cifra>{sufijo(ind.uf)}</span>
      <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
      <span>Dólar <Cifra>{ind.dolar ? formatear(ind.dolar.valor) : '—'}</Cifra>{sufijo(ind.dolar)}</span>
    </div>
  )
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [servicesOpen, setServicesOpen]     = useState(false)
  const [propiedadesOpen, setPropiedadesOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location])

  // Escape cierra el desplegable que esté abierto. Sin esto, quien abre un menú
  // con teclado no tiene forma de cerrarlo sin activar una de sus opciones.
  //
  // El efecto que vivía acá fue el ORIGEN de `useCerrarConEscape`, y ahora lo
  // consume: eran dos implementaciones del mismo comportamiento —ésta y la que
  // le faltaba al buscador— y mantener dos es cómo se acaba arreglando una sola.
  //
  // SIN `disparador`: los tres desplegables se cierran con la misma pulsación,
  // así que no hay un único elemento al que devolver el foco. El navegador lo
  // deja donde estaba, que acá es lo correcto — el <button> que abre el menú no
  // se desmonta al cerrarse, a diferencia de los paneles del buscador.
  const cerrarMenus = useCallback(() => {
    setServicesOpen(false); setPropiedadesOpen(false); setMobileOpen(false)
  }, [])
  useCerrarConEscape(servicesOpen || propiedadesOpen || mobileOpen, cerrarMenus)

  // Con el menú móvil abierto, la página de detrás no se desplaza.
  //
  // POR QUÉ ESTO SÍ Y `useDialogoModal` NO. La auditoría pedía «atrapar el foco»,
  // y ese hook lo hace — pero está escrito para un `role="dialog"` con
  // `aria-modal="true"`, y este menú no es ninguna de las dos cosas: es un
  // disclosure, un panel que cuelga de un <button aria-expanded>. Atrapar el Tab
  // sin declarar `aria-modal` deja al lector de pantalla anunciando una lista de
  // enlaces normal mientras el Tab, en silencio, no deja salir de ella. Y su
  // Escape (captura + stopPropagation) duplicaría el de `useCerrarConEscape`.
  //
  // Convertir el menú en diálogo de verdad —role, aria-modal, título accesible—
  // es un cambio de estructura, no el arreglo que describe la auditoría, así que
  // queda anotado ahí en vez de improvisado acá.
  //
  // `useBloquearScroll` sí encaja tal cual y resuelve la mitad concreta del
  // problema: el panel tapa la página y hasta ahora se podía desplazar por
  // debajo de él.
  useBloquearScroll(mobileOpen)

  // Los disparadores de los desplegables son <button aria-expanded>, no <Link>.
  // Con onMouseEnter solamente, sus opciones ni siquiera llegaban a renderizarse
  // para un usuario de teclado. El hover se conserva para el ratón: entrar y
  // salir sigue abriendo y cerrando, y ahora además abre el clic, Enter y
  // Espacio, que un <button> trae sin código.
  //
  // Estos dos NO llevaban `navLinkClass` a diferencia del resto de la
  // navegación: heredaban `--ink` y salían más oscuros que sus vecinos. La tanda
  // de teclado conservó la diferencia a propósito —era de diseño, no de
  // teclado— y se arregla ahora: los siete enlaces usan la misma clase, así que
  // comparten color, hover y estado activo sin excepciones.
  //
  // Sin `color` en el objeto de estilo: lo pone `navLinkClass`, y un inline
  // ganaría sobre la clase y volvería a dejar el hover sin efecto.
  const estiloDisparador = () => ({
    ...navLinkStyle(), display: 'flex', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  })

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const handleContacto = () => {
    if (location.pathname === '/') {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  // SIN PARÁMETRO. Recibía `active` y lo ignoraba desde que el color se movió a
  // `navLinkClass` —por la trampa 5.1, un inline gana sobre la clase y dejaba el
  // hover sin efecto—. Las seis llamadas seguían pasándolo, lo que hacía creer
  // que el estilo dependía del estado activo cuando ya no.
  const navLinkStyle = () => ({
    fontSize: 'var(--sdm-text-xs)', fontWeight: 400, letterSpacing: 'var(--sdm-tracking-wide)' as const,
    textTransform: 'uppercase' as const, padding: '8px 12px',
    textDecoration: 'none', whiteSpace: 'nowrap' as const, transition: 'color 0.2s',
    display: 'inline-block',
  })
  // El color va en clase y no en el style: el inline gana sobre las clases y no
  // dejaria actuar al hover:. El enlace activo no lleva hover, igual que antes.
  const navLinkClass = (active: boolean) =>
    active ? 'text-[var(--navy-dark)]' : 'text-[var(--muted)] hover:text-[var(--navy-dark)]'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e8edf2]">
      <nav className="flex items-center justify-between px-8 lg:px-12 h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3.5 flex-shrink-0 area-44">
          <div className="logo-stripes">
            <div className="logo-stripe logo-stripe--sky" />
            <div className="logo-stripe logo-stripe--green" />
            <div className="logo-stripe logo-stripe--navy" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[22px] font-semibold tracking-[3px]" style={{ color: 'var(--navy-dark)' }}>SDM</span>
            <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2, display: 'block' }}>Capital</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          {[
            { to: '/',             label: 'Inicio' },
            { to: '/quienes-somos',label: 'Quiénes Somos' },
            { to: '/rental',       label: 'SDM Rental' },
          ].map(l => (
            <Link key={l.to} to={l.to} className={navLinkClass(isActive(l.to))} style={navLinkStyle()}
            >{l.label}</Link>
          ))}

          {/* Propiedades Usadas dropdown */}
          <div className="relative" onMouseEnter={() => setPropiedadesOpen(true)} onMouseLeave={() => setPropiedadesOpen(false)}>
            <button type="button"
              aria-expanded={propiedadesOpen}
              onClick={() => setPropiedadesOpen(v => !v)}
              className={navLinkClass(isActive('/propiedades'))}
              style={estiloDisparador()}>
              Propiedades
              <ChevronDown aria-hidden="true" size={11} style={{ transition: 'transform 0.2s', transform: propiedadesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {propiedadesOpen && (
              <div className="absolute top-full left-0 bg-white border border-[#e8edf2] shadow-lg py-2 z-50" style={{ width: 200, borderRadius: 2 }}>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades?estado=en_venta" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >En Venta</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades?estado=en_arriendo" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >En Arriendo</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >Ver todas</Link>
                {/* La ruta de categoría sigue accesible, ahora dicha por su
                    nombre y como pareja de «Proyectos Nuevos». */}
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades-usadas" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >Solo usadas</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/vende-con-nosotros" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none', borderTop: '1px solid #e8edf2', marginTop: 4 }}
                >Vende con nosotros</Link>
              </div>
            )}
          </div>

          {/* Proyectos Nuevos */}
          <Link to="/proyectos-nuevos" className={navLinkClass(isActive('/proyectos-nuevos'))} style={navLinkStyle()}
          >Proyectos Nuevos</Link>

          {/* Servicios dropdown — entre Propiedades y Asociados */}
          <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <button type="button"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen(v => !v)}
              className={navLinkClass(isActive('/servicios'))}
              style={estiloDisparador()}>
              Servicios
              <ChevronDown aria-hidden="true" size={11} style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {servicesOpen && (
              <div className="absolute top-full left-0 bg-white border border-[#e8edf2] shadow-lg py-2 z-50" style={{ width: 240, borderRadius: 2 }}>
                {SERVICES.map(s => (
                  <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" key={s.slug} to={`/servicios/${s.slug}`} style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                  >{s.label}</Link>
                ))}
                {/* El disparador dejó de ser un enlace, así que /servicios se
                    quedaba sin destino desde el header. Va acá, igual que «Ver
                    todas» en el desplegable de Propiedades. */}
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/servicios" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none', borderTop: '1px solid #e8edf2', marginTop: 4 }}
                >Ver todos los servicios</Link>
              </div>
            )}
          </div>

          <button className="text-sdm-xs tracking-sdm-wide text-[var(--muted)] hover:text-[var(--navy-dark)]" onClick={handleContacto}
            style={{ fontWeight: 400, textTransform: 'uppercase', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >Contacto</button>
        </div>

        {/* Mobile toggle */}
        <button type="button" className="lg:hidden p-2 area-44"
          aria-label={mobileOpen ? 'Cerrar el menú' : 'Abrir el menú'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </button>
      </nav>

        <BarraIndicadores />

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#e8edf2] px-8 py-6 flex flex-col gap-5">
          {/* `navLinkClass` TAMBIÉN ACÁ. Los catorce enlaces del menú móvil iban
              en `--muted`, así que en el teléfono no había forma de saber en qué
              página estabas — la navegación de escritorio sí lo distingue desde
              siempre con `--navy-dark`. La función ya existía; solo no se estaba
              usando. El `color` sale del `style` inline por la trampa 5.1: un
              inline ganaría sobre la clase y anularía tanto el estado activo
              como el hover. */}
          {[
            { to: '/', label: 'Inicio' },
            { to: '/quienes-somos', label: 'Quiénes Somos' },
          ].map(l => (
            <Link className={`text-sdm-base tracking-sdm-wide ${navLinkClass(isActive(l.to))}`} key={l.to} to={l.to} style={{ fontWeight: 300, textTransform: 'uppercase', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}

          {/* Propiedades */}
          <Link className={`text-sdm-base tracking-sdm-wide ${navLinkClass(isActive('/propiedades'))}`} to="/propiedades" style={{ fontWeight: 300, textTransform: 'uppercase', textDecoration: 'none' }}>
            Propiedades
          </Link>
          <Link className="text-sdm-sm tracking-sdm-wide" to="/propiedades?estado=en_venta" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            En Venta
          </Link>
          <Link className="text-sdm-sm tracking-sdm-wide" to="/propiedades?estado=en_arriendo" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            En Arriendo
          </Link>
          <Link className="text-sdm-sm tracking-sdm-wide" to="/propiedades-usadas" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            Solo usadas
          </Link>
          {/* Faltaba: en móvil no había forma de llegar a «Vende con nosotros»
              ni a las tres páginas de servicios desde el header. */}
          <Link className="text-sdm-sm tracking-sdm-wide" to="/vende-con-nosotros" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            Vende con nosotros
          </Link>

          {/* Proyectos Nuevos */}
          <Link className={`text-sdm-base tracking-sdm-wide ${navLinkClass(isActive('/proyectos-nuevos'))}`} to="/proyectos-nuevos" style={{ fontWeight: 300, textTransform: 'uppercase', textDecoration: 'none' }}>
            Proyectos Nuevos
          </Link>

          <Link className={`text-sdm-base tracking-sdm-wide ${navLinkClass(isActive('/servicios'))}`} to="/servicios" style={{ fontWeight: 300, textTransform: 'uppercase', textDecoration: 'none' }}>
            Servicios
          </Link>
          {SERVICES.map(s => (
            <Link className="text-sdm-sm tracking-sdm-wide" key={s.slug} to={`/servicios/${s.slug}`} style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
              {s.label}
            </Link>
          ))}

          <Link className={`text-sdm-base tracking-sdm-wide ${navLinkClass(isActive('/rental'))}`} to="/rental" style={{ fontWeight: 300, textTransform: 'uppercase', textDecoration: 'none' }}>
            SDM Rental
          </Link>
          <button className="text-sdm-base tracking-sdm-wide" onClick={handleContacto} style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            Contacto
          </button>
        </div>
      )}
    </header>
  )
}
