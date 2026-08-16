import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { Avatar } from '../atoms/Avatar'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'
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
    <div className="bg-bg rounded-2xl p-4">
      <Avatar
        variant="character"
        size="lg"
        src={photoUrl || undefined}
        className="mx-auto"
        onClick={() => fileInputRef.current?.click()}
      />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      {isUploading && <p className="text-body-sm text-text-secondary text-center mt-2">Subiendo foto...</p>}

      <Input className="mt-3" placeholder="Nombre del personaje" value={name} onChange={(e) => onNameChange(e.target.value)} />
      <Textarea className="mt-2" placeholder="Tus pensamientos sobre el personaje..." value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} />
    </div>
  )
}