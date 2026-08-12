import { HorizontalScroller } from '../atoms/HorizontalScroller'
import { FilterPill, type FilterValue } from '../atoms/FilterPill'

export type { FilterValue }

const defaultOrder: FilterValue[] = ['todos', 'leyendo', 'pendiente', 'terminado', 'deseado', 'abandonado']

interface FilterBarProps {
  value: FilterValue
  onChange: (value: FilterValue) => void
  options?: FilterValue[]
}

export function FilterBar({ value, onChange, options = defaultOrder }: FilterBarProps) {
  return (
    <HorizontalScroller>
      {options.map((f) => (
        <FilterPill key={f} value={f} isActive={value === f} onClick={() => onChange(f)} />
      ))}
    </HorizontalScroller>
  )
}