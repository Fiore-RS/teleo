// Modos de organizar compartidos por Estante (libros y sagas) y Cuaderno (reseñas): además
// del orden manual de siempre ("libre", el que arrastra con drag-and-drop y persiste en la
// base de datos), se puede ver la lista ordenada por título, autor o fecha en que se agregó
// — estas tres son puramente de vista, no tocan ningún campo de orden guardado.
export type LibrarySortMode = 'titulo' | 'autor' | 'fecha' | 'libre'

interface SortGetters<T> {
  title: (item: T) => string
  author: (item: T) => string | null | undefined
  createdAt: (item: T) => string | null
}

/** 'libre' devuelve el mismo array (ya viene en su orden manual persistido, calculado por el
 *  hook de datos correspondiente) — los otros tres modos son un sort de solo lectura sobre lo
 *  que ya se cargó, sin pegarle a la base de datos. */
export function sortByMode<T>(items: T[], mode: LibrarySortMode, getters: SortGetters<T>): T[] {
  if (mode === 'libre') return items

  const sorted = [...items]

  if (mode === 'titulo') {
    sorted.sort((a, b) => getters.title(a).localeCompare(getters.title(b), 'es', { sensitivity: 'base' }))
  } else if (mode === 'autor') {
    sorted.sort((a, b) => {
      const authorA = getters.author(a) ?? ''
      const authorB = getters.author(b) ?? ''
      if (!authorA && authorB) return 1
      if (authorA && !authorB) return -1
      return authorA.localeCompare(authorB, 'es', { sensitivity: 'base' })
    })
  } else if (mode === 'fecha') {
    // Orden cronológico (más antiguo primero) — el orden en el que se fueron agregando.
    sorted.sort((a, b) => (getters.createdAt(a) ?? '').localeCompare(getters.createdAt(b) ?? ''))
  }

  return sorted
}

const SORT_MODE_STORAGE_PREFIX = 'teleo:sortMode:'

function isLibrarySortMode(value: string | null): value is LibrarySortMode {
  return value === 'titulo' || value === 'autor' || value === 'fecha' || value === 'libre'
}

/** El modo elegido en cada menú "Organizar" (Estante-libros, Estante-sagas, Cuaderno) se
 *  guarda en localStorage para que sobreviva a un refresh de la página — antes se reiniciaba
 *  siempre a "libre" porque el estado vivía solo en memoria de React. `key` identifica cada
 *  lista de forma independiente (ej. "estante-libros"). */
export function getStoredSortMode(key: string): LibrarySortMode {
  try {
    const stored = localStorage.getItem(SORT_MODE_STORAGE_PREFIX + key)
    if (isLibrarySortMode(stored)) return stored
  } catch {
    // localStorage no disponible (ej. modo privado) — se usa el valor por defecto.
  }
  return 'libre'
}

export function setStoredSortMode(key: string, mode: LibrarySortMode) {
  try {
    localStorage.setItem(SORT_MODE_STORAGE_PREFIX + key, mode)
  } catch {
    // Si no se puede guardar, la elección simplemente no persiste — no es crítico.
  }
}
