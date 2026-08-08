// Campos de formulario del admin: inputs controlados y su envoltorio de
// etiqueta.
//
// `Inp` y `Txa` mantienen el valor en estado local y solo llaman a `onChange`
// en el `onBlur`. No es un detalle cosmético: evita que el panel entero se
// re-renderice con cada tecla.
//
// Todos van a nivel de módulo. Ver la nota en `layout.tsx`.

import { useState, useEffect, useRef, useId } from 'react'

// `Field` ENVUELVE a su control. Un <label> que contiene a su campo lo asocia
// sin `htmlFor` y sin `id`, y sin ids no hay ninguno que pueda colisionar.
//
// EL ESTILO DEL ROTULO VA EN EL <span>, NUNCA EN EL <label>.
//
// `text-transform` y `letter-spacing` son propiedades HEREDADAS, y se aplican
// al texto que el usuario escribe dentro de un input. `.input-line` no fija
// ninguna de las dos. Subirlas al <label> que ahora envuelve deja todo lo
// tecleado en MAYUSCULAS y con 2px de separacion entre letras, en los 152
// campos del admin de una sola vez. No falla el build ni salta en consola: se
// descubre escribiendo.
//
// Solo sirve para un control etiquetable. Para `ImageUploader`,
// `RichTextEditor` y `PropImageManager` va `FieldGroup`, que no usa <label>.
export function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{label}</span>
      {children}
    </label>
  )
}

// La variante de `Field` para lo que NO es un control etiquetable: los
// editores compuestos —`ImageUploader`, `RichTextEditor`,
// `PropImageManager`—. Se ve exactamente igual que un `Field`.
//
// POR QUE NO PUEDE SER UN <label>
//
// `ImageUploader` y `PropImageManager` traen DENTRO su propio <label>
// envolviendo un <input type="file"> oculto. Un <label> por fuera anida
// etiquetas —invalido— y, peor, apunta al primer descendiente etiquetable, que
// es justamente ese selector de archivos: pulsar el rotulo "Foto del destino"
// abriria el dialogo de subida. `ImageUploader` ademas tiene un segundo
// control, el input de solo lectura con la URL, y un <label> solo asocia al
// primero.
//
// El id sale de `useId()` y no se escribe a mano: varios de estos se montan
// mas de una vez en la misma pagina —los 8 de `Barranco`, los 5 de
// `Contenido`— y dos ids iguales no fallan, se asocian al primero y dejan al
// resto sin nombre, en silencio.
export function FieldGroup({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const labelId = useId()
  return (
    <div className="flex flex-col gap-2" role="group" aria-labelledby={labelId}>
      <span id={labelId} className="text-sdm-xs tracking-sdm-wide" style={{ textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>{label}</span>
      {children}
    </div>
  )
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
