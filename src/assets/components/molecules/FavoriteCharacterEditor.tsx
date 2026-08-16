import { Avatar } from '../atoms/Avatar'
import { Input } from '../atoms/Input'
import { Textarea } from '../atoms/Textarea'

interface FavoriteCharacterEditorProps {
  name: string
  notes: string
  photoUrl: string
  onNameChange: (v: string) => void
  onNotesChange: (v: string) => void
  onPhotoUrlChange: (v: string) => void
}

export function FavoriteCharacterEditor({
  name, notes, photoUrl, onNameChange, onNotesChange, onPhotoUrlChange,
}: FavoriteCharacterEditorProps) {
  return (
    <div className="bg-bg rounded-2xl p-4">
      <Avatar variant="character" size="lg" src={photoUrl || undefined} className="mx-auto" />
      <Input className="mt-3" placeholder="Nombre del personaje" value={name} onChange={(e) => onNameChange(e.target.value)} />
      <Textarea className="mt-2" placeholder="Tus pensamientos sobre el personaje..." value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} />
      <Input className="mt-2" placeholder="URL de la foto (opcional, por ahora)" value={photoUrl} onChange={(e) => onPhotoUrlChange(e.target.value)} />
    </div>
  )
}