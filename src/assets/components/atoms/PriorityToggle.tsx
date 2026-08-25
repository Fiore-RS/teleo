import { Bookmark } from 'lucide-react'

interface PriorityToggleProps {
  isPriority: boolean
  onToggle: () => void
}

/** Mismo lenguaje visual que `FavoriteToggle` — un botón cuadrado con ícono que cambia de
 *  relleno según el estado — para que ambos flags de libro (favorito / lista de esta
 *  temporada) se vean como un mismo tipo de control cuando van lado a lado. */
export function PriorityToggle({ isPriority, onToggle }: PriorityToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isPriority ? 'Quitar de mi lista de esta temporada' : 'Agregar a mi lista de esta temporada'}
      className="w-full flex items-center justify-center py-3 rounded-xl border border-border bg-surface"
    >
      <Bookmark size={22} fill={isPriority ? 'var(--color-accent-wishlist)' : 'none'} color="var(--color-accent-wishlist)" />
    </button>
  )
}
