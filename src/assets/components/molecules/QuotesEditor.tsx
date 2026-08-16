import { useState, type KeyboardEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Input } from '../atoms/Input'

interface Quote { id: string; quote_text: string }

interface QuotesEditorProps {
  quotes: Quote[]
  onAdd: (text: string) => void
  onRemove: (id: string) => void
}

export function QuotesEditor({ quotes, onAdd, onRemove }: QuotesEditorProps) {
  const [value, setValue] = useState('')

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  return (
    <div>
      <Input
        icon={Plus} iconPosition="right" onIconClick={handleAdd}
        placeholder="Agregar cita..." value={value}
        onChange={(e) => setValue(e.target.value)} onKeyDown={handleKeyDown}
      />
      <div className="space-y-2 mt-3">
        {quotes.map((q) => (
          <div key={q.id} className="bg-bg rounded-xl p-3 flex items-start gap-2">
            <p className="flex-1 font-display italic text-body-md text-text">"{q.quote_text}"</p>
            <button onClick={() => onRemove(q.id)} aria-label="Eliminar cita" className="text-text-secondary shrink-0">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}