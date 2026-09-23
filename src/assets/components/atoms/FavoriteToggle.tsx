import { Heart } from 'lucide-react'

interface FavoriteToggleProps {
  isFavorite: boolean
  onToggle: () => void
}

export function FavoriteToggle({ isFavorite, onToggle }: FavoriteToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
      className={`w-full flex items-center justify-center py-3 rounded-2xl border transition-colors ${
        isFavorite ? 'bg-primary-soft border-primary-text/30' : 'bg-surface-2 border-border'
      }`}
    >
      <Heart size={22} fill={isFavorite ? 'var(--color-primary-text)' : 'none'} color="var(--color-primary-text)" />
    </button>
  )
}