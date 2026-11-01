import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { cleanPageInput, parsePage } from '../../../lib/quotes'

interface QuoteItem { id: string; quote_text: string; page?: number | null }

interface QuotesEditorProps {
  quotes: QuoteItem[]
  onAdd: (text: string, page: number | null) => void
  onRemove: (id: string) => void
}

/** Citas de una reseña (V.2.2.0): todas en una tarjeta, y el campo para agregar otra (con la
 *  página opcional) como última fila. */
export function QuotesEditor({ quotes, onAdd, onRemove }: QuotesEditorProps) {
  const [value, setValue] = useState('')
  const [page, setPage] = useState('')

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed, parsePage(page))
    setValue('')
    setPage('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  return (
    <div className="bg-surface-2 border border-border rounded-[18px] divide-y divide-border">
      {quotes.map((q) => (
        <div key={q.id} className="flex items-start gap-2.5 pl-3.5 pr-2 py-3 animate-fade-in">
          <span aria-hidden="true" className="font-display font-semibold text-[34px] leading-[0.8] text-primary-text shrink-0 -mt-0.5 w-4">“</span>
          <div className="flex-1 min-w-0">
            <p className="font-display italic text-body-md text-text">{q.quote_text}</p>
            {q.page != null && <p className="text-body-sm text-text-muted mt-0.5">Pág. {q.page}</p>}
          </div>
          <button
            type="button"
            onClick={() => onRemove(q.id)}
            aria-label="Eliminar cita"
            className="w-7 h-7 rounded-full text-text-muted flex items-center justify-center shrink-0"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 pl-3.5 pr-2 py-2">
        <input
          placeholder="Agregar una cita..."
          aria-label="Nueva cita"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent focus:outline-none py-1.5 font-body text-body-lg text-text placeholder:text-text-muted"
        />
        <input
          inputMode="numeric"
          placeholder="Pág."
          aria-label="Página (opcional)"
          value={page}
          onChange={(e) => setPage(cleanPageInput(e.target.value))}
          onKeyDown={handleKeyDown}
          className="w-12 shrink-0 bg-transparent border-l border-border focus:outline-none py-1.5 text-center font-body text-body-lg text-text placeholder:text-text-muted"
        />
        <button
          type="button"
          onClick={handleAdd}
          aria-label="Agregar cita"
          disabled={!value.trim()}
          className="w-8 h-8 shrink-0 rounded-button bg-primary-soft text-primary-text flex items-center justify-center disabled:opacity-50 transition-opacity focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          <Plus size={17} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  )
}
