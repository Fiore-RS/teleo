import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useCharacterPhotoUpload(userId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false)

  async function uploadCharacterPhoto(file: File): Promise<string | null> {
    if (!userId) return null
    setIsUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/character-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setIsUploading(false)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)

    setIsUploading(false)
    return data.publicUrl
  }

  return { uploadCharacterPhoto, isUploading }
}