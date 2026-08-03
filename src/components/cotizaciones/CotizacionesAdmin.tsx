import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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

const ESTADO_COLORS: Record<EstadoCotizacion, string> = {
  borrador:  '#7a8a96',
  enviada:   '#1C3D5C',
  aceptada:  '#3DAA6E',
  rechazada: '#E24B4A',
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
      const r    = await fetch('https://mindicador.cl/api/uf')
      const data = await r.json()
      valor = data.serie?.[0]?.valor ?? null
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
    <div className="flex items-center gap-4">
      {currentUrl && (
        <img src={currentUrl} alt="" className="w-16 h-16 object-cover rounded" style={{ border: '1px solid var(--border)' }} />
      )}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: uploading ? 'var(--muted)' : 'var(--navy-dark)',
        color: '#fff', padding: '9px 18px', borderRadius: 2,
        cursor: uploading ? 'not-allowed' : 'pointer',
        fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase',
      }}>
        {uploading ? 'Subiendo…' : currentUrl ? 'Cambiar imagen' : 'Subir imagen'}
        <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
      </label>
      {currentUrl && (
        <input
          value={currentUrl}
          readOnly
          className="input-line flex-1"
          style={{ fontSize: 12, color: 'var(--muted)' }}
          onClick={e => (e.target as HTMLInputElement).select()}
        />
      )}
    </div>
  )
}

// ─── Pequeñas piezas UI ───────────────────────────────────────────────────────
function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
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
              <div
                style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: active ? 'var(--green)' : done ? 'var(--navy-dark)' : 'var(--border)',
                  color: active || done ? '#fff' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}
              >
                {done ? '✓' : idx}
              </div>
              <span style={{
                fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase',
                color: active ? 'var(--navy-dark)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
              }}>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.precio_uf, draft.descuento_pct, draft.valor_uf, draft.pie_pct, draft.tasa_anual, draft.plazo_anos])

  // ── Selección de propiedad ───────────────────────────────────────────────
  const [propSearch, setPropSearch] = useState('')
  const [manualProp, setManualProp] = useState(!draft.propiedad_id)

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif font-light" style={{ fontSize: 28, color: 'var(--navy-dark)' }}>
            {draft.id ? `Editar ${PAD(0)}` : 'Nueva Cotización'}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            Complete los 5 pasos para generar la cotización
          </p>
        </div>
        <button onClick={onCancel} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}>
          ← Volver al listado
        </button>
      </div>

      <StepIndicator step={step} />

      <div className="bg-white p-8" style={{ borderRadius: 2, border: '1px solid var(--border)', minHeight: 340 }}>

        {/* ── PASO 1: CLIENTE ── */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Datos del cliente
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <Fld label="Nombre completo *">
                <Inp value={draft.cliente_nombre} placeholder="Juan Pérez" onChange={v => upd({ cliente_nombre: v })} />
              </Fld>
              <Fld label="RUT">
                <Inp value={draft.cliente_rut} placeholder="12.345.678-9" onChange={v => upd({ cliente_rut: v })} />
              </Fld>
              <Fld label="Email">
                <Inp value={draft.cliente_email} type="email" placeholder="juan@email.com" onChange={v => upd({ cliente_email: v })} />
              </Fld>
              <Fld label="Teléfono">
                <Inp value={draft.cliente_telefono} placeholder="+56 9 1234 5678" onChange={v => upd({ cliente_telefono: v })} />
              </Fld>
              <Fld label="Empresa / Institución">
                <Inp value={draft.cliente_empresa} placeholder="Empresa S.A." onChange={v => upd({ cliente_empresa: v })} />
              </Fld>
            </div>
          </div>
        )}

        {/* ── PASO 2: PROPIEDAD ── */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Propiedad
            </h3>

            {/* Buscador de catálogo */}
            {!manualProp && (
              <div className="flex flex-col gap-3">
                <Fld label="Buscar en catálogo SDM">
                  <input
                    type="text"
                    className="input-line"
                    placeholder="Escribe título, comuna…"
                    value={propSearch}
                    onChange={e => setPropSearch(e.target.value)}
                  />
                </Fld>
                {propSearch.length > 0 && (
                  <div style={{ border: '1px solid var(--border)', borderRadius: 2, maxHeight: 220, overflowY: 'auto' }}>
                    {propsFiltradas.length === 0 ? (
                      <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--muted)' }}>Sin resultados</div>
                    ) : propsFiltradas.slice(0, 12).map(p => (
                      <button
                        key={p.id}
                        onClick={() => selectProp(p)}
                        className="w-full text-left"
                        style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'none', cursor: 'pointer' }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy-dark)' }}>{p.titulo}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {[p.tipo, p.comuna, p.region].filter(Boolean).join(' · ')}
                          {p.precio_uf ? `  ·  ${p.precio_uf.toLocaleString('es-CL')} UF` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setManualProp(true)}
                  style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Ingresar datos manualmente →
                </button>
              </div>
            )}

            {/* Campos manuales */}
            {manualProp && (
              <>
                {!draft.propiedad_id && (
                  <button
                    onClick={() => { setManualProp(false); setPropSearch('') }}
                    style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: -8 }}
                  >
                    ← Buscar en catálogo
                  </button>
                )}
                {draft.propiedad_id && (
                  <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: -8 }}>
                    ✓ Propiedad vinculada al catálogo — puedes editar los datos del snapshot
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <Fld label="Título *">
                    <Inp value={draft.prop_titulo} placeholder="Departamento en Las Condes" onChange={v => upd({ prop_titulo: v })} />
                  </Fld>
                  <Fld label="Tipo">
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
                  </Fld>
                  <Fld label="Dirección">
                    <Inp value={draft.prop_direccion} placeholder="Av. Apoquindo 1234" onChange={v => upd({ prop_direccion: v })} />
                  </Fld>
                </div>

                {/* País → Región/Comuna en cascada */}
                <div className="grid grid-cols-3 gap-6">
                  <Fld label="País">
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
                  </Fld>

                  {esChile ? (
                    <>
                      <Fld label="Región">
                        <select
                          value={draft.prop_region ?? ''}
                          onChange={e => upd({ prop_region: e.target.value, prop_comuna: '' })}
                          className="input-line"
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="">Seleccionar región…</option>
                          {REGIONES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </Fld>
                      <Fld label="Comuna">
                        <select
                          value={draft.prop_comuna ?? ''}
                          onChange={e => upd({ prop_comuna: e.target.value })}
                          disabled={!draft.prop_region}
                          className="input-line"
                          style={{ cursor: draft.prop_region ? 'pointer' : 'not-allowed' }}
                        >
                          <option value="">
                            {draft.prop_region ? 'Seleccionar comuna…' : 'Primero elige una región'}
                          </option>
                          {getComunas(draft.prop_region ?? '').map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </Fld>
                    </>
                  ) : (
                    <Fld label="Ciudad">
                      <Inp
                        value={draft.prop_ciudad}
                        placeholder="Asunción, Buenos Aires…"
                        onChange={v => upd({ prop_ciudad: v })}
                      />
                    </Fld>
                  )}
                </div>

                {/* Imagen */}
                <Fld label="Imagen principal">
                  <ImageUploader
                    currentUrl={draft.prop_imagen_url}
                    folder="cotizaciones"
                    onUploaded={url => upd({ prop_imagen_url: url })}
                  />
                </Fld>

                <div className="grid grid-cols-5 gap-4">
                  <Fld label="Dormitorios">
                    <Inp value={draft.prop_dormitorios} type="number" placeholder="3" onChange={v => upd({ prop_dormitorios: n0(v) })} />
                  </Fld>
                  <Fld label="Baños">
                    <Inp value={draft.prop_banos} type="number" placeholder="2" onChange={v => upd({ prop_banos: n0(v) })} />
                  </Fld>
                  <Fld label="Sup. Útil m²">
                    <Inp value={draft.prop_sup_util} type="number" placeholder="85" onChange={v => upd({ prop_sup_util: n0(v) })} />
                  </Fld>
                  <Fld label="Estac.">
                    <Inp value={draft.prop_estacionamientos} type="number" placeholder="1" onChange={v => upd({ prop_estacionamientos: n0(v) })} />
                  </Fld>
                  <Fld label="Bodegas">
                    <Inp value={draft.prop_bodegas} type="number" placeholder="1" onChange={v => upd({ prop_bodegas: n0(v) })} />
                  </Fld>
                </div>

                <Fld label="Amenidades (separadas por coma)">
                  <AmenidadesInput
                    value={draft.prop_amenidades ?? []}
                    onChange={v => upd({ prop_amenidades: v })}
                  />
                </Fld>
              </>
            )}
          </div>
        )}

        {/* ── PASO 3: PRECIOS ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Precios
            </h3>

            {/* UF del día */}
            <div className="flex items-end gap-4 p-4" style={{ background: 'var(--sky-pale)', borderRadius: 2 }}>
              <Fld label="Valor UF del día (auto)">
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy-dark)', fontFamily: 'Inter', paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                  {draft.valor_uf > 0
                    ? `$ ${draft.valor_uf.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : ufLoading ? 'Cargando…' : '—'}
                </div>
              </Fld>
              <button
                onClick={async () => { const v = await refreshUF(); if (v) upd({ valor_uf: v }) }}
                disabled={ufLoading}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 11, marginBottom: 1 }}
              >
                {ufLoading ? '…' : '⟳ Actualizar'}
              </button>
              {uf && draft.valor_uf !== uf && (
                <button
                  onClick={() => upd({ valor_uf: uf })}
                  style={{ fontSize: 11, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: 10 }}
                >
                  Usar valor actual ({uf.toLocaleString('es-CL', { maximumFractionDigits: 2 })})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Fld label="Precio publicado (UF)">
                <Inp value={draft.precio_uf} type="number" placeholder="5000" onChange={v => upd({ precio_uf: n0(v) })} />
              </Fld>
              <Fld label="Descuento (%)">
                <Inp value={draft.descuento_pct} type="number" placeholder="0" onChange={v => upd({ descuento_pct: n0(v) })} />
              </Fld>
            </div>

            {/* Resumen calculado */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { lbl: 'Precio en CLP',    val: precioClp      ? `$ ${fmtN(Math.round(precioClp))}` : '—' },
                { lbl: 'Precio final UF',  val: precioFinalUF  ? `${fmtN(precioFinalUF, 2)} UF` : '—', hl: true },
                { lbl: 'Precio final CLP', val: precioFinalCLP ? `$ ${fmtN(Math.round(precioFinalCLP))}` : '—', hl: true },
              ].map(({ lbl, val, hl }) => (
                <div key={lbl} className="p-4" style={{ background: hl ? 'var(--navy-dark)' : 'var(--sky-pale)', borderRadius: 2 }}>
                  <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: hl ? 'var(--sky)' : 'var(--muted)', marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: hl ? '#fff' : 'var(--navy-dark)' }}>{val}</div>
                </div>
              ))}
            </div>

            <Fld label="Precio USD (opcional)">
              <Inp value={draft.precio_usd} type="number" placeholder="190000" onChange={v => upd({ precio_usd: n0(v) })} />
            </Fld>
          </div>
        )}

        {/* ── PASO 4: FORMA DE PAGO ── */}
        {step === 4 && (
          <div className="flex flex-col gap-6">
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Forma de pago
            </h3>

            <Fld label="Modalidad">
              <Sel value={draft.forma_pago ?? ''} onChange={v => upd({ forma_pago: v as FormaPago })} options={[
                { value: '',        label: 'Sin especificar' },
                { value: 'contado', label: 'Contado' },
                { value: 'credito', label: 'Crédito hipotecario' },
                { value: 'leasing', label: 'Leasing inmobiliario' },
                { value: 'mixto',   label: 'Mixto (pie + crédito)' },
              ]} />
            </Fld>

            {draft.forma_pago && draft.forma_pago !== 'contado' && (
              <>
                {/* Barra visual */}
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>
                    Distribución Pie / Crédito
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${draft.pie_pct ?? 0}%`, background: 'var(--green)', transition: 'width .3s' }} />
                    <div style={{ flex: 1, background: 'var(--sky)' }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Pie {draft.pie_pct ?? 0}%  ·  {fmtN(pieUF, 2)} UF</span>
                    <span style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 600 }}>Crédito {100 - (draft.pie_pct ?? 0)}%  ·  {fmtN(creditoUF, 2)} UF</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <Fld label="% Pie">
                    <Inp value={draft.pie_pct} type="number" placeholder="20" onChange={v => upd({ pie_pct: n0(v) })} />
                  </Fld>
                  <Fld label="Plazo (años)">
                    <Inp value={draft.plazo_anos} type="number" placeholder="20" onChange={v => upd({ plazo_anos: n0(v) })} />
                  </Fld>
                  <Fld label="Tasa anual (%)">
                    <Inp value={draft.tasa_anual} type="number" placeholder="4.5" onChange={v => upd({ tasa_anual: n0(v) })} />
                  </Fld>
                </div>

                {divUF != null && (
                  <div className="p-4" style={{ background: 'var(--sky-pale)', borderRadius: 2 }}>
                    <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                      Dividendo mensual estimado
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy-dark)' }}>
                      {fmtN(divUF, 2)} UF / mes
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
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
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy-dark)', marginBottom: 4 }}>
              Ejecutivo y observaciones
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <Fld label="Nombre ejecutivo">
                <Inp value={draft.ejecutivo_nombre} placeholder="María González" onChange={v => upd({ ejecutivo_nombre: v })} />
              </Fld>
              <Fld label="Cargo">
                <Inp value={draft.ejecutivo_cargo} placeholder="Ejecutiva Comercial" onChange={v => upd({ ejecutivo_cargo: v })} />
              </Fld>
              <Fld label="Email ejecutivo">
                <Inp value={draft.ejecutivo_email} type="email" placeholder="maria@sdmcapital.cl" onChange={v => upd({ ejecutivo_email: v })} />
              </Fld>
              <Fld label="Teléfono ejecutivo">
                <Inp value={draft.ejecutivo_telefono} placeholder="+56 9 1234 5678" onChange={v => upd({ ejecutivo_telefono: v })} />
              </Fld>
            </div>
            <Fld label="Observaciones">
              <textarea
                className="input-line resize-none"
                rows={4}
                placeholder="Condiciones especiales, notas para el cliente…"
                value={draft.observaciones ?? ''}
                onChange={e => upd({ observaciones: e.target.value })}
              />
            </Fld>
            <div className="grid grid-cols-2 gap-6">
              <Fld label="Vigencia (días)">
                <NumInp
                  value={draft.vigencia_dias}
                  placeholder="30"
                  min={1}
                  onChange={v => upd({ vigencia_dias: v })}
                />
              </Fld>
              <Fld label="Estado inicial">
                <Sel value={draft.estado} onChange={v => upd({ estado: v as EstadoCotizacion })} options={[
                  { value: 'borrador',  label: 'Borrador' },
                  { value: 'enviada',   label: 'Enviada' },
                  { value: 'aceptada',  label: 'Aceptada' },
                  { value: 'rechazada', label: 'Rechazada' },
                ]} />
              </Fld>
            </div>
          </div>
        )}
      </div>

      {/* Navegación */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase' }}
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
              <button onClick={() => onSave('borrador')} disabled={saving} className="btn-outline" style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
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

    if (editing.id) {
      await supabase.from('cotizaciones').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('cotizaciones').insert(payload)
    }
    await loadCots()
    setEditing(null)
    setSaving(false)
  }

  const updateEstado = async (id: string, estado: EstadoCotizacion) => {
    await supabase.from('cotizaciones').update({ estado }).eq('id', id)
    setCotizaciones(cs => cs.map(c => c.id === id ? { ...c, estado } : c))
  }

  const deleteCot = async (id: string) => {
    if (!confirm('¿Eliminar esta cotización?')) return
    setDeleting(id)
    await supabase.from('cotizaciones').delete().eq('id', id)
    setCotizaciones(cs => cs.filter(c => c.id !== id))
    setDeleting(null)
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
          <h2 className="font-serif font-light" style={{ fontSize: 28, color: 'var(--navy-dark)' }}>
            Cotizaciones
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
            {cotizaciones.length} cotización{cotizaciones.length !== 1 ? 'es' : ''} registradas
          </p>
        </div>
        <button onClick={openCreate} className="btn-green">
          + Nueva cotización
        </button>
      </div>

      {/* Resumen de estados */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {(['borrador', 'enviada', 'aceptada', 'rechazada'] as EstadoCotizacion[]).map(e => {
          const count = cotizaciones.filter(c => c.estado === e).length
          return (
            <div key={e} className="bg-white p-4" style={{ borderRadius: 2, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: ESTADO_COLORS[e] }}>{count}</div>
              <div style={{ fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 2 }}>
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
          No hay cotizaciones todavía. Crea la primera.
        </div>
      ) : (
        <div className="bg-white" style={{ border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          {/* Encabezado tabla */}
          <div className="grid" style={{ gridTemplateColumns: '90px 1fr 1fr 110px 120px 120px 110px', padding: '10px 16px', borderBottom: '2px solid var(--border)', background: 'var(--off)' }}>
            {['#', 'Cliente', 'Propiedad', 'Final UF', 'Pago', 'Estado', 'Acciones'].map(h => (
              <div key={h} style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>{h}</div>
            ))}
          </div>

          {cotizaciones.map(c => (
            <div
              key={c.id}
              className="grid items-center"
              style={{
                gridTemplateColumns: '90px 1fr 1fr 110px 120px 120px 110px',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              {/* # */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-dark)', fontFamily: 'monospace' }}>
                {PAD(c.numero)}
              </div>

              {/* Cliente */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{c.cliente_nombre}</div>
                {c.cliente_email && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{c.cliente_email}</div>
                )}
              </div>

              {/* Propiedad */}
              <div>
                <div style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{c.prop_titulo}</div>
                {(c.prop_comuna || c.prop_ciudad) && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                    {c.prop_comuna || c.prop_ciudad}
                  </div>
                )}
              </div>

              {/* Precio final */}
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-dark)' }}>
                {c.precio_final_uf ? `${fmtN(c.precio_final_uf, 0)} UF` : '—'}
              </div>

              {/* Forma de pago */}
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {c.forma_pago ? FORMA_LABELS[c.forma_pago] : '—'}
              </div>

              {/* Estado */}
              <div>
                <select
                  value={c.estado}
                  onChange={e => updateEstado(c.id, e.target.value as EstadoCotizacion)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 2,
                    border: 'none', cursor: 'pointer',
                    background: ESTADO_COLORS[c.estado] + '22',
                    color: ESTADO_COLORS[c.estado],
                    appearance: 'none',
                  }}
                >
                  {(Object.keys(ESTADO_LABELS) as EstadoCotizacion[]).map(e => (
                    <option key={e} value={e}>{ESTADO_LABELS[e]}</option>
                  ))}
                </select>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-1">
                {/* Editar */}
                <button
                  onClick={() => openEdit(c)}
                  title="Editar"
                  style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: 'var(--navy-dark)', borderRadius: 2 }}
                >
                  ✏️
                </button>

                {/* Descargar PDF */}
                <button
                  onClick={() => descargarPDF(c)}
                  title="Descargar PDF"
                  disabled={pdfLoading === c.id}
                  style={{ fontSize: 14, background: 'none', border: 'none', cursor: pdfLoading === c.id ? 'wait' : 'pointer', padding: '4px 6px', color: pdfLoading === c.id ? 'var(--muted)' : 'var(--green)', borderRadius: 2 }}
                >
                  {pdfLoading === c.id ? '⏳' : '📄'}
                </button>

                {/* Gmail */}
                <button
                  onClick={() => openGmail(c)}
                  title="Descargar PDF y abrir Gmail"
                  disabled={gmailLoading === c.id}
                  style={{ fontSize: 14, background: 'none', border: 'none', cursor: gmailLoading === c.id ? 'wait' : 'pointer', padding: '4px 6px', borderRadius: 2 }}
                >
                  {gmailLoading === c.id ? '⏳' : '📧'}
                </button>

                {/* Eliminar */}
                <button
                  onClick={() => deleteCot(c.id)}
                  title="Eliminar"
                  disabled={deleting === c.id}
                  style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: '#E24B4A', borderRadius: 2, opacity: deleting === c.id ? 0.5 : 1 }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
