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

function CustomSelect({ label, options, value, onChange }: {
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
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 3 }}>{label}</div>
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2" style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', cursor: 'pointer', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 13, color: value ? 'var(--navy-dark)' : 'var(--muted)' }}>{selected.label}</span>
        <ChevronDown size={12} style={{ color: 'var(--muted)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="absolute z-50 bg-white border border-[#e8edf2]" style={{ top: 'calc(100% + 8px)', left: 0, minWidth: 180, boxShadow: '0 8px 32px rgba(15,37,53,0.12)', borderRadius: 2 }}>
          {options.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center justify-between transition-colors"
              style={{ padding: '10px 14px', fontSize: 14, color: opt.value === value ? 'var(--navy-dark)' : 'var(--muted)', background: opt.value === value ? 'var(--sky-pale)' : 'transparent', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}
              onMouseEnter={e => { if (opt.value !== value) { e.currentTarget.style.background = 'var(--off)'; e.currentTarget.style.color = 'var(--navy-dark)' } }}
              onMouseLeave={e => { if (opt.value !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)' } }}
            >
              {opt.label}
              {opt.value === value && <Check size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchBar() {
  const navigate = useNavigate()
  const [tab, setTab]       = useState<Tab>('comprar')
  const [query, setQuery]   = useState('')
  const [tipo, setTipo]     = useState('')
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
      <div className="flex" style={{ borderBottom: '2px solid var(--border)', paddingLeft: 16, paddingRight: 16 }}>
        {([
          { key: 'comprar', label: 'Comprar' },
          { key: 'arrendar', label: 'Arrendar' },
          { key: 'internacional', label: 'Intl.' },
        ] as { key: Tab; label: string }[]).map(item => (
          <button key={item.key} onClick={() => setTab(item.key)}
            style={{
              fontSize: 11, fontWeight: tab === item.key ? 600 : 400,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              padding: '12px 14px 10px', cursor: 'pointer',
              background: tab === item.key ? 'var(--navy-dark)' : 'none',
              border: 'none',
              borderBottom: tab === item.key ? '2px solid var(--navy-dark)' : '2px solid transparent',
              color: tab === item.key ? '#fff' : 'var(--muted)',
              fontFamily: 'inherit', marginBottom: -2, transition: 'all 0.15s',
              flex: 1,
            }}
          >{item.label}</button>
        ))}
      </div>

      {/* Mobile: campo + botón en una fila, selects debajo */}
      <div style={{ borderTop: '3px solid var(--green)', background: '#fff' }}>

        {/* Fila 1: input + buscar */}
        <div className="flex items-center gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex flex-1 items-center gap-2" style={{ padding: '12px 16px' }}>
            <Search size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={tab === 'internacional' ? 'Ciudad o país...' : 'Comuna o dirección...'}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontWeight: 300, color: 'var(--ink)', fontFamily: 'inherit', background: 'transparent', minWidth: 0 }}
            />
          </div>
          <button onClick={handleSearch}
            className="flex items-center gap-2 flex-shrink-0"
            style={{ background: 'var(--navy-dark)', color: '#fff', border: 'none', padding: '14px 18px', fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'stretch', transition: 'background 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--green)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--navy-dark)')}
          >
            <Search size={14} />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>

        {/* Fila 2: dropdowns — en mobile van en fila horizontal scrollable */}
        <div className="flex gap-0" style={{ overflowX: 'auto' }}>
          <div style={{ padding: '10px 16px', borderRight: '1px solid var(--border)', flexShrink: 0 }}>
            <CustomSelect label="Tipo" options={TIPOS} value={tipo} onChange={setTipo} />
          </div>
          <div style={{ padding: '10px 16px', flexShrink: 0 }}>
            <CustomSelect label="Precio máx." options={PRECIOS} value={precio} onChange={setPrecio} />
          </div>
        </div>
      </div>
    </div>
  )
}
