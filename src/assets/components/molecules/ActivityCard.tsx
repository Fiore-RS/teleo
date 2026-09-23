import { CalendarDays } from 'lucide-react'
import { useReadingStreak } from '../../../hooks/useReadingStreak'
import { Eyebrow } from '../atoms/Eyebrow'
import { MonthCalendar } from '../atoms/MonthCalendar'
import { Skeleton } from '../atoms/Skeleton'
import { Card } from './Card'

interface ActivityCardProps {
  userId: string | undefined
  onOpenCalendar: () => void
}

/** "Actividad" de Tu rincón (fase 4): el mes actual en chico con los días leídos marcados.
 *  Al tocarlo se abre el calendario de lectura completo (la misma hoja que la racha de Mesa). */
export function ActivityCard({ userId, onOpenCalendar }: ActivityCardProps) {
  const { markedDates, streak, isLoading } = useReadingStreak(userId)
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`
  const daysRead = [...markedDates].filter((d) => d.startsWith(monthPrefix)).length

  return (
    <Card labelledBy="perfil-actividad">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <Eyebrow id="perfil-actividad" icon={CalendarDays} tone="orange">Actividad</Eyebrow>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="shrink-0 text-body-sm font-bold text-orange-text rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          Calendario
        </button>
      </div>

      {isLoading ? (
        <div aria-label="Cargando">
          <Skeleton className="h-4 w-1/2 rounded-full mb-3" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpenCalendar}
          aria-label="Ver calendario de lectura"
          className="block w-full text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
        >
          <span className="block text-body-md text-text-secondary mb-3">
            {daysRead === 1 ? '1 día leído este mes' : `${daysRead} días leídos este mes`}
            {streak > 0 && ` · racha de ${streak} ${streak === 1 ? 'día' : 'días'}`}
          </span>
          <MonthCalendar year={year} month={month} markedDates={markedDates} />
        </button>
      )}
    </Card>
  )
}
