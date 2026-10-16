import { forwardRef, useState, type CSSProperties, type ReactNode } from 'react'
import { MONTH_ABBR, MONTH_NAMES } from '../../../lib/months'
import { formatStackHeight, type RecapBook, type RecapCardId, type RecapData } from '../../../lib/recap'
import { shareSafeImageUrl } from '../../../lib/shareImage'
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

function Spark({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <svg className="rc-spark" style={{ left: `${x}%`, top: `${y}%`, width: size }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C13 8 16 11 24 12C16 13 13 16 12 24C11 16 8 13 0 12C8 11 11 8 12 0Z" />
    </svg>
  )
}

/** Portada: la imagen si hay (por el intermediario con CORS, para poder exportarla) o un bloque
 *  de color con el título. */
function Cover({ book, showTitle = true, style }: { book: RecapBook; showTitle?: boolean; style?: CSSProperties }) {
  const src = shareSafeImageUrl(book.coverUrl, 300)
  const [failed, setFailed] = useState(false)
  const color = PLAIN_COVERS[hash(book.bookId) % PLAIN_COVERS.length]
  const hasImage = src && !failed
  return (
    <div className={`rc-cv${hasImage ? '' : ' plain'}${showTitle ? '' : ' notitle'}`} style={{ ['--c' as string]: color, ...style }}>
      {hasImage ? (
        <img src={src} alt={book.title} crossOrigin="anonymous" onError={() => setFailed(true)} />
      ) : (
        <span>{book.title}</span>
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

/** Una tarjeta de "Tu lectura en Teleo" (V.3.2.0). Cada una es un objeto de lectura: estante,
 *  pila de páginas, estante por meses, burbujas de géneros, ficha de biblioteca, cinta
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
          <Spark x={12} y={64} size={14} />
          <div className="rc-top">{recap.isOngoing && <span className="rc-stamp">{sofar}</span>}</div>
          <div className="rc-ptitle">
            <span className="tu">Tu</span>
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
          <Spark x={80} y={8} size={18} />
          <Spark x={90} y={20} size={10} />
          <span className="rc-kicker">{kicker} leíste</span>
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
                    : `Leíste ${recap.readDays.length} de ${recap.elapsedDays} ${recap.elapsedDays === 1 ? 'día' : 'días'}.`}
                </p>
              </div>
            </div>
          )}
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
          <span className="rc-kicker">Tu mes más lector</span>
          <div className="rc-monthname" style={{ fontSize: fitSize(MONTH_NAMES[best.month - 1], 58, 252) }}>{MONTH_NAMES[best.month - 1]}</div>
          {best.tiedWith.length > 0 && (
            <div className="rc-tied">Empatado con {best.tiedWith.map((m) => MONTH_NAMES[m - 1].toLowerCase()).join(' y ')}</div>
          )}
          {/* Con un mes de nombre largo, la etiqueta baja para no tapar el nombre. */}
          <div className="rc-sticker" style={MONTH_NAMES[best.month - 1].length > 6 ? { top: 104 } : undefined}>
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
          <Spark x={88} y={6} size={14} />
          {g.length > 0 && (
            <>
              <span className="rc-kicker">Lo que más leíste</span>
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
                {g[2] && (
                  <div className="rc-bub b3" style={{ width: s[2], height: s[2], left: `calc(50% - ${s[2] / 2}px)`, top: 232 - s[2], ['--n' as string]: `${Math.round(s[2] / 3.4)}px` }}>
                    <b>{g[2].count}</b>
                    <span>{g[2].label}</span>
                  </div>
                )}
              </div>
            </>
          )}
          {recap.topMoods.length > 0 && (
            <>
              <span className="rc-kicker" style={{ marginTop: 8 }}>Cómo te hicieron sentir</span>
              <div className="rc-moods">
                {recap.topMoods.map((m, k) => (
                  <span key={m.label} className="rc-tape" style={{ transform: `rotate(${[-4, 3, -2][k]}deg)` }}>{m.label}</span>
                ))}
              </div>
            </>
          )}
          {recap.topPace && (
            <div className="rc-pace">
              <span className="rc-kicker">Tu ritmo</span>
              <div className="rc-track">
                {paceKeys.map((p, k) => (
                  <span key={p} className={p === recap.topPace ? 'on' : undefined} style={{ ['--x' as string]: (k * 2 + 1) / 6 }}>{p}</span>
                ))}
              </div>
            </div>
          )}
          <p className="rc-note">
            Según {recap.traitBooks} de tus {recap.traits.total} libros {isYear ? 'este año' : 'este mes'}
          </p>
          {foot}
        </>
      )
      break
    }

    case 'autor': {
      const author = recap.author!
      const shown = author.books.slice(0, 4)
      body = (
        <>
          <Spark x={84} y={6} size={16} />
          <span className="rc-kicker">Tu autor del año</span>
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
            <small>Tu racha</small>
          </div>
          <Spark x={88} y={58} size={14} />
          <span className="rc-kicker">Tu racha más larga</span>
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
          <p>{rangeText(streak.from, streak.to)}, sin saltarte un día.</p>
          {foot}
        </>
      )
      break
    }

    case 'relecturas': {
      const shown = recap.rereads.slice(0, 3)
      body = (
        <>
          <Spark x={80} y={14} size={18} />
          <Spark x={10} y={46} size={12} />
          <span className="rc-kicker">Volviste a abrir</span>
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
          <Spark x={12} y={20} size={20} />
          <Spark x={84} y={62} size={16} />
          <Spark x={18} y={70} size={10} />
          <Spark x={76} y={12} size={10} />
          <span className="rc-kicker">Tu favorito</span>
          <p className="rc-favh">{isYear ? `de ${recap.period.year}` : `de ${monthName.toLowerCase()}`}</p>
          <div className="rc-favwrap">
            <Cover book={fav} />
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
      const last = recap.favorite ? ['Favorito', recap.favorite.title] : ['Último', recap.books[recap.books.length - 1]?.title ?? '']
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
              <div key={label} className="li">
                <span>{label}</span>
                <i />
                <b>{value}</b>
              </div>
            ))}
            <hr />
            <div className="tot">
              <span>{last[0]}</span>
              <span>{last[1]}</span>
            </div>
            <div className="rc-barcode" />
            <div className="thanks">{username ? `@${username} · ` : ''}Gracias por leer</div>
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
