import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '../atoms/Input'
import { cleanPageInput, parsePage } from '../../../lib/quotes'

interface Quote { id: string; quote_text: string; page?: number | null }

interface QuotesEditorProps {
  quotes: Quote[]
  onAdd: (text: string, page: number | null) => void
  onRemove: (id: string) => void
}

/** Citas de una reseña. Cada cita puede llevar la página donde está (opcional, V.2.1.0). */
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
    <div>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Agregar cita..." value={value}
            onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
          />
        </div>
        <div className="w-20 shrink-0">
          <Input
            inputMode="numeric" placeholder="Pág." aria-label="Página (opcional)" value={page}
            onChange={(e) => setPage(cleanPageInput(e.target.value))} onKeyDown={handleKeyDown}
            className="text-center"
          />
        </div>
        <button
          type="button" onClick={handleAdd} aria-label="Agregar cita" disabled={!value.trim()}
          className="w-12 shrink-0 rounded-2xl bg-primary-soft text-primary-text flex items-center justify-center disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="space-y-2 mt-3">
        {quotes.map((q) => (
          <div key={q.id} className="bg-surface-2 border border-border rounded-2xl p-3 flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-display italic text-body-md text-text">"{q.quote_text}"</p>
              {q.page != null && <p className="text-body-sm text-text-secondary mt-1">Pág. {q.page}</p>}
            </div>
            <button onClick={() => onRemove(q.id)} aria-label="Eliminar cita" className="text-text-secondary shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
