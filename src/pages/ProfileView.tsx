import { useState, type ReactNode } from 'react'
import { ImageOff, UserRound } from 'lucide-react'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { Skeleton, CoverSkeleton } from '../assets/components/atoms/Skeleton'
import { BannerArt } from '../assets/components/atoms/BannerArt'
import { CoverImage } from '../assets/components/atoms/CoverImage'
import { DogEar } from '../assets/components/atoms/DogEar'
import { HorizontalScroller } from '../assets/components/atoms/HorizontalScroller'
import { DEFAULT_BANNER, type BannerId } from '../lib/banners'
import { Card, CardAction } from '../assets/components/molecules/Card'
import type { Database } from '../types/database'
import type { LastFinishedBook, ProfileCounts, ProfileQuote } from '../hooks/useProfileLists'
import type { ReadingStatus } from '../lib/status'
import { getProgressInfo } from '../lib/progress'
import { getGoalMessage } from '../lib/goalMessage'
import { useStaggerOnce } from '../lib/motion'

type BookRow = Database['public']['Tables']['books']['Row']
type Book = Pick<BookRow, 'id' | 'title' | 'cover_url' | 'status'>

/** Filtro de Estante al que lleva cada número o "Ver todos". */
export type ProfileFilter = 'leyendo' | 'favoritos' | 'recomendados' | 'deseado' | 'terminado' | 'pendiente' | 'abandonado' | 'pausado'

/** Una estantería de la tarjeta "Estanterías": unas portadas al azar y cuántos hay en total. */
export interface ProfileShelf {
  key: 'favoritos' | 'recomendados' | 'deseados' | 'abandonados'
  label: string
  books: Book[]
  total: number
  filter: ProfileFilter
}

/** "Tu biblioteca": cada estado con su color de doblez; tocarlo abre Estante con ese filtro. */
const libraryParts: { key: keyof ProfileCounts | 'reading'; label: string; filter: ProfileFilter; color: string }[] = [
  { key: 'reading', label: 'Leyendo', filter: 'leyendo', color: 'var(--color-accent-reading)' },
  { key: 'paused', label: 'En pausa', filter: 'pausado', color: 'var(--color-state-paused)' },
  { key: 'finished', label: 'Leídos', filter: 'terminado', color: 'var(--color-accent-finished)' },
  { key: 'pending', label: 'Pendientes', filter: 'pendiente', color: 'var(--color-state-pending)' },
  { key: 'wishlist', label: 'Deseados', filter: 'deseado', color: 'var(--color-accent-wishlist)' },
  { key: 'abandoned', label: 'Abandonados', filter: 'abandonado', color: 'var(--color-state-abandoned)' },
]

const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)
const ratingFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

interface ProfileViewProps {
  username: string | undefined
  /** Nombre visible. Sin nickname se muestra el @usuario en grande. */
  nickname?: string | null
  /** Primera carga del perfil / de las listas: se muestran siluetas en vez de vacíos. */
  isProfileLoading?: boolean
  areListsLoading?: boolean
  bio: string | null | undefined
  avatarUrl: string | null | undefined
  /** Banner elegido en Editar perfil (V.2.1.0). */
  banner?: BannerId
  /** Año en que se creó la cuenta: "@usuario · en Teleo desde 2025". */
  memberSinceYear?: number

  headerRight?: ReactNode

  annualGoal?: number
  annualCompletedCount?: number
  /** Abre "Editar meta" desde la pestaña de la tarjeta (V.3.5.0). */
  onEditGoal?: () => void
  /** Racha actual de lectura, para las cifras de Tu biblioteca (V.3.5.0). */
  streak?: number

  currentlyReading?: BookRow[]
  lastFinished?: LastFinishedBook | null
  quote?: ProfileQuote | null
  shelves?: ProfileShelf[]
  counts?: ProfileCounts

  /** Mis próximas lecturas, que arma Perfil con sus propios datos. */
  priorityList?: ReactNode

  onBookClick?: (bookId: string) => void
  onSeeAllBooks?: (list: ProfileFilter) => void

  footer?: ReactNode
}

/** Portada chica de una fila (estanterías), con su doblez de estado. */
function ShelfCover({ book, onBookClick }: { book: Book; onBookClick?: (bookId: string) => void }) {
  const classes =
    'relative w-24 shrink-0 aspect-2/3 rounded-[10px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]'
  const cover = (
    <>
      {book.cover_url ? (
        <CoverImage src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff size={16} className="text-text-secondary" />
        </div>
      )}
      <DogEar status={book.status as ReadingStatus} size={24} className="absolute top-0 right-0" />
    </>
  )
  return onBookClick ? (
    <button
      onClick={() => onBookClick(book.id)}
      aria-label={book.title}
      className={`${classes} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text`}
    >
      {cover}
    </button>
  ) : (
    <div className={classes}>{cover}</div>
  )
}

/** Portada de "Ahora mismo" (más grande para Leyendo, chica para el último terminado). */
function NowCover({ book, size }: { book: Pick<BookRow, 'title' | 'cover_url'>; size: 'lg' | 'sm' }) {
  return (
    <span
      className={`${size === 'lg' ? 'w-[84px]' : 'w-[48px]'} shrink-0 aspect-2/3 rounded-[8px] overflow-hidden bg-surface-2 shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)] flex items-center justify-center`}
    >
      {book.cover_url ? (
        <CoverImage src={book.cover_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <ImageOff size={size === 'lg' ? 18 : 14} className="text-text-secondary" aria-hidden="true" />
      )}
    </span>
  )
}

/** Texto de progreso de "Leyendo": página de total, tiempo escuchado o porcentaje. */
function progressText(book: BookRow): string {
  if (book.format === 'audiolibro' && book.total_duration_seconds) return `${getProgressInfo(book).label} escuchado`
  if (book.format === 'digital') return `${Math.round(book.progress_percent ?? 0)}%`
  if (book.total_pages) return `Página ${book.current_page ?? 0} de ${book.total_pages}`
  return 'Recién empezado'
}

/** Rincón personal del usuario. Solo lo ve el dueño de la cuenta (la página pública se retiró
 *  en septiembre 2026); en la V.5.0.0 también lo verán las amistades, en solo lectura.
 *
 *  V.3.5.0, dirección A "Portada y estanterías": se queda la portada de la 3.0.0 (nombre sobre
 *  el banner, foto inclinada). Debajo, en menos bloques: Tu biblioteca con tres cifras, Ahora
 *  mismo (leyendo, último terminado, una cita), la meta igual que en La mesa, las estanterías en
 *  una sola tarjeta con selector y Mis próximas lecturas. Actividad salió de Perfil: el mismo
 *  calendario está en la racha de La mesa. */
export function ProfileView({
  username,
  nickname,
  isProfileLoading = false,
  areListsLoading = false,
  bio,
  avatarUrl,
  banner = DEFAULT_BANNER,
  memberSinceYear,
  headerRight,
  annualGoal = 0,
  annualCompletedCount = 0,
  onEditGoal,
  streak = 0,
  currentlyReading = [],
  lastFinished = null,
  quote = null,
  shelves = [],
  counts,
  priorityList,
  onBookClick,
  onSeeAllBooks,
  footer,
}: ProfileViewProps) {
  const stagger = useStaggerOnce('perfil')
  const currentYear = new Date().getFullYear()
  const goalPercent = annualGoal > 0 ? Math.min(100, (annualCompletedCount / annualGoal) * 100) : 0
  const displayName = nickname?.trim() || username
  const initial = displayName?.trim().charAt(0).toUpperCase() ?? ''
  const [activeShelfKey, setActiveShelfKey] = useState<ProfileShelf['key']>('favoritos')
  const activeShelf = shelves.find((s) => s.key === activeShelfKey) ?? shelves[0]

  const avatarInner = avatarUrl ? (
    <img src={avatarUrl} alt="Tu foto de perfil" className="w-full h-full object-cover" />
  ) : initial ? (
    <span className="font-title text-[52px] leading-none text-primary-ink">{initial}</span>
  ) : (
    <UserRound size={48} strokeWidth={1.5} className="text-primary-ink" />
  )

  const partCount = (key: (typeof libraryParts)[number]['key']) =>
    key === 'reading' ? currentlyReading.length : (counts?.[key] ?? 0)
  const libraryTotal = libraryParts.reduce((sum, p) => sum + partCount(p.key), 0)

  const reading = currentlyReading[0]
  const moreReading = currentlyReading.length - 1
  const hasNow = !!reading || !!lastFinished || !!quote

  const figures = [
    { value: numberFormat.format(libraryTotal), label: libraryTotal === 1 ? 'libro en Teleo' : 'libros en Teleo' },
    { value: numberFormat.format(annualCompletedCount), label: `${annualCompletedCount === 1 ? 'leído' : 'leídos'} en ${currentYear}` },
    { value: numberFormat.format(streak), label: streak === 1 ? 'día de racha' : 'días de racha' },
  ]

  return (
    <div className="min-h-screen bg-bg">
      {/* Portada (V.3.0.0): banner grande con el nombre encima a la izquierda, oscurecido abajo
          para que el texto se lea en cualquier tema; la foto va a la derecha, algo torcida,
          montada sobre el borde. El dibujo se muestra completo en su proporción (360 × 140)
          arriba, sin recortarse, y se desvanece hacia abajo; el degradado sigue debajo para
          dar lugar al nombre. */}
      <div className="relative">
        <div className="relative flex flex-col rounded-b-[28px] bg-linear-to-br from-primary to-rose overflow-hidden">
          <div
            className="relative aspect-18/7"
            style={{
              maskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 55%, transparent)',
            }}
          >
            <BannerArt banner={banner} />
          </div>
          <div className="h-[52px]" />
          <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-transparent from-40% to-[rgba(20,12,10,0.75)]" />
          <div
            className="absolute right-4 z-[2] flex items-center gap-2"
            style={{ top: 'calc(16px + env(safe-area-inset-top, 0px))' }}
          >
            {headerRight}
          </div>
          <div className="absolute left-5 right-[162px] bottom-[18px] z-[2] text-[#FFF8EE]">
            {isProfileLoading ? (
              <>
                <Skeleton className="h-10 w-4/5 rounded-full opacity-60" />
                <Skeleton className="h-3.5 w-3/5 mt-3 rounded-full opacity-60" />
              </>
            ) : (
              <>
                <h1 className="font-title text-[clamp(34px,11vw,46px)] leading-none tracking-[-0.01em] break-words line-clamp-2">
                  {displayName ?? ' '}
                </h1>
                <p className="font-body text-body-md leading-snug opacity-90 mt-2 break-words">
                  @{username}
                  {memberSinceYear ? ` · en Teleo desde ${memberSinceYear}` : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {/* La foto se cambia solo desde el lápiz (Editar perfil), junto con nickname y bio. */}
        <div className="absolute right-[18px] -bottom-14 z-[3] w-[132px] h-[132px] rounded-[32px] border-[5px] border-bg bg-linear-to-br from-primary to-rose rotate-[4deg] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.55)] flex items-center justify-center overflow-hidden">
          {avatarInner}
        </div>
      </div>

      <div className="px-4">
        {/* Bio: texto suelto bajo la portada, con lugar a la derecha para la foto. */}
        {isProfileLoading ? (
          <div className="px-1 pr-[150px] mt-3.5" aria-label="Cargando">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 mt-2.5 rounded-full" />
          </div>
        ) : (
          <p className={`px-1 pr-[150px] mt-3.5 min-h-[72px] font-display italic text-[17px] leading-snug text-pretty ${bio ? 'text-text' : 'text-text-muted'}`}>
            {bio || 'Agrega una descripción sobre ti con el lápiz de arriba.'}
          </p>
        )}

        <div className={`flex flex-col gap-5 mt-5 ${stagger}`}>
          {/* Tu biblioteca (V.3.5.0): tres cifras arriba; debajo la barra por estado y la
              leyenda. Cada estado abre Estante con ese filtro. */}
          <Card tab={{ label: 'Tu biblioteca' }}>
            {areListsLoading ? (
              <div aria-label="Cargando">
                <Skeleton className="h-10 w-full rounded-[8px]" />
                <Skeleton className="h-3.5 w-full rounded-[6px] mt-4" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 text-center">
                  {figures.map((f, i) => (
                    <div key={f.label} className={i > 0 ? 'border-l border-border px-1' : 'px-1'}>
                      <b className="block font-title font-normal text-[30px] leading-none text-text tabular-nums">{f.value}</b>
                      <span className="block text-[12px] leading-tight text-text-secondary mt-1.5">{f.label}</span>
                    </div>
                  ))}
                </div>
                {libraryTotal > 0 && (
                  <div className="flex h-3 gap-[3px] rounded-[5px] overflow-hidden mt-4" aria-hidden="true">
                    {libraryParts.filter((p) => partCount(p.key) > 0).map((p) => (
                      <i key={p.key} style={{ flex: partCount(p.key), background: p.color }} />
                    ))}
                  </div>
                )}
                <ul className="grid grid-cols-2 gap-x-3.5 gap-y-2 mt-3.5">
                  {libraryParts.map((p) => {
                    const value = partCount(p.key)
                    const inner = (
                      <>
                        <i aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] shrink-0 self-center" style={{ background: p.color }} />
                        <b className="font-display font-semibold text-[18px] text-text tabular-nums">{numberFormat.format(value)}</b>
                        <span className="truncate">{p.label}</span>
                      </>
                    )
                    const cls = 'flex items-baseline gap-2 text-body-md text-text-secondary text-left min-w-0'
                    return (
                      <li key={p.key}>
                        {onSeeAllBooks ? (
                          <button
                            type="button"
                            onClick={() => onSeeAllBooks(p.filter)}
                            aria-label={`${value} ${p.label.toLowerCase()}. Ver en Estante`}
                            className={`${cls} w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text`}
                          >
                            {inner}
                          </button>
                        ) : (
                          <div className={cls}>{inner}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </Card>

          {/* Ahora mismo (V.3.5.0): leyendo, el último terminado y una cita. */}
          {areListsLoading ? (
            <Card tab={{ label: 'Ahora mismo' }} tone="orange">
              <div className="flex gap-3.5" aria-label="Cargando">
                <CoverSkeleton className="w-[84px] shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-4/5 rounded-full" />
                  <Skeleton className="h-3.5 w-1/2 mt-2 rounded-full" />
                  <Skeleton className="h-2.5 w-full mt-5 rounded-[5px]" />
                </div>
              </div>
            </Card>
          ) : hasNow ? (
            <Card tab={{ label: 'Ahora mismo' }} tone="orange">
              <div className="divide-y divide-border">
                {reading && (
                  <div className="pb-4 last:pb-0">
                    <button
                      type="button"
                      onClick={() => onBookClick?.(reading.id)}
                      className="w-full flex gap-3.5 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                    >
                      <NowCover book={reading} size="lg" />
                      <span className="flex-1 min-w-0">
                        <span className="block smallcaps text-orange-text">Leyendo</span>
                        <span className="block font-display font-semibold text-[17px] leading-snug text-text mt-1 line-clamp-2">{reading.title}</span>
                        {reading.author && <span className="block text-body-sm text-text-secondary truncate mt-0.5">{reading.author}</span>}
                        <ProgressBar percent={getProgressInfo(reading).percent} color="var(--color-accent-reading)" shape="firme" className="mt-3" />
                        <span className="block text-body-sm text-text-secondary mt-1.5">{progressText(reading)}</span>
                      </span>
                    </button>
                    {moreReading > 0 && onSeeAllBooks && (
                      <button
                        type="button"
                        onClick={() => onSeeAllBooks('leyendo')}
                        className="mt-2.5 ml-[98px] font-body font-bold text-body-sm text-orange-text rounded-chip focus-visible:outline-2 focus-visible:outline-primary-text"
                      >
                        {moreReading === 1 ? 'Y 1 más en Estante' : `Y ${moreReading} más en Estante`}
                      </button>
                    )}
                  </div>
                )}
                {lastFinished && (
                  <button
                    type="button"
                    onClick={() => onBookClick?.(lastFinished.id)}
                    className="w-full flex items-center gap-3.5 text-left py-4 first:pt-0 last:pb-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                  >
                    <NowCover book={lastFinished} size="sm" />
                    <span className="flex-1 min-w-0">
                      <span className="block smallcaps text-primary-text">Último terminado</span>
                      <span className="block font-display font-semibold text-body-lg leading-snug text-text mt-1 truncate">{lastFinished.title}</span>
                      {lastFinished.rating != null && (
                        <span className="block text-body-sm font-semibold text-orange-text mt-0.5">
                          <span aria-hidden="true">★ </span>
                          {ratingFormat.format(lastFinished.rating)}
                          <span className="sr-only"> de calificación</span>
                        </span>
                      )}
                    </span>
                  </button>
                )}
                {quote && (
                  <div className="py-4 first:pt-0 last:pb-0">
                    <span className="block smallcaps text-primary-text">Una cita</span>
                    <span aria-hidden="true" className="quote-mark text-primary-text mt-2">“</span>
                    <p className="font-display italic text-body-lg leading-snug text-text">{quote.text}</p>
                    {(quote.bookTitle || quote.page != null) && (
                      <p className="text-body-sm text-text-secondary mt-1.5">
                        {[quote.bookTitle, quote.page != null ? `pág. ${quote.page}` : null].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ) : null}

          {/* Meta anual (V.3.5.0): igual que en La mesa, con "Editar" en la pestaña. */}
          {annualGoal > 0 && (
            <Card
              tab={{ label: 'Meta anual de lectura' }}
              tone="pink"
              action={onEditGoal ? <CardAction onClick={onEditGoal}>Editar</CardAction> : undefined}
            >
              <div className="flex items-end justify-between gap-3">
                <p className="font-title text-[40px] leading-none text-text">
                  <span className="tabular-nums">{annualCompletedCount}</span>{' '}
                  <span className="font-body font-medium text-body-md text-text-secondary">
                    de {annualGoal} libros del {currentYear}
                  </span>
                </p>
                <span className="font-display font-semibold text-[20px] text-pink-text tabular-nums">{Math.round(goalPercent)}%</span>
              </div>
              <ProgressBar percent={goalPercent} color="var(--color-pink)" shape="firme" className="mt-3.5 h-3.5" />
              <p className="font-display italic text-body-lg text-text-secondary mt-3">{getGoalMessage(goalPercent)}</p>
            </Card>
          )}

          {/* Estanterías (V.3.5.0): Favoritos, Recomendados, Deseados y Abandonados en una sola
              tarjeta, con un selector de pestañas de texto que se puede deslizar. */}
          {activeShelf && (
            <Card
              tab={{ label: 'Estanterías' }}
              action={
                onSeeAllBooks && activeShelf.total > 0 ? (
                  <CardAction onClick={() => onSeeAllBooks(activeShelf.filter)}>Ver todos</CardAction>
                ) : undefined
              }
            >
              <div role="tablist" aria-label="Estanterías" className="flex gap-4 overflow-x-auto scrollbar-hide border-b border-border -mt-1 mb-3.5">
                {shelves.map((s) => {
                  const isActive = s.key === activeShelf.key
                  return (
                    <button
                      key={s.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveShelfKey(s.key)}
                      className={`shrink-0 pb-2 pt-1 font-body text-body-md whitespace-nowrap border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
                        isActive ? 'border-primary text-primary-text font-bold' : 'border-transparent text-text-secondary font-semibold'
                      }`}
                    >
                      {s.label}
                      <span className={`ml-1.5 tabular-nums ${isActive ? 'text-primary-text' : 'text-text-muted'}`}>{s.total}</span>
                    </button>
                  )
                })}
              </div>
              {areListsLoading ? (
                <div className="flex gap-3 -mx-[18px] px-[18px] overflow-hidden pb-1" aria-label="Cargando">
                  {[0, 1, 2, 3].map((i) => (
                    <CoverSkeleton key={i} className="w-24 shrink-0" />
                  ))}
                </div>
              ) : activeShelf.books.length === 0 ? (
                <p className="text-body-md text-text-secondary">Nada por aquí todavía.</p>
              ) : (
                <HorizontalScroller key={activeShelf.key} className="-mx-[18px] px-[18px] gap-3! pb-1 animate-fade-in">
                  {activeShelf.books.map((book) => (
                    <ShelfCover key={book.id} book={book} onBookClick={onBookClick} />
                  ))}
                </HorizontalScroller>
              )}
            </Card>
          )}

          {priorityList}
        </div>
      </div>

      {footer}
    </div>
  )
}
