import { Link } from 'react-router-dom'
import { useContenido } from '@/hooks/useContenido'

// El footer va sobre `--off` (#F9FAFB), no sobre blanco ni sobre navy.
//
// POR QUÉ --off Y NO BLANCO. Contra el navy de `ContactSection` los dos
// contrastan igual, pero el footer sigue a contenido blanco en las 6 rutas
// donde esa sección no se monta —/propiedades, /blog, /vende-con-nosotros y
// las tres legales—. Ahí el blanco no separaría nada y todo el peso recaería
// en el filete superior; `--off` lo separa por sí solo.
//
// LA PALETA SE RECALCULA ENTERA al cambiar de fondo. La de navy —blanco,
// rgba(255,255,255,.8), rgba(255,255,255,.6), --sky en hover— no vale acá:
// sobre claro esos colores desaparecen. Medido sobre #F9FAFB:
//
//   --navy-dark #0F2535   15,04:1   rótulos de columna y hover
//   --muted     #5F7183    4,81:1   enlaces, eslogan y pie legal
//
// `--muted` pasa el 4,5 de 1.4.3, pero con poco margen: sobre blanco daba 5,03
// y sobre `--off` baja a 4,81. No hay sitio para oscurecer el fondo más.
const TEXTO = 'var(--muted)'
const TENUE = 'var(--muted)'
const FUERTE = 'var(--navy-dark)'

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
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="transition-colors" style={{ color: 'currentColor' }}>
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="transition-colors" style={{ color: 'currentColor' }}>
      <path d={s.path} stroke={s.filled ? undefined : 'currentColor'} fill={s.filled ? 'currentColor' : undefined} strokeWidth={s.filled ? undefined : '1.5'} strokeLinecap="round" strokeLinejoin="round"/>
      {s.circle && <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5"/>}
    </svg>
  )
}

export default function Footer() {
  const { get } = useContenido()

  // Los dos teléfonos, etiquetados: juntos y sin distinguir, el visitante no
  // sabía a cuál llamar. `telefono_1` ES el de WhatsApp — comprobado contra la
  // clave `whatsapp`, que normalizada da el mismo número.
  //
  // Los defaults estaban CRUZADOS: telefono_1 traía el número que en la base
  // es telefono_2, y telefono_2 uno que ya no existe. No se veía porque la base
  // manda, pero al vaciar la clave habrían salido los equivocados.
  const whatsapp = get('telefono_1', '+56 9 3747 8846')
  const telefono = get('telefono_2', '+56 9 3103 8954')
  const email    = get('email', 'contacto@sdmcapital.cl')
  const waLink   = (get('whatsapp', '') || whatsapp).replace(/\D/g, '')

  const enlace = { display: 'block', fontWeight: 300, marginBottom: 8, textDecoration: 'none', color: TEXTO } as const

  return (
    <footer style={{ background: 'var(--off)', borderTop: '1px solid var(--border)' }}>
      <div className="px-8 lg:px-12 pt-12 pb-6">
        {/* LAS TRES COLUMNAS DEJAN DE SER IGUALES A PARTIR DE 1024, porque sus
            contenidos no lo son: la marca tiene un eslogan con tope de 260px y
            cuatro iconos de 32, contacto tiene tres líneas cortas —la más larga
            es el correo, 165px— y navegación ahora necesita el doble de ancho
            porque va partida en dos.
            Con 1fr 1fr 1fr a 1024 navegación recibía 283px y «Reserva tu
            propiedad» caía en dos líneas; con 1fr 1.4fr 1fr recibe 349 y no
            envuelve nada. Contacto baja a 249, donde el correo sigue entrando
            de una. Medido en los dos anchos.
            De 768 a 1023 se queda en tres columnas iguales, que es lo que ya
            hacía, porque ahí navegación no se parte. */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-[1fr_1.4fr_1fr] gap-10 pb-7 mb-5" style={{ borderBottom: '1px solid var(--border)' }}>

          {/* ─── LAS TRES COLUMNAS, CENTRADAS POR DENTRO ──────────────────────
              Las columnas NO se mueven: siguen donde las pone la rejilla
              (1fr 1.4fr 1fr desde 1024). Lo que se centra es su CONTENIDO, para
              que la línea de copyright de abajo —que ya iba centrada— y la banda
              de DIRECCIÓN/HORARIO de arriba —que también— dejen de ser las dos
              únicas piezas centradas de un pie alineado a la izquierda.

              `textAlign` va en cada columna y no en la rejilla: así queda a la
              vista de quien lea la columna, y no hay que ir a buscar de dónde
              hereda.

              POR DEBAJO DE 768 ESTO NO CAMBIA NADA. `mobile.css` ya centraba el
              pie con `footer .grid > div { text-align: center !important }`, así
              que en móvil el resultado es idéntico al de antes; lo que hace este
              cambio es que escritorio y móvil por fin coincidan.

              `text-align` NO centra un contenedor flex ni un bloque con
              `max-width`: por eso la fila del logo lleva `justify-center`, la de
              redes `justifyContent: 'center'` y el eslogan `margin: '0 auto'`. */}
          {/* Marca, eslogan y redes */}
          <div style={{ textAlign: 'center' }}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="logo-stripes">
                <div className="logo-stripe logo-stripe--sky" />
                <div className="logo-stripe logo-stripe--green" />
                <div className="logo-stripe logo-stripe--navy" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif text-[20px] font-semibold tracking-[3px]" style={{ color: FUERTE }}>SDM</span>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: TENUE, marginTop: 2, display: 'block' }}>Capital</span>
              </div>
            </div>
            {/* Sigue saliendo de contenido_sitio: no se convierte en texto fijo. */}
            <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.9, color: TENUE, maxWidth: 260, marginBottom: 20, marginLeft: 'auto', marginRight: 'auto' }}>
              {get('footer_tagline', 'Tu socio confiable en bienes raíces.')}
            </p>
            {/* Solo el icono: el rótulo se va al aria-label. Los círculos miden
                32px —por encima de los 24 de 2.5.8— y van a 12px, así que los
                centros quedan a 44. */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  aria-label={`${s.label} de SDM Capital (se abre en una pestaña nueva)`}
                  className="hover:text-[var(--navy-dark)]"
                  style={{ textDecoration: 'none', width: 32, height: 32, minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', borderRadius: '50%', color: TEXTO }}>
                  <SocialIcon s={s} />
                </a>
              ))}
            </div>
          </div>

          {/* Navegación */}
          <div style={{ textAlign: 'center' }}>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: FUERTE, marginBottom: 20 }}>
              Navegación
            </div>
            {/* DOS COLUMNAS QUE SE LLENAN DE ARRIBA ABAJO, no de izquierda a
                derecha, y la diferencia es de accesibilidad, no de gusto.
                Una lista vertical se lee bajando: con `grid-flow-col` y cuatro
                filas fijas, la columna izquierda son los ítems 1-4 y la derecha
                los 5-8, que es exactamente el orden del DOM y por tanto el del
                tabulador. Con `grid-cols-2` normal el llenado sería por filas
                —1,2 / 3,4 / …— y quien bajara por la columna izquierda leería
                1,3,5,7 mientras el tabulador va 1,2,3,4.
                EL CORTE ES `lg` (1024) Y NO `xl` (1280). Estuvo en `xl` un
                despliegue y fue un error de criterio: la medición decía que a
                1024 «Reserva tu propiedad» envolvía, y evité el envoltorio a
                costa de que la mayoría de las pantallas no vieran nunca el
                cambio. La salida buena no era subir el corte sino darle ancho a
                la columna — ver la nota de la grilla de arriba: a 1024 pasa de
                283 a 349px y ya no envuelve nada.
                A 768 no se aplica a propósito: ahí la columna mide 257px y
                «Reserva tu propiedad» sí caería en dos líneas. Y debajo de 768
                `mobile.css` reparte el footer en dos columnas de 167px, donde
                dos subcolumnas serían de 78.
                `grid-rows-[repeat(4,auto)]` y no `grid-rows-4`: el utilitario de
                Tailwind es `repeat(4,minmax(0,1fr))`, que iguala las cuatro
                filas a la más alta. Si mañana una etiqueta envuelve, con `1fr`
                crecen las cuatro; con `auto` crece solo la suya.
                OJO con `mobile.css`: su regla `footer .grid > div > a` deja de
                alcanzar a estos enlaces al meterlos en este contenedor. No pasa
                nada — `display:block` lo trae `enlace` y el centrado se hereda
                del `text-align: center` que la misma hoja pone en `> div`. */}
            <div className="lg:grid lg:grid-rows-[repeat(4,auto)] lg:grid-flow-col lg:gap-x-6">
            {/* «Inicio» se fue: el logo del header ya lleva al home y es la
                convención. Un enlace más en un índice que no aporta destino. */}
            {[
              { to: '/quienes-somos',      label: 'Quiénes Somos' },
              { to: '/servicios',          label: 'Servicios' },
              { to: '/propiedades',        label: 'Propiedades' },
              { to: '/rental',             label: 'SDM Rental' },
              { to: '/vende-con-nosotros', label: 'Vende con nosotros' },
              { to: '/blog',               label: 'Blog' },
              /* `/servicios` y `/evaluacion-gratuita` no recibían NI UN enlace en todo
                 el sitio. El de servicios solo existía dentro del desplegable del
                 header, que se monta al abrirlo y por tanto no está en el DOM para un
                 crawler; el de la evaluación no existía en ninguna parte, solo se
                 llegaba abriendo un modal.
                 Van al pie porque son secciones principales, y el pie es donde el
                 visitante busca el índice del sitio cuando no lo encuentra en el menú. */
              { to: '/evaluacion-gratuita', label: 'Evaluación gratuita' },
            ].map(l => (
              <Link className="text-sdm-base hover:text-[var(--navy-dark)]" key={l.to} to={l.to} style={enlace}>{l.label}</Link>
            ))}
            </div>
          </div>

          {/* Contacto — sube al footer para que esté en TODAS las rutas. Sin
              esto, /propiedades, /blog, /vende-con-nosotros y las tres legales
              no tenían ningún dato de contacto: ContactSection solo se monta en
              7 de las 13. */}
          <div style={{ textAlign: 'center' }}>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: FUERTE, marginBottom: 20 }}>
              Contacto
            </div>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: TENUE, marginBottom: 2 }}>WhatsApp</div>
            <a className="text-sdm-base hover:text-[var(--navy-dark)]" href={`https://wa.me/${waLink}`} target="_blank" rel="noopener noreferrer"
              aria-label={`Escribir por WhatsApp al ${whatsapp} (se abre en una pestaña nueva)`}
              style={{ ...enlace, marginBottom: 14 }}>{whatsapp}</a>
            <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: TENUE, marginBottom: 2 }}>Teléfono</div>
            <a className="text-sdm-base hover:text-[var(--navy-dark)]" href={`tel:${telefono.replace(/\s/g, '')}`} style={{ ...enlace, marginBottom: 14 }}>{telefono}</a>
            <a className="text-sdm-base hover:text-[var(--navy-dark)]" href={`mailto:${email}`} style={enlace}>{email}</a>
          </div>
        </div>

        {/* Pie — una sola frase corrida. Los enlaces van inline a propósito:
            así siguen amparados por la excepción de 2.5.8 para objetivos
            dentro de un bloque de texto.
            CENTRARLO NO TOCA ESA EXCEPCIÓN: `text-align` no cambia el `display`
            de nada, los cuatro enlaces siguen siendo `inline` dentro del mismo
            párrafo y la frase sigue siendo una. Lo que sí cambia es cómo
            envuelve, y por eso se midió en los tres anchos.
            EL `nowrap` DE CADA ETIQUETA es lo que hace que los saltos caigan
            siempre en un `·`. Sin él, a 768 la línea se partía por la mitad de
            «Eliminación de / Datos»: el enlace seguía funcionando y 2.5.8
            seguía cumpliéndose, pero centrado se veía como un descuido. Con él,
            768 queda en 104 + 39 caracteres y 390 en 52 + 51 + 39, todos
            cortando en separador. Ninguna etiqueta llega a los 326px de ancho
            disponible en móvil, así que el `nowrap` nunca desborda. */}
        <p className="text-sdm-sm" style={{ fontWeight: 300, color: TENUE, lineHeight: 1.9, textAlign: 'center' }}>
          © 2026 SDM Capital · Todos los derechos reservados{' · '}
          <Link to="/politica-de-privacidad" className="hover:text-[var(--navy-dark)]" style={{ textDecoration: 'none', color: TENUE, fontWeight: 400, whiteSpace: 'nowrap' }}>Política de Privacidad</Link>
          {' · '}
          <Link to="/condiciones-del-servicio" className="hover:text-[var(--navy-dark)]" style={{ textDecoration: 'none', color: TENUE, fontWeight: 400, whiteSpace: 'nowrap' }}>Condiciones del Servicio</Link>
          {' · '}
          <Link to="/eliminacion-de-datos" className="hover:text-[var(--navy-dark)]" style={{ textDecoration: 'none', color: TENUE, fontWeight: 400, whiteSpace: 'nowrap' }}>Eliminación de Datos</Link>
          {' · '}
          <a href="https://haikuflow.com" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--navy-dark)]" style={{ textDecoration: 'none', color: TENUE, fontWeight: 400, whiteSpace: 'nowrap' }}>By HaikuFlow.com</a>
        </p>
      </div>
    </footer>
  )
}
