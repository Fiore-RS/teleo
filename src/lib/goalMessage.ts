export function getGoalMessage(percent: number): string {
  if (percent >= 100) return '¡Meta cumplida! Felicidades, eres una máquina de leer.'
  if (percent >= 90) return '¡Estás a punto de terminar, eres increíble!'
  if (percent >= 70) return '¡Estás muy cerca, no te detengas!'
  if (percent >= 40) return '¡Vas por muy buen camino, sigue así!'
  if (percent >= 1) return '¡Vas bien, no te rindas!'
  return '¡Es hora de empezar el desafío!'
}