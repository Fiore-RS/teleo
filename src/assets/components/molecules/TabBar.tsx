import { useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Coffee, BookOpen, NotebookPen, ScrollText, User, type LucideIcon } from 'lucide-react'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { CoverNav } from './CoverNav'

export type TabKey = 'mesa' | 'estante' | 'cuaderno' | 'bitacora' | 'perfil'

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'mesa', label: 'Mesa', icon: Coffee },
  { key: 'estante', label: 'Estante', icon: BookOpen },
  { key: 'cuaderno', label: 'Cuaderno', icon: NotebookPen },
  { key: 'bitacora', label: 'Bitácora', icon: ScrollText },
  { key: 'perfil', label: 'Perfil', icon: User },
]

interface TabBarProps {
  /** null: ninguna sección marcada (Buscar, V.4.2.0). */
  active: TabKey | null
  onChange: (tab: TabKey) => void
  /** Qué hacer al tocar la pestaña marcada. Por defecto vuelve arriba; en las pantallas
   *  secundarias (Configuración) lleva a la sección de la que se viene. */
  onActiveTap?: () => void
}

/** Cuántas barras hay montadas. Al cambiar de pantalla la vieja se desmonta y la nueva se monta
 *  en el mismo paso, así que se cuenta para no quitar la marca entre una y otra. */
let mountedBars = 0

/** Vuelve al inicio de la pantalla; sin animación si el sistema pide reducir movimiento. */
function scrollToTop() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}

/** Barra de secciones. V.3.0.0: tocar la pestaña en la que ya se está vuelve arriba (reemplaza
 *  al botón de subir). V.3.8.0: es la tapa del cuaderno, del color principal del tema (como la
 *  barra lateral de escritorio), pegada de lado a lado y abajo, con las esquinas de arriba
 *  redondeadas, textura de puntos y costura punteada. La pestaña activa es un cuadro del color
 *  del fondo con el ícono de acento, como el separador de papel de escritorio.
 *  V.4.0.0: en tableta y escritorio la barra de abajo se oculta y la navegación es la tapa del
 *  cuaderno lateral (CoverNav). Mientras hay una barra montada, <html data-tapa> le avisa a la
 *  columna de la app que deje libre el espacio de la tapa (index.css). */
export function TabBar({ active, onChange, onActiveTap }: TabBarProps) {
  const breakpoint = useBreakpoint()

  useLayoutEffect(() => {
    mountedBars++
    document.documentElement.dataset.tapa = ''
    return () => {
      mountedBars = Math.max(0, mountedBars - 1)
      if (mountedBars === 0) delete document.documentElement.dataset.tapa
    }
  }, [])

  // Se monta en <body> con un portal para que quede fuera del contenedor que se desliza al
  // entrar a una pantalla secundaria: así la barra se queda quieta y solo cambia la pestaña activa.
  return createPortal(
    <>
    <div className="tableta:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-120 pointer-events-none z-30">
      <nav
        aria-label="Secciones"
        className="relative pointer-events-auto bg-cover text-cover-ink rounded-t-[22px] flex justify-between items-center px-2 pt-2.5"
        style={{
          paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 20px -12px var(--teleo-cover-shadow)',
        }}
      >
        {/* Costura cerca del borde de arriba, siguiendo las esquinas redondeadas. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-[7px] top-[6px] bottom-0 border-t-[1.5px] border-x-[1.5px] border-b-0 border-dashed border-stitch rounded-t-[16px] pointer-events-none"
        />
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = active === key

          return (
            <button
              key={key}
              type="button"
              onClick={() => (isActive ? (onActiveTap ?? scrollToTop)() : onChange(key))}
              aria-current={isActive ? 'page' : undefined}
              data-tour={breakpoint === 'celular' ? `tab-${key}` : undefined}
              className={`relative flex flex-col items-center gap-0.5 flex-1 rounded-2xl focus-visible:outline-2 focus-visible:outline-cover-ink ${
                isActive ? '' : 'opacity-75'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors motion-reduce:transition-none ${
                  isActive ? 'bg-bg text-primary-text shadow-[0_2px_5px_-2px_var(--teleo-cover-shadow)]' : ''
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
    </div>
    <CoverNav active={active} onChange={onChange} onActiveTap={onActiveTap ?? scrollToTop} />
    </>,
    document.body
  )
}
