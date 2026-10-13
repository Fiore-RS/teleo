import { useEffect, useState } from 'react'

/* Sistema de movimiento (V.3.0.1). Las duraciones y curvas viven como tokens en index.css
 * (--motion-fast / --motion-base / --motion-slow, --ease-enter / --ease-exit). Regla: animar
 * solo lo que comunica algo (algo que se abre, algo que cambia, un logro), no cada visita. */

/** true si la persona pidió "reducir movimiento" en su sistema. Se usa para saltarse la
 *  espera de las animaciones de salida (hojas y diálogos se cierran al instante). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Duración de las animaciones de salida (ms). Debe coincidir con --motion-base en index.css
 *  (.animate-sheet-out / .animate-fade-out / .animate-pop-out). */
export const EXIT_DURATION_MS = 200

/** Pantallas (o partes de pantalla) que ya mostraron su cascada en esta sesión. Vive en
 *  memoria: al cerrar y volver a abrir la app, la primera visita vuelve a tener cascada. */
const staggeredOnce = new Set<string>()

/** Clase de la aparición escalonada, solo la primera vez que se muestra `id` en la sesión.
 *  Al volver a una pestaña (con los datos ya en caché) todo aparece de una, sin cascada.
 *  Se decide al montar: si los datos llegan un momento después, igual entran escalonados. */
export function useStaggerOnce(id: string): string {
  const [isFirst] = useState(() => !staggeredOnce.has(id))
  useEffect(() => {
    staggeredOnce.add(id)
  }, [id])
  return isFirst ? 'stagger-children' : ''
}

/** Profundidad de cada pantalla secundaria y de dónde cuelga. Las pestañas y todo lo demás
 *  están en el nivel 0. Las rutas de hojas de Configuración (/configuracion/usuario, etc.)
 *  están en el mismo nivel que Configuración: abren una hoja, no una pantalla nueva. */
const SUBPAGES: Record<string, { level: number; parent: string }> = {
  '/configuracion': { level: 1, parent: '/perfil' },
  '/configuracion/usuario': { level: 1, parent: '/perfil' },
  '/configuracion/correo': { level: 1, parent: '/perfil' },
  '/configuracion/contrasena': { level: 1, parent: '/perfil' },
  '/configuracion/nickname': { level: 1, parent: '/perfil' },
  '/lanzamientos': { level: 1, parent: '/mesa' },
  '/configuracion/novedades': { level: 2, parent: '/configuracion' },
  '/configuracion/detras-de-teleo': { level: 2, parent: '/configuracion' },
  '/tutorial': { level: 2, parent: '/configuracion' },
  '/privacidad': { level: 2, parent: '/configuracion' },
  '/terminos': { level: 2, parent: '/configuracion' },
}

function levelOf(path: string) {
  return SUBPAGES[path]?.level ?? 0
}

/** ¿`ancestor` está "más afuera" que `path` en el camino de pantallas secundarias? */
function isAncestor(ancestor: string, path: string) {
  let current = SUBPAGES[path]?.parent
  while (current) {
    if (current === ancestor) return true
    current = SUBPAGES[current]?.parent
  }
  return false
}

/** Animación al cambiar de pantalla. Entrar "más adentro" (Perfil › Configuración ›
 *  Novedades) llega desde la derecha; volver a la pantalla de la que se vino llega desde la
 *  izquierda. Cambiar de pestaña o ir a cualquier otro lado: sin animación. */
export function routeTransition(from: string, to: string): '' | 'animate-subpage-in' | 'animate-subpage-back' {
  if (from === to) return ''
  const fromLevel = levelOf(from)
  const toLevel = levelOf(to)
  if (toLevel > fromLevel) return 'animate-subpage-in'
  if (toLevel < fromLevel && isAncestor(to, from)) return 'animate-subpage-back'
  return ''
}
