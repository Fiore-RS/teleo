import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { Button } from '../atoms/Button'
import { ANNOUNCEMENT_VERSION, announcementItems, CATCH_UP_MIN } from '../../../lib/announcement'
import { majorOf, versionOf, type ChangelogVersion } from '../../../lib/changelog'

interface AnnouncementSheetProps {
  /** Se llama al tocar "Empezar" o al cerrar la hoja: en los dos casos queda como vista. */
  onDone: () => void
  /** Versiones grandes con anuncio que la persona no vio (de la más nueva a la más vieja). */
  missed?: ChangelogVersion[]
  /** Última versión que la persona vio, si se sabe (ya no se muestra: el aviso nombra versiones grandes). */
  lastSeen?: string | null
  /** Botón "Ver todas las novedades" del aviso de novedades acumuladas. */
  onSeeAll?: () => void
  /** V.3.3.0: cierra la hoja y empieza el tutorial (el recorrido sobre la app). */
  onStartTour?: () => void
}

/** Aviso de novedades acumuladas (V.2.1.2): si la persona se perdió varias versiones con
 *  anuncio, se le cuenta cuáles fueron y se le invita a verlas en Novedades. Desde que
 *  Novedades agrupa por versión grande, se cuentan y se nombran versiones grandes. */
function CatchUpCard({ missed, onSeeAll }: { missed: ChangelogVersion[]; onSeeAll: () => void }) {
  const celular = useBreakpoint() === 'celular'
  // Celular (V.4.5.0): dentro de la carta, más compacto, a todo el ancho y con un enlace en vez
  // del botón grande; las versiones en una sola columna, más chicas.
  if (celular) {
    return (
      <section className="bg-magenta-tint border border-border rounded-xl px-3.5 py-3 mb-4">
        <h3 className="font-display font-semibold text-body-md text-text">¡Cuánto tiempo!</h3>
        <p className="text-[13px] leading-snug text-text-secondary mt-1 text-pretty">
          Desde tu última visita hubo novedades importantes en <span className="font-bold text-text">{missed.length} versiones</span>:
        </p>
        <ul className="flex flex-col gap-1 mt-2">
          {missed.map((v) => (
            <li key={v.major} className="flex items-baseline gap-2 text-[13px] text-text min-w-0">
              <span className="shrink-0 font-bold text-magenta-text tabular-nums">Versión {v.major}</span>
              <span className="min-w-0 truncate">{v.title}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onSeeAll}
          className="mt-2.5 inline-flex items-center font-body font-bold text-[13.5px] text-magenta-text rounded-chip focus-visible:outline-2 focus-visible:outline-primary-text"
        >
          Ver todas las novedades ›
        </button>
      </section>
    )
  }
  return (
    <section className="bg-magenta-tint border border-border rounded-2xl p-4 mb-4">
      <h3 className="font-display font-semibold text-body-lg text-text">
        ¡Cuánto tiempo!
      </h3>
      <p className="text-body-sm text-text-secondary mt-1.5 text-pretty">
        Desde tu última visita hubo novedades importantes en <span className="font-bold text-text">{missed.length} versiones</span>:
      </p>
      <ul className="flex flex-col gap-1.5 mt-2.5">
        {missed.map((v) => (
          <li key={v.major} className="flex items-center gap-2 text-body-sm text-text">
            <span className="shrink-0 px-2 py-0.5 rounded-chip bg-magenta-soft text-magenta-text text-[12px] font-bold tabular-nums">
              Versión {v.major}
            </span>
            <span className="min-w-0 truncate">{v.title}</span>
          </li>
        ))}
      </ul>
      <Button variant="soft" className="mt-3.5" onClick={onSeeAll}>
        Ver todas las novedades
      </Button>
    </section>
  )
}

/** "Novedades de Teleo": aparece una sola vez por cuenta al entrar a La mesa después de un
 *  lanzamiento grande (V.2.0.0). Una tarjeta por novedad con su título y una línea (sin
 *  ícono desde la V.3.3.0). */
export function AnnouncementSheet({ onDone, missed = [], onSeeAll, onStartTour }: AnnouncementSheetProps) {
  const showCatchUp = missed.length >= CATCH_UP_MIN && !!onSeeAll
  const announcedTitle = versionOf(ANNOUNCEMENT_VERSION)?.title

  // La carta sobre la mesa en todos los tamaños (tableta y computadora desde la V.4.3.0;
  // celular desde la V.4.5.0, en lugar de la hoja que bajaba).
  return (
    <AnnouncementLetter
      onDone={onDone}
      title={announcedTitle}
      catchUp={showCatchUp && onSeeAll ? <CatchUpCard missed={missed} onSeeAll={onSeeAll} /> : null}
      onStartTour={onStartTour}
    />
  )
}

/** La ventana de novedades en tableta y computadora (V.4.3.0, lienzo "Ventana de novedades",
 *  elegida "Una carta sobre la mesa"): una carta que sale de su sobre, un poco torcida sobre la
 *  mesa, con una estampilla con el número de la versión y las novedades numeradas en dos
 *  columnas. Se distingue de las hojas de trabajo porque es un momento especial. Velo encima de
 *  todo; se cierra con "Empezar", tocando el velo o con Esc (en los tres casos queda vista).
 *
 *  V.4.5.0: también en el celular. La carta mide lo que lleva, hasta un alto máximo según la
 *  pantalla; si no cabe, las novedades se desplazan por dentro y el pie (la nota y "Empezar") y
 *  el sobre siguen a la vista, en todos los tamaños. */
function AnnouncementLetter({
  onDone,
  title,
  catchUp,
  onStartTour,
}: {
  onDone: () => void
  title?: string
  catchUp: React.ReactNode
  onStartTour?: () => void
}) {
  const breakpoint = useBreakpoint()
  // La estampilla lleva solo el número de la versión grande: "4.5.0" › "4".
  const stamp = String(majorOf(ANNOUNCEMENT_VERSION))

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDone()
    }
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = before
      document.removeEventListener('keydown', onKey)
    }
  }, [onDone])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 tableta:p-6 tableta:pl-[calc(var(--tapa-ancho)+1.5rem)]"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 24px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 40px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Novedades de Teleo"
    >
      <div className="absolute inset-0 bg-black/35 animate-fade-in" onClick={onDone} />
      <div className="relative w-full max-w-190 animate-carta-in">
        <div className="relative -rotate-[0.8deg]">
          {/* El sobre, detrás de la carta, con la solapa abierta en V. */}
          <div
            aria-hidden="true"
            className="absolute -left-3 -right-3 -bottom-6 h-[140px] tableta:-left-6.5 tableta:-right-6.5 tableta:-bottom-8.5 tableta:h-[220px] rounded-md bg-orange-soft shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)]"
            style={{ clipPath: 'polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)' }}
          />
          <div
            className="relative flex flex-col rounded-md bg-surface shadow-[0_24px_44px_-24px_rgba(60,30,20,0.6)]"
            style={{
              maxHeight:
                breakpoint === 'celular'
                  ? 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 6.5rem)'
                  : 'calc(100dvh - 7rem)',
            }}
          >
            {/* Estampilla con el número de la versión. */}
            <span
              aria-hidden="true"
              className="absolute z-10 top-4 right-4 w-12 h-[58px] text-[19px] tableta:top-6.5 tableta:right-7.5 tableta:w-16 tableta:h-[76px] tableta:text-[26px] rounded border-2 border-dashed border-ornament bg-magenta-tint flex items-center justify-center font-title text-primary-text rotate-[4deg]"
            >
              {stamp}
            </span>
            {/* Lo que se desplaza por dentro si la carta no cabe. */}
            <div className="min-h-0 overflow-y-auto px-5 pt-7 tableta:px-14 tableta:pt-11">
            {/* En pantallas grandes el aviso de varias versiones va arriba, al lado de la
                estampilla; en el celular, debajo del título y a todo el ancho. */}
            {catchUp && breakpoint !== 'celular' && <div className="mr-24">{catchUp}</div>}
            <p className="smallcaps text-text-muted pr-14 tableta:pr-0">Novedades de Teleo · Versión {stamp}</p>
            {title && <h2 className="mt-2 font-title text-[28px] tableta:text-[38px] leading-tight text-text pr-14 tableta:pr-24">{title}</h2>}
            {catchUp && breakpoint === 'celular' && <div className="mt-4">{catchUp}</div>}
            <p className="mt-2 tableta:mt-2.5 mb-5 tableta:mb-6.5 font-display italic text-[16.5px] tableta:text-[18px] text-text-secondary">
              {catchUp ? 'Lo más reciente:' : 'Esto es lo nuevo en tu rincón de lectura.'}
            </p>
            <ol className={`${breakpoint === 'escritorio' ? 'columns-2 gap-x-10' : ''} stagger-children`}>
              {announcementItems.map(({ title: itemTitle, text }, i) => (
                <li key={itemTitle} className="grid grid-cols-[24px_1fr] tableta:grid-cols-[34px_1fr] gap-2.5 break-inside-avoid mb-4 tableta:mb-4.5">
                  <span aria-hidden="true" className="font-title text-[21px] tableta:text-[24px] leading-none text-ornament">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-display font-semibold text-[16.5px] tableta:text-[18px] text-text">{itemTitle}</span>
                    <span className="block mt-0.5 text-body-md leading-snug text-text-secondary">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
            {onStartTour && (
              <section className="bg-surface-2 border border-border rounded-2xl p-4 mt-2 mb-4">
                <p className="font-display font-semibold text-body-md text-text">¿Lo pruebas?</p>
                <p className="text-body-sm text-text-secondary mt-1">El tutorial te muestra cada parte de Teleo en menos de un minuto.</p>
                <Button variant="soft" className="mt-3" onClick={onStartTour}>
                  Ver el tutorial
                </Button>
              </section>
            )}
            </div>
            {/* El pie, siempre a la vista. */}
            <div className="shrink-0 mx-5 tableta:mx-14 pt-4 tableta:pt-4.5 pb-5 tableta:pb-8.5 flex flex-col tableta:flex-row tableta:items-center tableta:justify-between gap-3 tableta:gap-5 border-t border-dashed border-border">
              <p className="text-body-sm text-text-muted">Puedes volver a verlo cuando quieras en Configuración, en Novedades.</p>
              <div className="shrink-0">
                <Button variant="primary" onClick={onDone}>
                  Empezar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
