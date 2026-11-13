import { Check, Flame } from 'lucide-react'
import { Skeleton } from '../../assets/components/atoms/Skeleton'
import { ProgressBar } from '../../assets/components/atoms/ProgressBar'
import { Button } from '../../assets/components/atoms/Button'
import { Card, CardAction } from '../../assets/components/molecules/Card'
import { GoalStamp, Postmark } from '../../assets/components/molecules/GoalPostcard'
import { getGoalMessage } from '../../lib/goalMessage'
import { MONTH_NAMES } from '../../lib/months'

const dayLetters = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface WeekDay {
  date: string
  read: boolean
  isToday: boolean
  isFuture: boolean
}

interface StreakCardProps {
  streak: number
  markedToday: boolean
  weekDays: WeekDay[]
  isLoading: boolean
  onCalendar: () => void
  onMark: () => void
  onUnmark: () => void
}

/** Tarjeta de la racha diaria de La mesa. Es la misma en el celular y en pantallas grandes
 *  (V.4.0.0: "para que se note que es la misma app"). */
export function StreakCard({ streak, markedToday, weekDays, isLoading, onCalendar, onMark, onUnmark }: StreakCardProps) {
  return (
    <Card
      tab={{ label: 'Racha diaria de lectura' }}
      tone="orange"
      action={<CardAction onClick={onCalendar}>Calendario</CardAction>}
    >
      <div className="flex items-center gap-4">
        <div className="relative w-[74px] h-[74px] shrink-0 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[1.5px] border-dashed border-ornament" />
          <span className="w-[50px] h-[50px] rounded-full bg-orange-soft text-orange flex items-center justify-center">
            <Flame size={24} fill="currentColor" />
          </span>
        </div>
        {isLoading ? (
          <div className="flex-1">
            <Skeleton className="h-7 w-2/3 rounded-full" />
            <Skeleton className="h-3.5 w-11/12 mt-2.5 rounded-full" />
          </div>
        ) : (
          <div>
            <p className="font-display font-semibold text-[28px] leading-none text-text">
              <span key={streak} className="inline-block animate-fade-in">{streak}</span>{' '}
              <span className="font-body font-medium text-body-md text-text-secondary">días seguidos</span>
            </p>
            <p className="text-body-md text-text-secondary mt-1">
              {markedToday ? 'Sesión de hoy marcada.' : 'Todavía no marcas la sesión de hoy.'}
            </p>
          </div>
        )}
      </div>

      {weekDays.length > 0 && (
        <ol className={`grid grid-cols-7 gap-1.5 my-4 ${isLoading ? 'animate-skeleton' : ''}`} aria-label="Esta semana">
          {weekDays.map((d, i) => (
            <li
              key={d.date}
              className={`flex flex-col items-center gap-1 text-[11px] font-semibold ${
                d.isToday ? 'text-primary-text' : 'text-text-muted'
              } ${d.isFuture ? 'opacity-50' : ''}`}
            >
              <span
                className={`w-[30px] h-[30px] rounded-[8px] border-[1.5px] flex items-center justify-center ${
                  d.read
                    ? 'bg-orange border-orange text-on-orange'
                    : d.isToday
                      ? 'border-dashed border-primary-text bg-surface-2'
                      : 'border-border bg-surface-2'
                }`}
              >
                {d.read && <Check size={12} strokeWidth={3.5} />}
              </span>
              {dayLetters[i]}
            </li>
          ))}
        </ol>
      )}

      <Button
        variant={markedToday ? 'outlineOrange' : 'orange'}
        className={weekDays.length > 0 ? '' : 'mt-4'}
        onClick={() => (markedToday ? onUnmark() : onMark())}
      >
        {markedToday && <Check size={18} strokeWidth={2.5} />}
        {markedToday ? 'Sesión de hoy marcada' : 'Marcar sesión de hoy'}
      </Button>
    </Card>
  )
}

interface GoalCardProps {
  goal: number
  completedCount: number
  isLoading: boolean
  onEdit: () => void
  /** Pantallas grandes (V.4.0.0): con la meta cumplida, la estampilla queda fija en la tarjeta.
   *  En el celular no hay espacio; ahí la estampilla sale solo en la postal. */
  showStamp?: boolean
  /** Día en que se cumplió la meta: va en el matasellos sobre la estampilla y en una línea
   *  debajo de la frase, como en Bitácora › Resumen › Año. */
  reachedOn?: Date | null
}

/** Tarjeta de la meta anual de La mesa (misma en el celular y en pantallas grandes). */
export function GoalCard({ goal, completedCount, isLoading, onEdit, showStamp = false, reachedOn = null }: GoalCardProps) {
  const goalPercent = goal > 0 ? Math.min(100, (completedCount / goal) * 100) : 0
  const stamped = showStamp && goal > 0 && completedCount >= goal

  return (
    <Card tab={{ label: 'Meta anual de lectura' }} tone="pink" action={<CardAction onClick={onEdit}>Editar</CardAction>}>
      {isLoading ? (
        <div aria-label="Cargando">
          <Skeleton className="h-10 w-3/5 rounded-full" />
          <Skeleton className="h-3.5 w-full mt-4 rounded-[6px]" />
          <Skeleton className="h-4 w-1/2 mt-3.5 rounded-full" />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0">
            {/* V.3.5.0: la cifra grande, la frase en cursiva y "Editar" en la pestaña. */}
            <div className="flex items-end justify-between gap-3">
              <p className="font-title text-[40px] leading-none text-text">
                <span key={completedCount} className="inline-block animate-fade-in tabular-nums">{completedCount}</span>{' '}
                <span className="font-body font-medium text-body-md text-text-secondary">
                  de {goal} libros del {new Date().getFullYear()}
                </span>
              </p>
              {!stamped && (
                <span className="font-display font-semibold text-[20px] text-pink-text tabular-nums">
                  {Math.round(goalPercent)}%
                </span>
              )}
            </div>
            <ProgressBar percent={goalPercent} color="var(--color-pink)" shape="firme" className="mt-3.5 h-3.5" />
            <p className="font-display italic text-body-lg text-text-secondary mt-3">{getGoalMessage(goalPercent)}</p>
            {stamped && reachedOn && (
              <p className="text-body-sm font-bold text-primary-text mt-2">
                Cumplida el {reachedOn.getDate()} de {MONTH_NAMES[reachedOn.getMonth()].toLowerCase()}
              </p>
            )}
          </div>
          {stamped && (
            // La estampilla quieta, con el matasellos del día en que se cumplió (si ya se sabe).
            <span className="postcard-static relative shrink-0 w-[96px] h-[120px] mr-1">
              <GoalStamp goal={goal} />
              {reachedOn && <Postmark date={reachedOn} className="absolute -left-8 -bottom-4 w-[112px] h-[60px]" />}
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
