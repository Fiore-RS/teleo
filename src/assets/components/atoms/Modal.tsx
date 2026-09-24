import type { ReactNode } from 'react'
import { Sheet } from './Sheet'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** Se conserva por compatibilidad: desde las pruebas de la V.2.0.0 todos los diálogos
   *  se muestran como hoja que baja desde arriba, así que 'dialog' y 'sheet' se ven igual. */
  variant?: 'dialog' | 'sheet'
}

/** Diálogo de Teleo. Antes había dos estilos (ventana centrada para confirmaciones y hoja
 *  desde arriba para contenido largo); ahora todos usan la hoja (`Sheet`), para que la app
 *  se sienta igual en todas partes y el teclado del celular no tape los campos. */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null
  return (
    <Sheet onClose={onClose} title={title}>
      {children}
    </Sheet>
  )
}
