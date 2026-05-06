import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import type { Propiedad } from '@/types'

// Gradient backgrounds for placeholder images
const GRADIENTS = [
  'linear-gradient(140deg,#1C3D5C,#0F2535)',
  'linear-gradient(140deg,#1a3528,#0d2518)',
  'linear-gradient(140deg,#252535,#151525)',
  'linear-gradient(140deg,#351a1a,#200d0d)',
  'linear-gradient(140deg,#1a2535,#0d1a28)',
  'linear-gradient(140deg,#2a1a35,#1a0d28)',
]

interface Props {
  propiedad: Propiedad
  index?: number
}

export default function PropertyCard({ propiedad, index = 0 }: Props) {
  const { t, lang } = useLang()
  const p = t.prop

  // Solo mostrar badge cuando hay info útil: vendida o reservada
  const badge = propiedad.estado === 'vendida'
    ? { label: 'Vendida', style: { background: '#888', color: '#fff' } }
    : propiedad.estado === 'reservada'
    ? { label: 'Reservada', style: { background: 'var(--navy)', color: 'var(--sky)' } }
    : propiedad.baja_precio
    ? { label: 'Precio rebajado', style: { background: '#c0392b', color: '#fff' } }
    : propiedad.bono_pie
    ? { label: `Bono Pie${propiedad.bono_pie_porcentaje ? ` ${propiedad.bono_pie_porcentaje}%` : ''}`, style: { background: 'var(--green)', color: '#fff' } }
    : null

  const priceDisplay = propiedad.a_consultar
    ? p.aConsultar
    : propiedad.precio_uf
    ? `UF ${propiedad.precio_uf.toLocaleString('es-CL')}`
    : propiedad.precio_clp
    ? `$ ${(propiedad.precio_clp as number).toLocaleString('es-CL')}`
    : propiedad.precio_usd
    ? `USD ${propiedad.precio_usd.toLocaleString()}`
    : '—'

  const priceLabel = propiedad.estado === 'en_arriendo' ? p.enArriendo : null

  const titulo = lang === 'en' && propiedad.titulo_en ? propiedad.titulo_en : propiedad.titulo

  return (
    <Link
      to={`/propiedades/${propiedad.id}`}
      className="group block bg-white overflow-hidden"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 210 }}>
        {(() => {
          const imgSrc = propiedad.imagen_principal || propiedad.imagenes?.[0] || ''
          return (
            <div
              className="w-full h-full transition-transform duration-500 group-hover:scale-[1.03] flex items-center justify-center"
              style={{ background: imgSrc ? undefined : GRADIENTS[index % GRADIENTS.length] }}
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={titulo}
                  loading="lazy"
                  decoding="async"
                  style={{ objectFit: 'cover', objectPosition: 'center center', display: 'block', width: '100%', height: '100%' }}
                />
              ) : (
                <span className="font-serif italic" style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)' }}>
                  {propiedad.tipo} · {propiedad.comuna}
                </span>
              )}
            </div>
          )
        })()}

        {/* Badge — solo vendida, reservada o baja de precio */}
        {badge && (
          <div className="absolute top-3.5 left-3.5 text-[13px] font-normal tracking-[2px] uppercase px-2.5 py-1" style={{ ...badge.style, borderRadius: 1 }}>
            {badge.label}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 lg:p-6">
        <div className="font-serif mb-1.5" style={{ fontSize: 21, fontWeight: 300, color: 'var(--navy-dark)', lineHeight: 1 }}>
          {priceDisplay}
          {priceLabel && (
            <small className="font-sans ml-1.5" style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {priceLabel}
            </small>
          )}
        </div>
        {/* Precio anterior tachado */}
        {propiedad.baja_precio && propiedad.precio_anterior_uf && (
          <div style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 4 }}>
            Antes: UF {propiedad.precio_anterior_uf.toLocaleString('es-CL')}
          </div>
        )}
        <div className="font-sans font-light leading-[1.5] mb-2.5" style={{ fontSize: 15, color: 'var(--ink)' }}>
          {titulo}
        </div>
        <div
          className="font-sans font-light tracking-[1px] uppercase flex items-center gap-1.5 mb-3.5"
          style={{ fontSize: 15, color: 'var(--muted)' }}
        >
          <span style={{ width: 12, height: 1, background: 'var(--muted)', display: 'inline-block' }} />
          {propiedad.comuna} · {propiedad.region}
        </div>
        <div className="flex gap-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {propiedad.dormitorios !== undefined && (
            <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block" style={{ fontSize: 17, fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.dormitorios || '—'}
              </strong>
              {p.dormitorios}
            </div>
          )}
          {propiedad.banos !== undefined && (
            <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block" style={{ fontSize: 17, fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.banos || '—'}
              </strong>
              {p.banos}
            </div>
          )}
          {propiedad.superficie_total !== undefined && (
            <div style={{ fontSize: 13, fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block" style={{ fontSize: 17, fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.superficie_total || '—'}
              </strong>
              {p.superficie}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
