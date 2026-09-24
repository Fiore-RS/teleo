import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarPlus, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useReleases, type Release } from '../hooks/useReleases'
import { formatLocalDate, todayLocalDate } from '../lib/date'
import { daysUntil, formatReleaseDate } from '../lib/releases'
import { MONTH_NAMES } from '../lib/months'
import { PageHeader } from '../assets/components/molecules/PageHeader'
import { SegmentedTabs } from '../assets/components/atoms/SegmentedTabs'
import { MonthCalendar } from '../assets/components/atoms/MonthCalendar'
import { Button } from '../assets/components/atoms/Button'
import { Skeleton } from '../assets/components/atoms/Skeleton'
import { Card } from '../assets/components/molecules/Card'
import { PeriodNav } from '../assets/components/molecules/PeriodNav'
import { ReleaseRow } from '../assets/components/molecules/ReleaseRow'
import { ReleaseFormSheet } from '../assets/components/molecules/ReleaseFormSheet'

type Tab = 'calendario' | 'cuenta-atras'

/** Lanzamientos (fase 7): los libros que esperas, en un calendario por mes y en una cuenta
 *  atrás ordenada por fecha. Se llega desde la tarjeta de Mesa. */
export function Lanzamientos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { releases, isLoading } = useReleases(user?.id)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = searchParams.get('vista') === 'cuenta-atras' ? 'cuenta-atras' : 'calendario'

  const today = new Date()
  const [monthOffset, setMonthOffset] = useState(0)
  const shown = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const year = shown.getFullYear()
  const month = shown.getMonth() + 1
  const [selectedDate, setSelectedDate] = useState<string>(todayLocalDate())

  // Formulario: null = cerrado; { release } para editar; { date } para crear.
  const [form, setForm] = useState<{ release?: Release; date?: string } | null>(null)

  const markedDates = useMemo(() => new Set(releases.map((r) => r.release_date)), [releases])
  const dayReleases = releases.filter((r) => r.release_date === selectedDate)
  const upcoming = releases.filter((r) => daysUntil(r.release_date) >= 0)
  const past = releases.filter((r) => daysUntil(r.release_date) < 0).reverse()
  const [showPast, setShowPast] = useState(false)

  function changeMonth(delta: number) {
    const next = monthOffset + delta
    setMonthOffset(next)
    // Al cambiar de mes, se elige el día 1 (o hoy, si se vuelve al mes actual).
    const first = new Date(today.getFullYear(), today.getMonth() + next, 1)
    setSelectedDate(next === 0 ? todayLocalDate() : formatLocalDate(first))
  }

  return (
    <div className="min-h-screen bg-glow-top px-4 pt-4 pb-12">
      <PageHeader
        title="Lanzamientos"
        subtitle="Los libros que estás esperando y cuánto falta para que salgan."
        onBack={() => navigate(-1)}
      />

      <div className="flex flex-col gap-5">
        <SegmentedTabs
          active={tab}
          onChange={(t) => setSearchParams(t === 'calendario' ? {} : { vista: t }, { replace: true })}
          options={[
            { value: 'calendario', label: 'Calendario' },
            { value: 'cuenta-atras', label: 'Cuenta atrás' },
          ]}
        />

        {tab === 'calendario' ? (
          <>
            <Card labelledBy="lanz-calendario">
              <h2 id="lanz-calendario" className="sr-only">Calendario de lanzamientos</h2>
              <PeriodNav
                label={`${MONTH_NAMES[month - 1]} ${year}`}
                onPrev={() => changeMonth(-1)}
                onNext={() => changeMonth(1)}
                canGoNext
                prevLabel="Mes anterior"
                nextLabel="Mes siguiente"
              />
              <MonthCalendar
                year={year}
                month={month}
                markedDates={markedDates}
                size="lg"
                showTitle={false}
                variant="events"
                selectedDate={selectedDate}
                onDayClick={setSelectedDate}
                className="mt-4"
              />
              <div className="flex items-center justify-center gap-1.5 mt-4 text-body-sm text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-xs bg-magenta" />
                Con lanzamiento
                <span className="w-2.5 h-2.5 rounded-xs ml-3 bg-primary" />
                Día elegido
              </div>
            </Card>

            <Card labelledBy="lanz-dia">
              <h2 id="lanz-dia" className="font-display font-semibold text-body-lg text-text mb-3">
                {formatReleaseDate(selectedDate)}
              </h2>
              {isLoading ? (
                <Skeleton className="h-20 w-full rounded-2xl" />
              ) : dayReleases.length === 0 ? (
                <p className="text-body-md text-text-secondary mb-4">No hay lanzamientos este día.</p>
              ) : (
                <div className="flex flex-col gap-2.5 mb-4">
                  {dayReleases.map((r) => (
                    <ReleaseRow key={r.id} release={r} currency={profile?.currency} onClick={() => setForm({ release: r })} />
                  ))}
                </div>
              )}
              <Button variant="magenta" onClick={() => setForm({ date: selectedDate })}>
                <CalendarPlus size={17} />
                Agregar lanzamiento
              </Button>
            </Card>
          </>
        ) : (
          <>
            {isLoading ? (
              <div className="flex flex-col gap-2.5" aria-label="Cargando">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
              </div>
            ) : upcoming.length === 0 ? (
              <Card>
                <p className="text-body-md text-text-secondary">
                  No tienes lanzamientos próximos. Agrega los libros que estás esperando para ver cuánto falta.
                </p>
              </Card>
            ) : (
              <div className="flex flex-col gap-2.5 stagger-children">
                {upcoming.map((r) => (
                  <ReleaseRow key={r.id} release={r} currency={profile?.currency} onClick={() => setForm({ release: r })} />
                ))}
              </div>
            )}

            <Button variant="magenta" onClick={() => setForm({})}>
              <Plus size={18} />
              Agregar lanzamiento
            </Button>

            {past.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPast((v) => !v)}
                  className="w-full text-body-sm font-bold text-text-secondary py-2"
                >
                  {showPast ? 'Ocultar los que ya salieron' : `Ver los que ya salieron (${past.length})`}
                </button>
                {showPast && (
                  <div className="flex flex-col gap-2.5 mt-2">
                    {past.map((r) => (
                      <ReleaseRow key={r.id} release={r} currency={profile?.currency} onClick={() => setForm({ release: r })} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {form && (
        <ReleaseFormSheet
          userId={user?.id}
          release={form.release}
          initialDate={form.date}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}
