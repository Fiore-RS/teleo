import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { Card } from './Card'

interface SettingsGroupProps {
  title: string
  children: ReactNode
  /** Texto de ayuda debajo de la tarjeta. */
  note?: string
}

/** Grupo de Configuración. V.3.0.0: cada sección es una tarjeta con pestaña de separador y las
 *  filas separadas por líneas finas. Desde el 26 oct 2026 la pestaña es solo texto y desde la
 *  V.3.5.0 las filas también: nombre, descripción y flecha, sin ícono. */
export function SettingsGroup({ title, children, note }: SettingsGroupProps) {
  return (
    <div>
      <Card tab={{ label: title }} padding="py-1">
        <div className="divide-y divide-border">{children}</div>
      </Card>
      {note && <p className="text-body-sm text-text-secondary mt-2 px-1">{note}</p>}
    </div>
  )
}

interface SettingsRowProps {
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

export function SettingsRow({ label, description, onClick, disabled = false, danger = false, dot = false, trailing }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left first:rounded-t-card last:rounded-b-card focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-text ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'active:bg-surface-2'
      }`}
    >
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
  label: string
  description?: string
  children: ReactNode
}

/** Fila con un control debajo (segmentado, selector), en vez de navegar a otra pantalla. */
export function SettingsField({ label, description, children }: SettingsFieldProps) {
  return (
    <div className="px-4 py-3.5">
      <div className="mb-3">
        <span className="block font-body font-semibold text-body-md text-text">{label}</span>
        {description && <span className="block text-body-sm text-text-secondary mt-0.5">{description}</span>}
      </div>
      {children}
    </div>
  )
}
