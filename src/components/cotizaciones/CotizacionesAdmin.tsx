import { useState, useEffect, useCallback, useRef } from 'react'
import { Check, FileText, Loader2, Mail, Pencil, PencilLine, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { obtenerIndicadores } from '@/lib/indicadores'
import { Guardado, useGuardado } from '@/components/admin/acciones'
import { Field, FieldGroup } from '@/components/admin/campos'
import { subirImagen } from '@/lib/subirImagen'
import { REGIONES, getComunas } from '@/data/comunas-chile'
import type { Cotizacion, CotizacionDraft, EstadoCotizacion, FormaPago, Propiedad } from '@/types'

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY_DRAFT: CotizacionDraft = {
  estado:         'borrador',
  cliente_nombre: '',
  prop_titulo:    '',
  valor_uf:       0,
  prop_pais:      'Chile',
}

const PAISES = [
  'Chile', 'Paraguay', 'Argentina', 'Uruguay', 'Brasil',
  'Colombia', 'Perú', 'México', 'España', 'Estados Unidos', 'Otro',
]

// Hex a propósito, no `var(--…)`: el selector de estado deriva su fondo
// concatenando el alfa —`ESTADO_COLORS[estado] + '22'`—, y eso es aritmética de
// color en JS. Con una variable saldría la cadena `var(--error)22`, que no es
// CSS válido, y el fondo se caería solo en «Rechazada».
// `rechazada` es el espejo de `--error` de globals.css: si allá cambia, acá hay
// que copiarlo a mano.
const ESTADO_COLORS: Record<EstadoCotizacion, string> = {
  borrador:  '#7a8a96',
  enviada:   '#1C3D5C',
  aceptada:  '#3DAA6E',
  rechazada: '#A8384B',
}
const ESTADO_LABELS: Record<EstadoCotizacion, string> = {
  borrador:  'Borrador',
  enviada:   'Enviada',
  aceptada:  'Aceptada',
  rechazada: 'Rechazada',
}
const FORMA_LABELS: Record<FormaPago, string> = {
  contado: 'Contado',
  credito: 'Crédito hipotecario',
  leasing: 'Leasing inmobiliario',
  mixto:   'Mixto',
}

const STEP_LABELS = ['Cliente', 'Propiedad', 'Precios', 'Forma de pago', 'Ejecutivo']

// Días de vigencia con que nace una cotización nueva. El PDF imprime este valor
// tal cual y calcula la fecha límite sumándolo a created_at.
const VIGENCIA_DIAS_DEFECTO = 15

// Alternar entre buscar en el catálogo y escribir a mano es una decisión real,
// no una nota al pie: como enlace subrayado en gris no se leía como clickeable.
// Mismo peso visual que el resto de controles del admin.
const BTN_MODO: React.CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex', alignItems: 'center', gap: 7,
  padding: '9px 16px',
  background: '#fff',
  borderRadius: 2,
  fontSize: 'var(--sdm-text-xs)', fontWeight: 600, letterSpacing: 'var(--sdm-tracking-wide)', textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
}

// ─── Generación de PDF bajo demanda ──────────────────────────────────────────
// @react-pdf/renderer pesa ~2 MB y solo hace falta al descargar una cotización.
// Con el import estático, el chunk `pdf` entraba en cualquier pestaña de /admin.
// Estas dos funciones lo cargan recién al hacer clic; el navegador cachea el
// módulo, así que la espera es solo la primera vez.
async function generarBlobPDF(c: Cotizacion): Promise<Blob> {
  const [{ pdf }, { CotizacionPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./CotizacionPDF'),
  ])
  return pdf(<CotizacionPDF c={c} />).toBlob()
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

const PAD = (n: number) => `COT-${String(n).padStart(4, '0')}`
const n0  = (v: string | number | undefined) =>
  v !== undefined && v !== '' ? Number(v) : undefined
const fmtN = (n: number, d = 0) =>
  n.toLocaleString('es-CL', { minimumFractionDigits: d, maximumFractionDigits: d })

function calcDividendo(credito: number, tasa: number, plazo: number) {
  const r = (tasa / 100) / 12
  const n = plazo * 12
  if (r === 0 || n === 0) return credito / (n || 1)
  return credito * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

// ─── Hook UF ─────────────────────────────────────────────────────────────────
function useUF() {
  const [uf,      setUf]      = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Devuelve el valor además de guardarlo: quien lo pide suele necesitarlo en el
  // acto y leer el estado justo después daría el valor anterior.
  const fetch_ = useCallback(async (): Promise<number | null> => {
    setLoading(true)
    let valor: number | null = null
    try {
      // La fuente vive en `src/lib/indicadores.ts` desde el 2026-08-09: la
      // comparte con la barra del header para que no haya dos consultas ni dos
      // criterios de validación. El valor es el MISMO —`uf.valor` de
      // mindicador, verificado 40.844,79 por las dos vías— y sigue siendo
      // `null` ante cualquier fallo, que es lo que este wizard espera para
      // dejar el campo editable a mano.
      const { uf: ind } = await obtenerIndicadores()
      valor = ind ? ind.valor : null
      setUf(valor)
    } catch { /* silent */ }
    setLoading(false)
    return valor
  }, [])

  useEffect(() => { fetch_() }, [fetch_])
  return { uf, ufLoading: loading, refreshUF: fetch_ }
}

// ─── ImageUploader (Supabase Storage bucket: imagenes) ───────────────────────
function ImageUploader({
  currentUrl, onUploaded, folder = 'general',
}: {
  currentUrl?: string
  onUploaded: (url: string) => void
  folder?: string
}) {
  const [uploading, setUploading] = useState(false)

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const r = await subirImagen(file, folder)
    if (r) onUploaded(r.url)
    setUploading(false)
  }

  return (
    <div className="flex items-center gap-4 text-sdm-sm tracking-sdm-wide">
      {currentUrl && (
        <img src={currentUrl} alt="" className="w-16 h-16 object-cover rounded" style={{ border: '1px solid var(--border)' }} />
      )}
      <label className="text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
        background: uploading ? 'var(--muted)' : 'var(--navy-dark)',
        color: '#fff', padding: '9px 18px', borderRadius: 2,
        cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 600, textTransform: 'uppercase' }}>
        {uploading ? 'Subiendo…' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {currentUrl && (
        <input
          value={currentUrl}
          readOnly
          aria-label="URL de la imagen"
          className="input-line flex-1 text-sdm-sm"
          style={{ color: 'var(--muted)' }}
          onClick={e => (e.target as HTMLInputElement).select()}
        />
      )}
    </div>
  )
}


function Inp({
  value, onChange, type = 'text', placeholder = '', disabled = false,
}: {
  value: string | number | undefined
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      className="input-line"
      style={disabled ? { color: 'var(--muted)', cursor: 'default' } : undefined}
      onChange={e => onChange(e.target.value)}
    />
  )
}

// Input numérico con estado local — permite editar libremente sin rebotes
function NumInp({
  value, onChange, placeholder = '', min,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  placeholder?: string
  min?: number
}) {
  const [local, setLocal] = useState(value !== undefined ? String(value) : '')
  const prev = useRef(value)

  useEffect(() => {
    if (value !== prev.current) {
      setLocal(value !== undefined ? String(value) : '')
      prev.current = value
    }
  }, [value])

  return (
    <input
      type="number"
      value={local}
      placeholder={placeholder}
      min={min}
      className="input-line"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const n = local === '' ? undefined : Number(local)
        prev.current = n
        onChange(n)
      }}
    />
  )
}

// Input de amenidades con estado local — evita rebote al escribir comas/espacios
function AmenidadesInput({
  value, onChange,
}: {
  value: string[]
  onChange: (v: string[]) => void
}) {
  const [local, setLocal] = useState((value ?? []).join(', '))
  const prev = useRef((value ?? []).join(', '))

  useEffect(() => {
    const joined = (value ?? []).join(', ')
    if (joined !== prev.current) {
      setLocal(joined)
      prev.current = joined
    }
  }, [value])

  return (
    <input
      type="text"
      value={local}
      placeholder="Piscina, Gimnasio, Quincho"
      className="input-line"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => {
        const arr = local.split(',').map(s => s.trim()).filter(Boolean)
        prev.current = arr.join(', ')
        onChange(arr)
      }}
    />
  )
}

function Sel({
  value, onChange, options, disabled = false,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="input-line"
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Indicador de pasos ───────────────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEP_LABELS.map((lbl, i) => {
        const idx  = i + 1
        const done = idx < step
        const active = idx === step
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="text-sdm-sm"
                style={{ width: 30, height: 30, borderRadius: '50%',
                  background: active ? 'var(--green)' : done ? 'var(--navy-dark)' : 'var(--border)',
                  color: active || done ? '#fff' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, flexShrink: 0 }}
              >
                {done ? <Check size={14} strokeWidth={3} /> : idx}
              </div>
              <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase',
                color: active ? 'var(--navy-dark)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap' }}>
                {lbl}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{
                width: 48, height: 1, margin: '0 4px', marginBottom: 22,
                background: done ? 'var(--navy-dark)' : 'var(--border)', flexShrink: 0,
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Wizard ───────────────────────────────────────────────────────────────────
function CotizacionWizard({
  draft, setDraft, step, setStep,
  uf, ufLoading, refreshUF,
  propiedades,
  onSave, onCancel, saving,
}: {
  draft: CotizacionDraft
  setDraft: React.Dispatch<React.SetStateAction<CotizacionDraft>>
  step: number
  setStep: (s: number) => void
  uf: number | null
  ufLoading: boolean
  refreshUF: () => Promise<number | null>
  propiedades: Propiedad[]
  onSave: (estado?: EstadoCotizacion) => Promise<void>
  onCancel: () => void
  saving: boolean
}) {
  const upd = (patch: Partial<CotizacionDraft>) =>
    setDraft(d => ({ ...d, ...patch }))

  const esChile = (draft.prop_pais ?? 'Chile') === 'Chile'

  // ── Cálculos derivados (Paso 3) ──────────────────────────────────────────
  const precioFinalUF  = (draft.precio_uf ?? 0) * (1 - (draft.descuento_pct ?? 0) / 100)
  const precioFinalCLP = precioFinalUF * (draft.valor_uf ?? 0)
  const precioClp      = (draft.precio_uf ?? 0) * (draft.valor_uf ?? 0)

  // ── Cálculos derivados (Paso 4) ──────────────────────────────────────────
  const pieUF     = precioFinalUF * (draft.pie_pct ?? 0) / 100
  const creditoUF = precioFinalUF - pieUF
  const divUF     = (draft.tasa_anual && draft.plazo_anos && creditoUF > 0)
    ? calcDividendo(creditoUF, draft.tasa_anual, draft.plazo_anos)
    : undefined

  // Sync cálculos al draft cuando cambian
  useEffect(() => {
    upd({
      precio_clp:       precioClp      || undefined,
      precio_final_uf:  precioFinalUF  || undefined,
      precio_final_clp: precioFinalCLP || undefined,
      pie_uf:           pieUF          || undefined,
      credito_uf:       creditoUF      || undefined,
      dividendo_uf:     divUF,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps -- este efecto ESCRIBE en `draft` lo que deriva de `draft`, así que el array lleva las ENTRADAS del cálculo y no sus resultados. Lo que esconde son `precioClp`, `precioFinalUF`, `precioFinalCLP`, `pieUF`, `creditoUF`, `divUF` y `upd`: los seis primeros son las salidas —ponerlas es cerrar el lazo cálculo → escritura → recálculo—, y `upd` es una función sin memoizar que cambia de identidad en cada render, con lo que el efecto correría siempre. El disable venía sin razón escrita desde `8c9e412`.
  }, [draft.precio_uf, draft.descuento_pct, draft.valor_uf, draft.pie_pct, draft.tasa_anual, draft.plazo_anos])

  // ── Selección de propiedad ───────────────────────────────────────────────
  const [propSearch, setPropSearch] = useState('')
  // Al crear se arranca en el buscador del catálogo: la mayoría de las
  // cotizaciones son de propiedades ya publicadas, y tipearlas a mano duplica
  // datos que ya existen. Al editar una que ya trae título se entra directo a
  // los campos, que es lo que se viene a retocar.
  const [manualProp, setManualProp] = useState(Boolean(draft.prop_titulo))

  const propsFiltradas = propiedades.filter(p =>
    p.titulo.toLowerCase().includes(propSearch.toLowerCase()) ||
    p.comuna?.toLowerCase().includes(propSearch.toLowerCase())
  )

  const selectProp = (p: Propiedad) => {
    upd({
      propiedad_id:          p.id,
      prop_titulo:           p.titulo,
      prop_tipo:             p.tipo,
      prop_direccion:        p.direccion,
      prop_comuna:           p.comuna,
      prop_region:           p.region,
      prop_dormitorios:      p.dormitorios,
      prop_banos:            p.banos,
      prop_sup_total:        p.superficie_total,
      prop_sup_util:         p.superficie_util,
      prop_estacionamientos: p.estacionamientos,
      prop_bodegas:          p.bodegas,
      prop_amenidades:       p.amenidades,
      // Sin fallback, una propiedad sin portada definida entraba con la imagen
      // vacía y el PDF terminaba mostrando "Sin imagen" pese a tener fotos.
      prop_imagen_url:       p.imagen_principal || p.imagenes?.[0],
      precio_uf:             p.precio_uf,
      precio_clp:            p.precio_clp,
    })
    setManualProp(true)
    setPropSearch('')
  }

  // ── Validación por paso ──────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return !!draft.cliente_nombre.trim()
    if (step === 2) return !!draft.prop_titulo.trim()
    if (step === 3) return (draft.valor_uf ?? 0) > 0
    return true
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Cabecera */}
      <div className="flex flex-col items-start gap-3 mb-8 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <div>
          <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
            {draft.id ? `Editar ${PAD(0)}` : 'Nueva Cotización'}
          </h2>
          <p className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 4 }}>
            Completa los 5 pasos para generar la cotización
          </p>
        </div>
        <button className="text-sdm-sm tracking-sdm-wide" onClick={onCancel} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
          ← Volver a Cotizaciones
        </button>
      </div>

      <StepIndicator step={step} />

      <div className="bg-white p-8" style={{ borderRadius: 2, border: '1px solid var(--border)', minHeight: 340 }}>

        {/* ── PASO 1: CLIENTE ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Datos del cliente
            </h3>
            {/* `items-end`: «Nombre completo *» envuelve a dos líneas a 390px
                y «RUT» no, así que sus inputs quedaban a 17px de distancia.
                Ver la nota de `Field` en campos.tsx. */}
            <div className="grid grid-cols-2 gap-6 items-end">
              <Field label="Nombre completo *">
                <Inp value={draft.cliente_nombre} placeholder="Juan Pérez" onChange={v => upd({ cliente_nombre: v })} />
              </Field>
              <Field label="RUT">
                <Inp value={draft.cliente_rut} placeholder="12.345.678-9" onChange={v => upd({ cliente_rut: v })} />
              </Field>
              <Field label="Email">
                <Inp value={draft.cliente_email} type="email" placeholder="juan@email.com" onChange={v => upd({ cliente_email: v })} />
              </Field>
              <Field label="Teléfono">
                <Inp value={draft.cliente_telefono} placeholder="+56 9 1234 5678" onChange={v => upd({ cliente_telefono: v })} />
              </Field>
              <Field label="Empresa / Institución">
                <Inp value={draft.cliente_empresa} placeholder="Empresa S.A." onChange={v => upd({ cliente_empresa: v })} />
              </Field>
            </div>
          </div>
        )}

        {/* ── PASO 2: PROPIEDAD ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Propiedad
            </h3>

            {/* Buscador de catálogo */}
            {!manualProp && (
              <div className="flex flex-col gap-3">
                <Field label="Buscar en catálogo SDM">
                  <input
                    type="text"
                    className="input-line"
                    placeholder="Escribe título, comuna…"
                    value={propSearch}
                    onChange={e => setPropSearch(e.target.value)}
                  />
                </Field>
                {/* Sin tope de resultados. Lo habia -- .slice(0, 12) -- y no lo
                    justificaba ni el espacio ni el rendimiento: el contenedor ya
                    scrollea (maxHeight 220) y el catalogo son 53 filas que ademas
                    vienen filtradas por el termino de busqueda. Lo unico que
                    lograba era que la propiedad numero 13 no apareciera, sin
                    decirlo: quien la buscaba concluia que no estaba en el catalogo. */}
                {propSearch.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 2, maxHeight: 220, overflowY: 'auto' }}>
                    {propsFiltradas.length === 0 ? (
                      <div className="text-sdm-sm" style={{ padding: '12px 16px', color: 'var(--muted)' }}>Ninguna propiedad coincide. Prueba con otro término.</div>
                    ) : propsFiltradas.map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectProp(p)}
                        className="w-full text-left"
                        style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 16px', borderBottom: '1px solid var(--border-input)', background: 'none', cursor: 'pointer' }}
                      >
                        <span className="text-sdm-sm" style={{ fontWeight: 500, color: 'var(--navy-dark)' }}>{p.titulo}</span>
                        <span className="text-sdm-xs" style={{ color: 'var(--muted)' }}>
                          {[p.tipo, p.comuna, p.region].filter(Boolean).join(' · ')}
                          {p.precio_uf ? `  ·  ${p.precio_uf.toLocaleString('es-CL')} UF` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setManualProp(true)}
                  className="border border-[var(--border-input)] text-[var(--navy-dark)] hover:border-[var(--green-dark)] hover:text-[var(--green-dark)]"
                  style={BTN_MODO}
                >
                  <PencilLine aria-hidden="true" size={13} />
                  Ingresar datos manualmente
                </button>
              </div>
            )}

            {/* Campos manuales */}
            {manualProp && (
              <>
                {!draft.propiedad_id && (
                  <button
                    onClick={() => { setManualProp(false); setPropSearch('') }}
                    className="border border-[var(--border-input)] text-[var(--navy-dark)] hover:border-[var(--green-dark)] hover:text-[var(--green-dark)]"
                    style={BTN_MODO}
                  >
                    <Search aria-hidden="true" size={13} />
                    Buscar en catálogo
                  </button>
                )}
                {draft.propiedad_id && (
                  <div className="text-sdm-sm" style={{ color: 'var(--green-dark)', marginBottom: -8 }}>
                    <Check size={14} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-2px' }} /> Propiedad vinculada al catálogo — puedes editar los datos del snapshot
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <Field label="Título *">
                    <Inp value={draft.prop_titulo} placeholder="Departamento en Las Condes" onChange={v => upd({ prop_titulo: v })} />
                  </Field>
                  <Field label="Tipo">
                    <Sel value={draft.prop_tipo ?? ''} onChange={v => upd({ prop_tipo: v })} options={[
                      { value: '',             label: 'Sin especificar' },
                      { value: 'departamento', label: 'Departamento' },
                      { value: 'casa',         label: 'Casa' },
                      { value: 'oficina',      label: 'Oficina' },
                      { value: 'parcela',      label: 'Parcela' },
                      { value: 'comercial',    label: 'Comercial' },
                      { value: 'hotel',        label: 'Hotel' },
                      { value: 'terreno',      label: 'Terreno' },
                      { value: 'otro',         label: 'Otro' },
                    ]} />
                  </Field>
                  <Field label="Dirección">
                    <Inp value={draft.prop_direccion} placeholder="Av. Apoquindo 1234" onChange={v => upd({ prop_direccion: v })} />
                  </Field>
                </div>

                {/* País → Región/Comuna en cascada */}
                <div className="grid grid-cols-3 gap-6">
                  <Field label="País">
                    <select
                      value={draft.prop_pais ?? 'Chile'}
                      onChange={e => {
                        upd({ prop_pais: e.target.value, prop_region: '', prop_comuna: '', prop_ciudad: '' })
                      }}
                      className="input-line"
                      style={{ cursor: 'pointer' }}
                    >
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>

                  {esChile ? (
                    <>
                      <Field label="Región">
                        <select
                          value={draft.prop_region ?? ''}
                          onChange={e => upd({ prop_region: e.target.value, prop_comuna: '' })}
                          className="input-line"
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="">Seleccionar región…</option>
                          {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </Field>
                      <Field label="Comuna">
                        <select
                          value={draft.prop_comuna ?? ''}
                          onChange={e => upd({ prop_comuna: e.target.value })}
                          disabled={!draft.prop_region}
                          className="input-line"
                          style={{ cursor: draft.prop_region ? 'pointer' : 'not-allowed', opacity: draft.prop_region ? 1 : 0.5 }}
                        >
                          <option value="">
                            {draft.prop_region ? 'Seleccionar comuna…' : 'Primero elige una región'}
                          </option>
                          {getComunas(draft.prop_region ?? '').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </>
                  ) : (
                    <Field label="Ciudad">
                      <Inp
                        value={draft.prop_ciudad}
                        placeholder="Asunción, Buenos Aires…"
                        onChange={v => upd({ prop_ciudad: v })}
                      />
                    </Field>
                  )}
                </div>

                {/* Imagen */}
                {/* FieldGroup y no Fld: ImageUploader trae su propio <label>
                    alrededor de un <input type="file"> oculto, más un segundo
                    input con la URL. Un <label> por fuera anidaría etiquetas y
                    apuntaría al selector de archivos. */}
                <FieldGroup label="Imagen principal">
                  <ImageUploader
                    currentUrl={draft.prop_imagen_url}
                    folder="cotizaciones"
                    onUploaded={url => upd({ prop_imagen_url: url })}
                  />
                </FieldGroup>

                <div className="grid grid-cols-5 gap-4">
                  <Field label="Dormitorios">
                    <Inp value={draft.prop_dormitorios} type="number" placeholder="3" onChange={v => upd({ prop_dormitorios: n0(v) })} />
                  </Field>
                  <Field label="Baños">
                    <Inp value={draft.prop_banos} type="number" placeholder="2" onChange={v => upd({ prop_banos: n0(v) })} />
                  </Field>
                  <Field label="Sup. Útil m²">
                    <Inp value={draft.prop_sup_util} type="number" placeholder="85" onChange={v => upd({ prop_sup_util: n0(v) })} />
                  </Field>
                  <Field label="Estac.">
                    <Inp value={draft.prop_estacionamientos} type="number" placeholder="1" onChange={v => upd({ prop_estacionamientos: n0(v) })} />
                  </Field>
                  <Field label="Bodegas">
                    <Inp value={draft.prop_bodegas} type="number" placeholder="1" onChange={v => upd({ prop_bodegas: n0(v) })} />
                  </Field>
                </div>

                <Field label="Amenidades (separadas por coma)">
                  <AmenidadesInput
                    value={draft.prop_amenidades ?? []}
                    onChange={v => upd({ prop_amenidades: v })}
                  />
                </Field>
              </>
            )}
          </div>
        )}

        {/* ── PASO 3: PRECIOS ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Precios
            </h3>

            {/* UF del día */}
            <div className="flex items-end gap-4 p-4" style={{ background: 'var(--sky-pale)', borderRadius: 2 }}>
              {/* FieldGroup y no Fld: acá no hay ningún control. Es un valor
                  de solo lectura con su rótulo, y un <label> que no envuelve a
                  nada no etiqueta nada. */}
              <FieldGroup label="Valor UF del día (auto)">
                <div className="text-sdm-2xl" style={{ fontWeight: 700, color: 'var(--navy-dark)', fontFamily: 'Inter', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  {draft.valor_uf > 0
                    ? `$ ${draft.valor_uf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : ufLoading ? 'Cargando…' : '—'}
                </div>
              </FieldGroup>
              <button
                onClick={async () => { const v = await refreshUF(); if (v) upd({ valor_uf: v }) }}
                disabled={ufLoading}
                className="btn-primary text-sdm-xs"
                style={{ padding: '8px 16px', marginBottom: 1 }}
              >
                {ufLoading ? '…' : '⟳ Actualizar'}
              </button>
              {uf && draft.valor_uf !== uf && (
                <button className="text-sdm-xs"
                  onClick={() => upd({ valor_uf: uf })}
                  style={{ color: 'var(--green-dark)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: 10 }}
                >
                  Usar valor actual ({uf.toLocaleString('es-CL', { maximumFractionDigits: 2 })})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Precio publicado (UF)">
                <Inp value={draft.precio_uf} type="number" placeholder="5000" onChange={v => upd({ precio_uf: n0(v) })} />
              </Field>
              <Field label="Descuento (%)">
                <Inp value={draft.descuento_pct} type="number" placeholder="0" onChange={v => upd({ descuento_pct: n0(v) })} />
              </Field>
            </div>

            {/* Resumen calculado */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { lbl: 'Precio en CLP',    val: precioClp      ? `$ ${fmtN(Math.round(precioClp))}` : '—' },
                { lbl: 'Precio final UF',  val: precioFinalUF  ? `${fmtN(precioFinalUF, 2)} UF` : '—', hl: true },
                { lbl: 'Precio final CLP', val: precioFinalCLP ? `$ ${fmtN(Math.round(precioFinalCLP))}` : '—', hl: true },
              ].map(({ lbl, val, hl }) => (
                <div key={lbl} className="p-4" style={{ background: hl ? 'var(--navy-dark)' : 'var(--sky-pale)', borderRadius: 2 }}>
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: hl ? 'var(--sky)' : 'var(--muted)', marginBottom: 6 }}>{lbl}</div>
                  <div className="text-sdm-xl" style={{ fontWeight: 700, color: hl ? '#fff' : 'var(--navy-dark)' }}>{val}</div>
                </div>
              ))}
            </div>

            <Field label="Precio USD (opcional)">
              <Inp value={draft.precio_usd} type="number" placeholder="190000" onChange={v => upd({ precio_usd: n0(v) })} />
            </Field>
          </div>
        )}

        {/* ── PASO 4: FORMA DE PAGO ── */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Forma de pago
            </h3>

            <Field label="Modalidad">
              <Sel value={draft.forma_pago ?? ''} onChange={v => upd({ forma_pago: v as FormaPago })} options={[
                { value: '',        label: 'Sin especificar' },
                { value: 'contado', label: 'Contado' },
                { value: 'credito', label: 'Crédito hipotecario' },
                { value: 'leasing', label: 'Leasing inmobiliario' },
                { value: 'mixto',   label: 'Mixto (pie + crédito)' },
              ]} />
            </Field>

            {draft.forma_pago && draft.forma_pago !== 'contado' && (
              <>
                {/* Barra visual */}
                <div>
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Distribución Pie / Crédito
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${draft.pie_pct ?? 0}%`, background: 'var(--green)', transition: 'width .3s' }} />
                    <div style={{ flex: 1, background: 'var(--sky)' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sdm-xs" style={{ color: 'var(--green-dark)', fontWeight: 600 }}>Pie {draft.pie_pct ?? 0}%  ·  {fmtN(pieUF, 2)} UF</span>
                    <span className="text-sdm-xs" style={{ color: 'var(--navy)', fontWeight: 600 }}>Crédito {100 - (draft.pie_pct ?? 0)}%  ·  {fmtN(creditoUF, 2)} UF</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Field label="% Pie">
                    <Inp value={draft.pie_pct} type="number" placeholder="20" onChange={v => upd({ pie_pct: n0(v) })} />
                  </Field>
                  <Field label="Plazo (años)">
                    <Inp value={draft.plazo_anos} type="number" placeholder="20" onChange={v => upd({ plazo_anos: n0(v) })} />
                  </Field>
                  <Field label="Tasa anual (%)">
                    <Inp value={draft.tasa_anual} type="number" placeholder="4.5" onChange={v => upd({ tasa_anual: n0(v) })} />
                  </Field>
                </div>

                {divUF != null && (
                  <div className="p-4" style={{ background: 'var(--sky-pale)', borderRadius: 2 }}>
                    <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                      Dividendo mensual estimado
                    </div>
                    <div className="text-sdm-2xl" style={{ fontWeight: 700, color: 'var(--navy-dark)' }}>
                      {fmtN(divUF, 2)} UF / mes
                    </div>
                    <div className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 4 }}>
                      ≈ $ {fmtN(Math.round(divUF * (draft.valor_uf ?? 0)))} / mes
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── PASO 5: EJECUTIVO Y OBSERVACIONES ── */}
        {step === 5 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-sdm-base" style={{ fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Ejecutivo y observaciones
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Nombre ejecutivo">
                <Inp value={draft.ejecutivo_nombre} placeholder="María González" onChange={v => upd({ ejecutivo_nombre: v })} />
              </Field>
              <Field label="Cargo">
                <Inp value={draft.ejecutivo_cargo} placeholder="Ejecutiva Comercial" onChange={v => upd({ ejecutivo_cargo: v })} />
              </Field>
              <Field label="Email ejecutivo">
                <Inp value={draft.ejecutivo_email} type="email" placeholder="maria@sdmcapital.cl" onChange={v => upd({ ejecutivo_email: v })} />
              </Field>
              <Field label="Teléfono ejecutivo">
                <Inp value={draft.ejecutivo_telefono} placeholder="+56 9 1234 5678" onChange={v => upd({ ejecutivo_telefono: v })} />
              </Field>
            </div>
            <Field label="Observaciones">
              <textarea
                className="input-line resize-none"
                rows={4}
                placeholder="Condiciones especiales, notas para el cliente…"
                value={draft.observaciones ?? ''}
                onChange={e => upd({ observaciones: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Vigencia (días)">
                <NumInp
                  value={draft.vigencia_dias}
                  placeholder="30"
                  min={1}
                  onChange={v => upd({ vigencia_dias: v })}
                />
              </Field>
              <Field label="Estado inicial">
                <Sel value={draft.estado} onChange={v => upd({ estado: v as EstadoCotizacion })} options={[
                  { value: 'borrador',  label: 'Borrador' },
                  { value: 'enviada',   label: 'Enviada' },
                  { value: 'aceptada',  label: 'Aceptada' },
                  { value: 'rechazada', label: 'Rechazada' },
                ]} />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          {step > 1 ? '← Anterior' : '× Cancelar'}
        </button>

        <div className="flex items-center gap-3">
          {step < 5 ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary"
            >
              Siguiente →
            </button>
          ) : (
            <>
              <button onClick={() => onSave('borrador')} disabled={saving} className="btn-outline" style={{ color: 'var(--muted)', border: '1px solid var(--border-input)' }}>
                {saving ? 'Guardando…' : 'Guardar borrador'}
              </button>
              <button onClick={() => onSave('enviada')} disabled={saving} className="btn-green">
                {saving ? 'Guardando…' : 'Guardar y marcar enviada →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
export function CotizacionesAdmin() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([])
  const [guardado, avisarGuardado] = useGuardado()
  const [loading,      setLoading]      = useState(true)
  const [editing,      setEditing]      = useState<CotizacionDraft | null>(null)
  const [step,         setStep]         = useState(1)
  const [saving,       setSaving]       = useState(false)
  const [propiedades,  setPropiedades]  = useState<Propiedad[]>([])
  const [deleting,     setDeleting]     = useState<string | null>(null)
  const [gmailLoading, setGmailLoading] = useState<string | null>(null)
  const [pdfLoading,   setPdfLoading]   = useState<string | null>(null)

  const { uf, ufLoading, refreshUF } = useUF()

  const loadCots = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cotizaciones')
      .select('*')
      .order('created_at', { ascending: false })
    setCotizaciones(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadCots() }, [loadCots])

  useEffect(() => {
    supabase
      .from('propiedades')
      .select('id, titulo, tipo, direccion, comuna, region, dormitorios, banos, superficie_total, superficie_util, estacionamientos, bodegas, amenidades, imagen_principal, imagenes, precio_uf, precio_clp, activo')
      .eq('activo', true)
      .order('titulo')
      .then(({ data }) => setPropiedades((data ?? []) as Propiedad[]))
  }, [])

  // La UF se vuelve a pedir al abrir el wizard: el panel puede llevar horas
  // abierto y el valor traído al montar quedaría de ayer. created_at lo pone la
  // base con now(), así que la fecha del documento siempre es la del guardado.
  const openCreate = async () => {
    setStep(1)
    setEditing({ ...EMPTY_DRAFT, valor_uf: uf ?? 0, vigencia_dias: VIGENCIA_DIAS_DEFECTO })
    const actual = await refreshUF()
    if (actual) setEditing(d => (d ? { ...d, valor_uf: actual } : d))
  }

  const openEdit = (c: Cotizacion) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, numero, created_at, updated_at, ...rest } = c
    setEditing({ ...rest, id })
    setStep(1)
  }

  const onSave = async (estadoOverride?: EstadoCotizacion) => {
    if (!editing) return
    setSaving(true)
    const payload: Record<string, unknown> = {
      ...editing,
      estado: estadoOverride ?? editing.estado,
    }
    delete payload.id

    const { error } = editing.id
      ? await supabase.from('cotizaciones').update(payload).eq('id', editing.id)
      : await supabase.from('cotizaciones').insert(payload)

    setSaving(false)

    // Si falla se deja el wizard abierto y `editing` intacto: quien completó los
    // cinco pasos no debería perderlos por un error de la base.
    if (avisarError('No se pudo guardar la cotización', error)) return

    avisarGuardado()
    await loadCots()
    setEditing(null)
  }

  const updateEstado = async (id: string, estado: EstadoCotizacion) => {
    const { error } = await supabase.from('cotizaciones').update({ estado }).eq('id', id)
    // El <select> se pinta desde el estado local, así que no tocarlo deja a la
    // vista el valor que de verdad tiene la base.
    if (avisarError('No se pudo cambiar el estado de la cotización', error)) return
    setCotizaciones(cs => cs.map(c => c.id === id ? { ...c, estado } : c))
  }

  const deleteCot = async (id: string) => {
    const c = cotizaciones.find(x => x.id === id)
    if (!confirm(`¿Eliminar ${c ? PAD(c.numero) : 'esta cotización'}? No se puede deshacer.`)) return
    setDeleting(id)
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
    setDeleting(null)
    if (avisarError('No se pudo eliminar la cotización', error)) return
    setCotizaciones(cs => cs.filter(c => c.id !== id))
  }

  const nombreArchivo = (c: Cotizacion) =>
    `${PAD(c.numero)}-${c.cliente_nombre.replace(/\s+/g, '-')}.pdf`

  const descargarPDF = async (c: Cotizacion) => {
    setPdfLoading(c.id)
    try {
      descargarBlob(await generarBlobPDF(c), nombreArchivo(c))
    } finally {
      setPdfLoading(null)
    }
  }

  const openGmail = async (c: Cotizacion) => {
    setGmailLoading(c.id)
    try {
      descargarBlob(await generarBlobPDF(c), nombreArchivo(c))

      const subject = `Cotización ${PAD(c.numero)} – ${c.prop_titulo}`
      const body    = [
        `Estimado/a ${c.cliente_nombre},`,
        '',
        `Le enviamos adjunta la cotización ${PAD(c.numero)} para la propiedad "${c.prop_titulo}".`,
        c.precio_final_uf
          ? `Precio final: ${fmtN(c.precio_final_uf, 2)} UF · $ ${fmtN(Math.round(c.precio_final_clp ?? 0))}`
          : '',
        '',
        'Adjunte el PDF descargado automáticamente a este correo.',
        '',
        `Saludos,\n${c.ejecutivo_nombre ?? 'SDM Capital'}`,
      ].filter(l => l !== undefined).join('\n')

      setTimeout(() => {
        window.open(
          `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(c.cliente_email ?? '')}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
          '_blank',
        )
      }, 800)
    } finally {
      setGmailLoading(null)
    }
  }

  // ── Vista wizard ────────────────────────────────────────────────────────────
  if (editing !== null) {
    return (
      <CotizacionWizard
        draft={editing}
        setDraft={setEditing as React.Dispatch<React.SetStateAction<CotizacionDraft>>}
        step={step}
        setStep={setStep}
        uf={uf}
        ufLoading={ufLoading}
        refreshUF={refreshUF}
        propiedades={propiedades}
        onSave={onSave}
        onCancel={() => setEditing(null)}
        saving={saving}
      />
    )
  }

  // ── Vista listado ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
            Cotizaciones
          </h2>
          <p className="text-sdm-sm" style={{ color: 'var(--muted)', marginTop: 4 }}>
            {cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''} registradas
          </p>
          <div style={{ marginTop: 6 }}><Guardado visible={guardado} /></div>
        </div>
        <button onClick={openCreate} className="btn-green">
          <Plus aria-hidden="true" size={15} strokeWidth={2} /> Nueva cotización
        </button>
      </div>

      {/* Resumen de estados */}
      <div className="grid grid-cols-2 gap-3 mb-6 lg:grid-cols-4 lg:mb-8">
        {(['borrador', 'enviada', 'aceptada', 'rechazada'] as EstadoCotizacion[]).map(e => {
          const count = cotizaciones.filter(c => c.estado === e).length
          return (
            <div key={e} className="bg-white p-4" style={{ borderRadius: 2, border: '1px solid var(--border)' }}>
              <div className="text-sdm-2xl" style={{ fontWeight: 700, color: ESTADO_COLORS[e] }}>{count}</div>
              <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2 }}>
                {ESTADO_LABELS[e]}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Cargando…</div>
      ) : cotizaciones.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
          Todavía no hay cotizaciones. Crea la primera.
        </div>
      ) : (
        <div className="bg-white" style={{ border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          {/* Encabezado tabla */}
          <div className="hidden bg-[var(--off)] xl:grid" style={{ gridTemplateColumns: '90px 1fr 1fr 110px 120px 120px 110px', padding: '10px 16px', borderBottom: '2px solid var(--border)' }}>
            {['#', 'Cliente', 'Propiedad', 'Final UF', 'Pago', 'Estado', 'Acciones'].map(h => (
              <div className="text-sdm-xs tracking-sdm-wide" key={h} style={{ textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>{h}</div>
            ))}
          </div>

          {cotizaciones.map(c => (
            <div
              key={c.id}
              className="flex flex-wrap items-center gap-y-1 p-3 xl:grid xl:items-center xl:gap-y-0 xl:px-4 xl:py-3"
              style={{
                gridTemplateColumns: '90px 1fr 1fr 110px 120px 120px 110px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* # */}
              <div className="order-1 mr-3 text-sdm-sm xl:order-none xl:mr-0" style={{ fontWeight: 600, color: 'var(--navy-dark)', fontFamily: 'monospace' }}>
                {PAD(c.numero)}
              </div>

              {/* Cliente */}
              <div className="order-2 grow xl:order-none xl:grow-0">
                <div className="text-sdm-sm" style={{ fontWeight: 500, color: 'var(--ink)' }}>{c.cliente_nombre}</div>
                {c.cliente_email && (
                  <div className="text-sdm-xs" style={{ color: 'var(--muted)', marginTop: 1 }}>{c.cliente_email}</div>
                )}
              </div>

              {/* Propiedad */}
              <div className="order-3 w-full xl:order-none xl:w-auto">
                <div className="text-sdm-sm" style={{ color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.prop_titulo}</div>
                {(c.prop_comuna || c.prop_ciudad) && (
                  <div className="text-sdm-xs" style={{ color: 'var(--muted)', marginTop: 1 }}>
                    {c.prop_comuna || c.prop_ciudad}
                  </div>
                )}
              </div>

              {/* Precio final */}
              <div className="order-4 mr-3 text-sdm-lg xl:order-none xl:mr-0 xl:text-sdm-sm" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>
                {c.precio_final_uf ? `${fmtN(c.precio_final_uf, 0)} UF` : '—'}
              </div>

              {/* Forma de pago */}
              <div className="order-5 grow text-sdm-xs xl:order-none xl:grow-0" style={{ color: 'var(--muted)' }}>
                {c.forma_pago ? FORMA_LABELS[c.forma_pago] : '—'}
              </div>

              {/* Estado */}
              <div className="order-6 xl:order-none">
                {/* aria-label: es el selector de estado de CADA fila de la
                    lista. Se nombra con el número de cotización para que un
                    lector distinga de cuál está hablando. */}
                <select className="text-sdm-xs"
                  aria-label={`Estado de la cotización ${c.numero ?? c.id}`}
                  value={c.estado}
                  onChange={e => updateEstado(c.id, e.target.value as EstadoCotizacion)}
                  style={{ fontWeight: 600, padding: '3px 8px', borderRadius: 2,
                    border: 'none', cursor: 'pointer',
                    background: ESTADO_COLORS[c.estado] + '22',
                    color: ESTADO_COLORS[c.estado],
                    appearance: 'none' }}
                >
                  {(Object.keys(ESTADO_LABELS) as EstadoCotizacion[]).map(e => (
                    <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                  ))}
                </select>
              </div>

              {/* Acciones. Debajo de xl: fila propia con borde superior, 44px de
                  alto tactil y 24px entre botones. Con el padding de 4px 6px que
                  tenian, en un telefono era imposible acertarles. */}
              <div className="order-7 flex w-full items-center justify-end gap-6 mt-2 pt-2 border-t border-[var(--border)] xl:order-none xl:w-auto xl:justify-start xl:gap-1 xl:mt-0 xl:pt-0 xl:border-t-0">
                {/* Editar */}
                <button className="text-sdm-base min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0"
                  onClick={() => openEdit(c)}
                  title="Editar"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--navy-dark)', borderRadius: 2 }}
                >
                  <Pencil aria-hidden="true" size={14} strokeWidth={2} />
                </button>

                {/* Descargar PDF */}
                <button className="text-sdm-base min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0"
                  onClick={() => descargarPDF(c)}
                  title="Descargar PDF"
                  disabled={pdfLoading === c.id}
                  style={{ background: 'none', border: 'none', cursor: pdfLoading === c.id ? 'wait' : 'pointer', padding: '4px 6px', color: pdfLoading === c.id ? 'var(--muted)' : 'var(--green)', borderRadius: 2 }}
                >
                  {pdfLoading === c.id ? <Loader2 aria-hidden="true" size={14} strokeWidth={2} className="animate-spin" /> : <FileText aria-hidden="true" size={14} strokeWidth={2} />}
                </button>

                {/* Gmail */}
                <button className="text-sdm-base min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0"
                  onClick={() => openGmail(c)}
                  title="Descargar PDF y abrir Gmail"
                  disabled={gmailLoading === c.id}
                  style={{ background: 'none', border: 'none', cursor: gmailLoading === c.id ? 'wait' : 'pointer', padding: '4px 6px', borderRadius: 2 }}
                >
                  {gmailLoading === c.id ? <Loader2 aria-hidden="true" size={14} strokeWidth={2} className="animate-spin" /> : <Mail aria-hidden="true" size={14} strokeWidth={2} />}
                </button>

                {/* Eliminar */}
                <button className="text-sdm-base min-h-[44px] min-w-[44px] xl:min-h-0 xl:min-w-0"
                  onClick={() => deleteCot(c.id)}
                  title="Eliminar"
                  disabled={deleting === c.id}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--error)', borderRadius: 2, opacity: deleting === c.id ? 0.5 : 1 }}
                >
                  <Trash2 aria-hidden="true" size={14} strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
