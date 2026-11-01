import { forwardRef, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { MONTH_ABBR, MONTH_NAMES } from '../../../lib/months'
import { formatStackHeight, type RecapBook, type RecapCardId, type RecapData } from '../../../lib/recap'
import { shareSafeImageUrl } from '../../../lib/shareImage'
import { upgradedSrc } from '../../../lib/coverSrc'
import type { RecapTone } from '../../../lib/recapTones'
import './recapCards.css'

/** Tamaño en pantalla. Se exporta con pixelRatio 3,6: 1080 × 1920 (historia). */
export const RECAP_CARD_WIDTH = 300
export const RECAP_EXPORT_PIXEL_RATIO = 3.6

/** Colores de los lomos y de las portadas sin imagen. */
const SPINES = ['#2B211B', '#C68A3D', '#3F5B4E', '#E8C9A0', '#5B7A88', '#8E5A7A', '#FFF8EE', '#6B4E3D', '#E3B37A', '#2E4057', '#D0A0A4']
const PLAIN_COVERS = ['#7A2E3A', '#C68A3D', '#3F5B4E', '#B85C6E', '#5B7A88', '#8E5A7A', '#6B4E3D', '#4E6B5A', '#3D4E6B', '#B07A2E']

const numberFormat = new Intl.NumberFormat('es', { useGrouping: 'always' } as Intl.NumberFormatOptions)
const fmt = (n: number) => numberFormat.format(n)

/** Números "al azar" pero siempre iguales para la misma semilla, así la tarjeta no cambia
 *  entre la vista y la imagen exportada. */
function seeded(seed: number) {
  let s = seed % 233280
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function hash(text: string) {
  let h = 0
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return h
}

/** Portada: la imagen si hay (por el intermediario con CORS, para poder exportarla) o un bloque
 *  de color con el título. Se pide primero la versión de mayor resolución de Google Books
 *  (zoom=3) y, si ese libro no la tiene, la original: la tarjeta se exporta a 3,6 veces su
 *  tamaño y una miniatura chica se ve pixelada, sobre todo en la del favorito. `width` es el
 *  ancho en píxeles que se le pide al intermediario. */
function Cover({
  book,
  showTitle = true,
  style,
  width = 360,
  upgrade = true,
}: {
  book: RecapBook
  showTitle?: boolean
  style?: CSSProperties
  width?: number
  /** false: no pide la versión grande de Google Books (portadas chicas, como en la cuadrícula). */
  upgrade?: boolean
}) {
  const candidates = [book.coverUrl && upgrade ? upgradedSrc(book.coverUrl) : null, book.coverUrl]
    .filter((url): url is string => !!url)
    .map((url) => shareSafeImageUrl(url, width))
    .filter((url): url is string => !!url)
  const [attempt, setAttempt] = useState(0)
  const color = PLAIN_COVERS[hash(book.bookId) % PLAIN_COVERS.length]
  const src = candidates[attempt]
  const hasImage = !!src
  return (
    <div className={`rc-cv${hasImage ? '' : ' plain'}${showTitle ? '' : ' notitle'}`} style={{ ['--c' as string]: color, ...style }}>
      {hasImage ? (
        <img src={src} alt={book.title} crossOrigin="anonymous" onError={() => setAttempt((a) => a + 1)} />
      ) : (
        <span>{book.title}</span>
      )}
    </div>
  )
}

/** Cuadrícula de portadas (V.3.3.1): hasta 30; con más, las primeras 29 y un cuadro "+ N más". */
const COVER_GRID_MAX = 30
/** Ancho máximo de una portada con pocos libros, para que no se estire de más. */
const COVER_GRID_MAX_WIDTH = 118
/** Debajo de este ancho el título de una portada sin imagen ya no se lee: queda solo el color. */
const COVER_GRID_MIN_TITLE_WIDTH = 46

const coverGap = (n: number) => (n <= 8 ? 10 : n <= 16 ? 7 : n <= 28 ? 6 : 5)

/** Prueba todas las columnas posibles y se queda con la que deja la portada (2:3) más ancha
 *  dentro del espacio libre. */
function fitCoverGrid(n: number, width: number, height: number) {
  const gap = coverGap(n)
  let best = { cols: 1, size: 0, gap }
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const size = Math.min((width - (cols - 1) * gap) / cols, ((height - (rows - 1) * gap) / rows) * (2 / 3))
    if (size > best.size + 0.01) best = { cols, size, gap }
  }
  return { ...best, size: Math.max(1, Math.floor(Math.min(best.size, COVER_GRID_MAX_WIDTH))) }
}

function CoverGrid({ books }: { books: RecapBook[] }) {
  const areaRef = useRef<HTMLDivElement>(null)
  const [area, setArea] = useState<{ width: number; height: number } | null>(null)

  // El espacio libre depende del alto del título (una o dos líneas), así que se mide; se vuelve
  // a medir cuando cargan las fuentes. Las portadas no se piden hasta tener la medida, para no
  // pedir cada imagen dos veces con distinto ancho.
  useLayoutEffect(() => {
    const measure = () => {
      const el = areaRef.current
      if (el) setArea({ width: el.clientWidth, height: el.clientHeight })
    }
    measure()
    let alive = true
    document.fonts?.ready.then(() => alive && measure())
    return () => {
      alive = false
    }
  }, [])

  const overflow = books.length > COVER_GRID_MAX
  const shown = overflow ? books.slice(0, COVER_GRID_MAX - 1) : books
  const cells = shown.length + (overflow ? 1 : 0)
  const fit = area ? fitCoverGrid(cells, area.width, area.height) : null

  return (
    <div ref={areaRef} className="rc-pg-area">
      {fit && (
        <div className={`rc-pg-grid${cells <= 8 ? ' few' : ''}`} style={{ gap: fit.gap, width: fit.cols * fit.size + (fit.cols - 1) * fit.gap }}>
          {shown.map((b) => (
            <Cover
              key={b.bookId}
              book={b}
              showTitle={fit.size >= COVER_GRID_MIN_TITLE_WIDTH}
              upgrade={fit.size >= 80}
              width={Math.max(120, Math.ceil((fit.size * RECAP_EXPORT_PIXEL_RATIO) / 60) * 60)}
              style={{
                width: fit.size,
                fontSize: Math.max(7, Math.min(12, fit.size * 0.13)),
                padding: `${fit.size * 0.07}px ${fit.size * 0.06}px ${fit.size * 0.07}px ${fit.size * 0.11}px`,
              }}
            />
          ))}
          {overflow && (
            <div className="rc-pg-more" style={{ width: fit.size }}>
              <b style={{ fontSize: Math.max(11, fit.size * 0.36) }}>+{books.length - shown.length}</b>
              <span style={{ fontSize: Math.max(7, fit.size * 0.17) }}>más</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Foot({ username }: { username: string | null }) {
  return (
    <div className="rc-foot">
      <span className="rc-wm">Teleo</span>
      {username && <span>@{username}</span>}
    </div>
  )
}

function Rosette({ label }: { label: string }) {
  const points: string[] = []
  const n = 28
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? 40 : 46
    const a = (Math.PI * k) / n
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`)
  }
  return (
    <svg className="rc-rosette" viewBox="0 0 100 130" aria-hidden="true">
      <path d="M30 80 L18 128 L34 116 L44 130 L50 84Z M70 80 L82 128 L66 116 L56 130 L50 84Z" fill="var(--oc)" opacity=".9" />
      <polygon points={points.join(' ')} fill="var(--paper)" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="var(--pi)" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="50" y="45" textAnchor="middle" fontFamily="Karla, sans-serif" fontWeight="700" fontSize="9" letterSpacing="1.5" fill="var(--pi)">FAVORITO</text>
      <text x="50" y="64" textAnchor="middle" fontFamily="'Young Serif', serif" fontSize="18" fill="var(--pi)">{label}</text>
    </svg>
  )
}

/** Tamaño de letra para que un nombre de mes largo ("septiembre") entre en el ancho de la
 *  tarjeta: la cursiva de Fraunces mide cerca de medio em por letra. */
function fitSize(text: string, max: number, width: number) {
  return Math.min(max, Math.floor(width / (text.length * 0.5)))
}

const dayOf = (date: string) => parseInt(date.slice(8, 10), 10)
const monthOf = (date: string) => parseInt(date.slice(5, 7), 10)

/** "del 2 al 24 de julio" o "del 28 de junio al 5 de julio". */
function rangeText(from: string, to: string) {
  const fm = MONTH_NAMES[monthOf(from) - 1].toLowerCase()
  const tm = MONTH_NAMES[monthOf(to) - 1].toLowerCase()
  return fm === tm && from.slice(0, 4) === to.slice(0, 4)
    ? `Del ${dayOf(from)} al ${dayOf(to)} de ${tm}`
    : `Del ${dayOf(from)} de ${fm} al ${dayOf(to)} de ${tm}`
}

interface RecapCardProps {
  card: RecapCardId
  recap: RecapData
  tone: RecapTone
  username: string | null
}

/** Una tarjeta de "Tu lectura en Teleo" (V.3.2.0). Desde la V.3.4.1 los textos de las tarjetas
 *  hablan en primera persona ("Mis lecturas", "Mi racha"), porque se comparten en historias. Cada una es un objeto de lectura: estante,
 *  pila de páginas, cuadrícula de portadas (V.3.3.1), estante por meses, burbujas de géneros, ficha de biblioteca, cinta
 *  separadora, portadas releídas, escarapela del favorito y ticket. */
export const RecapCard = forwardRef<HTMLDivElement, RecapCardProps>(function RecapCard({ card, recap, tone, username }, ref) {
  const style = {
    '--pc': tone.bg,
    '--oc': tone.ink,
    '--paper': tone.paper,
    '--paper-ink': tone.paperInk,
    '--pi': tone.accentInk,
  } as CSSProperties
  const isYear = recap.period.kind === 'anio'
  const monthName = recap.period.kind === 'mes' ? MONTH_NAMES[recap.period.month - 1] : ''
  const sofar = isYear ? 'Hasta ahora' : 'Hasta hoy'
  const foot = <Foot username={username} />

  let className = 'rc'
  let body: ReactNode
  switch (card) {
    case 'portada': {
      const rand = seeded(recap.period.year * 13 + (recap.period.kind === 'mes' ? recap.period.month : 0))
      const count = Math.min(isYear ? 13 : 7, Math.max(4, recap.readCount))
      const spines = Array.from({ length: count }, (_, k) => (
        <i
          key={k}
          className={k === count - 3 ? 'lean' : undefined}
          style={{ height: `${62 + rand() * 38}%`, width: 13 + Math.round(rand() * 9), background: SPINES[Math.floor(rand() * SPINES.length)] }}
        />
      ))
      body = (
        <>
          <div className="rc-top">{recap.isOngoing && <span className="rc-stamp">{sofar}</span>}</div>
          <div className="rc-ptitle">
            <span className="tu">Mi</span>
            {isYear ? (
              <span className="yr">{recap.period.year}</span>
            ) : (
              <>
                <span className="yr mes" style={{ fontSize: fitSize(monthName, 62, 252) }}>{monthName.toLowerCase()}</span>
                <span className="yrsmall">{recap.period.year}</span>
              </>
            )}
            <span className="en">en Teleo</span>
          </div>
          <div className="rc-shelf">
            {spines}
            {!isYear && recap.books.slice(0, 4).map((b) => <Cover key={b.bookId} book={b} showTitle={false} />)}
          </div>
          {foot}
        </>
      )
      break
    }

    case 'libros': {
      // V.3.5.1: en el mes, la cifra y el calendario un poco más chicos para que todo quepa entre
      // las zonas que tapa Instagram.
      if (!isYear) className += ' libros-mes'
      const n = Math.min(30, Math.max(3, Math.round(recap.pages / 480)))
      const kicker = isYear ? (recap.isOngoing ? 'Este año, hasta ahora' : 'Este año') : recap.isOngoing ? 'Este mes, hasta hoy' : 'Este mes'
      let days: ReactNode = null
      if (recap.period.kind === 'mes') {
        const total = new Date(recap.period.year, recap.period.month, 0).getDate()
        const read = new Set(recap.readDays.map(dayOf))
        const lastDay = dayOf(recap.end)
        days = (
          <div className="rc-days">
            {Array.from({ length: total }, (_, k) => {
              const d = k + 1
              const cls = d > lastDay ? 'fut' : read.has(d) ? 'on' : undefined
              return <i key={d} className={cls}>{d > lastDay ? '' : d}</i>
            })}
          </div>
        )
      }
      body = (
        <>
          <span className="rc-kicker">{kicker} leí</span>
          <div className="rc-gwrap">
            <div className={`rc-giant${recap.readCount >= 100 ? ' long' : ''}`}>{recap.readCount}</div>
            <div className="rc-giant-l">{recap.readCount === 1 ? 'libro' : 'libros'}</div>
          </div>
          {days}
          {recap.pages > 0 && (
            <div className="rc-pagesrow">
              <div className="rc-tower">
                {Array.from({ length: n }, (_, k) => <i key={k} style={{ transform: `translateX(${((k * 37) % 7) - 3}px)` }} />)}
                <span className="rc-ruler" style={{ height: n * 6 }} />
              </div>
              <div className="rc-pages">
                <b>{fmt(recap.pages)}</b>
                <span>páginas</span>
                <p>
                  {isYear
                    ? `Apiladas, medirían ${formatStackHeight(recap.stackCm)}.`
                    : `Leí ${recap.readDays.length} de ${recap.elapsedDays} ${recap.elapsedDays === 1 ? 'día' : 'días'}.`}
                </p>
              </div>
            </div>
          )}
          {foot}
        </>
      )
      break
    }

    case 'portadas': {
      const kicker = isYear ? (recap.isOngoing ? 'Este año, hasta ahora' : 'Este año') : recap.isOngoing ? 'Este mes, hasta hoy' : 'Este mes'
      const count = recap.books.length
      body = (
        <>
          <div className="rc-pg-top">
            <span className="rc-kicker">{kicker}</span>
            {/* "títulos" y no "libros": cada libro va una vez aunque se haya releído, y la tarjeta
                de libros y páginas sí cuenta las relecturas. */}
            <span className="rc-stamp">{count} {count === 1 ? 'título' : 'títulos'}</span>
          </div>
          <h3 className="rc-pg-title">{isYear ? `Mi ${recap.period.year} en libros` : `Mis lecturas de ${monthName.toLowerCase()}`}</h3>
          <CoverGrid books={recap.books} />
          {foot}
        </>
      )
      break
    }

    case 'meses': {
      const best = recap.bestMonth!
      const months = recap.months ?? []
      const rand = seeded(recap.period.year)
      body = (
        <>
          <span className="rc-kicker">Mi mes más lector</span>
          <div className="rc-monthname" style={{ fontSize: fitSize(MONTH_NAMES[best.month - 1], 58, 252) }}>{MONTH_NAMES[best.month - 1]}</div>
          {best.tiedWith.length > 0 && (
            // Hasta dos meses se nombran; con más, solo cuántos, para que no llegue hasta la etiqueta.
            <div className="rc-tied">
              {best.tiedWith.length <= 2
                ? `Empatado con ${best.tiedWith.map((m) => MONTH_NAMES[m - 1].toLowerCase()).join(' y ')}`
                : `Empatado con ${best.tiedWith.length} meses más`}
            </div>
          )}
          {/* Con un mes de nombre largo, la etiqueta baja para no tapar el nombre. */}
          <div className="rc-sticker" style={MONTH_NAMES[best.month - 1].length > 6 ? { top: 150 } : undefined}>
            <div>
              <b>{best.count}</b>
              <span>{best.count === 1 ? 'libro' : 'libros'}</span>
            </div>
          </div>
          <div className="rc-mshelf">
            {months.map((v, k) => (
              <div key={k} className={`rc-mrow${v === null ? ' fut' : k + 1 === best.month ? ' top' : ''}`}>
                <small>{MONTH_ABBR[k]}</small>
                <div>
                  {v !== null &&
                    Array.from({ length: v }, (_, j) => (
                      <i key={j} style={{ height: `${60 + rand() * 40}%`, background: SPINES[Math.floor(rand() * SPINES.length)] }} />
                    ))}
                </div>
              </div>
            ))}
          </div>
          {foot}
        </>
      )
      break
    }

    case 'generos': {
      const g = recap.topGenres
      const max = g[0]?.count ?? 1
      const size = (v: number) => Math.round(72 + 66 * Math.sqrt(v / max))
      const s = g.map((e) => size(e.count))
      const paceKeys = ['Rápido', 'Medio', 'Lento']
      body = (
        <>
          {g.length > 0 && (
            <>
              <span className="rc-kicker">Lo que más leí</span>
              <div className="rc-bubbles" style={g.length < 3 ? { height: Math.max(...s) + 16 } : undefined}>
                {g[0] && (
                  <div className="rc-bub b1" style={{ width: s[0], height: s[0], left: 0, top: 0, ['--n' as string]: `${Math.round(s[0] / 3.4)}px` }}>
                    <b>{g[0].count}</b>
                    <span>{g[0].label}</span>
                  </div>
                )}
                {g[1] && (
                  <div className="rc-bub b2" style={{ width: s[1], height: s[1], right: 0, top: 12, ['--n' as string]: `${Math.round(s[1] / 3.4)}px` }}>
                    <b>{g[1].count}</b>
                    <span>{g[1].label}</span>
                  </div>
                )}
                {/* La tercera va centrada entre los centros de las dos de arriba (no en el medio de
                    la tarjeta), así se ve alineada aunque la primera sea más grande. */}
                {g[2] && (
                  <div className="rc-bub b3" style={{ width: s[2], height: s[2], left: `calc(50% + ${(s[0] - s[1]) / 4 - s[2] / 2}px)`, top: 232 - s[2], ['--n' as string]: `${Math.round(s[2] / 3.4)}px` }}>
                    <b>{g[2].count}</b>
                    <span>{g[2].label}</span>
                  </div>
                )}
              </div>
            </>
          )}
          {recap.topMoods.length > 0 && (
            <>
              <span className="rc-kicker" style={{ marginTop: 8 }}>Cómo me hicieron sentir</span>
              <div className="rc-moods">
                {recap.topMoods.map((m, k) => (
                  <span key={m.label} className="rc-tape" style={{ transform: `rotate(${[-4, 3, -2][k]}deg)` }}>{m.label}</span>
                ))}
              </div>
            </>
          )}
          {recap.topPace && (
            <div className="rc-pace">
              <span className="rc-kicker">Mi ritmo</span>
              <div className="rc-track">
                {paceKeys.map((p, k) => (
                  <span key={p} className={p === recap.topPace ? 'on' : undefined} style={{ ['--x' as string]: (k * 2 + 1) / 6 }}>{p}</span>
                ))}
              </div>
            </div>
          )}
          <p className="rc-note">
            Según {recap.traitBooks} de mis {recap.traits.total} libros {isYear ? 'este año' : 'este mes'}
          </p>
          {foot}
        </>
      )
      break
    }

    case 'autor': {
      className += ' autor'
      const author = recap.author!
      const shown = author.books.slice(0, 4)
      body = (
        <>
          <span className="rc-kicker">Mi autor del año</span>
          <div className="rc-ficha">
            <div className="hd">
              <span>Ficha de lectura</span>
              <span>{recap.period.year}</span>
            </div>
            <div className="name">{author.name}</div>
            <div className="lined">
              {shown.map((b) => (
                <div key={b.bookId} className="ln">
                  <span>{b.title}</span>
                  <em>{MONTH_ABBR[monthOf(b.endDate) - 1]}</em>
                </div>
              ))}
            </div>
            <span className="rc-stamp">{author.count} libros</span>
          </div>
          <div className="rc-fanrow">
            {shown.map((b) => <Cover key={b.bookId} book={b} />)}
          </div>
          {foot}
        </>
      )
      break
    }

    case 'racha': {
      className += ' racha'
      const streak = recap.streak!
      const year = parseInt(streak.from.slice(0, 4), 10)
      const month = monthOf(streak.from)
      const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7
      const total = new Date(year, month, 0).getDate()
      const prefix = streak.from.slice(0, 8)
      body = (
        <>
          <div className="rc-cinta">
            <b className={streak.days >= 100 ? 'long' : undefined}>{streak.days}</b>
            <span>días<br />seguidos</span>
            <small>Mi racha</small>
          </div>
          <span className="rc-kicker">Mi racha más larga</span>
          <h3>Sin soltar el libro</h3>
          <div className="rc-cal">
            <div className="mt">{MONTH_NAMES[month - 1]} {year}</div>
            <div className="g">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, k) => <span key={k}>{d}</span>)}
              {Array.from({ length: offset }, (_, k) => <i key={`e${k}`} className="e" />)}
              {Array.from({ length: total }, (_, k) => {
                const date = `${prefix}${String(k + 1).padStart(2, '0')}`
                return <i key={k} className={date >= streak.from && date <= streak.to ? 'on' : undefined}>{k + 1}</i>
              })}
            </div>
          </div>
          <p>{rangeText(streak.from, streak.to)}, sin saltarme un día.</p>
          {foot}
        </>
      )
      break
    }

    case 'relecturas': {
      const shown = recap.rereads.slice(0, 3)
      body = (
        <>
          <span className="rc-kicker">Volví a abrir</span>
          <div className="rc-relbig">
            <b>{recap.rereads.length}</b>
            <span>{recap.rereads.length === 1 ? 'relectura' : 'relecturas'}</span>
          </div>
          <div className="rc-ring">
            <svg viewBox="0 0 260 220" aria-hidden="true">
              <ellipse cx="130" cy="112" rx="124" ry="100" />
              <path d="M236 70 l12 -4 l-2 13" style={{ strokeDasharray: 'none' }} />
            </svg>
            <div className="rc-trio">
              {shown.map((b, k) => (
                <div key={`${b.bookId}-${k}`} className="rc-one">
                  <Cover book={b} />
                  <span className="rc-badge">{b.time}.ª</span>
                </div>
              ))}
            </div>
          </div>
          {foot}
        </>
      )
      break
    }

    case 'favorito': {
      className += ' favorito'
      const fav = recap.favorite!
      body = (
        <>
          <span className="rc-kicker">Mi favorito</span>
          <p className="rc-favh">{isYear ? `de ${recap.period.year}` : `de ${monthName.toLowerCase()}`}</p>
          <div className="rc-favwrap">
            <Cover book={fav} width={720} />
            <Rosette label={isYear ? String(recap.period.year) : MONTH_ABBR[(recap.period.kind === 'mes' ? recap.period.month : 1) - 1].toUpperCase()} />
          </div>
          <div className="rc-favtitle">{fav.title}</div>
          {fav.author && <div className="rc-favauthor">{fav.author}</div>}
          {foot}
        </>
      )
      break
    }

    case 'cierre': {
      className += ' cierre'
      const lines: [string, string | number][] = [['Libros', recap.readCount]]
      if (recap.pages > 0) lines.push(['Páginas', fmt(recap.pages)])
      if (recap.bestMonth) lines.push(['Mes lector', MONTH_NAMES[recap.bestMonth.month - 1]])
      if (!isYear) lines.push(['Días con lectura', recap.readDays.length])
      if (recap.cards.includes('generos')) {
        if (recap.topGenres[0]) lines.push(['Género', recap.topGenres[0].label])
        if (recap.topMoods[0]) lines.push(['Ánimo', recap.topMoods[0].label])
      }
      if (recap.streak && isYear) lines.push(['Racha', `${recap.streak.days} días`])
      if (recap.author) lines.push(['Autor', recap.author.name])
      if (recap.rereads.length > 0 && isYear) lines.push(['Relecturas', recap.rereads.length])
      // V.3.4.1: el favorito (o, si no hay, el último terminado) va como una línea más, igual
      // que Autor, y su título se ve completo aunque ocupe más de un renglón.
      const lastTitle = recap.favorite?.title ?? recap.books[recap.books.length - 1]?.title
      if (lastTitle) lines.push([recap.favorite ? 'Favorito' : 'Último', lastTitle])
      body = (
        <>
          <div className="rc-ticket">
            <div className="tc">
              <div className="brand">Teleo</div>
              <div className="sub">Ticket de lectura</div>
              <div className="sub">
                {isYear ? recap.period.year : `${monthName} ${recap.period.year}`}
                {recap.isOngoing ? ` · ${sofar.toLowerCase()}` : ''}
              </div>
            </div>
            <hr />
            {lines.map(([label, value]) => (
              <div key={label} className={label === 'Favorito' || label === 'Último' ? 'li li-wrap' : 'li'}>
                <span>{label}</span>
                <i />
                <b>{value}</b>
              </div>
            ))}
            <hr />
            <div className="rc-barcode" />
            {username && <div className="thanks">@{username}</div>}
          </div>
          {foot}
        </>
      )
      break
    }
  }

  return (
    <div ref={ref} className={className} style={style}>
      {body}
    </div>
  )
})
