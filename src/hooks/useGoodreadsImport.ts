import { supabase } from '../lib/supabase'
import { fetchAllRows } from '../lib/fetchAllRows'
import { queryClient } from '../lib/queryClient'
import { searchBookByIsbn, searchBooksByQueryMultiple } from '../lib/bookSearch'
import { comparableIsbn, comparableKey, comparableName, parseGoodreadsCsv, type GoodreadsBook } from '../lib/goodreads'
import { computeSagaStatus, recomputeSagaStatus } from '../lib/sagaStatus'

export type GoodreadsStatus = GoodreadsBook['status']

export interface GoodreadsPreview {
  /** Libros nuevos, los que se van a importar. */
  books: GoodreadsBook[]
  /** Libros que ya estaban en Teleo (mismo ISBN, o mismo título y autor) y se saltan. */
  duplicates: number
  counts: Record<GoodreadsStatus, number>
  /** Sagas nuevas que se van a crear. */
  newSagas: number
  /** Sagas que ya estaban en Teleo y reciben libros. */
  existingSagas: number
}

interface ExistingSaga {
  id: string
  title: string
}

/** A qué saga va cada libro. Los libros de una misma saga se juntan por el nombre que trae
 *  Goodreads en el título. Si esa saga ya existe en Teleo, los libros se suman a ella. Si no,
 *  se crea una saga nueva solo cuando llegan 2 libros o más: con uno solo, el libro queda
 *  suelto en el Estante (con el título ya limpio). */
interface SagaPlan {
  /** Clave de saga (nombre comparable) → índices de sus libros en `books`. */
  groups: Map<string, number[]>
  /** Clave → saga de Teleo que ya existe. */
  existing: Map<string, ExistingSaga>
  /** Claves de las sagas nuevas a crear. */
  toCreate: string[]
}

function planSagas(books: GoodreadsBook[], existingSagas: ExistingSaga[]): SagaPlan {
  const byName = new Map(existingSagas.map((saga) => [comparableName(saga.title), saga]))
  const allGroups = new Map<string, number[]>()
  books.forEach((book, i) => {
    if (!book.series) return
    const key = comparableName(book.series.name)
    if (!key) return
    allGroups.set(key, [...(allGroups.get(key) ?? []), i])
  })

  const groups = new Map<string, number[]>()
  const existing = new Map<string, ExistingSaga>()
  const toCreate: string[] = []
  for (const [key, indexes] of allGroups) {
    const match = byName.get(key)
    if (match) {
      existing.set(key, match)
      groups.set(key, indexes)
    } else if (indexes.length >= 2) {
      toCreate.push(key)
      groups.set(key, indexes)
    }
  }
  return { groups, existing, toCreate }
}

async function fetchSagas(userId: string): Promise<ExistingSaga[]> {
  return fetchAllRows((from, to) =>
    supabase.from('sagas').select('id, title').eq('user_id', userId).order('id').range(from, to)
  )
}

export type GoodreadsProgress =
  | { phase: 'portadas'; done: number; total: number }
  | { phase: 'guardando' }

export interface GoodreadsResult {
  imported: number
  withCover: number
}

/** Cuántas portadas se buscan a la vez. Más rápido que de una en una, sin llegar al límite de
 *  pedidos de Google Books. */
const COVER_CONCURRENCY = 4
const CHUNK_SIZE = 200

/** Lee el archivo y separa lo nuevo de lo que ya está en Teleo, sin guardar nada todavía. */
export async function analyzeGoodreadsFile(file: File, userId: string): Promise<GoodreadsPreview | null> {
  const parsed = parseGoodreadsCsv(await file.text())
  if (!parsed) return null

  const existing = await fetchAllRows((from, to) =>
    supabase.from('books').select('title, author, isbn').eq('user_id', userId).order('id').range(from, to)
  )
  const knownIsbns = new Set(existing.map((b) => comparableIsbn(b.isbn)).filter(Boolean))
  const knownKeys = new Set(existing.map((b) => comparableKey(b.title, b.author)))

  const books: GoodreadsBook[] = []
  let duplicates = 0
  for (const book of parsed) {
    const isbn = comparableIsbn(book.isbn)
    const key = comparableKey(book.title, book.author)
    if ((isbn && knownIsbns.has(isbn)) || knownKeys.has(key)) {
      duplicates++
      continue
    }
    // También evita repetidos dentro del mismo archivo.
    if (isbn) knownIsbns.add(isbn)
    knownKeys.add(key)
    books.push(book)
  }

  const counts: Record<GoodreadsStatus, number> = { terminado: 0, leyendo: 0, pendiente: 0, deseado: 0, abandonado: 0 }
  books.forEach((b) => counts[b.status]++)
  const plan = planSagas(books, await fetchSagas(userId))
  return { books, duplicates, counts, newSagas: plan.toCreate.length, existingSagas: plan.existing.size }
}

interface CoverInfo {
  coverUrl: string | null
  language: string | null
}

/** Busca la portada con la misma estrategia que al agregar un libro: por ISBN en Google Books,
 *  con Open Library de respaldo. Sin ISBN se busca por título y autor, y solo se acepta si el
 *  título encontrado coincide, para no poner la portada de otro libro. */
async function findCover(book: GoodreadsBook): Promise<CoverInfo> {
  try {
    if (book.isbn) {
      const result = await searchBookByIsbn(book.isbn)
      if (result?.coverUrl) return { coverUrl: result.coverUrl, language: result.language ?? null }
    }
    const [result] = await searchBooksByQueryMultiple(`${book.title} ${book.author ?? ''}`.trim(), 1)
    const wanted = comparableKey(book.title, null)
    const found = result ? comparableKey(result.title, null) : ''
    if (result?.coverUrl && (found.startsWith(wanted) || wanted.startsWith(found))) {
      return { coverUrl: result.coverUrl, language: result.language ?? null }
    }
  } catch {
    // Sin portada: el libro se importa igual y se le puede poner una después.
  }
  return { coverUrl: null, language: null }
}

async function findCovers(books: GoodreadsBook[], onProgress: (p: GoodreadsProgress) => void): Promise<CoverInfo[]> {
  const covers: CoverInfo[] = new Array(books.length)
  let next = 0
  let done = 0
  onProgress({ phase: 'portadas', done, total: books.length })

  async function worker() {
    while (next < books.length) {
      const index = next++
      covers[index] = await findCover(books[index])
      done++
      onProgress({ phase: 'portadas', done, total: books.length })
    }
  }
  await Promise.all(Array.from({ length: Math.min(COVER_CONCURRENCY, books.length) }, worker))
  return covers
}

async function insertChunks(table: 'book_tags' | 'reviews' | 'reading_history', rows: Record<string, unknown>[]) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase.from(table).insert(rows.slice(i, i + CHUNK_SIZE) as never)
    if (error) throw error
  }
}

/** Guarda los libros nuevos con sus portadas, etiquetas, calificaciones, reseñas y lecturas. */
export async function importGoodreadsBooks(
  books: GoodreadsBook[],
  userId: string,
  onProgress: (p: GoodreadsProgress) => void
): Promise<GoodreadsResult> {
  const covers = await findCovers(books, onProgress)
  onProgress({ phase: 'guardando' })

  // Los libros importados van después de todo lo que ya está en el Estante.
  const [{ data: lastBook }, { data: lastSaga }] = await Promise.all([
    supabase.from('books').select('estante_sort_order').eq('user_id', userId)
      .order('estante_sort_order', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
    supabase.from('sagas').select('estante_sort_order').eq('user_id', userId)
      .order('estante_sort_order', { ascending: false, nullsFirst: false }).limit(1).maybeSingle(),
  ])
  const baseOrder = Math.max(lastBook?.estante_sort_order ?? 0, lastSaga?.estante_sort_order ?? 0)
  let nextOrder = baseOrder

  // Sagas: se crean las nuevas y se calcula a qué saga y en qué posición va cada libro.
  const plan = planSagas(books, await fetchSagas(userId))
  const sagaIdByKey = new Map<string, string>()
  plan.existing.forEach((saga, key) => sagaIdByKey.set(key, saga.id))

  if (plan.toCreate.length > 0) {
    const sagaRows = plan.toCreate.map((key) => {
      const indexes = plan.groups.get(key)!
      const first = books[indexes[0]]
      // El autor más repetido entre sus libros.
      const authorCounts = new Map<string, number>()
      indexes.forEach((i) => {
        const author = books[i].author
        if (author) authorCounts.set(author, (authorCounts.get(author) ?? 0) + 1)
      })
      const author = [...authorCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
      nextOrder += 1000
      return {
        user_id: userId,
        title: first.series!.name,
        author,
        status: computeSagaStatus(indexes.map((i) => books[i].status)),
        is_favorite: false,
        estante_sort_order: nextOrder,
      }
    })
    const { data, error } = await supabase.from('sagas').insert(sagaRows).select('id')
    if (error) throw error
    ;(data ?? []).forEach((row, i) => sagaIdByKey.set(plan.toCreate[i], row.id))
  }

  // Dentro de cada saga, los libros van por su número (#1, #2...). En una saga que ya existía,
  // se agregan después de los libros que ya tiene.
  const sagaOf: ({ sagaId: string; order: number } | null)[] = books.map(() => null)
  for (const [key, indexes] of plan.groups) {
    const sagaId = sagaIdByKey.get(key)
    if (!sagaId) continue
    let start = 0
    if (plan.existing.has(key)) {
      const { data: last } = await supabase.from('books').select('saga_sort_order').eq('saga_id', sagaId)
        .order('saga_sort_order', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
      start = last?.saga_sort_order ?? 0
    }
    const sorted = [...indexes].sort(
      (a, b) => (books[a].series?.number ?? Infinity) - (books[b].series?.number ?? Infinity)
    )
    sorted.forEach((bookIndex, position) => {
      sagaOf[bookIndex] = { sagaId, order: start + (position + 1) * 1000 }
    })
  }

  const rows = books.map((book, i) => ({
    user_id: userId,
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    status: book.status,
    format: book.format,
    total_pages: book.totalPages,
    // Un libro leído queda en su última página, igual que al terminarlo en la app.
    current_page: book.status === 'terminado' ? book.totalPages : null,
    end_date: book.endDate,
    cover_url: covers[i].coverUrl,
    language: covers[i].language === 'es' || covers[i].language === 'en' ? covers[i].language : null,
    is_favorite: false,
    saga_id: sagaOf[i]?.sagaId ?? null,
    saga_sort_order: sagaOf[i]?.order ?? null,
    estante_sort_order: nextOrder + (i + 1) * 1000,
    ...(book.addedDate ? { created_at: `${book.addedDate}T12:00:00Z` } : {}),
  }))

  const ids: string[] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { data, error } = await supabase.from('books').insert(rows.slice(i, i + CHUNK_SIZE)).select('id')
    if (error) throw error
    ids.push(...(data ?? []).map((row) => row.id))
  }

  await insertChunks(
    'book_tags',
    books.flatMap((book, i) => book.tags.map((tag) => ({ book_id: ids[i], tag })))
  )

  await insertChunks(
    'reviews',
    books.flatMap((book, i) =>
      book.rating || book.review
        ? [{ user_id: userId, book_id: ids[i], general_rating: book.rating, general_comments: book.review }]
        : []
    )
  )

  // Cada libro leído con fecha cuenta para la meta de ese año, igual que en la app.
  await insertChunks(
    'reading_history',
    books.flatMap((book, i) =>
      book.status === 'terminado' && book.endDate
        ? [{ user_id: userId, book_id: ids[i], start_date: null, end_date: book.endDate }]
        : []
    )
  )

  // Las sagas que ya existían recalculan su estado con los libros nuevos.
  await Promise.all([...plan.existing.values()].map((saga) => recomputeSagaStatus(saga.id)))

  await queryClient.invalidateQueries()
  return { imported: ids.length, withCover: covers.filter((c) => c.coverUrl).length }
}
