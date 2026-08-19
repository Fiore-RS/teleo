export interface BookSearchResult {
  title: string
  author?: string
  coverUrl?: string
  totalPages?: number
  language?: string
  category?: string
  isbn?: string
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

function withKey(url: string): string {
  return API_KEY ? `${url}&key=${API_KEY}` : url
}

interface GoogleImageLinks {
  thumbnail?: string
  small?: string
  medium?: string
  large?: string
  extraLarge?: string
}

interface GoogleVolume {
  volumeInfo?: {
    title?: string
    authors?: string[]
    pageCount?: number
    language?: string
    categories?: string[]
    imageLinks?: GoogleImageLinks
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

/** Google Books devuelve por defecto una miniatura chica (~128px) con un efecto de "página curvada".
 *  Acá pedimos la versión de mayor resolución disponible y le quitamos ese efecto.
 *  Nota: NO forzamos el parámetro zoom, porque pedir un nivel de zoom que Google no tiene
 *  escaneado para ese libro en particular hace que la imagen falle ("no disponible"). */
function bestCoverUrl(imageLinks?: GoogleImageLinks): string | undefined {
  const raw = imageLinks?.extraLarge ?? imageLinks?.large ?? imageLinks?.medium ?? imageLinks?.small ?? imageLinks?.thumbnail
  if (!raw) return undefined
  return raw
    .replace('http://', 'https://')
    .replace(/&edge=curl/, '')
}

function mapGoogleVolume(volume: GoogleVolume, fallbackIsbn?: string): BookSearchResult {
  const info = volume.volumeInfo ?? {}
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier

  return {
    title: info.title ?? 'Título desconocido',
    author: info.authors?.join(', '),
    coverUrl: bestCoverUrl(info.imageLinks),
    totalPages: info.pageCount,
    language: info.language,
    category: info.categories?.[0],
    isbn: isbn13 ?? fallbackIsbn,
  }
}

export async function searchBooksByQuery(query: string): Promise<BookSearchResult | null> {
  const url = withKey(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=1`)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  const first = data.items?.[0]
  return first ? mapGoogleVolume(first) : null
}

export async function searchBookByIsbn(isbn: string): Promise<BookSearchResult | null> {
  const url = withKey(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`)
  const res = await fetch(url)
  if (res.ok) {
    const data = await res.json()
    const first = data.items?.[0]
    if (first) return mapGoogleVolume(first, isbn)
  }

  const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
  if (!olRes.ok) return null
  const olData = await olRes.json()
  const entry = olData[`ISBN:${isbn}`]
  if (!entry) return null

  return {
    title: entry.title ?? 'Título desconocido',
    author: entry.authors?.map((a: { name: string }) => a.name).join(', '),
    coverUrl: entry.cover?.large ?? entry.cover?.medium,
    totalPages: entry.number_of_pages,
    isbn,
  }
}

interface OpenLibraryDoc {
  title?: string
  author_name?: string[]
  cover_i?: number
  number_of_pages_median?: number
  language?: string[]
  isbn?: string[]
}

const OL_LANGUAGE_CODES: Record<string, string> = {
  spa: 'es', eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', por: 'pt', ita: 'it',
}

function mapOpenLibraryDoc(doc: OpenLibraryDoc): BookSearchResult {
  return {
    title: doc.title ?? 'Título desconocido',
    author: doc.author_name?.join(', '),
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : undefined,
    totalPages: doc.number_of_pages_median,
    language: doc.language?.[0] ? (OL_LANGUAGE_CODES[doc.language[0]] ?? doc.language[0]) : undefined,
    isbn: doc.isbn?.[0],
  }
}

/** Busca en Google Books y, si no alcanza el número de resultados pedido (algunos libros —
 *  sobre todo ediciones en español, cómics/manga o títulos menos conocidos — no aparecen ahí),
 *  completa con Open Library para ampliar las posibilidades de encontrar el libro. */
export async function searchBooksByQueryMultiple(query: string, maxResults = 3): Promise<BookSearchResult[]> {
  const results: BookSearchResult[] = []

  try {
    const url = withKey(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const items: GoogleVolume[] = data.items ?? []
      results.push(...items.map((item) => mapGoogleVolume(item)))
    }
  } catch {
    // seguimos con Open Library aunque Google Books falle
  }

  if (results.length < maxResults) {
    try {
      const olRes = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,author_name,cover_i,number_of_pages_median,language,isbn`
      )
      if (olRes.ok) {
        const olData = await olRes.json()
        const docs: OpenLibraryDoc[] = olData.docs ?? []
        const existingTitles = new Set(results.map((r) => r.title.toLowerCase()))
        for (const doc of docs) {
          if (results.length >= maxResults) break
          const mapped = mapOpenLibraryDoc(doc)
          if (existingTitles.has(mapped.title.toLowerCase())) continue
          results.push(mapped)
          existingTitles.add(mapped.title.toLowerCase())
        }
      }
    } catch {
      // si también falla Open Library, devolvemos lo que sí encontramos
    }
  }

  return results
}