import { useEffect, useRef, useState } from 'react'
import { BookOpen, ImageOff, Shuffle, Sparkles } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { queryClient } from '../../../lib/queryClient'
import { recomputeSagaStatus } from '../../../lib/sagaStatus'
import { prefersReducedMotion } from '../../../lib/motion'
import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
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
}

/** "¿Qué leo ahora?" (fase 2): elige al azar uno de los libros pendientes. "Otra vez" pasa
 *  título, autor y portada como una ruleta que frena y cae en otro (nunca repite el que se
 *  estaba mostrando; el elegido sale de todos los pendientes), "Ahora no"
 *  cierra sin cambiar nada y "Empezar a leer" lo pasa a Leyendo, preguntando antes si hoy es
 *  la fecha de inicio (mismo aviso que en el resto de la app).
 *
 *  Se monta al abrirse, así cada vez arranca con una elección nueva. */
export function RandomPickSheet({ userId, onClose }: RandomPickSheetProps) {
  const { data: books, isLoading } = useCachedQuery(
    ['pendingBooks', userId],
    async () => {
      const { data } = await supabase
        .from('books')
        .select('id, title, author, cover_url, total_pages, saga_id')
        .eq('user_id', userId!)
        .eq('status', 'pendiente')
      return (data ?? []) as PendingBook[]
    },
    EMPTY,
    { enabled: !!userId }
  )

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

  let content
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center" aria-label="Cargando">
        <CoverSkeleton className="w-32" />
        <Skeleton className="h-5 w-2/3 mt-4 rounded-full" />
        <Skeleton className="h-3.5 w-1/3 mt-2 rounded-full" />
      </div>
    )
  } else if (!shown) {
    content = (
      <div className="text-center">
        <span className="mx-auto w-14 h-14 rounded-full bg-pink-soft text-pink-text flex items-center justify-center mb-3">
          <Sparkles size={24} />
        </span>
        <p className="font-display font-semibold text-display-md text-text">No tienes libros pendientes</p>
        <p className="text-body-md text-text-secondary mt-2">
          Cuando agregues libros como Pendiente en tu Estante, aquí te ayudo a elegir el próximo.
        </p>
        <Button variant="primary" className="mt-5" onClick={onClose}>Entendido</Button>
      </div>
    )
  } else {
    content = (
      <>
        <p className="text-center text-body-md text-text-secondary">Tu próxima lectura podría ser…</p>
        <div className="flex flex-col items-center text-center mt-4" aria-live="polite">
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
          {books.length === 1 && <p className="text-body-sm text-text-muted mt-3">Es tu único pendiente.</p>}
        </div>

        <Button variant="orange" className="mt-6" onClick={() => setIsAskingDate(true)} disabled={isShuffling} isLoading={isStarting}>
          <BookOpen size={18} />
          Empezar a leer
        </Button>
        <div className="flex gap-2.5 mt-2.5">
          <Button variant="outline" className="flex-1" onClick={handleAgain} disabled={books.length < 2 || isShuffling}>
            <Shuffle size={16} />
            Otra vez
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isShuffling}>
            Ahora no
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <Modal variant="sheet" isOpen onClose={onClose} title="¿Qué leo ahora?">
        {content}
      </Modal>
      <StartReadingDateModal
        isOpen={isAskingDate}
        book={current}
        onConfirm={(startDate) => startReading(startDate)}
        onDismiss={() => startReading(null)}
      />
    </>
  )
}
