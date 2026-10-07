import { createPortal } from 'react-dom'
import { Plus, type LucideIcon } from 'lucide-react'

interface FabProps {
  /** Texto para lectores de pantalla ("Agregar libro"). */
  label: string
  onClick: () => void
  icon?: LucideIcon
}

/** Botón flotante para agregar (V.3.0.0), sobre la barra de pestañas a la derecha. Lleva la
 *  esquina de arriba doblada, como una hoja. Se monta en <body> igual que TabBar, y el
 *  safe-area va como padding del contenedor y no dentro de `bottom` (si env() no resuelve,
 *  un calc() inválido dejaría el botón sin anclar). */
export function Fab({ label, onClick, icon: Icon = Plus }: FabProps) {
  return createPortal(
    <div
      className="fixed inset-x-0 bottom-0 z-30 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto w-full max-w-120">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="pointer-events-auto absolute right-[18px] bottom-[100px] w-14 h-14 rounded-[18px] bg-primary text-primary-ink shadow-float flex items-center justify-center transition-transform active:scale-95 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          <Icon size={26} strokeWidth={2.4} aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-4 h-4 rounded-tr-[18px]"
            style={{
              background:
                'linear-gradient(45deg, color-mix(in srgb, var(--color-primary) 60%, #fff) 50%, var(--color-bg) 50%)',
            }}
          />
        </button>
      </div>
    </div>,
    document.body
  )
}
