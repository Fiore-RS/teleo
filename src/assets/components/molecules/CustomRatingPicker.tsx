import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import type { RatingShape } from '../atoms/RatingIcon'
import { RatingRow } from './RatingRow'
import { FormActions, FormCard, FormRow, FormSection } from './FormLayout'
import { ratingIconColor } from '../../../lib/ratingIcons'
import {
  Star, Candy, Crown, Gem, Sparkle,
  Droplet, Skull, Ghost, Snail, Leaf,
  Flame, Heart, Swords, Drama, Wine,
  type LucideIcon,
} from 'lucide-react'

const icons: { key: string; Icon: LucideIcon }[] = [
  { key: 'star', Icon: Star }, { key: 'candy', Icon: Candy }, { key: 'crown', Icon: Crown },
  { key: 'gem', Icon: Gem }, { key: 'sparkle', Icon: Sparkle },
  { key: 'droplet', Icon: Droplet }, { key: 'skull', Icon: Skull }, { key: 'ghost', Icon: Ghost },
  { key: 'snail', Icon: Snail }, { key: 'leaf', Icon: Leaf },
  { key: 'flame', Icon: Flame }, { key: 'heart', Icon: Heart }, { key: 'swords', Icon: Swords },
  { key: 'drama', Icon: Drama }, { key: 'wine', Icon: Wine },
]

interface CustomRatingPickerProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (rating: { label: string; icon: string }) => void
}

export function CustomRatingPicker({ isOpen, onClose, onAdd }: CustomRatingPickerProps) {
  const [title, setTitle] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)

  function handleClose() {
    setTitle('')
    setSelectedIcon(null)
    onClose()
  }

  function handleAdd() {
    if (!title.trim() || !selectedIcon) return
    onAdd({ label: title.trim(), icon: selectedIcon })
    handleClose()
  }

  if (!isOpen) return null

  const previewShape = (selectedIcon ?? 'star') as RatingShape

  return (
    <Sheet
      onClose={handleClose}
      title="Calificación personalizada"
      footer={
        <FormActions>
          <Button variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleAdd} disabled={!title.trim() || !selectedIcon}>Agregar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        {/* Vista previa en vivo de cómo se verá la fila en la reseña. */}
        <div className="flex items-center justify-between gap-3 bg-surface-2 border border-border rounded-[18px] px-3.5 py-3 mb-5" aria-hidden="true">
          <span className={`font-body font-semibold text-body-lg truncate ${title.trim() ? 'text-text' : 'text-text-muted'}`}>
            {title.trim() || 'Tu calificación'}
          </span>
          <span className={selectedIcon ? '' : 'opacity-40'}>
            <RatingRow shape={previewShape} color={ratingIconColor[previewShape]} value={4} size={20} />
          </span>
        </div>

        <FormCard className="mb-5.5">
          <FormRow label="Nombre" htmlFor="custom-rating-name">
            <Input
              bare
              id="custom-rating-name"
              autoFocus
              placeholder="Personajes, lágrimas..."
              maxLength={24}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-right text-body-lg"
            />
          </FormRow>
        </FormCard>

        <FormSection label="Ícono" className="mb-1">
          <div className="grid grid-cols-5 gap-1.5 p-2.5 bg-surface-2 border border-border rounded-[18px]">
            {icons.map(({ key, Icon }) => {
              const isOn = selectedIcon === key
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedIcon(key)}
                  aria-label={key}
                  aria-pressed={isOn}
                  className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
                    isOn ? 'border-primary-text bg-primary-soft' : 'border-transparent bg-surface'
                  }`}
                >
                  <Icon size={22} color={ratingIconColor[key as keyof typeof ratingIconColor]} strokeWidth={1.75} />
                </button>
              )
            })}
          </div>
        </FormSection>
      </div>
    </Sheet>
  )
}
