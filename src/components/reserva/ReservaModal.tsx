import { useId, useRef, useState } from 'react'
import { Check, Copy, X } from 'lucide-react'
import { useDialogoModal } from '@/hooks/useDialogoModal'
import { useBloquearScroll } from '@/hooks/useBloquearScroll'

// ─── DATOS DE LA CUENTA ───────────────────────────────────────────────────────
// Viven acá y no en `contenido_sitio` a propósito: son datos bancarios, y una
// clave editable desde el admin es una superficie más donde un dígito mal pegado
// desvía un depósito. Si algún día se editan desde el panel, que sea con una
// decisión explícita y no por inercia.
const CUENTA = {
  titular: 'SDM Capital SpA',
  rut: '77.917.699-1',
  banco: 'Scotiabank',
  tipo: 'Cuenta Corriente',
  numero: '990497621',
  correo: 'contacto@sdmcapital.cl',
  // El wa.me va sin signos: la API los rechaza.
  telefono: '+56 9 2973 7048',
  telefonoWa: '56929737048',
}

// ─── CÓDIGO DE RESERVA ────────────────────────────────────────────────────────
//
// SEIS DÍGITOS HEXADECIMALES DEL UUID DE LA PROPIEDAD, no cuatro.
//
// Con 82 propiedades activas, cuatro dígitos hex (65.536 combinaciones) dan un
// 5,0 % de probabilidad de que dos propiedades compartan código —paradoja del
// cumpleaños: 1 − e^(−82²/(2·65536))—. Un 5 % es demasiado para el dato con el
// que Roberto decide a qué propiedad corresponde un depósito. Con seis dígitos
// (16,7 millones) baja a 0,02 %.
//
// Se lee en tres pares por teléfono —«A4, F2, C1»— así que el coste sobre cuatro
// es un par más.
//
// ES DETERMINISTA Y NO SE PERSISTE. Sale del `id` que la propiedad ya tiene, así
// que el mismo inmueble da siempre el mismo código sin tocar la base y sin que
// dos pestañas abiertas generen dos códigos distintos para lo mismo.
//
// EL HEXADECIMAL SE ELIGIÓ POR CÓMO SE DICTA, no por comodidad: su alfabeto es
// 0-9 y A-F, así que no contiene ninguno de los pares que se confunden al
// deletrear —0/O, 1/I/L, 5/S, 2/Z—. Un Base32 más corto los reintroduce.
export function codigoReserva(id: string): string {
  const hex = id.replace(/[^0-9a-f]/gi, '').toUpperCase()
  return `SDM-${hex.slice(0, 6) || '000000'}`
}

// Botón de copiar con confirmación VISIBLE, no silenciosa.
//
// Copiar es la única acción del modal que no produce ningún cambio en pantalla
// por sí misma: sin respuesta, el usuario no sabe si funcionó y vuelve a pulsar.
// El icono cambia a un tick y el rótulo accesible lo dice, para que el cambio no
// dependa solo del color ni solo de la forma.
function BotonCopiar({ valor, que }: { valor: string; que: string }) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
    } catch {
      // `navigator.clipboard` no existe en contextos no seguros ni en algunos
      // navegadores móviles antiguos. El respaldo es el <textarea> temporal, que
      // funciona en todos: si tampoco, se sale sin avisar de un falso éxito.
      const ta = document.createElement('textarea')
      ta.value = valor
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch { document.body.removeChild(ta); return }
      document.body.removeChild(ta)
    }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={copiado ? `${que} copiado` : `Copiar ${que}`}
      className="text-sdm-xs tracking-sdm-wide area-44"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', marginLeft: 12,
        background: 'transparent',
        border: '1px solid var(--border-input)',
        borderRadius: 'var(--sdm-radio-control)',
        color: copiado ? 'var(--green-dark)' : 'var(--navy-dark)',
        borderColor: copiado ? 'var(--green-dark)' : 'var(--border-input)',
        textTransform: 'uppercase', fontFamily: 'inherit', cursor: 'pointer',
        transition: 'color var(--sdm-mov-rapido) var(--sdm-curva), border-color var(--sdm-mov-rapido) var(--sdm-curva)',
        whiteSpace: 'nowrap',
      }}
    >
      {copiado
        ? <><Check aria-hidden="true" size={13} strokeWidth={2} />Copiado</>
        : <><Copy aria-hidden="true" size={13} strokeWidth={2} />Copiar</>}
    </button>
  )
}

function Paso({ n, titulo, children }: { n: number; titulo: string; children: React.ReactNode }) {
  return (
    <li style={{ display: 'flex', gap: 16, marginBottom: 28 }}>
      {/* El número es ornamento: el <ol> ya numera para el lector de pantalla, y
          sin `aria-hidden` cada paso se anunciaría dos veces. */}
      <span
        aria-hidden="true"
        className="font-serif text-sdm-2xl"
        style={{
          flexShrink: 0, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid var(--border-input)',
          borderRadius: 'var(--sdm-radio-control)',
          color: 'var(--navy-dark)', fontWeight: 'var(--sdm-peso-ligero)', lineHeight: 1,
        }}
      >
        {n}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="text-sdm-base" style={{ fontWeight: 'var(--sdm-peso-semi)', color: 'var(--navy-dark)', marginBottom: 8 }}>
          {titulo}
        </div>
        {children}
      </div>
    </li>
  )
}

export default function ReservaModal({ propiedad, onClose }: {
  propiedad: { id: string; titulo: string }
  onClose: () => void
}) {
  const caja = useRef<HTMLDivElement>(null)
  const tituloId = useId()
  // Los dos hooks que ya usan los seis modales del sitio: Escape, foco atrapado,
  // foco devuelto al disparador y bloqueo de scroll que sobrevive a iOS.
  useDialogoModal(true, caja, onClose)
  useBloquearScroll(true)

  const codigo = codigoReserva(propiedad.id)
  const filaDato: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 0' }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,37,53,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div
        ref={caja}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full bg-white"
        style={{
          maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain',
          borderRadius: 'var(--sdm-radio-flotante)', position: 'relative',
          // Borde fino y no sombra: principio 3 del sistema. Sobre el velo
          // oscuro del overlay es lo que separa la caja del fondo.
          border: '1px solid var(--border-input)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="area-44"
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 10, background: 'transparent', border: 'none', borderRadius: 'var(--sdm-radio-control)', cursor: 'pointer', padding: 6, display: 'flex', color: 'var(--muted)' }}
        >
          <X aria-hidden="true" size={20} />
        </button>

        <div style={{ padding: '40px 36px' }}>
          <div className="section-label" style={{ marginBottom: 14 }}>Reserva</div>
          <h2 id={tituloId} className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)', lineHeight: 1.15, marginBottom: 6 }}>
            Reservar por transferencia
          </h2>
          <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 4 }}>
            {propiedad.titulo}
          </p>

          {/* El código, arriba y con su propio recuadro: es el dato que hay que
              copiar y el que el resto de los pasos referencia. */}
          <div
            className="flex items-center flex-wrap gap-y-2"
            style={{ marginTop: 22, marginBottom: 32, padding: '14px 18px', background: 'var(--off)', border: '1px solid var(--border)', borderRadius: 'var(--sdm-radio-contenedor)' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 2 }}>
                Código de reserva
              </div>
              <div className="text-sdm-xl" style={{ fontWeight: 'var(--sdm-peso-semi)', color: 'var(--navy-dark)', letterSpacing: '0.06em' }}>
                {codigo}
              </div>
            </div>
            <BotonCopiar valor={codigo} que="el código de reserva" />
          </div>

          {/* `<ol>` y no una serie de <div>: son pasos en orden, y el lector de
              pantalla anuncia «1 de 3». */}
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <Paso n={1} titulo="Transfiere el monto de la reserva a esta cuenta">
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--sdm-radio-contenedor)', padding: '4px 16px' }}>
                {[
                  ['Titular', CUENTA.titular],
                  ['RUT', CUENTA.rut],
                  ['Banco', `${CUENTA.banco} · ${CUENTA.tipo}`],
                ].map(([k, v], i) => (
                  <div key={k} className="text-sdm-base" style={{ ...filaDato, borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ color: 'var(--ink)', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
                <div className="text-sdm-base" style={{ ...filaDato, borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>N° de cuenta</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--ink)', fontWeight: 'var(--sdm-peso-semi)' }}>{CUENTA.numero}</span>
                    <BotonCopiar valor={CUENTA.numero} que="el número de cuenta" />
                  </span>
                </div>
                <div className="text-sdm-base" style={{ ...filaDato, borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--muted)' }}>Correo</span>
                  <a href={`mailto:${CUENTA.correo}`} style={{ color: 'var(--navy)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                    {CUENTA.correo}
                  </a>
                </div>
              </div>
            </Paso>

            <Paso n={2} titulo="Envíanos el comprobante">
              <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                A{' '}
                <a href={`mailto:${CUENTA.correo}`} style={{ color: 'var(--navy)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  {CUENTA.correo}
                </a>{' '}
                o al{' '}
                <a
                  href={`https://wa.me/${CUENTA.telefonoWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Escribir por WhatsApp al ${CUENTA.telefono} (se abre en una pestaña nueva)`}
                  style={{ color: 'var(--navy)', textDecoration: 'underline', textUnderlineOffset: 3, whiteSpace: 'nowrap' }}
                >
                  {CUENTA.telefono}
                </a>. Incluye el código <strong style={{ color: 'var(--navy-dark)', fontWeight: 'var(--sdm-peso-semi)' }}>{codigo}</strong> para
                que sepamos de qué propiedad se trata.
              </p>
            </Paso>

            {/* SIN PLAZO. El texto dice qué pasa, no cuándo: no hay un
                compromiso de tiempo que el equipo pueda garantizar, y prometerlo
                acá lo convertiría en uno. Tampoco se menciona ningún monto: la
                reserva se acuerda con el ejecutivo, no se fija en esta pantalla. */}
            <Paso n={3} titulo="Confirmamos tu reserva">
              <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Una vez verificado el depósito, SDM Capital confirma la reserva de la propiedad.
              </p>
            </Paso>
          </ol>

          <button onClick={onClose} className="btn-primary w-full justify-center" style={{ marginTop: 4 }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
