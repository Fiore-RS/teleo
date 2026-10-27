import { useState, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import { FormSection } from './FormLayout'
import {
  CUSTOM_MOOD_MAX_LENGTH,
  MAX_GENRES,
  MAX_MOODS,
  findCustomMood,
  genreOptions,
  moodKeyFromText,
  moodOptions,
  paceOptions,
  type BookTraits,
  type GenreKey,
  type MoodKey,
} from '../../../lib/bookTraits'

/** El mismo ánimo propio aunque cambien mayúsculas o tildes ("cozy" y "Cozy"). */
function sameMood(a: string, b: string): boolean {
  return findCustomMood([a], b) !== null
}

interface TraitChipProps {
  label: string
  checked: boolean
  disabled?: boolean
  /** Ánimo propio: borde punteado mientras no está elegido, para distinguirlo de los fijos. */
  own?: boolean
  onToggle: () => void
}

function TraitChip({ label, checked, disabled = false, own = false, onToggle }: TraitChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      onClick={() => !disabled && onToggle()}
      className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-body font-semibold text-body-md transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
        checked
          ? 'border-primary-text bg-primary-soft text-primary-text'
          : `${own ? 'border-dashed' : ''} border-border bg-surface-2 text-text-secondary ${disabled ? 'opacity-45' : ''}`
      }`}
    >
      {checked && <Check size={14} strokeWidth={3} aria-hidden="true" />}
      {label}
    </button>
  )
}

function SectionLabel({ label, count, max }: { label: string; count?: number; max?: number }) {
  return (
    <div className="flex items-baseline justify-between mb-2 px-1">
      <span className="font-body font-bold text-body-md text-primary-text">{label}</span>
      {max !== undefined && (
        <span className="text-body-sm font-medium text-text-muted tabular-nums">
          {count} de {max}
        </span>
      )}
    </div>
  )
}

interface BookTraitsFieldsProps {
  value: BookTraits
  onChange: (traits: BookTraits) => void
  /** Ánimos propios que la persona ya usó en otros libros (useUserCustomMoods). */
  knownCustomMoods: string[]
  /** false para no mostrar Género (ej. en "¿Cómo fue?" cuando el libro ya tiene). */
  showGenres?: boolean
  /** false para mostrar solo Género (ej. al agregar un libro). */
  showMoodAndPace?: boolean
  /** false para no mostrar Ritmo (ej. en una saga, V.3.4.0: el ritmo es de cada libro). */
  showPace?: boolean
  /** Texto bajo "Género" (ej. "Sugerido por la búsqueda"). */
  genreHint?: string
  className?: string
}

/** Secciones Género, Ánimo y Ritmo, en Editar libro y en "¿Cómo fue?" al terminar. Nada es
 *  obligatorio. Al llegar al máximo, los chips no elegidos se apagan. */
export function BookTraitsFields({ value, onChange, knownCustomMoods, showGenres = true, showMoodAndPace = true, showPace = true, genreHint, className = '' }: BookTraitsFieldsProps) {
  const [isAddingMood, setIsAddingMood] = useState(false)
  const [newMood, setNewMood] = useState('')

  const moodCount = value.moods.length + value.customMoods.length
  const moodsFull = moodCount >= MAX_MOODS
  const genresFull = value.genres.length >= MAX_GENRES
  // Ánimos propios para ofrecer: los ya usados más los de este libro que todavía no se
  // guardaron (recién escritos).
  const ownMoods = [...knownCustomMoods, ...value.customMoods.filter((m) => !findCustomMood(knownCustomMoods, m))]
  const hasCustomMood = (mood: string) => value.customMoods.some((m) => sameMood(m, mood))

  function toggleGenre(key: GenreKey) {
    const has = value.genres.includes(key)
    onChange({ ...value, genres: has ? value.genres.filter((g) => g !== key) : [...value.genres, key] })
  }

  function toggleMood(key: MoodKey) {
    const has = value.moods.includes(key)
    onChange({ ...value, moods: has ? value.moods.filter((m) => m !== key) : [...value.moods, key] })
  }

  function toggleCustomMood(mood: string) {
    onChange({
      ...value,
      customMoods: hasCustomMood(mood) ? value.customMoods.filter((m) => !sameMood(m, mood)) : [...value.customMoods, mood],
    })
  }

  function addMood() {
    const text = newMood.trim().replace(/\s+/g, ' ').slice(0, CUSTOM_MOOD_MAX_LENGTH)
    setNewMood('')
    setIsAddingMood(false)
    if (!text) return
    // "oscuro" usa el fijo "Oscuro"; "cozy" reusa "Cozy" si ya existe.
    const fixed = moodKeyFromText(text)
    if (fixed) {
      if (!value.moods.includes(fixed) && !moodsFull) onChange({ ...value, moods: [...value.moods, fixed] })
      return
    }
    const mood = findCustomMood(ownMoods, text) ?? text
    if (!hasCustomMood(mood) && !moodsFull) onChange({ ...value, customMoods: [...value.customMoods, mood] })
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addMood()
    } else if (e.key === 'Escape') {
      setNewMood('')
      setIsAddingMood(false)
    }
  }

  return (
    <div className={className}>
      {showGenres && (
        <section className={showMoodAndPace ? 'mb-5.5' : ''}>
          <SectionLabel label="Género" count={value.genres.length} max={MAX_GENRES} />
          {genreHint && <p className="-mt-1 mb-2 px-1 text-body-sm text-text-muted">{genreHint}</p>}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Género">
            {genreOptions.map((o) => {
              const checked = value.genres.includes(o.key)
              return <TraitChip key={o.key} label={o.label} checked={checked} disabled={!checked && genresFull} onToggle={() => toggleGenre(o.key)} />
            })}
          </div>
        </section>
      )}

      {showMoodAndPace && (
      <>
      <section className={showPace ? 'mb-5.5' : ''}>
        <SectionLabel label="Ánimo" count={moodCount} max={MAX_MOODS} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ánimo">
          {moodOptions.map((o) => {
            const checked = value.moods.includes(o.key)
            return <TraitChip key={o.key} label={o.label} checked={checked} disabled={!checked && moodsFull} onToggle={() => toggleMood(o.key)} />
          })}
          {ownMoods.map((mood) => {
            const checked = hasCustomMood(mood)
            return <TraitChip key={`own-${mood}`} own label={mood} checked={checked} disabled={!checked && moodsFull} onToggle={() => toggleCustomMood(mood)} />
          })}
          {isAddingMood ? (
            <span className="inline-flex items-center gap-1.5 animate-fade-in">
              <input
                autoFocus
                aria-label="Nuevo ánimo"
                maxLength={CUSTOM_MOOD_MAX_LENGTH}
                placeholder="Tu ánimo"
                value={newMood}
                onChange={(e) => setNewMood(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => !newMood.trim() && setIsAddingMood(false)}
                className="w-36 rounded-full border-[1.5px] border-primary-text bg-surface px-3 py-1.5 font-body font-semibold text-body-md text-text placeholder:text-text-muted focus:outline-none"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={addMood}
                className="rounded-full bg-primary-soft text-primary-text px-3 py-1.5 font-body font-bold text-body-md focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                Agregar
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-disabled={moodsFull}
              onClick={() => !moodsFull && setIsAddingMood(true)}
              className={`inline-flex items-center rounded-full border-[1.5px] border-dashed border-border px-3 py-1.5 font-body font-semibold text-body-md text-primary-text focus-visible:outline-2 focus-visible:outline-primary-text ${moodsFull ? 'opacity-45' : ''}`}
            >
              + Otro ánimo
            </button>
          )}
        </div>
      </section>

      {showPace && (
      <FormSection label="Ritmo" className="mb-0">
        <div role="radiogroup" aria-label="Ritmo" className="grid grid-cols-3 gap-1 p-1 bg-surface-2 border border-border rounded-[14px]">
          {paceOptions.map((o) => {
            const isActive = value.pace === o.key
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                // Tocar el ritmo elegido otra vez lo deja vacío.
                onClick={() => onChange({ ...value, pace: isActive ? null : o.key })}
                className={`py-2 px-1 rounded-[10px] font-body font-bold text-body-md transition-all duration-150 ${
                  isActive ? 'bg-surface text-primary-text shadow-card' : 'text-text-secondary'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </FormSection>
      )}
      </>
      )}
    </div>
  )
}
