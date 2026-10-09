import type { ReactNode } from 'react'
import { UserRound, Target, BookOpen, Heart, ThumbsUp, Bookmark, BookX, Library } from 'lucide-react'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { Skeleton } from '../assets/components/atoms/Skeleton'
import { BannerArt } from '../assets/components/atoms/BannerArt'
import { DEFAULT_BANNER, type BannerId } from '../lib/banners'
import { Card } from '../assets/components/molecules/Card'
import { ProfileBookShelf } from '../assets/components/molecules/ProfileBookShelf'
import type { Database } from '../types/database'
import type { ProfileCounts } from '../hooks/useProfileLists'

type Book = Pick<Database['public']['Tables']['books']['Row'], 'id' | 'title' | 'cover_url' | 'status'>

/** Filtro de Estante al que lleva cada número o "Ver todos". */
export type ProfileFilter = 'leyendo' | 'favoritos' | 'recomendados' | 'deseado' | 'terminado' | 'pendiente' | 'abandonado'

/** "Tu biblioteca": cada estado con su color de doblez; tocarlo abre Estante con ese filtro. */
const libraryParts: { key: keyof ProfileCounts | 'reading'; label: string; filter: ProfileFilter; color: string }[] = [
  { key: 'reading', label: 'Leyendo', filter: 'leyendo', color: 'var(--color-accent-reading)' },
  { key: 'finished', label: 'Leídos', filter: 'terminado', color: 'var(--color-accent-finished)' },
  { key: 'pending', label: 'Pendientes', filter: 'pendiente', color: 'var(--color-state-pending)' },
  { key: 'wishlist', label: 'Deseados', filter: 'deseado', color: 'var(--color-accent-wishlist)' },
  { key: 'abandoned', label: 'Abandonados', filter: 'abandonado', color: 'var(--color-state-abandoned)' },
]

const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)

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

  currentlyReading?: Book[]
  favorites?: Book[]
  recommended?: Book[]
  wishlist?: Book[]
  abandoned?: Book[]
  counts?: ProfileCounts

  /** Tarjetas que arma Perfil con sus propios datos: Actividad y Lista de temporada. */
  activity?: ReactNode
  priorityList?: ReactNode

  onBookClick?: (bookId: string) => void
  onSeeAllBooks?: (list: ProfileFilter) => void

  footer?: ReactNode
}

/** Rincón personal del usuario — antes también servía como la vista de "perfil público"
 *  que veían visitantes sin cuenta (`readOnly`), con secciones que se podían ocultar una
 *  por una desde Configuración. Esa página pública se retiró (ver plan en memoria del
 *  proyecto: reemplazada por la tarjeta compartible de "Compartir perfil"), así que ahora
 *  este componente SOLO lo ve el dueño de la cuenta y siempre muestra todo — cada sección
 *  ya maneja su propio estado vacío (ProfileBookShelf) o se oculta sola si no aplica
 *  (meta anual, cuando no hay una meta puesta).
 *
 *  Rediseño 2026: cabecera con degradado de marca (vino → rosa), avatar cuadrado de
 *  esquinas suaves que se monta sobre la cabecera, y cada sección como tarjeta con su
 *  etiqueta en mayúsculas, igual que La mesa y Bitácora. */
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
  currentlyReading = [],
  favorites = [],
  recommended = [],
  wishlist = [],
  abandoned = [],
  counts,
  activity,
  priorityList,
  onBookClick,
  onSeeAllBooks,
  footer,
}: ProfileViewProps) {
  const currentYear = new Date().getFullYear()
  const goalPercent = annualGoal > 0 ? Math.min(100, (annualCompletedCount / annualGoal) * 100) : 0
  const displayName = nickname?.trim() || username
  const initial = displayName?.trim().charAt(0).toUpperCase() ?? ''

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

        <div className="flex flex-col gap-5 mt-5 stagger-children">
          {/* Tu biblioteca: total, barra por estado y leyenda; cada estado abre Estante. */}
          <Card tab={{ label: 'Tu biblioteca', icon: Library }}>
            {areListsLoading ? (
              <div aria-label="Cargando">
                <Skeleton className="h-7 w-2/5 rounded-full" />
                <Skeleton className="h-4 w-full rounded-full mt-3" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline justify-between gap-3 mb-3">
                  <b className="font-display font-semibold text-[28px] leading-none text-text tabular-nums">{numberFormat.format(libraryTotal)}</b>
                  <span className="text-body-md text-text-secondary">{libraryTotal === 1 ? 'libro en Teleo' : 'libros en Teleo'}</span>
                </div>
                {libraryTotal > 0 && (
                  <div className="flex h-4 gap-[3px] rounded-full overflow-hidden" aria-hidden="true">
                    {libraryParts.filter((p) => partCount(p.key) > 0).map((p) => (
                      <i key={p.key} style={{ flex: partCount(p.key), background: p.color }} />
                    ))}
                  </div>
                )}
                <ul className="grid grid-cols-2 gap-x-3.5 gap-y-2.5 mt-3.5">
                  {libraryParts.map((p) => {
                    const value = partCount(p.key)
                    const inner = (
                      <>
                        <i aria-hidden="true" className="w-2.5 h-2.5 rounded-[3px] shrink-0 self-center" style={{ background: p.color }} />
                        <b className="font-display font-semibold text-[20px] text-text tabular-nums">{numberFormat.format(value)}</b>
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

          {/* Meta anual */}
          {annualGoal > 0 && (
            <Card tab={{ label: 'Meta anual de lectura', icon: Target }} tone="pink">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display font-semibold text-[28px] leading-none text-text">
                  {annualCompletedCount}{' '}
                  <span className="font-body font-medium text-body-md text-text-secondary">
                    de {annualGoal} libros del {currentYear}
                  </span>
                </p>
                <span className="font-display font-semibold text-pink-text tabular-nums">{Math.round(goalPercent)}%</span>
              </div>
              <ProgressBar percent={goalPercent} color="var(--color-pink)" className="mt-3 h-3" />
            </Card>
          )}

          <ProfileBookShelf
            title="Leyendo ahora"
            icon={BookOpen}
            tone="orange"
            books={currentlyReading}
            isLoading={areListsLoading}
            onBookClick={onBookClick}
            onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('leyendo') : undefined}
          />

          {activity}
          {priorityList}

          <ProfileBookShelf
            title="Favoritos"
            icon={Heart}
            books={favorites}
            isLoading={areListsLoading}
            onBookClick={onBookClick}
            onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('favoritos') : undefined}
          />

          <ProfileBookShelf
            title="Recomendados"
            icon={ThumbsUp}
            tone="pink"
            books={recommended}
            isLoading={areListsLoading}
            onBookClick={onBookClick}
            onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('recomendados') : undefined}
          />

          <ProfileBookShelf
            title="Lista de deseados"
            icon={Bookmark}
            books={wishlist}
            isLoading={areListsLoading}
            onBookClick={onBookClick}
            onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('deseado') : undefined}
          />

          <ProfileBookShelf
            title="Abandonados"
            icon={BookX}
            books={abandoned}
            isLoading={areListsLoading}
            onBookClick={onBookClick}
            onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('abandonado') : undefined}
          />
        </div>
      </div>

      {footer}
    </div>
  )
}
