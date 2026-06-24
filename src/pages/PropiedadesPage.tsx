import { useEffect, useState, useRef } from 'react'
import SEO from '@/components/SEO'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { SlidersHorizontal, X, Map, Grid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getComunas } from '@/data/comunas-chile'
import PropertyCard from '@/components/ui/PropertyCard'
import type { Propiedad, FiltrosPropiedades } from '@/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

declare global { interface Window { google: typeof google } }

const TIPOS   = [{ value: '', label: 'Todos los tipos' },{ value: 'casa', label: 'Casa' },{ value: 'departamento', label: 'Departamento' },{ value: 'oficina', label: 'Oficina' },{ value: 'parcela', label: 'Parcela' },{ value: 'comercial', label: 'Comercial' },{ value: 'hotel', label: 'Hotel / Inversión' }]
const REGIONES = [{ value: '', label: 'Todas las regiones' },{ value: 'R. Metropolitana', label: 'R. Metropolitana' },{ value: 'Valparaíso', label: 'Valparaíso' },{ value: 'Coquimbo', label: 'Coquimbo' },{ value: 'Biobío', label: 'Biobío' },{ value: 'Los Lagos', label: 'Los Lagos' }]
const ESTADOS  = [{ value: '', label: 'Todos' },{ value: 'en_venta', label: 'En venta' },{ value: 'en_arriendo', label: 'En arriendo' },{ value: 'vendida', label: 'Vendida' },{ value: 'reservada', label: 'Reservada' },{ value: 'arrendada', label: 'Arrendada' }]
const PRECIOS  = [{ value: '', label: 'Sin límite' },{ value: '2000', label: 'Hasta UF 2.000' },{ value: '3500', label: 'Hasta UF 3.500' },{ value: '5000', label: 'Hasta UF 5.000' },{ value: '8000', label: 'Hasta UF 8.000' },{ value: '10000', label: 'Hasta UF 10.000' },{ value: '15000', label: 'Hasta UF 15.000' }]

const ETIQUETAS_FILTRO: Record<string, string> = {
  // Estado
  en_venta: 'En Venta',
  en_arriendo: 'En Arriendo',
  vendida: 'Vendida',
  reservada: 'Reservada',
  arrendada: 'Arrendada',
  // Tipo
  casa: 'Casa',
  departamento: 'Departamento',
  oficina: 'Oficina',
  parcela: 'Parcela',
  comercial: 'Comercial',
  hotel: 'Hotel',
  terreno: 'Terreno',
  otro: 'Otro',
  // Categoría
  usada: 'Propiedad Usada',
  proyecto_nuevo: 'Proyecto Nuevo',
}

function applyCatalogOrder(props: Propiedad[], mode: string): Propiedad[] {
  const copy = [...props]
  if (mode === 'precio_alto') { const c = copy.filter(p => p.a_consultar); const r = copy.filter(p => !p.a_consultar).sort((a,b) => (b.precio_uf||0)-(a.precio_uf||0)); return [...c,...r] }
  if (mode === 'precio_bajo') { const c = copy.filter(p => p.a_consultar); const r = copy.filter(p => !p.a_consultar).sort((a,b) => (a.precio_uf||0)-(b.precio_uf||0)); return [...r,...c] }
  if (mode === 'aleatorio')   return copy.sort(() => Math.random() - 0.5)
  return copy.sort((a,b) => { const ao = (a as Record<string,unknown>).orden as number ?? 9999; const bo = (b as Record<string,unknown>).orden as number ?? 9999; return ao - bo })
}

// ── MAP VIEW ─────────────────────────────────────────────────────────────────
function MapView({ props }: { props: Propiedad[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(!!window.google?.maps)
  const [selected, setSelected] = useState<Propiedad | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  useEffect(() => {
    if (window.google?.maps) { setLoaded(true); return }
    const existing = document.getElementById('google-maps-script')
    if (existing) { existing.addEventListener('load', () => setLoaded(true)); return }
    const s = document.createElement('script')
    s.id = 'google-maps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`
    s.async = true
    s.onload = () => setLoaded(true)
    document.head.appendChild(s)
  }, [])

  useEffect(() => {
    if (!loaded || !mapRef.current) return
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 10, center: { lat: -33.4489, lng: -70.6693 },
      mapTypeControl: false, streetViewControl: false,
    })

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null))
    markersRef.current = []

    const bounds = new window.google.maps.LatLngBounds()
    const geocoder = new window.google.maps.Geocoder()

    props.forEach(p => {
      const r = p as Record<string,unknown>
      const lat = r.map_lat as number
      const lng = r.map_lng as number

      const addMarker = (pos: google.maps.LatLng | google.maps.LatLngLiteral) => {
        const marker = new window.google.maps.Marker({
          map, position: pos,
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#3DAA6E', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
          title: p.titulo,
        })
        marker.addListener('click', () => setSelected(p))
        markersRef.current.push(marker)
        bounds.extend(pos)
        if (markersRef.current.length > 1) map.fitBounds(bounds)
      }

      if (lat && lng) {
        addMarker({ lat, lng })
      } else {
        const addr = (r.map_address as string) || `${p.comuna}, ${p.region}, Chile`
        geocoder.geocode({ address: addr }, (results, status) => {
          if (status === 'OK' && results?.[0]) addMarker(results[0].geometry.location)
        })
      }
    })
  }, [loaded, props])

  return (
    <div style={{ position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: 600, background: '#f0f4f7' }} />
      {selected && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', width: 300, background: '#fff', borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 10 }}>
          {(selected.imagen_principal || selected.imagenes?.[0]) && (
            <img src={selected.imagen_principal || selected.imagenes[0]} alt={selected.titulo} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 4 }}>{selected.titulo}</div>
            <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>
              {selected.a_consultar ? 'A consultar' : selected.precio_uf ? `UF ${selected.precio_uf.toLocaleString('es-CL')}` : '—'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={`/propiedades/${selected.id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--navy-dark)', color: '#fff', borderRadius: 2, textDecoration: 'none', fontSize: 12, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Ver propiedad
              </Link>
              <button onClick={() => setSelected(null)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 2, background: '#fff', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PropiedadesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const categoria =
    location.pathname === '/propiedades-usadas' ? 'usada' :
    location.pathname === '/proyectos-nuevos'   ? 'proyecto_nuevo' :
    ''
  const pageTitle =
    categoria === 'usada'          ? 'Propiedades Usadas' :
    categoria === 'proyecto_nuevo' ? 'Proyectos Nuevos' :
    'Propiedades'
  const [props, setProps] = useState<Propiedad[]>([])
  const [loading, setLoading] = useState(true)
  const [ordenCatalogo, setOrdenCatalogo] = useState('manual')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [comunaInput, setComunaInput] = useState(searchParams.get('comuna') || '')
  const [filtros, setFiltros] = useState<FiltrosPropiedades>({
    tipo: '', estado: '', region: '', comuna: '', internacional: false,
  })
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    supabase.from('contenido_sitio').select('valor').eq('clave', 'catalogo_orden').single()
      .then(({ data }) => { if (data?.valor) setOrdenCatalogo(data.valor) })
  }, [])

  useEffect(() => {
    let ignore = false

    const filtrosActuales: FiltrosPropiedades = {
      tipo:          (searchParams.get('tipo') as FiltrosPropiedades['tipo']) || '',
      estado:        (searchParams.get('estado') as FiltrosPropiedades['estado']) || '',
      region:        searchParams.get('region') || '',
      comuna:        searchParams.get('comuna') || '',
      internacional: searchParams.get('internacional') === 'true',
    }

    setFiltros(filtrosActuales)
    setLoading(true)

    let q = supabase.from('propiedades').select('*').or('activo.is.null,activo.eq.true')
    if (categoria)                      q = q.eq('categoria', categoria)
    if (filtrosActuales.tipo)           q = q.eq('tipo', filtrosActuales.tipo)
    if (filtrosActuales.estado)         q = q.eq('estado', filtrosActuales.estado)
    if (filtrosActuales.region)         q = q.eq('region', filtrosActuales.region)
    if (filtrosActuales.comuna)         q = q.ilike('comuna', `%${filtrosActuales.comuna}%`)
    if (filtrosActuales.internacional)  q = q.eq('internacional', true)

    q.neq('activo', false).order('orden', { ascending: true, nullsFirst: false })
      .then(({ data, error }) => {
        if (ignore) return
        if (!error) setProps(data || [])
        setLoading(false)
      })

    return () => { ignore = true }
  }, [searchParams, categoria])

  const displayProps = applyCatalogOrder(props, ordenCatalogo)
  const clearFiltro  = (key: keyof FiltrosPropiedades) => {
    const nuevos = new URLSearchParams(searchParams)
    nuevos.delete(key)
    setSearchParams(nuevos, { replace: true })
  }
  const activeFiltros = Object.entries(filtros).filter(([, v]) => v && v !== false && v !== '')

  return (
    <div className="min-h-screen">
      <SEO title="Propiedades en Venta y Arriendo" description="Encuentra casas, departamentos, parcelas y propiedades comerciales en Chile." url="/propiedades" />

      {/* Header */}
      <div className="px-4 lg:px-12 pt-10 lg:pt-14 pb-8 lg:pb-10 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 14 }}>Catálogo</div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-serif font-light" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.05, letterSpacing: '-0.5px' }}>
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {/* View toggle */}
            <div className="flex" style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')}
                style={{ padding: '8px 14px', background: viewMode === 'grid' ? 'var(--navy-dark)' : '#fff', color: viewMode === 'grid' ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}>
                <Grid size={14} /> Lista
              </button>
              <button onClick={() => setViewMode('map')}
                style={{ padding: '8px 14px', background: viewMode === 'map' ? 'var(--navy-dark)' : '#fff', color: viewMode === 'map' ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, transition: 'all 0.2s' }}>
                <Map size={14} /> Mapa
              </button>
            </div>
            <button onClick={() => setPanelOpen(v => !v)}
              className="flex items-center gap-2"
              style={{ fontSize: 13, color: panelOpen ? 'var(--green)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>
              <SlidersHorizontal size={14} />
              Filtros {activeFiltros.length > 0 && `(${activeFiltros.length})`}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {panelOpen && (
          <div className="mt-6 pt-6 border-t border-[#e8edf2] grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Tipo',     key: 'tipo',   opts: TIPOS },
              { label: 'Estado',   key: 'estado', opts: ESTADOS },
              { label: 'Región', key: 'region', opts: REGIONES },
              { label: 'Precio',   key: 'precio_max', opts: PRECIOS },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
                <select value={(filtros as Record<string,unknown>)[f.key] as string || ''}
                  onChange={e => {
                    const nuevos = new URLSearchParams(searchParams)
                    if (e.target.value) nuevos.set(f.key, e.target.value)
                    else nuevos.delete(f.key)
                    if (f.key === 'region') nuevos.delete('comuna')
                    setSearchParams(nuevos, { replace: true })
                  }}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', padding: '6px 0', fontSize: 14, fontFamily: 'inherit', color: 'var(--ink)', background: 'transparent', outline: 'none', cursor: 'pointer' }}>
                  {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
            {/* Comuna filter */}
            <div>
              <label style={{ fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Comuna</label>
              <select
                value={filtros.comuna || ''}
                onChange={e => {
                  const nuevos = new URLSearchParams(searchParams)
                  if (e.target.value) nuevos.set('comuna', e.target.value)
                  else nuevos.delete('comuna')
                  setSearchParams(nuevos, { replace: true })
                }}
                disabled={!filtros.region}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)', padding: '6px 0', fontSize: 14, fontFamily: 'inherit', color: filtros.region ? 'var(--ink)' : 'var(--muted)', background: 'transparent', outline: 'none', cursor: filtros.region ? 'pointer' : 'not-allowed' }}
              >
                <option value="">{filtros.region ? 'Todas las comunas' : 'Primero elige región'}</option>
                {filtros.region && getComunas(filtros.region).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active filters */}
        {activeFiltros.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFiltros.map(([key, val]) => (
              <span key={key} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer"
                style={{ fontSize: 12, fontWeight: 400, background: '#fff', border: '1px solid var(--border)', color: 'var(--ink)', transition: 'border-color 0.2s, background 0.2s' }}
                onClick={() => { clearFiltro(key as keyof FiltrosPropiedades); if (key === 'comuna') setComunaInput('') }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--off)'; e.currentTarget.style.borderColor = 'var(--muted)' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                {ETIQUETAS_FILTRO[String(val)] ?? String(val)}
                <X size={11} style={{ color: 'var(--muted)' }} />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      <div className="px-4 lg:px-12 pt-6 pb-2">
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          {loading ? 'Cargando...' : `${displayProps.length} ${displayProps.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : displayProps.length === 0 ? (
        <div className="text-center py-24">
          <p style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300 }}>No se encontraron propiedades.</p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="px-4 lg:px-12 pb-20 mt-6">
          <MapView props={displayProps} />
        </div>
      ) : (
        <div className="px-4 lg:px-12 pb-20">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--border)', marginTop: 24 }}>
            {displayProps.map(p => <PropertyCard key={p.id} propiedad={p} />)}
            {displayProps.length % 3 === 1 && <><div className="bg-white" /><div className="bg-white" /></>}
            {displayProps.length % 3 === 2 && <div className="bg-white" />}
          </div>
        </div>
      )}
    </div>
  )
}
