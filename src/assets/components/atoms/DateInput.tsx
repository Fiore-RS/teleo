import { Calendar } from 'lucide-react'
import { useRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Sin caja, alineada a la derecha y con el calendario a la izquierda en color de marca:
   *  para filas compactas de formulario. Tocar cualquier parte abre el calendario igual. */
  bare?: boolean
}

// Hace que el ícono nativo del calendario cubra todo el campo (invisible), así cualquier
// toque abre el selector del teléfono.
const pickerOverlay =
  '[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0'

export function DateInput({ className = '', bare = false, ...props }: DateInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function openPicker() {
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
      } catch {
        el.focus()
      }
    } else {
      el.focus()
    }
  }

  if (bare) {
    return (
      <div className="relative inline-flex items-center justify-end gap-1.5 cursor-pointer text-primary-text" onClick={openPicker}>
        <Calendar size={16} strokeWidth={2} className="shrink-0 pointer-events-none" />
        <input
          {...props}
          ref={inputRef}
          type="date"
          className={`bg-transparent font-body text-body-lg text-text text-right focus:outline-none cursor-pointer min-w-0 ${pickerOverlay} ${className}`}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full cursor-pointer" onClick={openPicker}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
        <Calendar size={18} strokeWidth={1.75} />
      </span>
      <input
        {...props}
        ref={inputRef}
        type="date"
        className={`w-full bg-surface-2 border border-border rounded-2xl py-3 pl-11 pr-4 text-body-lg font-body text-text placeholder:text-text-muted focus:outline-none focus:border-primary-text transition-colors cursor-pointer ${pickerOverlay} ${className}`}
      />
    </div>
  )
}