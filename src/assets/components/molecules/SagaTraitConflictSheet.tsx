import { ImageOff } from 'lucide-react'
import { ConfirmSheet } from './ConfirmSheet'
import { FormCard } from './FormLayout'
import { BookMiniHeader } from './BookMiniHeader'
import { CoverImage } from '../atoms/CoverImage'
import { genreLabel, moodLabel } from '../../../lib/bookTraits'
import type { SagaTraitConflict, SagaTraitField, SagaTraits } from '../../../lib/sagaTraits'

/** Libro en conflicto, con su portada y autor (la lista la arma quien abre la hoja). */
export interface ConflictBook extends SagaTraitConflict {
  coverUrl?: string | null
  author?: string | null
}

interface SagaTraitConflictSheetProps {
  /** 'save': al guardar la saga. 'add': al sumar libros a la saga. */
  variant?: 'save' | 'add'
  conflicts: ConflictBook[]
  /** Libros (de la saga, o de los que se suman) que ya toman los de la saga sin preguntar. */
  othersCount: number
  /** Con 'add' y un solo libro, para comparar lo del libro con lo de la saga. */
  sagaTraits?: SagaTraits
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

const genreText = (genres: readonly string[] | null) => (genres ?? []).map(genreLabel).filter(Boolean).join(', ')
const moodText = (moods: readonly string[] | null, custom: readonly string[] | null) =>
  [...(moods ?? []).map(moodLabel).filter(Boolean), ...(custom ?? [])].join(', ')

/** "Género: Terror · Ánimo: Tenso, Oscuro": lo que tiene el libro en lo que choca. */
function bookValues({ book, fields }: SagaTraitConflict) {
  const parts: string[] = []
  if (fields.includes('genre')) parts.push(`Género: ${genreText(book.genres)}`)
  if (fields.includes('mood')) parts.push(`Ánimo: ${moodText(book.moods, book.custom_moods)}`)
  return parts.join(' · ')
}

function ConflictList({ conflicts }: { conflicts: ConflictBook[] }) {
  return (
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
  )
}

/** Un solo libro que se suma: lo del libro y lo de la saga, uno debajo del otro. */
function Comparison({ conflict, saga }: { conflict: ConflictBook; saga: SagaTraits }) {
  const rows: [string, string][] = []
  if (conflict.fields.includes('genre')) {
    rows.push(['Género del libro', genreText(conflict.book.genres)], ['Género de la saga', genreText(saga.genres)])
  }
  if (conflict.fields.includes('mood')) {
    rows.push(
      ['Ánimo del libro', moodText(conflict.book.moods, conflict.book.custom_moods)],
      ['Ánimo de la saga', moodText(saga.moods, saga.customMoods)],
    )
  }
  return (
    <FormCard className="mt-4">
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3 px-3.5 py-2.5">
          <span className="font-body font-semibold text-body-md text-text-secondary whitespace-nowrap">{label}</span>
          <span className="text-body-md text-text text-right">{value}</span>
        </div>
      ))}
    </FormCard>
  )
}

/** V.3.4.0: si algunos libros tienen otro género o ánimo puesto a mano, se pregunta una sola
 *  vez por todos, al guardar la saga ('save') o al sumarle libros ('add'). Muestra cuáles son
 *  y qué tiene cada uno. */
export function SagaTraitConflictSheet({ variant = 'save', conflicts, othersCount, sagaTraits, isLoading, onKeep, onUseSaga }: SagaTraitConflictSheetProps) {
  const n = conflicts.length
  const what = whatDiffers([...new Set(conflicts.flatMap((c) => c.fields))])

  if (variant === 'add') {
    const single = n === 1 && othersCount === 0
    const total = n + othersCount
    const message = single
      ? `Este libro tiene ${what} que la saga.`
      : `${n} de los ${total} libros que agregas ${n === 1 ? 'tiene' : 'tienen'} ${what} que la saga.` +
        (othersCount > 0 ? ` ${othersCount === 1 ? 'El otro toma' : `Los otros ${othersCount} toman`} los de la saga.` : '')
    return (
      <ConfirmSheet
        title="¿Usas los de la saga?"
        message={message}
        cancelLabel={single ? 'Mantener los del libro' : 'Mantener los suyos'}
        confirmLabel="Usar los de la saga"
        isLoading={isLoading}
        onConfirm={onUseSaga}
        onClose={onKeep}
      >
        {single ? (
          <>
            <BookMiniHeader
              book={{ title: conflicts[0].book.title ?? '', cover_url: conflicts[0].coverUrl, author: conflicts[0].author }}
              className="mt-4 mb-0!"
            />
            {sagaTraits && <Comparison conflict={conflicts[0]} saga={sagaTraits} />}
          </>
        ) : (
          <ConflictList conflicts={conflicts} />
        )}
      </ConfirmSheet>
    )
  }

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
      <ConflictList conflicts={conflicts} />
    </ConfirmSheet>
  )
}
