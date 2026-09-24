import { forwardRef, useState, type ReactNode } from 'react'
import { BookOpen } from 'lucide-react'
import logoFullCream from '../../images/logo/logo-full-dark.svg'
import { Sparkle } from '../atoms/Sparkle'
import { RatingRow } from './RatingRow'
import { shareSafeImageUrl } from '../../../lib/shareImage'
import type { ShareBook } from '../../../hooks/useShareCardExtras'

/** Tamaño de la tarjeta en pantalla. Se exporta con pixelRatio 3: 1080 × 1920 (historia). */
export const SHARE_CARD_WIDTH = 360
export const SHARE_CARD_HEIGHT = 640

// Rellenos de portada cuando un libro no tiene imagen o no se pudo cargar.
const FALLBACK_COVERS = [
  'linear-gradient(160deg, #2F5D62, #1E3B40)',
  'linear-gradient(160deg, #C9803E, #8C4A24)',
  'linear-gradient(160deg, #6A4C93, #3E2A5E)',
]

function Cover({ book, index }: { book: ShareBook; index: number }) {
  const src = shareSafeImageUrl(book.cover_url)
  const [failed, setFailed] = useState(false)
  const box = 'w-full aspect-2/3 rounded-[10px] overflow-hidden shadow-[0_8px_16px_-10px_rgba(40,20,10,0.7)]'

  if (!src || failed) {
    return (
      <div className={`${box} flex flex-col justify-between p-2 text-[#FFF8EE]`} style={{ background: FALLBACK_COVERS[index % 3] }}>
        <span className="font-display font-semibold text-[10px] leading-tight line-clamp-4">{book.title}</span>
        {book.author && <span className="text-[6.5px] uppercase tracking-[0.06em] opacity-85 truncate">{book.author}</span>}
      </div>
    )
  }
  return (
    <div className={box}>
      <img src={src} alt="" crossOrigin="anonymous" onError={() => setFailed(true)} className="w-full h-full object-cover" />
    </div>
  )
}

function BookColumn({
  label,
  labelClass,
  book,
  index,
  emptyText,
  children,
  onPick,
}: {
  label: string
  labelClass: string
  book: ShareBook | null
  index: number
  emptyText: string
  children?: ReactNode
  /** Solo en la vista previa: tocar la columna para elegir otro libro. */
  onPick?: () => void
}) {
  const Wrapper = onPick ? 'button' : 'div'
  return (
    <Wrapper
      {...(onPick ? { type: 'button' as const, onClick: onPick, 'aria-label': `Elegir libro para ${label}` } : {})}
      className="flex flex-col items-center text-center min-w-0 rounded-xl"
    >
      <p className={`font-body font-bold text-[10px] uppercase tracking-[0.14em] mb-2.5 ${labelClass}`}>{label}</p>
      {book ? (
        <>
          <Cover book={book} index={index} />
          <p className="font-display font-semibold text-[11.5px] leading-tight text-text mt-2 line-clamp-2">{book.title}</p>
          {book.author && <p className="text-[10px] text-text-secondary mt-0.5 truncate max-w-full">{book.author}</p>}
          {children}
        </>
      ) : (
        <>
          <div className="w-full aspect-2/3 rounded-[10px] bg-border/70 flex items-center justify-center text-text-muted">
            <BookOpen size={24} strokeWidth={1.8} />
          </div>
          <p className="text-[11.5px] text-text-secondary mt-2">{emptyText}</p>
        </>
      )}
    </Wrapper>
  )
}

export interface ShareProfileCardProps {
  username: string | undefined
  nickname: string | null | undefined
  avatarUrl: string | null | undefined
  annualGoal: number
  annualCompletedCount: number
  streak: number
  longestStreak: number
  lastFinished: ShareBook | null
  lastFinishedRating: number | null
  currentBook: ShareBook | null
  currentPercent: number
  nextBook: ShareBook | null
  onPickCurrent?: () => void
  onPickNext?: () => void
}

/** Tarjeta para compartir en formato historia (fase 8, maqueta aprobada el 23 de septiembre).
 *  Es solo presentación: ShareProfileModal resuelve los datos y la captura con html-to-image.
 *  Usa los colores del tema activo, así que sale en claro u oscuro según la app. */
export const ShareProfileCard = forwardRef<HTMLDivElement, ShareProfileCardProps>(function ShareProfileCard(
  {
    username,
    nickname,
    avatarUrl,
    annualGoal,
    annualCompletedCount,
    streak,
    longestStreak,
    lastFinished,
    lastFinishedRating,
    currentBook,
    currentPercent,
    nextBook,
    onPickCurrent,
    onPickNext,
  },
  ref,
) {
  const now = new Date()
  const year = now.getFullYear()
  const monthLabel = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(now)
  const displayName = nickname?.trim() || username || ''
  const initial = displayName.charAt(0).toUpperCase()
  const goalPercent = annualGoal > 0 ? Math.min(100, (annualCompletedCount / annualGoal) * 100) : 0
  const avatarSrc = shareSafeImageUrl(avatarUrl, 400)
  const appUrl = `${window.location.host}${import.meta.env.BASE_URL}`.replace(/\/$/, '')

  return (
    <div
      ref={ref}
      style={{ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT }}
      className="relative overflow-hidden rounded-[22px] bg-bg bg-glow-top text-text flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-[150px] shrink-0 rounded-b-[26px] overflow-hidden bg-linear-to-br from-primary to-rose">
        <div aria-hidden="true" className="absolute inset-0">
          <span className="absolute -top-[60px] -left-10 w-40 h-40 rounded-full bg-primary-ink/10 blur-xl" />
          <span className="absolute -bottom-[90px] -right-[50px] w-[190px] h-[190px] rounded-full border border-dashed border-primary-ink/30" />
          <span className="absolute -top-[70px] left-[34%] w-[150px] h-[150px] rounded-full border border-primary-ink/15" />
          <Sparkle size={16} className="absolute left-[46%] top-[52px] text-primary-ink/50" />
          <Sparkle size={9} className="absolute left-[62%] top-[96px] text-primary-ink/40" />
          <Sparkle size={10} className="absolute left-[18%] top-[28px] text-primary-ink/40" />
        </div>
        <img src={logoFullCream} alt="Teleo" className="absolute top-4 right-[18px] h-[30px] w-auto" />
      </div>

      {/* Foto, nickname y @ */}
      <div className="relative flex items-end gap-3.5 px-5 -mt-11">
        <div className="w-[108px] h-[108px] shrink-0 rounded-[30px] border-[3px] border-bg overflow-hidden bg-linear-to-br from-primary to-rose flex items-center justify-center shadow-[0_10px_20px_-12px_rgba(40,20,10,0.6)]">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" crossOrigin="anonymous" className="w-full h-full object-cover" />
          ) : (
            <span className="font-title text-[54px] leading-none text-primary-ink">{initial}</span>
          )}
        </div>
        <div className="min-w-0 pb-0.5">
          <p className="font-title text-[30px] leading-none text-text truncate">{displayName}</p>
          <p className="text-[13px] text-text-secondary mt-1 truncate">
            @{username} · {monthLabel}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3.5 px-5 pt-[18px]">
        {/* Meta y racha */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-pink-soft px-3 py-2.5">
            <p className="font-body font-bold text-[9.5px] uppercase tracking-[0.14em] text-pink-text">Meta {year}</p>
            {annualGoal > 0 ? (
              <>
                <p className="font-display font-semibold text-[24px] leading-tight mt-1">
                  {annualCompletedCount} <span className="font-body font-normal text-[12px] text-text-secondary">de {annualGoal} libros</span>
                </p>
                <div className="h-1.5 rounded-full bg-text-muted/20 mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-pink" style={{ width: `${goalPercent}%` }} />
                </div>
              </>
            ) : (
              <p className="font-display font-semibold text-[24px] leading-tight mt-1">
                {annualCompletedCount} <span className="font-body font-normal text-[12px] text-text-secondary">{annualCompletedCount === 1 ? 'libro leído' : 'libros leídos'}</span>
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-orange-soft px-3 py-2.5">
            <p className="font-body font-bold text-[9.5px] uppercase tracking-[0.14em] text-orange-text">Racha</p>
            <p className="font-display font-semibold text-[24px] leading-tight mt-1">
              {streak} <span className="font-body font-normal text-[12px] text-text-secondary">{streak === 1 ? 'día seguido' : 'días seguidos'}</span>
            </p>
            <p className="text-[11px] text-text-secondary mt-1">La más larga: {longestStreak}</p>
          </div>
        </div>

        {/* Última, actual y próxima */}
        <div className="bg-surface border border-border rounded-[18px] px-3 pt-4 pb-[18px]">
          <div className="grid grid-cols-3 gap-2.5">
            <BookColumn label="Última" labelClass="text-magenta-text" book={lastFinished} index={0} emptyText="Aún ninguno">
              {lastFinishedRating != null && lastFinishedRating > 0 && (
                <RatingRow shape="star" color="var(--color-orange)" value={lastFinishedRating} size={10} className="mt-1 justify-center gap-0.5!" />
              )}
            </BookColumn>
            <BookColumn label="Actual" labelClass="text-orange-text" book={currentBook} index={1} emptyText="Nada ahora" onPick={onPickCurrent}>
              <div className="w-4/5 h-1 rounded-full bg-text-muted/20 mt-1.5 overflow-hidden">
                <div className="h-full rounded-full bg-orange" style={{ width: `${Math.min(100, currentPercent)}%` }} />
              </div>
            </BookColumn>
            <BookColumn label="Próxima" labelClass="text-pink-text" book={nextBook} index={2} emptyText="Sin elegir" onPick={onPickNext} />
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="shrink-0 flex items-center justify-between px-5 pt-3 pb-4">
        <p className="font-title text-[18px] text-primary-text">
          Teleo <span className="font-body text-[11px] text-text-secondary">a mi manera</span>
        </p>
        <p className="text-[10.5px] text-text-muted">{appUrl}</p>
      </div>
    </div>
  )
})
