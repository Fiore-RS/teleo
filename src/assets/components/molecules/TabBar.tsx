import { createPortal } from 'react-dom'
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

/** Rediseño 2026: barra flotante en forma de píldora. La pestaña activa lleva el ícono sobre
 *  una pastilla rubor y el texto en vino. */
export function TabBar({ active, onChange }: TabBarProps) {
  // Se monta en <body> con un portal para que quede fuera del contenedor que se desvanece al
  // cambiar de pantalla: así la barra se queda quieta y solo cambia la pestaña activa.
  return createPortal(
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 px-3 pointer-events-none z-30"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Secciones"
        className="pointer-events-auto bg-surface border border-border rounded-[28px] shadow-float flex justify-around items-center px-1.5 py-2"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key

          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 flex-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-primary-text ${
                isActive ? 'text-primary-text' : 'text-text-secondary'
              }`}
            >
              <span
                className={`w-12 h-[30px] rounded-[15px] flex items-center justify-center transition-colors ${
                  isActive ? 'bg-primary-soft' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.1 : 1.8} />
              </span>
              <span className={`text-[11px] font-body ${isActive ? 'font-bold' : 'font-medium'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>,
    document.body
  )
}
