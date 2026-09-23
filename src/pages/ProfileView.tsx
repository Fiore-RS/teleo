import type { ReactNode } from 'react'
import { Camera, Target, BookOpen, Heart, ThumbsUp, Bookmark } from 'lucide-react'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { Skeleton } from '../assets/components/atoms/Skeleton'
import { Eyebrow } from '../assets/components/atoms/Eyebrow'
import { Sparkle } from '../assets/components/atoms/Sparkle'
import { Card } from '../assets/components/molecules/Card'
import { ProfileBookShelf } from '../assets/components/molecules/ProfileBookShelf'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface ProfileViewProps {
  username: string | undefined
  /** Nombre visible. Sin nickname se muestra el @usuario en grande. */
  nickname?: string | null
  /** Primera carga del perfil / de las listas: se muestran siluetas en vez de vacíos. */
  isProfileLoading?: boolean
  areListsLoading?: boolean
  bio: string | null | undefined
  avatarUrl: string | null | undefined

  headerRight?: ReactNode
  onAvatarClick?: () => void
  isUploadingAvatar?: boolean

  annualGoal?: number
  annualCompletedCount?: number

  currentlyReading?: Book[]
  favorites?: Book[]
  recommended?: Book[]
  wishlist?: Book[]

  onBookClick?: (bookId: string) => void
  onSeeAllBooks?: (list: 'leyendo' | 'favoritos' | 'recomendados' | 'deseado') => void

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
  headerRight,
  onAvatarClick,
  isUploadingAvatar,
  annualGoal = 0,
  annualCompletedCount = 0,
  currentlyReading = [],
  favorites = [],
  recommended = [],
  wishlist = [],
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
    <Camera size={40} strokeWidth={1.5} className="text-primary-ink" />
  )

  const avatarClasses =
    'relative w-32 h-32 shrink-0 rounded-[32px] border-4 border-bg bg-linear-to-br from-primary to-rose shadow-card flex items-center justify-center overflow-hidden'

  return (
    <div className="min-h-screen bg-bg">
      {/* Cabecera con degradado */}
      <div className="relative h-40 rounded-b-[32px] bg-linear-to-br from-primary to-rose overflow-hidden">
        {/* Decoración de la cabecera: luces suaves, una órbita punteada, destellos y puntitos.
            Todo en el color crema con poca opacidad, para que funcione sobre el degradado en
            los dos modos. Se deja libre la esquina de abajo a la izquierda (avatar) y la de
            arriba a la derecha (Configuración). */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -top-16 -left-10 w-48 h-48 rounded-full bg-primary-ink/10 blur-2xl" />
          <span className="absolute -bottom-20 right-4 w-56 h-56 rounded-full bg-primary-ink/10 blur-2xl" />
          <span className="absolute -bottom-28 right-[-40px] w-64 h-64 rounded-full border border-dashed border-primary-ink/25" />
          <span className="absolute -top-24 left-[30%] w-52 h-52 rounded-full border border-primary-ink/10" />

          <Sparkle size={18} className="absolute left-[44%] top-[58px] text-primary-ink/45" />
          <Sparkle size={10} className="absolute left-[58%] top-[102px] text-primary-ink/35" />
          <Sparkle size={13} className="absolute right-[26%] top-[34px] text-primary-ink/30" />
          <Sparkle size={12} className="absolute right-10 bottom-8 text-primary-ink/40" />
          <Sparkle size={8} className="absolute left-[34%] top-[118px] text-primary-ink/30" />
          <Sparkle size={9} className="absolute left-[18%] top-[30px] text-primary-ink/30" />
          <Sparkle size={7} className="absolute right-[40%] bottom-5 text-primary-ink/35" />

          <span className="absolute left-[52%] top-[40px] w-1 h-1 rounded-full bg-primary-ink/50" />
          <span className="absolute left-[28%] top-[76px] w-1.5 h-1.5 rounded-full bg-primary-ink/30" />
          <span className="absolute right-[18%] top-[88px] w-1 h-1 rounded-full bg-primary-ink/45" />
          <span className="absolute left-[66%] top-[70px] w-1 h-1 rounded-full bg-primary-ink/35" />
          <span className="absolute right-[32%] bottom-12 w-1.5 h-1.5 rounded-full bg-primary-ink/25" />
        </div>
        {/* Sin título visible: este espacio de la cabecera queda libre para que más adelante
            cada persona pueda personalizarlo (color, imagen, etc.). */}
        <h1 className="sr-only">Tu rincón</h1>
        <div className="flex items-start justify-end gap-3 px-5 pt-8">
          {headerRight}
        </div>
      </div>

      <div className="px-4">
        {/* Avatar + nombre */}
        <div className="flex items-end gap-4 px-1 -mt-12">
          {onAvatarClick ? (
            <button
              onClick={onAvatarClick}
              disabled={isUploadingAvatar}
              aria-label="Cambiar foto de perfil"
              className={`${avatarClasses} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text`}
            >
              {avatarInner}
              <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/95 text-primary-text flex items-center justify-center shadow-sm">
                <Camera size={14} />
              </span>
            </button>
          ) : (
            <div className={avatarClasses}>{avatarInner}</div>
          )}

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

        <div className="flex flex-col gap-5 mt-6 stagger-children">
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
        </div>
      </div>

      {footer}
    </div>
  )
}
