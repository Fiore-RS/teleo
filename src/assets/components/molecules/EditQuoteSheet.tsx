import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { BookMiniHeader } from './BookMiniHeader'
import { FormActions } from './FormLayout'
import { QuoteFields } from './QuoteFields'
import type { QuoteWithBook } from '../../../hooks/useQuotes'
import { parsePage } from '../../../lib/quotes'

interface EditQuoteSheetProps {
  quote: QuoteWithBook
  onClose: () => void
  onSave: (quote: QuoteWithBook, text: string, page: number | null) => Promise<boolean>
}

/** Editar el texto o la página de una cita desde Mis citas (V.2.1.1, rediseñada en la
 *  V.2.2.0). El libro no se cambia acá: la cita sigue colgando de la reseña de su libro. */
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
    <Sheet
      onClose={onClose}
      title="Editar cita"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!text.trim()}>Guardar cambios</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <BookMiniHeader book={quote.book} />
        <QuoteFields text={text} page={page} onTextChange={setText} onPageChange={setPage} idPrefix="edit-quote" />
        {error && <p className="text-body-sm text-primary-text text-center mt-3">{error}</p>}
      </div>
    </Sheet>
  )
}
