import './tarjeta.css'
import { frontHTML, backHTML, TARJETA_DEFAULTS, type TarjetaDatos } from './markup'

export type Tarjeta = {
  id: string
  nombre: string
  cargo: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
  web: string | null
  orden: number
  created_at: string
}

export type TarjetaDraft = Omit<Partial<Tarjeta>, 'id' | 'created_at'>

export { TARJETA_DEFAULTS }

export const EMPTY_TARJETA: TarjetaDraft = {
  nombre: '',
  cargo: '',
  telefono: '',
  email: '',
  direccion: TARJETA_DEFAULTS.direccion,
  web: TARJETA_DEFAULTS.web,
}

export function TarjetaFrente({ tarjeta }: { tarjeta: TarjetaDatos }) {
  return <div className="sdm-pcard" dangerouslySetInnerHTML={{ __html: frontHTML(tarjeta) }} />
}

export function TarjetaReverso() {
  return <div className="sdm-pcard" dangerouslySetInnerHTML={{ __html: backHTML() }} />
}
