import { createContext, useContext } from 'react'

export interface TourContextValue {
  isActive: boolean
  /** Empieza el recorrido desde el primer paso (Bienvenida, "Repetir el recorrido"). */
  start: () => void
}

/** Vive aparte de TourProvider para que TourContext.tsx solo exporte componentes (recarga
 *  rápida de Vite), igual que themeContextValue.ts. */
export const TourContext = createContext<TourContextValue>({ isActive: false, start: () => {} })

export function useTour() {
  return useContext(TourContext)
}
