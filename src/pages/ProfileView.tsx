import type { ReactNode } from 'react'
import { UserRound, Target, BookOpen, Heart, ThumbsUp, Bookmark, BookX } from 'lucide-react'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { Skeleton } from '../assets/components/atoms/Skeleton'
import { Eyebrow } from '../assets/components/atoms/Eyebrow'
import { BannerArt } from '../assets/components/atoms/BannerArt'
import { DEFAULT_BANNER, type BannerId } from '../lib/banners'
import { Card } from '../assets/components/molecules/Card'
import { ProfileBookShelf } from '../assets/components/molecules/ProfileBookShelf'
import type { Database } from '../types/database'
import type { ProfileCounts } from '../hooks/useProfileLists'

type Book = Pick<Database['public']['Tables']['books']['Row'], 'id' | 'title' | 'cover_url' | 'status'>

/** Filtro de Estante al que lleva cada número o "Ver todos". */
export type ProfileFilter = 'leyendo' | 'favoritos' | 'recomendados' | 'deseado' | 'terminado' | 'pendiente' | 'abandonado'

const countTiles: { key: keyof ProfileCounts; label: string; filter: ProfileFilter }[] = [
  { key: 'finished', label: 'Leídos', filter: 'terminado' },
  { key: 'pending', label: 'Pendientes', filter: 'pendiente' },
  { key: 'wishlist', label: 'Deseados', filter: 'deseado' },
  { key: 'abandoned', label: 'Abandonados', filter: 'abandonado' },
]

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
    <span className="font-title text-[60px] leading-none text-primary-ink">{initial}</span>
  ) : (
    <UserRound size={44} strokeWidth={1.5} className="text-primary-ink" />
  )

  const avatarClasses =
    'relative w-32 h-32 shrink-0 rounded-[32px] border-4 border-bg bg-linear-to-br from-primary to-rose shadow-card flex items-center justify-center overflow-hidden'

  return (
    <div className="min-h-screen bg-bg">
      {/* Cabecera con degradado. Tiene la misma proporción que el dibujo del banner (360 × 140),
          así el banner se ve completo en cualquier ancho de pantalla. */}
      <div className="relative aspect-18/7 rounded-b-[32px] bg-linear-to-br from-primary to-rose overflow-hidden">
        {/* El banner que eligió la persona (se cambia desde el lápiz). Se pinta en el color
            crema del tema sobre el degradado, así funciona en todos los temas y modos. */}
        <BannerArt banner={banner} />
        {/* Sin título visible: la cabecera es el espacio del banner. */}
        <h1 className="sr-only">Tu rincón</h1>
        <div className="flex items-start justify-end gap-3 px-5 pt-5">
          {headerRight}
        </div>
      </div>

      <div className="px-4">
        {/* Avatar + nombre */}
        <div className="flex items-end gap-4 px-1 -mt-12">
          {/* La foto se cambia solo desde el lápiz (Editar perfil), junto con nickname y bio. */}
          <div className={avatarClasses}>{avatarInner}</div>

          {isProfileLoading ? (
            <div className="flex-1 min-w-0 pb-2">
              <Skeleton className="h-7 w-3/4 rounded-full" />
              <Skeleton className="h-3.5 w-1/2 mt-2.5 rounded-full" />
            </div>
          ) : (
            <div className="min-w-0 flex-1 pb-1">
              <p className="font-title text-[28px] leading-tight text-text truncate">{displayName ?? ' '}</p>
              <p className="font-body text-body-md text-text-secondary truncate">@{username}</p>
            </div>
          )}
        </div>

        {/* Bio: texto suelto debajo de la foto, el nickname y el @, sin tarjeta. Se edita
            desde el botón de lápiz de la cabecera (Editar perfil). */}
        {isProfileLoading ? (
          <div className="px-1 mt-4" aria-label="Cargando">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 mt-2.5 rounded-full" />
          </div>
        ) : (
          <p className={`px-1 mt-4 font-display italic text-body-lg leading-relaxed text-pretty ${bio ? 'text-text' : 'text-text-muted'}`}>
            {bio || 'Agrega una descripción sobre ti con el lápiz de arriba.'}
          </p>
        )}

        {/* Cuatro números: cada uno abre Estante con ese filtro */}
        <div className="grid grid-cols-4 divide-x divide-border mt-5" aria-label="Tu biblioteca en números">
          {countTiles.map((tile) => {
            const value = counts?.[tile.key]
            const inner = (
              <>
                {areListsLoading ? (
                  <Skeleton className="h-8 w-10 rounded-md" />
                ) : (
                  <span className="font-display font-semibold text-[32px] leading-none tabular-nums text-text">{value ?? 0}</span>
                )}
                <span className="text-[12px] leading-tight text-text-secondary">{tile.label}</span>
              </>
            )
            const boxClass = 'px-1 py-1 flex flex-col items-center justify-center gap-1.5 text-center'
            return onSeeAllBooks ? (
              <button
                key={tile.key}
                type="button"
                onClick={() => onSeeAllBooks(tile.filter)}
                aria-label={`${value ?? 0} ${tile.label.toLowerCase()}. Ver en Estante`}
                className={`${boxClass} transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text`}
              >
                {inner}
              </button>
            ) : (
              <div key={tile.key} className={boxClass}>{inner}</div>
            )
          })}
        </div>

        <div className="flex flex-col gap-5 mt-5 stagger-children">
          {/* Meta anual */}
          {annualGoal > 0 && (
            <Card labelledBy="perfil-meta">
              <Eyebrow id="perfil-meta" icon={Target} tone="pink" className="mb-3.5">Meta anual de lectura</Eyebrow>
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
