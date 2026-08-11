import { useEffect, useId, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const TIPOS_PROPIEDAD = ['Departamento', 'Casa', 'Oficina', 'Local comercial', 'Parcela', 'Terreno']

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--sdm-text-xs)', fontWeight: 500, letterSpacing: 'var(--sdm-tracking-wide)', textTransform: 'uppercase', color: 'var(--muted)',
}

interface FormState {
  nombres: string
  apellidos: string
  email: string
  telefono: string
  rut: string
  accion: string
  condicion_propiedad: string
  tipo_propiedad: string
  valor_uf: string
  situacion_laboral: string
  sueldo_promedio: string
}

const EMPTY_FORM: FormState = {
  nombres: '', apellidos: '', email: '', telefono: '', rut: '',
  accion: '', condicion_propiedad: '', tipo_propiedad: '', valor_uf: '', situacion_laboral: '', sueldo_promedio: '',
}

function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9)
  if (!clean) return ''
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  if (!body) return dv
  const reversed = body.split('').reverse().join('')
  const grouped = reversed.replace(/(\d{3})(?=\d)/g, '$1.')
  const formattedBody = grouped.split('').reverse().join('')
  return `${formattedBody}-${dv}`
}

function formatThousands(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('es-CL')
}

const RUT_REGEX = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RadioGroup({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  // Opciones mutuamente excluyentes con un solo valor: el patrón es
  // `radiogroup` con `radio`, no un grupo de botones sueltos.
  //
  // TABULACIÓN ITINERANTE: dentro de un radiogroup solo UNA opción está en el
  // orden de tabulación; entre ellas se navega con las flechas. Así el grupo
  // entero cuenta como una parada, que es como se comporta un <input
  // type="radio"> nativo.
  //
  // Con `value` en '' —el estado inicial, nada elegido— el tabulable es el
  // PRIMERO. Si se dejara que solo lo fuera el seleccionado, sin selección el
  // grupo se saldría entero del orden de tabulación y no habría forma de
  // llegar a él.
  const labelId = useId()
  const indiceActivo = Math.max(0, options.findIndex(o => o.value === value))
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const alTeclear = (e: React.KeyboardEvent, i: number) => {
    const paso = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!paso) return
    e.preventDefault()
    // Circular: de la última se pasa a la primera, como en un radiogroup nativo.
    const siguiente = (i + paso + options.length) % options.length
    onChange(options[siguiente].value)
    refs.current[siguiente]?.focus()
  }

  return (
    <div className="flex flex-col gap-2">
      <span id={labelId} style={labelStyle}>{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={labelId}>
        {options.map((opt, i) => (
          <button
            key={opt.value}
            ref={el => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            tabIndex={i === indiceActivo ? 0 : -1}
            onKeyDown={e => alTeclear(e, i)}
            onClick={() => onChange(opt.value)}
            className="px-4 py-2 text-[13px] border transition-colors"
            /* LAS DOS CARAS DE LA REGLA 4.2 EN UN SOLO CONTROL, y las dos fallaban.
               ELEGIDO: `--green` de fondo con texto blanco encima daba 2,93:1 a
               13px. Es exactamente el caso que `SISTEMA-DISENO.md` 4.2 describe
               como el que «se escapó dos veces», porque el barrido buscaba
               `color:` y esto es `background:`. Con `--green-dark` da 4,85:1.
               SIN ELEGIR: el borde era `--border` (1,18:1) y es lo ÚNICO que
               delimita el control —el fondo es transparente—, así que cae en
               1.4.11. Pasa a `--border-input`, igual que los del buscador. */
            style={{
              borderRadius: 2,
              borderColor: value === opt.value ? 'var(--green-dark)' : 'var(--border-input)',
              background: value === opt.value ? 'var(--green-dark)' : 'transparent',
              color: value === opt.value ? '#fff' : 'var(--navy-dark)',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

interface SolicitudCreditoFormProps {
  title?: string
  subtitle?: string
  successTitle?: string
  successMessage?: string
  successAction?: React.ReactNode
}

export default function SolicitudCreditoForm({
  title = 'Solicita tu evaluación',
  subtitle,
  successTitle = '¡Solicitud enviada!',
  successMessage = 'Recibimos tu información. Roberto te contactará a la brevedad para continuar con la preevaluación.',
  successAction,
}: SolicitudCreditoFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [uf, setUf] = useState<{ valor: number | null; error: boolean; loading: boolean }>({ valor: null, error: false, loading: true })

  useEffect(() => {
    let active = true
    fetch('https://mindicador.cl/api/uf')
      .then(r => r.json())
      .then(data => {
        if (!active) return
        const valor = data?.serie?.[0]?.valor
        setUf(typeof valor === 'number' ? { valor, error: false, loading: false } : { valor: null, error: true, loading: false })
      })
      .catch(() => { if (active) setUf({ valor: null, error: true, loading: false }) })
    return () => { active = false }
  }, [])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const setRadio = (k: keyof FormState) => (v: string) => setForm(f => ({ ...f, [k]: v }))

  const rutValid = RUT_REGEX.test(form.rut)
  const emailValid = EMAIL_REGEX.test(form.email)
  const valorUfValid = form.valor_uf !== '' && Number(form.valor_uf) > 0
  const sueldoValid = form.sueldo_promedio !== '' && Number(form.sueldo_promedio.replace(/\D/g, '')) > 0
  const compraFieldsValid = form.accion !== 'compra' || (form.condicion_propiedad !== '' && form.tipo_propiedad !== '')

  const canSubmit =
    form.nombres.trim() !== '' &&
    form.apellidos.trim() !== '' &&
    emailValid &&
    form.telefono.trim() !== '' &&
    rutValid &&
    form.accion !== '' &&
    compraFieldsValid &&
    valorUfValid &&
    form.situacion_laboral !== '' &&
    sueldoValid &&
    status !== 'sending'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setStatus('sending')
    setErrorMsg('')

    try {
      const payload = {
        nombres: form.nombres.trim(),
        apellidos: form.apellidos.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        rut: form.rut.trim(),
        accion: form.accion,
        tipo_propiedad: form.accion === 'compra' ? form.tipo_propiedad : null,
        condicion_propiedad: form.accion === 'compra' ? form.condicion_propiedad : null,
        valor_uf: Number(form.valor_uf),
        situacion_laboral: form.situacion_laboral,
        sueldo_promedio: Number(form.sueldo_promedio.replace(/\D/g, '')),
      }

      const { error: insertError } = await supabase.from('solicitudes_credito').insert([payload])
      if (insertError) throw insertError

      await supabase.functions.invoke('notify-credito', { body: { record: payload } })

      setStatus('ok')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ocurrió un error al enviar la solicitud. Intenta nuevamente.')
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20">
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(61,170,110,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          {/* `--green-dark`: el círculo es `rgba(61,170,110,0.12)` sobre blanco,
              o sea un fondo efectivo de ~`#E8F5EE`. Ahí `--green` da 2,58:1 y
              `--green-dark` 4,28:1. Es la misma cara de la regla 4.2 que el visto
              de Rental: marca verde sobre superficie clara. */}
          <Check size={28} color="var(--green-dark)" />
        </div>
        <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginBottom: 10 }}>
          {successTitle}
        </h2>
        <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420, marginBottom: successAction ? 28 : 0 }}>
          {successMessage}
        </p>
        {successAction}
      </div>
    )
  }

  return (
    <>
      <h2 className="font-serif font-light text-sdm-2xl" style={{ color: 'var(--navy-dark)', marginBottom: subtitle ? 8 : 24 }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sdm-base" style={{ fontWeight: 300, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
          {subtitle}
        </p>
      )}

      <form onSubmit={submit} className="flex flex-col gap-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col gap-2">
            <span style={labelStyle}>Nombres</span>
            <input required className="input-line" value={form.nombres} onChange={set('nombres')} placeholder="Tus nombres" />
          </label>
          <label className="flex flex-col gap-2">
            <span style={labelStyle}>Apellidos</span>
            <input required className="input-line" value={form.apellidos} onChange={set('apellidos')} placeholder="Tus apellidos" />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <label className="flex flex-col gap-2">
            <span style={labelStyle}>Email</span>
            <input required type="email" className="input-line" value={form.email} onChange={set('email')} placeholder="tu@email.com" />
          </label>
          <label className="flex flex-col gap-2">
            <span style={labelStyle}>Teléfono</span>
            <input required type="tel" className="input-line" value={form.telefono} onChange={set('telefono')} placeholder="+56 9 ···" />
          </label>
        </div>

        <label className="flex flex-col gap-2" style={{ maxWidth: 220 }}>
          <span style={labelStyle}>RUT</span>
          <input required className="input-line" value={form.rut} onChange={e => setForm(f => ({ ...f, rut: formatRut(e.target.value) }))} placeholder="12.345.678-9" />
        </label>

        <RadioGroup
          label="¿Qué quieres hacer?"
          value={form.accion}
          onChange={setRadio('accion')}
          options={[
            { value: 'compra', label: 'Comprar una propiedad' },
            { value: 'refinanciamiento', label: 'Refinanciar un crédito' },
          ]}
        />

        {form.accion === 'compra' && (
          <>
            <RadioGroup
              label="¿Buscas propiedad nueva o usada?"
              value={form.condicion_propiedad}
              onChange={setRadio('condicion_propiedad')}
              options={[
                { value: 'nueva', label: 'Nueva' },
                { value: 'usada', label: 'Usada' },
              ]}
            />

            <label className="flex flex-col gap-2">
              <span style={labelStyle}>Tipo de propiedad</span>
              <select className="input-line" value={form.tipo_propiedad} onChange={set('tipo_propiedad')}>
                <option value="" disabled>Selecciona…</option>
                {TIPOS_PROPIEDAD.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </>
        )}

        <div className="flex flex-col gap-2">
          {/* Acá el <label> envuelve solo al input, no al div entero: el texto
              de ayuda de la UF cambia solo y no debe entrar en el nombre
              accesible del campo. Los gap-2 anidados dan la misma separación
              de 8px entre los tres elementos que había antes. */}
          <label className="flex flex-col gap-2">
            <span style={labelStyle}>Valor de la propiedad (UF)</span>
            <input required type="number" min="0" className="input-line" value={form.valor_uf} onChange={set('valor_uf')} placeholder="Ej: 5000" />
          </label>
          {uf.loading ? (
            <p className="text-sdm-sm" style={{ color: 'var(--muted)' }}>Consultando valor UF…</p>
          ) : uf.error ? (
            <p className="text-sdm-sm" style={{ color: 'var(--muted)' }}>Consulta el valor vigente en mindicador.cl</p>
          ) : (
            <p className="text-sdm-sm" style={{ color: 'var(--muted)' }}>
              Valor UF hoy: ${Math.round(uf.valor as number).toLocaleString('es-CL')} CLP
            </p>
          )}
        </div>

        <RadioGroup
          label="Situación laboral"
          value={form.situacion_laboral}
          onChange={setRadio('situacion_laboral')}
          options={[
            { value: 'dependiente', label: 'Trabajador dependiente' },
            { value: 'independiente', label: 'Trabajador independiente' },
          ]}
        />

        <label className="flex flex-col gap-2">
          <span style={labelStyle}>Promedio estimado de sueldo líquido mensual (últimos 3 meses)</span>
          <input
            required
            inputMode="numeric"
            className="input-line"
            value={form.sueldo_promedio}
            onChange={e => setForm(f => ({ ...f, sueldo_promedio: formatThousands(e.target.value) }))}
            placeholder="Ej: 1.500.000"
          />
        </label>

        {status === 'error' && (
          <p className="text-sdm-base" style={{ color: 'var(--error)' }}>{errorMsg || 'Error al enviar. Intenta de nuevo.'}</p>
        )}

        <button type="submit" disabled={!canSubmit} className="btn-primary justify-center">
          {status === 'sending' ? (
            <span className="flex items-center gap-2"><Loader2 aria-hidden="true" size={15} className="animate-spin" /> Enviando…</span>
          ) : 'Enviar solicitud'}
        </button>
      </form>
    </>
  )
}
