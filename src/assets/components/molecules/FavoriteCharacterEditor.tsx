import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Camera } from 'lucide-react'
import { Avatar } from '../atoms/Avatar'
import { useCharacterPhotoUpload } from '../../../hooks/useCharacterPhotoUpload'

interface FavoriteCharacterEditorProps {
  userId: string | undefined
  name: string
  notes: string
  photoUrl: string
  onNameChange: (v: string) => void
  onNotesChange: (v: string) => void
  onPhotoUrlChange: (v: string) => void
}

/** Personaje favorito en Editar reseña (V.2.2.0): foto a un lado (se toca para cambiarla),
 *  nombre y notas al otro, en una tarjeta compacta. */
export function FavoriteCharacterEditor({
  userId, name, notes, photoUrl, onNameChange, onNotesChange, onPhotoUrlChange,
}: FavoriteCharacterEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { uploadCharacterPhoto, isUploading } = useCharacterPhotoUpload(userId)

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadCharacterPhoto(file)
    if (url) onPhotoUrlChange(url)
    e.target.value = ''
  }

  return (
    <div className="bg-surface-2 border border-border rounded-[18px] flex gap-3.5 items-center px-3.5 py-3.5">
      <div className="relative shrink-0 mt-0.5">
        <Avatar
          variant="character"
          size="md"
          src={photoUrl || undefined}
          alt={name}
          onClick={() => fileInputRef.current?.click()}
          className={`ring-[1.5px] ring-border ${isUploading ? 'opacity-60' : ''}`}
        />
        {photoUrl && (
          <span className="absolute right-0 bottom-0 w-6.5 h-6.5 rounded-full bg-surface text-primary-text flex items-center justify-center shadow-sm pointer-events-none">
            <Camera size={13} strokeWidth={2.4} />
          </span>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
      <div className="flex-1 min-w-0">
        <input
          aria-label="Nombre del personaje"
          placeholder="Nombre del personaje"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-transparent border-b-[1.5px] border-border focus:border-primary-text focus:outline-none py-1 font-display italic font-semibold text-body-lg text-text placeholder:text-text-muted placeholder:not-italic placeholder:font-body placeholder:font-normal transition-colors"
        />
        <textarea
          aria-label="Notas sobre el personaje"
          placeholder="Qué te gustó de este personaje..."
          value={notes}
          rows={3}
          onChange={(e) => onNotesChange(e.target.value)}
          className="w-full mt-1.5 bg-transparent focus:outline-none resize-none font-body text-body-md leading-relaxed text-text-secondary placeholder:text-text-muted"
        />
        {isUploading && <p className="text-body-sm text-text-secondary animate-fade-in">Subiendo foto...</p>}
      </div>
    </div>
  )
}
