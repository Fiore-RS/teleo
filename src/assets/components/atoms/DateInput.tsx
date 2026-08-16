import { Calendar } from 'lucide-react'
import { useRef } from 'react'
import type { InputHTMLAttributes } from 'react'

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function DateInput({ className = '', ...props }: DateInputProps) {
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

  return (
    <div className="relative w-full cursor-pointer" onClick={openPicker}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
        <Calendar size={18} strokeWidth={1.75} />
      </span>
      <input
        {...props}
        ref={inputRef}
        type="date"
        className={`w-full bg-surface border border-border rounded-xl py-3 pl-11 pr-4 text-body-lg font-body text-text placeholder:text-text-secondary focus:outline-none focus:border-accent-wishlist transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${className}`}
      />
    </div>
  )
}