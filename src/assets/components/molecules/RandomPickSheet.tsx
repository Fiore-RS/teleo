import { useEffect, useMemo, useRef, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { queryClient } from '../../../lib/queryClient'
import { recomputeSagaStatus } from '../../../lib/sagaStatus'
import { prefersReducedMotion } from '../../../lib/motion'
import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { useProfile } from '../../../hooks/useProfile'
import { getPriorityListName } from '../../../lib/priorityList'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { Select } from '../atoms/Select'
import { FormActions, FormCard, FormCollapsible, FormRow } from './FormLayout'
import { genreLabel, genreOptions, moodLabel, moodOptions, paceLabel, paceOptions } from '../../../lib/bookTraits'
import { CoverImage } from '../atoms/CoverImage'
import { coverDisplaySrc } from '../../../lib/coverSrc'
import { CoverSkeleton, Skeleton } from '../atoms/Skeleton'
import { StartReadingDateModal } from './StartReadingDateModal'

interface PendingBook {
  id: string
  title: string
  author: string | null
  cover_url: string | null
  total_pages: number | null
  saga_id: string | null
  genres: string[] | null
  moods: string[] | null
  custom_moods: string[] | null
  pace: string | null
  is_priority: boolean
}

/** De dónde elige la ruleta (V.3.2.1): todos los pendientes o solo la lista de temporada. */
export type PickSource = 'todos' | 'temporada'

/** Filtro de la ruleta (V.3.1.0). El ánimo puede ser fijo ("m:dark") o propio ("c:Cozy"). */
interface PickFilter {
  genre: string
  mood: string
  pace: string
}

const NO_FILTER: PickFilter = { genre: '', mood: '', pace: '' }

function matchesPick(book: PendingBook, f: PickFilter): boolean {
  if (f.genre && !(book.genres ?? []).includes(f.genre)) return false
  if (f.mood.startsWith('m:') && !(book.moods ?? []).includes(f.mood.slice(2))) return false
  if (f.mood.startsWith('c:') && !(book.custom_moods ?? []).includes(f.mood.slice(2))) return false
  if (f.pace && book.pace !== f.pace) return false
  return true
}

const EMPTY: PendingBook[] = []
/** Cuántos libros pasan por la ruleta (con su portada ya precargada). */
const POOL_SIZE = 12
/** Pausa antes de cada libro que pasa: rápido al inicio y cada vez más lento, como una ruleta
 *  que frena. El último paso es el que cae en el elegido (~1 s en total). */
const SHUFFLE_DELAYS_MS = [55, 55, 60, 70, 85, 105, 130, 165, 210]

function pickOther(books: PendingBook[], excludeId: string | null): PendingBook | null {
  const pool = excludeId ? books.filter((b) => b.id !== excludeId) : books
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
}

function randomSample<T>(items: T[], count: number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, count)
}

/** Pide la portada al navegador para que ya esté lista cuando pase por la ruleta. Si la
 *  versión grande no existe, precarga la original (igual que hace `CoverImage`). */
function preloadCover(url: string | null) {
  if (!url) return
  const img = new Image()
  const display = coverDisplaySrc(url)
  if (display !== url) img.onerror = () => { new Image().src = url }
  img.src = display
}

/** Libros que pasan por la ruleta: 12 a la vez (V.2.2.1). Después de cada vuelta, los que
 *  ya pasaron se cambian por pendientes que todavía no salieron, así con cada "Otra vez"
 *  van apareciendo más libros sin precargar todas las portadas al abrir. */
function refillPool(pool: string[], shownIds: Set<string>, books: PendingBook[], seen: Set<string>): string[] {
  let candidates = books.filter((b) => !pool.includes(b.id) && !seen.has(b.id))
  if (candidates.length === 0) {
    // Ya pasaron todos: se empieza de nuevo con los que no están en el grupo.
    seen.clear()
    candidates = books.filter((b) => !pool.includes(b.id))
  }
  const fresh = randomSample(candidates, candidates.length)
  return pool.map((id) => (shownIds.has(id) && fresh.length > 0 ? fresh.pop()!.id : id))
}

interface RandomPickSheetProps {
  userId: string | undefined
  onClose: () => void
  /** Desde la tarjeta de la lista de temporada abre ya en "temporada". Por defecto, todos. */
  initialSource?: PickSource
}

/** "¿Qué leo ahora?" (fase 2): elige al azar uno de los libros pendientes. V.3.1.0: hoja con
 *  los botones abajo y "Filtrar" por género, ánimo o ritmo (solo con los valores que tienen
 *  los pendientes, así nunca queda vacío por un filtro imposible). "Otra vez" pasa
 *  título, autor y portada como una ruleta que frena y cae en otro (nunca repite el que se
 *  estaba mostrando; el elegido sale de todos los pendientes), "Ahora no"
 *  cierra sin cambiar nada y "Empezar a leer" lo pasa a Leyendo, preguntando antes si hoy es
 *  la fecha de inicio (mismo aviso que en el resto de la app).
 *
 *  V.3.2.1: "Elegir de" permite que elija solo de la lista de temporada (aparece si la lista
 *  tiene 2 libros o más); el menú de la lista abre la hoja ya en ese modo.
 *
 *  Se monta al abrirse, así cada vez arranca con una elección nueva. */
export function RandomPickSheet({ userId, onClose, initialSource = 'todos' }: RandomPickSheetProps) {
  const { profile } = useProfile(userId)
  const listName = getPriorityListName(profile?.priority_list_name)
  // La clave suma 'lista' porque desde la 3.2.1 la consulta trae is_priority: así no se usa
  // una copia guardada de antes que no lo tenga.
  const { data: pendingBooks, isLoading } = useCachedQuery(
    ['pendingBooks', userId, 'lista'],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title, author, cover_url, total_pages, saga_id, genres, moods, custom_moods, pace, is_priority')
        .eq('user_id', userId!)
        .eq('status', 'pendiente')
      return (data ?? []) as PendingBook[]
    },
    EMPTY,
    { enabled: !!userId }
  )

  const [source, setSource] = useState<PickSource>(initialSource)
  const priorityCount = useMemo(() => pendingBooks.filter((b) => b.is_priority).length, [pendingBooks])
  const canPickFromList = priorityCount >= 2
  // Si la lista ya no tiene 2 libros o más, vuelve a todos los pendientes.
  const fromList = source === 'temporada' && canPickFromList
  const allBooks = useMemo(
    () => (fromList ? pendingBooks.filter((b) => b.is_priority) : pendingBooks),
    [pendingBooks, fromList]
  )

  const [filter, setFilter] = useState<PickFilter>(NO_FILTER)
  const books = useMemo(() => allBooks.filter((b) => matchesPick(b, filter)), [allBooks, filter])
  const isFiltered = filter.genre !== '' || filter.mood !== '' || filter.pace !== ''

  // Opciones del filtro: solo lo que aparece en los libros de donde se elige.
  const filterOptions = useMemo(() => {
    const genres = new Set(allBooks.flatMap((b) => b.genres ?? []))
    const moods = new Set(allBooks.flatMap((b) => b.moods ?? []))
    const ownMoods = [...new Set(allBooks.flatMap((b) => b.custom_moods ?? []))].sort((a, b) => a.localeCompare(b, 'es'))
    const paces = new Set(allBooks.map((b) => b.pace).filter(Boolean))
    return {
      genres: genreOptions.filter((o) => genres.has(o.key)).map((o) => ({ value: o.key, label: o.label })),
      moods: [
        ...moodOptions.filter((o) => moods.has(o.key)).map((o) => ({ value: `m:${o.key}`, label: o.label })),
        ...ownMoods.map((m) => ({ value: `c:${m}`, label: m })),
      ],
      paces: paceOptions.filter((o) => paces.has(o.key)).map((o) => ({ value: o.key, label: o.label })),
    }
  }, [allBooks])
  const hasFilterOptions = filterOptions.genres.length + filterOptions.moods.length + filterOptions.paces.length > 0

  const filterSummary =
    [
      filter.genre ? genreLabel(filter.genre) : null,
      filter.mood ? (filter.mood.startsWith('m:') ? moodLabel(filter.mood.slice(2)) : filter.mood.slice(2)) : null,
      filter.pace ? paceLabel(filter.pace) : null,
    ]
      .filter(Boolean)
      .join(' · ') || 'Cualquiera'

  // Primera elección: un número al azar fijado al abrir, así no hace falta un efecto.
  const [seed] = useState(() => Math.random())
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [flashId, setFlashId] = useState<string | null>(null) // libro que pasa mientras se baraja
  const [pool, setPool] = useState<string[] | null>(null)
  const [isAskingDate, setIsAskingDate] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)
  const seenRef = useRef<Set<string>>(new Set()) // los que ya pasaron por la ruleta

  // El primer grupo se arma apenas llegan los pendientes (durante el render, sin efecto).
  if (pool === null && books.length > 0) {
    setPool(randomSample(books, POOL_SIZE).map((b) => b.id))
  }

  // Precarga las portadas del grupo cada vez que cambia.
  useEffect(() => {
    if (!pool) return
    for (const id of pool) preloadCover(books.find((b) => b.id === id)?.cover_url ?? null)
  }, [pool, books])

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  // Cambiar el filtro vuelve a elegir entre los que coinciden (V.3.1.0).
  function changeFilter(patch: Partial<PickFilter>) {
    window.clearTimeout(timerRef.current)
    setFlashId(null)
    setPickedId(null)
    setPool(null)
    seenRef.current.clear()
    setFilter((prev) => ({ ...prev, ...patch }))
  }

  // Cambiar de dónde se elige vuelve a elegir y quita el filtro: lo elegido podría no
  // existir entre los libros nuevos.
  function changeSource(next: PickSource) {
    if (next === source) return
    changeFilter(NO_FILTER)
    setSource(next)
  }

  const current = books.find((b) => b.id === pickedId) ?? (books.length > 0 ? books[Math.floor(seed * books.length)] : null)
  const shown = (flashId && books.find((b) => b.id === flashId)) || current
  const isShuffling = flashId !== null

  function handleAgain() {
    if (!current || books.length < 2 || isShuffling) return
    const next = pickOther(books, current.id)
    if (!next) return
    if (prefersReducedMotion()) {
      setPickedId(next.id)
      return
    }
    preloadCover(next.cover_url)

    // Libros que pasan antes de caer en el elegido: del grupo precargado, sin repetir uno
    // seguido de otro y sin mostrar el elegido antes de tiempo.
    const poolBooks = (pool ?? []).map((id) => books.find((b) => b.id === id)).filter((b): b is PendingBook => !!b)
    const flashes: PendingBook[] = []
    let prevId = current.id
    for (let i = 0; i < SHUFFLE_DELAYS_MS.length - 1; i++) {
      const options = poolBooks.filter((b) => b.id !== prevId && b.id !== next.id)
      const pick = options.length > 0 ? options[Math.floor(Math.random() * options.length)] : pickOther(books, prevId)
      if (!pick) break
      flashes.push(pick)
      prevId = pick.id
    }

    let step = 0
    const tick = () => {
      if (step < flashes.length) {
        setFlashId(flashes[step].id)
        step++
        timerRef.current = window.setTimeout(tick, SHUFFLE_DELAYS_MS[step])
        return
      }
      setFlashId(null)
      setPickedId(next.id)
      const shownIds = new Set(flashes.map((b) => b.id))
      shownIds.forEach((id) => seenRef.current.add(id))
      setPool((prev) => (prev ? refillPool(prev, shownIds, books, seenRef.current) : prev))
    }
    timerRef.current = window.setTimeout(tick, SHUFFLE_DELAYS_MS[0])
  }

  async function startReading(startDate: string | null) {
    if (!current) return
    setIsAskingDate(false)
    setIsStarting(true)
    await supabase
      .from('books')
      .update({ status: 'leyendo', ...(startDate ? { start_date: startDate } : {}) })
      .eq('id', current.id)
    await recomputeSagaStatus(current.saga_id)
    // Mesa, Estante, Perfil y Bitácora vuelven a pedir sus datos con el libro ya en Leyendo.
    await queryClient.invalidateQueries()
    setIsStarting(false)
    onClose()
  }

  const sourceCard = canPickFromList && (
    <FormCard className="mb-3">
      <FormRow label="Elegir de">
        <Select
          bare
          options={[
            { value: 'todos', label: 'Todos mis pendientes' },
            { value: 'temporada', label: listName },
          ]}
          value={fromList ? 'temporada' : 'todos'}
          onChange={(e) => changeSource(e.target.value as PickSource)}
        />
      </FormRow>
    </FormCard>
  )

  const filterCard = hasFilterOptions && (
    <FormCollapsible title="Filtrar" summary={filterSummary} className="mb-5">
      <div className="border-t border-border divide-y divide-border">
        {filterOptions.genres.length > 0 && (
          <FormRow label="Género">
            <Select bare options={[{ value: '', label: 'Cualquiera' }, ...filterOptions.genres]} value={filter.genre} onChange={(e) => changeFilter({ genre: e.target.value })} />
          </FormRow>
        )}
        {filterOptions.moods.length > 0 && (
          <FormRow label="Ánimo">
            <Select bare options={[{ value: '', label: 'Cualquiera' }, ...filterOptions.moods]} value={filter.mood} onChange={(e) => changeFilter({ mood: e.target.value })} />
          </FormRow>
        )}
        {filterOptions.paces.length > 0 && (
          <FormRow label="Ritmo">
            <Select bare options={[{ value: '', label: 'Cualquiera' }, ...filterOptions.paces]} value={filter.pace} onChange={(e) => changeFilter({ pace: e.target.value })} />
          </FormRow>
        )}
      </div>
    </FormCollapsible>
  )

  let content
  let footer = null
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center" aria-label="Cargando">
        <CoverSkeleton className="w-32" />
        <Skeleton className="h-5 w-2/3 mt-4 rounded-full" />
        <Skeleton className="h-3.5 w-1/3 mt-2 rounded-full" />
      </div>
    )
  } else if (pendingBooks.length === 0) {
    // Aviso sin ícono (V.3.1.0), como el resto de los avisos desde la 2.2.0.
    content = (
      <div className="animate-fade-in">
        <p className="font-display font-semibold text-body-lg text-text">No tienes libros pendientes</p>
        <p className="text-body-md text-text-secondary mt-1.5">
          Cuando agregues libros como Pendiente en tu Estante, aquí te ayudo a elegir el próximo.
        </p>
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="primary" onClick={onClose}>Entendido</Button>
      </FormActions>
    )
  } else if (!shown) {
    content = (
      <>
        {sourceCard}
        {filterCard}
        <p className="text-body-md text-text-secondary text-center">
          {fromList ? 'Ningún libro de tu lista coincide con ese filtro.' : 'Ningún pendiente coincide con ese filtro.'}
        </p>
      </>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => changeFilter(NO_FILTER)}>Quitar filtro</Button>
      </FormActions>
    )
  } else {
    content = (
      <>
        {sourceCard}
        {filterCard}
        <p className="text-center text-body-md text-text-secondary">Tu próxima lectura podría ser…</p>
        <div className="flex flex-col items-center text-center mt-4 mb-2" aria-live="polite">
          <div className="w-32 aspect-2/3 rounded-[10px] overflow-hidden bg-surface-2 shadow-card flex items-center justify-center">
            {shown.cover_url ? (
              <CoverImage src={shown.cover_url} alt="" loading="eager" className="w-full h-full object-cover" />
            ) : (
              <ImageOff size={24} className="text-text-muted" />
            )}
          </div>
          <p className="font-display font-semibold text-display-md text-text mt-4 text-balance">{shown.title}</p>
          {shown.author && <p className="text-body-md text-text-secondary mt-1">{shown.author}</p>}
          {shown.total_pages ? <p className="text-body-sm text-text-muted mt-1">{shown.total_pages} páginas</p> : null}
          {books.length === 1 && (
            <p className="text-body-sm text-text-muted mt-3">
              {fromList
                ? 'Es el único libro de tu lista con ese filtro.'
                : isFiltered
                  ? 'Es el único pendiente con ese filtro.'
                  : 'Es tu único pendiente.'}
            </p>
          )}
        </div>
      </>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={handleAgain} disabled={books.length < 2 || isShuffling}>
          Otra vez
        </Button>
        <Button variant="orange" onClick={() => setIsAskingDate(true)} disabled={isShuffling} isLoading={isStarting}>
          Empezar a leer
        </Button>
      </FormActions>
    )
  }

  return (
    <>
      <Sheet onClose={onClose} title="¿Qué leo ahora?" footer={footer ?? undefined}>
        {content}
      </Sheet>
      <StartReadingDateModal
        isOpen={isAskingDate}
        book={current}
        onConfirm={(startDate) => startReading(startDate)}
        onDismiss={() => startReading(null)}
      />
    </>
  )
}
