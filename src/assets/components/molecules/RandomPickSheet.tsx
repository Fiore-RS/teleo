import { useEffect, useRef, useState } from 'react'
import { BookOpen, ImageOff, Shuffle, Sparkles } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { queryClient } from '../../../lib/queryClient'
import { recomputeSagaStatus } from '../../../lib/sagaStatus'
import { prefersReducedMotion } from '../../../lib/motion'
import { todayLocalDate } from '../../../lib/date'
import { useCachedQuery } from '../../../hooks/useCachedQuery'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
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
const SHUFFLE_TICKS = 8
const SHUFFLE_STEP_MS = 70

function pickOther(books: PendingBook[], excludeId: string | null): PendingBook | null {
  const pool = excludeId ? books.filter((b) => b.id !== excludeId) : books
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
}

interface RandomPickSheetProps {
  userId: string | undefined
  onClose: () => void
}

/** "¿Qué leo ahora?" (fase 2): elige al azar uno de los libros pendientes. "Otra vez" baraja
 *  las portadas un momento y cae en otro (nunca repite el que se estaba mostrando), "Ahora no"
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
  const [flashId, setFlashId] = useState<string | null>(null) // portada que pasa mientras se baraja
  const [isAskingDate, setIsAskingDate] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timerRef.current), [])

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
    let ticks = 0
    timerRef.current = window.setInterval(() => {
      ticks++
      if (ticks >= SHUFFLE_TICKS) {
        window.clearInterval(timerRef.current)
        setFlashId(null)
        setPickedId(next.id)
      } else {
        setFlashId(pickOther(books, null)?.id ?? null)
      }
    }, SHUFFLE_STEP_MS)
  }

  async function startReading(withStartDate: boolean) {
    if (!current) return
    setIsAskingDate(false)
    setIsStarting(true)
    await supabase
      .from('books')
      .update({ status: 'leyendo', ...(withStartDate ? { start_date: todayLocalDate() } : {}) })
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
              <CoverImage src={shown.cover_url} alt="" className="w-full h-full object-cover" />
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
        onConfirm={() => startReading(true)}
        onDismiss={() => startReading(false)}
      />
    </>
  )
}
