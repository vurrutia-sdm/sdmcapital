import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, ChevronDown } from 'lucide-react'

const SERVICES = [
  { slug: 'inversion-internacional', label: 'Inversión Internacional' },
  { slug: 'inversion-chile',         label: 'Inversión en Chile' },
  { slug: 'financiamiento-personas', label: 'Financiamiento Personas' },
  { slug: 'financiamiento-empresas', label: 'Financiamiento Empresas' },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled]         = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

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
    fontSize: 11, fontWeight: 400, letterSpacing: '1.2px' as const,
    textTransform: 'uppercase' as const, padding: '8px 12px',
    color: active ? 'var(--navy-dark)' : 'var(--muted)',
    textDecoration: 'none', whiteSpace: 'nowrap' as const, transition: 'color 0.2s',
    display: 'inline-block',
  })

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-[0_1px_0_#e8edf2]' : 'bg-white border-b border-[#e8edf2]'}`}>
      <nav className="flex items-center justify-between px-8 lg:px-12 h-16">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3.5 flex-shrink-0">
          <div className="logo-stripes">
            <div className="logo-stripe logo-stripe--sky" />
            <div className="logo-stripe logo-stripe--green" />
            <div className="logo-stripe logo-stripe--navy" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-[22px] font-semibold tracking-[3px]" style={{ color: 'var(--navy-dark)' }}>SDM</span>
            <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: '5px', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2, display: 'block' }}>Capital</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center">
          {[
            { to: '/',             label: 'Inicio' },
            { to: '/quienes-somos',label: 'Quiénes Somos' },
            { to: '/propiedades',  label: 'Propiedades' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={navLinkStyle(isActive(l.to))}
              onMouseEnter={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--navy-dark)' }}
              onMouseLeave={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--muted)' }}
            >{l.label}</Link>
          ))}

          {/* Servicios dropdown — entre Propiedades y Asociados */}
          <div className="relative" onMouseEnter={() => setServicesOpen(true)} onMouseLeave={() => setServicesOpen(false)}>
            <Link to="/servicios" style={{ ...navLinkStyle(isActive('/servicios')), display: 'flex', alignItems: 'center', gap: 4 }}>
              Servicios
              <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </Link>
            {servicesOpen && (
              <div className="absolute top-full left-0 bg-white border border-[#e8edf2] shadow-lg py-2 z-50" style={{ width: 240, borderRadius: 2 }}>
                {SERVICES.map(s => (
                  <Link key={s.slug} to={`/servicios/${s.slug}`} style={{ display: 'block', padding: '10px 20px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--navy-dark)'; e.currentTarget.style.background = 'var(--off)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent' }}
                  >{s.label}</Link>
                ))}
              </div>
            )}
          </div>

          {[
            { to: '/asociados', label: 'Asociados' },
            { to: '/blog',      label: 'Blog' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={navLinkStyle(isActive(l.to))}
              onMouseEnter={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--navy-dark)' }}
              onMouseLeave={e => { if (!isActive(l.to)) e.currentTarget.style.color = 'var(--muted)' }}
            >{l.label}</Link>
          ))}

          <button onClick={handleContacto}
            style={{ fontSize: 11, fontWeight: 400, letterSpacing: '1.2px', textTransform: 'uppercase', padding: '8px 12px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy-dark)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
          >Contacto</button>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden p-2" onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#e8edf2] px-8 py-6 flex flex-col gap-5">
          {[
            { to: '/', label: 'Inicio' },
            { to: '/quienes-somos', label: 'Quiénes Somos' },
            { to: '/servicios', label: 'Servicios' },
            { to: '/propiedades', label: 'Propiedades' },
            { to: '/asociados', label: 'Asociados' },
            { to: '/blog', label: 'Blog' },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{ fontSize: 14, fontWeight: 300, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
          <button onClick={handleContacto} style={{ fontSize: 14, fontWeight: 300, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
            Contacto
          </button>
        </div>
      )}
    </header>
  )
}
