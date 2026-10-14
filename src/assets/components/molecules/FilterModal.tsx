import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormCollapsible, FormRow, FormSection } from './FormLayout'
import { statusLabel, type ReadingStatus } from '../../../lib/status'
import { categoryOptions, formatOptions } from '../../../lib/options'
import { defaultAdvancedFilters, type AdvancedFilters } from '../../../lib/advancedFilters'
import { genreLabel, genreOptions, moodLabel, moodOptions, paceLabel, paceOptions } from '../../../lib/bookTraits'

const statusSelectOptions = [
  { value: 'todos', label: 'Todos' },
  ...(Object.keys(statusLabel) as ReadingStatus[]).map((value) => ({ value, label: statusLabel[value] })),
]

const categorySelectOptions = [{ value: 'todos', label: 'Todas' }, ...categoryOptions]
const formatSelectOptions = [{ value: 'todos', label: 'Todos' }, ...formatOptions]

function FilterChip({ label, checked, own = false, onToggle }: { label: string; checked: boolean; own?: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-body font-semibold text-body-md focus-visible:outline-2 focus-visible:outline-primary-text ${
        checked ? 'border-primary-text bg-primary-soft text-primary-text' : `${own ? 'border-dashed' : ''} border-border bg-surface text-text-secondary`
      }`}
    >
      {checked && <Check size={14} strokeWidth={3} aria-hidden="true" />}
      {label}
    </button>
  )
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

/** "Elige cuáles" o los elegidos separados por punto, para el resumen de cada tarjeta plegable. */
function summaryOf(labels: (string | null)[]): string {
  const clean = labels.filter(Boolean) as string[]
  return clean.length === 0 ? 'Todos' : clean.join(' · ')
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  tab: 'libros' | 'sagas'
  value: AdvancedFilters
  onApply: (filters: AdvancedFilters) => void
  /** Idiomas de la biblioteca (Español, Inglés y los que tengan los libros), ver languages.ts. */
  languageOptions: { value: string; label: string }[]
  /** Cuántos libros o sagas quedan con los filtros puestos (para el botón). */
  resultCount: number
  /** Etiquetas y ánimos propios que la persona ya usó. */
  knownTags: string[]
  knownCustomMoods: string[]
  /** Libros sin género / sin ánimo ni ritmo: no aparecen al filtrar por eso (V.3.1.0). */
  booksWithoutGenre: number
  booksWithoutMoodOrPace: number
  onCompleteGenres: () => void
  onCompleteShelf: () => void
}

/** Filtros de Estante. Rediseñado en la V.3.1.0 como hoja, con las piezas de Editar libro:
 *  estado, categoría, idioma y formato en filas; género, ánimo y ritmo, y etiquetas en tarjetas
 *  plegables (con un resumen de lo elegido) para que la hoja no se haga larga. En Sagas solo
 *  aplican estado y categoría. Los cambios se ven al instante; "Ver" cierra la hoja. */
export function FilterModal({
  isOpen,
  onClose,
  tab,
  value,
  onApply,
  languageOptions,
  resultCount,
  knownTags,
  knownCustomMoods,
  booksWithoutGenre,
  booksWithoutMoodOrPace,
  onCompleteGenres,
  onCompleteShelf,
}: FilterModalProps) {
  if (!isOpen) return null

  function update(patch: Partial<AdvancedFilters>) {
    onApply({ ...value, ...patch })
  }

  const isBooks = tab === 'libros'
  const noun = isBooks ? (resultCount === 1 ? 'libro' : 'libros') : resultCount === 1 ? 'saga' : 'sagas'

  return (
    <Sheet
      onClose={onClose}
      title="Filtros"
      footer={
        <FormActions>
          <Button variant="outline" onClick={() => onApply(defaultAdvancedFilters)}>Limpiar</Button>
          <Button variant="primary" onClick={onClose}>Ver {resultCount} {noun}</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <FormSection label={isBooks ? 'El libro' : 'La saga'}>
          <FormCard>
            <FormRow label="Estado">
              <Select bare options={statusSelectOptions} value={value.status} onChange={(e) => update({ status: e.target.value as AdvancedFilters['status'] })} />
            </FormRow>
            <FormRow label="Categoría">
              <Select bare options={categorySelectOptions} value={value.category} onChange={(e) => update({ category: e.target.value })} />
            </FormRow>
            {isBooks && (
              <FormRow label="Idioma">
                <Select bare options={[{ value: 'todos', label: 'Todos' }, ...languageOptions]} value={value.language} onChange={(e) => update({ language: e.target.value })} />
              </FormRow>
            )}
            {isBooks && (
              <FormRow label="Formato">
                <Select bare options={formatSelectOptions} value={value.format} onChange={(e) => update({ format: e.target.value })} />
              </FormRow>
            )}
          </FormCard>
        </FormSection>

        {isBooks && (
          <FormSection label="Cómo es" className="mb-2">
            <div className="flex flex-col gap-2.5">
              <FormCollapsible title="Género" summary={summaryOf(value.genres.map(genreLabel))} defaultOpen={value.genres.length > 0}>
                <div className="px-3.5 pb-3.5">
                  <div className="flex flex-wrap gap-2">
                    {genreOptions.map((o) => (
                      <FilterChip key={o.key} label={o.label} checked={value.genres.includes(o.key)} onToggle={() => update({ genres: toggle(value.genres, o.key) })} />
                    ))}
                  </div>
                  {booksWithoutGenre > 0 && (
                    <p className="text-body-sm text-text-muted mt-3">
                      {booksWithoutGenre === 1 ? '1 libro todavía no tiene género.' : `${booksWithoutGenre} libros todavía no tienen género.`}{' '}
                      <button type="button" onClick={onCompleteGenres} className="font-bold text-primary-text">Completar</button>
                    </p>
                  )}
                </div>
              </FormCollapsible>

              <FormCollapsible
                title="Ánimo y ritmo"
                summary={summaryOf([...value.moods.map(moodLabel), ...value.customMoods, value.pace ? paceLabel(value.pace) : null])}
                defaultOpen={value.moods.length + value.customMoods.length > 0 || value.pace !== null}
              >
                <div className="px-3.5 pb-3.5">
                  <div className="flex flex-wrap gap-2">
                    {moodOptions.map((o) => (
                      <FilterChip key={o.key} label={o.label} checked={value.moods.includes(o.key)} onToggle={() => update({ moods: toggle(value.moods, o.key) })} />
                    ))}
                    {knownCustomMoods.map((m) => (
                      <FilterChip key={`own-${m}`} own label={m} checked={value.customMoods.includes(m)} onToggle={() => update({ customMoods: toggle(value.customMoods, m) })} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3" role="group" aria-label="Ritmo">
                    {paceOptions.map((o) => (
                      <FilterChip key={o.key} label={o.label} checked={value.pace === o.key} onToggle={() => update({ pace: value.pace === o.key ? null : o.key })} />
                    ))}
                  </div>
                  {booksWithoutMoodOrPace > 0 && (
                    <p className="text-body-sm text-text-muted mt-3">
                      {booksWithoutMoodOrPace === 1 ? '1 libro leído todavía no tiene ánimo o ritmo.' : `${booksWithoutMoodOrPace} libros leídos todavía no tienen ánimo o ritmo.`}{' '}
                      <button type="button" onClick={onCompleteShelf} className="font-bold text-primary-text">Completar</button>
                    </p>
                  )}
                </div>
              </FormCollapsible>

              {knownTags.length > 0 && (
                <FormCollapsible title="Etiquetas" summary={summaryOf(value.tags)} defaultOpen={value.tags.length > 0}>
                  <div className="px-3.5 pb-3.5 flex flex-wrap gap-2">
                    {knownTags.map((t) => (
                      <FilterChip key={t} label={t} checked={value.tags.includes(t)} onToggle={() => update({ tags: toggle(value.tags, t) })} />
                    ))}
                  </div>
                </FormCollapsible>
              )}
            </div>
          </FormSection>
        )}
      </div>
    </Sheet>
  )
}
