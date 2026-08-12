import { HorizontalScroller } from '../atoms/HorizontalScroller'
import { FilterPill, type FilterValue } from '../atoms/FilterPill'

export type { FilterValue }

const filterOrder: FilterValue[] = [
  'todos',
  'leyendo',
  'pendiente',
  'terminado',
  'deseado',
  'abandonado',
]

interface FilterBarProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <HorizontalScroller>
      {filterOrder.map((f) => (
        <FilterPill key={f} value={f} isActive={value === f} onClick={() => onChange(f)} />
      ))}
    </HorizontalScroller>
  )
}