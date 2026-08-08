import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const SERVICES = [
  { slug: 'financiamiento-personas', label: 'Financiamiento Personas' },
  { slug: 'financiamiento-empresas', label: 'Financiamiento Empresas' },
  { slug: 'inversion-internacional', label: 'Inversión Internacional' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [servicesOpen, setServicesOpen]     = useState(false)
  const [propiedadesOpen, setPropiedadesOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location])

  // Escape cierra el desplegable que esté abierto. Sin esto, quien abre un menú
  // con teclado no tiene forma de cerrarlo sin activar una de sus opciones.
  useEffect(() => {
    if (!servicesOpen && !propiedadesOpen && !mobileOpen) return
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setServicesOpen(false); setPropiedadesOpen(false); setMobileOpen(false)
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [servicesOpen, propiedadesOpen, mobileOpen])

  // Los disparadores de los desplegables son <button aria-expanded>, no <Link>.
  // Con onMouseEnter solamente, sus opciones ni siquiera llegaban a renderizarse
  // para un usuario de teclado. El hover se conserva para el ratón: entrar y
  // salir sigue abriendo y cerrando, y ahora además abre el clic, Enter y
  // Espacio, que un <button> trae sin código.
  //
  // `color: 'inherit'` reproduce exactamente lo que se veía: los <Link> de estos
  // dos NO llevaban `navLinkClass`, a diferencia del resto de la navegación, así
  // que heredaban `--ink` y salían más oscuros que sus vecinos. Un <button> no
  // hereda el color —el navegador le pone `buttontext`—, así que hay que
  // pedírselo. La inconsistencia se conserva a propósito: normalizarla sería un
  // cambio de diseño, y esta tanda es de teclado.
  const estiloDisparador = (active: boolean) => ({
    ...navLinkStyle(active), display: 'flex', alignItems: 'center', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    color: 'inherit',
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

  const navLinkStyle = (active: boolean) => ({
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
            <Link key={l.to} to={l.to} className={navLinkClass(isActive(l.to))} style={navLinkStyle(isActive(l.to))}
            >{l.label}</Link>
          ))}

          {/* Propiedades Usadas dropdown */}
          <div className="relative" onMouseEnter={() => setPropiedadesOpen(true)} onMouseLeave={() => setPropiedadesOpen(false)}>
            <button type="button"
              aria-expanded={propiedadesOpen}
              onClick={() => setPropiedadesOpen(v => !v)}
              style={estiloDisparador(isActive('/propiedades-usadas'))}>
              Propiedades Usadas
              <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: propiedadesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {propiedadesOpen && (
              <div className="absolute top-full left-0 bg-white border border-[#e8edf2] shadow-lg py-2 z-50" style={{ width: 200, borderRadius: 2 }}>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades-usadas?estado=en_venta" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >En Venta</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades-usadas?estado=en_arriendo" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >En Arriendo</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/propiedades-usadas" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none' }}
                >Ver todas</Link>
                <Link className="text-sdm-sm text-[var(--muted)] hover:text-[var(--navy-dark)] hover:bg-[var(--off)]" to="/vende-con-nosotros" style={{ display: 'block', padding: '10px 20px', fontWeight: 300, textDecoration: 'none', borderTop: '1px solid #e8edf2', marginTop: 4 }}
                >Vende con nosotros</Link>
              </div>
            )}
          </div>

          {/* Proyectos Nuevos */}
          <Link to="/proyectos-nuevos" className={navLinkClass(isActive('/proyectos-nuevos'))} style={navLinkStyle(isActive('/proyectos-nuevos'))}
          >Proyectos Nuevos</Link>

          {/* Servicios dropdown — entre Propiedades y Asociados */}
          <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <button type="button"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen(v => !v)}
              style={estiloDisparador(isActive('/servicios'))}>
              Servicios
              <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#e8edf2] px-8 py-6 flex flex-col gap-5">
          {[
            { to: '/', label: 'Inicio' },
            { to: '/quienes-somos', label: 'Quiénes Somos' },
          ].map(l => (
            <Link className="text-sdm-base tracking-sdm-wide" key={l.to} to={l.to} style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}

          {/* Propiedades Usadas */}
          <Link className="text-sdm-base tracking-sdm-wide" to="/propiedades-usadas" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
            Propiedades Usadas
          </Link>
          <Link className="text-sdm-sm tracking-sdm-wide" to="/propiedades-usadas?estado=en_venta" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            En Venta
          </Link>
          <Link className="text-sdm-sm tracking-sdm-wide" to="/propiedades-usadas?estado=en_arriendo" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            En Arriendo
          </Link>
          {/* Faltaba: en móvil no había forma de llegar a «Vende con nosotros»
              ni a las tres páginas de servicios desde el header. */}
          <Link className="text-sdm-sm tracking-sdm-wide" to="/vende-con-nosotros" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
            Vende con nosotros
          </Link>

          {/* Proyectos Nuevos */}
          <Link className="text-sdm-base tracking-sdm-wide" to="/proyectos-nuevos" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
            Proyectos Nuevos
          </Link>

          <Link className="text-sdm-base tracking-sdm-wide" to="/servicios" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
            Servicios
          </Link>
          {SERVICES.map(s => (
            <Link className="text-sdm-sm tracking-sdm-wide" key={s.slug} to={`/servicios/${s.slug}`} style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', paddingLeft: 16 }}>
              {s.label}
            </Link>
          ))}

          <Link className="text-sdm-base tracking-sdm-wide" to="/rental" style={{ fontWeight: 300, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
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
