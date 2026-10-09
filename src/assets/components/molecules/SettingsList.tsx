import type { ReactNode } from 'react'
import { ChevronRight, type LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface SettingsGroupProps {
  title: string
  /** Ícono de la pestaña de la sección. */
  icon?: LucideIcon
  children: ReactNode
  /** Texto de ayuda debajo de la tarjeta. */
  note?: string
}

/** Grupo de Configuración. V.3.0.0: cada sección es una tarjeta con pestaña de separador
 *  (ícono y nombre) y las filas separadas por líneas finas. */
export function SettingsGroup({ title, icon, children, note }: SettingsGroupProps) {
  return (
    <div>
      <Card tab={{ label: title, icon }} padding="py-1">
        <div className="divide-y divide-border">{children}</div>
      </Card>
      {note && <p className="text-body-sm text-text-secondary mt-2 px-1">{note}</p>}
    </div>
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
  /** Puntito junto al título, ej. cuando hay una versión nueva en Novedades. */
  dot?: boolean
  /** Algo a la derecha, antes de la flecha (ej. la muestra de colores del tema activo). */
  trailing?: ReactNode
}

export function SettingsRow({ icon: Icon, label, description, onClick, disabled = false, danger = false, dot = false, trailing }: SettingsRowProps) {
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
        <span className={`flex items-center gap-2 font-body font-semibold text-body-md ${danger ? 'text-primary-text' : 'text-text'}`}>
          {label}
          {dot && <span className="w-2 h-2 rounded-full bg-pink" aria-label="Nuevo" />}
        </span>
        {description && <span className="block text-body-sm text-text-secondary mt-0.5">{description}</span>}
      </span>
      {trailing}
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
