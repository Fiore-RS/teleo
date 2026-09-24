import { useMemo, useState } from 'react'
import { BookCheck, CalendarRange, Crown, Heart, Check } from 'lucide-react'
import { useYearReads, type YearRead } from '../../hooks/useYearReads'
import { usePeriodFavorites } from '../../hooks/usePeriodFavorites'
import { queryClient } from '../../lib/queryClient'
import { MONTH_ABBR, MONTH_NAMES } from '../../lib/months'
import { formatDuration } from '../../lib/progress'
import { Eyebrow } from '../../assets/components/atoms/Eyebrow'
import { MiniCover } from '../../assets/components/atoms/MiniCover'
import { StatTile } from '../../assets/components/atoms/StatTile'
import { Sheet } from '../../assets/components/atoms/Sheet'
import { Button } from '../../assets/components/atoms/Button'
import { CoverSkeleton, Skeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
import { PeriodNav } from '../../assets/components/molecules/PeriodNav'
import { DetalleLibro } from '../DetalleLibro'

export type ResumenView = 'mes' | 'anio' | 'favoritos'

const views: { key: ResumenView; label: string }[] = [
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
  { key: 'favoritos', label: 'Favoritos' },
]

/** Un libro por id, aunque se haya terminado dos veces en el mismo periodo (relectura). */
function uniqueBooks(reads: YearRead[]) {
  const seen = new Map<string, YearRead>()
  for (const r of reads) if (!seen.has(r.bookId)) seen.set(r.bookId, r)
  return [...seen.values()]
}

interface ResumenProps {
  userId: string | undefined
  view: ResumenView
  onViewChange: (view: ResumenView) => void
  year: number
  onYearChange: (year: number) => void
}

/** Bitácora > Resumen (fase 6): los libros terminados por mes, el año completo y los
 *  favoritos de cada mes con el favorito del año. Todo sale de reading_history, así que una
 *  relectura aparece en el mes en que se volvió a terminar. */
export function Resumen({ userId, view, onViewChange, year, onYearChange }: ResumenProps) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const [month, setMonth] = useState(year === currentYear ? currentMonth : 12)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)

  const { reads, totalPages, totalAudioSeconds, isLoading } = useYearReads(userId, year)

  function goToMonth(y: number, m: number) {
    if (y !== year) onYearChange(y)
    setMonth(m)
  }

  function changeYear(y: number) {
    onYearChange(y)
    if (y === currentYear && month > currentMonth) setMonth(currentMonth)
  }

  return (
    <>
      {/* Sub-pestañas como chips chicos, para no repetir la barra de arriba */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Vista del resumen">
        {views.map(({ key, label }) => {
          const isActive = view === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(key)}
              className={`px-4 py-1.5 rounded-full text-body-sm font-body border transition-colors ${
                isActive ? 'bg-primary-soft border-primary-soft text-primary-text font-bold' : 'bg-surface border-border text-text-secondary font-semibold'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {view === 'mes' && (
        <MonthView
          year={year}
          month={month}
          reads={reads.filter((r) => r.month === month)}
          isLoading={isLoading}
          canGoNext={year < currentYear || month < currentMonth}
          onPrev={() => (month === 1 ? goToMonth(year - 1, 12) : setMonth(month - 1))}
          onNext={() => (month === 12 ? goToMonth(year + 1, 1) : setMonth(month + 1))}
          onBookClick={setSelectedBookId}
        />
      )}

      {view === 'anio' && (
        <YearView
          year={year}
          reads={reads}
          totalPages={totalPages}
          totalAudioSeconds={totalAudioSeconds}
          isLoading={isLoading}
          canGoNext={year < currentYear}
          onPrev={() => changeYear(year - 1)}
          onNext={() => changeYear(year + 1)}
          onMonthClick={(m) => {
            setMonth(m)
            onViewChange('mes')
          }}
        />
      )}

      {view === 'favoritos' && (
        <FavoritesView
          userId={userId}
          year={year}
          reads={reads}
          isLoading={isLoading}
          canGoNext={year < currentYear}
          onPrev={() => changeYear(year - 1)}
          onNext={() => changeYear(year + 1)}
        />
      )}

      {selectedBookId && (
        <DetalleLibro
          bookId={selectedBookId}
          onClose={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries({ queryKey: ['yearReads', userId] })
          }}
          onDeleted={() => {
            setSelectedBookId(null)
            queryClient.invalidateQueries()
          }}
        />
      )}
    </>
  )
}

/* ---------- Mes ---------- */

interface MonthViewProps {
  year: number
  month: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onBookClick: (bookId: string) => void
}

function MonthView({ year, month, reads, isLoading, canGoNext, onPrev, onNext, onBookClick }: MonthViewProps) {
  return (
    <Card labelledBy="resumen-mes">
      <h2 id="resumen-mes" className="sr-only">Libros terminados en {MONTH_NAMES[month - 1]} de {year}</h2>
      <PeriodNav
        label={`${MONTH_NAMES[month - 1]} ${year}`}
        onPrev={onPrev}
        onNext={onNext}
        canGoNext={canGoNext}
        prevLabel="Mes anterior"
        nextLabel="Mes siguiente"
      />

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 mt-5" aria-label="Cargando">
          {[0, 1, 2].map((i) => <CoverSkeleton key={i} className="w-full" />)}
        </div>
      ) : reads.length === 0 ? (
        <p className="text-body-md text-text-secondary text-center mt-5">No terminaste libros este mes.</p>
      ) : (
        <>
          <p className="text-body-md text-text-secondary text-center mt-1.5">
            {reads.length} {reads.length === 1 ? 'libro terminado' : 'libros terminados'}
          </p>
          <ul className="grid grid-cols-3 gap-x-3 gap-y-4 mt-5 stagger-children">
            {reads.map((read) => (
              <li key={read.id}>
                <button
                  type="button"
                  onClick={() => onBookClick(read.bookId)}
                  className="w-full text-left rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
                >
                  <MiniCover src={read.coverUrl} title={read.title} className="w-full rounded-[10px]! shadow-[0_6px_14px_-8px_rgba(60,30,10,0.5)]" />
                  <span className="block font-display font-semibold text-body-sm text-text leading-snug mt-2 line-clamp-2">{read.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}

/* ---------- Año ---------- */

interface YearViewProps {
  year: number
  reads: YearRead[]
  totalPages: number
  totalAudioSeconds: number
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onMonthClick: (month: number) => void
}

function YearView({ year, reads, totalPages, totalAudioSeconds, isLoading, canGoNext, onPrev, onNext, onMonthClick }: YearViewProps) {
  const now = new Date()
  const byMonth = useMemo(() => {
    const groups = Array.from({ length: 12 }, () => [] as YearRead[])
    for (const r of reads) groups[r.month - 1].push(r)
    return groups
  }, [reads])

  return (
    <div className="flex flex-col gap-5">
      <Card labelledBy="resumen-anio">
        <h2 id="resumen-anio" className="sr-only">Tu {year} en libros</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />

        <div className={`grid ${totalAudioSeconds > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 mt-5`}>
          <StatTile tone="magenta" label="Libros" value={isLoading ? '·' : String(reads.length)} />
          <StatTile tone="pink" label="Páginas" value={isLoading ? '·' : totalPages.toLocaleString()} />
          {totalAudioSeconds > 0 && <StatTile tone="orange" label="Escuchado" value={formatDuration(totalAudioSeconds)} />}
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {byMonth.map((monthReads, i) => {
            const month = i + 1
            const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)
            const shown = monthReads.slice(0, 3)
            const extra = monthReads.length - shown.length
            return (
              <button
                key={month}
                type="button"
                onClick={() => onMonthClick(month)}
                disabled={isFuture}
                className="bg-surface-2 border border-border rounded-2xl p-2.5 text-left flex flex-col gap-2 min-h-[104px] disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <span className="flex items-baseline justify-between gap-1">
                  <span className="font-body font-bold text-body-sm text-text capitalize">{MONTH_ABBR[i]}</span>
                  {monthReads.length > 0 && (
                    <span className="text-[11px] font-bold text-magenta-text tabular-nums">{monthReads.length}</span>
                  )}
                </span>
                {isLoading ? (
                  <Skeleton className="w-8 h-12 rounded-md" />
                ) : monthReads.length === 0 ? (
                  <span className="text-[11px] text-text-muted">{isFuture ? ' ' : 'Sin libros'}</span>
                ) : (
                  <span className="flex items-end">
                    {shown.map((r, j) => (
                      <MiniCover
                        key={r.id}
                        src={r.coverUrl}
                        title={r.title}
                        className={`w-8 shadow-sm ${j > 0 ? '-ml-3' : ''}`}
                      />
                    ))}
                    {extra > 0 && <span className="text-[11px] font-bold text-text-secondary ml-1">+{extra}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <p className="text-body-sm text-text-muted text-center mt-4">Toca un mes para ver todos sus libros.</p>
      </Card>
    </div>
  )
}

/* ---------- Favoritos ---------- */

interface FavoritesViewProps {
  userId: string | undefined
  year: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

function FavoritesView({ userId, year, reads, isLoading, canGoNext, onPrev, onNext }: FavoritesViewProps) {
  const { favorites, setFavorite } = usePeriodFavorites(userId, year)
  // Qué se está eligiendo: un mes (1-12) o el año (0).
  const [picking, setPicking] = useState<number | null>(null)

  const now = new Date()
  const lastMonth = year === now.getFullYear() ? now.getMonth() + 1 : 12
  const bookById = useMemo(() => new Map(reads.map((r) => [r.bookId, r])), [reads])
  const favoriteFor = (month: number | null) => favorites.find((f) => f.month === month)

  // El favorito del año se elige entre los favoritos de cada mes.
  const monthlyFavoriteBooks = uniqueBooks(
    favorites
      .filter((f) => f.month !== null && f.bookId)
      .sort((a, b) => (a.month ?? 0) - (b.month ?? 0))
      .map((f) => bookById.get(f.bookId!))
      .filter((r): r is YearRead => Boolean(r))
  )
  const yearFavorite = favoriteFor(null)
  const yearFavoriteBook = yearFavorite?.bookId ? bookById.get(yearFavorite.bookId) : undefined

  const pickerOptions =
    picking === 0 ? monthlyFavoriteBooks : picking ? uniqueBooks(reads.filter((r) => r.month === picking)) : []
  const pickerCurrent = picking === null ? undefined : favoriteFor(picking === 0 ? null : picking)

  return (
    <div className="flex flex-col gap-5">
      <Card labelledBy="resumen-favoritos">
        <h2 id="resumen-favoritos" className="sr-only">Favoritos de {year}</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />

        {isLoading ? (
          <div className="mt-5 space-y-3" aria-label="Cargando">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const isFuture = month > lastMonth
              const monthReads = reads.filter((r) => r.month === month)
              const fav = favoriteFor(month)
              const book = fav?.bookId ? bookById.get(fav.bookId) : undefined
              const canPick = !isFuture && monthReads.length > 0
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => setPicking(month)}
                  disabled={!canPick}
                  aria-label={`${MONTH_NAMES[month - 1]}: ${book ? book.title : !canPick ? 'sin libros terminados' : fav ? 'vacío' : 'elegir favorito'}`}
                  className={`rounded-2xl p-2.5 flex flex-col gap-2 text-left border focus-visible:outline-2 focus-visible:outline-primary-text ${
                    book ? 'bg-magenta-soft border-magenta/40' : 'bg-surface-2 border-border'
                  } ${isFuture ? 'opacity-45' : ''}`}
                >
                  <span className="font-body font-bold text-body-sm text-text capitalize">{MONTH_ABBR[month - 1]}</span>
                  {book ? (
                    <>
                      <MiniCover src={book.coverUrl} title={book.title} className="w-full rounded-lg! shadow-sm" />
                      <span className="font-display font-semibold text-[12px] leading-tight text-text line-clamp-2">{book.title}</span>
                    </>
                  ) : (
                    <span
                      className={`w-full aspect-2/3 rounded-lg border border-dashed flex items-center justify-center text-center px-1 text-[11px] leading-tight ${
                        canPick && !fav ? 'border-primary-text/50 text-primary-text font-bold' : 'border-border text-text-muted'
                      }`}
                    >
                      {isFuture ? '' : !canPick ? 'Sin libros' : fav ? 'Vacío' : (
                        <span className="flex flex-col items-center gap-1">
                          <Heart size={16} />
                          Elegir
                        </span>
                      )}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Favorito del año */}
      <Card labelledBy="resumen-favorito-anio" tint="magenta">
        <Eyebrow id="resumen-favorito-anio" icon={Crown} tone="magenta" className="mb-3.5">{`Favorito del ${year}`}</Eyebrow>
        {yearFavoriteBook ? (
          <button
            type="button"
            onClick={() => setPicking(0)}
            className="w-full flex items-center gap-4 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <MiniCover src={yearFavoriteBook.coverUrl} title={yearFavoriteBook.title} className="w-16 rounded-[10px]! shadow-card" />
            <span className="min-w-0">
              <span className="block font-display font-semibold text-display-md text-text leading-tight">{yearFavoriteBook.title}</span>
              {yearFavoriteBook.author && <span className="block text-body-md text-text-secondary mt-1">{yearFavoriteBook.author}</span>}
              <span className="block text-body-sm font-bold text-magenta-text mt-2">Cambiar</span>
            </span>
          </button>
        ) : monthlyFavoriteBooks.length === 0 ? (
          <p className="text-body-md text-text-secondary">
            Elige el favorito de cada mes y después, entre ellos, el del año.
          </p>
        ) : (
          <>
            <p className="text-body-md text-text-secondary">
              {yearFavorite ? 'Lo dejaste vacío.' : `Elígelo entre tus ${monthlyFavoriteBooks.length} favoritos del año.`}
            </p>
            <Button variant="magenta" className="mt-3.5" onClick={() => setPicking(0)}>
              <Heart size={17} />
              Elegir favorito del año
            </Button>
          </>
        )}
      </Card>

      {picking !== null && (
        <Sheet
          title={picking === 0 ? `Favorito del ${year}` : `Favorito de ${MONTH_NAMES[picking - 1].toLowerCase()}`}
          onClose={() => setPicking(null)}
        >
          <ul className="flex flex-col gap-1">
            {pickerOptions.map((book) => {
              const isSelected = pickerCurrent?.bookId === book.bookId
              return (
                <li key={book.bookId}>
                  <button
                    type="button"
                    onClick={() => {
                      setFavorite(picking === 0 ? null : picking, book.bookId)
                      setPicking(null)
                    }}
                    aria-pressed={isSelected}
                    className={`w-full flex items-center gap-3 p-2 rounded-2xl text-left border transition-colors ${
                      isSelected ? 'bg-magenta-soft border-magenta' : 'border-transparent active:bg-surface-2'
                    }`}
                  >
                    <MiniCover src={book.coverUrl} title={book.title} className="w-11" />
                    <span className="flex-1 min-w-0">
                      <span className="block font-display font-semibold text-body-md text-text truncate">{book.title}</span>
                      {book.author && <span className="block text-body-sm text-text-secondary truncate">{book.author}</span>}
                    </span>
                    {isSelected && <Check size={18} className="text-magenta-text shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setFavorite(picking === 0 ? null : picking, null)
              setPicking(null)
            }}
          >
            {picking === 0 ? <CalendarRange size={17} /> : <BookCheck size={17} />}
            Dejar vacío
          </Button>
        </Sheet>
      )}
    </div>
  )
}
