import { useState } from 'react'
import { Share2, Download } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { useWishlistExport } from '../../../hooks/useWishlistExport'
import { buildWishlistPdf } from '../../../lib/wishlistPdf'

interface ShareWishlistModalProps {
  onClose: () => void
  userId: string | undefined
}

function downloadBlob(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'teleo-lista-de-deseados.pdf'
  a.click()
  URL.revokeObjectURL(url)
}

/** Modal de "Compartir lista de deseados": a diferencia de ShareProfileModal, no hay
 *  vista previa visual — con 300+ libros no tendría sentido mostrar una previsualización
 *  dentro de un modal chico (decisión de Fiorella, 2026-09-02). Solo el conteo de libros
 *  y los botones de Compartir/Descargar, que arman el PDF al vuelo (ver wishlistPdf.ts)
 *  justo antes de compartir o descargar, no de una — así siempre refleja la lista actual
 *  sin tener que regenerar nada si el usuario cambia de opinión y reabre el modal.
 *
 *  Solo se monta mientras el modal está abierto (mismo patrón que ShareProfileModal), así
 *  que useWishlistExport (sin límite, trae TODA la lista) no corre en cada visita a
 *  Configuración. */
export function ShareWishlistModal({ onClose, userId }: ShareWishlistModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const { books, isLoading } = useWishlistExport(userId)

  function generateBlob(): Blob {
    return buildWishlistPdf(books)
  }

  async function handleShare() {
    setIsGenerating(true)
    setError(null)
    try {
      const blob = generateBlob()
      const file = new File([blob], 'teleo-lista-de-deseados.pdf', { type: 'application/pdf' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi lista de deseados en Teleo',
        })
      } else {
        downloadBlob(blob)
      }
    } catch (err) {
      // AbortError = el usuario canceló el share nativo — no es un error real.
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[ShareWishlistModal] Error al compartir:', err)
      setError('No se pudo compartir el PDF. Intenta de nuevo o usa "Descargar PDF".')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleDownload() {
    setIsGenerating(true)
    setError(null)
    setDownloaded(false)
    try {
      downloadBlob(generateBlob())
      setDownloaded(true)
    } catch (err) {
      console.error('[ShareWishlistModal] Error al descargar:', err)
      setError('No se pudo generar el PDF. Intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Compartir lista de deseados">
      <div className="bg-bg rounded-2xl p-5 text-center">
        {isLoading ? (
          <p className="text-body-md text-text-secondary">Cargando tu lista...</p>
        ) : (
          <p className="text-body-md text-text">
            Vas a compartir tu lista de deseados: {' '}
            <span className="font-semibold">
              {books.length} libro{books.length === 1 ? '' : 's'}
            </span>
            , agrupados por autor en un PDF.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-5">
        <Button variant="primary" onClick={handleShare} isLoading={isGenerating} disabled={isLoading || books.length === 0}>
          <Share2 size={18} /> Compartir
        </Button>
        <Button variant="outline" onClick={handleDownload} isLoading={isGenerating} disabled={isLoading || books.length === 0}>
          <Download size={18} /> Descargar PDF
        </Button>
        {books.length === 0 && !isLoading && (
          <p className="text-body-sm text-text-secondary text-center mt-1">
            Todavía no tienes libros en tu lista de deseados.
          </p>
        )}
        {error && <p className="text-body-sm text-accent-wishlist text-center mt-1">{error}</p>}
        {downloaded && !error && (
          <p className="text-body-sm text-text-secondary text-center mt-1">
            PDF descargado — revisa tu carpeta de descargas.
          </p>
        )}
      </div>
    </Modal>
  )
}
