import { ChevronRight, Sparkles } from 'lucide-react'

interface RecapEntryRowProps {
  title: string
  subtitle: string
  onClick: () => void
}

/** Fila que abre "Tu lectura en Teleo" desde Bitácora › Resumen (V.3.2.0). */
export function RecapEntryRow({ title, subtitle, onClick }: RecapEntryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-[18px] bg-primary-soft text-primary-text px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <span className="w-9 h-9 shrink-0 rounded-full bg-surface flex items-center justify-center" aria-hidden="true">
        <Sparkles size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold text-[16px] leading-tight">{title}</span>
        <span className="block text-[12.5px] text-text-secondary mt-0.5">{subtitle}</span>
      </span>
      <ChevronRight size={20} className="shrink-0" aria-hidden="true" />
    </button>
  )
}
