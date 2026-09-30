import { useRef, useState, type ReactNode } from 'react'
import { ScanBarcode, Search, ImageOff, PenLine, Camera, ChevronRight, Sparkles } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Select } from '../atoms/Select'
import { Button } from '../atoms/Button'
import { Badge } from '../atoms/Badge'
import { CoverImage } from '../atoms/CoverImage'
import { DurationMaskInput } from '../atoms/DurationMaskInput'
import { BarcodeScannerModal } from './BarcodeScannerModal'
import { ReadingDatesFields } from './ReadingDatesFields'
import { StatusMenu } from './StatusMenu'
import { FormatPicker } from './EditBookForm'
import { FormActions, FormCard, FormRow, FormSection, FormSwitchRow } from './FormLayout'
import { readingDatesAreValid, type ReadingDates } from '../../../lib/readingDates'
import { searchBooksByQueryMultiple, searchBookByIsbn, type BookSearchResult } from '../../../lib/bookSearch'
import type { ReadingStatus } from '../../../lib/status'
import { categoryOptions, type BookFormat } from '../../../lib/options'
import { languageLabel, languageOptionsFrom } from '../../../lib/languages'
import { useCoverUpload } from '../../../hooks/useCoverUpload'
import { useBookLanguages } from '../../../hooks/useBookLanguages'
import { parseDurationInput } from '../../../lib/duration'

interface NewBookPayload {
  title: string; author: string | null; cover_url: string | null
  total_pages: number | null; language: string | null; category: string | null
  isbn: string | null; format?: BookFormat | null; status: ReadingStatus; saga_id?: string
  total_duration_seconds?: number | null
  is_priority?: boolean; priority_sort_order?: number
  start_date?: string | null; end_date?: string | null
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
  const [category, setCategory] = useState('Novela')
  const [format, setFormat] = useState<BookFormat>('fisico')
  const [isManual, setIsManual] = useState(false)
  const [manualDraft, setManualDraft] = useState<ManualDraft>(emptyManualDraft(initialStatus))
  // Fechas para un libro que se agrega ya terminado (por ejemplo, uno leído hace tiempo).
  // Empiezan vacías: sin fecha de fin el libro se guarda igual, pero no cuenta para el reto.
  const [finishDates, setFinishDates] = useState<ReadingDates>({ startDate: '', endDate: '' })
  const [isPriority, setIsPriority] = useState(false)
  const { uploadCover, isUploading: isUploadingCover } = useCoverUpload(userId)
  const bookLanguages = useBookLanguages(userId)
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
    setCategory('Novela')
    setFormat('fisico')
    setIsManual(false)
    setManualDraft(emptyManualDraft(initialStatus))
    setIsPriority(false)
    setFinishDates({ startDate: '', endDate: '' })
  }

  function datesFor(resolvedStatus: ReadingStatus) {
    return resolvedStatus === 'terminado'
      ? { start_date: finishDates.startDate || null, end_date: finishDates.endDate || null }
      : {}
  }

  function selectResult(r: BookSearchResult) {
    setResult(r)
    setCategory(r.category || 'Novela')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSearch() {
    if (!query.trim() || isSearching) return
    setIsSearching(true)
    setNotFound(false)
    setResults([])
    const found = await searchBooksByQueryMultiple(query.trim(), 3)
    setIsSearching(false)
    if (found.length > 0) setResults(found)
    else setNotFound(true)
  }

  async function handleIsbnDetected(isbn: string) {
    setIsScannerOpen(false)
    setIsSearching(true)
    setNotFound(false)
    const found = await searchBookByIsbn(isbn)
    setIsSearching(false)
    if (found) selectResult(found)
    else setNotFound(true)
  }

  async function handleAdd() {
    if (!result) return
    const resolvedStatus = canPickStatus ? status : initialStatus
    if (resolvedStatus === 'terminado' && !readingDatesAreValid(finishDates)) return
    setIsSaving(true)
    const { error } = await onAdd({
      title: result.title,
      author: result.author ?? null,
      cover_url: result.coverUrl ?? null,
      total_pages: result.totalPages ?? null,
      language: result.language ?? null,
      category: category || null,
      isbn: result.isbn ?? null,
      format,
      status: resolvedStatus,
      saga_id: sagaId,
      ...(resolvedStatus === 'pendiente' && isPriority
        ? { is_priority: true, priority_sort_order: Date.now() }
        : {}),
      ...datesFor(resolvedStatus),
    })
    setIsSaving(false)
    if (!error) handleClose()
  }

  async function handleManualCreate() {
    if (!manualDraft.title.trim()) return
    const isAudiobook = manualDraft.format === 'audiolibro'
    const resolvedStatus = canPickStatus ? manualDraft.status : initialStatus
    if (resolvedStatus === 'terminado' && !readingDatesAreValid(finishDates)) return
    setIsSaving(true)
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
      status: resolvedStatus,
      saga_id: sagaId,
      ...(resolvedStatus === 'pendiente' && isPriority
        ? { is_priority: true, priority_sort_order: Date.now() }
        : {}),
      ...datesFor(resolvedStatus),
    })
    setIsSaving(false)
    if (!error) handleClose()
  }

  const showResultsList = results.length > 0 && !result
  const activeStatus = isManual ? manualDraft.status : status
  const datesInvalid = canPickStatus && activeStatus === 'terminado' && !readingDatesAreValid(finishDates)

  function setActiveStatus(next: ReadingStatus) {
    if (isManual) setManualDraft((prev) => ({ ...prev, status: next }))
    else setStatus(next)
  }

  // Píldora de estado (como en Editar libro). Si el estado viene fijo (lista de deseados),
  // se muestra sin menú.
  const statusControl = canPickStatus ? (
    <StatusMenu status={activeStatus} onChange={setActiveStatus} align="left" />
  ) : (
    <Badge status={initialStatus} />
  )

  // Tu lectura: fechas si se agrega ya terminado; Esta temporada si queda pendiente.
  const readingSection = canPickStatus && (activeStatus === 'terminado' || activeStatus === 'pendiente') ? (
    <FormSection label="Tu lectura" className="mb-2">
      <div key={activeStatus} className="animate-fade-in">
        {activeStatus === 'terminado' ? (
          <ReadingDatesFields startDate={finishDates.startDate} endDate={finishDates.endDate} onChange={setFinishDates} />
        ) : (
          <FormCard>
            <FormSwitchRow
              icon={Sparkles}
              label="Esta temporada"
              hint="En tu lista de prioridad"
              checked={isPriority}
              onChange={setIsPriority}
            />
          </FormCard>
        )}
      </div>
    </FormSection>
  ) : null

  const searchBar = (
    <div className="flex items-center gap-2 bg-surface-2 border border-border rounded-full pl-4 pr-1.5 py-1.5 focus-within:border-primary-text transition-colors">
      <input
        aria-label="Buscar un libro"
        placeholder="Título, autor o ISBN"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        className="flex-1 min-w-0 bg-transparent focus:outline-none font-body text-body-lg text-text placeholder:text-text-muted"
      />
      <button
        type="button"
        onClick={handleSearch}
        disabled={!query.trim() || isSearching}
        aria-label="Buscar"
        className="w-9.5 h-9.5 shrink-0 rounded-full bg-primary text-primary-ink flex items-center justify-center disabled:opacity-50 transition-opacity"
      >
        <Search size={18} strokeWidth={2.3} />
      </button>
    </div>
  )

  const searchStatus = (
    <>
      {isSearching && <p className="text-center text-body-sm text-text-secondary mt-3 animate-fade-in">Buscando...</p>}
      {notFound && (
        <p className="text-center text-body-sm text-primary-text mt-3 animate-fade-in">
          No encontramos ese libro. Intenta con otro título o el ISBN exacto.
        </p>
      )}
    </>
  )

  let title = 'Agregar libro'
  let body: ReactNode
  let footer: ReactNode

  if (isManual) {
    title = 'Crear libro'
    const isAudiobook = manualDraft.format === 'audiolibro'
    body = (
      <div key="manual" className="animate-fade-in">
        <div className="relative z-10 flex gap-3.5 items-end mb-5.5">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={isUploadingCover || !userId}
            aria-label={manualDraft.coverUrl ? 'Cambiar portada' : 'Agregar portada'}
            className={`relative w-22 shrink-0 aspect-2/3 rounded-xl overflow-hidden flex flex-col items-center justify-center gap-1 ${
              manualDraft.coverUrl
                ? 'bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]'
                : 'bg-surface-2 border-[1.5px] border-dashed border-border text-text-muted'
            } disabled:opacity-60`}
          >
            {manualDraft.coverUrl ? (
              <>
                <CoverImage src={manualDraft.coverUrl} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-surface/95 text-primary-text flex items-center justify-center shadow-sm">
                  <Camera size={14} strokeWidth={2.2} />
                </span>
              </>
            ) : (
              <>
                <Camera size={18} />
                <span className="text-body-sm font-semibold">{isUploadingCover ? 'Subiendo...' : 'Portada'}</span>
              </>
            )}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" onChange={handleManualCoverChange} className="hidden" />

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Input
              bare
              aria-label="Título"
              placeholder="Título"
              value={manualDraft.title}
              onChange={(e) => setManualDraft({ ...manualDraft, title: e.target.value })}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 font-display font-semibold text-[20px] leading-tight"
            />
            <Input
              bare
              aria-label="Autor"
              placeholder="Autor"
              value={manualDraft.author}
              onChange={(e) => setManualDraft({ ...manualDraft, author: e.target.value })}
              className="border-b-[1.5px] border-border focus:border-primary-text py-1 text-body-lg text-text-secondary"
            />
            <div className="mt-1">{statusControl}</div>
          </div>
        </div>

        <FormSection label="El libro">
          <FormatPicker value={manualDraft.format} onChange={(format) => setManualDraft({ ...manualDraft, format })} />
          <FormCard>
            {isAudiobook ? (
              <FormRow label="Duración" optional>
                <DurationMaskInput
                  bare
                  value={manualDraft.totalDuration}
                  onChange={(v) => setManualDraft({ ...manualDraft, totalDuration: v })}
                  className="text-right text-body-lg"
                />
              </FormRow>
            ) : (
              <FormRow label="Páginas" optional htmlFor="new-book-pages">
                <Input
                  bare
                  id="new-book-pages"
                  type="number"
                  inputMode="numeric"
                  placeholder="000"
                  value={manualDraft.totalPages}
                  onChange={(e) => setManualDraft({ ...manualDraft, totalPages: e.target.value })}
                  className="text-right text-body-lg"
                />
              </FormRow>
            )}
            <FormRow label="Idioma" optional>
              <Select
                bare
                placeholder="Sin idioma"
                options={[{ value: '', label: 'Sin idioma' }, ...languageOptionsFrom(bookLanguages)]}
                value={manualDraft.language}
                onChange={(e) => setManualDraft({ ...manualDraft, language: e.target.value })}
              />
            </FormRow>
            <FormRow label="Categoría">
              <Select bare options={categoryOptions} value={manualDraft.category} onChange={(e) => setManualDraft({ ...manualDraft, category: e.target.value })} />
            </FormRow>
            <FormRow label="ISBN" optional htmlFor="new-book-isbn">
              <Input
                bare
                id="new-book-isbn"
                inputMode="numeric"
                placeholder="978..."
                value={manualDraft.isbn}
                onChange={(e) => setManualDraft({ ...manualDraft, isbn: e.target.value })}
                className="text-right text-body-lg"
              />
            </FormRow>
          </FormCard>
        </FormSection>

        {readingSection}
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => setIsManual(false)}>Volver</Button>
        <Button variant="primary" onClick={handleManualCreate} isLoading={isSaving} disabled={!manualDraft.title.trim() || datesInvalid}>
          Crear libro
        </Button>
      </FormActions>
    )
  } else if (result) {
    const meta = [
      result.totalPages ? `${result.totalPages} págs.` : null,
      result.language ? languageLabel(result.language) : null,
    ].filter(Boolean).join(' · ')
    body = (
      <div key="confirm" className="animate-fade-in">
        <div className="relative z-10 flex gap-3.5 items-end mb-5.5">
          <div className="relative w-22 shrink-0 aspect-2/3 rounded-xl overflow-hidden bg-surface-2 shadow-[0_10px_24px_-12px_rgba(60,30,10,0.55)]">
            {result.coverUrl ? (
              <CoverImage src={result.coverUrl} alt={result.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff size={22} className="text-text-secondary" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-[20px] leading-tight text-text text-balance">{result.title}</h3>
            {result.author && <p className="text-body-md text-text-secondary mt-1">{result.author}</p>}
            {meta && <p className="text-body-sm text-text-muted mt-1">{meta}</p>}
            <div className="mt-2.5">{statusControl}</div>
          </div>
        </div>

        {result.isSeriesLevel && (
          <p className="text-body-sm text-text-secondary bg-surface-2 border border-border rounded-2xl px-3.5 py-2.5 mb-5">
            Este resultado es la serie completa, no un volumen, así que no trae páginas ni ISBN. Puedes completarlo después en Editar libro.
          </p>
        )}

        <FormSection label="El libro">
          <FormatPicker value={format} onChange={setFormat} />
          <FormCard>
            <FormRow label="Categoría">
              <Select bare options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
            </FormRow>
          </FormCard>
        </FormSection>

        {readingSection}
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={() => setResult(null)}>Volver</Button>
        <Button variant="primary" onClick={handleAdd} isLoading={isSaving} disabled={datesInvalid}>Agregar</Button>
      </FormActions>
    )
  } else if (showResultsList) {
    body = (
      <div key="results" className="animate-fade-in">
        {searchBar}
        {searchStatus}
        <p className="text-body-sm text-text-secondary mt-4 mb-2.5 px-0.5">
          {results.length === 1 ? 'Encontramos una coincidencia:' : 'Elige la más parecida:'}
        </p>
        <FormCard className="stagger-children">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => selectResult(r)}
              className="w-full flex gap-3 items-center px-3 py-2.5 text-left"
            >
              <div className="w-9.5 shrink-0 aspect-2/3 rounded-md overflow-hidden bg-surface">
                {r.coverUrl ? (
                  <CoverImage src={r.coverUrl} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageOff size={13} className="text-text-secondary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-body-lg text-text line-clamp-2 leading-snug">{r.title}</p>
                {r.author && <p className="text-body-md text-text-secondary line-clamp-1">{r.author}</p>}
              </div>
              <ChevronRight size={18} className="text-text-muted shrink-0" />
            </button>
          ))}
        </FormCard>
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={handleClose}>Cancelar</Button>
      </FormActions>
    )
  } else {
    body = (
      <div key="search" className="animate-fade-in">
        {searchBar}
        {searchStatus}
        <p className="text-center text-body-sm text-text-muted mt-3 mb-5">Busca el libro para traer su portada y sus datos.</p>
        <FormCard>
          {/* El escáner todavía no está disponible: queda visible como adelanto. */}
          <div className="flex items-center gap-3 px-3.5 py-3 opacity-70" aria-disabled="true">
            <span className="w-8.5 h-8.5 rounded-full bg-surface border border-border text-text-muted flex items-center justify-center shrink-0">
              <ScanBarcode size={16} />
            </span>
            <span className="min-w-0">
              <span className="block font-body font-semibold text-body-lg text-text-secondary">Escanear código de barras</span>
              <span className="block text-body-sm text-text-muted">Próximamente</span>
            </span>
          </div>
          <button type="button" onClick={() => setIsManual(true)} className="w-full flex items-center gap-3 px-3.5 py-3 text-left">
            <span className="w-8.5 h-8.5 rounded-full bg-primary-soft text-primary-text flex items-center justify-center shrink-0">
              <PenLine size={16} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-body font-semibold text-body-lg text-text">¿No lo encuentras?</span>
              <span className="block text-body-sm text-text-muted">Créalo desde cero</span>
            </span>
            <ChevronRight size={18} className="text-text-muted shrink-0" />
          </button>
        </FormCard>
      </div>
    )
    footer = (
      <FormActions>
        <Button variant="outline" onClick={handleClose}>Cancelar</Button>
      </FormActions>
    )
  }

  return (
    <>
      {isOpen && (
        <Sheet onClose={handleClose} title={title} footer={footer}>
          {body}
        </Sheet>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onDetected={handleIsbnDetected}
      />
    </>
  )
}
