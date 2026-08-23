import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Check, X, Pencil, Trash2, Bell, CalendarCheck, Mic, Hand, Bot } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'
import { useGuardado } from '@/components/admin/acciones'
// ZONA COMPARTIDA, solo lectura: `hoyEnChile()` es la fuente de la fecha local
// desde el bug de la barra de indicadores. No se duplica su lógica acá.
import { hoyEnChile } from '@/lib/indicadores'

// ── Auth ──────────────────────────────────────────────────────────────────────
function useAdminAuth() {
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setAuthed(!!data.session); setChecking(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s))
    return () => subscription.unsubscribe()
  }, [])
  return { authed, checking }
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ChatMsg = { role: string; content: string }

type Mensaje = {
  id: string
  lead_id: string | null
  wa_phone: string | null
  rol: 'cliente' | 'sofia' | 'humano' | string | null
  contenido: string | null
  tipo: string | null
  created_at: string | null
}

type Lead = {
  id: string
  nombre: string | null
  wa_phone: string | null
  contacto: string | null
  intencion: string | null
  tipo: string | null
  dormitorios: string | null
  comuna: string | null
  presupuesto: string | null
  plazo: string | null
  necesita_credito: string | null
  disponibilidad: string | null
  score: 'hot' | 'warm' | 'cold' | null
  handoff: string | null
  ready: boolean | null
  brief: string | null
  status: string | null
  // El ciclo de gestión del EQUIPO, independiente de `status` — ver el bloque
  // «Dos ejes que no se cruzan» más abajo.
  contactado_en: string | null
  cerrado_en: string | null
  resultado: string | null
  conversation: ChatMsg[] | null
  created_at: string | null
  last_message_at: string | null
  modo: 'auto' | 'manual' | null
}

type Visita = {
  id: string
  lead_id: string | null
  estado: string
  asignado_a: string | null
  horario_propuesto: string | null
  horario_confirmado: string | null
  comuna: string | null
  created_at: string | null
}

type VisitaConLead = Visita & { lead: Lead | null }

// CADA CAMPO DECLARA SU VENTANA EN EL NOMBRE, o no tiene ninguna a propósito.
// Antes las tarjetas mezclaban tres universos sin decirlo —el mes, las últimas
// 168 h y el histórico completo— y los números no se podían comparar entre sí.
type MetricsData = {
  // Estado actual, sin ventana. Preguntarle «¿de qué mes?» a esto no significa
  // nada: o alguien está esperando ahora, o no.
  sinContactar: number
  visitasPorCoordinar: number
  visitasConfirmadas: number

  // Ventana: día / 7 días naturales / mes calendario, los tres en hora de Chile.
  leadsHoy: number
  leadsSemana: number
  leadsMes: number
  hot: number
  warm: number
  cold: number
  sinCalificar: number
  contactadosMes: number
  cerradosMes: number
  // Los cuatro valores del CHECK más los cerrados sin resultado, del mes.
  resultadosMes: Record<string, number>
  cerradosSinResultadoMes: number

  topComunas: { comuna: string; count: number }[]
  // Cuántas comunas distintas hubo en el mes. `topComunas` solo trae las 5 más
  // buscadas, y sin este total la lista no puede decir de cuántas salieron.
  comunasTotal: number

  // La diferencia entre «no hay» y «no se pudo saber». Con esto en `true` las
  // tarjetas NO pintan sus números: un cero de fallo se lee igual que un cero
  // real, y este panel ya tuvo un botón que parecía muerto por callarse.
  fallo: boolean
}

const METRICAS_CERO: MetricsData = {
  sinContactar: 0, visitasPorCoordinar: 0, visitasConfirmadas: 0,
  leadsHoy: 0, leadsSemana: 0, leadsMes: 0,
  hot: 0, warm: 0, cold: 0, sinCalificar: 0,
  contactadosMes: 0, cerradosMes: 0, resultadosMes: {}, cerradosSinResultadoMes: 0,
  topComunas: [], comunasTotal: 0,
  fallo: false,
}

type ScoreFilter = 'todos' | 'hot' | 'warm' | 'cold'
type NotifValue = 'todos' | 'solo_hot'

type EditLeadDraft = {
  nombre: string
  contacto: string
  score: string
  presupuesto: string
  plazo: string
}

const REFRESH_MS = 25000
const MENSAJES_REFRESH_MS = 18000

// Worker que recibe los mensajes de WhatsApp y expone /send-manual.
const WORKER_URL = (import.meta.env.VITE_CAPTACION_WORKER_URL as string) || 'https://sdm-captacion.vurrutia.workers.dev'
const MAX_MENSAJE_LEN = 4096

// ── Visual helpers ────────────────────────────────────────────────────────────
// La paleta paralela de este panel muere acá: el mapa pasa a apuntar a los
// tokens oficiales de `globals.css`.
//
// SE PUEDE USAR `var()` PORQUE NADIE CONCATENA EL ALFA. Se revisó a los
// consumidores antes de tocarlo: es la trampa que tenía `ESTADO_COLORS`, donde
// un `COLORS.red + '22'` habría producido `var(--error)22` —CSS inválido que el
// navegador descarta en silencio, dejando el elemento sin fondo y sin error—.
// Acá no hay ni una concatenación: los seis valores se usan enteros, dentro de
// objetos `style` o interpolados en un `1px solid ${...}`, y en los dos sitios
// `var()` resuelve igual que un hex.
//
// La ÚNICA excepción eran los dos iconos de `lucide-react` que recibían
// `color={COLORS.muted}`: esa prop termina en el atributo `stroke` del SVG, y
// ahí `var()` es terreno resbaloso. Se cambiaron a `style={{ color }}`, que es
// CSS de verdad; lucide ya dibuja con `currentColor` por defecto.
//
// DOS VERDES, Y NO SON INTERCAMBIABLES. Es la misma regla que ya sigue
// `.btn-green` en `globals.css`:
//
//   green      color de marca. SOLO decorativo — bordes de acento, filetes.
//              Nada de texto encima ni debajo. Blanco sobre `--green` da
//              2.93:1, que no llega ni al umbral de texto grande.
//   greenDark  todo lo que tiene que cumplir contraste: fondos de botón con
//              texto blanco, texto verde sobre claro. 4.85:1 sobre blanco.
//
// Si agregas un uso nuevo, la pregunta es «¿hay texto en este par?». Si la
// respuesta es sí, va `greenDark`.
const COLORS = {
  navy: 'var(--navy-dark)',
  // Azul intermedio. Existe para el texto secundario de los banners de modo,
  // donde `--muted` se queda corto contra los fondos teñidos (4.43 y 4.37) pero
  // `--navy-dark` iguala al titular y se come la jerarquía. Acá da 9.89 y 9.76.
  navyMedio: 'var(--navy)',
  muted: 'var(--muted)',
  border: 'var(--border)',
  bg: 'var(--off)',
  green: 'var(--green)',
  greenDark: 'var(--green-dark)',
  red: 'var(--error)',
}

// Los seis literales de esta escala pasaron a `globals.css` como familia
// `--lead-*`, con su ratio documentado al lado de cada uno. Warm daba 3.06:1 y
// Hot 4.44:1; ahora los tres cumplen. El porqué de mover Hot —que fallaba por
// 0.06— está en el comentario del bloque: al oscurecer Warm para que se lea,
// colapsa contra el rojo bajo protanopia, y había que mover los dos.
const SCORE_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  hot:  { bg: 'var(--lead-hot-fondo)',  fg: 'var(--lead-hot)',  label: 'Hot' },
  warm: { bg: 'var(--lead-warm-fondo)', fg: 'var(--lead-warm)', label: 'Warm' },
  cold: { bg: 'var(--lead-cold-fondo)', fg: 'var(--lead-cold)', label: 'Cold' },
}
// «Sin calificar» no es una insignia de color propio como Hot/Warm/Cold: es la
// ausencia de calificación, así que va con los neutros del sistema. Sobre el
// `#eef1f4` que tenía antes, `--muted` daba 4.44:1 y se quedaba corto para un
// texto de 11 px; sobre `--off` da 4.81:1.
const SCORE_NULL = { bg: COLORS.bg, fg: COLORS.muted, label: 'Sin calificar' }

function ScoreBadge({ score }: { score: string | null }) {
  const s = (score && SCORE_STYLE[score]) || SCORE_NULL
  return (
    <span className="text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 700, textTransform: 'uppercase', color: s.fg, background: s.bg,
      borderRadius: 12, padding: '3px 10px', flexShrink: 0 }}>
      {s.label}
    </span>
  )
}

function fmt(v: string | null | undefined, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback
  return String(v)
}

// ── Dos ejes que no se cruzan ────────────────────────────────────────────────
//
// Antes había UN solo eje: `leads.status`, que el panel mostraba cruzado con
// `visitas.estado` porque los dos peleaban por la misma etiqueta. De ahí salían
// `estadoLead()`, `STATUS_DE_VISITA` y la marca `contradice`, todos borrados.
//
// Ahora son tres cosas independientes, y cada una se muestra donde le toca:
//
//   `leads.status`   LO ESCRIBE EL WORKER DE SOFÍA, Y SOLO ÉL. El panel dejó
//                    de ser el segundo escritor: escribía 'visita_confirmada',
//                    un valor que el Worker no conoce, y eso vació 'derivado'
//                    de la base y abrió un agujero en el filtro del seguimiento
//                    de leads fríos. Acá solo se LEE, en el detalle.
//                    Antes de volver a escribirlo: `index.js`, `procesarLote`.
//
//   `contactado_en`  el ciclo del EQUIPO, y lo único que decide la última
//   `cerrado_en`     columna de la lista. `seguimiento_candidatos` filtra por
//   `resultado`      estas dos fechas, así que marcar el contacto es lo que
//                    evita que Sofía le escriba a alguien ya atendido.
//
//   `visitas.estado` el ciclo de la VISITA. Dato aparte, con su propio rótulo
//                    en el detalle. No se toca en este panel más que por los
//                    botones de la sección de visitas.
//
// Al no competir por la misma etiqueta, ya no hay nada que contradecir: un lead
// puede estar «Cerrado» y tener una visita «Realizada» sin que eso sea un
// conflicto, porque hablan de cosas distintas.

const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  calificando: 'Calificando',
  derivado: 'Derivado',
  visita_pendiente: 'Visita pendiente',
  visita_confirmada: 'Visita confirmada',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
}

// «Por coordinar», no «Pendiente». RENOMBRE SOLO DE INTERFAZ: el valor en la
// base sigue siendo 'pendiente' y lo escribe el Worker. El rótulo viejo decía
// que había una visita agendada esperando; lo que significa de verdad es que
// Sofía ofreció coordinarla y nadie la agendó todavía.
const VISITA_LABEL: Record<string, string> = {
  pendiente: 'Por coordinar',
  confirmada: 'Visita confirmada',
  cancelada: 'Visita cancelada',
  realizada: 'Visita realizada',
}

// Los cuatro del CHECK de `leads.resultado`. Si se agrega uno en la base, va
// también acá: `cicloLead` cae al valor crudo si no lo encuentra.
const RESULTADO_LABEL: Record<string, string> = {
  vendido_arrendado: 'Vendido/arrendado',
  no_califico: 'No calificó',
  no_respondio: 'No respondió',
  compro_por_fuera: 'Compró por fuera',
}

const RESULTADOS = Object.keys(RESULTADO_LABEL)

type UltimaVisita = { estado: string; created_at: string | null }

// ── El aviso de cancelar, según lo que se esté cancelando ────────────────────
//
// SE RAMIFICA POR EL ESTADO DE LA VISITA, no por un parámetro que haya que
// acordarse de pasar desde cada botón: la visita ya sabe cuál es su estado, así
// que los dos textos no se pueden desincronizar.
//
// Cancelar una CONFIRMADA no es lo mismo que cancelar una pendiente. Una
// pendiente es una solicitud que todavía no se le prometió a nadie. Una
// confirmada tiene hora acordada y un asesor asignado, y el cliente la está
// esperando. Como el sistema no avisa a nadie —el Worker nunca lee
// `visitas.estado`—, ese trabajo queda entero en manos de quien aprieta el
// botón, y el aviso da el nombre y la hora para no tener que ir a buscarlos
// después de haber cancelado.
//
// Función aparte y pura para poder verificar los dos textos sin tocar la base.
function avisoCancelar(v: VisitaConLead): string {
  const quien = v.lead?.nombre?.trim() || v.lead?.wa_phone?.trim() || 'este lead'
  const cuando = (v.horario_confirmado || v.horario_propuesto || '').trim()
  const conQuien = (v.asignado_a || '').trim()

  if (v.estado !== 'confirmada') {
    return `¿Cancelar la visita de ${quien}?\n\n` +
      'Queda marcada como cancelada y desaparece de esta lista. El registro no se borra.\n\n' +
      'Al cliente no le llega ningún aviso: si ya habías coordinado con él, avísale tú por WhatsApp.'
  }
  return `¿Cancelar la visita CONFIRMADA de ${quien}?\n\n` +
    (cuando ? `Estaba agendada para «${cuando}»${conQuien ? ` con ${conQuien}` : ''}.\n\n` : '') +
    'El cliente la está esperando y NO recibe ningún aviso automático: tienes que ' +
    `avisarle tú por WhatsApp${conQuien ? `, y avisarle también a ${conQuien}` : ''}.\n\n` +
    'Queda marcada como cancelada y sale de esta sección. El registro no se borra.'
}

// El ciclo del equipo, en una línea. Es lo único que muestra la última columna
// de la lista. Función pura para poder verificar los cuatro casos sin base.
//
// El orden importa: `cerrado_en` manda sobre `contactado_en`, porque cerrar
// escribe las dos fechas y un lead cerrado no debe leerse como «Contactado».
function cicloLead(lead: Lead): string {
  if (lead.cerrado_en) {
    // `resultado` es nullable a propósito: el cierre rápido no lo pide.
    const r = lead.resultado ? (RESULTADO_LABEL[lead.resultado] || lead.resultado) : null
    return r ? `Cerrado · ${r}` : 'Cerrado'
  }
  if (lead.contactado_en) return 'Contactado'
  return 'Sin contactar'
}

// Fecha corta en horario de Chile. `toLocaleDateString` con `timeZone` explícito
// y no `toISOString().slice(0,10)`: ese devuelve el día en UTC, que después de
// las 21:00 en Chile ya es el día siguiente.
function fechaCorta(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Los límites de las ventanas de métricas, SIEMPRE en hora de Chile ─────────
//
// Lo que había era `new Date(y, m, 1).toISOString()`. NO es el bug del
// `toISOString().slice(0,10)` de los indicadores —no hay truncado, y sobre una
// máquina chilena el límite salía bien—, pero la ventana era la del NAVEGADOR:
// medido, el mismo código da 2026-08-01T04:00:00Z en Santiago, 2026-07-31T22:00Z
// en Madrid y 2026-08-01T00:00:00Z en UTC. `resumen_diario` calcula su rango con
// `AT TIME ZONE 'America/Santiago'` en el servidor, así que el panel y el correo
// de la mañana se separaban en cuanto alguien abría el panel de viaje.
//
// `hoyEnChile()` se reusa de `src/lib/indicadores.ts`, que nació justo de aquel
// bug. Lo que falta acá es pasar de una fecha a un INSTANTE, y eso es lo de
// abajo.

// Instante en que empieza, en Chile, el día `fecha` ('YYYY-MM-DD').
//
// El offset se mide sobre ese mismo día en vez de escribirse a mano: Chile es
// UTC-4 en invierno y UTC-3 en verano, así que un `-04:00` fijo se equivocaría
// media parte del año. Verificado: 2026-08-23 → 04:00Z, 2026-01-15 → 03:00Z.
function inicioDiaChile(fecha: string): string {
  const utc = new Date(`${fecha}T00:00:00Z`).getTime()
  // 'sv-SE' formatea como 'YYYY-MM-DD HH:mm:ss', que es ISO sin la T; releerlo
  // como si fuera UTC deja la diferencia con `utc` igual al offset de Chile.
  const enChile = new Date(new Date(utc).toLocaleString('sv-SE', { timeZone: 'America/Santiago' }) + 'Z').getTime()
  return new Date(utc + (utc - enChile)).toISOString()
}

// `toISOString().slice(0,10)` acá SÍ es seguro, y es la excepción: la fecha se
// construye a las 00:00Z y se mueve en días UTC enteros, así que nunca sale del
// día que dice. El peligro del `slice` es aplicarlo a un instante cualquiera.
function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

// EL ESTILO DEL RÓTULO VA EN UN <span>, NUNCA EN EL <label>.
//
// Los `<label>` de este panel ahora ENVUELVEN a su control —es lo que les da
// nombre accesible sin tener que inventar un `id` por campo—, y en cuanto
// envuelven, `textTransform` y `letterSpacing` se heredan hacia adentro. Con
// esas dos propiedades puestas en el `<label>`, todo lo que se teclea sale en
// mayúsculas y espaciado: el `value` del estado queda bien y la pantalla
// miente. Es CSS válido, así que `tsc` no lo delata y el build pasa en verde.
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600 }}>{children}</span>
  )
}

// Sin `outline: none`. El anillo global de `globals.css`
// —`*:focus-visible { outline: 2px solid var(--green-dark) }`— da 4.85:1 sobre
// blanco y cumple de sobra el 3:1 que pide 1.4.11; apagarlo dejaba a estos
// campos como los únicos del admin sin ninguna señal de foco.
const CAMPO: React.CSSProperties = {
  fontFamily: 'inherit', color: COLORS.navy, background: '#fff',
  border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '9px 12px',
}

// El valor ENVUELVE, no se recorta.
//
// `DRow` pinta teléfono, presupuesto, plazo, disponibilidad y comuna: datos,
// no títulos. Con `textOverflow: ellipsis` un teléfono quedaba en «+56 9 3747…»
// —inservible, y sin ninguna señal de que faltaba algo, porque los puntos
// suspensivos se leen como parte del dato tanto como cualquier otra cosa—.
//
// La columna mide ~132 px en el detalle de un lead y ~150 px en una tarjeta de
// visita; un teléfono chileno ocupa ~114 px y cualquier presupuesto escrito por
// el cliente («entre 3.000 y 4.500 UF») se pasa. Envolver cuesta una línea de
// alto en un panel desplegado que va sobrado de espacio vertical.
function DRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600 }}>{label}</span>
      <span className="text-sdm-base" style={{ color: COLORS.navy, overflowWrap: 'anywhere' }}>{value}</span>
    </div>
  )
}

function timeAgo(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'recién'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  const diffD = Math.round(diffH / 24)
  return `hace ${diffD} d`
}

function formatHora(iso: string | null | undefined) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Interruptor de notificaciones ─────────────────────────────────────────────
function NotifToggle({ value, onChange, saving }: {
  value: NotifValue | null
  onChange: (v: NotifValue) => void
  saving: boolean
}) {
  if (value === null) return null
  const opts: { key: NotifValue; label: string }[] = [
    { key: 'todos',    label: 'Avisar de todos los leads' },
    { key: 'solo_hot', label: 'Solo los calientes (hot)' },
  ]
  return (
    <div style={{
      background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)',
      padding: '12px 18px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12,
    }}>
      <Bell size={15} style={{ color: COLORS.muted }} />
      <span className="text-sdm-sm" style={{ color: COLORS.muted, fontWeight: 600 }}>Notificaciones por correo:</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {opts.map(opt => (
          <button className="text-sdm-sm" key={opt.key} type="button" onClick={() => onChange(opt.key)} disabled={saving}
            style={{ padding: '7px 14px', fontWeight: 600, borderRadius: 14,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              border: `1px solid ${value === opt.key ? COLORS.navy : COLORS.border}`,
              background: value === opt.key ? COLORS.navy : '#fff',
              color: value === opt.key ? '#fff' : COLORS.muted,
              transition: 'all 0.15s', opacity: saving ? 0.7 : 1 }}>
            {opt.label}
          </button>
        ))}
      </div>
      {saving && <span className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic' }}>Guardando…</span>}
    </div>
  )
}

// ── Modal editar lead ─────────────────────────────────────────────────────────
function EditLeadModal({ lead, onSave, onCancel, saving, error }: {
  lead: Lead
  onSave: (draft: EditLeadDraft) => void
  onCancel: () => void
  saving: boolean
  error: string | null
}) {
  const [draft, setDraft] = useState<EditLeadDraft>({
    nombre: lead.nombre || '',
    contacto: lead.contacto || '',
    score: lead.score || '',
    presupuesto: lead.presupuesto || '',
    plazo: lead.plazo || '',
  })
  const upd = (k: keyof EditLeadDraft, v: string) => setDraft(prev => ({ ...prev, [k]: v }))

  const textFields: { key: keyof EditLeadDraft; label: string }[] = [
    { key: 'nombre',      label: 'Nombre' },
    { key: 'contacto',    label: 'Contacto' },
    { key: 'presupuesto', label: 'Presupuesto' },
    { key: 'plazo',       label: 'Plazo' },
  ]

  return (
    <div style={{
      // Espejo de `--navy-dark` (#0F2535) al 55 %. Queda como literal porque
      // `rgba()` no admite un `var()` dentro: si el token cambia, esta línea
      // hay que moverla a mano.
      position: 'fixed', inset: 0, background: 'rgba(15,37,53,0.55)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 8, padding: 28, width: '100%', maxWidth: 480,
        display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div className="text-sdm-lg" style={{ fontWeight: 700, color: COLORS.navy }}>Editar lead</div>

        {textFields.map(f => (
          <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Rotulo>{f.label}</Rotulo>
            <input className="text-sdm-base"
              type="text"
              value={draft[f.key]}
              onChange={e => upd(f.key, e.target.value)}
              style={CAMPO}
            />
          </label>
        ))}

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Rotulo>Score</Rotulo>
          <select className="text-sdm-base" value={draft.score} onChange={e => upd('score', e.target.value)}
            style={CAMPO}>
            <option value="">Sin calificar</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </label>

        {/* AQUÍ HABÍA UN <select> DE ESTADO. NO SE VUELVE A PONER.
            Escribía `leads.status`, que es campo del Worker de Sofía, y podía
            dejarlo en cualquiera de los siete valores del CHECK o en NULL. El
            ciclo del equipo se marca con los botones de cada fila, que escriben
            `contactado_en` / `cerrado_en` / `resultado`. */}

        {error && (
          <div className="text-sdm-sm" style={{ color: COLORS.red, background: '#fde2e1', borderRadius: 4, padding: '10px 14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="text-sdm-sm" type="button" onClick={() => onSave(draft)} disabled={saving}
            style={{ flex: 1, background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, padding: '11px 18px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button className="text-sdm-sm" type="button" onClick={onCancel} disabled={saving}
            style={{ background: '#fff', color: COLORS.muted, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '11px 18px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Chat de la conversación ───────────────────────────────────────────────────
function ChatLog({ conversation }: { conversation: ChatMsg[] | null }) {
  if (!conversation || !conversation.length) {
    return <div className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic', padding: '8px 0' }}>Sin conversación registrada.</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', padding: 14, background: COLORS.bg, borderRadius: 'var(--sdm-radio-contenedor)' }}>
      {conversation.map((m, i) => {
        const isAssistant = m.role === 'assistant'
        return (
          <div key={i} style={{ display: 'flex', justifyContent: isAssistant ? 'flex-end' : 'flex-start' }}>
            <div className="text-sdm-sm" style={{ maxWidth: '78%', padding: '9px 13px', borderRadius: 12, lineHeight: 1.55,
              background: isAssistant ? COLORS.navy : '#fff',
              color: isAssistant ? '#fff' : COLORS.navy,
              border: isAssistant ? 'none' : `1px solid ${COLORS.border}`,
              whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Pestañas del detalle de un lead ──────────────────────────────────────────
type DetailTab = 'detalles' | 'conversacion'

function DetailTabs({ active, onChange }: { active: DetailTab; onChange: (t: DetailTab) => void }) {
  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'detalles', label: 'Detalles' },
    { key: 'conversacion', label: 'Conversación' },
  ]
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${COLORS.border}` }}>
      {tabs.map(t => (
        <button className="text-sdm-sm" key={t.key} type="button" onClick={() => onChange(t.key)}
          style={{ padding: '8px 16px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            border: 'none', borderBottom: `2px solid ${active === t.key ? COLORS.navy : 'transparent'}`,
            background: 'none', color: active === t.key ? COLORS.navy : COLORS.muted, marginBottom: -1 }}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Hilo de conversación (tabla "mensajes") ──────────────────────────────────
const ROL_STYLE: Record<string, { align: 'flex-start' | 'flex-end'; bg: string; fg: string; border: string; label: string | null }> = {
  cliente: { align: 'flex-start', bg: '#fff',        fg: COLORS.navy, border: `1px solid ${COLORS.border}`, label: null },
  sofia:   { align: 'flex-end',   bg: COLORS.navy,   fg: '#fff',      border: 'none',                       label: null },
  humano:  { align: 'flex-end',   bg: COLORS.greenDark, fg: '#fff',   border: 'none',                       label: 'Equipo' },
}
// Mismo caso que `SCORE_NULL`: un `rol` que no es cliente/sofia/humano no tiene
// color propio, va con los neutros. `--muted` sobre `#eef1f4` daba 4.44:1;
// sobre `--off`, 4.81:1.
const ROL_FALLBACK = { align: 'flex-start' as const, bg: COLORS.bg, fg: COLORS.muted, border: 'none', label: null }

function MensajeBubble({ m }: { m: Mensaje }) {
  const style = (m.rol && ROL_STYLE[m.rol]) || ROL_FALLBACK
  return (
    <div style={{ display: 'flex', justifyContent: style.align }}>
      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: style.align }}>
        {style.label && (
          <span className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 700, textTransform: 'uppercase', color: COLORS.greenDark }}>{style.label}</span>
        )}
        <div className="text-sdm-sm" style={{ padding: '9px 13px', borderRadius: 12, lineHeight: 1.55,
          background: style.bg, color: style.fg, border: style.border,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {m.tipo === 'voz' && (
            <div className="text-sdm-xs" style={{ fontWeight: 700, marginBottom: 4, opacity: 0.8 }}>
              <Mic aria-hidden="true" size={13} className="inline-block align-[-2px] mr-1" />Nota de voz
            </div>
          )}
          {m.contenido || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>(sin contenido)</span>}
        </div>
        <span className="text-sdm-xs" style={{ color: COLORS.muted }}>{formatHora(m.created_at)}</span>
      </div>
    </div>
  )
}

function ConversacionThread({ leadId, waPhone, active, refreshSignal }: { leadId: string; waPhone: string | null; active: boolean; refreshSignal?: number }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)

  const load = useCallback(async () => {
    try {
      let query = supabase.from('mensajes').select('*').order('created_at', { ascending: true })
      if (waPhone) {
        query = query.or(`lead_id.eq.${leadId},wa_phone.eq.${waPhone}`)
      } else {
        query = query.eq('lead_id', leadId)
      }
      const { data, error: err } = await query
      if (err) throw err
      setMensajes((data as Mensaje[]) || [])
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la conversación.')
    } finally {
      setLoading(false)
    }
  }, [leadId, waPhone])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  useEffect(() => {
    if (!active) return
    const id = setInterval(load, MENSAJES_REFRESH_MS)
    return () => clearInterval(id)
  }, [active, load])

  // Recarga inmediata cuando se envía un mensaje manual desde el panel.
  useEffect(() => {
    if (refreshSignal) load()
  }, [refreshSignal, load])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isFirstLoad = prevCountRef.current === 0 && mensajes.length > 0
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isFirstLoad || isNearBottom) el.scrollTop = el.scrollHeight
    prevCountRef.current = mensajes.length
  }, [mensajes])

  if (loading) {
    return <div className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>Cargando conversación…</div>
  }

  if (error) {
    return (
      <div className="text-sdm-sm" style={{ color: COLORS.red, background: '#fde2e1', borderRadius: 'var(--sdm-radio-contenedor)', padding: '12px 14px' }}>
        No se pudo cargar la conversación: {error}
      </div>
    )
  }

  if (!mensajes.length) {
    return <div className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>Sin mensajes todavía.</div>
  }

  return (
    <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto', padding: 14, background: COLORS.bg, borderRadius: 'var(--sdm-radio-contenedor)' }}>
      {mensajes.map(m => <MensajeBubble key={m.id} m={m} />)}
    </div>
  )
}

// ── Control manual: banner de estado + alternar Sofía / humano ──────────────
function ModoToggleBanner({ lead, onModoChange }: {
  lead: Lead
  onModoChange: () => void
}) {
  const isManual = lead.modo === 'manual'
  const [togglingModo, setTogglingModo] = useState(false)

  const toggleModo = async () => {
    setTogglingModo(true)
    const next = isManual ? 'auto' : 'manual'
    const { error } = await supabase.from('leads').update({ modo: next }).eq('id', lead.id)
    setTogglingModo(false)
    if (avisarError('No se pudo cambiar el modo de atención', error)) return
    onModoChange()
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      background: isManual ? '#fdedd6' : '#e3f5ea',
      border: `2px solid ${isManual ? '#f0c389' : '#bfe6cf'}`,
      borderRadius: 8, padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Iconos y no emoji: el glifo lo ponía la fuente del sistema, así que
            cambiaba de forma y color según el equipo. `aria-hidden` porque el
            texto de al lado ya dice el estado. */}
        <span style={{ lineHeight: 1, display: 'inline-flex' }}>
          {isManual
            ? <Hand aria-hidden="true" size={22} style={{ color: 'var(--lead-warm)' }} />
            : <Bot aria-hidden="true" size={22} style={{ color: 'var(--navy)' }} />}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* EL COLOR DEL BANNER LO LLEVA EL FONDO, NO EL TEXTO.
              El titular iba en el color del modo —verde en automático, ámbar
              en manual— y ninguno de los dos cumplía sobre su propio fondo:
              2.58:1 el verde y 3.06:1 el ámbar, con umbral de 4.5 porque son
              15 px en negrita. Pasar el verde a `--green-dark` solo lo subía a
              4.28. El ámbar no tiene variante oscura, así que no había un
              arreglo simétrico por el lado del color de texto.
              En `--navy-dark` dan 13.86:1 y 13.67:1. El fondo y el emoji
              siguen distinguiendo los dos modos de un vistazo, que es lo que
              de verdad hacía el trabajo.
              El secundario iba en `--muted`, que sobre blanco da 5.03 pero
              sobre estos fondos cae a 4.43 y 4.37 — también corto, y no estaba
              en ninguna auditoría. En `--navy` da 9.89 y 9.76, y sigue
              leyéndose como secundario contra el titular por peso y tamaño. */}
          <span className="text-sdm-base" style={{ fontWeight: 700, color: COLORS.navy }}>
            {isManual ? 'Control manual — Sofía en pausa' : 'Sofía está respondiendo'}
          </span>
          <span className="text-sdm-sm" style={{ color: COLORS.navyMedio }}>
            {isManual
              ? 'Sofía no responderá hasta que devuelvas el control. Escribe abajo para hablar con el cliente.'
              : 'Toma el control para escribirle directamente al cliente y pausar a Sofía.'}
          </span>
        </div>
      </div>
      <button className="text-sdm-sm tracking-sdm-normal" type="button" onClick={toggleModo} disabled={togglingModo}
        style={{ padding: '12px 22px', fontWeight: 700, borderRadius: 'var(--sdm-radio-control)', fontFamily: 'inherit', border: 'none', color: '#fff', whiteSpace: 'nowrap',
          cursor: togglingModo ? 'default' : 'pointer',
          // `--lead-warm` como FONDO con texto blanco encima: 5.18:1. Acá el
          // ámbar significa precaución —vas a pausar a Sofía—, no prioridad
          // media de un lead. Se reutiliza el token en vez de duplicar el
          // valor bajo otro nombre; antes era `#c8740a` y daba 3.52:1.
          background: isManual ? COLORS.greenDark : 'var(--lead-warm)',
          opacity: togglingModo ? 0.6 : 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
        {togglingModo
          ? 'Guardando…'
          : isManual
          ? <><Bot aria-hidden="true" size={14} className="inline-block align-[-3px] mr-1.5" />Devolver a Sofía</>
          : <><Hand aria-hidden="true" size={14} className="inline-block align-[-3px] mr-1.5" />Tomar control</>}
      </button>
    </div>
  )
}

// ── Control manual: cuadro para escribirle al cliente (estilo WhatsApp) ─────
function ManualSendBox({ lead, onSent }: {
  lead: Lead
  onSent: () => void
}) {
  const [mensaje, setMensaje] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  const enviar = async () => {
    const texto = mensaje.trim()
    if (!texto) return
    if (texto.length > MAX_MENSAJE_LEN) {
      setSendError(`El mensaje supera el máximo de ${MAX_MENSAJE_LEN} caracteres.`)
      return
    }
    setSending(true)
    setSendError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')

      const res = await fetch(`${WORKER_URL}/send-manual`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ lead_id: lead.id, mensaje: texto }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || 'No se pudo enviar el mensaje.')

      setMensaje('')
      onSent()
    } catch (e) {
      setSendError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: `1px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.green}`, borderRadius: 'var(--sdm-radio-contenedor)', padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {/* Este era el único de los cinco campos sin rótulo visible, y el
            diseño sí admite uno: la caja ya tenía una línea de ayuda debajo,
            así que sumar el rótulo arriba no rompe nada y evita el
            `aria-label`. El `placeholder` no servía de nombre: desaparece en
            cuanto se escribe la primera letra, justo cuando alguien que navega
            con lector podría querer confirmar en qué campo está. */}
        <label style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Rotulo>Mensaje para el cliente</Rotulo>
          <textarea className="text-sdm-sm"
            value={mensaje}
            onChange={e => setMensaje(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
            placeholder="Escribe el mensaje para el cliente…"
            maxLength={MAX_MENSAJE_LEN}
            rows={2}
            style={{ ...CAMPO, width: '100%', background: COLORS.bg, resize: 'vertical' }}
          />
        </label>
        <button className="text-sdm-sm" type="button" onClick={enviar} disabled={sending || !mensaje.trim()}
          style={{ padding: '12px 24px', fontWeight: 700, borderRadius: 4, fontFamily: 'inherit',
            border: 'none', color: '#fff', background: COLORS.navy, flexShrink: 0,
            cursor: (sending || !mensaje.trim()) ? 'default' : 'pointer',
            opacity: (sending || !mensaje.trim()) ? 0.5 : 1 }}>
          {sending ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
      <span className="text-sdm-xs" style={{ color: COLORS.muted }}>{mensaje.length} / {MAX_MENSAJE_LEN} · Enter envía, Shift+Enter agrega un salto de línea</span>
      {sendError && (
        <div className="text-sdm-sm" style={{ color: COLORS.red, background: '#fde2e1', borderRadius: 4, padding: '8px 12px' }}>
          {sendError}
        </div>
      )}
    </div>
  )
}

// ── Sección 0: Métricas (resumen) ────────────────────────────────────────────
const VISITA_ESTADO_STYLE = {
  pendientes: 'var(--lead-warm)',
  confirmadas: COLORS.greenDark,
  realizadas: 'var(--lead-cold)',
}

// UNA LÍNEA, NO UNA TARJETA VACÍA.
//
// Los tres estados vacíos usaban `padding: '48px 0'` con fondo blanco y borde:
// una caja de altura casi completa para decir «no hay nada». Entre las dos
// secciones de visitas —que suelen estar las dos vacías— se comían casi una
// pantalla antes de llegar a los leads, que es lo único accionable.
function SeccionVacia({ children }: { children: React.ReactNode }) {
  return <div className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic' }}>{children}</div>
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="text-sdm-2xl" style={{ fontWeight: 700, color: color || COLORS.navy, lineHeight: 1 }}>{value}</span>
      <span className="text-sdm-sm" style={{ color: COLORS.muted }}>{label}</span>
    </div>
  )
}

// `fallo` se resuelve ACÁ y no en cada tarjeta: es una sola condición en un
// solo sitio, y así ninguna tarjeta nueva puede olvidarse de contemplarlo y
// pintar un cero inventado.
function MetricCard({ title, fallo, children }: { title: string; fallo?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600 }}>{title}</div>
      {fallo
        ? <span className="text-sdm-sm" style={{ color: COLORS.red, fontStyle: 'italic' }}>No se pudo cargar</span>
        : children}
    </div>
  )
}

// LAS DOS TARJETAS SIN VENTANA NO LLEVAN RÓTULO DE TIEMPO, y las tres que sí
// la tienen la llevan escrita. Antes ninguna la declaraba y convivían el mes,
// las últimas 168 h y el histórico completo en la misma cuadrícula.
//
// Se eliminó «Conversión lead → visita»: dividía `visitas.estado='confirmada'`
// EN ESTE INSTANTE por los leads del histórico completo, así que una visita que
// avanzaba a realizada salía del numerador y la tarjeta marcaba 0,0 % para
// siempre. Con 14 leads en dos meses ningún porcentaje significaba nada. Vuelve
// cuando haya volumen y con el numerador acumulado, no como foto.
function MetricsSection({ metrics, loading }: { metrics: MetricsData | null; loading: boolean }) {
  const m: MetricsData = metrics || METRICAS_CERO

  return (
    <section>
      <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Métricas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* PRIMERA porque es la única que pide acción hoy. Sin ventana: o hay
            alguien esperando ahora, o no. Mismo predicado que
            `resumen_diario.sin_contactar`, el número del WhatsApp de la mañana. */}
        <MetricCard title="Sin contactar" fallo={m.fallo}>
          {m.sinContactar === 0 ? (
            // Un cero acá es buena noticia, no un dato que falta, y tiene que
            // leerse distinto del fallo de arriba —que es rojo e itálico— para
            // que no se confundan nunca.
            <span className="text-sdm-lg" style={{ fontWeight: 700, color: 'var(--green-dark)' }}>Nadie esperando</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <Stat label="Leads por contactar" value={m.sinContactar} />
            </div>
          )}
        </MetricCard>

        <MetricCard title="Leads nuevos" fallo={m.fallo}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Hoy" value={m.leadsHoy} />
            <Stat label="7 días" value={m.leadsSemana} />
            <Stat label="Este mes" value={m.leadsMes} />
          </div>
        </MetricCard>

        <MetricCard title="Calificación (este mes)" fallo={m.fallo}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Hot" value={m.hot} color={SCORE_STYLE.hot.fg} />
            <Stat label="Warm" value={m.warm} color={SCORE_STYLE.warm.fg} />
            <Stat label="Cold" value={m.cold} color={SCORE_STYLE.cold.fg} />
            {/* Sin este, los tres de al lado no suman el total del mes. */}
            <Stat label="Sin calificar" value={m.sinCalificar} />
          </div>
        </MetricCard>

        {/* Sin «Realizadas»: ese eje se movió a la gestión del lead
            (`cerrado_en` / `resultado`), y `visitas.estado='realizada'` dejó de
            usarse para cerrar gestiones. «Por coordinar» y no «Pendientes»:
            significa que Sofía ofreció coordinar, no que haya visita agendada. */}
        <MetricCard title="Visitas" fallo={m.fallo}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Por coordinar" value={m.visitasPorCoordinar} color={VISITA_ESTADO_STYLE.pendientes} />
            <Stat label="Confirmadas" value={m.visitasConfirmadas} color={VISITA_ESTADO_STYLE.confirmadas} />
          </div>
        </MetricCard>

        <MetricCard title="Gestión del equipo (este mes)" fallo={m.fallo}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Contactados" value={m.contactadosMes} />
            <Stat label="Cerrados" value={m.cerradosMes} />
          </div>
          {m.cerradosMes > 0 && (
            <div className="text-sdm-sm" style={{ color: COLORS.muted, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {RESULTADOS.filter(r => m.resultadosMes[r]).map(r => (
                <span key={r}>{RESULTADO_LABEL[r]}: {m.resultadosMes[r]}</span>
              ))}
              {m.cerradosSinResultadoMes > 0 && <span>Sin resultado: {m.cerradosSinResultadoMes}</span>}
            </div>
          )}
        </MetricCard>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)', padding: 20 }}>
        <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600, marginBottom: 12 }}>
          Comunas más buscadas (este mes)
        </div>
        {loading ? (
          <span className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic' }}>Cargando…</span>
        ) : m.fallo ? (
          // Misma distinción que en las tarjetas: «no se pudo cargar» en rojo
          // no es lo mismo que «no hubo comunas», que va en gris.
          <span className="text-sdm-sm" style={{ color: COLORS.red, fontStyle: 'italic' }}>No se pudo cargar</span>
        ) : m.topComunas.length === 0 ? (
          <span className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic' }}>Sin datos de comunas para este mes.</span>
        ) : (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {m.topComunas.map((c, i) => (
                <div key={c.comuna} style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.bg, borderRadius: 14, padding: '6px 14px' }}>
                  <span className="text-sdm-sm" style={{ fontWeight: 700, color: COLORS.navy }}>{i + 1}.</span>
                  <span className="text-sdm-sm" style={{ color: COLORS.navy, textTransform: 'capitalize' }}>{c.comuna}</span>
                  <span className="text-sdm-sm" style={{ color: COLORS.muted, fontWeight: 600 }}>({c.count})</span>
                </div>
              ))}
            </div>
            {/* El recorte a 5 se dice. La caja no tiene scroll propio —es un
                flex-wrap de fichas—, así que sin esta línea las comunas 6 en
                adelante desaparecían sin dejar rastro y el ranking se leía
                como la lista completa del mes. */}
            {m.comunasTotal > m.topComunas.length && (
              <div className="text-sdm-sm" style={{ color: COLORS.muted, marginTop: 12 }}>
                Mostrando las {m.topComunas.length} más buscadas de {m.comunasTotal} comunas.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

// ── Sección 1: Visitas por confirmar ─────────────────────────────────────────
function VisitaCard({ visita, edit, onChange, onConfirm, onCancel, saving }: {
  visita: VisitaConLead
  edit: { asignado: string; horario: string }
  onChange: (next: { asignado: string; horario: string }) => void
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}) {
  const lead = visita.lead
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="text-sdm-lg" style={{ fontWeight: 700, color: COLORS.navy }}>{fmt(lead?.nombre, 'Sin nombre')}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, marginTop: 2 }}>{fmt(lead?.wa_phone)} · solicitada {timeAgo(visita.created_at)}</div>
        </div>
        {lead && <ScoreBadge score={lead.score} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
        <DRow label="Comuna" value={fmt(lead?.comuna)} />
        <DRow label="Intención" value={fmt(lead?.intencion)} />
        <DRow label="Presupuesto" value={fmt(lead?.presupuesto)} />
        <DRow label="Plazo" value={fmt(lead?.plazo)} />
      </div>

      {lead?.brief && (
        <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 'var(--sdm-radio-contenedor)', padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
          {lead.brief}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>Asignar a</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['Roberto', 'Manuel'] as const).map(name => (
              <button className="text-sdm-sm" key={name} type="button" onClick={() => onChange({ ...edit, asignado: name })}
                style={{ flex: 1, padding: '9px 14px', fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'inherit', border: `1px solid ${edit.asignado === name ? COLORS.navy : COLORS.border}`,
                  background: edit.asignado === name ? COLORS.navy : '#fff',
                  color: edit.asignado === name ? '#fff' : COLORS.navy,
                  transition: 'all 0.15s' }}>
                {name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Rotulo>Horario confirmado</Rotulo>
            <input className="text-sdm-base"
              type="text"
              value={edit.horario}
              onChange={e => onChange({ ...edit, horario: e.target.value })}
              placeholder="Ej: Sábado 14 de junio, 11:00 hrs"
              style={CAMPO}
            />
          </label>
          {/* La línea del horario propuesto queda FUERA del `<label>`: metida
              adentro se sumaría al nombre accesible del campo, que pasaría a
              anunciarse como «Horario confirmado Propuesto por el lead: …». */}
          {visita.horario_propuesto && (
            <span className="text-sdm-sm" style={{ color: COLORS.muted }}>Propuesto por el lead: «{visita.horario_propuesto}»</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="text-sdm-sm tracking-sdm-wide" type="button" onClick={onConfirm} disabled={saving}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: COLORS.greenDark, color: '#fff', border: 'none', borderRadius: 4, padding: '11px 18px', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            <Check size={15} /> {saving ? 'Guardando…' : 'Confirmar visita'}
          </button>
          <button className="text-sdm-sm" type="button" onClick={onCancel} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 4, padding: '11px 18px', fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
            <X size={15} /> Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sección 1b: Visitas confirmadas ──────────────────────────────────────────
//
// COMPONENTE APARTE, NO UNA VARIANTE DE `VisitaCard` CON UNA BANDERA.
//
// `VisitaCard` lleva dos botones de asignación, un campo de texto y dos
// acciones. Apagarlos con un `readonly` deja controles que siguen existiendo en
// el DOM —alcanzables con Tab, anunciados por un lector, sin hacer nada— o
// exige rociar `disabled` por todas partes y confiar en no olvidar ninguno.
// Acá simplemente no hay controles que apagar: lo que era editable se pinta
// como texto, y el único elemento enfocable es la acción que sí funciona.
function VisitaConfirmadaCard({ visita, onRealizada, onCancel, saving }: {
  visita: VisitaConLead
  onRealizada: () => void
  onCancel: () => void
  saving: boolean
}) {
  const lead = visita.lead
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div className="text-sdm-lg" style={{ fontWeight: 700, color: COLORS.navy }}>{fmt(lead?.nombre, 'Sin nombre')}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, marginTop: 2 }}>{fmt(lead?.wa_phone)} · solicitada {timeAgo(visita.created_at)}</div>
        </div>
        {lead && <ScoreBadge score={lead.score} />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 14 }}>
        <DRow label="Comuna" value={fmt(lead?.comuna)} />
        <DRow label="Intención" value={fmt(lead?.intencion)} />
        {/* Lo que en una visita pendiente son controles, acá son datos. */}
        <DRow label="Asignada a" value={fmt(visita.asignado_a)} />
        <DRow label="Horario" value={fmt(visita.horario_confirmado || visita.horario_propuesto)} />
      </div>

      {lead?.brief && (
        <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 'var(--sdm-radio-contenedor)', padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
          {lead.brief}
        </div>
      )}

      {/* DOS ACCIONES CON CONSECUENCIAS OPUESTAS EN LA MISMA TARJETA.
          Apiladas y con 24 px de separación, no lado a lado con el hueco de 10
          que usa la tarjeta de pendientes: acá una cierra bien el ciclo y la
          otra rompe un compromiso ya tomado con el cliente, y un error de
          puntería entre las dos no se puede deshacer desde el panel.
          Se distinguen además por peso —sólida contra contorno— y por color. */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* `minHeight: 44` explícito: con `padding 11px` y texto de 13 px el
            botón medía ~41 px y se quedaba corto del objetivo táctil. */}
        <button className="text-sdm-sm tracking-sdm-wide" type="button" onClick={onRealizada} disabled={saving}
          style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, padding: '11px 18px', fontWeight: 700,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          <CalendarCheck size={15} aria-hidden="true" /> {saving ? 'Guardando…' : 'Marcar como realizada'}
        </button>
        <button className="text-sdm-sm" type="button" onClick={onCancel} disabled={saving}
          style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: '#fff', color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 4, padding: '11px 18px', fontWeight: 600,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          <X size={15} aria-hidden="true" /> Cancelar la visita
        </button>
      </div>
    </div>
  )
}

// ── Sección 2: Leads recientes ───────────────────────────────────────────────
function LeadRow({ lead, ultimaVisita, expanded, onToggle, onEdit, onDelete, deleting, onModoChange, onContactado, onCerrar, onReabrir, accionEnCurso }: {
  lead: Lead
  ultimaVisita: UltimaVisita | undefined
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  onModoChange: () => void
  onContactado: () => void
  onCerrar: (resultado: string | null) => void
  onReabrir: () => void
  accionEnCurso: boolean
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>('detalles')
  const [refreshSignal, setRefreshSignal] = useState(0)
  // Despliegue de los cuatro resultados. Estado local y en línea, no un popover:
  // la barra de acciones ya es su propia fila, así que abrirla hacia abajo no
  // pide posicionamiento, ni z-index, ni cerrar al hacer clic afuera.
  const [cerrarAbierto, setCerrarAbierto] = useState(false)

  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 'var(--sdm-radio-contenedor)', overflow: 'hidden', opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      {/* CONTROL DE VERDAD, NO UN <div> QUE ESCUCHA CLICS.
          Era un <div onClick> con `cursor: pointer` y nada más: sin `role`, sin
          `tabIndex` y sin `onKeyDown`. No recibía foco, no respondía a Enter ni a
          Espacio y no se anunciaba como control, así que CON TECLADO NO SE PODÍA
          ABRIR NINGÚN LEAD — los únicos elementos alcanzables de la fila eran los
          botones «Editar» y «Eliminar» de dentro.

          NO SE ENVUELVE EN UN <button>, y por eso hace falta el `role`: esta
          cabecera CONTIENE esos dos botones, y un <button> dentro de otro es
          marcado inválido. Es la misma restricción que `globals.css` describe
          para `.enlace-tarjeta`.

          `preventDefault()` en Espacio no sobra: sin él la página se desplaza
          además de abrir el lead, porque Espacio es «avanzar una pantalla» en un
          elemento que no es un control nativo. */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() }
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
        <ScoreBadge score={lead.score} />
        {/* Estas seis columnas ENVUELVEN en vez de recortarse. Medido: a 1100 px
            de ancho —el máximo del panel— cada una mide ~124 px, y a 768 px
            bajan a ~108 px. Ahí entran «Ñuñoa» y «3 a 6 meses», pero no un
            presupuesto tal como lo escribe el cliente ni un nombre completo.
            La fila crece a dos líneas cuando hace falta; antes el dato se
            cortaba y no había forma de recuperarlo sin abrir el detalle. */}
        <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
          <div className="text-sdm-base" style={{ fontWeight: 700, color: COLORS.navy, overflowWrap: 'anywhere' }}>{fmt(lead.nombre, 'Sin nombre')}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, overflowWrap: 'anywhere' }}>{fmt(lead.comuna)}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, overflowWrap: 'anywhere' }}>{fmt(lead.intencion)}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, overflowWrap: 'anywhere' }}>{fmt(lead.presupuesto)}</div>
          <div className="text-sdm-sm" style={{ color: COLORS.muted, overflowWrap: 'anywhere' }}>{fmt(lead.plazo)}</div>
          {/* El ciclo del EQUIPO, y nada más: ni `leads.status` ni el estado de
              la visita entran acá. Los dos siguen visibles en el detalle, con
              su propio rótulo. Sin `capitalize` porque las etiquetas ya vienen
              escritas. */}
          <div className="text-sdm-sm" style={{ color: lead.cerrado_en ? COLORS.muted : COLORS.navy }}>{cicloLead(lead)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            title="Editar lead"
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: 'pointer', color: COLORS.muted, flexShrink: 0 }}>
            <Pencil size={13} />
          </button>
          <button
            type="button"
            title="Eliminar lead"
            onClick={e => { e.stopPropagation(); onDelete() }}
            disabled={deleting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 4, cursor: deleting ? 'default' : 'pointer', color: COLORS.red, flexShrink: 0 }}>
            <Trash2 size={13} />
          </button>
        </div>
        {expanded ? <ChevronUp size={18} style={{ color: COLORS.muted }} /> : <ChevronDown size={18} style={{ color: COLORS.muted }} />}
      </div>

      {/* ── Barra del ciclo de gestión ────────────────────────────────────────
          VA FUERA DEL `role="button"` DE ARRIBA, y no es un capricho de orden:
          dentro quedarían controles anidados en otro control, que es lo mismo
          que ya obligó a que la cabecera no sea un <button>. Además así no hace
          falta `stopPropagation` en cada uno.

          Y VA FUERA DE `{expanded && ...}`: marcar el contacto tiene que costar
          UN clic. Si viviera en el detalle costaría dos —abrir y marcar—, y una
          marca que cuesta el doble es una marca que el equipo no pone. De esa
          marca depende que `seguimiento_candidatos` no le escriba a alguien ya
          atendido. */}
      {/* JERARQUÍA — las tres variantes usables sobre fondo claro, y solo esas:
          `.btn-inverse` es blanco sobre navy y `.btn-outline` es texto blanco
          translúcido para el hero sobre foto; las dos DESAPARECEN sobre esta
          tarjeta blanca. Quedan `.btn-primary`, `.btn-green` y `.btn-text`, que
          son exactamente los tres escalones que hacen falta.

            «Ya lo contacté»  .btn-primary  navy casi negro, el peso máximo del
                              sistema. Es la acción que sostiene el filtro de
                              `seguimiento_candidatos`: sin esa marca, Sofía
                              puede escribirle a alguien que Roberto ya llamó.
            «Cerrar»          .btn-text     sin relleno.
            «Ya no está…»     .btn-text     igual, empujado al borde derecho.

          SON DOS NIVELES, NO TRES. «Cerrar» estuvo un rato en `.btn-green`, que
          era el único sólido que quedaba por debajo del navy, pero el verde se
          lee como «esta es la buena» y cerrar incluye «No calificó» y «No
          respondió». Antes que forzar un tercer escalón con el color
          equivocado, los dos cierres bajan al mismo peso y se distinguen por
          posición.

          NINGÚN color a mano. El `background: var(--muted)` que había en los dos
          últimos fabricaba una sexta variante que no existe en el sistema, y
          además, al ir inline, ganaba a los `:hover` de `globals.css` y dejaba
          esos botones sin cambio de color al pasar por encima. */}
      <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '10px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {lead.cerrado_en ? (
            // NO se repite «Cerrado» ni el resultado: la última columna de la
            // fila ya los dice, a 30 cm de acá. Lo único que aporta esta franja
            // es la fecha —que la columna no tiene— y la acción de revertir.
            <>
              <span className="text-sdm-sm" style={{ color: COLORS.muted }}>Se cerró el {fechaCorta(lead.cerrado_en)}</span>
              <button type="button" className="btn-text text-sdm-xs"
                onClick={onReabrir} disabled={accionEnCurso}>
                Reabrir
              </button>
            </>
          ) : (
            <>
              {lead.contactado_en ? (
                <span className="text-sdm-sm" style={{ color: COLORS.muted }}>Contactado el {fechaCorta(lead.contactado_en)}</span>
              ) : (
                <button type="button" className="btn-primary text-sdm-xs" style={{ padding: '8px 14px' }}
                  onClick={onContactado} disabled={accionEnCurso}>
                  <Check size={14} aria-hidden="true" /> Ya lo contacté
                </button>
              )}
              <button type="button" className="btn-text text-sdm-xs"
                aria-expanded={cerrarAbierto}
                onClick={() => setCerrarAbierto(v => !v)} disabled={accionEnCurso}>
                Cerrar
              </button>
              {/* `marginLeft: auto` empuja el escape al borde derecho. Es lo
                  ÚNICO que lo separa de «Cerrar», y a propósito: los dos son
                  `.btn-text`, mismo color y mismo peso. Diferenciarlos por tono
                  o por grosor inventaría una jerarquía entre dos acciones que
                  están al mismo nivel — cerrar con motivo y cerrar sin él. Lo
                  que cambia es dónde vive cada una, no cuánto pesa. */}
              <button type="button" className="btn-text text-sdm-xs" style={{ marginLeft: 'auto' }}
                onClick={() => onCerrar(null)} disabled={accionEnCurso}>
                Ya no está en mi lista
              </button>
            </>
          )}
        </div>

        {cerrarAbierto && !lead.cerrado_en && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="text-sdm-xs" style={{ color: COLORS.muted }}>¿Con qué resultado?</span>
            {/* Los cuatro son pares entre sí: misma variante, mismo peso. */}
            {RESULTADOS.map(r => (
              <button key={r} type="button" className="btn-primary text-sdm-xs" style={{ padding: '8px 14px' }}
                onClick={() => { setCerrarAbierto(false); onCerrar(r) }} disabled={accionEnCurso}>
                {RESULTADO_LABEL[r]}
              </button>
            ))}
            <button type="button" className="btn-text text-sdm-xs"
              onClick={() => setCerrarAbierto(false)} disabled={accionEnCurso}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <DetailTabs active={detailTab} onChange={setDetailTab} />

          {detailTab === 'detalles' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14 }}>
                <DRow label="Teléfono" value={fmt(lead.wa_phone)} />
                <DRow label="Contacto" value={fmt(lead.contacto)} />
                <DRow label="Tipo" value={fmt(lead.tipo)} />
                <DRow label="Dormitorios" value={fmt(lead.dormitorios)} />
                <DRow label="Comuna" value={fmt(lead.comuna)} />
                <DRow label="Presupuesto" value={fmt(lead.presupuesto)} />
                <DRow label="Plazo" value={fmt(lead.plazo)} />
                <DRow label="Crédito" value={fmt(lead.necesita_credito)} />
                <DRow label="Disponibilidad" value={fmt(lead.disponibilidad)} />
                <DRow label="Handoff" value={fmt(lead.handoff)} />
                {/* Los tres ejes, cada uno con su rótulo y sin cruzarse. Antes
                    esto era un solo campo «Status» que mezclaba el del Worker
                    con el de la visita y avisaba cuando se contradecían; ya no
                    hay nada que contradecir. */}
                <DRow label="Estado en Sofía" value={STATUS_LABEL[lead.status || ''] || fmt(lead.status)} />
                <DRow label="Gestión del equipo" value={cicloLead(lead)} />
                <DRow label="Última visita" value={
                  ultimaVisita
                    ? `${VISITA_LABEL[ultimaVisita.estado] || ultimaVisita.estado} · ${timeAgo(ultimaVisita.created_at)}`
                    : 'Sin visitas'
                } />
                <DRow label="Último mensaje" value={timeAgo(lead.last_message_at || lead.created_at)} />
              </div>

              {lead.brief && (
                <div>
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>Brief para el equipo</div>
                  <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 'var(--sdm-radio-contenedor)', padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
                    {lead.brief}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600, marginBottom: 8 }}>Resumen de calificación (IA)</div>
                <ChatLog conversation={lead.conversation} />
              </div>
            </>
          )}

          {detailTab === 'conversacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ModoToggleBanner lead={lead} onModoChange={onModoChange} />
              <ConversacionThread leadId={lead.id} waPhone={lead.wa_phone} active={expanded && detailTab === 'conversacion'} refreshSignal={refreshSignal} />
              {lead.modo === 'manual' && (
                <ManualSendBox
                  lead={lead}
                  onSent={() => { setRefreshSignal(s => s + 1); onModoChange() }}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const SCORE_FILTERS: { key: ScoreFilter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'hot', label: 'Hot' },
  { key: 'warm', label: 'Warm' },
  { key: 'cold', label: 'Cold' },
]

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Captacion() {
  const { authed, checking } = useAdminAuth()

  // Métricas
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  // Visitas
  const [visitas, setVisitas] = useState<VisitaConLead[]>([])
  const [confirmadas, setConfirmadas] = useState<VisitaConLead[]>([])
  const [loadingVisitas, setLoadingVisitas] = useState(true)
  const [edits, setEdits] = useState<Record<string, { asignado: string; horario: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Leads
  const [leads, setLeads] = useState<Lead[]>([])
  // Última visita por lead, para corregir el `status` sin escribir en `leads`.
  const [ultimasVisitas, setUltimasVisitas] = useState<Record<string, UltimaVisita>>({})
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [filter, setFilter] = useState<ScoreFilter>('todos')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Notificaciones
  const [notifValue, setNotifValue] = useState<NotifValue | null>(null)
  const [savingNotif, setSavingNotif] = useState(false)

  // Editar lead
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Eliminar lead
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Ciclo de gestión: qué fila tiene una escritura en vuelo.
  const [accionId, setAccionId] = useState<string | null>(null)

  // Confirmación del botón Actualizar. Reusa el temporizador de `acciones.tsx`
  // —el mismo de los catorce paneles, 2500 ms— pero no su componente
  // `Guardado`: acá no se guardó nada, y decir «Guardado correctamente» tras una
  // recarga es exactamente el tipo de mensaje falso que este admin ya pagó caro.
  const [actualizadoVisible, avisarActualizado] = useGuardado()

  // ── Loaders ─────────────────────────────────────────────────────────────────
  //
  // LOS TRES DEVUELVEN SU `error` EN VEZ DE TRAGÁRSELO. Siguen logueando a
  // consola y siguen sin levantar `alert()` —corren cada 25 s con el refresco
  // automático, y un fallo no puede interrumpir a quien está trabajando—, pero
  // ahora el que llama decide. `loadAll`, que es el del intervalo, ignora el
  // retorno y se comporta igual que antes; `refrescar`, que es el del botón
  // Actualizar, lo usa para no cantar «Actualizado» sobre una recarga fallida.
  const loadVisitas = useCallback(async () => {
    setLoadingVisitas(true)
    // Los DOS estados en una sola consulta, y se parten acá. Antes esto pedía
    // solo las `pendiente`, así que una visita desaparecía del panel en el
    // momento en que se confirmaba: no había ninguna pantalla que mostrara lo
    // que venía. `cancelada` y `realizada` quedan fuera a propósito — son
    // finales de ciclo y no piden ninguna acción.
    const { data: vs, error } = await supabase
      .from('visitas')
      .select('*')
      .in('estado', ['pendiente', 'confirmada'])
      .order('created_at', { ascending: false })
    // Sin `avisarError`: esto corre cada 25 s con el refresco automático y un
    // fallo no puede levantar un alert() encima de quien está trabajando.
    if (error) console.error('[No se pudieron cargar las visitas]', error)
    const visitasArr = (vs as Visita[]) || []

    const leadIds = [...new Set(visitasArr.map(v => v.lead_id).filter((x): x is string => !!x))]
    let leadsMap: Record<string, Lead> = {}
    if (leadIds.length) {
      const { data: ls } = await supabase
        .from('leads')
        .select('id, nombre, wa_phone, comuna, intencion, presupuesto, plazo, brief, score')
        .in('id', leadIds)
      for (const l of (ls as Lead[]) || []) leadsMap[l.id] = l
    }

    const merged: VisitaConLead[] = visitasArr.map(v => ({ ...v, lead: v.lead_id ? leadsMap[v.lead_id] || null : null }))
    const pendientes = merged.filter(v => v.estado === 'pendiente')
    setVisitas(pendientes)
    setConfirmadas(merged.filter(v => v.estado === 'confirmada'))
    // `edits` solo para las pendientes: son las únicas con campos editables.
    setEdits(prev => {
      const next = { ...prev }
      for (const v of pendientes) {
        if (!next[v.id]) next[v.id] = { asignado: v.asignado_a || 'Roberto', horario: v.horario_confirmado || v.horario_propuesto || '' }
      }
      return next
    })
    setLoadingVisitas(false)
    return error
  }, [])

  // Recarga los leads sin tocar loadingLeads, para no disparar el indicador
  // "Cargando…" al cambiar de modo o enviar un mensaje manual.
  const loadLeadsQuiet = useCallback(async () => {
    const { data, error: errLeads } = await supabase
      .from('leads')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100)
    // Este `error` no se recogía. La lista se quedaba con los leads viejos y
    // nada lo decía — ni siquiera la consola.
    if (errLeads) { console.error('[No se pudieron cargar los leads]', errLeads); return errLeads }
    const filas = (data as Lead[]) || []
    setLeads(filas)

    // Segunda consulta: la ÚLTIMA visita de cada lead en pantalla.
    //
    // Hace falta una consulta aparte porque `loadVisitas` solo trae las
    // `pendiente` —son las que se coordinan— y justamente las canceladas son
    // las que aquí interesan.
    //
    // `.in()` y no un `select` suelto de toda la tabla: acota a los 100 leads
    // que se están mostrando, así que la consulta no crece con el histórico.
    //
    // EL ORDEN ES LA MITAD DEL ASUNTO. Viene `created_at` descendente y el mapa
    // se llena con el PRIMERO que aparece de cada `lead_id`, o sea el más
    // reciente. Un lead con una visita cancelada y otra confirmada después
    // tiene que verse como confirmado, no como cancelado; sin este orden, o
    // con un `if` que sobrescriba, saldría lo contrario.
    const ids = filas.map(l => l.id)
    if (!ids.length) { setUltimasVisitas({}); return null }

    const { data: vs, error } = await supabase
      .from('visitas')
      .select('lead_id, estado, created_at')
      .in('lead_id', ids)
      .order('created_at', { ascending: false })

    // Sin `avisarError`: esto es una lectura de apoyo y corre cada 25 s con el
    // refresco automático. Un fallo acá no puede levantar un alert() encima de
    // quien está trabajando. Si falla, el mapa se queda como estaba y el panel
    // muestra el rótulo de visita anterior, que es el comportamiento previo.
    if (error) { console.error('[No se pudo leer las visitas de los leads]', error); return error }

    const mapa: Record<string, UltimaVisita> = {}
    for (const v of (vs as { lead_id: string | null; estado: string; created_at: string | null }[]) || []) {
      if (!v.lead_id || mapa[v.lead_id]) continue
      mapa[v.lead_id] = { estado: v.estado, created_at: v.created_at }
    }
    setUltimasVisitas(mapa)
    return null
  }, [])

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true)
    const error = await loadLeadsQuiet()
    setLoadingLeads(false)
    return error
  }, [loadLeadsQuiet])

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true)

    const hoy = hoyEnChile()
    const desdeHoy = inicioDiaChile(hoy)
    // 7 días NATURALES, no 168 horas. Lo anterior restaba milisegundos, así que
    // la ventana empezaba a media tarde del séptimo día y el rótulo «7 días»
    // no describía lo que se estaba contando. `-6` porque hoy es el séptimo.
    const desdeSemana = inicioDiaChile(sumarDias(hoy, -6))
    const desdeMes = inicioDiaChile(`${hoy.slice(0, 7)}-01`)

    const [
      sinContactarRes,
      leadsHoyRes,
      leadsSemanaRes,
      leadsMesRes,
      visitasPorCoordinarRes,
      visitasConfirmadasRes,
      contactadosMesRes,
      cerradosMesRes,
    ] = await Promise.all([
      // Mismo predicado, letra por letra, que `sin_contactar` de la RPC
      // `resumen_diario`. Si los dos números no coinciden, uno está mal: es el
      // que Roberto recibe por WhatsApp cada mañana.
      supabase.from('leads').select('id', { count: 'exact', head: true }).is('contactado_en', null).is('cerrado_en', null),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', desdeHoy),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', desdeSemana),
      supabase.from('leads').select('score, comuna').gte('created_at', desdeMes),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('estado', 'confirmada'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('contactado_en', desdeMes),
      // Filas y no `count`: de la misma consulta salen el total de cerrados del
      // mes y el desglose por resultado, sin cuatro consultas más.
      supabase.from('leads').select('resultado').gte('cerrado_en', desdeMes),
    ])

    // Ninguna consulta miraba su `error`: con la red caída las métricas se
    // quedaban en cero y ese cero se leía como «no hubo leads este mes».
    //
    // Sin `avisarError()` A PROPÓSITO: esto corre cada 25 s con el refresco
    // automático, y un alert() encima de quien trabaja es peor que el problema.
    // El detalle va a consola; la pantalla lo dice con `fallo`.
    const falloMetricas = [
      sinContactarRes, leadsHoyRes, leadsSemanaRes, leadsMesRes,
      visitasPorCoordinarRes, visitasConfirmadasRes, contactadosMesRes, cerradosMesRes,
    ].find(r => r.error)?.error || null
    if (falloMetricas) {
      console.error('[No se pudieron cargar las métricas]', falloMetricas)
      // Se descartan los números a medias: media tarjeta cargada y media en
      // cero es justo la mezcla que no se puede distinguir de la realidad.
      setMetrics({ ...METRICAS_CERO, fallo: true })
      setLoadingMetrics(false)
      return falloMetricas
    }

    const leadsMesArr = (leadsMesRes.data as Pick<Lead, 'score' | 'comuna'>[]) || []

    // `sinCalificar` es el que faltaba, y por eso los tres de la tarjeta no
    // sumaban el total del mes: 1 + 3 + 1 daba 5 sobre 7 leads y los 2 que
    // quedaban fuera no aparecían en ninguna parte de la pantalla.
    let hot = 0, warm = 0, cold = 0, sinCalificar = 0
    const comunaCounts: Record<string, number> = {}
    for (const l of leadsMesArr) {
      if (l.score === 'hot') hot++
      else if (l.score === 'warm') warm++
      else if (l.score === 'cold') cold++
      else sinCalificar++

      const comuna = l.comuna?.trim()
      if (comuna) comunaCounts[comuna] = (comunaCounts[comuna] || 0) + 1
    }

    const topComunas = Object.entries(comunaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([comuna, count]) => ({ comuna, count }))

    const cerradosArr = (cerradosMesRes.data as { resultado: string | null }[]) || []
    const resultadosMes: Record<string, number> = {}
    let cerradosSinResultadoMes = 0
    for (const c of cerradosArr) {
      if (c.resultado) resultadosMes[c.resultado] = (resultadosMes[c.resultado] || 0) + 1
      else cerradosSinResultadoMes++
    }

    setMetrics({
      sinContactar: sinContactarRes.count || 0,
      visitasPorCoordinar: visitasPorCoordinarRes.count || 0,
      visitasConfirmadas: visitasConfirmadasRes.count || 0,
      leadsHoy: leadsHoyRes.count || 0,
      leadsSemana: leadsSemanaRes.count || 0,
      leadsMes: leadsMesArr.length,
      hot, warm, cold, sinCalificar,
      contactadosMes: contactadosMesRes.count || 0,
      cerradosMes: cerradosArr.length,
      resultadosMes,
      cerradosSinResultadoMes,
      topComunas,
      comunasTotal: Object.keys(comunaCounts).length,
      fallo: false,
    })
    setLoadingMetrics(false)
    return falloMetricas
  }, [])

  const loadNotifConfig = useCallback(async () => {
    const { data } = await supabase
      .from('config')
      .select('valor')
      .eq('clave', 'notificar_leads')
      .single()
    setNotifValue((data?.valor as NotifValue) || 'todos')
  }, [])

  const loadAll = useCallback(() => { loadVisitas(); loadLeads(); loadMetrics() }, [loadVisitas, loadLeads, loadMetrics])

  // El botón Actualizar SÍ recargaba, pero cuando no había nada nuevo no cambiaba
  // un solo píxel, y eso se lee como un botón muerto. Ahora espera a las tres
  // consultas y confirma. `loadAll` queda para el intervalo de 25 s, que no debe
  // avisar nada: un aviso cada 25 segundos es ruido, no información.
  const refrescar = async () => {
    const fallo = (await Promise.all([loadVisitas(), loadLeads(), loadMetrics()])).find(Boolean) || null
    if (avisarError('No se pudo actualizar', fallo)) return
    avisarActualizado()
  }

  useEffect(() => {
    if (authed) { loadAll(); loadNotifConfig() }
  }, [authed, loadAll, loadNotifConfig])

  useEffect(() => {
    if (!authed) return
    const id = setInterval(loadAll, REFRESH_MS)
    return () => clearInterval(id)
  }, [authed, loadAll])

  // ── Acciones: visitas ────────────────────────────────────────────────────────
  const confirmarVisita = async (v: VisitaConLead) => {
    const edit = edits[v.id]
    if (!edit) return
    setSavingId(v.id)
    const { error } = await supabase.from('visitas').update({
      estado: 'confirmada',
      asignado_a: edit.asignado,
      horario_confirmado: edit.horario || null,
    }).eq('id', v.id)
    if (error) { setSavingId(null); avisarError('No se pudo confirmar la visita', error); return }

    // ACÁ SE ESCRIBÍA `leads.status = 'visita_confirmada'`. Se quitó: ese campo
    // es del Worker de Sofía, que no conoce ese valor. Escribirlo vaciaba
    // 'derivado' de la base y sacaba al lead del filtro del seguimiento de
    // leads fríos, que excluía por una lista de valores de `status`.
    // La visita ya dice que está confirmada; el lead no tiene que repetirlo.
    setSavingId(null)
    loadVisitas()
    loadLeads()
    // Confirmar mueve dos contadores —Pendientes baja, Confirmadas sube—, así
    // que Métricas también se recarga en vez de esperar el refresco de 25 s.
    loadMetrics()
  }

  const cancelarVisita = async (v: VisitaConLead) => {
    // La consecuencia está verificada contra el código, no supuesta:
    //
    //   1. Lo único que se escribe es `visitas.estado = 'cancelada'`. No hay
    //      DELETE: el registro se conserva.
    //   2. La tarjeta desaparece porque `loadVisitas` pide `pendiente` y
    //      `confirmada`, no porque se borre nada.
    //   3. NO se le avisa al cliente. El worker de Sofía
    //      (`sdm-captacion-worker-project/index.js`) solo hace POST a `visitas`
    //      cuando el lead califica; no lee `estado` en ningún momento, así que
    //      cancelar acá no dispara ningún WhatsApp.
    //   4. `leads` no se toca en absoluto. Ya no hace falta: la etiqueta de la
    //      lista sale del ciclo del equipo y la de la visita vive en su propio
    //      rótulo, así que cancelar no puede desfasar ninguna de las dos.
    //
    // Si algún día el worker empieza a reaccionar al estado, este texto miente.
    //
    if (!confirm(avisoCancelar(v))) return
    setSavingId(v.id)
    const { error } = await supabase.from('visitas').update({ estado: 'cancelada' }).eq('id', v.id)
    setSavingId(null)
    if (avisarError('No se pudo cancelar la visita', error)) return
    loadVisitas()
    // También los leads: el detalle de cada fila muestra su última visita, y
    // sin esto seguiría diciendo «Por coordinar» hasta el refresco de los 25 s.
    loadLeadsQuiet()
    loadMetrics()
  }

  const marcarRealizada = async (v: VisitaConLead) => {
    // Consecuencia verificada contra el código, igual que en `cancelarVisita`:
    //
    //   1. Solo se escribe `visitas.estado = 'realizada'`.
    //   2. La tarjeta desaparece de esta sección: `loadVisitas` pide
    //      `pendiente` y `confirmada`, no `realizada`.
    //   3. NO SE PUEDE DESHACER DESDE EL PANEL. No hay ninguna pantalla que
    //      liste las realizadas ni acción que las devuelva. Por eso el aviso lo
    //      dice: es la diferencia real con confirmar o cancelar, que siempre
    //      dejan la visita a la vista en alguna sección.
    //   4. Al cliente no le llega nada — el worker nunca lee `visitas.estado`.
    //   5. `leads` no se toca: el detalle del lead pasará a decir «Visita
    //      realizada» en su rótulo de visita, sin tocar el ciclo del equipo.
    const quien = v.lead?.nombre?.trim() || v.lead?.wa_phone?.trim() || 'este lead'
    if (!confirm(
      `¿Marcar como realizada la visita de ${quien}?\n\n` +
      'Sale de esta sección y no se puede deshacer desde el panel.\n\n' +
      'Al cliente no le llega ningún aviso.'
    )) return
    setSavingId(v.id)
    const { error } = await supabase.from('visitas').update({ estado: 'realizada' }).eq('id', v.id)
    setSavingId(null)
    if (avisarError('No se pudo marcar la visita como realizada', error)) return
    loadVisitas()
    loadMetrics()
    // La fila del lead muestra el estado cruzado con su última visita, así que
    // sin esto seguiría diciendo «Visita confirmada» hasta el refresco de 25 s.
    loadLeadsQuiet()
  }

  // ── Acciones: notificaciones ─────────────────────────────────────────────────
  const saveNotifConfig = async (v: NotifValue) => {
    setSavingNotif(true)
    setNotifValue(v)
    const { error } = await supabase
      .from('config')
      .update({ valor: v })
      .eq('clave', 'notificar_leads')
    if (error) {
      console.error('Error al guardar config notificaciones:', error)
      // Recargar el valor real en caso de error
      loadNotifConfig()
    }
    setSavingNotif(false)
  }

  // ── Acciones: editar lead ────────────────────────────────────────────────────
  const saveLead = async (draft: EditLeadDraft) => {
    if (!editingLead) return
    setEditSaving(true)
    setEditError(null)
    const { error } = await supabase.from('leads').update({
      nombre:      draft.nombre      || null,
      contacto:    draft.contacto    || null,
      score:       draft.score       || null,
      presupuesto: draft.presupuesto || null,
      plazo:       draft.plazo       || null,
    }).eq('id', editingLead.id)
    if (error) {
      // NO pasa por `avisarError`, y es la única escritura del panel que no lo
      // hace. `avisarError` levanta un `alert()`, y acá el modal ya está
      // abierto con lo que se escribió: el aviso saldría ENCIMA del formulario
      // y habría que descartarlo antes de poder corregir el campo. El banner
      // de abajo dice lo mismo sin interrumpir y sin tapar nada.
      //
      // Lo que sí se conserva de `avisarError` es la parte que sirve para
      // depurar: el objeto completo a la consola. El `error.message` de
      // Postgres NO se muestra —viene en inglés y habla de columnas y
      // restricciones, no de lo que la persona estaba haciendo—.
      console.error('[No se pudo guardar el lead]', error)
      setEditError('No se pudo guardar el lead. No se cambió nada; revisa los datos y vuelve a intentarlo.')
      setEditSaving(false)
      return
    }
    setEditSaving(false)
    setEditingLead(null)
    loadLeads()
  }

  // ── Acciones: ciclo de gestión del equipo ────────────────────────────────────
  //
  // Las dos escriben `leads`, NUNCA `status`. Recargan con `loadLeadsQuiet` para
  // no disparar el «Cargando…» de toda la lista por marcar una fila.
  //
  // La marca de tiempo sale del reloj del navegador en UTC, que es lo correcto
  // para un `timestamptz`: guarda un instante, no un día de calendario. La
  // trampa de `toISOString()` documentada en SINCRONIA.md es la contraria —
  // derivar de ahí la FECHA en Chile—, y acá no se deriva ninguna fecha.

  const marcarContactado = async (lead: Lead) => {
    setAccionId(lead.id)
    const { error } = await supabase.from('leads')
      .update({ contactado_en: new Date().toISOString() })
      .eq('id', lead.id)
    setAccionId(null)
    if (avisarError('No se pudo marcar el contacto', error)) return
    loadLeadsQuiet()
  }

  // `resultado` es `string | null`, nunca `undefined`: una clave con `undefined`
  // desaparece del JSON y PostgREST no la escribe, así que el cierre rápido
  // dejaría `resultado` como estaba en vez de ponerlo en null.
  const cerrarLead = async (lead: Lead, resultado: string | null) => {
    setAccionId(lead.id)
    const ahora = new Date().toISOString()
    const { error } = await supabase.from('leads')
      .update({
        cerrado_en: ahora,
        resultado,
        // Cerrar implica contactado. Sin esto un lead cerrado sin marca de
        // contacto vuelve a ser candidato de `seguimiento_candidatos`, que
        // filtra por `contactado_en is null and cerrado_en is null`, y Sofía le
        // escribiría a alguien que el equipo ya dio por terminado.
        ...(lead.contactado_en ? {} : { contactado_en: ahora }),
      })
      .eq('id', lead.id)
    setAccionId(null)
    if (avisarError('No se pudo cerrar la gestión', error)) return
    loadLeadsQuiet()
  }

  // El único de los cuatro que REVIERTE algo, y por eso el único con
  // confirmación. `confirm()` porque es lo que ya usan `cancelarVisita`,
  // `marcarRealizada` y `deleteLead`: el archivo no tiene otro mecanismo, y
  // meter un modal propio para un solo botón sería una quinta forma de
  // preguntar lo mismo.
  //
  // `contactado_en` NO va en el payload: reabrir deshace el cierre, no el
  // contacto. Si se limpiara, el lead volvería a `seguimiento_candidatos` y
  // Sofía podría escribirle a alguien con quien el equipo ya habló.
  const reabrirLead = async (lead: Lead) => {
    if (!confirm(
      `¿Reabrir la gestión de ${lead.nombre?.trim() || lead.wa_phone?.trim() || 'este lead'}?\n\n` +
      'Vuelve a la lista de gestiones abiertas y se borra el resultado que tenía.\n\n' +
      'La fecha de contacto se mantiene.'
    )) return
    setAccionId(lead.id)
    // Los dos a `null` explícito. Con `undefined` la clave desaparece del JSON
    // y PostgREST no la toca: el lead seguiría cerrado y el panel diría que se
    // reabrió. Ver la prueba de serialización en el commit del ciclo.
    const { error } = await supabase.from('leads')
      .update({ cerrado_en: null, resultado: null })
      .eq('id', lead.id)
    setAccionId(null)
    if (avisarError('No se pudo reabrir la gestión', error)) return
    loadLeadsQuiet()
  }

  // ── Acciones: eliminar lead ──────────────────────────────────────────────────
  const deleteLead = async (lead: Lead) => {
    if (!confirm('¿Eliminar este lead? Esto también elimina sus visitas asociadas. Esta acción no se puede deshacer.')) return
    setDeletingId(lead.id)
    const { error } = await supabase.from('leads').delete().eq('id', lead.id)
    // `setDeletingId(null)` va ANTES del corte: la fila se pinta al 50 % de
    // opacidad mientras se borra, y si el corte se lleva esta línea la fila se
    // queda apagada para siempre aunque el lead siga ahí.
    setDeletingId(null)
    if (avisarError('No se pudo eliminar el lead', error)) return
    if (expandedId === lead.id) setExpandedId(null)
    loadLeads()
    loadVisitas()
  }

  // ── Render guards ────────────────────────────────────────────────────────────
  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.navy }}>
      <span className="text-sdm-xl" style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>Verificando sesión…</span>
    </div>
  )
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.navy }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 4, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: COLORS.navy }}>Debes iniciar sesión.</p>
        <Link to="/admin" style={{ color: COLORS.navy, fontWeight: 600 }}>← Ir al admin</Link>
      </div>
    </div>
  )

  const filteredLeads = filter === 'todos' ? leads : leads.filter(l => l.score === filter)

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${COLORS.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLORS.muted, textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al admin
          </Link>
          <span style={{ color: COLORS.border }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: COLORS.navy }}>Captación — Leads y Visitas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Misma forma que la píldora `Guardado` de los catorce paneles —el
              check, el verde, el mismo temporizador de 2500 ms—, con el texto
              que corresponde: acá se recargó, no se guardó. */}
          {actualizadoVisible && (
            <span className="text-sdm-sm" style={{ color: 'var(--green-dark)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} strokeWidth={2} aria-hidden="true" />Actualizado
            </span>
          )}
          <button className="text-sdm-sm tracking-sdm-wide" onClick={refrescar}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 2, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Interruptor de notificaciones ──────────────────────────────── */}
        <NotifToggle value={notifValue} onChange={saveNotifConfig} saving={savingNotif} />

        {/* ── ORDEN DE LA PÁGINA: lo accionable primero ─────────────────────
            Estaba al revés. Arriba iban las métricas, después las dos secciones
            de visitas —que suelen estar vacías y ocupaban casi una pantalla
            entre las dos para decir «no hay nada»— y al final los leads, que es
            lo único sobre lo que se actúa. Quien abría el panel tenía que
            desplazarse para llegar al trabajo.

            Ahora: leads, visitas, métricas. Las métricas se consultan; los
            leads se trabajan. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* ── Sección 1: Leads recientes ────────────────────────────────── */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy }}>Leads recientes</h2>
              <div style={{ display: 'flex', gap: 6 }}>
                {SCORE_FILTERS.map(f => (
                  <button className="text-sdm-sm" key={f.key} type="button" onClick={() => setFilter(f.key)}
                    style={{ padding: '7px 16px', fontWeight: 600, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                      border: `1px solid ${filter === f.key ? COLORS.navy : COLORS.border}`,
                      background: filter === f.key ? COLORS.navy : '#fff',
                      color: filter === f.key ? '#fff' : COLORS.muted,
                      transition: 'all 0.15s' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingLeads && leads.length === 0 ? (
              <SeccionVacia>Cargando leads…</SeccionVacia>
            ) : filteredLeads.length === 0 ? (
              <SeccionVacia>No hay leads para este filtro.</SeccionVacia>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filteredLeads.map(l => (
                  <LeadRow
                    key={l.id}
                    lead={l}
                    ultimaVisita={ultimasVisitas[l.id]}
                    expanded={expandedId === l.id}
                    onToggle={() => setExpandedId(prev => prev === l.id ? null : l.id)}
                    onEdit={() => { setEditError(null); setEditingLead(l) }}
                    onDelete={() => deleteLead(l)}
                    deleting={deletingId === l.id}
                    onModoChange={loadLeadsQuiet}
                    onContactado={() => marcarContactado(l)}
                    onCerrar={(resultado) => cerrarLead(l, resultado)}
                    onReabrir={() => reabrirLead(l)}
                    accionEnCurso={accionId === l.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Sección 2: Visitas por confirmar ─────────────────────────── */}
          <section>
            <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Visitas por confirmar</h2>
            {loadingVisitas && visitas.length === 0 ? (
              <SeccionVacia>Cargando visitas…</SeccionVacia>
            ) : visitas.length === 0 ? (
              <SeccionVacia>No hay visitas pendientes por confirmar.</SeccionVacia>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
                {visitas.map(v => (
                  <VisitaCard
                    key={v.id}
                    visita={v}
                    edit={edits[v.id] || { asignado: v.asignado_a || 'Roberto', horario: v.horario_propuesto || '' }}
                    onChange={next => setEdits(prev => ({ ...prev, [v.id]: next }))}
                    onConfirm={() => confirmarVisita(v)}
                    onCancel={() => cancelarVisita(v)}
                    saving={savingId === v.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Sección 2b: Visitas confirmadas ──────────────────────────────
              La sección que faltaba. Hasta ahora una visita desaparecía del
              panel en el momento de confirmarla, que es justo cuando pasa a
              ser un compromiso con un cliente: no había forma de saber qué
              venía ni de cerrar el ciclo. */}
          <section>
            <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Visitas confirmadas</h2>
            {loadingVisitas && confirmadas.length === 0 ? (
              <SeccionVacia>Cargando visitas…</SeccionVacia>
            ) : confirmadas.length === 0 ? (
              <SeccionVacia>No hay visitas confirmadas por realizar.</SeccionVacia>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
                {confirmadas.map(v => (
                  <VisitaConfirmadaCard
                    key={v.id}
                    visita={v}
                    onRealizada={() => marcarRealizada(v)}
                    onCancel={() => cancelarVisita(v)}
                    saving={savingId === v.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Sección 3: Métricas ───────────────────────────────────────── */}
          <MetricsSection metrics={metrics} loading={loadingMetrics} />
        </div>
      </div>

      {/* ── Modal editar lead ──────────────────────────────────────────────── */}
      {editingLead && (
        <EditLeadModal
          lead={editingLead}
          onSave={saveLead}
          onCancel={() => { setEditingLead(null); setEditError(null) }}
          saving={editSaving}
          error={editError}
        />
      )}
    </div>
  )
}
