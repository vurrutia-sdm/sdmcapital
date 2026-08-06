import { useState, useEffect, useRef } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Building2, ClipboardList, CreditCard, FileText, HeartHandshake, Image, KeyRound, Lock, MessageCircle, PenLine, Tag, Users } from 'lucide-react'
import { Check, ExternalLink, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { subirImagen } from '@/lib/subirImagen'
import Mensajes from '@/pages/admin/Mensajes'
import Blog from '@/pages/admin/Blog'
import Equipo from '@/pages/admin/Equipo'
import Asociados from '@/pages/admin/Asociados'
import PaginasLegales from '@/pages/admin/PaginasLegales'
import Contenido from '@/pages/admin/Contenido'
import Barranco from '@/pages/admin/Barranco'
import Rental from '@/pages/admin/Rental'
import Vende from '@/pages/admin/Vende'
import Propiedades from '@/pages/admin/Propiedades'
import { CotizacionesAdmin } from '@/components/cotizaciones/CotizacionesAdmin'
import { TarjetasEquipo } from '@/components/tarjetas/TarjetasEquipo'

type Tab = 'propiedades' | 'blog' | 'equipo' | 'asociados' | 'mensajes' | 'contenido' | 'fotos' | 'barranco' | 'cotizaciones' | 'tarjetas' | 'legal' | 'rental' | 'vende'

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-dark)' }}>
      <div className="bg-white p-12 w-full max-w-sm" style={{ borderRadius: 2 }}>
        <div className="logo-stripes mb-6"><div className="logo-stripe logo-stripe--sky" /><div className="logo-stripe logo-stripe--green" /><div className="logo-stripe logo-stripe--navy" /></div>
        <h1 className="font-serif font-light mb-1" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Admin</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>SDM Capital · Panel de gestión</p>
        <form onSubmit={login} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-line" placeholder="admin@sdmcapital.cl" />
          </div>
          <div className="flex flex-col gap-2">
            <label style={{ fontSize: 11, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)' }}>Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-line" placeholder="••••••••" />
          </div>
          {error && <p style={{ fontSize: 13, color: '#E24B4A' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary justify-center mt-2">{loading ? 'Ingresando…' : 'Ingresar →'}</button>
        </form>
      </div>
    </div>
  )
}

// ─── FOTOS ────────────────────────────────────────────────────────────────────
function FotosAdmin() {
  const [files, setFiles]   = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState('')

  const load = async () => {
    const { data } = await supabase.storage.from('imagenes').list('', { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
    if (data) setFiles(data.filter(f => f.name !== '.emptyFolderPlaceholder').map(f => ({ name: f.name, url: supabase.storage.from('imagenes').getPublicUrl(f.name).data.publicUrl })))
  }
  useEffect(() => { load() }, [])

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await subirImagen(file, 'general')
    setUploading(false); load()
  }

  const del = async (name: string) => {
    if (!confirm('¿Eliminar esta imagen?')) return
    await supabase.storage.from('imagenes').remove([name]); load()
  }

  const copy = (url: string) => {
    navigator.clipboard.writeText(url); setCopied(url)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif font-light" style={{ fontSize: 30, color: 'var(--navy-dark)' }}>Gestión de imágenes</h2>
      </div>
      <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-8">
        <h3 style={{ fontSize: 18, fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 8 }}>Subir nueva imagen</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.7 }}>Sube fotos y copia la URL para usarla donde necesites.</p>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: uploading ? 'var(--muted)' : 'var(--navy-dark)', color: '#fff', padding: '11px 24px', borderRadius: 2, cursor: uploading ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          {uploading ? 'Subiendo…' : '+ Seleccionar imagen'}
          <input type="file" accept="image/*" onChange={upload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>
      {files.length === 0
        ? <div className="text-center py-16" style={{ fontSize: 15, color: 'var(--muted)', fontStyle: 'italic' }}>No hay imágenes. Sube la primera.</div>
        : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(f => (
              <div key={f.name} className="bg-white border border-[#e8edf2] rounded-sm overflow-hidden">
                <div style={{ height: 140, background: 'var(--off)', overflow: 'hidden' }}>
                  <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => copy(f.url)} style={{ flex: 1, fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', padding: '7px 0', borderRadius: 2, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: copied === f.url ? 'var(--green)' : 'var(--navy-dark)', color: '#fff', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {copied === f.url ? <><Check size={14} strokeWidth={2} />Copiada</> : 'Copiar URL'}
                    </button>
                    <button onClick={() => del(f.name)} style={{ fontSize: 12, padding: '7px 10px', borderRadius: 2, border: '1px solid #fca5a5', cursor: 'pointer', background: 'none', color: '#E24B4A', fontFamily: 'inherit', display: 'flex', alignItems: 'center' }}><X size={14} strokeWidth={2} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
const DEFAULT_TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: 'propiedades',  label: 'Propiedades',     icon: Building2 },
  { key: 'cotizaciones', label: 'Cotizaciones',    icon: ClipboardList },
  { key: 'blog',         label: 'Blog',            icon: FileText },
  { key: 'equipo',       label: 'Equipo',          icon: Users },
  { key: 'asociados',    label: 'Asociados',       icon: HeartHandshake },
  { key: 'mensajes',     label: 'Mensajes',        icon: MessageCircle },
  { key: 'contenido',    label: 'Textos del sitio',icon: PenLine },
  { key: 'fotos',        label: 'Imágenes',        icon: Image },
  { key: 'barranco',     label: 'El Barranco',     icon: Building2 },
  { key: 'tarjetas',     label: 'Tarjetas',        icon: CreditCard },
  { key: 'legal',        label: 'Páginas Legales', icon: Lock },
  { key: 'rental',       label: 'Rental',          icon: KeyRound },
  { key: 'vende',        label: 'Vende con nosotros', icon: Tag },
]

const STORAGE_KEY = 'sdm_admin_tab_order'

function loadTabOrder() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_TABS
    const order: string[] = JSON.parse(saved)
    const sorted = order.map(key => DEFAULT_TABS.find(t => t.key === key)).filter(Boolean) as typeof DEFAULT_TABS
    DEFAULT_TABS.forEach(t => { if (!sorted.find(s => s.key === t.key)) sorted.push(t) })
    return sorted
  } catch { return DEFAULT_TABS }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { authed, checking } = useAdminAuth()
  const [tab, setTab] = useState<Tab>('propiedades')
  const [tabs, setTabs] = useState(loadTabOrder)
  const dragTab = useRef<number | null>(null)
  const dragOverTab = useRef<number | null>(null)

  const onTabDragStart = (i: number) => { dragTab.current = i }
  const onTabDragEnter = (i: number) => { dragOverTab.current = i }
  const onTabDragEnd   = () => {
    if (dragTab.current === null || dragOverTab.current === null) return
    const next = [...tabs]
    const dragged = next.splice(dragTab.current, 1)[0]
    next.splice(dragOverTab.current, 0, dragged)
    dragTab.current = null; dragOverTab.current = null
    setTabs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map(t => t.key)))
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy-dark)' }}><div className="font-serif italic" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Verificando sesión…</div></div>
  if (!authed)  return <LoginForm />

  return (
    <div className="min-h-screen" style={{ background: 'var(--off)' }}>
      <div className="bg-white border-b border-[#e8edf2] px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="logo-stripes"><div className="logo-stripe logo-stripe--sky"/><div className="logo-stripe logo-stripe--green"/><div className="logo-stripe logo-stripe--navy"/></div>
          <div>
            <div className="font-serif" style={{ fontSize: 18, color: 'var(--navy-dark)', letterSpacing: '2px' }}>SDM Capital</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Panel Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <a href="/" target="_blank" style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ver sitio <ExternalLink size={14} strokeWidth={2} /></a>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Cerrar sesión</button>
        </div>
      </div>

      <div className="flex overflow-visible">
        <aside className="w-56 h-[calc(100vh-57px)] overflow-y-auto bg-white border-r border-[#e8edf2] py-6 flex-shrink-0 fixed top-[57px] left-0 z-30">
          <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="14" viewBox="0 0 10 14" fill="var(--muted)"><circle cx="2" cy="2" r="1.5"/><circle cx="8" cy="2" r="1.5"/><circle cx="2" cy="7" r="1.5"/><circle cx="8" cy="7" r="1.5"/><circle cx="2" cy="12" r="1.5"/><circle cx="8" cy="12" r="1.5"/></svg>
            Arrastra para ordenar
          </div>
          {tabs.map((t, i) => (
            <div key={t.key} draggable onDragStart={() => onTabDragStart(i)} onDragEnter={() => onTabDragEnter(i)} onDragEnd={onTabDragEnd}
              onClick={() => setTab(t.key)} className="flex items-center gap-3 transition-all duration-150"
              style={{ padding: '11px 16px', fontSize: 13, fontWeight: tab === t.key ? 600 : 300, color: tab === t.key ? 'var(--navy-dark)' : 'var(--muted)', background: tab === t.key ? 'var(--sky-pale)' : 'transparent', borderLeft: tab === t.key ? '3px solid var(--green)' : '3px solid transparent', cursor: 'grab', userSelect: 'none' }}>
              <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor" style={{ opacity: 0.3, flexShrink: 0 }}><circle cx="2" cy="2" r="1.5"/><circle cx="6" cy="2" r="1.5"/><circle cx="2" cy="6" r="1.5"/><circle cx="6" cy="6" r="1.5"/><circle cx="2" cy="10" r="1.5"/><circle cx="6" cy="10" r="1.5"/></svg>
              <t.icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
              {t.label}
            </div>
          ))}
          {/* ── Herramientas ── */}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--muted)', padding: '0 16px 8px' }}>Herramientas</div>
            <RouterLink to="/admin/ficha-cliente"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <FileText size={15} style={{ flexShrink: 0 }} />
              Ficha para cliente
            </RouterLink>
            <RouterLink to="/admin/agentes"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <Users size={15} style={{ flexShrink: 0 }} />
              Agentes
            </RouterLink>
            <RouterLink to="/admin/captacion"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', fontSize: 13, fontWeight: 300, color: 'var(--muted)', textDecoration: 'none', borderLeft: '3px solid transparent', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--navy-dark)'; (e.currentTarget as HTMLElement).style.background = 'var(--sky-pale)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
              <MessageCircle size={15} style={{ flexShrink: 0 }} />
              Captación
            </RouterLink>
          </div>
        </aside>

        <main className="flex-1 p-8 lg:p-10 min-w-0 ml-56">
          {tab === 'propiedades'  && <Propiedades />}
          {tab === 'cotizaciones' && <CotizacionesAdmin />}
          {tab === 'blog'         && <Blog />}
          {tab === 'equipo'       && <Equipo />}
          {tab === 'asociados'    && <Asociados />}
          {tab === 'mensajes'     && <Mensajes />}
          {tab === 'contenido'    && <Contenido />}
          {tab === 'fotos'        && <FotosAdmin />}
          {tab === 'barranco'     && <Barranco />}
          {tab === 'tarjetas'     && <TarjetasEquipo />}
          {tab === 'legal'        && <PaginasLegales />}
          {tab === 'rental'       && <Rental />}
          {tab === 'vende'        && <Vende />}
        </main>
      </div>
    </div>
  )
}