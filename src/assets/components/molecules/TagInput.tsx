import { useState, type KeyboardEvent } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '../atoms/Input'
import { normalizeTag } from '../../../hooks/useUserTags'

interface TagInputProps {
  onAdd: (tag: string) => void
  placeholder?: string
  /** Etiquetas que la persona ya usó en otros libros (useUserTags), de la más usada a la menos. */
  suggestions?: string[]
  /** Etiquetas que este libro ya tiene: no se ofrecen ni se repiten. */
  current?: string[]
}

/** Cuántas etiquetas usadas se muestran sin escribir nada. Al escribir se filtran todas. */
const VISIBLE_SUGGESTIONS = 12

/** Campo para agregar etiquetas. Desde la V.3.1.0 muestra debajo las etiquetas que ya usaste
 *  (un toque la agrega) y no repite por mayúsculas o tildes: si escribes "fantasia" y ya existe
 *  "Fantasía", se usa la que ya tenías. */
export function TagInput({ onAdd, placeholder = 'Agregar etiqueta...', suggestions = [], current = [] }: TagInputProps) {
  const [value, setValue] = useState('')
  const currentKeys = new Set(current.map(normalizeTag))
  const query = normalizeTag(value)
  const available = suggestions.filter((tag) => !currentKeys.has(normalizeTag(tag)))
  const shown = query ? available.filter((tag) => normalizeTag(tag).includes(query)) : available.slice(0, VISIBLE_SUGGESTIONS)

  function add(tag: string) {
    const trimmed = tag.trim().replace(/\s+/g, ' ')
    if (!trimmed) return
    const key = normalizeTag(trimmed)
    setValue('')
    if (currentKeys.has(key)) return
    // Si ya existe con otra forma de escribirse, se usa la que ya tenías.
    onAdd(suggestions.find((s) => normalizeTag(s) === key) ?? trimmed)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add(value)
    }
  }

  return (
    <div>
      <Input
        icon={Plus}
        iconPosition="right"
        onIconClick={() => add(value)}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {shown.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5" role="group" aria-label="Etiquetas que ya usaste">
          {shown.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border bg-surface-2 text-body-sm font-body font-semibold text-text-secondary focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              <Plus size={12} strokeWidth={2.6} aria-hidden="true" />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
