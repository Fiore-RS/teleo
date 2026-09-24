import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodNavProps {
  label: string
  onPrev: () => void
  onNext: () => void
  canGoNext: boolean
  prevLabel: string
  nextLabel: string
}

/** Flechas con el periodo en el medio (mes o año), como en el calendario de lectura. */
export function PeriodNav({ label, onPrev, onNext, canGoNext, prevLabel, nextLabel }: PeriodNavProps) {
  const arrowClass =
    'w-9 h-9 shrink-0 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-primary-text'
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={arrowClass}>
        <ChevronLeft size={18} strokeWidth={2} />
      </button>
      <p key={label} className="font-display font-semibold text-display-md text-text text-center animate-fade-in" aria-live="polite">{label}</p>
      <button type="button" onClick={onNext} disabled={!canGoNext} aria-label={nextLabel} className={arrowClass}>
        <ChevronRight size={18} strokeWidth={2} />
      </button>
    </div>
  )
}
