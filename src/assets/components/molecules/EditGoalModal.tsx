import { useState } from 'react'
import { Sheet } from '../atoms/Sheet'
import { Input } from '../atoms/Input'
import { Button } from '../atoms/Button'
import { ProgressBar } from '../atoms/ProgressBar'
import { FormActions } from './FormLayout'

interface EditGoalModalProps {
  onClose: () => void
  currentGoal: number
  /** Libros ya leídos este año (reading_history), para la barra en vivo. */
  completedCount: number
  onSave: (goal: number) => Promise<void>
}

/** Qué implica la meta: cuántos faltan y más o menos cuántos por mes hasta fin de año. */
function goalHint(goal: number, read: number, today = new Date()): string {
  if (goal <= 0) return 'Déjala en 0 si no quieres una meta este año.'
  const left = goal - read
  if (left <= 0) return '¡Ya la cumpliste con lo que llevas!'
  const endOfYear = new Date(today.getFullYear(), 11, 31)
  const daysLeft = Math.max(1, Math.round((endOfYear.getTime() - today.getTime()) / 86_400_000) + 1)
  if (daysLeft <= 31) return `Te ${left === 1 ? 'falta 1' : `faltan ${left}`} para fin de año.`
  const perMonth = Math.ceil(left / (daysLeft / 30.44))
  return `Te ${left === 1 ? 'falta 1' : `faltan ${left}`}, unos ${perMonth} por mes hasta fin de año.`
}

/** Meta de lectura (V.2.2.0): hoja como las demás, con el número al centro y la barra que se
 *  mueve mientras se escribe. */
export function EditGoalModal({ onClose, currentGoal, completedCount, onSave }: EditGoalModalProps) {
  const [value, setValue] = useState(currentGoal ? String(currentGoal) : '')
  const [isSaving, setIsSaving] = useState(false)
  const year = new Date().getFullYear()

  const parsed = Number.parseInt(value, 10)
  const goal = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
  const percent = goal > 0 ? Math.min(100, (completedCount / goal) * 100) : 0
  const hasChanges = goal !== currentGoal

  async function handleSave() {
    if (!hasChanges) return
    setIsSaving(true)
    await onSave(goal)
    setIsSaving(false)
    onClose()
  }

  return (
    <Sheet
      onClose={onClose}
      title="Meta de lectura"
      footer={
        <FormActions>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave} disabled={!hasChanges} isLoading={isSaving}>Guardar</Button>
        </FormActions>
      }
    >
      <div className="animate-fade-in">
        <div className="bg-surface-2 border border-border rounded-[18px] px-4 pt-4.5 pb-4 text-center">
          <label htmlFor="goal-value" className="block text-body-md font-semibold text-text-secondary">
            ¿Cuántos libros quieres leer en {year}?
          </label>
          <div className="flex items-baseline justify-center gap-2 mt-1.5 mb-3">
            <Input
              bare
              id="goal-value"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-24! text-center font-display font-semibold text-[40px] leading-none tabular-nums border-b-2 border-border focus:border-primary-text"
            />
            <span className="text-body-lg text-text-muted">libros</span>
          </div>
          <div className="flex justify-between gap-2 text-body-sm text-text-secondary mb-1.5 tabular-nums">
            <span>Llevas {completedCount} de {goal || '?'}</span>
            <span className="font-bold text-primary-text">{Math.round(percent)} %</span>
          </div>
          <ProgressBar percent={percent} color="var(--color-pink)" className="bg-surface!" />
        </div>
        <p className="text-body-sm text-text-muted text-center mt-2.5 mb-1 px-1">{goalHint(goal, completedCount)}</p>
      </div>
    </Sheet>
  )
}
