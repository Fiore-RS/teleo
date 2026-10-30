import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ImageOff } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { ProgressBar } from '../atoms/ProgressBar'
import { FormActions } from './FormLayout'
import { supabase } from '../../../lib/supabase'
import { fetchAllRows } from '../../../lib/fetchAllRows'
import { findSubjectsForBook } from '../../../lib/bookSearch'
import { suggestGenres } from '../../../lib/genreSuggest'
import { genreLabel, type GenreKey } from '../../../lib/bookTraits'
import { applySagaTraits, sagaTraitsFromRow } from '../../../lib/sagaTraits'

interface ShelfBook {
  id: string
  title: string
  author: string | null
  isbn: string | null
  category: string | null
  cover_url: string | null
  genres: string[]
  saga_id: string | null
  saga_sort_order: number | null
}

interface ShelfSaga {
  id: string
  title: string
  author: string | null
  genres: string[]
  moods: string[]
  custom_moods: string[]
}

/** Lo que se busca y se revisa (V.3.4.0): un libro suelto sin género, o una saga sin género
 *  con al menos un libro sin género. La saga recibe una sola sugerencia y se la pasa a sus
 *  libros (lib/sagaTraits). */
interface Unit {
  /** Id del libro, o "saga:<id>". */
  key: string
  title: string
  author: string | null
  cover_url: string | null
  saga: ShelfSaga | null
  /** Libros sin género que quedan cubiertos. */
  missing: number
  /** Libros con los que se busca: el libro, o los de la saga en su orden. */
  candidates: ShelfBook[]
}

/** En una saga se busca con el primer libro y, si no trae nada, con los siguientes. */
const MAX_SAGA_CANDIDATES = 3

function buildUnits(books: ShelfBook[], sagas: ShelfSaga[]): Unit[] {
  const sagaById = new Map(sagas.map((s) => [s.id, s]))
  const bySaga = new Map<string, ShelfBook[]>()
  const units: Unit[] = []
  for (const b of books) {
    const saga = b.saga_id ? sagaById.get(b.saga_id) : undefined
    if (saga) {
      const list = bySaga.get(saga.id)
      if (list) list.push(b)
      else bySaga.set(saga.id, [b])
    } else if (b.genres.length === 0) {
      units.push({ key: b.id, title: b.title, author: b.author, cover_url: b.cover_url, saga: null, missing: 1, candidates: [b] })
    }
  }
  for (const [sagaId, list] of bySaga) {
    const saga = sagaById.get(sagaId)!
    const missing = list.filter((b) => b.genres.length === 0).length
    // Una saga con género ya se lo pasó a sus libros; los que tienen otro se pusieron a mano.
    if (saga.genres.length > 0 || missing === 0) continue
    const ordered = [...list].sort((x, y) => (x.saga_sort_order ?? 0) - (y.saga_sort_order ?? 0))
    units.push({
      key: `saga:${saga.id}`,
      title: saga.title,
      author: saga.author ?? ordered[0]?.author ?? null,
      cover_url: ordered.find((b) => b.cover_url)?.cover_url ?? null,
      saga,
      missing,
      candidates: ordered.slice(0, MAX_SAGA_CANDIDATES),
    })
  }
  return units
}

/** Avance guardado en el dispositivo, para seguir donde quedó si se cierra la app. Las claves
 *  son las de cada Unit (id del libro o "saga:<id>"). */
interface Progress {
  /** Libros y sagas ya buscados (con o sin sugerencia). */
  checked: string[]
  /** Sugerencias encontradas que todavía no se guardaron. */
  found: Record<string, GenreKey[]>
}

const EMPTY_PROGRESS: Progress = { checked: [], found: {} }
/** Pausa entre libros, para no chocar con los límites de las fuentes. */
const PAUSE_MS = 700
/** Fallas seguidas (ninguna fuente respondió) antes de detenerse. */
const MAX_FAILURES = 3

const storageKey = (userId: string) => `teleo:genreSuggest:${userId}`

function loadProgress(userId: string): Progress {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return EMPTY_PROGRESS
    const parsed = JSON.parse(raw) as Partial<Progress>
    return { checked: parsed.checked ?? [], found: parsed.found ?? {} }
  } catch {
    return EMPTY_PROGRESS
  }
}

function saveProgress(userId: string, progress: Progress) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(progress))
  } catch {
    // Sin almacenamiento el avance no se guarda; se puede volver a empezar.
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const countText = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n} ${many}`)

/** "Guardar 3 libros", "Guardar 1 saga" o "Guardar 3 libros y 1 saga". */
function saveLabel(books: number, sagas: number) {
  const parts = [books > 0 && countText(books, 'libro', 'libros'), sagas > 0 && countText(sagas, 'saga', 'sagas')].filter(Boolean)
  return `Guardar ${parts.join(' y ') || '0 libros'}`
}

/** "Listo: 3 libros y 1 saga ya tienen género." */
function savedText(books: number, sagas: number) {
  const parts = [books > 0 && countText(books, 'libro', 'libros'), sagas > 0 && countText(sagas, 'saga', 'sagas')].filter(Boolean)
  const plural = books + sagas !== 1
  return `Listo: ${parts.join(' y ')} ya ${plural ? 'tienen' : 'tiene'} género.`
}

type Phase = 'loading' | 'intro' | 'running' | 'stopped' | 'review' | 'saved'

interface GenreSuggestSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** "Completar géneros" (V.3.1.0): busca de a uno los libros sin género en Open Library,
 *  AniList y Google Books, propone géneros y al final se revisan antes de guardarlos. Nunca
 *  toca un libro que ya tiene género. El avance se guarda en el dispositivo. Desde la V.3.4.0
 *  los libros de una misma saga se buscan juntos: una sugerencia por saga, que se guarda en la
 *  saga y llega a sus libros. */
export function GenreSuggestSheet({ userId, onClose }: GenreSuggestSheetProps) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('loading')
  const [books, setBooks] = useState<ShelfBook[]>([])
  const [sagas, setSagas] = useState<ShelfSaga[]>([])
  const [progress, setProgress] = useState<Progress>(() => (userId ? loadProgress(userId) : EMPTY_PROGRESS))
  const [currentTitle, setCurrentTitle] = useState('')
  const [sourcesDown, setSourcesDown] = useState(false)
  // Géneros que la persona quitó en la revisión, como "idLibro:genero".
  const [removed, setRemoved] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState({ books: 0, sagas: 0 })
  const stopRef = useRef(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from('books')
          .select('id, title, author, isbn, category, cover_url, genres, saga_id, saga_sort_order')
          .eq('user_id', userId)
          .order('id')
          .range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase.from('sagas').select('id, title, author, genres, moods, custom_moods').eq('user_id', userId).order('id').range(from, to)
      ),
    ])
      .then(([bookRows, sagaRows]) => {
        if (cancelled) return
        setBooks(bookRows)
        setSagas(sagaRows)
        setPhase('intro')
      })
      .catch(() => !cancelled && setPhase('intro'))
    return () => {
      cancelled = true
      stopRef.current = true
    }
  }, [userId])

  const units = useMemo(() => buildUnits(books, sagas), [books, sagas])
  const missingBooks = units.reduce((sum, u) => sum + u.missing, 0)
  const sagaUnits = units.filter((u) => u.saga).length
  const checkedSet = useMemo(() => new Set(progress.checked), [progress.checked])
  const pending = units.filter((u) => !checkedSet.has(u.key))
  const reviewUnits = units.filter((u) => (progress.found[u.key]?.length ?? 0) > 0)
  const doneCount = units.length - pending.length

  function updateProgress(next: Progress) {
    setProgress(next)
    if (userId) saveProgress(userId, next)
  }

  async function run() {
    if (!userId) return
    stopRef.current = false
    setSourcesDown(false)
    setPhase('running')
    let current = progress
    let failures = 0
    for (const unit of pending) {
      if (stopRef.current) return
      setCurrentTitle(unit.title)
      // Una saga prueba con sus primeros libros hasta que alguno traiga algo.
      let subjects: string[] = []
      let failed = false
      for (const candidate of unit.candidates) {
        const outcome = await findSubjectsForBook(candidate, (found) => suggestGenres(found).length > 0)
        if (stopRef.current) return
        subjects = outcome.subjects
        failed = outcome.failed
        if (failed || suggestGenres(subjects).length > 0) break
        await wait(PAUSE_MS)
      }
      if (failed) {
        failures++
        if (failures >= MAX_FAILURES) {
          setSourcesDown(true)
          setPhase('stopped')
          return
        }
      } else {
        failures = 0
        const genres = suggestGenres(subjects)
        current = {
          checked: [...current.checked, unit.key],
          found: genres.length > 0 ? { ...current.found, [unit.key]: genres } : current.found,
        }
        updateProgress(current)
      }
      await wait(PAUSE_MS)
    }
    setPhase('review')
  }

  function pause() {
    stopRef.current = true
    setPhase('stopped')
  }

  /** Vuelve a buscar los que no tuvieron sugerencia (por si las fuentes cambiaron). */
  function retryWithoutSuggestion() {
    updateProgress({ checked: progress.checked.filter((id) => (progress.found[id]?.length ?? 0) > 0), found: progress.found })
  }

  function toggleGenre(unitKey: string, genre: GenreKey) {
    const key = `${unitKey}|${genre}`
    setRemoved((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const accepted = reviewUnits
    .map((u) => ({ unit: u, genres: (progress.found[u.key] ?? []).filter((g) => !removed.has(`${u.key}|${g}`)) }))
    .filter((a) => a.genres.length > 0)
  const acceptedBooks = accepted.filter((a) => !a.unit.saga).length
  const acceptedSagas = accepted.length - acceptedBooks

  /** Guarda una saga: su género (si sigue sin uno) y lo pasa a sus libros. */
  async function saveSaga(saga: ShelfSaga, genres: GenreKey[]) {
    const { data, error } = await supabase.from('sagas').update({ genres }).eq('id', saga.id).filter('genres', 'eq', '{}').select('id')
    if (error || !data?.length) return
    await applySagaTraits(saga.id, sagaTraitsFromRow({ ...saga, genres }), { fields: ['genre'] })
  }

  async function saveAll() {
    setIsSaving(true)
    for (let i = 0; i < accepted.length; i += 10) {
      await Promise.all(
        accepted.slice(i, i + 10).map(({ unit, genres }) =>
          unit.saga
            ? saveSaga(unit.saga, genres).catch((err) => console.error('[GenreSuggestSheet] Error al guardar la saga:', err))
            : // Solo si sigue sin género: nunca se pisa uno puesto a mano mientras tanto.
              supabase.from('books').update({ genres, genres_source: 'suggested' }).eq('id', unit.key).filter('genres', 'eq', '{}')
        )
      )
    }
    const savedKeys = new Set(reviewUnits.map((u) => u.key))
    const found = Object.fromEntries(Object.entries(progress.found).filter(([key]) => !savedKeys.has(key)))
    updateProgress({ checked: progress.checked, found })
    // Lo guardado deja de contar como pendiente: los libros sueltos y las sagas reciben su género.
    const byBook = new Map(accepted.filter((a) => !a.unit.saga).map((a) => [a.unit.key, a.genres]))
    const bySaga = new Map(accepted.filter((a) => a.unit.saga).map((a) => [a.unit.saga!.id, a.genres]))
    setBooks((prev) => prev.map((b) => {
      const genres = byBook.get(b.id) ?? (b.saga_id && b.genres.length === 0 ? bySaga.get(b.saga_id) : undefined)
      return genres ? { ...b, genres } : b
    }))
    setSagas((prev) => prev.map((sg) => (bySaga.has(sg.id) ? { ...sg, genres: bySaga.get(sg.id)! } : sg)))
    setSaved({ books: acceptedBooks, sagas: acceptedSagas })
    setRemoved(new Set())
    setIsSaving(false)
    setPhase('saved')
    void queryClient.invalidateQueries()
  }

  function handleClose() {
    stopRef.current = true
    onClose()
  }

  let body: ReactNode
  let footer: ReactNode = null

  if (phase === 'loading') {
    body = <p className="text-body-md text-text-secondary">Revisando tu estante...</p>
  } else if (phase === 'intro' || phase === 'stopped') {
    const started = doneCount > 0
    body = (
      <div className="animate-fade-in">
        {sourcesDown && (
          <p className="text-body-md text-primary-text mb-3.5">
            Las fuentes de libros no responden ahora. Tu avance quedó guardado; inténtalo de nuevo más tarde.
          </p>
        )}
        {units.length === 0 ? (
          <p className="text-body-md text-text-secondary">Todos tus libros ya tienen género.</p>
        ) : (
          <>
            <p className="text-body-md text-text-secondary mb-3.5">
              {missingBooks === 1 ? 'Tienes 1 libro sin género.' : `Tienes ${missingBooks} libros sin género.`} Teleo
              los busca uno por uno en Open Library, AniList y Google Books y te propone hasta 3 géneros para cada uno.
              {sagaUnits > 0 && ' Los de una misma saga se buscan juntos: el género se guarda en la saga y llega a sus libros.'}{' '}
              Antes de guardar puedes revisarlos. Nunca cambia un género que pusiste tú.
            </p>
            {started && (
              <div className="mb-3.5">
                <ProgressBar percent={(doneCount / units.length) * 100} />
                <p className="text-body-sm text-text-muted mt-1.5 tabular-nums">
                  {doneCount} de {units.length} revisados · {reviewUnits.length} con sugerencia
                </p>
              </div>
            )}
            {pending.length > 0 ? (
              <p className="text-body-sm text-text-muted">Va de a poco para no saturar las fuentes. Puedes cerrar y seguir otro día.</p>
            ) : (
              doneCount > reviewUnits.length && (
                <button type="button" onClick={retryWithoutSuggestion} className="text-body-sm font-bold text-primary-text">
                  Volver a buscar los {doneCount - reviewUnits.length} sin sugerencia
                </button>
              )
            )}
          </>
        )}
      </div>
    )
    footer = units.length > 0 && (
      <FormActions>
        {reviewUnits.length > 0 && (
          <Button variant="soft" onClick={() => setPhase('review')}>Revisar ({reviewUnits.length})</Button>
        )}
        {pending.length > 0 ? (
          <Button variant="primary" onClick={run}>{started ? 'Seguir' : 'Empezar'}</Button>
        ) : (
          reviewUnits.length === 0 && <Button variant="primary" onClick={handleClose}>Listo</Button>
        )}
      </FormActions>
    )
  } else if (phase === 'running') {
    body = (
      <div className="animate-fade-in">
        <ProgressBar percent={units.length > 0 ? (doneCount / units.length) * 100 : 0} />
        <p className="text-body-sm text-text-muted mt-1.5 tabular-nums">
          {doneCount} de {units.length} revisados · {reviewUnits.length} con sugerencia
        </p>
        <p className="text-body-md text-text-secondary mt-3.5 truncate">Buscando {currentTitle}</p>
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={pause}>Pausar</Button>
      </FormActions>
    )
  } else if (phase === 'review') {
    body = (
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-3.5">
          Toca un género para quitarlo. Se guardan solo los libros con al menos uno.
        </p>
        {reviewUnits.length === 0 ? (
          <p className="text-body-md text-text-secondary">No se encontraron sugerencias.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {reviewUnits.map((b) => (
              <li key={b.key} className="flex gap-3 py-3 first:pt-0">
                <div className="w-10 shrink-0 aspect-2/3 rounded-[6px] overflow-hidden bg-surface-2">
                  {b.cover_url ? (
                    <CoverImage src={b.cover_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><ImageOff size={12} className="text-text-secondary" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-body-md leading-tight text-text line-clamp-2">{b.title}</p>
                  {b.saga ? (
                    <p className="text-body-sm text-text-secondary truncate">
                      Saga · {b.missing === 1 ? '1 libro sin género' : `${b.missing} libros sin género`}
                    </p>
                  ) : (
                    b.author && <p className="text-body-sm text-text-secondary truncate">{b.author}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(progress.found[b.key] ?? []).map((g) => {
                      const on = !removed.has(`${b.key}|${g}`)
                      return (
                        <button
                          key={g}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleGenre(b.key, g)}
                          className={`inline-flex items-center gap-1 rounded-full border-[1.5px] px-2.5 py-1 font-body font-semibold text-body-sm ${
                            on ? 'border-primary-text bg-primary-soft text-primary-text' : 'border-border bg-surface-2 text-text-muted line-through'
                          }`}
                        >
                          {on && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                          {genreLabel(g)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => setPhase('intro')} disabled={isSaving}>Volver</Button>
        <Button variant="primary" onClick={saveAll} isLoading={isSaving} disabled={accepted.length === 0}>
          {saveLabel(acceptedBooks, acceptedSagas)}
        </Button>
      </FormActions>
    )
  } else {
    body = (
      <p className="text-body-md text-text-secondary animate-fade-in">
        {savedText(saved.books, saved.sagas)}{' '}
        {pending.length > 0 ? `Quedan ${pending.length} por revisar.` : ''}
      </p>
    )
    footer = (
      <FormActions>
        {pending.length > 0 && <Button variant="soft" onClick={run}>Seguir</Button>}
        <Button variant="primary" onClick={handleClose}>Listo</Button>
      </FormActions>
    )
  }

  return (
    <Sheet onClose={handleClose} title={phase === 'review' ? 'Revisar géneros' : 'Completar géneros'} footer={footer || undefined}>
      {body}
    </Sheet>
  )
}
