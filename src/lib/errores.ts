// Aviso de errores de Supabase en el panel de administración.
//
// Por qué existe: casi todas las escrituras del admin hacían
// `await supabase.from(...).insert(...)` sin recoger el `{ error }`. Cuando la
// escritura fallaba —una columna que no existe, una regla RLS, la red— el
// formulario se cerraba como si hubiera guardado y el dato se perdía sin que
// nadie se enterara. Un 400 silencioso es peor que un 400 ruidoso.
//
// El detalle técnico —`code`, `message`, `details`, `hint`— va SOLO a la
// consola. En la alerta estorbaba: viene en inglés y no le dice nada a quien
// estaba llenando un formulario. En consola sigue completo y es lo que hay que
// pedir cuando algo falla de verdad.

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

  // El objeto completo al log. NO QUITAR: es lo que sirve para depurar de
  // verdad, y es lo que permitió encontrar que `prop_pais` no existía como
  // columna. La alerta ya no lo muestra —código, mensaje en inglés, detalle y
  // sugerencia no significan nada para quien solo quería guardar— pero acá
  // sigue completo.
  console.error(`[${contexto}]`, error)

  // Lo que sí ve el usuario. La segunda frase es la que faltaba: el formulario
  // efectivamente queda abierto con lo escrito, pero nunca se lo decía, así que
  // un fallo se leía como pérdida del trabajo.
  alert(
    `${contexto}.\n\n` +
    'No se guardó ningún cambio. Vuelve a intentarlo; si sigue fallando, abre ' +
    'la consola del navegador y pásame el detalle.'
  )
  return true
}
