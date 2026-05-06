import SEO from '@/components/SEO'
import { useEffect, useState, useRef } from 'react'
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

function applyCatalogOrder(props: Propiedad[], mode: string): Propiedad[] {
  const copy = [...props]
  if (mode === 'precio_alto') {
    const consultar = copy.filter(p => p.a_consultar)
    const resto = copy.filter(p => !p.a_consultar).sort((a, b) => (b.precio_uf || 0) - (a.precio_uf || 0))
    return [...consultar, ...resto]
  }
  if (mode === 'precio_bajo') {
    const consultar = copy.filter(p => p.a_consultar)
    const resto = copy.filter(p => !p.a_consultar).sort((a, b) => (a.precio_uf || 0) - (b.precio_uf || 0))
    return [...resto, ...consultar]
  }
  if (mode === 'aleatorio') {
    return copy.sort(() => Math.random() - 0.5)
  }
  // 'manual' u otro: orden por campo `orden` (ya viene de Supabase)
  return copy.sort((a, b) => {
    const ao = (a as Record<string,unknown>).orden as number ?? 9999
    const bo = (b as Record<string,unknown>).orden as number ?? 9999
    return ao - bo
  })
}

export default function PropiedadesPage() {
  const [searchParams] = useSearchParams()
  const [props, setProps] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenCatalogo, setOrdenCatalogo] = useState('manual')
  const [filtros, setFiltros] = useState<FiltrosPropiedades>({
    tipo: (searchParams.get('tipo') as FiltrosPropiedades['tipo']) || '',
    estado: (searchParams.get('estado') as FiltrosPropiedades['estado']) || '',
    region: searchParams.get('region') || '',
    comuna: searchParams.get('comuna') || '',
    internacional: searchParams.get('internacional') === 'true',
  })
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    // Leer orden guardado en Supabase contenido_sitio
    supabase.from('contenido_sitio').select('valor').eq('clave', 'catalogo_orden').single()
      .then(({ data }) => { if (data?.valor) setOrdenCatalogo(data.valor) })
  }, [])

  useEffect(() => {
    setLoading(true)
    let q = supabase.from('propiedades').select('*').or('activo.is.null,activo.eq.true')
    if (filtros.tipo)          q = q.eq('tipo', filtros.tipo)
    if (filtros.estado)        q = q.eq('estado', filtros.estado)
    if (filtros.region)        q = q.eq('region', filtros.region)
    if (filtros.comuna)        q = q.ilike('comuna', `%${filtros.comuna}%`)
    if (filtros.internacional) q = q.eq('internacional', true)
    q.neq('activo', false)
     .order('orden', { ascending: true, nullsFirst: false })
     .then(({ data }) => {
       setProps(data || [])
       setLoading(false)
     })
  }, [filtros])

  const displayProps = applyCatalogOrder(props, ordenCatalogo)

  const clearFiltro = (key: keyof FiltrosPropiedades) =>
    setFiltros(f => ({ ...f, [key]: '' }))

  const activeFiltros = Object.entries(filtros).filter(([, v]) => v && v !== false && v !== '')

  return (
    <div className="min-h-screen">
      <SEO title="Propiedades en Venta y Arriendo" description="Encuentra casas, departamentos, parcelas y propiedades comerciales en Chile. Catálogo actualizado con las mejores oportunidades inmobiliarias." url="/propiedades" />
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

        {/* Panel filtros */}
        {panelOpen && (
          <div className="mt-6 pt-6 border-t border-[#e8edf2] grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Tipo', key: 'tipo', opts: TIPOS },
              { label: 'Estado', key: 'estado', opts: ESTADOS },
              { label: 'Región', key: 'region', opts: REGIONES },
              { label: 'Precio máx.', key: 'precio_max', opts: PRECIOS },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <select
                  value={(filtros as Record<string,unknown>)[f.key] as string || ''}
                  onChange={e => setFiltros(prev => ({ ...prev, [f.key]: e.target.value }))}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', padding: '6px 0', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', background: 'transparent', outline: 'none', cursor: 'pointer' }}
                >
                  {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Active filters */}
        {activeFiltros.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFiltros.map(([key, val]) => (
              <span key={key} className="flex items-center gap-1.5 px-3 py-1 rounded-full cursor-pointer"
                style={{ fontSize: 12, background: 'var(--off)', border: '1px solid var(--border)', color: 'var(--muted)' }}
                onClick={() => clearFiltro(key as keyof FiltrosPropiedades)}>
                {String(val)} <X size={11} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      <div className="px-4 lg:px-12 pt-6 pb-2">
        <p style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.5px' }}>
          {loading ? 'Cargando...' : `${displayProps.length} ${displayProps.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`}
        </p>
      </div>

      {/* Grid */}
      <div className="px-4 lg:px-12 pb-20">
        {loading ? (
          <div className="flex justify-center py-24">
            <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : displayProps.length === 0 ? (
          <div className="text-center py-24">
            <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300 }}>No se encontraron propiedades con los filtros seleccionados.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: 'var(--border)',
            marginTop: 24,
          }}>
            {displayProps.map((p) => (
              <PropertyCard key={p.id} propiedad={p} />
            ))}
            {/* Rellenar última fila si no es múltiplo de 3 */}
            {displayProps.length % 3 === 1 && <><div className="bg-white" /><div className="bg-white" /></>}
            {displayProps.length % 3 === 2 && <div className="bg-white" />}
          </div>
        )}
      </div>
    </div>
  )
}
