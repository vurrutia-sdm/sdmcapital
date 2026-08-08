import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import type { Propiedad } from '@/types'
import { thumbUrl } from '@/lib/imagenes'

// Gradient backgrounds for placeholder images
const GRADIENTS = [
  'linear-gradient(140deg,#1C3D5C,#0F2535)',
  'linear-gradient(140deg,#1a3528,#0d2518)',
  'linear-gradient(140deg,#252535,#151525)',
  'linear-gradient(140deg,#351a1a,#200d0d)',
  'linear-gradient(140deg,#1a2535,#0d1a28)',
  'linear-gradient(140deg,#2a1a35,#1a0d28)',
]

const ESTADO_BADGES: Record<string, { label: string; style: { background: string; color: string } }> = {
  vendida:   { label: 'Vendida',   style: { background: '#c0392b', color: '#fff' } },
  reservada: { label: 'Reservada', style: { background: '#d97706', color: '#fff' } },
  arrendada: { label: 'Arrendada', style: { background: '#2563eb', color: '#fff' } },
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

interface Props {
  propiedad: Propiedad
  index?: number
}

export default function PropertyCard({ propiedad, index = 0 }: Props) {
  const { t, lang } = useLang()
  const p = t.prop
  // Imágenes cuadradas (foto + texto SDM) deben verse completas; fotos normales mantienen el recorte cover
  const [isSquareImg, setIsSquareImg] = useState(false)

  // Badge de estado (vendida/reservada/arrendada) y badge secundario (precio rebajado o bono pie) — pueden coexistir
  const estadoBadge = ESTADO_BADGES[propiedad.estado] || null
  const secundarioBadge = propiedad.baja_precio
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
      to={`/propiedades/${propiedad.slug || propiedad.id}`}
      className="group block bg-white overflow-hidden"
      style={{ textDecoration: 'none' }}
    >
      {/* Image */}
      <div style={{ aspectRatio: '4/3', overflow: 'hidden', position: 'relative', background: 'linear-gradient(160deg,#1a3d5c,#0d2035)' }}>
        {(() => {
          // Tarjeta de ~350px: usa la miniatura de 400px, no el original
          const imgSrc = thumbUrl(propiedad.imagen_principal || propiedad.imagenes?.[0] || '')
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
                  onLoad={e => {
                    const { naturalWidth, naturalHeight } = e.currentTarget
                    setIsSquareImg(naturalHeight > 0 && Math.abs(naturalWidth / naturalHeight - 1) < 0.1)
                  }}
                  style={{
                    objectFit: isSquareImg ? 'contain' : 'cover',
                    objectPosition: isSquareImg ? 'center' : 'center top',
                    display: 'block',
                    width: '100%',
                    height: '100%',
                  }}
                />
              ) : (
                <span className="font-serif italic text-sdm-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {propiedad.tipo} · {propiedad.comuna}
                </span>
              )}
            </div>
          )
        })()}

        {/* Badges — estado (vendida/reservada/arrendada) y/o precio rebajado / bono pie, apilados */}
        {(estadoBadge || secundarioBadge) && (
          <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5">
            {estadoBadge && (
              <div className="text-[13px] font-normal tracking-[2px] uppercase px-2.5 py-1" style={{ ...estadoBadge.style, borderRadius: 1 }}>
                {estadoBadge.label}
              </div>
            )}
            {secundarioBadge && (
              <div className="text-[13px] font-normal tracking-[2px] uppercase px-2.5 py-1" style={{ ...secundarioBadge.style, borderRadius: 1 }}>
                {secundarioBadge.label}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 lg:p-6">
        <div className="font-serif mb-1.5 text-sdm-2xl" style={{ fontWeight: 300, color: 'var(--navy-dark)', lineHeight: 1 }}>
          {priceDisplay}
          {priceLabel && (
            <small className="font-sans ml-1.5 text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 300, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {priceLabel}
            </small>
          )}
        </div>
        {/* Precio anterior tachado */}
        {propiedad.baja_precio && propiedad.precio_anterior_uf && (
          <div className="text-sdm-sm" style={{ color: 'var(--muted)', textDecoration: 'line-through', marginBottom: 4 }}>
            Antes: UF {propiedad.precio_anterior_uf.toLocaleString('es-CL')}
          </div>
        )}
        <div className="font-sans font-light leading-[1.5] mb-2.5 text-sdm-base" style={{ color: 'var(--ink)' }}>
          {titulo}
        </div>
        <div
          className="font-sans font-light tracking-[1px] uppercase flex items-center gap-1.5 mb-3.5 text-sdm-base"
          style={{ color: 'var(--muted)' }}
        >
          <span style={{ width: 12, height: 1, background: 'var(--muted)', display: 'inline-block' }} />
          {propiedad.comuna} · {propiedad.region}
        </div>
        <div className="flex gap-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {propiedad.dormitorios !== undefined && (
            <div className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block text-sdm-lg" style={{ fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.dormitorios || '—'}
              </strong>
              {p.dormitorios}
            </div>
          )}
          {propiedad.banos !== undefined && (
            <div className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block text-sdm-lg" style={{ fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.banos || '—'}
              </strong>
              {p.banos}
            </div>
          )}
          {propiedad.superficie_total !== undefined && (
            <div className="text-sdm-sm" style={{ fontWeight: 300, color: 'var(--muted)' }}>
              <strong className="font-serif block text-sdm-lg" style={{ fontWeight: 400, color: 'var(--navy-dark)' }}>
                {propiedad.superficie_total || '—'}
              </strong>
              {p.superficie}
            </div>
          )}
        </div>

        {/* Info de proyecto nuevo — etapa y fecha de entrega */}
        {propiedad.categoria === 'proyecto_nuevo' && (propiedad.etapa_construccion || propiedad.fecha_entrega) && (
          <div className="mt-2.5 pt-2.5 border-t text-sdm-sm" style={{ borderColor: 'var(--border)', fontWeight: 300, color: 'var(--muted)' }}>
            {[
              propiedad.etapa_construccion ? ETAPA_LABELS[propiedad.etapa_construccion] : null,
              propiedad.fecha_entrega ? `Entrega: ${propiedad.fecha_entrega}` : null,
            ].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>
    </Link>
  )
}
