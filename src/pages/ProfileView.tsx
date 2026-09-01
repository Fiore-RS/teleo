import type { ReactNode } from 'react'
import { Camera, SquarePen } from 'lucide-react'
import { SectionHeader } from '../assets/components/atoms/SectionHeader'
import { ProgressBar } from '../assets/components/atoms/ProgressBar'
import { ProfileBookShelf } from '../assets/components/molecules/ProfileBookShelf'
import type { Database } from '../types/database'

type Book = Database['public']['Tables']['books']['Row']

interface ProfileViewProps {
  username: string | undefined
  bio: string | null | undefined
  avatarUrl: string | null | undefined

  headerRight?: ReactNode
  onAvatarClick?: () => void
  isUploadingAvatar?: boolean
  onEditBioClick?: () => void

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
 *  (meta anual, cuando no hay una meta puesta). */
export function ProfileView({
  username,
  bio,
  avatarUrl,
  headerRight,
  onAvatarClick,
  isUploadingAvatar,
  onEditBioClick,
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

  const avatarContent = avatarUrl ? (
    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
  ) : (
    <Camera size={64} strokeWidth={1.5} className="text-surface" />
  )

  return (
    <div className="min-h-screen bg-bg p-4">
      <div className="mt-4 space-y-10">
        <SectionHeader title="Tu rincón personal" rightContent={headerRight} />

        <div className="text-center">
          {onAvatarClick ? (
            <button
              onClick={onAvatarClick}
              disabled={isUploadingAvatar}
              className="relative z-0 w-56 h-56 max-w-[60%] aspect-square rounded-full mx-auto bg-accent-wishlist flex items-center justify-center overflow-hidden"
            >
              {avatarContent}
            </button>
          ) : (
            <div className="relative z-0 w-56 h-56 max-w-[60%] aspect-square rounded-full mx-auto bg-accent-wishlist flex items-center justify-center overflow-hidden">
              {avatarContent}
            </div>
          )}

          <div className="relative z-10 -mt-12 bg-surface border border-border rounded-3xl p-4 pt-6 text-left">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display italic text-display-lg text-text truncate">@{username}</p>
              {onEditBioClick && (
                <button onClick={onEditBioClick} aria-label="Editar perfil" className="text-text shrink-0">
                  <SquarePen size={22} strokeWidth={1.75} />
                </button>
              )}
            </div>
            <div className="bg-bg rounded-xl p-4 mt-3">
              <p className="text-body-md text-text-secondary">
                {bio || 'Agrega una descripción sobre ti...'}
              </p>
            </div>
          </div>
        </div>

        {annualGoal > 0 && (
          <div>
            <h3 className="font-display italic text-display-md text-accent-wishlist">Meta anual de lectura</h3>
            <div className="border-b-6 border-border mt-2 mb-3" />
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <p className="font-display text-display-lg text-text">{annualCompletedCount} de {annualGoal}</p>
              <p className="text-body-md text-text-secondary">libros del {currentYear}</p>
              <ProgressBar percent={goalPercent} className="mt-4" />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-body-sm text-text-secondary">{annualCompletedCount} de {annualGoal}</span>
                <span className="text-body-sm text-text-secondary">{Math.round(goalPercent)}%</span>
              </div>
            </div>
          </div>
        )}

        <ProfileBookShelf
          title="Leyendo ahora"
          books={currentlyReading}
          onBookClick={onBookClick}
          onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('leyendo') : undefined}
        />

        <ProfileBookShelf
          title="Favoritos"
          books={favorites}
          onBookClick={onBookClick}
          onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('favoritos') : undefined}
        />

        <ProfileBookShelf
          title="Recomendados"
          books={recommended}
          onBookClick={onBookClick}
          onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('recomendados') : undefined}
        />

        <ProfileBookShelf
          title="Lista de deseados"
          books={wishlist}
          onBookClick={onBookClick}
          onSeeAll={onSeeAllBooks ? () => onSeeAllBooks('deseado') : undefined}
        />
      </div>

      {footer}
    </div>
  )
}
