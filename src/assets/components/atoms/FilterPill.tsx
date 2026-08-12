import { statusColorVar, statusLabel, type ReadingStatus } from '../../../lib/status'

export type FilterValue = 'todos' | ReadingStatus

const filterLabel: Record<FilterValue, string> = {
  todos: 'Todos',
  ...statusLabel,
}

interface FilterPillProps {
  value: FilterValue
  isActive: boolean
  onClick: () => void
}

export function FilterPill({ value, isActive, onClick }: FilterPillProps) {
  const color = value === 'todos' ? 'var(--color-accent-wishlist)' : statusColorVar[value]

  return (
    <button
      onClick={onClick}
      className="shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-body-md font-body font-medium border-2 transition-colors"
      style={
        isActive
          ? { backgroundColor: color, borderColor: color, color: 'var(--color-surface)' }
          : { backgroundColor: 'transparent', borderColor: color, color }
      }
    >
      {filterLabel[value]}
    </button>
  )
}