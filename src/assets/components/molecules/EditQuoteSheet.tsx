import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
import { Button } from '../atoms/Button'
import type { QuoteWithBook } from '../../../hooks/useQuotes'
import { cleanPageInput, parsePage } from '../../../lib/quotes'

interface EditQuoteSheetProps {
  quote: QuoteWithBook
  onClose: () => void
  onSave: (quote: QuoteWithBook, text: string, page: number | null) => Promise<boolean>
}

/** Editar el texto o la página de una cita desde Mis citas (V.2.1.1). El libro no se cambia
 *  acá: la cita sigue colgando de la reseña de su libro. */
export function EditQuoteSheet({ quote, onClose, onSave }: EditQuoteSheetProps) {
  const [text, setText] = useState(quote.quote_text)
  const [page, setPage] = useState(quote.page != null ? String(quote.page) : '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!text.trim()) return
    setIsSaving(true)
    setError(null)
    const ok = await onSave(quote, text.trim(), parsePage(page))
    setIsSaving(false)
    if (ok) onClose()
    else setError('No se pudo guardar la cita. Intenta de nuevo.')
  }

  return (
    <Modal variant="sheet" isOpen onClose={onClose} title="Editar cita">
      <div className="flex flex-col gap-4">
        <p className="text-body-sm text-text-secondary line-clamp-1">
          De <span className="font-semibold text-text">{quote.book.title}</span>
        </p>

        <Textarea
          autoFocus
          placeholder="¿Qué frase te gustó?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="font-display italic"
        />

        <div className="flex items-center gap-3">
          <label htmlFor="edit-quote-page" className="text-body-md font-semibold text-text-secondary">Página</label>
          <div className="w-28">
            <Input
              id="edit-quote-page" inputMode="numeric" placeholder="Opcional" value={page}
              onChange={(e) => setPage(cleanPageInput(e.target.value))}
            />
          </div>
        </div>

        {error && <p className="text-body-sm text-primary-text text-center">{error}</p>}

        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!text.trim()}>Guardar cambios</Button>
        </div>
      </div>
    </Modal>
  )
}
