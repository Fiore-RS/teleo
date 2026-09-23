/** true si la persona pidió "reducir movimiento" en su sistema. Se usa para saltarse la
 *  espera de las animaciones de salida (hojas y diálogos se cierran al instante). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Duración de las animaciones de salida (ms). Debe coincidir con .animate-sheet-out /
 *  .animate-fade-out / .animate-pop-out en index.css. */
export const EXIT_DURATION_MS = 220
