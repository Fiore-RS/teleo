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
  /** Categorías, temas o géneros tal como los da la fuente (Google Books, Open Library, AniList),
   *  para sugerir el género del libro (lib/genreSuggest.ts, V.3.1.0). */
  subjects?: string[]
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
async function fetchWithRetry(url: string, init?: RequestInit, attempts = 4): Promise<Response | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init)
      const isTransientError = !res.ok && (res.status === 429 || res.status >= 500)
      if (!isTransientError || i === attempts - 1) return res
    } catch {
      if (i === attempts - 1) return null
    }
    // Espera creciente: 0.4, 0.8 y 1.6 s. Google Books a veces responde "no disponible"
    // (503) varias veces seguidas.
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** i))
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

/** Algunas editoriales (ej. Norma) cargan los tomos como "La mancha que nos queda - Tome 1 -
 *  La mancha que nos queda". Se deja como "La mancha que nos queda 1". */
function cleanVolumeTitle(title: string): string {
  const match = title.match(/^(.+?)\s+-\s+(?:tome|tomo|vol\.?|volume|volumen)\s+(\d+)\s+-\s+(.+)$/i)
  if (match && match[1].trim().toLowerCase() === match[3].trim().toLowerCase()) return `${match[1].trim()} ${match[2]}`
  return title
}

function mapGoogleVolume(volume: GoogleVolume, fallbackIsbn?: string): BookSearchResult {
  const info = volume.volumeInfo ?? {}
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier

  return {
    title: cleanVolumeTitle(info.title ?? 'Título desconocido'),
    author: info.authors?.join(', '),
    coverUrl: bestCoverUrl(info.imageLinks),
    totalPages: info.pageCount,
    language: info.language,
    category: info.categories?.[0],
    isbn: isbn13 ?? fallbackIsbn,
    subjects: info.categories,
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
    subjects: entry.subjects?.map((sub: { name: string }) => sub.name),
  }
}

interface OpenLibraryDoc {
  title?: string
  author_name?: string[]
  cover_i?: number
  number_of_pages_median?: number
  language?: string[]
  isbn?: string[]
  subject?: string[]
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
    subjects: doc.subject?.slice(0, 40),
  }
}

interface AniListMedia {
  title?: { romaji?: string; english?: string }
  coverImage?: { extraLarge?: string; large?: string }
  format?: string
  countryOfOrigin?: string
  genres?: string[]
  tags?: { name?: string; rank?: number }[]
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
    // Géneros y las etiquetas más relevantes (ej. "Boys' Love", "Yuri").
    subjects: [...(media.genres ?? []), ...(media.tags ?? []).filter((t) => (t.rank ?? 0) >= 60 && t.name).map((t) => t.name!)],
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
        genres
        tags { name rank }
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

/* ---------- Orden de los resultados (V.3.0.1) ----------
 * Google Books ordena por su propia relevancia y suele poner primero libros que solo comparten
 * palabras con la búsqueda (ej. "Compendio de expedientes" quedaba detrás de libros de
 * derecho), o las ediciones japonesas de un manga. Por eso Teleo reordena: primero lo que más
 * se parece al título buscado y, dentro de eso, español, inglés y después el resto. */

/** Minúsculas, sin tildes y sin signos, para comparar títulos. */
function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** 0 título exacto, 1 empieza igual, 2 lo contiene, 3 están todas las palabras (en el título o
 *  el autor, útil para la importación de Goodreads, que busca "título autor"), 4 el resto. */
function matchRank(result: BookSearchResult, query: string): number {
  const q = normalizeText(query)
  const title = normalizeText(result.title)
  if (!q) return 4
  if (title === q) return 0
  if (title.startsWith(q)) return 1
  if (title.includes(q)) return 2
  const words = new Set(normalizeText(`${result.title} ${result.author ?? ''}`).split(' '))
  return q.split(' ').every((w) => words.has(w)) ? 3 : 4
}

/** Primero español, después inglés, después otros idiomas con alfabeto latino (o sin idioma,
 *  como AniList, que trae el título en romaji o inglés) y al final títulos en otra escritura
 *  (japonés, chino, coreano...). */
const OTHER_SCRIPT = /[Ѐ-ӿ֐-ۿ฀-๿぀-ヿ㐀-鿿가-힯]/

function languageRank(result: BookSearchResult): number {
  if (OTHER_SCRIPT.test(result.title)) return 3
  const lang = (result.language ?? '').toLowerCase()
  if (lang.startsWith('es')) return 0
  if (lang.startsWith('en')) return 1
  return 2
}

/** null si Google Books no respondió (después de los reintentos). */
async function googleSearch(query: string, maxResults: number): Promise<BookSearchResult[] | null> {
  try {
    const res = await fetchWithRetry(withKey(`${GOOGLE_BOOKS_API}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`))
    if (!res?.ok) return null
    const data = await res.json()
    const items: GoogleVolume[] = data.items ?? []
    return items.map((item) => mapGoogleVolume(item))
  } catch {
    return null
  }
}

async function openLibrarySearch(query: string, maxResults: number): Promise<BookSearchResult[]> {
  try {
    // lang=es: pone primero las ediciones en español, sin dejar fuera las demás.
    const olRes = await fetchWithRetry(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${maxResults}&lang=es&fields=title,author_name,cover_i,number_of_pages_median,language,isbn,subject`
    )
    if (!olRes?.ok) return []
    const olData = await olRes.json()
    const docs: OpenLibraryDoc[] = olData.docs ?? []
    return docs.map(mapOpenLibraryDoc)
  } catch {
    return []
  }
}

export interface BookSearchOutcome {
  results: BookSearchResult[]
  /** true si Google Books no respondió: si no hay resultados, no es que el libro no exista. */
  googleFailed: boolean
}

/** Busca en Google Books. Si no aparece nada que se parezca al título en un idioma con
 *  alfabeto latino (o Google no respondió), completa con Open Library y AniList (pensada
 *  para manga, manhwa, manhua y novela ligera), en paralelo. Ordena por parecido con la
 *  búsqueda y por idioma, sin duplicados, y se queda con los primeros. */
export async function searchBooks(query: string, maxResults = 3): Promise<BookSearchOutcome> {
  const google = await googleSearch(query, Math.min(Math.max(maxResults * 2, 10), 40))
  let candidates = google ?? []

  const hasGoodMatch = candidates.some((r) => matchRank(r, query) <= 3 && languageRank(r) < 3)
  if (!hasGoodMatch) {
    const [openLibrary, aniList] = await Promise.all([
      openLibrarySearch(query, maxResults),
      searchAniListManga(query, Math.min(maxResults, 5)),
    ])
    candidates = [...candidates, ...openLibrary, ...aniList]
  }

  // sort es estable: con el mismo parecido e idioma se respeta el orden de cada fuente.
  const ranked = [...candidates].sort(
    (a, b) => matchRank(a, query) - matchRank(b, query) || languageRank(a) - languageRank(b)
  )
  const seen = new Set<string>()
  const results: BookSearchResult[] = []
  for (const r of ranked) {
    const key = `${normalizeText(r.title)}|${normalizeText(r.author ?? '')}`
    if (seen.has(key)) continue
    seen.add(key)
    results.push(r)
    if (results.length >= maxResults) break
  }
  return { results, googleFailed: google === null }
}

/** Igual que searchBooks, solo los resultados (lo usa la importación de Goodreads). */
export async function searchBooksByQueryMultiple(query: string, maxResults = 3): Promise<BookSearchResult[]> {
  return (await searchBooks(query, maxResults)).results
}

/* ---------- Temas de un libro que ya está en el estante (V.3.1.0) ----------
 * Para la sugerencia de género de toda la biblioteca. Usa primero las fuentes sin clave (Open
 * Library y, para manga y novela ligera, AniList) y solo después Google Books, para no gastar
 * el límite diario de la clave, que es compartida. */

const ANILIST_CATEGORIES = new Set(['Manga', 'Manhwa', 'Manhua', 'Novela ligera'])

export interface BookToMatch {
  title: string
  author: string | null
  isbn: string | null
  category: string | null
}

export interface SubjectsOutcome {
  subjects: string[]
  /** true si ninguna fuente respondió: conviene reintentar ese libro más tarde. */
  failed: boolean
}

/** Packs, estuches y colecciones: traen categorías que no son del libro (ej. "Juvenile
 *  Nonfiction" en "Pack La Sombra del Viento + marcapáginas"). */
const BUNDLE_TITLE = /\b(pack|estuche|box ?set|bundle|boxed|coleccion|collection|trilog(y|ia)|saga completa)\b/

/** Temas del libro según las fuentes, tomados solo de resultados cuyo título se parece al del
 *  libro (para no mezclar los de otro libro con palabras parecidas). Pasa a la fuente siguiente
 *  mientras lo encontrado no sirva (`isUseful`, ej. que dé algún género): las ediciones en
 *  español suelen tener temas que no dicen el género ("Mothers and sons", "Fiction"). */
export async function findSubjectsForBook(book: BookToMatch, isUseful: (subjects: string[]) => boolean = (s) => s.length > 0): Promise<SubjectsOutcome> {
  const fromMatches = (results: BookSearchResult[]) =>
    results
      .filter((r) => matchRank(r, book.title) <= 2 && !BUNDLE_TITLE.test(normalizeText(r.title)))
      .flatMap((r) => r.subjects ?? [])
  const collected: string[] = []
  let anyResponded = false

  function keep(subjects: string[]): boolean {
    collected.push(...subjects)
    return isUseful(collected)
  }

  if (book.category && ANILIST_CATEGORIES.has(book.category)) {
    const aniList = await searchAniListManga(book.title, 3)
    anyResponded = true
    if (keep(fromMatches(aniList))) return { subjects: collected, failed: false }
  }

  try {
    const query = book.isbn ? `isbn=${encodeURIComponent(book.isbn)}` : `title=${encodeURIComponent(book.title)}${book.author ? `&author=${encodeURIComponent(book.author)}` : ''}`
    const res = await fetchWithRetry(`https://openlibrary.org/search.json?${query}&limit=3&fields=title,subject`)
    if (res?.ok) {
      anyResponded = true
      const data = await res.json()
      const docs: OpenLibraryDoc[] = data.docs ?? []
      const subjects = book.isbn ? docs.flatMap((d) => d.subject ?? []) : fromMatches(docs.map(mapOpenLibraryDoc))
      if (keep(subjects.slice(0, 60))) return { subjects: collected, failed: false }
    }
  } catch {
    // seguimos con Google Books
  }

  const q = book.isbn ? `isbn:${book.isbn}` : `intitle:${book.title}${book.author ? ` inauthor:${book.author}` : ''}`
  const google = await googleSearch(q, 5)
  if (google) {
    anyResponded = true
    keep(book.isbn ? google.flatMap((r) => r.subjects ?? []) : fromMatches(google))
  }
  return { subjects: collected, failed: !anyResponded }
}
