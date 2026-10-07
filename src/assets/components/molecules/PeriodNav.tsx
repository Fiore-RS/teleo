import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PeriodNavProps {
  label: string
  onPrev: () => void
  onNext: () => void
  canGoNext: boolean
  prevLabel: string
  nextLabel: string
}

/** Flechas con el periodo en el medio (mes o año), como en el calendario de lectura.
 *  V.3.0.0: el periodo en Young Serif y flechas de 30px. */
export function PeriodNav({ label, onPrev, onNext, canGoNext, prevLabel, nextLabel }: PeriodNavProps) {
  const arrowClass =
    'w-[30px] h-[30px] shrink-0 rounded-full border border-border bg-surface-2 text-primary-text flex items-center justify-center disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-primary-text'
  return (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onPrev} aria-label={prevLabel} className={arrowClass}>
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <p key={label} className="font-title text-[22px] leading-tight text-text text-center animate-fade-in" aria-live="polite">{label}</p>
      <button type="button" onClick={onNext} disabled={!canGoNext} aria-label={nextLabel} className={arrowClass}>
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  )
}
