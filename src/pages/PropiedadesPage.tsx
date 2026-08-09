import { useEffect, useState, useRef } from 'react'
import SEO from '@/components/SEO'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { SlidersHorizontal, X, Map, Grid } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getComunas } from '@/data/comunas-chile'
import { useContenido } from '@/hooks/useContenido'
import PropertyCard from '@/components/ui/PropertyCard'
import { thumbUrl } from '@/lib/imagenes'
import type { Propiedad, FiltrosPropiedades } from '@/types'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

declare global { interface Window { google: typeof google } }

// Estado vacío del filtro de arriendo.
//
// El menú del header y RentalPage enlazan a ?estado=en_arriendo, y hoy el
// catálogo no tiene ninguna propiedad en ese estado. Con la vista vacía genérica
// el visitante concluye que SDM no hace arriendos y se va. El arriendo es línea
// de negocio propia, así que aquí se capta en vez de no decir nada.
//
// Solo aplica a este filtro: para el resto, el vacío genérico —"Ninguna
// propiedad coincide con estos filtros"— es la respuesta correcta.
function SinArriendos() {
  const { get } = useContenido()
  const wa = get('whatsapp', '56937478846')
  const texto = 'Hola, me interesa arrendar. ¿Me avisan cuando tengan propiedades disponibles?'

  return (
    <div className="px-4 lg:px-12 pb-20">
      <div
        className="text-center mx-auto"
        style={{ maxWidth: 620, marginTop: 32, padding: '56px 32px', background: 'var(--off)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
          Estamos actualizando nuestro <em>catálogo de arriendos</em>
        </h2>
        <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.8, marginTop: 18 }}>
          En SDM Capital trabajamos con propiedades en arriendo. En este momento no
          tenemos unidades publicadas, pero recibimos disponibilidad nueva de forma
          constante. Escríbenos y te avisamos apenas tengamos algo que calce con lo
          que buscas.
        </p>
        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
          style={{ marginTop: 28 }}
        >
          Avísame cuando haya arriendos
        </a>
      </div>
    </div>
  )
}

// Vacío de «Proyectos Nuevos» cuando se pide arriendo dentro de esa vitrina.
//
// Con el filtro que excluye arriendos de esta ruta, la combinación da CERO
// siempre. El vacío genérico —«Ninguna propiedad coincide con estos filtros»—
// sería cierto y desorientador a la vez: el visitante concluiría que no hay
// arriendos, cuando sí los hay y son tres.
//
// El texto dice DÓNDE ESTÁN, no solo que aquí no están, y lleva el enlace con el
// filtro ya puesto para no obligar a rehacer la búsqueda.
function ArriendosEnElCatalogo() {
  return (
    <div className="px-4 lg:px-12 pb-20">
      <div
        className="text-center mx-auto"
        style={{ maxWidth: 620, marginTop: 32, padding: '56px 32px', background: 'var(--off)', border: '1px solid var(--border)' }}
      >
        <h2 className="font-serif font-light text-sdm-display-sm" style={{ color: 'var(--navy-dark)' }}>
          Los arriendos están en el <em>catálogo general</em>
        </h2>
        <p className="text-sdm-base" style={{ color: 'var(--muted)', lineHeight: 1.8, marginTop: 18 }}>
          Proyectos Nuevos reúne las unidades en venta. Sí tenemos propiedades en
          arriendo —departamentos nuevos incluidos—, pero se listan aparte.
        </p>
        <Link to="/propiedades?estado=en_arriendo" className="btn-primary" style={{ marginTop: 28 }}>
          Ver propiedades en arriendo
        </Link>
      </div>
    </div>
  )
}

const TIPOS   = [{ value: '', label: 'Todos los tipos' },{ value: 'casa', label: 'Casa' },{ value: 'departamento', label: 'Departamento' },{ value: 'oficina', label: 'Oficina' },{ value: 'parcela', label: 'Parcela' },{ value: 'comercial', label: 'Comercial' },{ value: 'hotel', label: 'Hotel / Inversión' }]
const REGIONES = [{ value: '', label: 'Todas las regiones' },{ value: 'R. Metropolitana', label: 'R. Metropolitana' },{ value: 'Valparaíso', label: 'Valparaíso' },{ value: 'Coquimbo', label: 'Coquimbo' },{ value: 'Biobío', label: 'Biobío' },{ value: 'Los Lagos', label: 'Los Lagos' }]
const ESTADOS  = [{ value: '', label: 'Todos' },{ value: 'en_venta', label: 'En venta' },{ value: 'en_arriendo', label: 'En arriendo' },{ value: 'vendida', label: 'Vendida' },{ value: 'reservada', label: 'Reservada' },{ value: 'arrendada', label: 'Arrendada' }]
const PRECIOS  = [{ value: '', label: 'Sin límite' },{ value: '2000', label: 'Hasta UF 2.000' },{ value: '3500', label: 'Hasta UF 3.500' },{ value: '5000', label: 'Hasta UF 5.000' },{ value: '8000', label: 'Hasta UF 8.000' },{ value: '10000', label: 'Hasta UF 10.000' },{ value: '15000', label: 'Hasta UF 15.000' }]

// DOS OPCIONES, SIETE VALORES DETRÁS.
//
// `etapa_construccion` admite en_blanco, en_verde, planos, inicio, avanzado,
// proxima_entrega y entrega_inmediata. Al visitante no le sirve elegir entre
// siete fases de obra: le sirve saber si puede mudarse ya o no.
//
// «Futura» se define por NEGACIÓN —todo lo que no es inmediata y no está
// vacío—, no como `= proxima_entrega`. Así el día que alguien cargue una «En
// Verde» aparece sola, sin tocar esto. Hoy solo se usan dos de los siete
// valores: 20 inmediatas y 3 próximas.
const ENTREGAS = [{ value: '', label: 'Todas' },{ value: 'inmediata', label: 'Entrega inmediata' },{ value: 'futura', label: 'Entrega futura' }]

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

// El chip tiene que decir LO QUE SE ELIGIÓ, no el valor crudo.
//
// `ETIQUETAS_FILTRO` mapea valores sueltos —«en_venta» → «En Venta»— y alcanza
// mientras cada valor sea único en todo el panel. Deja de alcanzar en cuanto un
// filtro guarda un número: el chip de un tope de precio diría «3500» a secas, y
// sin la clave no hay forma de saber que eso son UF y que es un techo.
function etiquetaFiltro(key: string, val: unknown): string {
  const s = String(val)
  if (key === 'precio_max_uf') return `Hasta UF ${Number(s).toLocaleString('es-CL')}`
  if (key === 'bono_pie')      return s === 'si' ? 'Con bono pie' : `Bono pie ${s}% o más`
  if (key === 'entrega')       return s === 'inmediata' ? 'Entrega inmediata' : 'Entrega futura'
  return ETIQUETAS_FILTRO[s] ?? s
}

function applyCatalogOrder(props: Propiedad[], mode: string): Propiedad[] {
  const copy = [...props]
  if (mode === 'precio_alto') { const c = copy.filter(p => p.a_consultar); const r = copy.filter(p => !p.a_consultar).sort((a,b) => (b.precio_uf||0)-(a.precio_uf||0)); return [...c,...r] }
  if (mode === 'precio_bajo') { const c = copy.filter(p => p.a_consultar); const r = copy.filter(p => !p.a_consultar).sort((a,b) => (a.precio_uf||0)-(b.precio_uf||0)); return [...r,...c] }
  if (mode === 'aleatorio')   return copy.sort(() => Math.random() - 0.5)
  return copy.sort((a,b) => { const ao = a.orden ?? 9999; const bo = b.orden ?? 9999; return ao - bo })
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
      const lat = p.map_lat
      const lng = p.map_lng

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
        const addr = p.map_address || `${p.comuna}, ${p.region}, Chile`
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
            <img src={thumbUrl(selected.imagen_principal || selected.imagenes[0])} alt={selected.titulo} loading="lazy" decoding="async" style={{ width: '100%', height: 140, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 16 }}>
            <div className="text-sdm-sm" style={{ fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 4 }}>{selected.titulo}</div>
            <div className="text-sdm-sm" style={{ color: 'var(--green)', fontWeight: 600, marginBottom: 12 }}>
              {selected.a_consultar ? 'A consultar' : selected.precio_uf ? `UF ${selected.precio_uf.toLocaleString('es-CL')}` : '—'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link className="text-sdm-sm tracking-sdm-wide" to={`/propiedades/${selected.slug || selected.id}`} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--navy-dark)', color: '#fff', borderRadius: 2, textDecoration: 'none', fontWeight: 600, textTransform: 'uppercase' }}>
                Ver propiedad
              </Link>
              <button className="text-sdm-lg" onClick={() => setSelected(null)} style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 2, background: '#fff', cursor: 'pointer' }}>×</button>
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
  const { get } = useContenido()
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
  // El orden del catálogo sale de `useContenido`, no de una consulta propia. Con
  // una consulta suelta la clave llegaba a los ~300ms y la grilla se reordenaba
  // delante del visitante; leyéndola de acá viene sembrada en index.html y el
  // primer render ya está bien. Sigue actualizándose sola si la consulta en vivo
  // trae otro valor, porque `get` lee del estado del hook.
  const ordenCatalogo = get('catalogo_orden', 'manual')
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [comunaInput, setComunaInput] = useState(searchParams.get('comuna') || '')
  const [filtros, setFiltros] = useState<FiltrosPropiedades>({
    tipo: '', estado: '', region: '', comuna: '', internacional: false,
  })
  const [panelOpen, setPanelOpen] = useState(false)
  // Los cortes de bono pie SALEN DE LA BASE, no de una lista escrita a mano: si
  // mañana alguien carga un 12%, aparece solo.
  const [bono, setBono] = useState<{ total: number; niveles: number[] }>({ total: 0, niveles: [] })

  // CONSULTA APARTE, Y NO DERIVADO DEL RESULTADO YA FILTRADO.
  //
  // Si los porcentajes salieran de `props`, al elegir «20% o más» el propio
  // selector se quedaría con esa única opción y no habría forma de volver atrás
  // ni de bajar el corte. Las opciones tienen que describir el UNIVERSO de la
  // ruta, no lo que queda después de filtrar.
  //
  // Por eso repite los recortes de RUTA —categoría, y la exclusión de arriendos
  // en Proyectos Nuevos— pero ninguno de los del panel. Es un `select` de una
  // sola columna sobre las ~28 con bono pie, y solo se rehace al cambiar de ruta.
  useEffect(() => {
    let ignore = false
    let q = supabase.from('propiedades').select('bono_pie_porcentaje')
      .or('activo.is.null,activo.eq.true').neq('activo', false).eq('bono_pie', true)
    if (categoria)                      q = q.eq('categoria', categoria)
    if (categoria === 'proyecto_nuevo') q = q.not('estado', 'in', '(en_arriendo,arrendada)')

    q.then(({ data, error }) => {
      if (ignore || error) return
      const total = (data || []).length
      const pcts = (data || [])
        .map(d => (d as { bono_pie_porcentaje: number | null }).bono_pie_porcentaje)
        .filter((n): n is number => typeof n === 'number' && n > 0)
      // FUERA LOS CORTES QUE NO RECORTAN NADA. Con «o más», el porcentaje más
      // bajo devuelve exactamente lo mismo que «Con bono pie» —hoy «4% o más»
      // trae las 28—, y una opción que no cambia el resultado solo hace dudar
      // de si el filtro funciona. La regla es la data, no un número escrito acá.
      const niveles = [...new Set(pcts)].sort((a, b) => a - b)
        .filter(n => pcts.filter(v => v >= n).length < total)
      setBono({ total, niveles })
    })

    return () => { ignore = true }
  }, [categoria])

  useEffect(() => {
    let ignore = false

    const filtrosActuales: FiltrosPropiedades = {
      tipo:          (searchParams.get('tipo') as FiltrosPropiedades['tipo']) || '',
      estado:        (searchParams.get('estado') as FiltrosPropiedades['estado']) || '',
      region:        searchParams.get('region') || '',
      comuna:        searchParams.get('comuna') || '',
      internacional: searchParams.get('internacional') === 'true',
      // UNA SOLA CLAVE PARA EL TOPE DE PRECIO: `precio_max_uf`.
      // El panel escribía `precio_max`, el tipo declaraba `precio_max_uf`, y la
      // consulta no leía ninguna de las dos. Elegir una sola cosa era un tope
      // que no recortaba nada: 79 propiedades antes y 79 después, con el select
      // volviendo solo a «Sin límite» porque su valor nunca llegaba al estado.
      // El nombre lleva la unidad a propósito, porque el catálogo tiene tres
      // monedas y el tope solo sabe comparar una.
      precio_max_uf: Number(searchParams.get('precio_max_uf')) || undefined,
      bono_pie:      searchParams.get('bono_pie') || '',
      entrega:       searchParams.get('entrega') || '',
    }

    setFiltros(filtrosActuales)
    setLoading(true)

    let q = supabase.from('propiedades').select('*').or('activo.is.null,activo.eq.true')
    if (categoria)                      q = q.eq('categoria', categoria)
    // «Proyectos Nuevos» es una VITRINA COMERCIAL de unidades en venta —bono pie,
    // entrega inmediata, etapa de construcción—, no una categoría del inventario.
    // Un arriendo no pertenece ahí aunque el inmueble sea nuevo: apareció uno
    // entre proyectos con argumentos de venta y no tenía sentido.
    //
    // `arrendada` además de `en_arriendo` por el mismo motivo: un inmueble ya
    // arrendado tampoco se está ofreciendo en venta. Hoy no hay ninguno en ese
    // estado, pero el filtro cubre el eje entero y no solo el caso que se vio.
    //
    // `vendida` y `reservada` SÍ se quedan, con su insignia como en el catálogo
    // general: son unidades que sí se ofrecieron ahí, y sacarlas haría
    // desaparecer proyectos enteros a medida que se colocan.
    //
    // `/propiedades-usadas` NO lleva un filtro equivalente, y es deliberado: es
    // una categoría del inventario, no una vitrina. Una casa usada en arriendo
    // sigue siendo una casa usada, y excluirlas dejaría 5 propiedades
    // alcanzables solo desde el filtro de estado.
    if (categoria === 'proyecto_nuevo') q = q.not('estado', 'in', '(en_arriendo,arrendada)')
    if (filtrosActuales.tipo)           q = q.eq('tipo', filtrosActuales.tipo)
    if (filtrosActuales.estado)         q = q.eq('estado', filtrosActuales.estado)
    if (filtrosActuales.region)         q = q.eq('region', filtrosActuales.region)
    if (filtrosActuales.comuna)         q = q.ilike('comuna', `%${filtrosActuales.comuna}%`)
    if (filtrosActuales.internacional)  q = q.eq('internacional', true)
    // EL TOPE COMPARA CONTRA `precio_uf` Y SOLO CONTRA ESO, ASÍ QUE LAS QUE NO
    // TIENEN UF DESAPARECEN CUANDO HAY TOPE. Es deliberado.
    //
    // De las 79 activas, 70 tienen precio en UF, 3 son «a consultar» y 6 están
    // solo en pesos. De esas 6, cinco son ARRIENDOS: su precio es una renta
    // mensual —$350.000, $420.000, $700.000—, no un valor de venta. Convertirlas
    // a UF con el valor del día las metería en «Hasta UF 2.000» a razón de unas
    // 9 UF, delante de departamentos de venta. No es un problema de conversión
    // de unidad sino de magnitud: son cosas distintas.
    //
    // La sexta está en $200.000.000 y sí es una venta, pero convertirla exigiría
    // traer el valor de la UF del día en cada carga del catálogo, y el precio
    // mostrado en la tarjeta seguiría siendo el de pesos: el filtro diría una
    // cosa y la tarjeta otra. Lo correcto es cargarle el precio en UF en el
    // admin, no adivinarlo acá.
    //
    // `lte` sobre una columna nula ya excluye esas filas —en SQL `NULL <= 2000`
    // no es verdadero—, así que ese caso sale del propio operador.
    //
    // EL `gt(0)` NO SOBRA. Dos propiedades tienen `precio_uf = 0` con su precio
    // real en pesos, y un cero no es «gratis» sino «no se cargó el valor en UF».
    // Sin la guarda pasaban TODOS los topes, incluido «Hasta UF 2.000», y una de
    // ellas es una casa de $200.000.000 —unas 5.100 UF—. La tarjeta además
    // muestra los pesos, porque `0` es falso en JS y cae al precio en CLP: el
    // filtro prometía un techo de UF 2.000 y debajo se leía «$ 200.000.000».
    // Con el cero fuera, esas dos se comportan igual que las que no tienen UF.
    //
    // Sin tope las once siguen apareciendo: la guarda solo actúa cuando hay
    // techo, que es cuando comparar importa.
    if (filtrosActuales.precio_max_uf)  q = q.gt('precio_uf', 0).lte('precio_uf', filtrosActuales.precio_max_uf)
    // `bono_pie = true` SIEMPRE, también cuando se pide un porcentaje. Hay una
    // propiedad con `bono_pie_porcentaje` cargado y `bono_pie` en falso —el
    // porcentaje quedó de un bono que se retiró—, y filtrando solo por el número
    // se colaría en todos los cortes ofreciendo un beneficio que no existe.
    if (filtrosActuales.bono_pie) {
      q = q.eq('bono_pie', true)
      const minimo = Number(filtrosActuales.bono_pie)
      // «14% o más» y no «exactamente 14%»: quien filtra por bono pie busca el
      // mayor beneficio, no ese número. Con coincidencia exacta cuatro de los
      // siete cortes devolverían entre 1 y 3 propiedades.
      if (minimo) q = q.gte('bono_pie_porcentaje', minimo)
    }
    if (filtrosActuales.entrega === 'inmediata') q = q.eq('etapa_construccion', 'entrega_inmediata')
    // Por negación, para que cualquier etapa nueva caiga acá sola. El `not is
    // null` no sobra: sin él entrarían las que no tienen etapa cargada, que no
    // es lo mismo que tener una entrega futura.
    if (filtrosActuales.entrega === 'futura')    q = q.not('etapa_construccion', 'is', null).neq('etapa_construccion', 'entrega_inmediata')

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

  // `SinArriendos` dice "no tenemos unidades en arriendo publicadas", y eso solo
  // es cierto cuando el arriendo es el ÚNICO recorte. Combinado con región,
  // comuna, tipo o con una categoría de la ruta, lo que no hay es resultados
  // para esa combinación, no arriendos — y el mensaje mentiría. Hoy da igual
  // porque no hay ningún arriendo residencial publicado, pero deja de dar igual
  // el día que se publique el primero.
  //
  // `categoria` entra en la cuenta aunque no viva en `filtros`: sale de la ruta
  // (/propiedades-usadas, /proyectos-nuevos) y recorta la consulta igual que un
  // filtro.
  const soloArriendo = filtros.estado === 'en_arriendo' && activeFiltros.length === 1 && !categoria
  // Pedir arriendo DENTRO de Proyectos Nuevos: con el filtro de la consulta esa
  // combinación da cero siempre, así que el vacío tiene que explicar dónde
  // buscarlos en vez de dejar creer que no hay.
  const arriendoEnProyectos = categoria === 'proyecto_nuevo'
    && (filtros.estado === 'en_arriendo' || filtros.estado === 'arrendada')

  return (
    <div className="min-h-screen">
      <SEO title="Propiedades en Venta y Arriendo" description="Encuentra casas, departamentos, parcelas y propiedades comerciales en Chile." url="/propiedades" />

      {/* Header */}
      <div className="px-4 lg:px-12 pt-10 lg:pt-14 pb-8 lg:pb-10 border-b border-[#e8edf2]">
        <div className="section-label" style={{ marginBottom: 14 }}>Catálogo</div>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h1 className="font-serif font-light tracking-sdm-tight" style={{ fontSize: 'clamp(28px,5vw,48px)', color: 'var(--navy-dark)', lineHeight: 1.05 }}>
            {pageTitle}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            {/* View toggle */}
            <div className="flex" style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
              <button className="text-sdm-sm" onClick={() => setViewMode('grid')}
                style={{ padding: '8px 14px', background: viewMode === 'grid' ? 'var(--navy-dark)' : '#fff', color: viewMode === 'grid' ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, transition: 'all 0.2s' }}>
                <Grid aria-hidden="true" size={14} /> Lista
              </button>
              <button className="text-sdm-sm" onClick={() => setViewMode('map')}
                style={{ padding: '8px 14px', background: viewMode === 'map' ? 'var(--navy-dark)' : '#fff', color: viewMode === 'map' ? '#fff' : 'var(--muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, transition: 'all 0.2s' }}>
                <Map aria-hidden="true" size={14} /> Mapa
              </button>
            </div>
            <button onClick={() => setPanelOpen(v => !v)}
              className="flex items-center gap-2 text-sdm-sm tracking-sdm-wide"
              style={{ color: panelOpen ? 'var(--green)' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textTransform: 'uppercase' }}>
              <SlidersHorizontal aria-hidden="true" size={14} />
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
              { label: 'Precio',   key: 'precio_max_uf', opts: PRECIOS },
            ].map(f => (
              <label key={f.key} style={{ display: 'block' }}>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>{f.label}</span>
                {/* `.input-line` Y NO EL ESTILO INLINE DE ANTES.
                    El borde iba en `--border`, que da 1.18:1 contra el blanco.
                    Ese token existe para separaciones decorativas; el borde de un
                    CONTROL cae bajo WCAG 1.4.11 y necesita 3:1. `.input-line` usa
                    `--border-input` (4.06:1), que es el token que existe justo
                    para esto, y de paso trae el foco visible y la altura
                    emparejada entre <select> e <input>. */}
                <select className="input-line" value={(filtros as Record<string,unknown>)[f.key] as string || ''}
                  onChange={e => {
                    const nuevos = new URLSearchParams(searchParams)
                    if (e.target.value) nuevos.set(f.key, e.target.value)
                    else nuevos.delete(f.key)
                    if (f.key === 'region') nuevos.delete('comuna')
                    setSearchParams(nuevos, { replace: true })
                  }}
                  style={{ cursor: 'pointer' }}>
                  {f.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            ))}
            {/* Comuna filter */}
            <label style={{ display: 'block' }}>
              <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Comuna</span>
              <select className="input-line"
                value={filtros.comuna || ''}
                onChange={e => {
                  const nuevos = new URLSearchParams(searchParams)
                  if (e.target.value) nuevos.set('comuna', e.target.value)
                  else nuevos.delete('comuna')
                  setSearchParams(nuevos, { replace: true })
                }}
                disabled={!filtros.region}
                style={{ color: filtros.region ? 'var(--ink)' : 'var(--muted)', cursor: filtros.region ? 'pointer' : 'not-allowed' }}
              >
                <option value="">{filtros.region ? 'Todas las comunas' : 'Primero elige región'}</option>
                {filtros.region && getComunas(filtros.region).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            {/* BONO PIE — en las tres rutas.
                No es exclusivo de proyectos nuevos: de las 28 con bono pie, 5 son
                propiedades usadas. Se dibuja solo si la ruta tiene alguna, en vez
                de ofrecer un selector que no puede devolver nada. */}
            {bono.total > 0 && (
              <label style={{ display: 'block' }}>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Bono pie</span>
                <select className="input-line"
                  value={filtros.bono_pie || ''}
                  onChange={e => {
                    const nuevos = new URLSearchParams(searchParams)
                    if (e.target.value) nuevos.set('bono_pie', e.target.value)
                    else nuevos.delete('bono_pie')
                    setSearchParams(nuevos, { replace: true })
                  }}
                  style={{ cursor: 'pointer' }}>
                  <option value="">Todas</option>
                  <option value="si">Con bono pie</option>
                  {/* «o más» va ESCRITO en la opción. Si dijera «14%» a secas y el
                      resultado trajera una del 20%, el visitante creería que el
                      filtro falla. */}
                  {bono.niveles.map(n => <option key={n} value={String(n)}>{n}% o más</option>)}
                </select>
              </label>
            )}

            {/* ENTREGA — solo en Proyectos Nuevos.
                Las 23 propiedades con `etapa_construccion` cargada son todas de
                esa categoría; ninguna usada tiene etapa, y no la tendría: una
                casa de segunda mano no está en obra. En el resto de rutas el
                selector no se dibuja, en vez de aparecer siempre vacío. */}
            {categoria === 'proyecto_nuevo' && (
              <label style={{ display: 'block' }}>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>Entrega</span>
                <select className="input-line"
                  value={filtros.entrega || ''}
                  onChange={e => {
                    const nuevos = new URLSearchParams(searchParams)
                    if (e.target.value) nuevos.set('entrega', e.target.value)
                    else nuevos.delete('entrega')
                    setSearchParams(nuevos, { replace: true })
                  }}
                  style={{ cursor: 'pointer' }}>
                  {ENTREGAS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
            )}
          </div>
        )}

        {/* Active filters */}
        {activeFiltros.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {activeFiltros.map(([key, val]) => (
              // El chip quita un filtro, así que es un <button>. El nombre
              // accesible dice lo que hace, no solo qué filtro es: leído solo,
              // «En Venta» no comunica que pulsarlo lo elimina.
              <button key={key} type="button"
                aria-label={`Quitar el filtro ${etiquetaFiltro(key, val)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full cursor-pointer text-sdm-sm bg-white border border-[var(--border)] hover:bg-[var(--off)] hover:border-[var(--muted)]"
                style={{ fontWeight: 400, color: 'var(--ink)', fontFamily: 'inherit', transition: 'border-color 0.2s, background 0.2s' }}
                onClick={() => { clearFiltro(key as keyof FiltrosPropiedades); if (key === 'comuna') setComunaInput('') }}>
                {etiquetaFiltro(key, val)}
                <X aria-hidden="true" size={11} style={{ color: 'var(--muted)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Count */}
      <div className="px-4 lg:px-12 pt-6 pb-2">
        <p className="text-sdm-sm" style={{ color: 'var(--muted)' }}>
          {loading ? 'Cargando...' : `${displayProps.length} ${displayProps.length === 1 ? 'propiedad encontrada' : 'propiedades encontradas'}`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--navy)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : displayProps.length === 0 ? (
        arriendoEnProyectos ? <ArriendosEnElCatalogo /> :
        soloArriendo ? <SinArriendos /> : (
          <div className="text-center py-24">
            <p className="text-sdm-xl" style={{ color: 'var(--muted)', fontWeight: 300 }}>Ninguna propiedad coincide con estos filtros. Prueba quitando alguno o ampliando la comuna.</p>
          </div>
        )
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
