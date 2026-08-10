import { useId, useRef } from 'react'
import { useDialogoModal } from '@/hooks/useDialogoModal'
import { useBloquearScroll } from '@/hooks/useBloquearScroll'
import { X, Check } from 'lucide-react'
import SolicitudCreditoForm from './SolicitudCreditoForm'

export default function SolicitudCreditoModal({ onClose }: { onClose: () => void }) {
  const caja = useRef<HTMLDivElement>(null)
  const tituloId = useId()
  // Escape, foco atrapado y foco devuelto al disparador. Ya tenía Escape suelto;
  // el hook lo reemplaza para no tener dos oyentes haciendo lo mismo.
  useDialogoModal(true, caja, onClose)

  // `overflow: hidden` sobre body no alcanza en iOS y además dejaba la página
  // arriba del todo al cerrar. El hook usa `position: fixed` + `top: -scrollY`
  // y restaura la posición.
  useBloquearScroll(true)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,37,53,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        ref={caja}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full grid grid-cols-1 md:grid-cols-[2fr_3fr]"
        style={{ maxWidth: 980, maxHeight: '92vh', overflowY: 'auto', overscrollBehavior: 'contain', borderRadius: 2, position: 'relative', backgroundColor: '#FFFFFF' }}
      >
        <button
          onClick={onClose}
          aria-label="Cerrar"
          style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <X aria-hidden="true" size={20} color="#0F2535" />
        </button>

        {/* ── Panel izquierdo: información del servicio ── */}
        <div style={{ backgroundColor: '#1C2B3A', color: '#FFFFFF', padding: '48px 36px 48px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, backgroundColor: 'transparent' }}>
            <span style={{ display: 'block', width: 24, height: 1, backgroundColor: 'rgba(168,196,220,0.85)' }} />
            <span className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 400, textTransform: 'uppercase', color: 'rgba(168,196,220,0.85)', backgroundColor: 'transparent' }}>
              Financiamiento Personas
            </span>
          </div>

          <h2 id={tituloId} className="font-serif font-light text-sdm-display-sm" style={{ marginBottom: 6, backgroundColor: 'transparent', color: '#FFFFFF' }}>
            Asesoría Hipotecaria <em style={{ backgroundColor: 'transparent', color: 'inherit' }}>Integral</em>
          </h2>
          <p className="text-sdm-base" style={{ color: 'rgba(255,255,255,0.55)', marginBottom: 24, backgroundColor: 'transparent' }}>
            Roberto Urrutia · Director Comercial SDM Capital · +20 años en banca
          </p>

          <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', marginBottom: 28, backgroundColor: 'transparent' }}>
            Acompañamos todo el proceso de obtención de tu crédito hipotecario, desde la preevaluación
            hasta la inscripción en el Conservador de Bienes Raíces. Sin pagos adelantados.
          </p>

          <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: 'var(--sky)', marginBottom: 14, backgroundColor: 'transparent' }}>
            Lo que incluye
          </div>
          <ul style={{ marginBottom: 28, listStyle: 'none', backgroundColor: 'transparent' }}>
            {[
              'Revisión de antecedentes financieros y comerciales',
              'Preparación de carpeta de evaluación crediticia',
              'Gestión ante múltiples instituciones financieras',
              'Coordinación de tasación y estudio de títulos',
              'Acompañamiento en firma de escrituras',
              'Seguimiento hasta la inscripción de dominio',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.6, color: 'rgba(255,255,255,0.85)', marginBottom: 10, backgroundColor: 'transparent' }}>
                <Check size={15} color="#3DAA6E" style={{ marginTop: 3, flexShrink: 0, backgroundColor: 'transparent' }} />
                <span style={{ backgroundColor: 'transparent', color: 'inherit' }}>{item}</span>
              </li>
            ))}
          </ul>

          <div style={{ backgroundColor: '#2E4057', borderLeft: '4px solid #5C9B7E', padding: '1rem', borderRadius: '6px', marginBottom: 20 }}>
            <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 8, backgroundColor: 'transparent' }}>
              Honorarios
            </div>
            {/* EL CASO COMPLETO VA ACÁ, y no en el home, porque éste es el
                punto donde el visitante decide.

                Decía «Nuestros honorarios se pagan únicamente contra el éxito
                de la operación», que omitía lo principal: si el cliente compra
                su propiedad con SDM, la gestión del crédito no se cobra. La
                frase describía cuándo SE COBRA y la política define cuándo NO.

                La tercera oración se mantiene palabra por palabra: de las tres
                que había, era la única correcta.

                NO SE DICE CUÁNDO se cobra en el caso de compra por fuera. Las
                dos superficies que lo declaraban no coincidían entre sí —«al
                éxito de la operación» acá, «al éxito de la gestión» en
                /evaluacion-gratuita— y ninguna de las dos describe la política.
                Queda anotado en SINCRONIA.md como pendiente de decisión
                comercial. «Contra el resultado» es lo que sí está establecido y
                no compromete un momento concreto. */}
            <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.7, color: '#FFFFFF', margin: 0, backgroundColor: 'transparent' }}>
              Si compras tu propiedad con SDM Capital —nueva o usada—, la gestión del crédito
              no tiene costo. Si la compra la haces por fuera, se cobran honorarios por la
              gestión, siempre contra el resultado.
              Sin cobros anticipados en ninguna etapa del proceso.
            </p>
          </div>

          <div style={{ backgroundColor: '#2E4057', borderLeft: '4px solid #5C9B7E', padding: '1rem', borderRadius: '6px', marginBottom: 24 }}>
            <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: '#FFFFFF', marginBottom: 8, backgroundColor: 'transparent' }}>
              Preevaluación gratuita
            </div>
            <p className="text-sdm-base" style={{ fontWeight: 300, lineHeight: 1.7, color: '#FFFFFF', margin: 0, backgroundColor: 'transparent' }}>
              Realizamos una preevaluación hipotecaria sin costo. Resultado en aprox. 5 días hábiles.
            </p>
          </div>

          <div className="text-sdm-sm tracking-sdm-wide" style={{ fontWeight: 500, textTransform: 'uppercase', color: '#5C9B7E', marginBottom: 12, backgroundColor: 'transparent' }}>
            Documentos necesarios (trabajador dependiente)
          </div>
          <ul style={{ listStyle: 'none', backgroundColor: 'transparent' }}>
            {[
              'Cédula de identidad vigente (ambos lados)',
              'Últimas 3 liquidaciones de sueldo (renta fija) o 6 (renta variable)',
              'Certificado de cotizaciones AFP últimos 24 meses (con RUT empleador)',
              'Certificado de deudas CMF actualizado (con Clave Única)',
            ].map(item => (
              <li className="text-sdm-sm" key={item} style={{ fontWeight: 300, lineHeight: 1.6, color: '#CBD5E1', marginBottom: 6, backgroundColor: 'transparent' }}>
                — {item}
              </li>
            ))}
          </ul>
          <div style={{ height: '3rem', backgroundColor: 'transparent' }} />
        </div>

        {/* ── Panel derecho: formulario ── */}
        <div style={{ padding: '48px 36px', backgroundColor: '#FFFFFF', color: '#1C2B3A' }}>
          <SolicitudCreditoForm successAction={<button onClick={onClose} className="btn-primary">Cerrar</button>} />
        </div>
      </div>
    </div>
  )
}
