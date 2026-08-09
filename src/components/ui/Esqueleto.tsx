// Bloque gris que reserva el lugar de un contenido que todavía no llegó.
//
// Existe porque lo que había era peor: tres páginas arrancaban con datos de
// muestra inventados —seis propiedades con enlaces rotos, cinco empresas reales
// presentadas como socias, tres personas que no existen presentadas como el
// equipo— y los mostraban hasta que llegaba la consulta. Si la consulta fallaba
// se quedaban en pantalla para siempre, porque el patrón era
// `if (data && data.length > 0) setX(data)` y un error deja `data` en null.
//
// Un rectángulo gris dice la verdad: acá va algo y todavía no está.
//
// `aria-hidden` porque no hay nada que leer — es una forma, no contenido. La
// animación de Tailwind va de opacidad 1 a 0,5 y vuelve a 1, así que con
// `prefers-reduced-motion` —que globals.css lleva a su fotograma final— queda
// completamente visible y no a medio desvanecer. Eso mantiene la invariante que
// ya estaba anotada: ninguna animación del proyecto termina ocultando algo.
export default function Esqueleto({
  alto,
  aspecto,
  ancho,
  radio = 2,
  style,
}: {
  alto?: number | string
  aspecto?: string
  ancho?: number | string
  radio?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      aria-hidden="true"
      className="animate-pulse"
      style={{
        background: 'var(--border)',
        height: alto,
        width: ancho,
        aspectRatio: aspecto,
        borderRadius: radio,
        ...style,
      }}
    />
  )
}
