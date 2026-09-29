import { useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_PALETTE, isPaletteId, type PaletteId } from '../lib/palettes'
import { ThemeContext, type ResolvedTheme, type Theme } from './themeContextValue'

const STORAGE_KEY = 'teleo-theme'
const PALETTE_KEY = 'teleo-palette'
/** Marca del cambio único a "Sistema" de la V.2.1.0 (ver getInitialTheme). */
const MODE_RESET_KEY = 'teleo-mode-reset-2.1'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento (modo privado): la elección dura mientras la app siga abierta.
  }
}

/** Con la V.2.1.0 todas las cuentas pasan una sola vez a "Sistema", aunque ya tuvieran Claro u
 *  Oscuro elegido (el anuncio de la versión lo explica). Después se respeta lo que cada quien
 *  elija: la marca MODE_RESET_KEY evita que el cambio se repita. */
function getInitialTheme(): Theme {
  if (read(MODE_RESET_KEY) !== 'hecho') {
    write(MODE_RESET_KEY, 'hecho')
    write(STORAGE_KEY, 'system')
    return 'system'
  }
  const stored = read(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  return 'system'
}

function getInitialPalette(): PaletteId {
  const stored = read(PALETTE_KEY)
  return isPaletteId(stored) ? stored : DEFAULT_PALETTE
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  // El modo del teléfono se escucha siempre; el modo que se ve sale de ahí solo si se eligió
  // "Sistema". Así no hace falta copiar el modo a otro estado dentro de un efecto.
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme)
  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme
  const [palette, setPaletteState] = useState<PaletteId>(getInitialPalette)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    function handleChange(e: MediaQueryListEvent) {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolvedTheme === 'dark')
  }, [resolvedTheme])

  // Los colores de cada tema están en index.css bajo [data-palette="..."].
  useEffect(() => {
    const root = document.documentElement
    root.dataset.palette = palette
    // La barra de estado del teléfono (app instalada) toma el color de marca del tema.
    const meta = document.querySelector('meta[name="theme-color"]')
    const primary = getComputedStyle(root).getPropertyValue('--teleo-primary').trim()
    if (meta && primary) meta.setAttribute('content', primary)
  }, [palette, resolvedTheme])

  function setTheme(newTheme: Theme) {
    write(STORAGE_KEY, newTheme)
    setThemeState(newTheme)
  }

  function setPalette(newPalette: PaletteId) {
    write(PALETTE_KEY, newPalette)
    setPaletteState(newPalette)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  )
}
