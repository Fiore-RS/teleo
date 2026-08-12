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

interface GoogleVolume {
  volumeInfo?: {
    title?: string
    authors?: string[]
    pageCount?: number
    language?: string
    categories?: string[]
    imageLinks?: { thumbnail?: string }
    industryIdentifiers?: { type: string; identifier: string }[]
  }
}

function mapGoogleVolume(volume: GoogleVolume, fallbackIsbn?: string): BookSearchResult {
  const info = volume.volumeInfo ?? {}
  const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier

  return {
    title: info.title ?? 'Título desconocido',
    author: info.authors?.join(', '),
    coverUrl: info.imageLinks?.thumbnail?.replace('http://', 'https://'),
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
    coverUrl: entry.cover?.medium,
    totalPages: entry.number_of_pages,
    isbn,
  }
}