import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface rounded-3xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {title ? (
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display italic text-display-md text-accent-wishlist">{title}</h2>
            <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary shrink-0">
              <X size={22} />
            </button>
          </div>
        ) : (
          <button onClick={onClose} aria-label="Cerrar" className="text-text-secondary shrink-0 mb-2 ml-auto block">
            <X size={22} />
          </button>
        )}
        {children}
      </div>
    </div>
  )
}