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

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function CustomSelect({
  label, options, value, onChange,
}: {
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
    <div ref={ref} className="relative flex flex-col" style={{ minWidth: 160 }}>
      {/* Label */}
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 4 }}>
        {label}
      </div>

      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between gap-3 cursor-pointer"
        style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span style={{ fontSize: 14, fontWeight: value ? 400 : 300, color: value ? 'var(--navy-dark)' : 'var(--muted)' }}>
          {selected.label}
        </span>
        <ChevronDown size={13} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 bg-white border border-[#e8edf2]"
          style={{ top: 'calc(100% + 12px)', left: -16, minWidth: 200, boxShadow: '0 8px 32px rgba(15,37,53,0.12)', borderRadius: 2 }}
        >
          {options.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center justify-between transition-colors"
              style={{
                padding: '11px 16px', fontSize: 14, fontWeight: 300,
                color: opt.value === value ? 'var(--navy-dark)' : 'var(--muted)',
                background: opt.value === value ? 'var(--sky-pale)' : 'transparent',
                border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (opt.value !== value) { e.currentTarget.style.background = 'var(--off)'; e.currentTarget.style.color = 'var(--navy-dark)' } }}
              onMouseLeave={e => { if (opt.value !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
            >
              {opt.label}
              {opt.value === value && <Check size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
export default function SearchBar() {
  const navigate = useNavigate()
  const [tab, setTab]     = useState<Tab>('comprar')
  const [query, setQuery] = useState('')
  const [tipo, setTipo]   = useState('')
  const [precio, setPrecio] = useState('')

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
    <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(15,37,53,0.08)' }}>
      {/* Tabs */}
      <div className="flex px-8 lg:px-12" style={{ borderBottom: '2px solid var(--border)' }}>
        {([
          { key: 'comprar',       label: 'Comprar' },
          { key: 'arrendar',      label: 'Arrendar' },
          { key: 'internacional', label: 'Internacional' },
        ] as { key: Tab; label: string }[]).map(item => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            style={{
              fontSize: 11, fontWeight: tab === item.key ? 600 : 400,
              letterSpacing: '2px', textTransform: 'uppercase',
              padding: '16px 22px 14px', cursor: 'pointer',
              background: tab === item.key ? 'var(--navy-dark)' : 'none',
              border: 'none',
              borderBottom: tab === item.key ? '2px solid var(--navy-dark)' : '2px solid transparent',
              color: tab === item.key ? '#fff' : 'var(--muted)',
              fontFamily: 'inherit', marginBottom: -2, transition: 'all 0.15s',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Search row — borde superior verde llamativo */}
      <div className="flex items-center px-8 lg:px-12 gap-0" style={{ borderTop: '3px solid var(--green)', background: '#fff' }}>

        {/* Text input — ocupa todo el espacio, sin bordes internos */}
        <div className="flex-1 flex items-center gap-3 py-5 pr-5" style={{ borderRight: '1px solid var(--border)' }}>
          <Search size={18} style={{ color: 'var(--green)', flexShrink: 0 }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={tab === 'internacional' ? 'Ciudad, país o destino...' : 'Comuna, sector o dirección...'}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, fontWeight: 300, color: 'var(--ink)', fontFamily: 'inherit', background: 'transparent' }}
          />
        </div>

        {/* Custom selects inline */}
        <div className="flex items-center px-6 py-5" style={{ borderRight: '1px solid var(--border)', minWidth: 170 }}>
          <CustomSelect label="Tipo" options={TIPOS} value={tipo} onChange={setTipo} />
        </div>

        <div className="flex items-center px-6 py-5" style={{ borderRight: '1px solid var(--border)', minWidth: 180 }}>
          <CustomSelect label="Precio máx." options={PRECIOS} value={precio} onChange={setPrecio} />
        </div>

        {/* Search button */}
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 flex-shrink-0 self-stretch px-8"
          style={{
            background: 'var(--navy-dark)', color: '#fff', border: 'none',
            fontSize: 11, fontWeight: 700, letterSpacing: '2px',
            textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--green)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--navy-dark)' }}
        >
          Buscar <Search size={13} />
        </button>
      </div>
    </div>
  )
}
