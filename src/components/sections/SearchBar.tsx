import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { getComunas } from '@/data/comunas-chile'

type Tab = 'comprar' | 'arrendar' | 'internacional'

const TIPOS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'oficina', label: 'Oficina' },
  { value: 'parcela', label: 'Parcela' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'hotel', label: 'Hotel / Inversión' },
]

const PRECIOS = [
  { value: '', label: 'Sin límite' },
  { value: '2000', label: 'Hasta UF 2.000' },
  { value: '3500', label: 'Hasta UF 3.500' },
  { value: '5000', label: 'Hasta UF 5.000' },
  { value: '8000', label: 'Hasta UF 8.000' },
  { value: '10000', label: 'Hasta UF 10.000' },
]

const REGIONES = [
  { value: '', label: 'Todas las regiones' },
  { value: 'Arica y Parinacota', label: 'Arica y Parinacota' },
  { value: 'Tarapacá', label: 'Tarapacá' },
  { value: 'Antofagasta', label: 'Antofagasta' },
  { value: 'Atacama', label: 'Atacama' },
  { value: 'Coquimbo', label: 'Coquimbo' },
  { value: 'Valparaíso', label: 'Valparaíso' },
  { value: 'R. Metropolitana', label: 'R. Metropolitana' },
  { value: "O'Higgins", label: "O'Higgins" },
  { value: 'Maule', label: 'Maule' },
  { value: 'Ñuble', label: 'Ñuble' },
  { value: 'Biobío', label: 'Biobío' },
  { value: 'La Araucanía', label: 'La Araucanía' },
  { value: 'Los Ríos', label: 'Los Ríos' },
  { value: 'Los Lagos', label: 'Los Lagos' },
  { value: 'Aysén', label: 'Aysén' },
  { value: 'Magallanes', label: 'Magallanes' },
]

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 20px', fontSize: 11, fontWeight: active ? 600 : 400,
        letterSpacing: '1.5px', textTransform: 'uppercase',
        border: active ? '1px solid var(--navy-dark)' : '1px solid var(--border)',
        borderRadius: 20,
        background: active ? 'var(--navy-dark)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}

function DropSelect({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
          background: value ? 'var(--navy-dark)' : '#fff',
          color: value ? '#fff' : 'var(--ink)',
          border: `1px solid ${value ? 'var(--navy-dark)' : 'var(--border)'}`,
          borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: value ? 500 : 300, transition: 'all 0.18s', whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.6, marginRight: 2 }}>{label}</span>
        {selected.label}
        <ChevronDown size={12} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 200, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 12px 40px rgba(15,37,53,0.12)', zIndex: 50, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 14, fontWeight: 300,
                color: opt.value === value ? 'var(--navy-dark)' : 'var(--muted)',
                background: opt.value === value ? 'var(--sky-pale)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (opt.value !== value) e.currentTarget.style.background = 'var(--off)' }}
              onMouseLeave={e => { if (opt.value !== value) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
              {opt.value === value && <Check size={13} style={{ color: 'var(--green)' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SELECTOR REGIÓN / COMUNA ─────────────────────────────────────────────────
function RegionComunaPicker({ region, comuna, onChangeRegion, onChangeComuna }: {
  region: string
  comuna: string
  onChangeRegion: (v: string) => void
  onChangeComuna: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'region' | 'comuna'>('region')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const comunas = region ? getComunas(region) : []
  const label = comuna ? comuna : region ? region : 'Región o comuna...'
  const hasValue = !!(region || comuna)

  const handleRegion = (v: string) => {
    onChangeRegion(v)
    onChangeComuna('')
    if (v) setStep('comuna')
    else { setOpen(false) }
  }

  const handleComuna = (v: string) => {
    onChangeComuna(v)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChangeRegion('')
    onChangeComuna('')
    setStep('region')
  }

  return (
    <div ref={ref} className="relative" style={{ flex: 1 }}>
      {/* Trigger */}
      <div
        onClick={() => { setOpen(v => !v); setStep(region && !comuna ? 'comuna' : 'region') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#fff',
          border: `1.5px solid ${open ? 'var(--navy-dark)' : 'var(--border)'}`,
          borderRadius: 8, padding: '0 16px', transition: 'border-color 0.2s', cursor: 'pointer',
          height: 46,
        }}
      >
        <Search size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 300, color: hasValue ? 'var(--ink)' : 'var(--muted)', fontFamily: 'inherit' }}>
          {label}
        </span>
        {hasValue && (
          <button onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', minWidth: 280, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 12px 40px rgba(15,37,53,0.12)', zIndex: 50, overflow: 'hidden' }}>

          {/* Tabs región / comuna */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            <button
              onClick={() => setStep('region')}
              style={{ flex: 1, padding: '10px 0', fontSize: 11, fontWeight: step === 'region' ? 600 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit', color: step === 'region' ? 'var(--navy-dark)' : 'var(--muted)', borderBottom: step === 'region' ? '2px solid var(--navy-dark)' : '2px solid transparent' }}
            >
              Región
            </button>
            <button
              onClick={() => region && setStep('comuna')}
              style={{ flex: 1, padding: '10px 0', fontSize: 11, fontWeight: step === 'comuna' ? 600 : 400, letterSpacing: '1.5px', textTransform: 'uppercase', border: 'none', background: 'none', cursor: region ? 'pointer' : 'not-allowed', fontFamily: 'inherit', color: step === 'comuna' ? 'var(--navy-dark)' : region ? 'var(--muted)' : 'var(--border)', borderBottom: step === 'comuna' ? '2px solid var(--navy-dark)' : '2px solid transparent', opacity: region ? 1 : 0.4 }}
            >
              Comuna
            </button>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {step === 'region' && REGIONES.map(r => (
              <button key={r.value} onClick={() => handleRegion(r.value)}
                style={{
                  width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 14, fontWeight: 300,
                  color: r.value === region ? 'var(--navy-dark)' : 'var(--muted)',
                  background: r.value === region ? 'var(--sky-pale)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (r.value !== region) e.currentTarget.style.background = 'var(--off)' }}
                onMouseLeave={e => { if (r.value !== region) e.currentTarget.style.background = 'transparent' }}
              >
                {r.label}
                {r.value === region && <Check size={13} style={{ color: 'var(--green)' }} />}
              </button>
            ))}
            {step === 'comuna' && comunas.map(c => (
              <button key={c} onClick={() => handleComuna(c)}
                style={{
                  width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 14, fontWeight: 300,
                  color: c === comuna ? 'var(--navy-dark)' : 'var(--muted)',
                  background: c === comuna ? 'var(--sky-pale)' : 'transparent',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (c !== comuna) e.currentTarget.style.background = 'var(--off)' }}
                onMouseLeave={e => { if (c !== comuna) e.currentTarget.style.background = 'transparent' }}
              >
                {c}
                {c === comuna && <Check size={13} style={{ color: 'var(--green)' }} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SearchBar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('comprar')
  const [region, setRegion] = useState('')
  const [comuna, setComuna] = useState('')
  const [tipo, setTipo] = useState('')
  const [precio, setPrecio] = useState('')

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (tab === 'comprar')       params.set('estado', 'en_venta')
    if (tab === 'arrendar')      params.set('estado', 'en_arriendo')
    if (tab === 'internacional') params.set('internacional', 'true')
    if (tipo)                    params.set('tipo', tipo)
    if (region)                  params.set('region', region)
    if (comuna)                  params.set('comuna', comuna)
    if (precio)                  params.set('precio_max', precio)
    navigate(`/propiedades-usadas?${params.toString()}`)
  }

  const handleRegionChange = (v: string) => {
    setRegion(v)
    setComuna('')
  }

  return (
    <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--border)' }}>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block" style={{ padding: '20px clamp(16px,5vw,48px)' }}>
        {/* Fila 1: pills + región/comuna + buscar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <Pill label="Comprar" active={tab === 'comprar'} onClick={() => setTab('comprar')} />
            <Pill label="Arrendar" active={tab === 'arrendar'} onClick={() => setTab('arrendar')} />
          </div>

          <RegionComunaPicker
            region={region}
            comuna={comuna}
            onChangeRegion={handleRegionChange}
            onChangeComuna={setComuna}
          />

          <button onClick={handleSearch}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--navy-dark)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green)'}
          >
            <Search size={14} /> Buscar
          </button>
        </div>

        {/* Fila 2: filtros opcionales */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginRight: 4 }}>Filtrar por</span>
          <DropSelect label="Tipo · " options={TIPOS} value={tipo} onChange={setTipo} />
          <DropSelect label="Precio · " options={PRECIOS} value={precio} onChange={setPrecio} />
          {(tipo || precio || region || comuna) && (
            <button onClick={() => { setTipo(''); setPrecio(''); setRegion(''); setComuna('') }}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE ── */}
      <div className="md:hidden" style={{ background: 'var(--navy-dark)', padding: 16 }}>
        <div className="flex gap-2 mb-3">
          {([
            { key: 'comprar', label: 'Comprar' },
            { key: 'arrendar', label: 'Arrendar' },
          ] as { key: Tab; label: string }[]).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              style={{ flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: tab === item.key ? 'var(--green)' : 'rgba(255,255,255,0.1)', color: tab === item.key ? '#fff' : 'rgba(255,255,255,0.6)' }}
            >{item.label}</button>
          ))}
        </div>

        {/* Región mobile */}
        <div className="mb-2" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 2 }}>Región</div>
          <select value={region} onChange={e => { setRegion(e.target.value); setComuna('') }}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', width: '100%', cursor: 'pointer' }}>
            {REGIONES.map(r => <option key={r.value} value={r.value} style={{ color: 'var(--ink)', background: '#fff' }}>{r.label}</option>)}
          </select>
        </div>

        {/* Comuna mobile */}
        <div className="mb-3" style={{ background: region ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.15)', opacity: region ? 1 : 0.5 }}>
          <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 2 }}>Comuna</div>
          <select value={comuna} onChange={e => setComuna(e.target.value)} disabled={!region}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 13, fontFamily: 'inherit', width: '100%', cursor: region ? 'pointer' : 'not-allowed' }}>
            <option value="" style={{ color: 'var(--ink)', background: '#fff' }}>{region ? 'Todas las comunas' : 'Primero elige región'}</option>
            {region && getComunas(region).map(c => <option key={c} value={c} style={{ color: 'var(--ink)', background: '#fff' }}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-2 mb-3">
          {[{ label: 'Tipo', options: TIPOS, value: tipo, onChange: setTipo }, { label: 'Precio', options: PRECIOS, value: precio, onChange: setPrecio }].map(f => (
            <div key={f.label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 2 }}>{f.label}</div>
              <select value={f.value} onChange={e => f.onChange(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontFamily: 'inherit', width: '100%', cursor: 'pointer' }}>
                {f.options.map(o => <option key={o.value} value={o.value} style={{ color: 'var(--ink)', background: '#fff' }}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>

        <button onClick={handleSearch} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>
          <Search size={14} /> Buscar
        </button>
      </div>
    </div>
  )
}