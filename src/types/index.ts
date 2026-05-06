// ─── Propiedad ───────────────────────────────────────────────────────────────
export type EstadoPropiedad = 'en_venta' | 'en_arriendo' | 'vendida' | 'reservada'
export type TipoPropiedad =
  | 'casa' | 'departamento' | 'oficina' | 'parcela'
  | 'comercial' | 'hotel' | 'terreno' | 'otro'

export interface Propiedad {
  id: string
  titulo: string
  titulo_en?: string
  descripcion: string
  descripcion_en?: string
  tipo: TipoPropiedad
  estado: EstadoPropiedad
  precio_uf?: number
  precio_clp?: number
  precio_usd?: number
  a_consultar: boolean
  dormitorios?: number
  banos?: number
  superficie_total?: number
  superficie_util?: number
  estacionamientos?: number
  region: string
  comuna: string
  direccion?: string
  pais: string
  ciudad?: string
  lat?: number
  lng?: number
  imagenes: string[]
  imagen_principal?: string
  destacada: boolean
  internacional: boolean
  amenidades?: string[]
  agente_id?: string
  youtube_url?: string
  dossier_url?: string
  dossiers?: string[]
  precio_anterior_uf?: number
  baja_precio?: boolean
  ano_construccion?: number
  comision_porcentaje?: number
  bodegas?: number
  estado_conservacion?: string
  bono_pie?: boolean
  bono_pie_porcentaje?: number
  activo?: boolean
  comision_porcentaje?: number
  bodegas?: number
  estado_conservacion?: 'nuevo' | 'seminuevo'
  bono_pie?: boolean
  bono_pie_porcentaje?: number
  activo?: boolean
  created_at: string
  updated_at: string
}

// ─── Blog ────────────────────────────────────────────────────────────────────
export interface BlogPost {
  id: string
  titulo: string
  titulo_en?: string
  slug: string
  resumen: string
  resumen_en?: string
  contenido: string
  contenido_en?: string
  imagen_portada?: string
  autor_id?: string
  autor_nombre: string
  categoria: string
  tags?: string[]
  publicado: boolean
  destacado: boolean
  created_at: string
  updated_at: string
}

// ─── Equipo ──────────────────────────────────────────────────────────────────
export interface MiembroEquipo {
  id: string
  nombre: string
  cargo: string
  cargo_en?: string
  bio: string
  bio_en?: string
  foto?: string
  email?: string
  telefono?: string
  whatsapp?: string
  linkedin?: string
  orden: number
  activo: boolean
}

// ─── Asociados ───────────────────────────────────────────────────────────────
export interface Asociado {
  id: string
  nombre: string
  logo: string
  url: string
  descripcion?: string
  descripcion_en?: string
  orden: number
  activo: boolean
}

// ─── Contacto ────────────────────────────────────────────────────────────────
export interface MensajeContacto {
  id?: string
  nombre: string
  email: string
  telefono?: string
  mensaje: string
  propiedad_interes?: string
  leido?: boolean
  created_at?: string
}

// ─── Servicios ───────────────────────────────────────────────────────────────
export interface Servicio {
  id: string
  slug: string
  titulo: string
  titulo_en?: string
  descripcion_corta: string
  descripcion_corta_en?: string
  descripcion_larga: string
  descripcion_larga_en?: string
  icono?: string
  imagen?: string
  orden: number
  activo: boolean
}

// ─── Filtros ─────────────────────────────────────────────────────────────────
export interface FiltrosPropiedades {
  tipo?: TipoPropiedad | ''
  estado?: EstadoPropiedad | ''
  region?: string
  comuna?: string
  dormitorios_min?: number
  precio_max_uf?: number
  internacional?: boolean
  busqueda?: string
}

// ─── Lang ────────────────────────────────────────────────────────────────────
export type Lang = 'es' | 'en'

// Extended fields added for SDM Capital
declare module './index' {
  interface Propiedad {
    precio_clp?: number
    superficie_util?: number
    youtube_url?: string
    dossier_url?: string
  }
}
