import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

/** V.3.3.0: true en la cuenta de visitante (se comparte desde el portafolio y se reinicia cada
 *  noche). Ahí se esconden la cuenta, la zona de peligro, las invitaciones y la subida de
 *  imágenes, para que nadie la cambie de forma permanente ni llene Storage. */
export function useIsDemo() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  return !!profile?.is_demo
}
