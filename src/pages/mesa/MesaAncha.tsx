import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Database } from '../../types/database'
import { CoverImage } from '../../assets/components/atoms/CoverImage'
import { Skeleton, CoverSkeleton } from '../../assets/components/atoms/Skeleton'
import { Button } from '../../assets/components/atoms/Button'
import { StreakRibbon } from '../../assets/components/atoms/StreakRibbon'
import { getProgressInfo, formatDuration } from '../../lib/progress'
import { getReadingPace, paceSentence } from '../../lib/readingPace'

type Book = Database['public']['Tables']['books']['Row']

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const WEEKDAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

/** "Jueves 12 de noviembre": el encabezado de La mesa en pantallas grandes, como la entrada de
 *  un diario. */
function diaryDate(date = new Date()) {
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} de ${MONTHS[date.getMonth()]}`
}

/** "2 de noviembre" a partir de una fecha guardada como AAAA-MM-DD (sin pasar por UTC). */
function shortDate(value: string) {
  const [y, m, d] = value.slice(0, 10).split('-').map((n) => parseInt(n, 10))
  const sameYear = y === new Date().getFullYear()
  return `${d} de ${MONTHS[m - 1]}${sameYear ? '' : ` de ${y}`}`
}

/** "Página 312 de 502", "01:20:00 de 09:15:00" o nada (digital: solo el porcentaje). */
function progressDetail(book: Book): string | null {
  if (book.format === 'audiolibro' && book.total_duration_seconds) {
    return `${formatDuration(book.current_duration_seconds ?? 0)} de ${formatDuration(book.total_duration_seconds)}`
  }
  if (book.format !== 'digital' && book.total_pages) return `Página ${book.current_page ?? 0} de ${book.total_pages}`
  return null
}

/** Colores de los lomos: de la paleta del tema, elegidos por el título (el mismo libro siempre
 *  del mismo color). Con texto on-accent, que en oscuro pasa a oscuro. */
const SPINE_COLORS = [
  'var(--color-accent-finished)',
  'var(--color-state-pending)',
  'var(--color-state-paused)',
  'var(--color-accent-reading)',
  'var(--color-magenta)',
  'var(--color-orange)',
]
function spineColor(title: string) {
  let h = 0
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0
  return SPINE_COLORS[h % SPINE_COLORS.length]
}
/** Ancho del lomo entre 500 y 600px, también por el título: la pila no se ve pareja. */
function spineWidth(title: string) {
  let h = 7
  for (let i = 0; i < title.length; i++) h = (h * 17 + title.charCodeAt(i)) >>> 0
  return 500 + (h % 101)
}

/** Los botones de borde sobre la hoja con renglones llevan el fondo de la hoja, para que las
 *  rayas no se vean a través (con ! porque la variante outline trae fondo transparente). */
const ON_PAPER = 'bg-surface! hover:bg-surface-2!'

const PAPER_SHADE_LEFT = 'linear-gradient(270deg, var(--teleo-pliegue), transparent 46px)'
const PAPER_SHADE_RIGHT = 'linear-gradient(90deg, var(--teleo-pliegue), transparent 46px)'
const PAPER_LINES = 'repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in srgb, var(--color-border) 75%, transparent) 31px 32px)'

/** Doble página: la estructura del libro abierto, con o sin libro. */
function Spread({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-2 rounded-md overflow-hidden shadow-[0_30px_50px_-26px_var(--teleo-cover-shadow),0_2px_4px_rgba(0,0,0,0.12)]">
      <div className="bg-surface flex flex-col items-center justify-center gap-3.5 px-6 py-7 min-h-[440px]" style={{ backgroundImage: PAPER_SHADE_LEFT }}>
        {left}
      </div>
      <div className="bg-surface flex flex-col px-6 escritorio:px-9.5 pt-25 pb-7" style={{ backgroundImage: `${PAPER_SHADE_RIGHT}, ${PAPER_LINES}` }}>
        {right}
      </div>
    </div>
  )
}

function OpenBook({ book, onUpdate, onOpen }: { book: Book; onUpdate: () => void; onOpen: () => void }) {
  const { percent } = getProgressInfo(book)
  const detail = progressDetail(book)
  const pace = getReadingPace(book)
  return (
    <Spread
      left={
        <>
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Ver detalles de ${book.title}`}
            className="w-[min(216px,100%)] aspect-2/3 rounded-[3px_6px_6px_3px] overflow-hidden bg-surface-2 shadow-[0_1px_1.5px_rgba(0,0,0,0.2),0_12px_22px_-8px_rgba(0,0,0,0.5)] transition-transform hover:-translate-y-1 motion-reduce:transition-none"
          >
            {book.cover_url ? (
              <CoverImage src={book.cover_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="w-full h-full flex items-end p-4 bg-accent-finished text-on-accent font-title text-[20px] leading-tight text-left">{book.title}</span>
            )}
          </button>
          {book.start_date && <p className="text-body-sm text-text-secondary">Leyendo desde el {shortDate(book.start_date)}</p>}
        </>
      }
      right={
        <>
          <h2 className="smallcaps text-primary-text">Leyendo ahora</h2>
          <p className="mt-3.5 font-title text-[clamp(28px,2.6vw,36px)] leading-none text-text line-clamp-3">{book.title}</p>
          {book.author && <p className="mt-2 font-display italic text-body-lg text-text-secondary">{book.author}</p>}
          <div className="mt-auto pt-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-title text-[48px] leading-none text-text tabular-nums">
                {Math.round(percent)}
                <span className="text-[26px]">%</span>
              </p>
              {detail && <p className="text-body-sm font-semibold text-text-secondary text-right">{detail}</p>}
            </div>
            <div
              role="progressbar"
              aria-label={`Progreso de ${book.title}`}
              aria-valuenow={Math.round(percent)}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-3 rounded-[6px] bg-reading-soft mt-3 overflow-hidden"
            >
              <div className="h-full rounded-[6px] bg-accent-reading" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
            {pace && <p className="mt-2.5 text-body-sm text-text-secondary">{paceSentence(pace)}</p>}
          </div>
          <div className="grid grid-cols-[3fr_2fr] gap-2.5 mt-8">
            <Button size="sm" onClick={onUpdate} className="h-[42px] px-3">
              Actualizar progreso
            </Button>
            <Button size="sm" variant="outline" onClick={onOpen} className={`h-[42px] px-3 ${ON_PAPER}`}>
              Ver detalles
            </Button>
          </div>
        </>
      }
    />
  )
}

function EmptyBook({ onRandom, onPending }: { onRandom: () => void; onPending: () => void }) {
  return (
    <Spread
      left={
        <div
          aria-hidden="true"
          className="w-[min(216px,100%)] aspect-2/3 rounded-[3px_6px_6px_3px] border-2 border-dashed border-border flex items-center justify-center p-5 text-center font-display italic text-body-lg text-text-muted"
        >
          Aquí va el libro que estés leyendo
        </div>
      }
      right={
        <>
          <h2 className="smallcaps text-primary-text">Leyendo ahora</h2>
          <p className="mt-3.5 font-title text-[34px] leading-[1.05] text-text">Tu mesa está libre</p>
          <p className="mt-3 font-display italic text-body-lg text-text-secondary">Elige qué leer y aparecerá abierto aquí.</p>
          <div className="flex flex-col gap-2.5 mt-auto pt-6">
            <Button size="sm" onClick={onRandom} className="h-[42px]">
              Elegir un pendiente al azar
            </Button>
            <Button size="sm" variant="outline" onClick={onPending} className={`h-[42px] ${ON_PAPER}`}>
              Ver mis pendientes
            </Button>
          </div>
        </>
      }
    />
  )
}

function LoadingBook() {
  return (
    <Spread
      left={<CoverSkeleton className="w-[min(216px,100%)]" />}
      right={
        <div aria-label="Cargando">
          <Skeleton className="h-3 w-1/3 rounded-full" />
          <Skeleton className="h-8 w-4/5 rounded-full mt-4" />
          <Skeleton className="h-4 w-1/2 rounded-full mt-3" />
          <Skeleton className="h-3 w-full rounded-full mt-24" />
        </div>
      }
    />
  )
}

/** "También en tu mesa": los demás libros en curso, acostados en una pila. Máximo dos lomos;
 *  si el título es largo, el lomo se hace más grueso en vez de cortarlo. Tocar el lomo abre sus
 *  detalles; el marcapáginas que asoma ("18% · Actualizar") actualiza su progreso, porque el
 *  libro abierto siempre es el último actualizado y estos no tendrían otra forma de avanzar. */
interface BookSpinesProps {
  books: Book[]
  onOpen: (id: string) => void
  onUpdate: (id: string) => void
  onSeeAll: () => void
}

function BookSpines({ books, onOpen, onUpdate, onSeeAll }: BookSpinesProps) {
  const shown = books.slice(0, 2)
  const rest = books.length - shown.length
  return (
    <section aria-labelledby="mesa-tambien" className="mt-9.5">
      <h2 id="mesa-tambien" className="smallcaps text-text-secondary mb-3.5">
        También en tu mesa
      </h2>
      {/* pr-34: lugar para el marcapáginas que asoma a la derecha. */}
      <ul className="flex flex-col items-start w-fit max-w-full pr-34 drop-shadow-[0_10px_10px_rgba(0,0,0,0.16)]">
        {shown.map((book, i) => {
          const { percent } = getProgressInfo(book)
          const surname = book.author?.trim().split(/\s+/).pop()
          return (
            <li
              key={book.id}
              style={{
                // Corridos entre sí para que la pila no se vea pareja.
                marginLeft: i % 2 === 1 ? 32 : 0,
                width: `min(${spineWidth(book.title)}px, 100%)`,
              }} className="relative min-w-0 tableta:min-w-[min(500px,100%)]">
              <button
                type="button"
                onClick={() => onOpen(book.id)}
                className="book-spine relative w-full flex items-center gap-3.5 min-h-[46px] py-2 pl-7 pr-6 rounded-[3px_4px_4px_3px] text-left text-on-accent transition-[filter] hover:brightness-105"
                style={{ backgroundColor: spineColor(book.title) }}
              >
                <span className="flex-1 min-w-0 font-title text-[16px] leading-tight">{book.title}</span>
                {surname && <span className="shrink-0 smallcaps text-[10px]! opacity-85">{surname}</span>}
              </button>
              <button
                type="button"
                onClick={() => onUpdate(book.id)}
                aria-label={`Actualizar progreso de ${book.title} (${Math.round(percent)}%)`}
                className="group absolute left-full top-1/2 -translate-y-1/2 h-[26px] pl-2.5 pr-4 flex items-center gap-1.5 whitespace-nowrap text-text text-[12px] font-bold rounded-r-[4px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                {/* El papel del marcapáginas, con el corte en V al final. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-reading-soft transition-[filter] group-hover:brightness-95 [clip-path:polygon(0_0,100%_0,calc(100%-7px)_50%,100%_100%,0_100%)]"
                />
                <span className="relative tabular-nums">{Math.round(percent)}%</span>
                <span aria-hidden="true" className="relative opacity-50">·</span>
                <span className="relative text-primary-text">Actualizar</span>
              </button>
            </li>
          )
        })}
      </ul>
      {rest > 0 && (
        <button type="button" onClick={onSeeAll} className="mt-3 ml-1 inline-flex items-center gap-0.5 font-bold text-body-md text-primary-text hover:underline underline-offset-4">
          y {rest} más
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

interface MesaAnchaProps {
  layout: 'tableta' | 'escritorio'
  greeting: string
  books: Book[]
  booksLoading: boolean
  streak: number
  markedToday: boolean
  streakLoading: boolean
  dropKey: number
  demoNotice: ReactNode
  releaseCard: ReactNode
  goalCard: ReactNode
  streakCard: ReactNode
  staggerClass: string
  onCalendar: () => void
  onUpdate: (bookId: string) => void
  onOpen: (bookId: string) => void
  onRandom: () => void
}

/** La mesa en tableta y escritorio (V.4.0.0, diseño aprobado por Fiorella el 12 nov 2026): el
 *  libro en curso abierto a doble página con la cinta de la racha, las tarjetas del teléfono
 *  y los demás libros en curso como lomos. Lienzo "Teleo · Escritorio". */
export function MesaAncha(props: MesaAnchaProps) {
  const navigate = useNavigate()
  const { layout, books, booksLoading } = props
  const [current, ...others] = books

  const book = (
    <section aria-labelledby="mesa-libro" className="relative">
      <span id="mesa-libro" className="sr-only">
        Leyendo ahora
      </span>
      {booksLoading ? (
        <LoadingBook />
      ) : current ? (
        <OpenBook book={current} onUpdate={() => props.onUpdate(current.id)} onOpen={() => props.onOpen(current.id)} />
      ) : (
        <EmptyBook onRandom={props.onRandom} onPending={() => navigate('/estante?filtro=pendiente')} />
      )}
      {/* La cinta de la racha, la misma del teléfono, colgando del libro. */}
      <StreakRibbon
        placement="libro"
        streak={props.streak}
        marked={props.markedToday}
        isLoading={props.streakLoading}
        dropKey={props.dropKey}
        onClick={props.onCalendar}
      />
    </section>
  )
  const spines = others.length > 0 && (
    <BookSpines
      books={others}
      onOpen={props.onOpen}
      onUpdate={props.onUpdate}
      onSeeAll={() => navigate('/estante?filtro=leyendo')}
    />
  )

  const header = (
    <header className="mb-8.5">
      <h1 className="font-title text-[32px] leading-none text-text">{diaryDate()}</h1>
      <p className="mt-2 font-display italic text-[19px] text-text-secondary">{props.greeting}</p>
    </header>
  )
  // Las tarjetas en el mismo orden que en el teléfono: lanzamiento, racha y meta.
  const cards = (
    <>
      {props.releaseCard}
      {props.streakCard}
      {props.goalCard}
    </>
  )

  return (
    <div className="max-w-[1180px] mx-auto">
      {layout === 'escritorio' ? (
        // Escritorio: la columna de las tarjetas empieza a la altura de la fecha (la pestaña de
        // la primera tarjeta queda en la misma línea que el encabezado).
        // La cascada de entrada va en cada columna, para que el encabezado, el libro, los lomos
        // y cada tarjeta entren uno por uno, como en el teléfono.
        <div className="grid grid-cols-[minmax(0,1fr)_350px] gap-13 items-start">
          <div className={props.staggerClass}>
            {header}
            {props.demoNotice}
            {book}
            {spines}
          </div>
          <div className={`flex flex-col gap-5.5 ${props.staggerClass}`}>{cards}</div>
        </div>
      ) : (
        // Tableta: el libro abierto, la pila debajo y las tarjetas en una sola columna.
        <div className={props.staggerClass}>
          {header}
          {props.demoNotice}
          {book}
          {spines}
          <div className="flex flex-col gap-5.5 mt-14">{cards}</div>
        </div>
      )}
    </div>
  )
}
