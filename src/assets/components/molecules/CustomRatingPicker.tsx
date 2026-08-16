import { useState } from 'react'
import { Modal } from '../atoms/Modal'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Calificación personalizada">
      <label className="text-body-sm text-text-secondary block mb-1">Título</label>
      <Input placeholder="Título de la calificación" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="text-body-sm text-text-secondary block mb-1 mt-4">Icono</label>
      <div className="grid grid-cols-5 gap-2">
        {icons.map(({ key, Icon }) => (
          <button
            key={key}
            onClick={() => setSelectedIcon(key)}
            className={`aspect-square rounded-xl flex items-center justify-center border-2 bg-bg ${
              selectedIcon === key ? 'border-accent-wishlist' : 'border-transparent'
            }`}
          >
            <Icon size={22} color={ratingIconColor[key as keyof typeof ratingIconColor]} strokeWidth={1.75} />
          </button>
        ))}
      </div>

      <Button variant="primary" className="mt-5" onClick={handleAdd} disabled={!title.trim() || !selectedIcon}>
        Agregar calificación personalizada
      </Button>
    </Modal>
  )
}