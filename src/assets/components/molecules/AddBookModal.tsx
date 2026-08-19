import { useRef, useState } from 'react'
import { ScanBarcode, Search, ImageOff, PenLine, Pencil } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { CoverImage } from '../atoms/CoverImage'
import { SegmentedTabs } from '../atoms/SegmentedTabs'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import { searchBooksByQueryMultiple, searchBookByIsbn, type BookSearchResult } from '../../../lib/bookSearch'
import type { ReadingStatus } from '../../../lib/status'
import { categoryOptions, languageOptions, formatOptions, type BookFormat } from '../../../lib/options'
import { useCoverUpload } from '../../../hooks/useCoverUpload'
import { parseDurationInput } from '../../../lib/duration'

const statusOptions: { value: ReadingStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'leyendo', label: 'Leyendo' },
  { value: 'terminado', label: 'Terminado' },
  { value: 'abandonado', label: 'Abandonado' },
  { value: 'deseado', label: 'Deseado' },
]

interface NewBookPayload {
  title: string; author: string | null; cover_url: string | null
  total_pages: number | null; language: string | null; category: string | null
  isbn: string | null; format?: BookFormat | null; status: ReadingStatus; saga_id?: string
  total_duration_seconds?: number | null
}

interface AddBookModalProps {
  isOpen: boolean
  onClose: () => void
  sagaId?: string
  userId?: string
  initialStatus?: 'pendiente' | 'deseado'
  onAdd: (book: NewBookPayload) => Promise<{ error: unknown }>
}

interface ManualDraft {
  title: string
  author: string
  category: string
  language: string
  format: BookFormat
  totalPages: string
  totalDuration: string
  isbn: string
  status: ReadingStatus
  coverUrl: string | null
}

function emptyManualDraft(status: ReadingStatus): ManualDraft {
  return {
    title: '', author: '', category: 'Novela', language: 'es',
    format: 'fisico', totalPages: '', totalDuration: '', isbn: '', status, coverUrl: null,
  }
}

export function AddBookModal({ isOpen, onClose, sagaId, userId, initialStatus = 'pendiente', onAdd }: AddBookModalProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<BookSearchResult[]>([])
  const [result, setResult] = useState<BookSearchResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<ReadingStatus>(initialStatus)
  const [isManual, setIsManual] = useState(false)
  const [manualDraft, setManualDraft] = useState<ManualDraft>(emptyManualDraft(initialStatus))
  const { uploadCover, isUploading: isUploadingCover } = useCoverUpload(userId)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const canPickStatus = initialStatus !== 'deseado'

  async function handleManualCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadCover(file)
    if (url) setManualDraft((prev) => ({ ...prev, coverUrl: url }))
    e.target.value = ''
  }

  function reset() {
    setQuery('')
    setResults([])
    setResult(null)
    setNotFound(false)
    setIsSearching(false)
    setStatus(initialStatus)
    setIsManual(false)
    setManualDraft(emptyManualDraft(initialStatus))
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSearch() {
    if (!query.trim()) return
    setIsSearching(true)
    setNotFound(false)
    setResults([])
    const found = await searchBooksByQueryMultiple(query.trim(), 3)
    setIsSearching(false)
    found.length > 0 ? setResults(found) : setNotFound(true)
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
      status: canPickStatus ? status : initialStatus,
      saga_id: sagaId,
    })
    setIsSaving(false)
    if (!error) handleClose()
  }

  async function handleManualCreate() {
    if (!manualDraft.title.trim()) return
    setIsSaving(true)
    const isAudiobook = manualDraft.format === 'audiolibro'
    const { error } = await onAdd({
      title: manualDraft.title.trim(),
      author: manualDraft.author.trim() || null,
      cover_url: manualDraft.coverUrl,
      total_pages: !isAudiobook && manualDraft.totalPages ? parseInt(manualDraft.totalPages, 10) : null,
      total_duration_seconds: isAudiobook ? parseDurationInput(manualDraft.totalDuration) : null,
      language: manualDraft.language || null,
      category: manualDraft.category || null,
      isbn: manualDraft.isbn.trim() || null,
      format: manualDraft.format,
      status: canPickStatus ? manualDraft.status : initialStatus,
      saga_id: sagaId,
    })
    setIsSaving(false)
    if (!error) handleClose()
  }

  const showResultsList = results.length > 0 && !result

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} title={isManual ? 'Crear libro desde cero' : 'Nuevo libro para el estante'}>
        {isManual ? (
          <div className="space-y-4">
            <div className="relative aspect-2/3 w-32 mx-auto rounded-xl overflow-hidden bg-border">
              {manualDraft.coverUrl ? (
                <CoverImage src={manualDraft.coverUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff size={24} className="text-text-secondary" />
                </div>
              )}
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover || !userId}
                aria-label="Agregar portada desde el dispositivo"
                className="absolute bottom-2 left-2 w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm disabled:opacity-50"
              >
                <Pencil size={14} className="text-accent-reading" />
              </button>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleManualCoverChange}
              className="hidden"
            />
            {isUploadingCover && (
              <p className="text-body-sm text-text-secondary text-center -mt-2">Subiendo portada...</p>
            )}

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Título</label>
              <Input
                placeholder="Título del libro"
                value={manualDraft.title}
                onChange={(e) => setManualDraft({ ...manualDraft, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Autor</label>
              <Input
                placeholder="Autor del libro"
                value={manualDraft.author}
                onChange={(e) => setManualDraft({ ...manualDraft, author: e.target.value })}
              />
            </div>

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Formato</label>
              <SegmentedTabs
                options={formatOptions}
                active={manualDraft.format}
                onChange={(format) => setManualDraft({ ...manualDraft, format })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-body-sm text-text-secondary block mb-1">Categoría</label>
                <Select
                  options={categoryOptions}
                  value={manualDraft.category}
                  onChange={(e) => setManualDraft({ ...manualDraft, category: e.target.value })}
                />
              </div>
              <div>
                <label className="text-body-sm text-text-secondary block mb-1">Idioma</label>
                <Select
                  options={languageOptions}
                  value={manualDraft.language}
                  onChange={(e) => setManualDraft({ ...manualDraft, language: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                {manualDraft.format === 'audiolibro' ? (
                  <>
                    <label className="text-body-sm text-text-secondary block mb-1">Duración</label>
                    <DurationMaskInput
                      value={manualDraft.totalDuration}
                      onChange={(v) => setManualDraft({ ...manualDraft, totalDuration: v })}
                    />
                  </>
                ) : (
                  <>
                    <label className="text-body-sm text-text-secondary block mb-1">Páginas</label>
                    <Input
                      type="number"
                      placeholder="000"
                      value={manualDraft.totalPages}
                      onChange={(e) => setManualDraft({ ...manualDraft, totalPages: e.target.value })}
                    />
                  </>
                )}
              </div>
              <div>
                <label className="text-body-sm text-text-secondary block mb-1">ISBN (opcional)</label>
                <Input
                  placeholder="ISBN"
                  value={manualDraft.isbn}
                  onChange={(e) => setManualDraft({ ...manualDraft, isbn: e.target.value })}
                />
              </div>
            </div>

            {canPickStatus && (
              <div>
                <label className="text-body-sm text-text-secondary block mb-1">Estado de lectura</label>
                <Select
                  options={statusOptions}
                  value={manualDraft.status}
                  onChange={(e) => setManualDraft({ ...manualDraft, status: e.target.value as ReadingStatus })}
                />
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => setIsManual(false)}>Volver</Button>
              <Button
                variant="primary"
                onClick={handleManualCreate}
                isLoading={isSaving}
                disabled={!manualDraft.title.trim()}
              >
                Crear Libro
              </Button>
            </div>
          </div>
        ) : !result && !showResultsList ? (
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
              <Button
                variant="primary"
                className="mt-2 flex items-center justify-center gap-2"
                onClick={handleSearch}
                disabled={!query.trim()}
              >
                <Search size={18} />
                Buscar
              </Button>
            </div>

            <p className="text-center text-body-sm text-text-secondary">ó</p>

            <div>
              <label className="text-body-sm text-text-secondary block mb-1">Escaneo rápido</label>
              <Button
                variant="slate"
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

            <button
              type="button"
              onClick={() => setIsManual(true)}
              className="w-full flex items-center justify-center gap-2 text-body-sm text-text-secondary underline underline-offset-2"
            >
              <PenLine size={14} />
              ¿No lo encuentras? Créalo desde cero
            </button>
          </div>
        ) : showResultsList ? (
          <div>
            <p className="text-body-md text-text-secondary mb-4 text-center">
              Encontramos {results.length} coincidencia{results.length > 1 ? 's' : ''}. Elige la más parecida:
            </p>
            <div className="space-y-2">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setResult(r)}
                  className="w-full flex gap-3 items-center bg-bg rounded-xl p-2 text-left"
                >
                  <div className="w-12 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-border">
                    {r.coverUrl ? (
                      <CoverImage src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={14} className="text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-md text-text line-clamp-2">{r.title}</p>
                    {r.author && <p className="text-body-sm text-text-secondary line-clamp-1">{r.author}</p>}
                  </div>
                </button>
              ))}
            </div>
            <Button variant="outline" className="mt-4" onClick={reset}>Buscar de nuevo</Button>
          </div>
        ) : result ? (
          <div>
            <div className="relative aspect-2/3 w-32 mx-auto rounded-xl overflow-hidden bg-border mb-4">
              {result.coverUrl ? (
                <CoverImage src={result.coverUrl} alt={result.title} className="w-full h-full object-cover" />
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

            {result.isSeriesLevel && (
              <p className="text-body-sm text-text-secondary text-center mt-2">
                Este resultado corresponde a la serie completa, no a un volumen específico —
                no incluye páginas ni ISBN. Puedes editarlo después de agregarlo.
              </p>
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

            {canPickStatus && (
              <div className="mt-4">
                <label className="text-body-sm text-text-secondary block mb-1">Estado de lectura</label>
                <Select options={statusOptions} value={status} onChange={(e) => setStatus(e.target.value as ReadingStatus)} />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setResult(null)}>
                {results.length > 0 ? 'Volver a la lista' : 'Cancelar'}
              </Button>
              <Button variant="primary" onClick={handleAdd} isLoading={isSaving}>
                Agregar
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleIsbnDetected}
      />
    </>
  )
}
