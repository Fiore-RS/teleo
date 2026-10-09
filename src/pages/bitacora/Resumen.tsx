import { useMemo, useState, type ReactNode } from 'react'
import { BookCheck, CalendarDays, CalendarRange, Crown, Heart, Check, Shapes, Library, Sparkles } from 'lucide-react'
import { useYearReads, type YearRead } from '../../hooks/useYearReads'
import { usePeriodFavorites } from '../../hooks/usePeriodFavorites'
import { queryClient } from '../../lib/queryClient'
import { MONTH_ABBR, MONTH_NAMES } from '../../lib/months'
import { MiniCover } from '../../assets/components/atoms/MiniCover'
import { Sheet } from '../../assets/components/atoms/Sheet'
import { Button } from '../../assets/components/atoms/Button'
import { CoverSkeleton, Skeleton } from '../../assets/components/atoms/Skeleton'
import { Card } from '../../assets/components/molecules/Card'
import { MoreRow } from '../../assets/components/molecules/MoreRow'
import { Shelf, ShelfPlank } from '../../assets/components/molecules/Shelf'
import { BookCover } from '../../assets/components/molecules/BookCover'
import { PeriodNav } from '../../assets/components/molecules/PeriodNav'
import { PeriodTransition } from '../../assets/components/atoms/PeriodTransition'
import { DetalleLibro } from '../DetalleLibro'
import { BreakdownList } from '../../assets/components/molecules/BreakdownList'
import { tally, formatLabel } from '../../lib/tally'
import { categoryPlural } from '../../lib/options'

export type ResumenView = 'mes' | 'anio' | 'favoritos'

const views: { key: ResumenView; label: string }[] = [
  { key: 'mes', label: 'Mes' },
  { key: 'anio', label: 'Año' },
  { key: 'favoritos', label: 'Favoritos' },
]

const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)
const fmt = (n: number) => numberFormat.format(n)

/** Hoja de Resumen (V.3.0.0): Mes, Año y Favoritos son pestañas de separador de una misma
 *  hoja con tinte rosa. La pestaña activa se une a la hoja; las otras quedan detrás, más
 *  bajas y en el fondo de la página. */
function ResumenSheet({ view, onViewChange, children }: {
  view: ResumenView
  onViewChange: (view: ResumenView) => void
  children: ReactNode
}) {
  return (
    // El espacio de las pestañas va como padding de un contenedor y no como margen: un margen
    // se juntaba con el de la barra de arriba en Mes y la hoja quedaba pegada a ella.
    <div className="pt-[34px]">
    <section className="relative bg-pink-tint border border-border rounded-card rounded-tl-none shadow-card px-3.5 pt-4 pb-[18px]">
      <div role="tablist" aria-label="Vista del resumen" className="absolute -top-[34px] -left-px flex items-end">
        {views.map(({ key, label }) => {
          const isActive = view === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onViewChange(key)}
              className={`relative px-[18px] flex items-center border border-border border-b-0 rounded-t-[14px] font-body text-[15px] focus-visible:outline-2 focus-visible:outline-primary-text ${
                isActive
                  ? 'h-[34px] z-[1] bg-pink-tint text-pink-text font-bold'
                  : 'h-[29px] -ml-px first:ml-0 bg-surface-2 text-text-secondary font-semibold'
              }`}
            >
              {label}
              {isActive && <span aria-hidden="true" className="absolute -bottom-0.5 inset-x-0 h-[3px] bg-pink-tint" />}
            </button>
          )
        })}
      </div>
      {children}
    </section>
    </div>
  )
}

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
      {view === 'mes' && (
        <MonthView
          view={view}
          onViewChange={onViewChange}
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
          userId={userId}
          view={view}
          onViewChange={onViewChange}
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
          onBookClick={setSelectedBookId}
        />
      )}

      {view === 'favoritos' && (
        <FavoritesView
          view={view}
          onViewChange={onViewChange}
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

interface SheetViewProps {
  view: ResumenView
  onViewChange: (view: ResumenView) => void
}

interface MonthViewProps extends SheetViewProps {
  year: number
  month: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onBookClick: (bookId: string) => void
}

/** Mes: los libros terminados ese mes, en repisas. */
function MonthView({ view, onViewChange, year, month, reads, isLoading, canGoNext, onPrev, onNext, onBookClick }: MonthViewProps) {
  // Envoltorio con stagger-children: la hoja entra con la misma animación que las tarjetas
  // de Estadísticas y Compras.
  return (
    <div className="stagger-children">
    <ResumenSheet view={view} onViewChange={onViewChange}>
      <h2 className="sr-only">Libros terminados en {MONTH_NAMES[month - 1]} de {year}</h2>
      <PeriodNav
        label={`${MONTH_NAMES[month - 1]} ${year}`}
        onPrev={onPrev}
        onNext={onNext}
        canGoNext={canGoNext}
        prevLabel="Mes anterior"
        nextLabel="Mes siguiente"
      />

      <PeriodTransition order={year * 12 + month}>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 mt-4 px-2.5" aria-label="Cargando">
            {[0, 1, 2].map((i) => <CoverSkeleton key={i} className="w-full" />)}
          </div>
        ) : reads.length === 0 ? (
          <p className="text-body-md text-text-secondary text-center mt-4 mb-1">No terminaste libros este mes.</p>
        ) : (
          <>
            <p className="text-body-md text-text-secondary text-center mt-1 mb-3">
              {reads.length} {reads.length === 1 ? 'libro terminado' : 'libros terminados'}
            </p>
            <Shelf
              className="stagger-children"
              items={reads.map((read) => ({
                key: read.id,
                title: read.title,
                onClick: () => onBookClick(read.bookId),
                cover: <BookCover title={read.title} coverUrl={read.coverUrl ?? undefined} status="terminado" />,
              }))}
            />
          </>
        )}
      </PeriodTransition>
    </ResumenSheet>
    </div>
  )
}

/* ---------- Año ---------- */

interface YearViewProps extends SheetViewProps {
  userId: string | undefined
  year: number
  reads: YearRead[]
  totalPages: number
  totalAudioSeconds: number
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onMonthClick: (month: number) => void
  onBookClick: (bookId: string) => void
}

/** Colores de los lomos, en el orden de los meses: los cuatro de la paleta del tema. */
const SPINE_TONES = [
  { bg: 'var(--color-primary)', ink: 'var(--color-primary-ink)' },
  { bg: 'var(--color-magenta)', ink: 'var(--color-on-magenta)' },
  { bg: 'var(--color-orange)', ink: 'var(--color-on-orange)' },
  { bg: 'var(--color-pink)', ink: 'var(--color-on-pink)' },
]

/** Año: una frase con lo esencial dentro de la hoja; debajo "Tu año en un estante" (un lomo
 *  por mes, más alto mientras más libros; tocarlo abre el mes) y "Más de tu año", plegado. */
function YearView({ userId, view, onViewChange, year, reads, totalPages, isLoading, canGoNext, onPrev, onNext, onMonthClick }: YearViewProps) {
  const now = new Date()
  const { favorites } = usePeriodFavorites(userId, year)
  const [openRow, setOpenRow] = useState<'leido' | 'favoritos' | null>(null)
  const counts = useMemo(() => {
    const c = Array.from({ length: 12 }, () => 0)
    for (const r of reads) c[r.month - 1] += 1
    return c
  }, [reads])
  const byCategory = useMemo(() => tally(reads.map((r) => r.category)), [reads])
  const byFormat = useMemo(() => tally(reads.map((r) => formatLabel(r.format))), [reads])

  const isCurrentYear = year === now.getFullYear()
  const lastMonth = isCurrentYear ? now.getMonth() + 1 : 12
  const max = Math.max(...counts)
  const bestMonths = counts.filter((c) => c === max).length
  const bestMonth = max >= 2 && bestMonths === 1 ? counts.indexOf(max) : -1
  // Alto del lomo: 30px de base y hasta 120px más, repartidos según el mes con más libros.
  const unit = max > 0 ? Math.min(22, 120 / max) : 0

  const monthsWithReads = counts.slice(0, lastMonth).filter((c) => c > 0).length
  const monthsPicked = favorites.filter((f) => f.month !== null && f.bookId).length
  const topCategory = categoryPlural(byCategory[0]?.label)
  const topFormat = byFormat[0]?.label?.toLowerCase()
  const leidoSummary = topCategory
    ? `Sobre todo ${topCategory}${topFormat ? `, en ${topFormat}` : ''}`
    : topFormat
      ? `Sobre todo en ${topFormat}`
      : 'Por categoría y formato'

  const n = reads.length
  const sentence =
    n === 0 ? (
      isCurrentYear ? <>Todavía no terminas libros en {year}.</> : <>En {year} no terminaste libros.</>
    ) : (
      <>
        {isCurrentYear ? 'Llevas' : 'Terminaste'}{' '}
        <b className="font-semibold text-magenta-text">{n} {n === 1 ? 'libro' : 'libros'}</b>
        {totalPages > 0 && <>, unas <b className="font-semibold text-pink-text">{fmt(totalPages)} páginas</b></>}
        {isCurrentYear ? ` en ${year}` : ''}.
        {bestMonth >= 0 && <> {MONTH_NAMES[bestMonth]} fue tu mejor mes.</>}
      </>
    )

  return (
    <div className="flex flex-col gap-5 stagger-children">
      <ResumenSheet view={view} onViewChange={onViewChange}>
        <h2 className="sr-only">Tu {year} en libros</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />
        <PeriodTransition order={year}>
          {isLoading ? (
            <div className="mt-4" aria-label="Cargando">
              <Skeleton className="h-5 w-4/5 rounded-full" />
              <Skeleton className="h-5 w-3/5 rounded-full mt-2" />
            </div>
          ) : (
            <p className="font-display text-[20px] leading-[1.4] text-text mt-3">{sentence}</p>
          )}
        </PeriodTransition>
      </ResumenSheet>

      <Card tab={{ label: 'Tu año en un estante', icon: Library }}>
        <PeriodTransition order={year}>
          <div className="flex items-end gap-1 h-[150px] px-0.5">
            {counts.map((c, i) => {
              const month = i + 1
              const isFuture = month > lastMonth
              const tone = SPINE_TONES[i % SPINE_TONES.length]
              const label = `${MONTH_NAMES[i]}: ${isFuture ? 'todavía no llega' : c === 0 ? 'sin libros' : `${c} ${c === 1 ? 'libro' : 'libros'}`}`
              return c === 0 ? (
                <button
                  key={month}
                  type="button"
                  disabled={isFuture}
                  onClick={() => onMonthClick(month)}
                  aria-label={label}
                  className={`flex-1 h-[26px] rounded-t-[5px] rounded-b-[2px] border-[1.5px] border-dashed border-border flex items-end justify-center pb-1 text-[10px] font-bold text-text-muted uppercase focus-visible:outline-2 focus-visible:outline-primary-text ${
                    isFuture ? 'opacity-30' : ''
                  }`}
                >
                  {MONTH_ABBR[i][0]}
                </button>
              ) : (
                <button
                  key={month}
                  type="button"
                  onClick={() => onMonthClick(month)}
                  aria-label={label}
                  className="flex-1 rounded-t-[5px] rounded-b-[2px] flex flex-col items-center justify-between pt-[5px] pb-1 shadow-[inset_-3px_0_0_rgba(0,0,0,0.15)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-text"
                  style={{
                    height: 30 + c * unit,
                    color: tone.ink,
                    background: `linear-gradient(160deg, ${tone.bg}, color-mix(in srgb, ${tone.bg} 72%, #000))`,
                  }}
                >
                  <b className="font-display font-semibold text-[13px] leading-none tabular-nums">{c}</b>
                  <span className="text-[10px] font-bold opacity-90 uppercase">{MONTH_ABBR[i][0]}</span>
                </button>
              )
            })}
          </div>
        </PeriodTransition>
        <ShelfPlank />
        <p className="text-[12.5px] text-text-muted text-center mt-2.5">Toca un mes para ver sus libros.</p>
      </Card>

      {!isLoading && n > 0 && (
        <Card tab={{ label: `Más de tu ${year}`, icon: Sparkles }} padding="px-4 py-1">
          <div>
            {(byCategory.length > 0 || byFormat.length > 0) && (
              <MoreRow
                id="anio-leido"
                tone="orange"
                icon={Shapes}
                title="Qué leíste"
                summary={leidoSummary}
                isOpen={openRow === 'leido'}
                onToggle={() => setOpenRow((r) => (r === 'leido' ? null : 'leido'))}
              >
                <div className="space-y-5">
                  <BreakdownList title="Por categoría" entries={byCategory} />
                  <BreakdownList title="Por formato" entries={byFormat} />
                </div>
              </MoreRow>
            )}
            <MoreRow
              id="anio-favoritos"
              tone="magenta"
              icon={Crown}
              title="Tus favoritos"
              summary={
                monthsWithReads === 0
                  ? 'Elige el favorito de cada mes'
                  : `Ya elegiste ${monthsPicked} de ${monthsWithReads} ${monthsWithReads === 1 ? 'mes' : 'meses'}`
              }
              isOpen={openRow === 'favoritos'}
              onToggle={() => setOpenRow((r) => (r === 'favoritos' ? null : 'favoritos'))}
            >
              <p className="text-body-md text-text-secondary">
                Elige tu libro favorito de cada mes y, entre ellos, el favorito del año.
              </p>
              <Button variant="soft" className="mt-3" onClick={() => onViewChange('favoritos')}>
                <Heart size={16} />
                Ir a favoritos
              </Button>
            </MoreRow>
          </div>
        </Card>
      )}
    </div>
  )
}

/* ---------- Favoritos ---------- */

interface FavoritesViewProps extends SheetViewProps {
  userId: string | undefined
  year: number
  reads: YearRead[]
  isLoading: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

function FavoritesView({ view, onViewChange, userId, year, reads, isLoading, canGoNext, onPrev, onNext }: FavoritesViewProps) {
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
    <div className="flex flex-col gap-5 stagger-children">
      <ResumenSheet view={view} onViewChange={onViewChange}>
        <h2 className="sr-only">Favoritos de {year}</h2>
        <PeriodNav
          label={String(year)}
          onPrev={onPrev}
          onNext={onNext}
          canGoNext={canGoNext}
          prevLabel="Año anterior"
          nextLabel="Año siguiente"
        />
        <PeriodTransition order={year}>
          <div className="mt-3.5">
            {isLoading ? (
              <div className="flex gap-3.5 items-center" aria-label="Cargando">
                <CoverSkeleton className="w-[84px] shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                  <Skeleton className="h-5 w-4/5 rounded-full mt-2" />
                </div>
              </div>
            ) : yearFavoriteBook ? (
              <button
                type="button"
                onClick={() => setPicking(0)}
                className="w-full flex items-center gap-3.5 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-primary-text"
              >
                <MiniCover
                  src={yearFavoriteBook.coverUrl}
                  title={yearFavoriteBook.title}
                  className="w-[84px] shrink-0 rounded-lg! shadow-[0_10px_18px_-10px_rgba(0,0,0,0.6)]"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-[12px] font-bold text-magenta-text mb-1">
                    <Crown size={13} aria-hidden="true" />
                    Favorito del año
                  </span>
                  <span className="block font-display font-semibold text-[20px] leading-[1.2] text-text">{yearFavoriteBook.title}</span>
                  {yearFavoriteBook.author && <span className="block text-body-md text-text-secondary mt-0.5">{yearFavoriteBook.author}</span>}
                  <span className="block text-[13px] font-bold text-magenta-text mt-2.5">Cambiar</span>
                </span>
              </button>
            ) : monthlyFavoriteBooks.length === 0 ? (
              <p className="text-body-md text-text-secondary text-center">
                Elige el favorito de cada mes y después, entre ellos, el del año.
              </p>
            ) : (
              <>
                <p className="text-body-md text-text-secondary text-center">
                  {yearFavorite ? 'Dejaste vacío el favorito del año.' : `Elige el favorito del año entre tus ${monthlyFavoriteBooks.length} favoritos de cada mes.`}
                </p>
                <Button variant="magenta" className="mt-3" onClick={() => setPicking(0)}>
                  <Crown size={17} />
                  Elegir favorito del año
                </Button>
              </>
            )}
          </div>
        </PeriodTransition>
      </ResumenSheet>

      <Card tab={{ label: 'Uno por mes', icon: CalendarDays }}>
        <PeriodTransition order={year}>
          {isLoading ? (
            <div className="grid grid-cols-4 gap-x-2 gap-y-3" aria-label="Cargando">
              {Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-2/3 rounded-md" />)}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-x-2 gap-y-3">
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
                    className={`text-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${isFuture ? 'opacity-35' : ''}`}
                  >
                    {book ? (
                      <MiniCover src={book.coverUrl} title={book.title} className="w-full rounded-md! shadow-[0_5px_10px_-6px_rgba(0,0,0,0.6)]" />
                    ) : (
                      <span
                        className={`w-full aspect-2/3 rounded-md border-[1.5px] border-dashed flex items-center justify-center px-1 text-[10.5px] leading-tight ${
                          canPick && !fav ? 'border-ornament text-primary-text font-bold' : 'border-border text-text-muted font-semibold'
                        }`}
                      >
                        {isFuture ? '' : !canPick ? 'Sin libros' : fav ? 'Vacío' : 'Elegir'}
                      </span>
                    )}
                    <span className="block text-[11px] font-bold text-text-secondary mt-1 capitalize">{MONTH_ABBR[month - 1]}</span>
                  </button>
                )
              })}
            </div>
          )}
        </PeriodTransition>
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
