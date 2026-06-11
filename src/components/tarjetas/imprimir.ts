import { toCanvas } from 'html-to-image'
import jsPDF from 'jspdf'
import tarjetaCss from './tarjeta.css?raw'
import { frontHTML, backHTML, cropsHTML, type TarjetaDatos } from './markup'

const PRINT_CSS = `
@page{ size:110mm 70mm; margin:0; }
html,body{ margin:0; padding:0; background:#fff; }
.sdm-sheet{ width:110mm; height:70mm; position:relative; background:#fff; overflow:hidden; }
.sdm-art{ position:absolute; left:7mm; top:7mm; width:96mm; height:56mm; overflow:hidden; font-size:2.55mm; }
.sdm-art .sdm-f2{ padding:calc(3em + 3mm); }
.sdm-crop{ position:absolute; background:#000; }
/* html-to-image rasteriza el centrado por flex (align-items:center) de estos
   textos con letter-spacing ligeramente desplazado a la izquierda (no ocurre
   en la vista previa en pantalla). Forzamos centrado por texto en ancho
   completo solo para la captura, donde sí rasteriza pixel-perfect. */
.sdm-kick, .sdm-tag{ width:100%; text-align:center; }
`

const PAGE_W_MM = 110
const PAGE_H_MM = 70

/** Renderiza una cara (frente/reverso) en un contenedor fuera de pantalla,
 *  con el MISMO CARD_CSS + PRINT_CSS de la vista previa, y la captura a
 *  alta resolución para insertarla en el PDF. */
async function capturarCara(html: string): Promise<HTMLCanvasElement> {
  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-99999px'
  host.style.top = '0'
  host.style.zIndex = '-1'
  host.style.pointerEvents = 'none'
  host.innerHTML = `<style>${tarjetaCss}\n${PRINT_CSS}</style>` +
    `<section class="sdm-sheet"><div class="sdm-art">${html}</div>${cropsHTML()}</section>`
  document.body.appendChild(host)

  const sheet = host.querySelector('.sdm-sheet') as HTMLElement

  try {
    await document.fonts.ready
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    // html-to-image (foreignObject + clonado de estilos computados) respeta
    // flexbox y SVG igual que el navegador, a diferencia de html2canvas
    // (que producía barras del logo dobles/corridas e iconos despegados del texto).
    return await toCanvas(sheet, { pixelRatio: 4, backgroundColor: '#ffffff', cacheBust: true })
  } finally {
    document.body.removeChild(host)
  }
}

/** Genera y descarga el PDF de la tarjeta: 2 páginas de 110×70mm
 *  (incluye 3mm de sangrado por lado) con marcas de corte, frente y reverso. */
export async function imprimirTarjeta(tarjeta: TarjetaDatos) {
  const frontCanvas = await capturarCara(frontHTML(tarjeta))
  const backCanvas = await capturarCara(backHTML())

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [PAGE_W_MM, PAGE_H_MM] })
  pdf.addImage(frontCanvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W_MM, PAGE_H_MM)
  pdf.addPage([PAGE_W_MM, PAGE_H_MM], 'landscape')
  pdf.addImage(backCanvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_W_MM, PAGE_H_MM)

  const nombre = (tarjeta.nombre || 'SDM').trim().replace(/\s+/g, '_')
  pdf.save(`Tarjeta_${nombre}.pdf`)
}
