import { Modal } from '../atoms/Modal'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { statusLabel, type ReadingStatus } from '../../../lib/status'
import { categoryOptions, languageOptions, formatOptions } from '../../../lib/options'

export interface AdvancedFilters {
  status: 'todos' | ReadingStatus
  language: string
  category: string
  format: string
}

export const defaultAdvancedFilters: AdvancedFilters = {
  status: 'todos',
  language: 'todos',
  category: 'todos',
  format: 'todos',
}

const statusSelectOptions = [
  { value: 'todos', label: 'Todos' },
  ...(Object.keys(statusLabel) as ReadingStatus[]).map((value) => ({ value, label: statusLabel[value] })),
]

const languageSelectOptions = [{ value: 'todos', label: 'Todos' }, ...languageOptions]
const categorySelectOptions = [{ value: 'todos', label: 'Todas' }, ...categoryOptions]
const formatSelectOptions = [{ value: 'todos', label: 'Todos' }, ...formatOptions]

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  tab: 'libros' | 'sagas'
  value: AdvancedFilters
  onApply: (filters: AdvancedFilters) => void
}

export function FilterModal({ isOpen, onClose, tab, value, onApply }: FilterModalProps) {
  function update(patch: Partial<AdvancedFilters>) {
    onApply({ ...value, ...patch })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros">
      <div className="space-y-4">
        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Estado</label>
          <Select
            options={statusSelectOptions}
            value={value.status}
            onChange={(e) => update({ status: e.target.value as AdvancedFilters['status'] })}
          />
        </div>

        <div>
          <label className="text-body-sm text-text-secondary block mb-1">Categoría</label>
          <Select
            options={categorySelectOptions}
            value={value.category}
            onChange={(e) => update({ category: e.target.value })}
          />
        </div>

        {tab === 'libros' && (
          <div>
            <label className="text-body-sm text-text-secondary block mb-1">Idioma</label>
            <Select
              options={languageSelectOptions}
              value={value.language}
              onChange={(e) => update({ language: e.target.value })}
            />
          </div>
        )}

        {tab === 'libros' && (
          <div>
            <label className="text-body-sm text-text-secondary block mb-1">Formato</label>
            <Select
              options={formatSelectOptions}
              value={value.format}
              onChange={(e) => update({ format: e.target.value })}
            />
          </div>
        )}

        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => onApply(defaultAdvancedFilters)}>
            Limpiar filtros
          </Button>
          <Button variant="primary" onClick={onClose}>
            Ver resultados
          </Button>
        </div>
      </div>
    </Modal>
  )
}
