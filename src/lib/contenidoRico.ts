// Sanea el HTML que viene del editor del admin y baja sus <h1> a <h2>.
//
// POR QUE LA DEGRADACION
//
// El <h1> de una pagina lo pone la pagina, y hay exactamente uno: es el titulo
// del documento. El contenido de un post o de una descripcion de propiedad va
// SIEMPRE por debajo de ese titulo, asi que su encabezado mas alto posible es
// un <h2>. Un <h1> ahi crea un segundo titulo de documento y rompe 1.3.1.
//
// No es un caso aislado: al escribirlo, 7 de los 13 posts publicados y 6 de las
// 54 propiedades traian <h1> en su contenido. Pedirle a quien escribe que no lo
// use no funciona —la barra del editor lo ofrece— y arreglar las 13 entradas a
// mano no evita la catorceava. Corregirlo al renderizar lo hace imposible.
//
// Efecto visible: `.prose-sdm` estiliza h2 y h3 pero NO h1, y el reset de
// Tailwind deja los encabezados en `font-size: inherit`. O sea que esos <h1>
// hoy se ven como un parrafo cualquiera: eran encabezados invisibles. Al pasar
// a <h2> se ven como los encabezados del resto de los posts, que es lo que
// quien los escribio queria.
//
// El reemplazo corre DESPUES de sanear, sobre marcado ya limpio.
import DOMPurify from 'dompurify'

export function sanitizarContenido(html: string): string {
  return DOMPurify.sanitize(html).replace(/<(\/?)h1\b/gi, '<$1h2')
}
