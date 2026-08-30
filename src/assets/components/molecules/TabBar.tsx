import { Coffee, BookOpen, NotebookPen, ScrollText, User, type LucideIcon } from 'lucide-react'

export type TabKey = 'mesa' | 'estante' | 'cuaderno' | 'bitacora' | 'perfil'

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'mesa', label: 'Mesa', icon: Coffee },
  { key: 'estante', label: 'Estante', icon: BookOpen },
  { key: 'cuaderno', label: 'Cuaderno', icon: NotebookPen },
  { key: 'bitacora', label: 'Bitácora', icon: ScrollText },
  { key: 'perfil', label: 'Perfil', icon: User },
]

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 bg-surface border-t border-border flex justify-around items-center pt-2"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key
        const color = isActive ? 'var(--color-accent-wishlist)' : 'var(--color-text-secondary)'

        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="flex flex-col items-center gap-1 flex-1 py-1"
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.75} color={color} />
            <span
              className={`text-body-sm font-body ${isActive ? 'font-bold' : 'font-normal'}`}
              style={{ color }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}