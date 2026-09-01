import { jsPDF } from 'jspdf'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

const UNKNOWN_AUTHOR_LABEL = 'Autor desconocido'

// Mismos colores que --teleo-text/--teleo-text-secondary/--teleo-accent-wishlist del tema
// CLARO (index.css) — el PDF siempre se ve en fondo blanco sin importar el tema de la app
// (así lo abre cualquier visor de PDF, y así se ve bien si alguien lo imprime), así que se
// usan los valores fijos del modo claro, no los que estén activos en el navegador.
const COLOR_TEXT: [number, number, number] = [0x2b, 0x21, 0x1b]
const COLOR_TEXT_SECONDARY: [number, number, number] = [0x6b, 0x5b, 0x4e]
const COLOR_ACCENT_WISHLIST: [number, number, number] = [0x7a, 0x2e, 0x3a]

interface AuthorGroup {
  author: string
  titles: string[]
}

/** Agrupa por autor (tal como está escrito en cada libro — no se intenta unificar
 *  variantes del mismo autor escritas distinto, ver nota en el plan) y ordena: grupos
 *  conocidos alfabéticamente por nombre, "Autor desconocido" siempre al final. Dentro de
 *  cada grupo, los títulos también van alfabéticos. */
function groupByAuthor(books: Pick<Book, 'title' | 'author'>[]): AuthorGroup[] {
  const groups = new Map<string, string[]>()

  for (const book of books) {
    const author = book.author?.trim() || UNKNOWN_AUTHOR_LABEL
    const titles = groups.get(author) ?? []
    titles.push(book.title)
    groups.set(author, titles)
  }

  const known = [...groups.entries()]
    .filter(([author]) => author !== UNKNOWN_AUTHOR_LABEL)
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))

  const result: AuthorGroup[] = known.map(([author, titles]) => ({
    author,
    titles: [...titles].sort((a, b) => a.localeCompare(b, 'es')),
  }))

  const unknownTitles = groups.get(UNKNOWN_AUTHOR_LABEL)
  if (unknownTitles) {
    result.push({ author: UNKNOWN_AUTHOR_LABEL, titles: [...unknownTitles].sort((a, b) => a.localeCompare(b, 'es')) })
  }

  return result
}

/** Arma el PDF de "Compartir lista de deseados": encabezado con marca de Teleo, y el
 *  resto agrupado por autor con paginación automática. Devuelve un Blob (`application/pdf`)
 *  listo para descargar o pasar a `navigator.share`, igual patrón que
 *  ShareProfileModal.generateBlob() con la tarjeta (PNG en vez de PDF, pero misma idea).
 *
 *  Por qué PDF y no imagen: con 300+ libros, una sola imagen se volvería enorme — html-to-image
 *  reescala cualquier canvas de más de 16384px, así que el texto saldría borroso o habría que
 *  partirlo en varias imágenes. Un PDF pagina solo, con texto nítido a cualquier zoom. */
export function buildWishlistPdf(books: Pick<Book, 'title' | 'author'>[]): Blob {
  const doc = new jsPDF({ unit: 'pt' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 48
  const maxWidth = pageWidth - margin * 2

  let y = margin

  function ensureSpace(lineHeight: number) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // --- Encabezado (solo en la primera página) ---
  doc.setFont('helvetica', 'italic', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...COLOR_ACCENT_WISHLIST)
  doc.text('Teleo', margin, y)
  y += 16

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXT_SECONDARY)
  doc.text('diario de lectura', margin, y)
  y += 30

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLOR_TEXT)
  doc.text('Mi lista de deseados', margin, y)
  y += 18

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXT_SECONDARY)
  doc.text(`${books.length} libro${books.length === 1 ? '' : 's'}`, margin, y)
  y += 14

  doc.setDrawColor(...COLOR_TEXT_SECONDARY)
  doc.line(margin, y, pageWidth - margin, y)
  y += 24

  // --- Grupos por autor ---
  const groups = groupByAuthor(books)
  const authorLineHeight = 18
  const titleLineHeight = 15
  const groupGap = 12
  const titleIndent = margin + 14

  for (const group of groups) {
    ensureSpace(authorLineHeight + titleLineHeight)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COLOR_ACCENT_WISHLIST)
    doc.text(group.author, margin, y)
    y += authorLineHeight

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(...COLOR_TEXT)

    for (const title of group.titles) {
      // splitTextToSize envuelve títulos largos a varias líneas dentro del ancho
      // disponible, en vez de desbordarse fuera de la página.
      const lines: string[] = doc.splitTextToSize(`•  ${title}`, maxWidth - (titleIndent - margin))
      ensureSpace(titleLineHeight * lines.length)
      doc.text(lines, titleIndent, y)
      y += titleLineHeight * lines.length
    }

    y += groupGap
  }

  // --- Pie de página con numeración (recién al final, ya que no se sabe el total de
  //     páginas hasta terminar de armar el contenido) ---
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXT_SECONDARY)
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - margin / 2, { align: 'right' })
  }

  return doc.output('blob')
}
