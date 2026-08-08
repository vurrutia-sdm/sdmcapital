// Acciones y etiquetas de estado del admin.
//
// `SaveBtn` es el botón de guardar que usan casi todos los paneles; `Badge` es
// la píldora de color para estados (publicado, activo, destacado…); `Guardado`
// es la confirmación que sale tras guardar, y `useGuardado` su temporizador.
//
// Todos a nivel de módulo. Ver la nota en `layout.tsx`.

import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'

export function SaveBtn({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return <button onClick={onClick} disabled={loading} className="btn-green" style={{ alignSelf: 'flex-start' }}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
}

export function Badge({ label, color }: { label: string; color: string }) {
  return <span className="text-sdm-xs" style={{ padding: '3px 10px', borderRadius: 2, background: color, color: '#fff' }}>{label}</span>
}

// Confirmación de guardado. Un solo texto y una sola forma para los catorce
// paneles: la consistencia importa más que afinar el mensaje por panel.
//
// Existe porque nueve paneles cerraban el formulario en silencio, y en un admin
// que ya tuvo pérdida silenciosa de datos el silencio se lee igual que un fallo
// que no avisó.
//
// `useGuardado` trae el estado y el temporizador, que estaban copiados en cada
// panel con duraciones distintas (2000 ms en uno, 2500 en el resto). Ahora son
// 2500 en todos.
export function Guardado({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <span className="text-sdm-base" style={{ color: 'var(--green)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <Check size={14} strokeWidth={2} />Guardado correctamente
    </span>
  )
}

export function useGuardado(): [boolean, () => void] {
  const [visible, setVisible] = useState(false)
  const reloj = useRef<ReturnType<typeof setTimeout>>()
  useEffect(() => () => clearTimeout(reloj.current), [])
  const avisar = () => {
    setVisible(true)
    clearTimeout(reloj.current)
    reloj.current = setTimeout(() => setVisible(false), 2500)
  }
  return [visible, avisar]
}
