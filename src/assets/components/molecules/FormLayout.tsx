import { useState, type ReactNode } from 'react'
import { ChevronDown, type LucideIcon } from 'lucide-react'
import { Toggle } from '../atoms/Toggle'

// Piezas compartidas de los formularios rediseñados en la V.2.2.0 (Editar libro, saga,
// reseña, progreso, meta): secciones con etiqueta, tarjetas con filas compactas (nombre a la
// izquierda, valor a la derecha), filas con interruptor, una tarjeta plegable y los botones
// del pie. Así todas las hojas se ven y se usan igual.

/** Etiqueta de sección. V.3.0.0: en el mismo estilo que las pestañas de las tarjetas (negrita
 *  en vino, sin mayúsculas), en vez de la raya con mayúsculas espaciadas. */
export function FormSectionLabel({ children, className = '' }: { children: string; className?: string }) {
  return (
    <p className={`mb-2 px-1 font-body font-bold text-body-md text-primary-text ${className}`}>
      {children}
    </p>
  )
}

interface FormSectionProps {
  label: string
  children: ReactNode
  className?: string
}

export function FormSection({ label, children, className = '' }: FormSectionProps) {
  return (
    <section className={`mb-5.5 ${className}`}>
      <FormSectionLabel>{label}</FormSectionLabel>
      {children}
    </section>
  )
}

/** Tarjeta que agrupa filas, separadas por una línea fina. */
export function FormCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-2 border border-border rounded-[18px] divide-y divide-border ${className}`}>
      {children}
    </div>
  )
}

function OptionalMark() {
  return <span className="ml-1 text-body-sm font-medium text-text-muted">opcional</span>
}

interface FormRowProps {
  label: string
  /** Muestra "opcional" junto al nombre. */
  optional?: boolean
  /** id del campo, para que tocar el nombre lo enfoque. */
  htmlFor?: string
  children: ReactNode
  className?: string
}

/** Fila compacta: nombre a la izquierda y el valor (un campo `bare`) a la derecha. */
export function FormRow({ label, optional, htmlFor, children, className = '' }: FormRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-12 ${className}`}>
      <label htmlFor={htmlFor} className="font-body font-semibold text-body-md text-text-secondary whitespace-nowrap shrink-0">
        {label}
        {optional && <OptionalMark />}
      </label>
      <div className="flex-1 min-w-0 flex items-center justify-end">{children}</div>
    </div>
  )
}

interface FormSwitchRowProps {
  label: string
  /** Texto chico debajo del nombre. */
  hint?: string
  icon?: LucideIcon
  checked: boolean
  onChange: (checked: boolean) => void
  className?: string
}

/** Fila con un interruptor a la derecha (Favorito, Fue un regalo...). */
export function FormSwitchRow({ label, hint, icon: Icon, checked, onChange, className = '' }: FormSwitchRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-12 ${className}`}>
      <span className="flex items-center gap-2.5 min-w-0">
        {Icon && <Icon size={18} strokeWidth={2} className="text-primary-text shrink-0" aria-hidden="true" />}
        <span className="min-w-0">
          <span className="block font-body font-semibold text-body-lg text-text">{label}</span>
          {hint && <span className="block text-body-sm text-text-muted">{hint}</span>}
        </span>
      </span>
      <Toggle checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  )
}

interface FormCollapsibleProps {
  title: string
  /** Resumen a la derecha del título, para saber qué hay adentro sin abrirla. */
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

/** Tarjeta plegable: solo se ve el título y un resumen hasta que se toca. */
export function FormCollapsible({ title, summary, defaultOpen = false, children, className = '' }: FormCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`bg-surface-2 border border-border rounded-[18px] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        aria-expanded={isOpen}
        className="w-full flex items-center gap-2 px-3.5 py-3 text-left"
      >
        <span className="font-body font-semibold text-body-lg text-text shrink-0">{title}</span>
        {summary && <span className="ml-auto text-body-md text-text-muted truncate">{summary}</span>}
        <ChevronDown
          size={18}
          className={`shrink-0 text-text-secondary transition-transform duration-300 ${summary ? '' : 'ml-auto'} ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        inert={!isOpen}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border divide-y divide-border">{children}</div>
        </div>
      </div>
    </div>
  )
}

/** Botones del pie (Cancelar / Guardar), pensados para el `footer` de `Sheet`. */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex gap-2.5">{children}</div>
}
