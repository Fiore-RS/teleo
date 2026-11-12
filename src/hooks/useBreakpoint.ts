import { useSyncExternalStore } from 'react'

/** Tamaños de pantalla de Teleo (V.4.0.0). Los mismos valores que --breakpoint-tableta y
 *  --breakpoint-escritorio en index.css (clases tableta: y escritorio: de Tailwind).
 *  - celular: como siempre, con la barra de pestañas abajo.
 *  - tableta: la tapa del cuaderno angosta a la izquierda.
 *  - escritorio: la tapa del cuaderno completa a la izquierda.
 *  Para lo que se puede resolver con CSS, mejor usar las clases; este hook es para lo que
 *  cambia en la lógica (por ejemplo, qué elemento lleva la marca del recorrido). */
export type Breakpoint = 'celular' | 'tableta' | 'escritorio'

const TABLETA = '(min-width: 44rem)'
const ESCRITORIO = '(min-width: 70rem)'

function read(): Breakpoint {
  if (window.matchMedia(ESCRITORIO).matches) return 'escritorio'
  if (window.matchMedia(TABLETA).matches) return 'tableta'
  return 'celular'
}

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(TABLETA), window.matchMedia(ESCRITORIO)]
  queries.forEach((q) => q.addEventListener('change', onChange))
  return () => queries.forEach((q) => q.removeEventListener('change', onChange))
}

export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, read, () => 'celular')
}
