import { createContext, useContext } from 'react'

/** Modo hoja (V.4.2.0, Bitácora en tableta y computadora): dentro de este contexto, las
 *  tarjetas con pestaña (Card) se dibujan como las hojas del Cuaderno (título adentro y margen
 *  rosado) y las filas plegables (MoreRow) como hojas propias, ya abiertas. */
export const HojaModeContext = createContext(false)

export function useHojaMode(): boolean {
  return useContext(HojaModeContext)
}

/** true dentro de una Hoja: una fila plegable adentro no se vuelve otra hoja (se ve abierta,
 *  con su título). */
export const HojaNestContext = createContext(false)

export function useInsideHoja(): boolean {
  return useContext(HojaNestContext)
}
