import { Compass } from 'lucide-react'
import { MoreRow } from './MoreRow'
import { BreakdownList } from './BreakdownList'
import { Button } from '../atoms/Button'
import { MIN_BOOKS_FOR_TRAIT_STATS, hasEnoughTraitData, type TraitStats } from '../../../lib/traitStats'

/** Cada lista muestra los primeros; el resto no suma mucho a la vista. */
const TOP = 5

function Part({ title, entries, count, total }: { title: string; entries: TraitStats['genres']; count: number; total: number }) {
  if (count < MIN_BOOKS_FOR_TRAIT_STATS) return null
  return (
    <div>
      <BreakdownList title={title} entries={entries.slice(0, TOP)} />
      <p className="text-body-sm text-text-muted mt-1.5">
        Según {count} de tus {total} libros
      </p>
    </div>
  )
}

interface TraitStatsRowProps {
  id: string
  stats: TraitStats
  isOpen: boolean
  onToggle: () => void
  /** Abre "Completa tu estante". */
  onCompleteShelf: () => void
}

/** "Géneros y ánimos" (V.3.1.0) dentro de las filas plegadas de Bitácora › Estadísticas y de
 *  Resumen › Año. Si todavía no hay datos suficientes, invita a completar el estante. */
export function TraitStatsRow({ id, stats, isOpen, onToggle, onCompleteShelf }: TraitStatsRowProps) {
  if (stats.total === 0) return null
  const enough = hasEnoughTraitData(stats)
  const topGenre = stats.withGenre >= MIN_BOOKS_FOR_TRAIT_STATS ? stats.genres[0]?.label : undefined
  const topMood = stats.withMood >= MIN_BOOKS_FOR_TRAIT_STATS ? stats.moods[0]?.label : undefined
  const summary = !enough
    ? 'Completa tu estante para verlo'
    : [topGenre, topMood?.toLowerCase()].filter(Boolean).join(' y ') || 'Por género, ánimo y ritmo'
  const missing = stats.total - Math.min(stats.withGenre, stats.withMood, stats.withPace)

  return (
    <MoreRow id={id} tone="pink" icon={Compass} title="Géneros y ánimos" summary={summary} isOpen={isOpen} onToggle={onToggle}>
      {enough ? (
        <div className="space-y-5">
          <Part title="Géneros" entries={stats.genres} count={stats.withGenre} total={stats.total} />
          <Part title="Ánimos" entries={stats.moods} count={stats.withMood} total={stats.total} />
          <Part title="Ritmo" entries={stats.paces} count={stats.withPace} total={stats.total} />
        </div>
      ) : (
        <p className="text-body-md text-text-secondary">
          Aparece cuando al menos {MIN_BOOKS_FOR_TRAIT_STATS} de tus libros tengan género, ánimo o ritmo.
        </p>
      )}
      {missing > 0 && (
        <Button variant="soft" className="mt-4" onClick={onCompleteShelf}>
          Completa tu estante
        </Button>
      )}
    </MoreRow>
  )
}
