import { useState } from 'react'
import { Check } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { FormActions, FormCard, FormRow, FormSection } from './FormLayout'
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

  const count = picked.size + (other.trim() ? 1 : 0)

  return (
    <Sheet
      onClose={onClose}
      title="Avisos de contenido"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleDone}>{count > 0 ? `Listo · ${count}` : 'Listo'}</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <p className="text-body-md text-text-secondary mb-3.5">Elige los que tenga el libro.</p>
        <div className="flex flex-wrap gap-2 mb-5.5">
          {CONTENT_WARNINGS.map((w) => {
            const isOn = picked.has(w.key)
            return (
              <button
                key={w.key}
                type="button"
                role="checkbox"
                aria-checked={isOn}
                onClick={() => toggle(w.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-3 py-1.5 font-body font-semibold text-body-md transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
                  isOn ? 'border-orange-text bg-orange-soft text-orange-text' : 'border-border bg-surface-2 text-text-secondary'
                }`}
              >
                {isOn && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                {w.label}
              </button>
            )
          })}
        </div>

        <FormSection label="Otro aviso" className="mb-1">
          <FormCard>
            <FormRow label="Otro" optional htmlFor="other-warning">
              <Input
                bare
                id="other-warning"
                placeholder="Escríbelo aquí"
                value={other}
                onChange={(e) => setOther(e.target.value.slice(0, NOTE_MAX))}
                className="text-right text-body-lg"
              />
            </FormRow>
          </FormCard>
        </FormSection>
      </div>
    </Sheet>
  )
}
