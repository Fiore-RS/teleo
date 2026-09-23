import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme'

const options = [
  { value: 'light' as const, icon: Sun, label: 'Claro' },
  { value: 'dark' as const, icon: Moon, label: 'Oscuro' },
  { value: 'system' as const, icon: Monitor, label: 'Sistema' },
]

/** Selector de tema en forma de píldora (rediseño 2026), mismo lenguaje que SegmentedTabs:
 *  la opción activa va rellena en vino. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="flex items-center gap-1 p-1 rounded-full bg-surface-2 border border-border"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-body-md font-body transition-colors ${
              isActive ? 'bg-primary text-primary-ink font-bold' : 'text-text-secondary font-medium'
            }`}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
