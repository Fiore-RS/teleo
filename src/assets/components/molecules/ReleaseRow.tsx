import { CalendarDays, MapPin } from 'lucide-react'
import type { Release } from '../../../hooks/useReleases'
import { countdownLabel, daysUntil, formatReleaseDate } from '../../../lib/releases'
import { formatCurrency } from '../../../lib/currencies'

interface ReleaseRowProps {
  release: Release
  currency: string | null | undefined
  onClick: () => void
}

/** Un lanzamiento en lista: cuánto falta, título, autor, fecha, lugar y precio. */
export function ReleaseRow({ release, currency, onClick }: ReleaseRowProps) {
  const days = daysUntil(release.release_date)
  const isPast = days < 0
  const isSoon = days >= 0 && days <= 7

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left bg-surface-2 border border-border rounded-2xl p-3.5 focus-visible:outline-2 focus-visible:outline-primary-text ${isPast ? 'opacity-60' : ''}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-display font-semibold text-body-lg text-text leading-snug">{release.title}</span>
          {release.author && <span className="block text-body-sm text-text-secondary mt-0.5">{release.author}</span>}
        </span>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${
            isPast ? 'bg-surface text-text-muted border border-border' : isSoon ? 'bg-magenta text-on-accent' : 'bg-magenta-soft text-magenta-text'
          }`}
        >
          {countdownLabel(release.release_date)}
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-body-sm text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} />
          {formatReleaseDate(release.release_date)}
        </span>
        {release.place && (
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{release.place}</span>
          </span>
        )}
        {release.price != null && (
          <span className="font-semibold text-text tabular-nums">
            {release.price === 0 ? 'Gratis' : formatCurrency(release.price, currency)}
          </span>
        )}
      </span>
    </button>
  )
}
