import { MapPin } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY

declare global { interface Window { google: typeof google } }

interface MapPickerProps {
  address: string
  lat?: number
  lng?: number
  onUpdate: (data: { address: string; lat: number; lng: number }) => void
}

export default function MapPicker({ address, lat, lng, onUpdate }: MapPickerProps) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const mapRef    = useRef<HTMLDivElement>(null)
  const mapObj    = useRef<google.maps.Map | null>(null)
  const marker    = useRef<google.maps.Marker | null>(null)
  const autocomplete = useRef<google.maps.places.Autocomplete | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [showMap, setShowMap] = useState(!!(lat && lng))

  // Load Maps + Places script
  useEffect(() => {
    if (window.google?.maps?.places) { setLoaded(true); return }
    const existing = document.getElementById('google-maps-script')
    if (existing) { existing.addEventListener('load', () => setLoaded(true)); return }
    const s = document.createElement('script')
    s.id = 'google-maps-script'
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
    s.async = true
    s.onload = () => setLoaded(true)
    document.head.appendChild(s)
  }, [])

  // Setup Autocomplete on input
  useEffect(() => {
    if (!loaded || !inputRef.current) return
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: ['cl', 'us', 'es', 'uy', 'do', 'ar'] },
      fields: ['formatted_address', 'geometry'],
    })
    autocomplete.current = ac

    ac.addListener('place_changed', () => {
      const place = ac.getPlace()
      if (!place.geometry?.location) return
      const newLat = place.geometry.location.lat()
      const newLng = place.geometry.location.lng()
      const newAddr = place.formatted_address || ''
      onUpdate({ address: newAddr, lat: newLat, lng: newLng })
      setShowMap(true)
      // Update map
      if (mapObj.current) {
        mapObj.current.setCenter({ lat: newLat, lng: newLng })
        mapObj.current.setZoom(16)
        marker.current?.setPosition({ lat: newLat, lng: newLng })
      }
    })
  }, [loaded])

  // Init map when showMap becomes true
  useEffect(() => {
    if (!loaded || !showMap || !mapRef.current || mapObj.current) return
    const center = { lat: lat || -33.4489, lng: lng || -70.6693 }
    const map = new window.google.maps.Map(mapRef.current, {
      zoom: lat ? 16 : 12,
      center,
      mapTypeControl: false,
      streetViewControl: false,
    })
    mapObj.current = map

    const m = new window.google.maps.Marker({
      map,
      position: center,
      draggable: true,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3DAA6E',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    })
    marker.current = m

    // Update coords when pin is dragged
    m.addListener('dragend', () => {
      const pos = m.getPosition()
      if (!pos) return
      onUpdate({
        address: address,
        lat: pos.lat(),
        lng: pos.lng(),
      })
    })

    // Click on map moves pin
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return
      m.setPosition(e.latLng)
      onUpdate({
        address: address,
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      })
    })
  }, [loaded, showMap])

  return (
    <div>
      {/* Autocomplete input */}
      {/* El rótulo «Dirección» ya estaba, pero como <div>: visible y sin
          asociar. El contenedor pasa a <label> y el rótulo a <span>, los dos
          con display: block explícito — ninguno de los dos es flex y el
          marginBottom no se comporta igual en inline. */}
      <label style={{ display: 'block', marginBottom: 12 }}>
        <span className="text-sdm-xs tracking-sdm-wide" style={{ display: 'block', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
          Dirección
        </span>
        <input className="text-sdm-base"
          ref={inputRef}
          defaultValue={address}
          placeholder="Escribe la dirección — aparecerán sugerencias"
          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border)',
            padding: '8px 0', fontFamily: 'inherit',
            color: 'var(--ink)', background: 'transparent', outline: 'none' }}
        />
      </label>

      {/* Map */}
      {showMap ? (
        <div>
          <div ref={mapRef} style={{ width: '100%', height: 280, borderRadius: 2, overflow: 'hidden', background: '#f0f4f7', marginBottom: 8 }} />
          <p className="text-sdm-xs" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
            <MapPin size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-2px' }} /> Arrastra el pin verde o haz clic en el mapa para ajustar la ubicación exacta.
          </p>
        </div>
      ) : (
        <button className="text-sdm-sm"
          type="button"
          onClick={() => setShowMap(true)}
          style={{ color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', padding: 0 }}
        >
          + Mostrar mapa para ajustar pin
        </button>
      )}

      {/* Coords display */}
      {lat && lng && (
        <div className="text-sdm-xs" style={{ color: 'var(--muted)', marginTop: 6 }}>
          Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>
      )}
    </div>
  )
}
