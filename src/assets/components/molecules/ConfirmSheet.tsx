import type { ReactNode } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button, type ButtonVariant } from '../atoms/Button'
import { BookMiniHeader, type MiniBook } from './BookMiniHeader'
import { FormActions } from './FormLayout'

interface ConfirmSheetProps {
  /** La pregunta o el aviso: va como título de la hoja. */
  title: string
  /** Frase corta debajo. */
  message?: ReactNode
  /** Mini ficha del libro, cuando la acción es sobre un libro. */
  book?: MiniBook | null
  /** Contenido extra (por ejemplo, una casilla de "Entiendo..."). */
  children?: ReactNode
  confirmLabel: string
  confirmVariant?: ButtonVariant
  confirmDisabled?: boolean
  isLoading?: boolean
  /** Sin esto, el aviso tiene un solo botón (confirmLabel) que cierra. */
  onConfirm?: () => void
  cancelLabel?: string
  onClose: () => void
}

/** Confirmaciones y avisos cortos (V.2.2.0): sin ícono, la pregunta como título de la hoja,
 *  una frase, la mini ficha si aplica y los botones abajo, lado a lado. */
export function ConfirmSheet({
  title, message, book, children,
  confirmLabel, confirmVariant = 'primary', confirmDisabled, isLoading,
  onConfirm, cancelLabel = 'Cancelar', onClose,
}: ConfirmSheetProps) {
  return (
    <Sheet
      onClose={onClose}
      title={title}
      footer={
        <FormActions>
          {onConfirm ? (
            <>
              <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
              <Button variant={confirmVariant} onClick={onConfirm} disabled={confirmDisabled} isLoading={isLoading}>{confirmLabel}</Button>
            </>
          ) : (
            <Button variant={confirmVariant} onClick={onClose}>{confirmLabel}</Button>
          )}
        </FormActions>
      }
    >
      <div className="animate-fade-in pb-1">
        {message && <div className="text-body-md text-text-secondary leading-relaxed">{message}</div>}
        {book && <BookMiniHeader book={book} className="mt-4 mb-0!" />}
        {children}
      </div>
    </Sheet>
  )
}
