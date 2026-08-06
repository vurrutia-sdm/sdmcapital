import { Link } from 'react-router-dom'
import { useContenido } from '@/hooks/useContenido'

const SOCIALS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/sdmcapitalrestate',
    path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
    filled: false,
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/sdmcapital',
    path: '',
    filled: false,
    custom: true,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@sdmcapital_realestate',
    path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.12a8.16 8.16 0 004.77 1.52V7.18a4.85 4.85 0 01-1-.49z',
    filled: true,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/sdmcapital/',
    path: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z',
    filled: false,
    circle: true,
  },
]

function SocialIcon({ s, size = 13 }: { s: typeof SOCIALS[0]; size?: number }) {
  if (s.custom) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[#7a8a96] group-hover:text-white transition-colors">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="text-[#7a8a96] group-hover:text-white transition-colors">
      <path d={s.path} stroke={s.filled ? undefined : 'currentColor'} fill={s.filled ? 'currentColor' : undefined} strokeWidth={s.filled ? undefined : '1.5'} strokeLinecap="round" strokeLinejoin="round"/>
      {s.circle && <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>}
    </svg>
  )
}

export default function Footer() {
  const { get } = useContenido()

  return (
    <footer className="bg-white border-t border-[#e8edf2]">
      <div className="px-8 lg:px-12 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-[#e8edf2] mb-6">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="logo-stripes">
                <div className="logo-stripe logo-stripe--sky" />
                <div className="logo-stripe logo-stripe--green" />
                <div className="logo-stripe logo-stripe--navy" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[20px] font-semibold tracking-[3px]" style={{ color: 'var(--navy-dark)' }}>SDM</span>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2, display: 'block' }}>Capital</span>
              </div>
            </div>
            <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.9, color: 'var(--muted)', maxWidth: 220 }}>
              {get('footer_tagline', 'Tu socio confiable en el mundo de los bienes raíces.')}
            </p>
          </div>

          {/* Navegación */}
          <div>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 20 }}>
              Navegación
            </div>
            {[
              { to: '/',              label: 'Inicio' },
              { to: '/quienes-somos', label: 'Quiénes Somos' },
              { to: '/propiedades',   label: 'Propiedades' },
              { to: '/blog',          label: 'Blog' },
              { to: '/rental',        label: 'SDM Rental' },
              { to: '/vende-con-nosotros', label: 'Vende con nosotros' },
              { to: 'https://www.flow.cl/uri/gHSdT2jVv', label: 'Reserva tu propiedad', external: true },
            ].map(l => l.external ? (
              <a className="text-sdm-base tracking-sdm-wide" key={l.to} href={l.to} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', fontWeight: 300, marginBottom: 10, color: 'var(--navy-dark)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--navy-dark)')}
              >{l.label}</a>
            ) : (
              <Link className="text-sdm-base" key={l.to} to={l.to} style={{ display: 'block', fontWeight: 300, marginBottom: 10, color: 'var(--muted)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy-dark)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >{l.label}</Link>
            ))}
          </div>

          {/* Servicios */}
          <div>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 20 }}>
              Servicios
            </div>
            {[
              { to: '/servicios/financiamiento-personas', label: 'Financiamiento Personas' },
              { to: '/servicios/financiamiento-empresas', label: 'Financiamiento Empresas' },
              { to: '/servicios/inversion-internacional', label: 'Inversión Internacional' },
            ].map(l => (
              <Link className="text-sdm-base" key={l.to} to={l.to} style={{ display: 'block', fontWeight: 300, marginBottom: 10, color: 'var(--muted)', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy-dark)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >{l.label}</Link>
            ))}
          </div>

          {/* Síguenos */}
          <div>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--navy-dark)', marginBottom: 20 }}>
              Síguenos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'nowrap' }}>
                  <div style={{ width: 32, height: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e8edf2', borderRadius: '50%' }}>
                    <SocialIcon s={s} />
                  </div>
                  <span className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {s.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)', textAlign: 'center' }}>
            © 2026 SDM Capital · Todos los derechos reservados · Diseño{' '}
            <a href="https://haikuflow.com" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >HaikuFlow.com</a>
            {' '}·{' '}
            <Link to="/politica-de-privacidad"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >Política de Privacidad</Link>
            {' '}·{' '}
            <Link to="/condiciones-del-servicio"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >Condiciones del Servicio</Link>
            {' '}·{' '}
            <Link to="/eliminacion-de-datos"
              style={{ color: 'var(--muted)', textDecoration: 'none', fontWeight: 400 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >Eliminación de Datos</Link>
          </p>
          <p className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 300, color: 'var(--border)', textTransform: 'uppercase', textAlign: 'center' }}>
            Las Condes · Santiago · Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
