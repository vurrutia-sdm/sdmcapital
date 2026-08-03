// Aviso de errores de Supabase en el panel de administración.
//
// Por qué existe: casi todas las escrituras del admin hacían
// `await supabase.from(...).insert(...)` sin recoger el `{ error }`. Cuando la
// escritura fallaba —una columna que no existe, una regla RLS, la red— el
// formulario se cerraba como si hubiera guardado y el dato se perdía sin que
// nadie se enterara. Un 400 silencioso es peor que un 400 ruidoso.
//
// `details` y `hint` suelen venir en null (los errores PGRST204 de columna
// inexistente, por ejemplo, solo traen `code` y `message`), así que se muestran
// solo cuando aportan algo.

import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Registra y muestra un error de Supabase.
 *
 * @param contexto Qué se estaba intentando, en lenguaje del usuario.
 * @returns `true` si hubo error — para cortar el flujo con `if (...) return`
 *          y no cerrar el formulario ni dar por buena la operación.
 */
export function avisarError(contexto: string, error: PostgrestError | null): boolean {
  if (!error) return false

  // El objeto completo al log: es lo que sirve para depurar de verdad.
  console.error(`[${contexto}]`, error)

  const lineas = [
    contexto,
    '',
    `Código: ${error.code || '—'}`,
    `Mensaje: ${error.message}`,
    error.details ? `Detalle: ${error.details}` : '',
    error.hint ? `Sugerencia: ${error.hint}` : '',
  ].filter(Boolean)

  alert(lineas.join('\n'))
  return true
}
