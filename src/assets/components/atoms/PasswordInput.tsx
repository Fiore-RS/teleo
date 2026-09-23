import { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  className?: string
}

/** Campo de contraseña con el botón del ojo para mostrarla u ocultarla (feedback de las
 *  beta-testers: sin él no sabían si la estaban escribiendo mal). Mismo estilo que `Input`
 *  con ícono a la izquierda, más el botón a la derecha.
 *
 *  Además apaga la mayúscula automática, el autocorrector y el corrector ortográfico del
 *  teclado del celular, que cambiaban la primera letra o "corregían" la contraseña. */
export function PasswordInput({ className = '', ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ToggleIcon = isVisible ? EyeOff : Eye

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
        <Lock size={18} strokeWidth={1.75} />
      </span>
      <input
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        {...props}
        type={isVisible ? 'text' : 'password'}
        className={`w-full bg-surface-2 border border-border rounded-2xl py-3 pl-11 pr-12 text-body-lg font-body text-text placeholder:text-text-muted focus:outline-none focus:border-primary-text transition-colors ${className}`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((v) => !v)}
        // Evita que el campo pierda el foco (y se cierre el teclado) al tocar el ojo.
        onMouseDown={(e) => e.preventDefault()}
        aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={isVisible}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-primary-text focus-visible:outline-2 focus-visible:outline-primary-text"
      >
        <ToggleIcon size={18} strokeWidth={1.75} />
      </button>
    </div>
  )
}
