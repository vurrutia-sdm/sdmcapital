// Maquetación de los paneles del admin.
//
// `Sec` es la tarjeta blanca con título y grilla de dos columnas; `Full` hace
// que un campo ocupe el ancho completo de esa grilla. Las usan ContenidoAdmin,
// BarrancoAdmin, RentalAdmin y VendeAdmin.
//
// ─── REGLA INNEGOCIABLE PARA TODO EL ADMIN ────────────────────────────────────
//
// Los componentes van SIEMPRE a nivel de módulo. Nunca dentro de otro
// componente, nunca dentro de un render, nunca como arrow function creada en
// el cuerpo de un componente.
//
// No es una preferencia de estilo. `Sec` y `Full` estuvieron definidos dentro
// de ContenidoAdmin, BarrancoAdmin, RentalAdmin y VendeAdmin —cuatro copias
// idénticas—, y al recrearse en cada render React los veía como tipos de
// componente distintos en cada pasada: desmontaba el árbol entero y lo volvía
// a montar. Al desaparecer el contenido la página perdía altura, el navegador
// llevaba el scroll a 0, y al remontar el scroll ya se había perdido. Tocar
// cualquier switch de "Textos del sitio" saltaba al inicio de la página.
//
// Si al partir un archivo del admin queda un componente anidado, hay que
// sacarlo al nivel superior del módulo. Está documentado en SINCRONIA.md.

export const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white border border-[#e8edf2] rounded-sm p-8 mb-6">
    <h3 className="font-serif font-light mb-6 pb-4 border-b border-[#e8edf2]" style={{ fontSize: 22, color: 'var(--navy-dark)' }}>{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
  </div>
)

export const Full = ({ children }: { children: React.ReactNode }) => <div className="md:col-span-2">{children}</div>
