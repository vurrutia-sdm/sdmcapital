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

          {/* ─── VELO ENTRE LA FOTO Y EL TEXTO ────────────────────────────────
              EL COLOR NO ES EL PROBLEMA. `#4CAF82` es el verde de El Barranco y
              sobre el negro de su marca da 7,25:1: su uso es correcto. Lo que
              rompe el contraste es la FOTO al 35 % que va encima de ese negro y
              lo aclara. Contra el compuesto, el verde caía a 2,78 con una foto
              clara y a 2,30 con una blanca. El subtítulo `#A8C4D8` también
              fallaba —3,42 y 4,13— aunque el diagnóstico no lo mencionaba.

              MISMO ENFOQUE QUE EL HERO: una capa de degradado propia entre la
              foto y el contenido, en vez de bajar el `opacity: 0.35` de la
              imagen. Bajarlo apagaría la fotografía ENTERA para resolver las dos
              zonas donde hay texto.

              PERO NO LA MISMA FORMA, y la diferencia es del contenido, no del
              gusto. El hero pone su texto solo a la izquierda, así que le sirve
              un degradado direccional que se desvanece hacia la derecha. Acá el
              banner tiene tinta en los DOS extremos —el eyebrow a la izquierda y
              el CTA «View Full Showcase» a la derecha—, y un degradado
              direccional dejaría el CTA sin cubrir. Por eso es SIMÉTRICO: fuerte
              en los dos bordes, más suave en el centro, que es justo la franja
              donde no hay nada escrito y la fotografía puede respirar.

              Medido en el borde (0.62), contra las cuatro luminancias de foto:

                              blanca  clara  media  oscura
                #4CAF82         5,17   5,50   6,37    7,07   ✅ (umbral 4,5)
                #A8C4D8         7,69   8,19   9,47   10,52   ✅

              El negro del velo es el `#0a0c0b` del propio banner, no el navy del
              hero: cada marca oscurece con su color. */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(100deg,rgba(10,12,11,0.62) 0%,rgba(10,12,11,0.46) 50%,rgba(10,12,11,0.62) 100%)',
          }} />

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
              <p className="text-sdm-xs" style={{ fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                letterSpacing: '0.4em',
                textTransform: 'uppercase',
                color: '#4CAF82',
                margin: '0 0 10px' }}>
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

            <div className="text-sdm-xs" style={{ display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 32px',
              border: '1px solid rgba(76,175,130,0.5)',
              color: '#4CAF82',
              fontFamily: "'Jost', sans-serif",
              fontWeight: 400,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap' }}>
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
