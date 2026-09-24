import { useNavigate } from 'react-router-dom'

/** Botón de regresar: vuelve a la pantalla anterior del historial (así esa pantalla recupera
 *  la altura donde estaba, ver App.tsx). Si no hay pantalla anterior dentro de Teleo (por
 *  ejemplo, se abrió un enlace directo), va a `fallback`. */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }
}
