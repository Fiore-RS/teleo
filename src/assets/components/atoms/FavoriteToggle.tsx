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
      className="w-full flex items-center justify-center py-3 rounded-xl border border-border bg-surface"
    >
      <Heart size={22} fill={isFavorite ? 'var(--color-accent-wishlist)' : 'none'} color="var(--color-accent-wishlist)" />
    </button>
  )
}