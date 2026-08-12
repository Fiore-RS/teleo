import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../../../hooks/useTheme'

const options = [
  { value: 'light' as const, icon: Sun, label: 'Modo claro' },
  { value: 'dark' as const, icon: Moon, label: 'Modo oscuro' },
  { value: 'system' as const, icon: Monitor, label: 'Usar el del sistema' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la aplicación"
      className="flex items-center gap-1 p-1.5 rounded-2xl bg-border/60"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={`flex-1 flex items-center justify-center py-3 rounded-xl transition-colors ${
              isActive
                ? 'bg-surface text-accent-wishlist shadow-sm'
                : 'bg-transparent text-text-secondary'
            }`}
          >
            <Icon size={20} strokeWidth={1.75} />
          </button>
        )
      })}
    </div>
  )
} 