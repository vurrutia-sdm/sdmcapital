import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const PROP_ID = 'eccfd92d-713e-4e0a-a074-ff76daffd81e'

export default function ElBarrancoBanner({ clave = 'banner_detalle_foto' }: { clave?: string }) {
  const [bgUrl, setBgUrl] = useState('')

  useEffect(() => {
    supabase
      .from('showcase_barranco')
      .select('valor')
      .eq('clave', clave)
      .maybeSingle()
      .then(({ data }) => { if (data?.valor) setBgUrl(data.valor) }, () => {})
  }, [clave])

  return (
    <div className="px-8 lg:px-12">
      <Link to={`/propiedades/${PROP_ID}/showcase`} style={{ textDecoration: 'none', display: 'block' }}>
        <div style={{
          margin: '40px 0',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          background: '#0a0c0b',
          border: '1px solid rgba(168,196,216,0.2)',
        }}>
          {/* Imagen de fondo — solo si hay URL (sin flash mientras carga) */}
          {bgUrl && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.35,
            }} />
          )}

          {/* Contenido */}
          <div style={{
            position: 'relative', zIndex: 1,
            padding: '40px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            flexWrap: 'wrap',
          }}>
            <div>
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 10,
                fontWeight: 300,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: '#4CAF82',
                margin: '0 0 10px',
              }}>
                SDM Capital · Exclusive Listing
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(22px, 3vw, 34px)',
                fontWeight: 300,
                color: '#f0ece4',
                margin: '0 0 6px',
                lineHeight: 1.1,
              }}>
                Hotel El Barranco
              </p>
              <p style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: 'italic',
                fontSize: 'clamp(15px, 2vw, 20px)',
                fontWeight: 300,
                color: '#A8C4D8',
                margin: 0,
              }}>
                Explore the full property experience
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 32px',
              border: '1px solid rgba(76,175,130,0.5)',
              color: '#4CAF82',
              fontFamily: "'Jost', sans-serif",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              View Full Showcase
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 3l5 5-5 5"/>
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
