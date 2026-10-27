import { ImageOff } from 'lucide-react'
import { ConfirmSheet } from './ConfirmSheet'
import { FormCard } from './FormLayout'
import { CoverImage } from '../atoms/CoverImage'
import { genreLabel, moodLabel } from '../../../lib/bookTraits'
import type { SagaTraitConflict, SagaTraitField } from '../../../lib/sagaTraits'

/** Libro en conflicto, con su portada (la lista la arma quien abre la hoja). */
export interface ConflictBook extends SagaTraitConflict {
  coverUrl?: string | null
}

interface SagaTraitConflictSheetProps {
  conflicts: ConflictBook[]
  /** Libros de la saga que ya toman los de la saga sin preguntar. */
  othersCount: number
  isLoading?: boolean
  onKeep: () => void
  onUseSaga: () => void
}

/** "otro género", "otro ánimo" u "otro género o ánimo", según lo que choca. */
function whatDiffers(fields: SagaTraitField[]) {
  const genre = fields.includes('genre')
  const mood = fields.includes('mood')
  return genre && mood ? 'otro género o ánimo' : genre ? 'otro género' : 'otro ánimo'
}

/** "Género: Terror · Ánimo: Tenso, Oscuro": lo que tiene el libro en lo que choca. */
function bookValues({ book, fields }: SagaTraitConflict) {
  const parts: string[] = []
  if (fields.includes('genre')) parts.push(`Género: ${(book.genres ?? []).map(genreLabel).filter(Boolean).join(', ')}`)
  if (fields.includes('mood')) {
    const moods = [...(book.moods ?? []).map(moodLabel).filter(Boolean), ...(book.custom_moods ?? [])]
    parts.push(`Ánimo: ${moods.join(', ')}`)
  }
  return parts.join(' · ')
}

/** V.3.4.0: al guardar el género o el ánimo de una saga, si algunos de sus libros tienen otro
 *  puesto a mano, se pregunta una sola vez por todos. Lista cuáles son y qué tiene cada uno. */
export function SagaTraitConflictSheet({ conflicts, othersCount, isLoading, onKeep, onUseSaga }: SagaTraitConflictSheetProps) {
  const n = conflicts.length
  const what = whatDiffers([...new Set(conflicts.flatMap((c) => c.fields))])
  const title = n === 1 ? '¿Cambias también un libro?' : `¿Cambias también ${n} libros?`
  const message =
    (n === 1 ? `Un libro de la saga tiene ${what}.` : `${n} libros de la saga tienen ${what}.`) +
    (othersCount > 0 ? ' Los demás ya toman los de la saga.' : '')

  return (
    <ConfirmSheet
      title={title}
      message={message}
      cancelLabel="Mantener los suyos"
      confirmLabel="Cambiar todos"
      isLoading={isLoading}
      onConfirm={onUseSaga}
      onClose={onKeep}
    >
      <FormCard className="mt-4">
        {conflicts.map((c) => (
          <div key={c.book.id} className="flex gap-2.5 items-center px-3 py-2.5">
            <div className="w-8.5 shrink-0 aspect-2/3 rounded-[5px] overflow-hidden bg-surface">
              {c.coverUrl ? (
                <CoverImage src={c.coverUrl} alt={c.book.title ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={12} className="text-text-secondary" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-body-md text-text truncate">{c.book.title}</p>
              <p className="text-body-sm text-text-muted">{bookValues(c)}</p>
            </div>
          </div>
        ))}
      </FormCard>
    </ConfirmSheet>
  )
}
