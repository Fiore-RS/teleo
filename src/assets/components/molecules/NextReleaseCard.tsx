import { useNavigate } from 'react-router-dom'
import { useReleases } from '../../../hooks/useReleases'
import { countdownLabel, daysUntil, formatReleaseDate, parseLocalDate } from '../../../lib/releases'
import { MONTH_ABBR } from '../../../lib/months'
import { Skeleton } from '../atoms/Skeleton'
import { Button } from '../atoms/Button'
import { Card, CardAction } from './Card'

interface NextReleaseCardProps {
  userId: string | undefined
}

const weekdayFormat = new Intl.DateTimeFormat('es', { weekday: 'long' })

/** Tarjeta de La mesa con el próximo lanzamiento (fase 7). Lleva a la pantalla Lanzamientos.
 *  V.3.5.0: la fecha exacta como una hoja de calendario de escritorio y, al lado, el título y
 *  cuánto falta ("doble claridad": la fecha y la cuenta atrás). */
export function NextReleaseCard({ userId }: NextReleaseCardProps) {
  const navigate = useNavigate()
  const { releases, isLoading } = useReleases(userId)
  const upcoming = releases.filter((r) => daysUntil(r.release_date) >= 0)
  const next = upcoming[0]
  const date = next ? parseLocalDate(next.release_date) : null
  const showYear = date ? date.getFullYear() !== new Date().getFullYear() : false

  return (
    <Card
      tab={{ label: 'Próximo lanzamiento' }}
      tone="magenta"
      action={
        next && (
          <CardAction onClick={() => navigate('/lanzamientos?vista=cuenta-atras')}>
            {upcoming.length > 1 ? 'Ver todos' : 'Ver'}
          </CardAction>
        )
      }
    >
      {isLoading ? (
        <div aria-label="Cargando">
          <Skeleton className="h-6 w-3/4 rounded-full" />
          <Skeleton className="h-4 w-1/2 mt-2.5 rounded-full" />
        </div>
      ) : next ? (
        <button
          type="button"
          onClick={() => navigate('/lanzamientos?vista=cuenta-atras')}
          className="w-full flex items-center gap-4 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          {date && (
            <span aria-hidden="true" className="w-[76px] shrink-0 rounded-[12px] overflow-hidden border border-border bg-surface-2 text-center shadow-[0_6px_14px_-10px_rgba(60,20,30,0.5)]">
              <span className="block bg-magenta text-on-magenta smallcaps text-[11px]! py-1">
                {MONTH_ABBR[date.getMonth()]}{showYear ? ` ${date.getFullYear()}` : ''}
              </span>
              <span className="block font-title text-[34px] leading-none text-text pt-2 pb-0.5 tabular-nums">{date.getDate()}</span>
              <span className="block text-[11px] font-semibold text-text-secondary pb-2">{weekdayFormat.format(date)}</span>
            </span>
          )}
          <span className="min-w-0">
            <span className="block font-display font-semibold text-[17px] text-text leading-snug line-clamp-2">{next.title}</span>
            {next.author && <span className="block text-body-sm text-text-secondary truncate mt-0.5">{next.author}</span>}
            <span className="block font-display italic text-body-md text-magenta-text mt-1.5">{countdownLabel(next.release_date)}</span>
            {/* La hoja de calendario es solo visual: la fecha completa para lectores de pantalla. */}
            <span className="sr-only">{formatReleaseDate(next.release_date)}</span>
          </span>
        </button>
      ) : (
        <>
          <p className="text-body-md text-text-secondary">
            Anota los libros que estás esperando y aquí verás cuánto falta para el siguiente.
          </p>
          <Button variant="soft" className="mt-3.5" onClick={() => navigate('/lanzamientos')}>
            Ver lanzamientos
          </Button>
        </>
      )}
    </Card>
  )
}
