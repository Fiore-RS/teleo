import { useNavigate } from 'react-router-dom'
import { CalendarClock, ChevronRight } from 'lucide-react'
import { useReleases } from '../../../hooks/useReleases'
import { daysUntil, formatReleaseDate } from '../../../lib/releases'
import { Eyebrow } from '../atoms/Eyebrow'
import { Skeleton } from '../atoms/Skeleton'
import { Button } from '../atoms/Button'
import { Card } from './Card'

interface NextReleaseCardProps {
  userId: string | undefined
}

/** Tarjeta de La mesa con el próximo lanzamiento (fase 7). Lleva a la pantalla Lanzamientos. */
export function NextReleaseCard({ userId }: NextReleaseCardProps) {
  const navigate = useNavigate()
  const { releases, isLoading } = useReleases(userId)
  const upcoming = releases.filter((r) => daysUntil(r.release_date) >= 0)
  const next = upcoming[0]
  const days = next ? daysUntil(next.release_date) : 0

  return (
    <Card labelledBy="mesa-lanzamiento" tint="magenta">
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <Eyebrow id="mesa-lanzamiento" icon={CalendarClock} tone="magenta">Próximo lanzamiento</Eyebrow>
        {next && (
          <button
            type="button"
            onClick={() => navigate('/lanzamientos?vista=cuenta-atras')}
            className="inline-flex items-center gap-0.5 shrink-0 text-body-sm font-bold text-magenta-text rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            {upcoming.length > 1 ? `Ver los ${upcoming.length}` : 'Ver'}
            <ChevronRight size={15} />
          </button>
        )}
      </div>

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
          <span className="w-[74px] h-[74px] shrink-0 rounded-2xl bg-magenta text-on-accent flex flex-col items-center justify-center">
            {days === 0 ? (
              <span className="font-display font-semibold text-body-lg leading-none">Hoy</span>
            ) : (
              <>
                <span className="font-display font-semibold text-[28px] leading-none tabular-nums">{days}</span>
                <span className="text-[11px] font-bold mt-1">{days === 1 ? 'día' : 'días'}</span>
              </>
            )}
          </span>
          <span className="min-w-0">
            <span className="block font-display font-semibold text-body-lg text-text leading-snug line-clamp-2">{next.title}</span>
            {next.author && <span className="block text-body-sm text-text-secondary truncate">{next.author}</span>}
            <span className="block text-body-sm text-magenta-text font-semibold mt-1">{formatReleaseDate(next.release_date)}</span>
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
