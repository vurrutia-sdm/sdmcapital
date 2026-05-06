import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { supabase } from '@/lib/supabase'
import PropertyCard from '@/components/ui/PropertyCard'
import type { Propiedad, FiltrosPropiedades } from '@/types'

const TIPOS = [
  { value: '',             label: 'Todos los tipos' },
  { value: 'casa',         label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'oficina',      label: 'Oficina' },
  { value: 'parcela',      label: 'Parcela' },
  { value: 'comercial',    label: 'Comercial' },
  { value: 'hotel',        label: 'Hotel / Inversión' },
]
const REGIONES = [
  { value: '',                label: 'Todas las regiones' },
  { value: 'R. Metropolitana',label: 'R. Metropolitana' },
  { value: 'Valparaíso',      label: 'Valparaíso' },
  { value: 'Coquimbo',        label: 'Coquimbo' },
  { value: 'Biobío',          label: 'Biobío' },
  { value: 'Los Lagos',       label: 'Los Lagos' },
]
const ESTADOS = [
  { value: '',           label: 'Todos' },
  { value: 'en_venta',   label: 'En venta' },
  { value: 'en_arriendo',label: 'En arriendo' },
]
const PRECIOS = [
  { value: '',     label: 'Sin límite' },
  { value: '2000', label: 'Hasta UF 2.000' },
  { value: '3500', label: 'Hasta UF 3.500' },
  { value: '5000', label: 'Hasta UF 5.000' },
  { value: '8000', label: 'Hasta UF 8.000' },
  { value: '10000',label: 'Hasta UF 10.000' },
  { value: '15000',label: 'Hasta UF 15.000' },
]

export default function PropiedadesPage() {
  const [searchParams] = useSearchParams()
  const [props, setProps] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosPropiedades>({
    tipo: (searchParams.get('tipo') as FiltrosPropiedades['tipo']) || '',
    estado: (searchParams.get('estado') as FiltrosPropiedades['estado']) || '',
    region: searchParams.get('region') || '',
    comuna: searchParams.get('comuna') || '',
    internacional: searchParams.get('internacional') === 'true',
  })
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('propiedades').select('*').or('activo.is.null,activo.eq.true')
    if (filtros.tipo)         q = q.eq('tipo', filtros.tipo)
    if (filtros.estado)       q = q.eq('estado', filtros.estado)
    if (filtros.region)       q = q.eq('region', filtros.region)
    if (filtros.comuna)       q = q.ilike('comuna', `%${filtros.comuna}%`)
    if (filtros.internacional) q = q.eq('internacional', true)
    q = q.neq('activo', false) // excluir pausadas
    q.order('destacada', { ascending: false })
     .order('created_at', { ascending: false })
     .then(({ data }) => {
       setProps(data || [])
       setLoading(false)
     })
  }, [filtros])

  const clearFiltro = (key: keyof FiltrosPropiedades) =>
    setFiltros(f => ({ ...f, [key]: '' }))

  const activeFiltros = Object.entries(filtros).filter(([, v]) => v && v !== false && v !== '')

  return (
    <div className="min-h-screen">
      {/* Header band */}
      <div className="px-4 lg:px-12 pt-10 lg:pt-14 pb-8 lg:pb-10 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 14 }}>
          {filtros.internacional ? 'Propiedades internacionales' : 'Catálogo'}
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif font-light" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.05, letterSpacing: '-0.5px' }}>
            {filtros.internacional
              ? <>Propiedades <em>internacionales</em></>
              : filtros.region
              ? <>Propiedades <em>en {filtros.region}</em></>
              : 'Propiedades'
            }
          </h1>
          <button
            onClick={() => setPanelOpen(v => !v)}
            className="flex items-center gap-2 font-medium tracking-[1.5px] uppercase transition-colors flex-shrink-0 mt-2"
            style={{ fontSize: 13, color: panelOpen ? 'var(--green)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <SlidersHorizontal size={14} />
            Filtros {activeFiltros.length > 0 && `(${activeFiltros.length})`}
          </button>
        </div>

        {/* Active filter chips */}
        {activeFiltros.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {activeFiltros.map(([k, v]) => (
              <button
                key={k}
                onClick={() => clearFiltro(k as keyof FiltrosPropiedades)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] tracking-wide rounded-full border transition-colors"
                style={{ borderColor: 'var(--green)', color: 'var(--green)', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {String(v)} <X size={10} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter panel */}
      {panelOpen && (
        <div className="px-8 lg:px-12 py-6 border-b border-[#e8edf2]" style={{ background: 'var(--off)' }}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { label: 'Tipo',   key: 'tipo',   options: TIPOS },
              { label: 'Estado', key: 'estado', options: ESTADOS },
              { label: 'Región', key: 'region', options: REGIONES },
            ].map(field => (
              <div key={field.key}>
                <label className="block mb-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {field.label}
                </label>
                <select
                  value={(filtros as Record<string, unknown>)[field.key] as string || ''}
                  onChange={e => setFiltros(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full border border-[#e8edf2] rounded-sm px-3 py-2 text-[15px] font-light"
                  style={{ color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}
                >
                  {field.options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            ))}
            <div>
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Comuna
              </label>
              <input
                type="text"
                value={filtros.comuna || ''}
                onChange={e => setFiltros(f => ({ ...f, comuna: e.target.value }))}
                placeholder="Ej: Las Condes"
                className="w-full border border-[#e8edf2] rounded-sm px-3 py-2 text-[15px] font-light"
                style={{ color: 'var(--ink)', background: '#fff', fontFamily: 'inherit', outline: 'none' }}
              />
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: 11, fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                Precio máx. (UF)
              </label>
              <select
                onChange={e => setFiltros(f => ({ ...f, precio_max_uf: Number(e.target.value) || undefined }))}
                className="w-full border border-[#e8edf2] rounded-sm px-3 py-2 text-[15px] font-light"
                style={{ color: 'var(--ink)', background: '#fff', fontFamily: 'inherit' }}
              >
                {PRECIOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <label className="flex items-center gap-2 cursor-pointer text-[14px]" style={{ color: 'var(--muted)' }}>
              <input
                type="checkbox"
                checked={!!filtros.internacional}
                onChange={e => setFiltros(f => ({ ...f, internacional: e.target.checked }))}
                className="accent-green-600"
              />
              Solo internacionales
            </label>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-8 lg:px-12 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white" style={{ height: 380, opacity: 0.4 + i * 0.1 }} />
            ))}
          </div>
        ) : props.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-serif italic" style={{ fontSize: 22, color: 'var(--muted)' }}>
              No se encontraron propiedades con estos filtros.
            </p>
            <button
              onClick={() => setFiltros({})}
              className="mt-6 btn-primary"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, letterSpacing: '0.5px' }}>
              {props.length} {props.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}
            </p>
            {/* Wrapper centrado para cuando remainder = 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)' }}>
              {props.map((p, i) => {
                const total = props.length
                const remainder = total % 3
                const isLast = i === total - 1
                // Si sobra 1 al final → centrar en columna 2 (sin span)
                const centerLast = remainder === 1 && isLast
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#fff',
                      minWidth: 0,
                      gridColumn: centerLast ? '2 / 3' : undefined,
                    }}
                  >
                    <PropertyCard propiedad={p} index={i} />
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
