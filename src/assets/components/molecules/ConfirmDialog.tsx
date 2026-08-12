import { Trash2, Check, AlertTriangle } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'

type ConfirmStatus = 'confirm' | 'success' | 'error'

interface ConfirmDialogProps {
  isOpen: boolean
  status: ConfirmStatus
  itemLabel: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({ isOpen, status, itemLabel, onConfirm, onClose }: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
          status === 'confirm' ? 'bg-accent-wishlist' : status === 'success' ? 'bg-accent-finished' : 'bg-accent-reading'
        }`}>
          {status === 'confirm' && <Trash2 size={24} className="text-surface" />}
          {status === 'success' && <Check size={24} className="text-surface" />}
          {status === 'error' && <AlertTriangle size={24} className="text-surface" />}
        </div>

        {status === 'confirm' && (
          <>
            <h3 className="font-body text-body-lg font-semibold text-text">¿Eliminar {itemLabel}?</h3>
            <p className="text-body-md text-text-secondary mt-2">
              Esta acción no se puede deshacer. Este {itemLabel} será eliminado permanentemente de tu diario digital.
            </p>
            <Button variant="primary" className="mt-5" onClick={onConfirm}>Eliminar</Button>
            <Button variant="outline" className="mt-3" onClick={onClose}>Cancelar</Button>
          </>
        )}
        {status === 'success' && (
          <>
            <h3 className="font-body text-body-lg font-semibold text-text">¡Eliminado con éxito!</h3>
            <p className="text-body-md text-text-secondary mt-2">Este {itemLabel} ha sido borrado de tu archivo.</p>
            <Button variant="green" className="mt-5" onClick={onClose}>Entendido</Button>
          </>
        )}
        {status === 'error' && (
          <>
            <h3 className="font-body text-body-lg font-semibold text-text">Algo salió mal</h3>
            <p className="text-body-md text-text-secondary mt-2">No se pudo procesar la solicitud, por favor inténtalo de nuevo.</p>
            <Button variant="amber" className="mt-5" onClick={onClose}>Entendido</Button>
          </>
        )}
      </div>
    </Modal>
  )
}