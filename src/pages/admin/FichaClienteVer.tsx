import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
type Cliente = {
  id: string; nombre: string; telefono: string | null; correo: string | null
}

type Ficha = {
  id: string; cliente_id: string
  tipo: string | null; operacion: string | null; direccion: string | null
  precio_uf: number | null; sup_util: number | null; sup_total: number | null
  dormitorios: number | null; banos: number | null; estacionamientos: number | null
  descripcion: string | null
  asesor_nombre: string | null; asesor_telefono: string | null; asesor_correo: string | null
  fotos: string[]; created_at: string
}

// ── SVG icons (print-safe) ────────────────────────────────────────────────────
const BedSvg = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20v-8a2 2 0 012-2h16a2 2 0 012 2v8"/><path d="M4 10V6a2 2 0 012-2h12a2 2 0 012 2v4"/><path d="M12 10H2"/><path d="M22 20H2"/></svg>
const BathSvg = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 000 2.121l.293.293"/><path d="M2 12h20v2a6 6 0 01-6 6H8a6 6 0 01-6-6v-2z"/><path d="M5 12V7a1 1 0 011-1h2"/></svg>
const CarSvg = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h16a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><rect x="5" y="15" width="14" height="4" rx="1"/><path d="M7 17h10"/></svg>
const AreaSvg = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>

// ── Spec cell ─────────────────────────────────────────────────────────────────
function SpecCell({ icon, value, label }: { icon: React.ReactNode; value: string | number | null; label: string }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 14px', border: '1px solid #e0e4ea', borderRadius: 4, minWidth: 72, background: '#fff' }}>
      <div style={{ color: 'var(--green-dark)' }}>{icon}</div>
      <span className="text-sdm-lg" style={{ fontWeight: 600, color: 'var(--navy-dark)', lineHeight: 1 }}>{value}</span>
      <span className="text-sdm-xs tracking-sdm-wide" style={{ color: 'var(--muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FichaClienteVer() {
  const { authed, checking } = useAdminAuth()
  const { clienteId, fichaId } = useParams<{ clienteId: string; fichaId: string }>()

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ficha, setFicha] = useState<Ficha | null>(null)
  const [loading, setLoading] = useState(true)
  const [imgsReady, setImgsReady] = useState(false)

  useEffect(() => {
    if (!authed || !fichaId || !clienteId) return
    const load = async () => {
      setLoading(true)
      const [{ data: f }, { data: c }] = await Promise.all([
        supabase.from('ficha_propiedades').select('*').eq('id', fichaId).single(),
        supabase.from('ficha_clientes').select('*').eq('id', clienteId).single(),
      ])
      setFicha(f as Ficha | null)
      setCliente(c as Cliente | null)
      setLoading(false)

      // Preload photos
      if (f && (f as Ficha).fotos?.length > 0) {
        await Promise.all(
          (f as Ficha).fotos.map(url => new Promise<void>(res => {
            const img = new Image(); img.onload = img.onerror = () => res(); img.src = url
          }))
        )
      }
      setImgsReady(true)
    }
    load()
  }, [authed, fichaId, clienteId])

  if (checking) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-dark)' }}>
      <span className="text-sdm-xl" style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>Verificando sesión…</span>
    </div>
  )
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-dark)' }}>
      <div style={{ background: '#fff', padding: 40, borderRadius: 4, textAlign: 'center' }}>
        <p style={{ marginBottom: 16, color: 'var(--navy-dark)' }}>Debes iniciar sesión.</p>
        <Link to="/admin" style={{ color: 'var(--navy-dark)', fontWeight: 600 }}>← Volver al admin</Link>
      </div>
    </div>
  )

  const today = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .doc-print-wrapper { display: block !important; }
          .page-1 { page-break-after: always; break-after: always; }
          @page { margin: 0; size: A4 portrait; }
        }
        .pe { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      {/* ── Admin UI (no-print) ── */}
      <div className="no-print" style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link className="text-sdm-sm" to={`/admin/ficha-cliente/${clienteId}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Volver al cliente
          </Link>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span className="text-sdm-lg" style={{ fontWeight: 600, color: 'var(--navy-dark)' }}>
            {ficha?.direccion || 'Ficha de propiedad'}
          </span>
        </div>
        <button className="text-sdm-sm tracking-sdm-wide" onClick={() => window.print()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--navy-dark)', color: '#fff', border: 'none', borderRadius: 2, padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Printer aria-hidden="true" size={15} /> Imprimir / Guardar PDF
        </button>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="no-print" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--off)' }}>
          <span className="text-sdm-base" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>Cargando ficha…</span>
        </div>
      )}

      {/* ── Document ── */}
      {!loading && ficha && cliente && (
        <div className="doc-print-wrapper pe"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif', background: '#e8edf2', minHeight: '100vh' }}>

          {/* ═══ PAGE 1 ═══ */}
          <div className="page-1 pe" style={{ background: '#fff', maxWidth: 794, margin: '0 auto' }}>

            {/* HEADER */}
            <div className="pe" style={{ background: 'var(--navy-dark)', padding: '1rem 1.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Logo */}
              <div style={{ padding: 0 }}>
                <img src="/logo-sdm.png" style={{ height: '60px', width: 'auto', objectFit: 'contain', display: 'block' }} alt="SDM Capital" />
              </div>

              {/* Cliente */}
              <div style={{ textAlign: 'right' }}>
                <div className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: '#7a9ab8', marginBottom: 6 }}>CLIENTE</div>
                <div className="text-sdm-base" style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{cliente.nombre}</div>
                {cliente.telefono && <div className="text-sdm-sm" style={{ color: '#aabccc', marginBottom: 2 }}>{cliente.telefono}</div>}
                {cliente.correo && <div className="text-sdm-sm" style={{ color: '#aabccc' }}>{cliente.correo}</div>}
              </div>
            </div>

            {/* BODY */}
            <div style={{ padding: '28px 32px 24px' }}>

              {/* Badge */}
              {(ficha.tipo || ficha.operacion) && (
                <div style={{ marginBottom: 14 }}>
                  <span className="pe text-sdm-xs tracking-sdm-wide" style={{ display: 'inline-block', background: '#edf7f1', border: '1px solid #b6e4ca', color: '#1a6e3c', fontWeight: 700, textTransform: 'uppercase', padding: '4px 14px', borderRadius: 20 }}>
                    {[ficha.tipo, ficha.operacion].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}

              {/* Dirección */}
              <div className="text-sdm-2xl" style={{ fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 8, lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>
                {ficha.direccion || 'Propiedad SDM Capital'}
              </div>

              {/* Precio */}
              {ficha.precio_uf && (
                <div className="text-sdm-display-sm" style={{ fontWeight: 500, color: 'var(--navy-dark)', marginBottom: 20, fontFamily: 'Georgia, serif' }}>
                  UF {ficha.precio_uf.toLocaleString('es-CL')}
                </div>
              )}

              {/* Specs */}
              {(ficha.dormitorios || ficha.banos || ficha.sup_util || ficha.sup_total || ficha.estacionamientos) && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                  <SpecCell icon={<BedSvg />} value={ficha.dormitorios} label="Dormitorios" />
                  <SpecCell icon={<BathSvg />} value={ficha.banos} label="Baños" />
                  {ficha.sup_util && <SpecCell icon={<AreaSvg />} value={`${ficha.sup_util} m²`} label="Sup. Útil" />}
                  {ficha.sup_total && <SpecCell icon={<AreaSvg />} value={`${ficha.sup_total} m²`} label="Sup. Total" />}
                  <SpecCell icon={<CarSvg />} value={ficha.estacionamientos} label="Estac." />
                </div>
              )}

              {/* Descripción */}
              {ficha.descripcion && (
                <div style={{ marginBottom: 24 }}>
                  <div className="text-sdm-xs tracking-sdm-wide" style={{ fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Descripción</div>
                  {ficha.descripcion.split('\n').filter(l => l.trim()).map((p, i) => (
                    <p className="text-sdm-base" key={i} style={{ color: '#3a4353', lineHeight: 1.75, margin: '0 0 10px' }}>{p}</p>
                  ))}
                </div>
              )}
            </div>

            {/* CTA STRIP */}
            <div className="pe" style={{ background: 'var(--navy-dark)', padding: '18px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
              <div>
                <div className="text-sdm-base" style={{ fontWeight: 700, color: '#fff', marginBottom: 4, fontFamily: 'Georgia, serif' }}>
                  Tu búsqueda, en buenas manos.
                </div>
                <div className="text-sdm-sm" style={{ color: '#aabccc', lineHeight: 1.5 }}>
                  Escríbenos cuando quieras para resolver dudas o coordinar una visita.
                </div>
              </div>
              {(ficha.asesor_telefono || ficha.asesor_correo) && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {ficha.asesor_telefono && (
                    <div className="text-sdm-sm" style={{ color: '#fff', marginBottom: 4 }}>{ficha.asesor_telefono}</div>
                  )}
                  {ficha.asesor_correo && (
                    <div className="text-sdm-sm" style={{ color: '#aabccc' }}>{ficha.asesor_correo}</div>
                  )}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="pe" style={{ background: 'var(--off)', borderTop: '1px solid #e0e4ea', padding: '11px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-sdm-sm" style={{ color: 'var(--navy-dark)', fontWeight: 500 }}>
                {ficha.asesor_nombre ? `${ficha.asesor_nombre} · ` : ''}SDM Capital
              </span>
              <span className="text-sdm-xs" style={{ color: '#9aafc2' }}>
                Información sujeta a verificación · {today}
              </span>
            </div>
          </div>

          {/* ═══ PHOTOS PAGE ═══ */}
          {imgsReady && ficha.fotos && ficha.fotos.length > 0 && (
            <div className="pe" style={{ background: '#fff', maxWidth: 794, margin: '0 auto' }}>

              {/* Gallery header */}
              <div className="pe" style={{ background: '#162e4a', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="text-sdm-sm tracking-sdm-wide" style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                  Fotografías de la propiedad
                </span>
                <span className="text-sdm-xs tracking-sdm-wide" style={{ color: '#7a9ab8' }}>
                  {ficha.fotos.length} {ficha.fotos.length === 1 ? 'fotografía' : 'fotografías'}
                </span>
              </div>

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: '#162e4a' }}>
                {ficha.fotos.map((url, i) => (
                  <div key={i} style={{ aspectRatio: '4/3', overflow: 'hidden', background: 'var(--navy-dark)' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
