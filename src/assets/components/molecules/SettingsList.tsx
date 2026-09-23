import type { ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'

interface SettingsGroupProps {
  title: string
  children: ReactNode
  /** Texto de ayuda debajo de la tarjeta. */
  note?: string
}

/** Grupo de Configuración (rediseño 2026): etiqueta pequeña en mayúsculas con una rayita a
 *  la izquierda y, debajo, una sola tarjeta con las filas separadas por líneas finas. */
export function SettingsGroup({ title, children, note }: SettingsGroupProps) {
  return (
    <section>
      <h2 className="flex items-center gap-2 px-1 mb-2.5 font-body font-bold text-body-sm uppercase tracking-[0.14em] text-primary-text">
        <span className="w-4 h-0.5 rounded-full bg-primary-text" aria-hidden="true" />
        {title}
      </h2>
      <div className="bg-surface border border-border rounded-card shadow-card divide-y divide-border">
        {children}
      </div>
      {note && <p className="text-body-sm text-text-secondary mt-2 px-1">{note}</p>}
    </section>
  )
}

interface SettingsRowProps {
  icon: LucideIcon
  label: string
  description?: string
  onClick: () => void
  disabled?: boolean
  /** Para acciones delicadas (vaciar, eliminar): el texto va en vino. */
  danger?: boolean
}

export function SettingsRow({ icon: Icon, label, description, onClick, disabled = false, danger = false }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left first:rounded-t-card last:rounded-b-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-text ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-surface-2'
      }`}
    >
      <span className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
        <Icon size={17} />
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block font-body font-semibold text-body-md ${danger ? 'text-primary-text' : 'text-text'}`}>
          {label}
        </span>
        {description && <span className="block text-body-sm text-text-secondary mt-0.5">{description}</span>}
      </span>
      <ChevronRight size={18} className="text-text-muted shrink-0" />
    </button>
  )
}

interface SettingsFieldProps {
  icon: LucideIcon
  label: string
  description?: string
  children: ReactNode
}

/** Fila con un control debajo (segmentado, selector), en vez de navegar a otra pantalla. */
export function SettingsField({ icon: Icon, label, description, children }: SettingsFieldProps) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
          <Icon size={17} />
        </span>
        <span className="min-w-0">
          <span className="block font-body font-semibold text-body-md text-text">{label}</span>
          {description && <span className="block text-body-sm text-text-secondary mt-0.5">{description}</span>}
        </span>
      </div>
      {children}
    </div>
  )
}
