import { useEffect, useState } from 'react'
import { getStoredSortMode, isLibrarySortMode, setStoredSortMode, type LibrarySortMode } from '../lib/librarySort'
import { useUiMarks } from './useUiMarks'

/** Modo de organizar de una lista (Estante libros y sagas, Cuaderno reseñas y citas).
 *  Desde la V.3.7.2 se guarda en la cuenta, así es el mismo en el celular y en la computadora.
 *  El dispositivo guarda una copia para arrancar con el modo correcto antes de que llegue el
 *  perfil, sin que la lista salte de un orden a otro. */
export function useSortMode(key: string, fallback: LibrarySortMode = 'libre') {
  const { marks, patchMarks } = useUiMarks()
  const saved = marks.sortModes?.[key]
  const [mode, setModeState] = useState<LibrarySortMode>(() =>
    isLibrarySortMode(saved ?? null) ? (saved as LibrarySortMode) : getStoredSortMode(key, fallback)
  )

  // Si en la cuenta aparece otro modo (porque el perfil llegó después, o se eligió en otro
  // dispositivo), se usa ese. Se compara con el valor anterior durante el render, como en el
  // resto de Teleo.
  const [prevSaved, setPrevSaved] = useState(saved)
  if (saved !== prevSaved) {
    setPrevSaved(saved)
    if (isLibrarySortMode(saved ?? null) && saved !== mode) setModeState(saved as LibrarySortMode)
  }

  useEffect(() => {
    setStoredSortMode(key, mode)
  }, [key, mode])

  function setMode(next: LibrarySortMode) {
    setModeState(next)
    void patchMarks({ sortModes: { [key]: next } })
  }

  return [mode, setMode] as const
}
