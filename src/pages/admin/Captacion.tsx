import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Check, X, Pencil, Trash2, Bell, CalendarCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { avisarError } from '@/lib/errores'

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

type MetricsData = {
  leadsHoy: number
  leadsSemana: number
  leadsMes: number
  leadsTotal: number
  hot: number
  warm: number
  cold: number
  visitasPendientes: number
  visitasConfirmadas: number
  visitasRealizadas: number
  compra: number
  arriendo: number
  conversion: number
  topComunas: { comuna: string; count: number }[]
  // Cuántas comunas distintas hubo en el mes. `topComunas` solo trae las 5 más
  // buscadas, y sin este total la lista no puede decir de cuántas salieron.
  comunasTotal: number
}

type ScoreFilter = 'todos' | 'hot' | 'warm' | 'cold'
type NotifValue = 'todos' | 'solo_hot'

type EditLeadDraft = {
  nombre: string
  contacto: string
  score: string
  status: string
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

// ── El estado que se muestra sale del cruce con `visitas` ─────────────────────
//
// `leads.status` LO ESCRIBE EL WORKER DE SOFÍA. El panel no se suma como
// segundo escritor: antes de agregar cualquier `update({ status })` hay que
// leer `index.js:1750`, donde el Worker lee ese mismo campo.
//
// El problema que resuelve esto: al cancelar una visita solo se escribe
// `visitas.estado='cancelada'`, así que un lead que tenía `visita_pendiente` se
// queda con esa etiqueta para siempre y el panel afirma que hay una visita por
// coordinar que ya no existe. La corrección es de LECTURA: se cruza con la
// última visita del lead y se muestra la verdad, sin tocar `leads`.

const STATUS_LABEL: Record<string, string> = {
  nuevo: 'Nuevo',
  calificando: 'Calificando',
  derivado: 'Derivado',
  visita_pendiente: 'Visita pendiente',
  visita_confirmada: 'Visita confirmada',
  cerrado: 'Cerrado',
  perdido: 'Perdido',
}

const VISITA_LABEL: Record<string, string> = {
  pendiente: 'Visita pendiente',
  confirmada: 'Visita confirmada',
  cancelada: 'Visita cancelada',
  realizada: 'Visita realizada',
}

// Los dos únicos `status` que hablan de una visita, y por lo tanto los únicos
// que la visita puede contradecir. Un lead `cerrado` o `perdido` es una
// afirmación más fuerte que el estado de su visita y NO se pisa.
const STATUS_DE_VISITA = new Set(['visita_pendiente', 'visita_confirmada'])

type UltimaVisita = { estado: string; created_at: string | null }

function estadoLead(lead: Lead, ultima: UltimaVisita | undefined) {
  const crudo = lead.status || ''
  const propio = STATUS_LABEL[crudo] || fmt(lead.status)
  if (!ultima || !STATUS_DE_VISITA.has(crudo)) return { texto: propio, contradice: false }

  const deVisita = VISITA_LABEL[ultima.estado]
  if (!deVisita) return { texto: propio, contradice: false }

  const coincide =
    (crudo === 'visita_pendiente'  && ultima.estado === 'pendiente') ||
    (crudo === 'visita_confirmada' && ultima.estado === 'confirmada')
  return { texto: deVisita, contradice: !coincide }
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
      background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6,
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
    status: lead.status || '',
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

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Rotulo>Estado</Rotulo>
          <select className="text-sdm-base" value={draft.status} onChange={e => upd('status', e.target.value)}
            style={CAMPO}>
            <option value="">—</option>
            <option value="nuevo">Nuevo</option>
            <option value="calificando">Calificando</option>
            <option value="derivado">Derivado</option>
            <option value="visita_pendiente">Visita pendiente</option>
            <option value="visita_confirmada">Visita confirmada</option>
            <option value="cerrado">Cerrado</option>
            <option value="perdido">Perdido</option>
          </select>
        </label>

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto', padding: 14, background: COLORS.bg, borderRadius: 6 }}>
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
              🎤 Nota de voz
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
      <div className="text-sdm-sm" style={{ color: COLORS.red, background: '#fde2e1', borderRadius: 6, padding: '12px 14px' }}>
        No se pudo cargar la conversación: {error}
      </div>
    )
  }

  if (!mensajes.length) {
    return <div className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>Sin mensajes todavía.</div>
  }

  return (
    <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 460, overflowY: 'auto', padding: 14, background: COLORS.bg, borderRadius: 6 }}>
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
        <span className="text-sdm-2xl" style={{ lineHeight: 1 }}>{isManual ? '✋' : '🤖'}</span>
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
        style={{ padding: '12px 22px', fontWeight: 700, borderRadius: 6, fontFamily: 'inherit', border: 'none', color: '#fff', whiteSpace: 'nowrap',
          cursor: togglingModo ? 'default' : 'pointer',
          // `--lead-warm` como FONDO con texto blanco encima: 5.18:1. Acá el
          // ámbar significa precaución —vas a pausar a Sofía—, no prioridad
          // media de un lead. Se reutiliza el token en vez de duplicar el
          // valor bajo otro nombre; antes era `#c8740a` y daba 3.52:1.
          background: isManual ? COLORS.greenDark : 'var(--lead-warm)',
          opacity: togglingModo ? 0.6 : 1,
          boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }}>
        {togglingModo ? 'Guardando…' : isManual ? '🤖 Devolver a Sofía' : '✋ Tomar control'}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: `1px solid ${COLORS.border}`, borderTop: `2px solid ${COLORS.green}`, borderRadius: 6, padding: 12 }}>
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

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="text-sdm-2xl" style={{ fontWeight: 700, color: color || COLORS.navy, lineHeight: 1 }}>{value}</span>
      <span className="text-sdm-sm" style={{ color: COLORS.muted }}>{label}</span>
    </div>
  )
}

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
      <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  )
}

function ProportionBar({ a, b }: { a: number; b: number }) {
  const total = a + b
  const pctA = total > 0 ? (a / total) * 100 : 50
  return (
    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: COLORS.bg }}>
      <div style={{ width: `${pctA}%`, background: COLORS.navy }} />
      <div style={{ width: `${100 - pctA}%`, background: COLORS.border }} />
    </div>
  )
}

function MetricsSection({ metrics, loading }: { metrics: MetricsData | null; loading: boolean }) {
  const m: MetricsData = metrics || {
    leadsHoy: 0, leadsSemana: 0, leadsMes: 0, leadsTotal: 0,
    hot: 0, warm: 0, cold: 0,
    visitasPendientes: 0, visitasConfirmadas: 0, visitasRealizadas: 0,
    compra: 0, arriendo: 0, conversion: 0, topComunas: [], comunasTotal: 0,
  }

  return (
    <section>
      <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Métricas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
        <MetricCard title="Leads nuevos">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Hoy" value={m.leadsHoy} />
            <Stat label="7 días" value={m.leadsSemana} />
            <Stat label="Este mes" value={m.leadsMes} />
          </div>
        </MetricCard>

        <MetricCard title="Calificación (este mes)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Hot" value={m.hot} color={SCORE_STYLE.hot.fg} />
            <Stat label="Warm" value={m.warm} color={SCORE_STYLE.warm.fg} />
            <Stat label="Cold" value={m.cold} color={SCORE_STYLE.cold.fg} />
          </div>
        </MetricCard>

        <MetricCard title="Visitas">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Pendientes" value={m.visitasPendientes} color={VISITA_ESTADO_STYLE.pendientes} />
            <Stat label="Confirmadas" value={m.visitasConfirmadas} color={VISITA_ESTADO_STYLE.confirmadas} />
            <Stat label="Realizadas" value={m.visitasRealizadas} color={VISITA_ESTADO_STYLE.realizadas} />
          </div>
        </MetricCard>

        <MetricCard title="Compra vs. arriendo (este mes)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Stat label="Compra" value={m.compra} />
            <Stat label="Arriendo" value={m.arriendo} />
          </div>
          <ProportionBar a={m.compra} b={m.arriendo} />
        </MetricCard>

        <MetricCard title="Conversión lead → visita">
          <span className="text-sdm-display-sm" style={{ fontWeight: 700, color: COLORS.navy }}>{m.conversion.toFixed(1)}%</span>
          <span className="text-sdm-sm" style={{ color: COLORS.muted }}>{m.visitasConfirmadas} confirmadas / {m.leadsTotal} leads totales</span>
        </MetricCard>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 20 }}>
        <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: COLORS.muted, fontWeight: 600, marginBottom: 12 }}>
          Comunas más buscadas (este mes)
        </div>
        {loading ? (
          <span className="text-sdm-sm" style={{ color: COLORS.muted, fontStyle: 'italic' }}>Cargando…</span>
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
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
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
function VisitaConfirmadaCard({ visita, onRealizada, saving }: {
  visita: VisitaConLead
  onRealizada: () => void
  saving: boolean
}) {
  const lead = visita.lead
  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
          {lead.brief}
        </div>
      )}

      <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 16 }}>
        {/* `minHeight: 44` explícito: con `padding 11px` y texto de 13 px el
            botón medía ~41 px y se quedaba corto del objetivo táctil. */}
        <button className="text-sdm-sm tracking-sdm-wide" type="button" onClick={onRealizada} disabled={saving}
          style={{ width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 4, padding: '11px 18px', fontWeight: 700,
            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, fontFamily: 'inherit' }}>
          <CalendarCheck size={15} aria-hidden="true" /> {saving ? 'Guardando…' : 'Marcar como realizada'}
        </button>
      </div>
    </div>
  )
}

// ── Sección 2: Leads recientes ───────────────────────────────────────────────
function LeadRow({ lead, ultimaVisita, expanded, onToggle, onEdit, onDelete, deleting, onModoChange }: {
  lead: Lead
  ultimaVisita: UltimaVisita | undefined
  expanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
  onModoChange: () => void
}) {
  const [detailTab, setDetailTab] = useState<DetailTab>('detalles')
  const [refreshSignal, setRefreshSignal] = useState(0)
  const estado = estadoLead(lead, ultimaVisita)

  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6, overflow: 'hidden', opacity: deleting ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer' }}>
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
          {/* El estado sale de `estadoLead`, no de `lead.status` a secas: si la
              última visita lo contradice, manda la visita. Sin `capitalize`
              porque las etiquetas ya vienen escritas — con él, `visita_pendiente`
              se pintaba como «Visita_pendiente», guion bajo incluido. */}
          <div className="text-sdm-sm" style={{ color: COLORS.navy }}>{estado.texto}</div>
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
                {/* Cuando la visita contradice al lead, se dice de dónde sale
                    cada cosa en vez de esconder una de las dos. El campo de la
                    base sigue siendo el que es, y quien mira el panel se entera
                    de que van desacompasados. */}
                <DRow label="Status" value={
                  estado.contradice
                    ? <>{estado.texto}<br /><span className="text-sdm-xs" style={{ color: COLORS.muted }}>el lead sigue marcado como «{fmt(lead.status)}»</span></>
                    : estado.texto
                } />
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
                  <div className="text-sdm-sm" style={{ color: COLORS.navy, lineHeight: 1.7, background: COLORS.bg, borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${COLORS.green}` }}>
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

  // ── Loaders ─────────────────────────────────────────────────────────────────
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
  }, [])

  // Recarga los leads sin tocar loadingLeads, para no disparar el indicador
  // "Cargando…" al cambiar de modo o enviar un mensaje manual.
  const loadLeadsQuiet = useCallback(async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .limit(100)
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
    if (!ids.length) { setUltimasVisitas({}); return }

    const { data: vs, error } = await supabase
      .from('visitas')
      .select('lead_id, estado, created_at')
      .in('lead_id', ids)
      .order('created_at', { ascending: false })

    // Sin `avisarError`: esto es una lectura de apoyo y corre cada 25 s con el
    // refresco automático. Un fallo acá no puede levantar un alert() encima de
    // quien está trabajando. Si falla, el mapa se queda como estaba y el panel
    // muestra `lead.status` a secas, que es el comportamiento anterior.
    if (error) { console.error('[No se pudo leer las visitas de los leads]', error); return }

    const mapa: Record<string, UltimaVisita> = {}
    for (const v of (vs as { lead_id: string | null; estado: string; created_at: string | null }[]) || []) {
      if (!v.lead_id || mapa[v.lead_id]) continue
      mapa[v.lead_id] = { estado: v.estado, created_at: v.created_at }
    }
    setUltimasVisitas(mapa)
  }, [])

  const loadLeads = useCallback(async () => {
    setLoadingLeads(true)
    await loadLeadsQuiet()
    setLoadingLeads(false)
  }, [loadLeadsQuiet])

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true)

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      leadsHoyRes,
      leadsSemanaRes,
      leadsTotalRes,
      leadsMesRes,
      visitasPendientesRes,
      visitasConfirmadasRes,
      visitasRealizadasRes,
    ] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
      supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek),
      supabase.from('leads').select('id', { count: 'exact', head: true }),
      supabase.from('leads').select('score, intencion, comuna').gte('created_at', startOfMonth),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('estado', 'confirmada'),
      supabase.from('visitas').select('id', { count: 'exact', head: true }).eq('estado', 'realizada'),
    ])

    const leadsMesArr = (leadsMesRes.data as Pick<Lead, 'score' | 'intencion' | 'comuna'>[]) || []

    let hot = 0, warm = 0, cold = 0, compra = 0, arriendo = 0
    const comunaCounts: Record<string, number> = {}
    for (const l of leadsMesArr) {
      if (l.score === 'hot') hot++
      else if (l.score === 'warm') warm++
      else if (l.score === 'cold') cold++

      const intencion = (l.intencion || '').toLowerCase()
      if (intencion.includes('arriendo')) arriendo++
      else if (intencion.includes('compra') || intencion.includes('venta')) compra++

      const comuna = l.comuna?.trim()
      if (comuna) comunaCounts[comuna] = (comunaCounts[comuna] || 0) + 1
    }

    const topComunas = Object.entries(comunaCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([comuna, count]) => ({ comuna, count }))

    const leadsTotal = leadsTotalRes.count || 0
    const visitasConfirmadas = visitasConfirmadasRes.count || 0
    const conversion = leadsTotal > 0 ? (visitasConfirmadas / leadsTotal) * 100 : 0

    setMetrics({
      leadsHoy: leadsHoyRes.count || 0,
      leadsSemana: leadsSemanaRes.count || 0,
      leadsMes: leadsMesArr.length,
      leadsTotal,
      hot, warm, cold,
      visitasPendientes: visitasPendientesRes.count || 0,
      visitasConfirmadas,
      visitasRealizadas: visitasRealizadasRes.count || 0,
      compra, arriendo,
      conversion,
      topComunas,
      comunasTotal: Object.keys(comunaCounts).length,
    })
    setLoadingMetrics(false)
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

    if (v.lead_id) {
      // La visita ya quedó confirmada; si el lead no se actualiza hay que
      // avisarlo igual, porque los dos registros quedan descoordinados.
      const { error: errLead } = await supabase.from('leads').update({ status: 'visita_confirmada' }).eq('id', v.lead_id)
      avisarError('La visita se confirmó, pero no se pudo actualizar el estado del lead', errLead)
    }
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
    //   4. `leads.status` NO se toca, a propósito: ese campo lo escribe el
    //      Worker de Sofía y el panel no se suma como segundo escritor. La
    //      etiqueta que quedaría desfasada se corrige AL LEER, cruzando con la
    //      última visita — ver `estadoLead`.
    //
    // Si algún día el worker empieza a reaccionar al estado, este texto miente.
    const quien = v.lead?.nombre?.trim() || v.lead?.wa_phone?.trim() || 'este lead'
    if (!confirm(
      `¿Cancelar la visita de ${quien}?\n\n` +
      'Queda marcada como cancelada y desaparece de esta lista. El registro no se borra.\n\n' +
      'Al cliente no le llega ningún aviso: si ya habías coordinado con él, avísale tú por WhatsApp.'
    )) return
    setSavingId(v.id)
    const { error } = await supabase.from('visitas').update({ estado: 'cancelada' }).eq('id', v.id)
    setSavingId(null)
    if (avisarError('No se pudo cancelar la visita', error)) return
    loadVisitas()
    // También los leads: el estado que muestra la fila sale del cruce con la
    // última visita, así que sin esto la lista seguiría diciendo «Visita
    // pendiente» hasta el refresco automático de los 25 s.
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
    //   5. `leads.status` no se toca: lo escribe el Worker. La fila del lead
    //      pasará a decir «Visita realizada» por el cruce de `estadoLead`.
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
      status:      draft.status      || null,
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
        <button className="text-sdm-sm tracking-sdm-wide" onClick={loadAll}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.navy, color: '#fff', border: 'none', borderRadius: 2, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <RefreshCw size={15} /> Actualizar
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Interruptor de notificaciones ──────────────────────────────── */}
        <NotifToggle value={notifValue} onChange={saveNotifConfig} saving={savingNotif} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
          {/* ── Sección 0: Métricas ───────────────────────────────────────── */}
          <MetricsSection metrics={metrics} loading={loadingMetrics} />

          {/* ── Sección 1: Visitas por confirmar ─────────────────────────── */}
          <section>
            <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Visitas por confirmar</h2>
            {loadingVisitas && visitas.length === 0 ? (
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted, fontStyle: 'italic' }}>Cargando visitas…</div>
            ) : visitas.length === 0 ? (
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '48px 0', color: COLORS.muted, fontStyle: 'italic', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                No hay visitas pendientes por confirmar.
              </div>
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

          {/* ── Sección 1b: Visitas confirmadas ──────────────────────────────
              La sección que faltaba. Hasta ahora una visita desaparecía del
              panel en el momento de confirmarla, que es justo cuando pasa a
              ser un compromiso con un cliente: no había forma de saber qué
              venía ni de cerrar el ciclo. */}
          <section>
            <h2 className="text-sdm-xl" style={{ fontWeight: 700, color: COLORS.navy, marginBottom: 16 }}>Visitas confirmadas</h2>
            {loadingVisitas && confirmadas.length === 0 ? (
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted, fontStyle: 'italic' }}>Cargando visitas…</div>
            ) : confirmadas.length === 0 ? (
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '48px 0', color: COLORS.muted, fontStyle: 'italic', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                No hay visitas confirmadas por realizar.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
                {confirmadas.map(v => (
                  <VisitaConfirmadaCard
                    key={v.id}
                    visita={v}
                    onRealizada={() => marcarRealizada(v)}
                    saving={savingId === v.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Sección 2: Leads recientes ────────────────────────────────── */}
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
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '40px 0', color: COLORS.muted, fontStyle: 'italic' }}>Cargando leads…</div>
            ) : filteredLeads.length === 0 ? (
              <div className="text-sdm-base" style={{ textAlign: 'center', padding: '48px 0', color: COLORS.muted, fontStyle: 'italic', background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                No hay leads para este filtro.
              </div>
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
                  />
                ))}
              </div>
            )}
          </section>
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
