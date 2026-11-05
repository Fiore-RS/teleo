import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../../lib/supabase'

interface GoalPostcardProps {
  userId: string | undefined
  /** La meta del año: la cifra grande de la postal y de la estampilla. */
  goal: number
  /** Libros terminados en el año. Si pasa la meta, la frase lo cuenta ("y ya vas por 30"). */
  count: number
  year: number
  /** Nombre en las líneas de la dirección (apodo o @usuario). */
  name: string
  onClose: () => void
  /** Día en que se cumplió, si ya se sabe (Resumen › Año); si no, se busca. */
  reachedOn?: Date
  /** false en años que ya terminaron ("llegaste a 30"). Por defecto true. */
  ongoing?: boolean
}

const MONTHS = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC']

/** Día en que se cumplió la meta: la fecha de fin de la lectura número `goal` del año en el
 *  historial (la misma fuente que cuenta la meta, lib/readingHistory.ts), ordenando por fecha
 *  de fin. Si se edita la fecha de un libro, este día se mueve con ella. */
async function fetchGoalReachedOn(userId: string, year: number, goal: number): Promise<Date | null> {
  const { data } = await supabase
    .from('reading_history')
    .select('end_date')
    .eq('user_id', userId)
    .gte('end_date', `${year}-01-01`)
    .lte('end_date', `${year}-12-31`)
    .order('end_date', { ascending: true })
    .order('created_at', { ascending: true })
    .range(goal - 1, goal - 1)
  const endDate = data?.[0]?.end_date
  if (!endDate) return null
  const [y, m, d] = endDate.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Pila de libros de la estampilla, en los colores del tema activo. */
const STACK = [
  { x: 22, y: 98, w: 106, color: 'var(--color-primary)' },
  { x: 30, y: 82, w: 92, color: 'var(--color-orange)' },
  { x: 18, y: 66, w: 100, color: 'var(--color-magenta)' },
  { x: 34, y: 50, w: 88, color: 'var(--color-pink)' },
  { x: 26, y: 34, w: 96, color: 'var(--color-rose)' },
  { x: 40, y: 18, w: 74, color: 'var(--color-primary-text)' },
]

/** La estampilla (V.3.6.0): perforada, con la meta y una pila de libros en los colores del
 *  tema. La perforación deja ver lo que hay atrás y la sombra dibuja el borde dentado. */
export function GoalStamp({ goal, className = '' }: { goal: number; className?: string }) {
  return (
    // Con span y no div: también va dentro de un botón (Resumen › Año).
    <span className={`postcard-stamp block ${className}`} aria-hidden="true">
      <span className="block w-[96px] h-[120px] p-[5px] postcard-perf">
        <span className="h-full bg-primary-soft shadow-[inset_0_0_0_1px_var(--color-primary-text)] p-1.5 flex flex-col items-center justify-center gap-1">
          <span className="font-title text-[26px] leading-[0.9] text-primary-text">{goal}</span>
          <svg viewBox="0 0 150 120" className="w-[62px] h-[50px]">
            {STACK.map((b) => (
              <rect key={b.y} x={b.x} y={b.y} width={b.w} height="16" rx="2" fill={b.color} />
            ))}
          </svg>
        </span>
      </span>
    </span>
  )
}

/** Matasellos con el día y el año (V.3.6.0). La posición y el tamaño los pone quien lo usa. */
export function Postmark({ date, className = '' }: { date: Date; className?: string }) {
  return (
    <svg className={`postcard-mark pointer-events-none ${className}`} viewBox="0 0 170 90" aria-hidden="true">
      <g fill="none" stroke="var(--color-primary-text)" strokeWidth="2">
        <circle cx="45" cy="45" r="38" />
        <circle cx="45" cy="45" r="31" strokeWidth="1" />
        <path d="M88 30 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" />
        <path d="M88 45 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" />
        <path d="M88 60 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0" />
      </g>
      <text x="45" y="42" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="700" fontSize="13" fill="var(--color-primary-text)">
        {date.getDate()} {MONTHS[date.getMonth()]}
      </text>
      <text x="45" y="58" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="700" fontSize="12" fill="var(--color-primary-text)">
        {date.getFullYear()}
      </text>
    </svg>
  )
}

interface PostcardProps {
  goal: number
  count: number
  year: number
  name: string
  /** Día en que se cumplió la meta (matasellos). */
  reachedOn: Date
  /** El año todavía no termina: "ya vas por 30" en vez de "llegaste a 30". */
  ongoing: boolean
  /** Sin animaciones y con sombra de tarjeta: para mostrarla dentro de una pantalla
   *  (Resumen › Año) en vez de como aviso. */
  isStatic?: boolean
}

/** La postal en sí (V.3.6.0): mensaje a la izquierda; a la derecha, el recuadro con la
 *  estampilla y las líneas de la dirección; el matasellos con el día en que se cumplió la meta
 *  marca la estampilla y la postal a la vez. La usan el aviso de La mesa (GoalPostcard) y
 *  Resumen › Año. */
export function Postcard({ goal, count, year, name, reachedOn, ongoing, isStatic = false }: PostcardProps) {
  return (
    <div className={`postcard-in ${isStatic ? 'postcard-static shadow-card' : 'shadow-sheet'} relative w-full max-w-[350px] aspect-[350/224] bg-surface border border-border rounded-[6px] grid grid-cols-[1fr_1px_116px] gap-3.5 p-4`}>
        <div className="flex flex-col justify-center gap-1.5 min-w-0">
          <span className="smallcaps text-primary-text">Meta cumplida</span>
          <p className="font-title text-[26px] leading-[1.05] text-text">
            {goal} {goal === 1 ? 'libro' : 'libros'} en {year}
          </p>
          <p className="font-display italic text-body-md text-text-secondary leading-snug">
            {count > goal
              ? ongoing
                ? `Leíste todo lo que te propusiste, y ya vas por ${count}.`
                : `Leíste todo lo que te propusiste, y llegaste a ${count}.`
              : ongoing
                ? 'Leíste todo lo que te propusiste este año.'
                : `Leíste todo lo que te propusiste en ${year}.`}
          </p>
        </div>

        <div aria-hidden="true" className="bg-[repeating-linear-gradient(var(--color-border)_0_4px,transparent_4px_8px)]" />

        <div className="flex flex-col justify-between items-end min-w-0" aria-hidden="true">
          <div className="relative w-[96px] h-[120px] border border-dashed border-border">
            <GoalStamp goal={goal} className="absolute -inset-px" />
          </div>
          <div className="w-full flex flex-col gap-2 font-display italic text-[13px] text-text-secondary">
            <span className="border-b border-border pb-0.5 truncate">Para {name}</span>
            <span className="border-b border-border pb-0.5">Teleo, {year}</span>
          </div>
        </div>

        <Postmark date={reachedOn} className="absolute right-[58px] top-[96px] w-[120px] h-[64px]" />
      </div>
  )
}

/** Meta anual cumplida (V.3.6.0): llega una postal con el mensaje a la izquierda y, a la
 *  derecha, el recuadro donde cae una estampilla con la pila de libros y las líneas de la
 *  dirección. Un matasellos con el día en que se cumplió la meta marca la estampilla y la postal a la vez, y abajo va el
 *  botón "Cerrar".
 *  Se muestra una sola vez por año (lib/goalCelebration.ts). Toma los colores del tema activo
 *  y con "reducir movimiento" aparece sin animación (index.css). Vista previa aprobada: lienzo
 *  "Teleo · Paleta de 3 colores", tablero "Estampilla: cuatro formas del mensaje", opción A. */
export function GoalPostcard({ userId, goal, count, year, name, onClose, reachedOn: knownReachedOn, ongoing = true }: GoalPostcardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  // undefined mientras se busca: la postal espera a tener la fecha para que el matasellos no
  // cambie después de estampado. Si no se encuentra, va la fecha de hoy.
  const [reachedOn, setReachedOn] = useState<Date | null | undefined>(knownReachedOn)
  useEffect(() => {
    if (knownReachedOn) return
    let active = true
    const search = userId ? fetchGoalReachedOn(userId, year, goal) : Promise.resolve(null)
    search
      .then((date) => active && setReachedOn(date))
      .catch(() => active && setReachedOn(null))
    return () => {
      active = false
    }
  }, [userId, year, goal, knownReachedOn])
  const stampDate = reachedOn ?? new Date()
  const ready = reachedOn !== undefined

  // El fondo no se desplaza mientras está abierta, y el foco va al botón para cerrarla con
  // el teclado.
  useEffect(() => {
    if (!ready) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    buttonRef.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previous
    }
  }, [ready])

  if (!ready) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-5"
      role="dialog"
      aria-modal="true"
      aria-label={`Meta ${year} cumplida`}
    >
      <div className="absolute inset-0 bg-black/55 animate-fade-in" onClick={onClose} />

      <Postcard goal={goal} count={count} year={year} name={name} reachedOn={stampDate} ongoing={ongoing} />

      <button
        ref={buttonRef}
        type="button"
        onClick={onClose}
        className="postcard-button relative h-11 px-8 rounded-button bg-primary text-primary-ink font-body font-bold text-body-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-ink"
      >
        Cerrar
      </button>
    </div>,
    document.body
  )
}
