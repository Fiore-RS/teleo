import type { BookFormat } from './options'

/* Lectura del archivo de exportación de Goodreads (My Books → Import and export → Export
 * Library). Es un CSV con una fila por libro y estas columnas, entre otras: Title, Author,
 * ISBN, ISBN13, My Rating, Binding, Number of Pages, Date Read, Date Added, Bookshelves,
 * Exclusive Shelf, My Review, Read Count y Owned Copies. No trae portadas ni fecha de inicio. */

/** Libro de Goodreads ya traducido a los datos de Teleo. */
export interface GoodreadsBook {
  /** Título sin la parte de la saga que agrega Goodreads. */
  title: string
  /** Saga y número dentro de ella, sacados del título ("Título (Saga, #2)"). */
  series: { name: string; number: number | null } | null
  author: string | null
  /** ISBN-13 si viene, si no el ISBN-10. Sin guiones ni el ="..." que agrega Goodreads. */
  isbn: string | null
  status: 'terminado' | 'leyendo' | 'pendiente' | 'deseado' | 'abandonado'
  format: BookFormat | null
  totalPages: number | null
  /** Fecha de fin (AAAA-MM-DD). Solo para libros leídos. */
  endDate: string | null
  /** Cuándo se agregó a Goodreads (AAAA-MM-DD), para conservar el orden de "agregados". */
  addedDate: string | null
  /** Calificación general de 1 a 5; null si no se calificó (Goodreads usa 0). */
  rating: number | null
  review: string | null
  /** Estanterías personalizadas, que pasan a ser etiquetas del libro. */
  tags: string[]
}

/** Parte un CSV respetando comillas: comas, saltos de línea y "" dentro de un campo entre
 *  comillas (las reseñas largas de Goodreads traen de todo). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < src.length; i++) {
    const char = src[i]
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && src[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Goodreads escribe los ISBN como ="9780439023481" para que Excel no los convierta en número. */
function cleanIsbn(raw: string | undefined): string | null {
  const digits = (raw ?? '').replace(/[^0-9Xx]/g, '').toUpperCase()
  return digits.length === 10 || digits.length === 13 ? digits : null
}

/** "2024/03/15" → "2024-03-15". */
function cleanDate(raw: string | undefined): string | null {
  const match = (raw ?? '').trim().match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (!match) return null
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`
}

/** Las reseñas vienen en HTML (<br/>, <i>...): se dejan como texto con saltos de línea. */
function cleanReview(raw: string | undefined): string | null {
  const text = (raw ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text || null
}

function formatFromBinding(binding: string | undefined): BookFormat | null {
  const value = (binding ?? '').toLowerCase()
  if (!value) return null
  if (/audio|audible/.test(value)) return 'audiolibro'
  if (/kindle|ebook|e-book|digital|nook|kobo/.test(value)) return 'digital'
  return 'fisico'
}

/** Goodreads agrega la saga al final del título: "The Hunger Games (The Hunger Games, #1)",
 *  "Heartstopper (Heartstopper #2)" o "Sagas Omnibus (Saga, #1-3)". Se separa en título y
 *  saga con su número. Si el paréntesis no trae "#número", no se toca el título. */
export function splitSeries(rawTitle: string): Pick<GoodreadsBook, 'title' | 'series'> {
  const match = rawTitle.match(/^(.*\S)\s*\(([^()]+?),?\s+#(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\)\s*$/)
  if (!match) return { title: rawTitle.trim(), series: null }
  return {
    title: match[1].trim(),
    series: { name: match[2].trim(), number: parseFloat(match[3]) },
  }
}

const BUILT_IN_SHELVES = new Set(['read', 'currently-reading', 'to-read'])

/** Estanterías que en Goodreads se usan para los libros que se dejaron sin terminar. */
const ABANDONED_SHELF = /^(dnf|did-not-finish|didnt-finish|abandoned|abandonado|abandonados|no-terminado|no-terminados|dropped)$/

function isAbandonedShelf(shelf: string): boolean {
  return ABANDONED_SHELF.test(shelf.trim().toLowerCase())
}

function splitShelves(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Lee el CSV completo. Devuelve null si el archivo no parece una exportación de Goodreads. */
export function parseGoodreadsCsv(text: string): GoodreadsBook[] | null {
  const rows = parseCsv(text)
  if (rows.length === 0) return null
  const header = rows[0].map((h) => h.trim())
  const col = (name: string) => header.indexOf(name)
  const titleCol = col('Title')
  const shelfCol = col('Exclusive Shelf')
  if (titleCol === -1 || shelfCol === -1) return null

  const get = (row: string[], name: string) => {
    const index = col(name)
    return index === -1 ? undefined : row[index]
  }

  const books: GoodreadsBook[] = []
  for (const row of rows.slice(1)) {
    const rawTitle = (row[titleCol] ?? '').trim()
    if (!rawTitle) continue
    const { title, series } = splitSeries(rawTitle)

    const exclusiveShelf = (row[shelfCol] ?? '').trim().toLowerCase()
    const shelves = splitShelves(get(row, 'Bookshelves'))
    const ownedCopies = parseInt(get(row, 'Owned Copies') ?? '0', 10) || 0

    let status: GoodreadsBook['status']
    if (isAbandonedShelf(exclusiveShelf) || shelves.some(isAbandonedShelf)) status = 'abandonado'
    else if (exclusiveShelf === 'read') status = 'terminado'
    else if (exclusiveShelf === 'currently-reading') status = 'leyendo'
    // "Want to Read" junta lo que ya se tiene y lo que se quiere comprar: se separa por las
    // copias que la persona marcó como suyas en Goodreads.
    else if (exclusiveShelf === 'to-read') status = ownedCopies > 0 ? 'pendiente' : 'deseado'
    // Otra estantería exclusiva propia (ej. "en-pausa"): queda pendiente y con su etiqueta.
    else status = 'pendiente'

    // Las estanterías personalizadas pasan a etiquetas. Las de abandonados no, porque ya
    // se reflejan en el estado.
    const tags = [...new Set([...shelves, exclusiveShelf])].filter(
      (shelf) => shelf && !BUILT_IN_SHELVES.has(shelf.toLowerCase()) && !isAbandonedShelf(shelf)
    )

    const rating = parseInt(get(row, 'My Rating') ?? '0', 10)
    const pages = parseInt(get(row, 'Number of Pages') ?? '', 10)

    books.push({
      title,
      series,
      author: (get(row, 'Author') ?? '').trim() || null,
      isbn: cleanIsbn(get(row, 'ISBN13')) ?? cleanIsbn(get(row, 'ISBN')),
      status,
      format: formatFromBinding(get(row, 'Binding')),
      totalPages: Number.isFinite(pages) && pages > 0 ? pages : null,
      endDate: status === 'terminado' ? cleanDate(get(row, 'Date Read')) : null,
      addedDate: cleanDate(get(row, 'Date Added')),
      rating: rating >= 1 && rating <= 5 ? rating : null,
      review: cleanReview(get(row, 'My Review')),
      tags,
    })
  }
  return books
}

/** Nombre de saga comparable (para juntar libros de la misma saga y reconocer una saga que ya
 *  existe en Teleo). */
export function comparableName(name: string): string {
  return comparableKey(name, null)
}

/** Título y autor comparables: sin mayúsculas, tildes, signos ni el "(Saga, #1)" que Goodreads
 *  agrega al título. Sirve para reconocer un libro que ya está en Teleo. */
export function comparableKey(title: string, author: string | null | undefined): string {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\(.*?#\d+(\.\d+)?\)/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  return `${normalize(title)}|${normalize(author ?? '')}`
}

/** El mismo ISBN escrito como ISBN-10 o ISBN-13 se compara como ISBN-13. */
export function comparableIsbn(isbn: string | null | undefined): string | null {
  const digits = (isbn ?? '').replace(/[^0-9Xx]/g, '').toUpperCase()
  if (digits.length === 13) return digits
  if (digits.length !== 10) return null
  const core = `978${digits.slice(0, 9)}`
  const sum = core.split('').reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0)
  return `${core}${(10 - (sum % 10)) % 10}`
}
