import { useEffect, useState } from 'react'
import SEO from '@/components/SEO'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'
import ContactSection from '@/components/sections/ContactSection'
import { useContenido } from '@/hooks/useContenido'

const sp = { paddingLeft: 'clamp(16px, 5vw, 48px)', paddingRight: 'clamp(16px, 5vw, 48px)' }

export default function RentalPage() {
  const { lang } = useLang()
  const { get } = useContenido()

  const heroTitulo = get('rental_hero_titulo', 'Tu propiedad, sin preocupaciones')
  const heroSubtitulo = get('rental_hero_subtitulo', 'SDM Rental se encarga de todo: buscamos arrendatarios, cobramos las rentas y administramos tu propiedad mes a mes. Tú solo recibes los resultados.')
  const heroImg = get('rental_hero_img', '')

  const propTitulo = get('rental_prop_titulo', 'Arrienda sin complicaciones')
  const propSubtitulo = get('rental_prop_subtitulo', 'Nos encargamos de cada etapa del proceso de arriendo para que tú no tengas que preocuparte de nada.')
  const checklist = [
    get('rental_check_1', 'Buscamos y seleccionamos arrendatarios con evaluación completa.'),
    get('rental_check_2', 'Redactamos y formalizamos el contrato de arriendo.'),
    get('rental_check_3', 'Cobramos las rentas y te transferimos mensualmente.'),
    get('rental_check_4', 'Gestionamos mantenciones e incidencias por ti.'),
    get('rental_check_5', 'Informes mensuales de tu propiedad.'),
  ]
  const comisionTradPct = get('rental_comision_trad_pct', '50%')
  const comisionTradDesc = get('rental_comision_trad_desc', 'de un mes de arriendo · pago único')
  const comisionAdmPct = get('rental_comision_adm_pct', '50% + 7%')
  const comisionAdmDesc = get('rental_comision_adm_desc', 'pago único + 7% mensual sobre el arriendo')

  const arrTitulo = get('rental_arr_titulo', 'Encuentra tu próximo hogar')
  const arrSubtitulo = get('rental_arr_subtitulo', 'Tenemos propiedades disponibles en arriendo en Santiago y sus alrededores. Proceso simple, transparente y sin costos ocultos.')

  const compTitulo = get('rental_comp_titulo', 'Compara tus opciones')
  const comp1Tipo = get('rental_comp1_tipo', 'Arriendo Tradicional')
  const comp1Def = get('rental_comp1_def', 'Tú mantienes el control directo de tu propiedad y la relación con el arrendatario.')
  const comp1Dur = get('rental_comp1_dur', 'Período fijo (ej. 1 año), renovable.')
  const comp1Ges = get('rental_comp1_ges', 'El propietario gestiona directamente.')
  const comp1Com = get('rental_comp1_com', '50% de un mes de arriendo (única vez).')
  const comp2Tipo = get('rental_comp2_tipo', 'Administración de Arriendo')
  const comp2Def = get('rental_comp2_def', 'SDM Rental gestiona todo en tu nombre: inquilinos, cobros, mantención e incidencias.')
  const comp2Dur = get('rental_comp2_dur', 'Indefinida, hasta que cualquiera de las partes decida finalizar.')
  const comp2Ges = get('rental_comp2_ges', 'SDM Rental opera el inmueble por completo.')
  const comp2Com = get('rental_comp2_com', '50% de un mes de arriendo (única vez) + 7% mensual sobre el arriendo.')

  const quienesTitulo = get('rental_quienes_titulo', '20 años de experiencia a tu servicio')
  const quienesTexto = get('rental_quienes_somos', 'Contamos con más de 20 años de experiencia en el sector comercial bancario e inmobiliario. Somos especialistas en soluciones adaptadas a cada cliente, con respaldo legal en todas nuestras operaciones y una red de marketing digital que posiciona tu propiedad donde los arrendatarios te buscan.')

  return (
    <div className="min-h-screen">
      <SEO title="SDM Rental — Administración y Arriendo de Propiedades" description="Arrienda o administra tu propiedad con SDM Rental. Gestión completa de arriendos en Chile." url="/rental" />

      {/* Hero */}
      <div style={{ ...sp, paddingTop: 100, paddingBottom: 80, background: 'var(--navy-dark)', position: 'relative', overflow: 'hidden' }}>
        {heroImg && <img src={heroImg} alt="Hero SDM Rental" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18 }} />}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/LOGO-SDM-RENTAL.png" alt="SDM Rental" style={{ height: 72, objectFit: 'contain', marginBottom: 32 }} />
          <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(32px,5vw,68px)', color: '#fff', lineHeight: 1.07, maxWidth: 700 }}>
            {heroTitulo.split(',').map((part, i, arr) => i === arr.length - 1 ? <><br /><em key={i}>{part.trim()}</em></> : part + ',')}
          </h1>
          <p className="font-light mt-6 border-l-2 pl-4 text-sdm-lg" style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.9, borderColor: 'var(--green)', maxWidth: 520 }}>{heroSubtitulo}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
            <a className="text-sdm-xs tracking-sdm-wide" href="#propietarios" style={{ padding: '13px 28px', background: 'var(--green-dark)', color: '#fff', textDecoration: 'none', fontWeight: 500, textTransform: 'uppercase', borderRadius: 2 }}>Soy propietario</a>
            <a className="text-sdm-xs tracking-sdm-wide" href="#arrendatarios" style={{ padding: '13px 28px', border: '1px solid rgba(255,255,255,0.55)', color: '#fff', textDecoration: 'none', fontWeight: 500, textTransform: 'uppercase', borderRadius: 2 }}>Busco arriendo</a>
            {/* 0.55 y no 0.30 en el borde: este <a> no tiene relleno propio, así
                que el borde es lo ÚNICO que lo identifica como control —1.4.11,
                3:1—. El fondo es `--navy-dark` con la foto del hero al 18 %
                encima, y contra ese compuesto daba 2,25–2,67 según la foto.
                Con 0.55 va de 3,97 a 5,68. Es la misma opacidad que ya quedó en
                los rótulos de la tarjeta destacada. */}
          </div>
        </div>
      </div>

      {/* Quiénes Somos Rental */}
      <section style={{ ...sp, paddingTop: 72, paddingBottom: 72, background: 'var(--off)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Quiénes Somos</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <h2 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(26px,4vw,42px)', color: 'var(--navy-dark)', lineHeight: 1.1 }}>{quienesTitulo}</h2>
          <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{quienesTexto}</p>
        </div>
      </section>

      {/* Para Propietarios */}
      <section id="propietarios" style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderBottom: '1px solid var(--border)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="section-label" style={{ marginBottom: 20 }}>Para Propietarios</div>
            <h2 className="font-serif font-light mb-4 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,44px)', color: 'var(--navy-dark)', lineHeight: 1.1 }}>{propTitulo}</h2>
            <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.8, marginBottom: 28 }}>{propSubtitulo}</p>
            {checklist.filter(Boolean).map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, alignItems: 'flex-start' }}>
                {/* `--green-dark` y no `--green`: el visto es BLANCO encima, y ese
                    par da 2,93:1 — la cara «fondo verde con blanco encima» de la
                    regla 4.2, que es la que ya se había escapado una vez. Con
                    `--green-dark` son 4,85:1. Lo encontró el barrido POR FORMA;
                    los anteriores buscaban `color:` y esto es `background:`. */}
                <div style={{ width: 24, height: 24, minWidth: 24, background: 'var(--green-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.7 }}>{item}</p>
              </div>
            ))}
            <a className="text-sdm-xs tracking-sdm-wide border border-[var(--navy-dark)] text-[var(--navy-dark)] bg-transparent hover:bg-[var(--navy-dark)] hover:text-white" href="#contacto" style={{ display: 'inline-block', marginTop: 24, padding: '13px 28px', textDecoration: 'none', fontWeight: 400, textTransform: 'uppercase', borderRadius: 2 }}
            >Quiero arrendar mi propiedad</a>
          </div>
          <div style={{ background: 'linear-gradient(160deg,var(--navy),var(--navy-dark))', borderRadius: 2, padding: '48px 40px' }}>
            {/* `--green-dark`: este eyebrow va sobre BLANCO, y ahí `--green` da
                2,93:1. Es la regla 4.2 en su cara más simple, y sobrevivió al
                barrido de los 29 usos del 2026-08-09. */}
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--green-dark)', marginBottom: 24 }}>Nuestras comisiones</div>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 24, marginBottom: 24 }}>
              <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Arriendo Tradicional</div>
              <div className="font-serif text-sdm-display-md" style={{ color: '#fff', fontWeight: 300 }}>{comisionTradPct}</div>
              <div className="text-sdm-base" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{comisionTradDesc}</div>
            </div>
            <div>
              <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Administración Completa</div>
              <div className="font-serif text-sdm-display-md" style={{ color: '#fff', fontWeight: 300 }}>{comisionAdmPct}</div>
              <div className="text-sdm-base" style={{ fontWeight: 300, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{comisionAdmDesc}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Para Arrendatarios */}
      <section id="arrendatarios" style={{ ...sp, paddingTop: 80, paddingBottom: 80, background: 'var(--off)', borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Para Arrendatarios</div>
        <h2 className="font-serif font-light mb-6 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>{arrTitulo}</h2>
        <p className="text-sdm-lg" style={{ fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, maxWidth: 560, marginBottom: 40 }}>{arrSubtitulo}</p>
        <Link className="text-sdm-xs tracking-sdm-wide bg-[var(--navy-dark)] hover:bg-[var(--green-dark)]" to="/propiedades?estado=en_arriendo"
          style={{ display: 'inline-block', padding: '13px 28px', color: '#fff', textDecoration: 'none', fontWeight: 400, textTransform: 'uppercase', borderRadius: 2 }}
        >Ver propiedades en arriendo</Link>
      </section>

      {/* Comparativo */}
      <section style={{ ...sp, paddingTop: 80, paddingBottom: 80, borderBottom: '1px solid var(--border)' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>¿Cuál elegir?</div>
        <h2 className="font-serif font-light mb-16 tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.08 }}>{compTitulo}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
          {[
            { tipo: comp1Tipo, def: comp1Def, dur: comp1Dur, ges: comp1Ges, com: comp1Com, destacado: false },
            { tipo: comp2Tipo, def: comp2Def, dur: comp2Dur, ges: comp2Ges, com: comp2Com, destacado: true },
          ].map(c => (
            <div key={c.tipo} style={{ background: c.destacado ? 'var(--navy-dark)' : '#fff', padding: '48px 40px' }}>
              {c.destacado && <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--green)', marginBottom: 16 }}>Recomendado</div>}
              <h3 className="font-serif font-light mb-6 text-sdm-2xl" style={{ color: c.destacado ? '#fff' : 'var(--navy-dark)' }}>{c.tipo}</h3>
              {[{ label: 'Definición', value: c.def }, { label: 'Duración', value: c.dur }, { label: 'Gestión', value: c.ges }, { label: 'Comisión', value: c.com }].map(row => (
                <div key={row.label} style={{ marginBottom: 20 }}>
                  {/* 0.55 y no 0.4 en la rama destacada: sobre `--navy-dark` daba
                      3,68:1 a 11px en versalitas. La asimetría era del revés de lo
                      que corresponde —la columna clara usa `--muted`, 5,03:1, así
                      que la tarjeta RECOMENDADA era la menos legible de las dos—.
                      Con 0.55 quedan parejas: 5,68 contra 5,03. */}
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: c.destacado ? 'rgba(255,255,255,0.55)' : 'var(--muted)', marginBottom: 4 }}>{row.label}</div>
                  <div className="text-sdm-base" style={{ fontWeight: 300, color: c.destacado ? '#fff' : 'var(--muted)', lineHeight: 1.7 }}>{row.value}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <ContactSection />
    </div>
  )
}
