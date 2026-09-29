import { useState } from 'react'
import { Check } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { CONTENT_WARNINGS } from '../../../lib/contentWarnings'

const NOTE_MAX = 80

interface ContentWarningsPickerProps {
  selected: string[]
  note: string
  onClose: () => void
  onSave: (selected: string[], note: string) => void
}

/** Elegir los avisos de contenido de una reseña (V.2.1.1): varios de la lista fija y, si
 *  hace falta, uno escrito a mano. Los cambios se aplican al tocar Listo. */
export function ContentWarningsPicker({ selected, note, onClose, onSave }: ContentWarningsPickerProps) {
  const [picked, setPicked] = useState(() => new Set(selected))
  const [other, setOther] = useState(note)

  function toggle(key: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleDone() {
    onSave(CONTENT_WARNINGS.filter((w) => picked.has(w.key)).map((w) => w.key), other.trim())
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title="Avisos de contenido">
      <p className="text-body-sm text-text-secondary text-center -mt-1 mb-4">Elige los que tenga el libro.</p>

      <div className="grid grid-cols-2 gap-2">
        {CONTENT_WARNINGS.map((w) => {
          const isOn = picked.has(w.key)
          return (
            <button
              key={w.key}
              type="button"
              role="checkbox"
              aria-checked={isOn}
              onClick={() => toggle(w.key)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left text-body-sm font-semibold text-text transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
                isOn ? 'border-orange bg-orange-tint' : 'border-border bg-surface-2'
              }`}
            >
              <span
                className={`w-[18px] h-[18px] shrink-0 rounded-md border-2 flex items-center justify-center transition-colors ${
                  isOn ? 'bg-orange border-orange text-on-orange' : 'border-border'
                }`}
                aria-hidden="true"
              >
                {isOn && <Check size={12} strokeWidth={3.5} />}
              </span>
              {w.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        <Input
          placeholder="Otro aviso (opcional)"
          value={other}
          onChange={(e) => setOther(e.target.value.slice(0, NOTE_MAX))}
        />
      </div>

      <Button variant="primary" className="mt-4" onClick={handleDone}>Listo</Button>
    </Modal>
  )
}
