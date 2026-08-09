// Helpers del blog público.

/**
 * El primer término de `blog_posts.categoria`.
 *
 * POR QUÉ HACE FALTA. `categoria` es una columna de texto libre y se han ido
 * escribiendo en ella listas separadas por comas dentro de un único valor:
 *
 *   'Mercado, Mercado inmobiliario, Casas, Corretaje propiedades, Creditos hipotecarios'
 *
 * De los 13 artículos publicados, 9 tienen coma. Pintada entera daba cinco
 * términos en versalitas verdes compitiendo con el titular, y con solapamiento
 * evidente —«Mercado» y «Mercado inmobiliario» son la misma idea dos veces—
 * porque nadie los escribió pensando en que se leerían como etiquetas.
 *
 * NO SON NAVEGACIÓN. El blog no tiene filtro ni búsqueda por categoría: son
 * `<span>` decorativos en los cinco sitios donde aparecen. Por eso se puede
 * recortar la presentación sin perder ninguna función.
 *
 * LA BASE NO SE TOCA. La cadena completa se queda como está; esto es solo
 * presentación. Si algún día hay filtro de blog, hay que decidir la taxonomía
 * antes: `categoria` como término único y el resto a `tags` —que hoy está vacía
 * en los 13 artículos—. Ver SINCRONIA.md.
 *
 * Devuelve cadena vacía si no hay nada que mostrar, para que quien llama pueda
 * no pintar el rótulo en vez de dejar uno en blanco.
 */
export function categoriaPrincipal(categoria: string | null | undefined): string {
  return String(categoria ?? '').split(',')[0].trim()
}
