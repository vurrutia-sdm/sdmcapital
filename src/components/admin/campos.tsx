// Campos de formulario del admin: inputs controlados y su envoltorio de
// etiqueta.
//
// `Inp` y `Txa` mantienen el valor en estado local y solo llaman a `onChange`
// en el `onBlur`. No es un detalle cosmético: evita que el panel entero se
// re-renderice con cada tecla.
//
// Todos van a nivel de módulo. Ver la nota en `layout.tsx`.

import { useState, useEffect, useRef } from 'react'

export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex flex-col gap-2"><label className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{label}</label>{children}</div>
}

export function Inp({ value, onChange, type = 'text', placeholder = '', min, max }: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: number
  max?: number
}) {
  const [local, setLocal] = useState(String(value ?? ''))
  const prevValue = useRef(String(value ?? ''))
  useEffect(() => {
    const str = String(value ?? '')
    if (str !== prevValue.current) {
      setLocal(str)
      prevValue.current = str
    }
  }, [value])
  return (
    <input
      type={type}
      value={local}
      placeholder={placeholder}
      min={min}
      max={max}
      className="input-line"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onChange(local) }}
    />
  )
}

export function Txa({ value, onChange, rows = 3, placeholder }: {
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}) {
  const [local, setLocal] = useState(value ?? '')
  const prevValue = useRef(value ?? '')
  useEffect(() => {
    if (value !== prevValue.current) {
      setLocal(value ?? '')
      prevValue.current = value ?? ''
    }
  }, [value])
  return (
    <textarea
      value={local}
      rows={rows}
      placeholder={placeholder}
      className="input-line resize-none"
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { prevValue.current = local; onChange(local) }}
    />
  )
}

export function Chk({ label, checked, onChange }: { label: React.ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 cursor-pointer text-sdm-base" style={{ color: 'var(--muted)' }}><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: 'var(--green)', width: 15, height: 15 }} />{label}</label>
}

export function Sel({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return <select value={value} onChange={e => onChange(e.target.value)} className="input-line" style={{ cursor: 'pointer' }}>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
}
