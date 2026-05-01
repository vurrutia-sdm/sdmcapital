import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Check } from 'lucide-react'

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

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 20px',
        fontSize: 11,
        fontWeight: active ? 600 : 400,
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        border: active ? '1px solid var(--navy-dark)' : '1px solid var(--border)',
        borderRadius: 20,
        background: active ? 'var(--navy-dark)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.18s',
        whiteSpace: 'nowrap',
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
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
          background: value ? 'var(--navy-dark)' : '#fff',
          color: value ? '#fff' : 'var(--ink)',
          border: `1px solid ${value ? 'var(--navy-dark)' : 'var(--border)'}`,
          borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13, fontWeight: value ? 500 : 300, transition: 'all 0.18s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 10, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.6, marginRight: 2 }}>{label}</span>
        {selected.label}
        <ChevronDown size={12} style={{ opacity: 0.6, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 200, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 12px 40px rgba(15,37,53,0.12)', zIndex: 50, overflow: 'hidden' }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                width: '100%', padding: '11px 16px', textAlign: 'left', fontSize: 14, fontWeight: 300,
                color: opt.value === value ? 'var(--navy-dark)' : 'var(--muted)',
                background: opt.value === value ? 'var(--sky-pale)' : 'transparent',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'background 0.15s',
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

export default function SearchBar() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('comprar')
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('')
  const [precio, setPrecio] = useState('')
  const [focused, setFocused] = useState(false)

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (tab === 'arrendar')      params.set('estado', 'en_arriendo')
    if (tab === 'internacional') params.set('internacional', 'true')
    if (tipo)                    params.set('tipo', tipo)
    if (query)                   params.set('busqueda', query)
    if (precio)                  params.set('precio_max', precio)
    navigate(`/propiedades?${params.toString()}`)
  }

  return (
    <div style={{ background: 'var(--off)', borderBottom: '1px solid var(--border)' }}>

      {/* ── DESKTOP ── */}
      <div className="hidden md:block" style={{ padding: '20px clamp(16px,5vw,48px)' }}>
        {/* Fila 1: pills de modo + campo de búsqueda */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-2">
            <Pill label="Comprar" active={tab === 'comprar'} onClick={() => setTab('comprar')} />
            <Pill label="Arrendar" active={tab === 'arrendar'} onClick={() => setTab('arrendar')} />
            <Pill label="Internacional" active={tab === 'internacional'} onClick={() => setTab('internacional')} />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1.5px solid ${focused ? 'var(--navy-dark)' : 'var(--border)'}`, borderRadius: 8, padding: '0 16px', transition: 'border-color 0.2s' }}>
            <Search size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={tab === 'internacional' ? 'Ciudad, país o destino...' : 'Comuna, sector o dirección...'}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 15, fontWeight: 300, color: 'var(--ink)', fontFamily: 'inherit', background: 'transparent', padding: '12px 0' }}
            />
          </div>

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
          {(tipo || precio) && (
            <button onClick={() => { setTipo(''); setPrecio('') }}
              style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE: fondo navy, pills redondeadas ── */}
      <div className="md:hidden" style={{ background: 'var(--navy-dark)', padding: 16 }}>
        <div className="flex gap-2 mb-3">
          {([
            { key: 'comprar', label: 'Comprar' },
            { key: 'arrendar', label: 'Arrendar' },
            { key: 'internacional', label: 'Intl.' },
          ] as { key: Tab; label: string }[]).map(item => (
            <button key={item.key} onClick={() => setTab(item.key)}
              style={{ flex: 1, padding: '7px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', background: tab === item.key ? 'var(--green)' : 'rgba(255,255,255,0.1)', color: tab === item.key ? '#fff' : 'rgba(255,255,255,0.6)' }}
            >{item.label}</button>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <div className="flex flex-1 items-center gap-2" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Search size={15} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={tab === 'internacional' ? 'Ciudad o país...' : 'Comuna o dirección...'}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#fff', fontFamily: 'inherit', background: 'transparent', minWidth: 0 }} />
          </div>
          <button onClick={handleSearch} style={{ background: 'var(--green)', border: 'none', borderRadius: 8, color: '#fff', padding: '0 16px', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} />
          </button>
        </div>
        <div className="flex gap-2">
          {[{ label: 'Tipo', options: TIPOS, value: tipo, onChange: setTipo }, { label: 'Precio', options: PRECIOS, value: precio, onChange: setPrecio }].map(f => (
            <div key={f.label} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <div style={{ fontSize: 9, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 2 }}>{f.label}</div>
              <select value={f.value} onChange={e => f.onChange(e.target.value)} style={{ background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 12, fontFamily: 'inherit', width: '100%', cursor: 'pointer' }}>
                {f.options.map(o => <option key={o.value} value={o.value} style={{ color: 'var(--ink)', background: '#fff' }}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
