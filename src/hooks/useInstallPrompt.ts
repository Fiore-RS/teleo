import { useSyncExternalStore } from 'react'
import { getInstallState, promptInstall, subscribeInstallState } from '../lib/installPrompt'

/** Estado de instalación de la PWA (ver lib/installPrompt.ts) listo para usar en React. */
export function useInstallPrompt() {
  const state = useSyncExternalStore(subscribeInstallState, getInstallState, getInstallState)
  return { ...state, promptInstall }
}
