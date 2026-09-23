import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  backLabel?: string
}

/** Encabezado de las pantallas secundarias (Configuración, Tutorial, cambiar usuario...):
 *  botón redondo para volver, título en la fuente caligráfica y una línea de descripción.
 *  Mismo lenguaje que los encabezados de las pestañas principales (rediseño 2026). */
export function PageHeader({ title, subtitle, onBack, backLabel = 'Regresar' }: PageHeaderProps) {
  return (
    <header className="px-1 pt-4 pb-6">
      {onBack && (
        <button
          onClick={onBack}
          aria-label={backLabel}
          className="w-10 h-10 rounded-full bg-surface border border-border shadow-card text-primary-text flex items-center justify-center mb-4 focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}
      <h1 className="font-title text-[clamp(30px,8.5vw,44px)] leading-[1.05] text-text text-balance">{title}</h1>
      {subtitle && <p className="font-body text-body-md text-text-secondary mt-2">{subtitle}</p>}
    </header>
  )
}
