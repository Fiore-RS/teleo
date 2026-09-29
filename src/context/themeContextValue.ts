import { createContext } from 'react'
import type { PaletteId } from '../lib/palettes'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeContextType {
  /** Modo: claro, oscuro o el del teléfono. */
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  /** Tema de color (Atardecer, Océano...). Va aparte del modo: todos tienen claro y oscuro. */
  palette: PaletteId
  setPalette: (palette: PaletteId) => void
}

/** El contexto vive aparte de `ThemeProvider` para que ThemeContext.tsx solo exporte
 *  componentes (recarga rápida de Vite). */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined)
