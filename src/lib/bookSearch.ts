export interface BookSearchResult {
  title: string
  author?: string
  coverUrl?: string
  totalPages?: number
  language?: string
  category?: string
  isbn?: string
  /** true cuando el resultado viene de una fuente que describe la serie completa
   *  (ej. AniList) en vez de una edición/volumen específico — no trae ISBN ni páginas. */
  isSeriesLevel?: boolean
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
const API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY

function withKey(url: string): string {
  return API_KEY ? `${url}&key=${API_KEY}` : url
}

/** Reintenta automáticamente ante fallos transitorios (caída de red momentánea, o un 429/5xx
 *  de la API) — esto es justo lo que hacía que a veces una búsqueda por nombre no encontrara
 *  nada la primera vez y hubiera que darle "Buscar" varias veces hasta que funcionara. Con
 *  este helper el reintento pasa solo, con una pequeña espera creciente entre intentos, sin
 *  que el usuario tenga que notarlo ni volver a tocar el botón. */
async function fetchWithRetry(url: string, init?: RequestInit, attempts = 3): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      const isTransientError = !res.ok && (res.status === 429 || res.status >= 500)
      if (!isTransientError || i === attempts - 1) return res
    } catch {
      if (i === attempts - 1) return null
    }
    await new Promise((resolve) => setTimeout(resolve, 300 * (i + 1)))
  }
  return null
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

export async function searchBookByIsbn(isbn: string): Promise<BookSearchResult | null> {
  const url = withKey(`${GOOGLE_BOOKS_API}?q=isbn:${isbn}`)
  const res = await fetchWithRetry(url)
  if (res?.ok) {
    const data = await res.json()
    const first = data.items?.[0]
    if (first) return mapGoogleVolume(first, isbn)
  }

  const olRes = await fetchWithRetry(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
  if (!olRes || !olRes.ok) return null
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

interface AniListMedia {
  title?: { romaji?: string; english?: string }
  coverImage?: { extraLarge?: string; large?: string }
  format?: string
  countryOfOrigin?: string
  staff?: { edges?: { node?: { name?: { full?: string } } }[] }
}

/** AniList clasifica por país de origen y formato — lo traducimos a las categorías que
 *  ya usa Teleo (Manga/Manhwa/Manhua/Novela ligera). */
function mapAniListCategory(format?: string, countryOfOrigin?: string): string {
  if (format === 'NOVEL') return 'Novela ligera'
  if (countryOfOrigin === 'KR') return 'Manhwa'
  if (countryOfOrigin === 'CN' || countryOfOrigin === 'TW') return 'Manhua'
  return 'Manga'
}

function mapAniListMedia(media: AniListMedia): BookSearchResult {
  return {
    title: media.title?.english ?? media.title?.romaji ?? 'Título desconocido',
    author: media.staff?.edges?.[0]?.node?.name?.full,
    coverUrl: media.coverImage?.extraLarge ?? media.coverImage?.large,
    category: mapAniListCategory(media.format, media.countryOfOrigin),
    isSeriesLevel: true,
  }
}

const ANILIST_SEARCH_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
        title { romaji english }
        coverImage { extraLarge large }
        format
        countryOfOrigin
        staff(sort: RELEVANCE, perPage: 1) {
          edges { node { name { full } } }
        }
      }
    }
  }
`

/** AniList es una base de datos de series (manga/manhwa/manhua/novela ligera), no de ediciones
 *  individuales — no tiene ISBN ni conteo de páginas por volumen. Se usa como último recurso
 *  para encontrar títulos que ni Google Books ni Open Library indexan bien. */
async function searchAniListManga(query: string, maxResults: number): Promise<BookSearchResult[]> {
  try {
    const res = await fetchWithRetry('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: ANILIST_SEARCH_QUERY, variables: { search: query, perPage: maxResults } }),
    })
    if (!res || !res.ok) return []
    const data = await res.json()
    const media: AniListMedia[] = data?.data?.Page?.media ?? []
    return media.map(mapAniListMedia)
  } catch {
    return []
  }
}

/** Busca en Google Books y, si no alcanza el número de resultados pedido (algunos libros —
 *  sobre todo ediciones en español o títulos menos conocidos — no aparecen ahí), completa con
 *  Open Library. Si todavía faltan resultados, agrega AniList como última fuente, pensada
 *  especialmente para manga, manhwa, manhua y novela ligera. */
export async function searchBooksByQueryMultiple(query: string, maxResults = 3): Promise<BookSearchResult[]> {
  const results: BookSearchResult[] = []

  try {
    const url = withKey(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
    const res = await fetchWithRetry(url)
    if (res?.ok) {
      const data = await res.json()
      const items: GoogleVolume[] = data.items ?? []
      results.push(...items.map((item) => mapGoogleVolume(item)))
    }
  } catch {
    // seguimos con las demás fuentes aunque Google Books falle
  }

  if (results.length < maxResults) {
    try {
      const olRes = await fetchWithRetry(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,author_name,cover_i,number_of_pages_median,language,isbn`
      )
      if (olRes?.ok) {
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
      // si también falla Open Library, seguimos con AniList
    }
  }

  if (results.length < maxResults) {
    const aniListResults = await searchAniListManga(query, maxResults - results.length)
    const existingTitles = new Set(results.map((r) => r.title.toLowerCase()))
    for (const mapped of aniListResults) {
      if (results.length >= maxResults) break
      if (existingTitles.has(mapped.title.toLowerCase())) continue
      results.push(mapped)
      existingTitles.add(mapped.title.toLowerCase())
    }
  }

  return results
}