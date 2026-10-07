import type { ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'

export type RowTone = 'brand' | 'orange' | 'pink' | 'magenta'
const rowToneStyles: Record<RowTone, string> = {
  brand: 'bg-primary-soft text-primary-text',
  orange: 'bg-orange-soft text-orange-text',
  pink: 'bg-pink-soft text-pink-text',
  magenta: 'bg-magenta-soft text-magenta-text',
}

/** Fila plegable de las tarjetas "Más de…" de Bitácora (Estadísticas y Resumen): ícono,
 *  nombre, una línea de resumen y una flecha que gira al abrir. Las filas deben ir dentro
 *  de un mismo envoltorio para que la primera no lleve línea arriba. */
export function MoreRow({ id, tone, icon: Icon, title, summary, isOpen, onToggle, children }: {
  id: string
  tone: RowTone
  icon: LucideIcon
  title: string
  summary: string
  isOpen: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`mas-${id}`}
        className="w-full flex items-center gap-3 py-[13px] text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
      >
        <span className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center ${rowToneStyles[tone]}`}>
          <Icon size={17} aria-hidden="true" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-body font-bold text-[15px] text-text">{title}</span>
          <span className="block font-body text-[13px] text-text-secondary truncate">{summary}</span>
        </span>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className={`shrink-0 text-text-muted transition-transform duration-200 motion-reduce:transition-none ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {/* Se abre y se cierra deslizando: la fila de la cuadrícula pasa de 0fr a 1fr (así se
          anima hasta el alto real del contenido) junto con un fundido. Cerrada queda inert
          para que el teclado y los lectores de pantalla no entren. */}
      <div
        id={`mas-${id}`}
        inert={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-3.5">{children}</div>
        </div>
      </div>
    </div>
  )
}
