/** Instalación de Teleo como app (PWA) — la usa la pantalla /instalar.
 *
 *  El navegador dispara `beforeinstallprompt` una sola vez, cuando decide que la página se
 *  puede instalar, y muchas veces eso pasa antes de que la persona llegue a /instalar. Por
 *  eso este módulo se importa desde main.tsx: empieza a escuchar apenas carga la app y
 *  guarda el evento para usarlo cuando se toque "Instalar Teleo".
 *
 *  Solo Chrome, Edge, Samsung Internet y otros navegadores basados en Chromium disparan ese
 *  evento. Safari (iPhone/iPad) y Firefox nunca lo hacen: ahí la pantalla muestra los pasos
 *  a mano. */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface InstallState {
  /** Hay un aviso nativo de instalación listo para mostrarse. */
  canPrompt: boolean
  /** Se instaló durante esta visita (evento `appinstalled`). */
  justInstalled: boolean
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
// Objeto nuevo en cada cambio (nunca se muta) para que useSyncExternalStore detecte el cambio.
let state: InstallState = { canPrompt: false, justInstalled: false }
const listeners = new Set<() => void>()

function setState(next: Partial<InstallState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // En el resto de la app se deja que el navegador muestre su propio aviso (la mini barra
    // de Chrome) como siempre. Solo en /instalar se frena, porque ahí el aviso sale con el
    // botón de la pantalla.
    if (window.location.hash.startsWith('#/instalar')) event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    setState({ canPrompt: true })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    setState({ canPrompt: false, justInstalled: true })
  })
}

export function subscribeInstallState(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getInstallState(): InstallState {
  return state
}

/** Muestra el aviso nativo de Instalar/Cancelar. Devuelve 'unavailable' si el navegador ya
 *  no lo permite (se usó antes o expiró), para que la pantalla caiga a los pasos a mano. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferredPrompt
  if (!event) return 'unavailable'
  try {
    await event.prompt()
    const { outcome } = await event.userChoice
    // Un mismo evento solo se puede usar una vez; si lo cancelan, el navegador manda uno
    // nuevo más adelante y se vuelve a guardar arriba.
    deferredPrompt = null
    setState({ canPrompt: false })
    return outcome
  } catch {
    deferredPrompt = null
    setState({ canPrompt: false })
    return 'unavailable'
  }
}

export type InstallPlatform = 'ios' | 'android' | 'desktop'

export function detectPlatform(): InstallPlatform {
  const ua = navigator.userAgent
  // iPadOS se presenta como Mac de escritorio; se distingue porque tiene pantalla táctil.
  const isIPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/.test(ua) || isIPadOS) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

/** Nombre de la app si el enlace se abrió dentro de su navegador interno (Instagram,
 *  Facebook, TikTok…), donde no se puede instalar nada. null si es un navegador normal.
 *  Ojo: los navegadores internos que se hacen pasar por Safari o Chrome (por ejemplo el de
 *  WhatsApp en iPhone) no se pueden detectar; para eso los pasos de iPhone traen una nota. */
export function detectInAppBrowser(): string | null {
  const ua = navigator.userAgent
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return 'Facebook'
  if (/WhatsApp/i.test(ua)) return 'WhatsApp'
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok'
  if (/Snapchat/i.test(ua)) return 'Snapchat'
  if (/\bLine\//i.test(ua)) return 'LINE'
  if (/Twitter/i.test(ua)) return 'X'
  if (/Android/i.test(ua) && /; wv\)/.test(ua)) return 'esta app'
  return null
}

/** true cuando Teleo ya está abierta como app instalada (no en una pestaña del navegador). */
export function isRunningStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches
}
