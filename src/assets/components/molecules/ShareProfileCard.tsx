import { forwardRef } from 'react'
import { Flag } from 'lucide-react'
import { Avatar } from '../atoms/Avatar'
import { Logo } from '../atoms/Logo'
import { ProgressBar } from '../atoms/ProgressBar'
import { MonthCalendar } from '../atoms/MonthCalendar'
import { RatingRow } from './RatingRow'
import { getProgressInfo } from '../../../lib/progress'
import type { Database } from '../../../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface ShareProfileCardProps {
  username: string | undefined
  bio: string | null | undefined
  avatarUrl: string | null | undefined
  annualGoal: number
  annualCompletedCount: number
  streak: number
  sessionDates: Set<string>
  currentlyReading: Book[]
  recentFinishedBook: Book | null
  recentFinishedRating: number | null
}

/** Fila de texto para un libro dentro de la tarjeta — título + autor, sin portada.
 *  Las portadas se quitaron porque las de Google Books no mandan cabecera CORS y
 *  html-to-image no puede incrustarlas al exportar la imagen (ver nota en
 *  ShareProfileModal); esta fila evita depender de esas imágenes por completo.
 *  `progressPercent`/`progressLabel` son solo para "Leyendo ahora" — vienen de
 *  `getProgressInfo()`, el mismo cálculo que usan Mesa/DetalleSaga/UpdateProgressModal,
 *  porque el progreso NO siempre vive en `progress_percent` (eso es solo para libros
 *  digitales; físico usa páginas y audiolibro usa duración). `rating` es solo para el
 *  libro terminado más reciente, y solo se muestra si ya tiene reseña con calificación. */
function BookRow({
  book,
  progressPercent,
  progressLabel,
  rating,
}: {
  book: Book
  progressPercent?: number
  progressLabel?: string
  rating?: number | null
}) {
  return (
    <div className="bg-surface border border-border rounded-xl px-3 py-2.5">
      <p className="font-body font-semibold text-body-md text-text">{book.title}</p>
      {book.author && <p className="text-body-sm text-text-secondary line-clamp-1">{book.author}</p>}

      {progressPercent !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-body-sm text-text-secondary mb-1">
            {progressLabel && <span>{progressLabel}</span>}
            <span className="ml-auto">{Math.round(progressPercent)}%</span>
          </div>
          <ProgressBar percent={progressPercent} />
        </div>
      )}

      {rating != null && rating > 0 && (
        <RatingRow shape="star" color="var(--color-accent-reading)" value={rating} size={14} className="mt-2" />
      )}
    </div>
  )
}

/** La tarjeta de perfil compartible en sí — un solo nodo con fondo y esquinas propias
 *  (para que, al exportarla a imagen, las esquinas fuera del redondeado queden
 *  transparentes en vez de blancas) que ShareProfileModal captura con html-to-image.
 *  Es puramente presentacional: toda la data ya viene resuelta por el modal. */
export const ShareProfileCard = forwardRef<HTMLDivElement, ShareProfileCardProps>(function ShareProfileCard(
  {
    username,
    bio,
    avatarUrl,
    annualGoal,
    annualCompletedCount,
    streak,
    sessionDates,
    currentlyReading,
    recentFinishedBook,
    recentFinishedRating,
  },
  ref,
) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const goalPercent = annualGoal > 0 ? Math.min(100, (annualCompletedCount / annualGoal) * 100) : 0

  // Mismo calendario de 2 meses (el actual + el anterior) que "Ritmo y hábito" en
  // Bitácora — acá sin flechas de navegación porque la tarjeta es una foto fija del
  // momento en que se comparte, no algo para explorar hacia atrás.
  const newerMonth = { year: currentYear, month: now.getMonth() + 1 }
  const olderMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const olderMonth = { year: olderMonthDate.getFullYear(), month: olderMonthDate.getMonth() + 1 }

  return (
    <div
      ref={ref}
      className="w-full bg-bg rounded-3xl border border-border overflow-hidden p-6 flex flex-col gap-5"
    >
      <div className="flex items-center justify-center">
        <Logo variant="full" className="h-10" />
      </div>

      <div className="text-center">
        <Avatar size="lg" src={avatarUrl ?? undefined} className="mx-auto" />
        <p className="font-display italic text-display-md text-text mt-3">@{username}</p>
        {bio && <p className="text-body-sm text-text-secondary mt-1 line-clamp-2">{bio}</p>}
      </div>

      {annualGoal > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-4 text-center">
          <p className="text-body-sm text-text-secondary">Meta anual {currentYear}</p>
          <p className="font-display text-display-md text-text mt-1">
            {annualCompletedCount} de {annualGoal} libros
          </p>
          <ProgressBar percent={goalPercent} className="mt-3" />
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-accent-reading flex items-center justify-center shrink-0">
            <Flag size={18} className="text-surface" />
          </div>
          <p className="font-display text-display-md text-text">
            {streak} día{streak === 1 ? '' : 's'} seguidos
          </p>
        </div>
        {/* Apilados en vez de lado a lado (como en Bitácora): acá la tarjeta es angosta
            (cabe en un modal, no en la pantalla completa), así que 2 meses lado a lado
            dejaba cada casilla de día demasiado chica para distinguir los números —
            apilados, cada mes usa todo el ancho de la tarjeta. */}
        <div className="flex flex-col gap-4">
          <MonthCalendar year={olderMonth.year} month={olderMonth.month} markedDates={sessionDates} />
          <MonthCalendar year={newerMonth.year} month={newerMonth.month} markedDates={sessionDates} />
        </div>
      </div>

      {currentlyReading.length > 0 && (
        <div>
          <p className="font-body font-semibold text-body-md text-text mb-2">Leyendo ahora</p>
          <div className="flex flex-col gap-2">
            {currentlyReading.slice(0, 3).map((book) => {
              const { percent, label } = getProgressInfo(book)
              return <BookRow key={book.id} book={book} progressPercent={percent} progressLabel={label} />
            })}
          </div>
        </div>
      )}

      {recentFinishedBook && (
        <div>
          <p className="font-body font-semibold text-body-md text-text mb-2">Terminado recientemente</p>
          <BookRow book={recentFinishedBook} rating={recentFinishedRating} />
        </div>
      )}

      <p className="text-center text-body-sm text-text-secondary mt-2">Hecho con Teleo, tu diario de lectura</p>
    </div>
  )
})
