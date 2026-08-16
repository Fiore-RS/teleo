import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAvatarUpload(userId: string | undefined) {
  const [isUploading, setIsUploading] = useState(false)

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!userId) return null
    setIsUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setIsUploading(false)
      return null
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // le agregamos un timestamp para evitar que el navegador use la imagen vieja en caché
    const urlWithCacheBust = `${data.publicUrl}?t=${Date.now()}`

    await supabase.from('profiles').update({ avatar_url: urlWithCacheBust }).eq('id', userId)

    setIsUploading(false)
    return urlWithCacheBust
  }

  return { uploadAvatar, isUploading }
}