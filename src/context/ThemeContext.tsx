import { useEffect, useState, type ReactNode } from 'react'
import { DEFAULT_PALETTE, isPaletteId, type PaletteId } from '../lib/palettes'
import { ThemeContext, type ResolvedTheme, type Theme } from './themeContextValue'

const STORAGE_KEY = 'teleo-theme'
const PALETTE_KEY = 'teleo-palette'

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

/** El modo se guarda en la cuenta desde la V.3.7.2 (profiles.theme_mode, ver PreferencesSync);
 *  el dispositivo guarda una copia para abrir Teleo con el modo correcto sin destello.
 *  Se quitó la marca del cambio único a "Sistema" de la V.2.1.0 ('teleo-mode-reset-2.1'): en
 *  la dirección nueva (V.4.0.0) se habría vuelto a disparar. */
function getInitialTheme(): Theme {
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
    // La barra de arriba (y la del navegador) toma el color de fondo del tema y el modo, para
    // que se funda con la app. La etiqueta se crea acá: index.html ya no trae un color fijo.
    // La barra de abajo de la app instalada en Android sale del manifest, que no declara color
    // para que Chrome siga el modo del teléfono (ver vite.config.ts).
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    const bg = getComputedStyle(root).getPropertyValue('--teleo-bg').trim()
    if (bg) meta.setAttribute('content', bg)
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
