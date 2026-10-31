import { useTheme } from '../../../hooks/useTheme'

const options = [
  { value: 'light' as const, label: 'Claro' },
  { value: 'dark' as const, label: 'Oscuro' },
  { value: 'system' as const, label: 'Sistema' },
]

/** Selector de tema en forma de píldora (rediseño 2026), mismo lenguaje que las pestañas de antes:
 *  la opción activa va rellena en vino. Solo texto desde la V.3.5.0. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="flex items-center gap-1 p-1 rounded-full bg-surface-2 border border-border"
    >
      {options.map(({ value, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center py-2 rounded-full text-body-md font-body transition-colors ${
              isActive ? 'bg-primary text-primary-ink font-bold' : 'text-text-secondary font-medium'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
