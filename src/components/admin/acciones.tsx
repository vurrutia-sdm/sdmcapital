// Acciones y etiquetas de estado del admin.
//
// `SaveBtn` es el botón de guardar que usan casi todos los paneles; `Badge` es
// la píldora de color para estados (publicado, activo, destacado…).
//
// Ambos a nivel de módulo. Ver la nota en `layout.tsx`.

export function SaveBtn({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return <button onClick={onClick} disabled={loading} className="btn-green" style={{ alignSelf: 'flex-start' }}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
}

export function Badge({ label, color }: { label: string; color: string }) {
  return <span className="text-sdm-xs" style={{ padding: '3px 10px', borderRadius: 2, background: color, color: '#fff' }}>{label}</span>
}
