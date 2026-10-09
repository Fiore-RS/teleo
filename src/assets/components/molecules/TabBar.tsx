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
  /** Qué hacer al tocar la pestaña marcada. Por defecto vuelve arriba; en las pantallas
   *  secundarias (Configuración) lleva a la sección de la que se viene. */
  onActiveTap?: () => void
}

/** Vuelve al inicio de la pantalla; sin animación si el sistema pide reducir movimiento. */
function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

/** Barra flotante de secciones. V.3.0.0: la pestaña activa es un círculo vino con el ícono
 *  claro. Tocar la pestaña en la que ya se está vuelve arriba (reemplaza al botón de subir). */
export function TabBar({ active, onChange, onActiveTap }: TabBarProps) {
  // Se monta en <body> con un portal para que quede fuera del contenedor que se desvanece al
  // cambiar de pantalla: así la barra se queda quieta y solo cambia la pestaña activa.
  return createPortal(
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 px-3.5 pointer-events-none z-30"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Secciones"
        className="pointer-events-auto bg-surface border border-border rounded-[22px] shadow-float flex justify-between items-center p-2"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => (isActive ? (onActiveTap ?? scrollToTop)() : onChange(key))}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 flex-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-primary-text ${
                isActive ? 'text-text' : 'text-text-secondary'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors motion-reduce:transition-none ${
                  isActive ? 'bg-primary text-primary-ink' : ''
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.1 : 1.8} aria-hidden="true" />
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
