import type { UiMarks } from './uiMarks'

/** Celebración de la meta anual cumplida (V.3.6.0): la postal con la estampilla se muestra una
 *  sola vez por año. Quien ya había cumplido la meta antes de la 3.6.0 también la ve una vez
 *  (decidido por Fiorella, 4 nov 2026). Desde la V.3.7.2 se recuerda en la cuenta
 *  (ui_marks.metaCelebrada), así no vuelve a salir en otro dispositivo ni tras la mudanza. */
export function wasGoalCelebrated(marks: UiMarks, year: number): boolean {
  return !!marks.metaCelebrada?.[String(year)]
}

export function goalCelebratedPatch(year: number): UiMarks {
  return { metaCelebrada: { [String(year)]: new Date().toISOString() } }
}
