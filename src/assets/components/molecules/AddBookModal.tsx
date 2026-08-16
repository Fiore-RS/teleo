import { useState } from 'react'
import { ScanBarcode, Search, ImageOff } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import { searchBooksByQuery, searchBookByIsbn, type BookSearchResult } from '../../../lib/bookSearch'

interface AddBookModalProps {
  isOpen: boolean
  onClose: () => void
  sagaId?: string
  initialStatus?: 'pendiente' | 'deseado'
  onAdd: (book: {
    title: string; author: string | null; cover_url: string | null
    total_pages: number | null; language: string | null; category: string | null
    isbn: string | null; status: 'pendiente' | 'deseado'; saga_id?: string
  }) => Promise<{ error: unknown }>
}

export function AddBookModal({ isOpen, onClose, sagaId, initialStatus = 'pendiente', onAdd }: AddBookModalProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<BookSearchResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  function reset() {
    setQuery('')
    setResult(null)
    setNotFound(false)
    setIsSearching(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSearch() {
    if (!query.trim()) return
    setIsSearching(true)
    setNotFound(false)
    const found = await searchBooksByQuery(query.trim())
    setIsSearching(false)
    found ? setResult(found) : setNotFound(true)
  }

  async function handleIsbnDetected(isbn: string) {
    setIsScannerOpen(false)
    setIsSearching(true)
    setNotFound(false)
    const found = await searchBookByIsbn(isbn)
    setIsSearching(false)
    found ? setResult(found) : setNotFound(true)
  }

  async function handleAdd() {
  if (!result) return
  setIsSaving(true)
  const { error } = await onAdd({
    title: result.title,
    author: result.author ?? null,
    cover_url: result.coverUrl ?? null,
    total_pages: result.totalPages ?? null,
    language: result.language ?? null,
    category: result.category ?? null,
    isbn: result.isbn ?? null,
    status: initialStatus,
    saga_id: sagaId,
  })
  setIsSaving(false)
  if (!error) handleClose()
}

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title="Nuevo libro para el estante">
        {!result ? (
          <div className="space-y-4">
            <p className="text-body-md text-text-secondary">
              Busca un libro o escanea su código de barras para agregarlo a tu colección.
            </p>

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Buscar manualmente</label>
              <Input
                icon={Search}
                iconPosition="right"
                onIconClick={handleSearch}
                placeholder="Título, autor, ISBN..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <p className="text-center text-body-sm text-text-secondary">ó</p>

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Escaneo rápido</label>
              <Button
                variant="primary"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center gap-2"
              >
                <ScanBarcode size={18} />
                Escanear código de barras
              </Button>
              <p className="text-body-sm text-text-secondary mt-2">
                Abre la cámara para detectar el ISBN automáticamente.
              </p>
            </div>

            {isSearching && <p className="text-center text-body-sm text-text-secondary">Buscando...</p>}
            {notFound && (
              <p className="text-center text-body-sm text-accent-wishlist">
                No encontramos ese libro. Intenta con otro título o el ISBN exacto.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="relative aspect-2/3 w-32 mx-auto rounded-xl overflow-hidden bg-border mb-4">
              {result.coverUrl ? (
                <img src={result.coverUrl} alt={result.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={24} className="text-text-secondary" />
                </div>
              )}
            </div>

            <h3 className="font-display italic text-display-md text-accent-wishlist text-center">
              {result.title}
            </h3>
            {result.author && (
              <p className="text-body-md text-text-secondary text-center mt-1">{result.author}</p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              {result.totalPages && (
                <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">
                  {result.totalPages} páginas
                </div>
              )}
              {result.language && (
                <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text">
                  {result.language.toUpperCase()}
                </div>
              )}
              {result.category && (
                <div className="bg-bg rounded-xl py-2 text-center text-body-sm text-text col-span-2">
                  {result.category}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setResult(null)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleAdd} isLoading={isSaving}>
                Agregar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleIsbnDetected}
      />
    </>
  )
}