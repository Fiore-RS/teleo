import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Modal } from '../atoms/Modal'

interface BarcodeScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onDetected: (isbn: string) => void
}

const SCANNER_ID = 'barcode-scanner-region'

export function BarcodeScannerModal({ isOpen, onClose, onDetected }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decodedText) => {
          onDetected(decodedText)
          scanner.stop().catch(() => {})
        },
        () => {}
      )
      .catch((err) => console.error('No se pudo iniciar la cámara:', err))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [isOpen, onDetected])

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Escanear código de barras">
      <div id={SCANNER_ID} className="rounded-2xl overflow-hidden" />
      <p className="text-body-sm text-text-secondary text-center mt-3">
        Apunta la cámara al código de barras del libro (ISBN).
      </p>
    </Modal>
  )
}