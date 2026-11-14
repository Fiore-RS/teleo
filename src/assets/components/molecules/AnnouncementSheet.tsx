import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Sheet } from '../atoms/Sheet'
import { useBreakpoint } from '../../../hooks/useBreakpoint'
import { Button } from '../atoms/Button'
import { ANNOUNCEMENT_VERSION, announcementItems, CATCH_UP_MIN } from '../../../lib/announcement'
import { changelog, type ChangelogEntry } from '../../../lib/changelog'

interface AnnouncementSheetProps {
  /** Se llama al tocar "Empezar" o al cerrar la hoja: en los dos casos queda como vista. */
  onDone: () => void
  /** Versiones con anuncio que la persona no vio (de la más nueva a la más vieja). */
  missed?: ChangelogEntry[]
  /** Última versión que la persona vio, si se sabe. */
  lastSeen?: string | null
  /** Botón "Ver todas las novedades" del aviso de novedades acumuladas. */
  onSeeAll?: () => void
  /** V.3.3.0: cierra la hoja y empieza el tutorial (el recorrido sobre la app). */
  onStartTour?: () => void
}

/** Aviso de novedades acumuladas (V.2.1.2): si la persona se perdió varias versiones con
 *  anuncio, se le cuenta cuáles fueron y se le invita a verlas en Novedades. */
function CatchUpCard({ missed, lastSeen, onSeeAll }: { missed: ChangelogEntry[]; lastSeen: string | null; onSeeAll: () => void }) {
  return (
    <section className="bg-magenta-tint border border-border rounded-2xl p-4 mb-4">
      <h3 className="font-display font-semibold text-body-lg text-text">
        ¡Cuánto tiempo!
      </h3>
      <p className="text-body-sm text-text-secondary mt-1.5 text-pretty">
        {lastSeen ? (
          <>La última versión que viste fue la <span className="font-bold text-text">V.{lastSeen}</span>. Desde entonces hubo </>
        ) : (
          <>Desde tu última visita hubo </>
        )}
        <span className="font-bold text-text">{missed.length} actualizaciones importantes</span>:
      </p>
      <ul className="flex flex-col gap-1.5 mt-2.5">
        {missed.map((entry) => (
          <li key={entry.version} className="flex items-center gap-2 text-body-sm text-text">
            <span className="shrink-0 px-2 py-0.5 rounded-chip bg-magenta-soft text-magenta-text text-[12px] font-bold tabular-nums">
              V.{entry.version}
            </span>
            <span className="min-w-0 truncate">{entry.title}</span>
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
export function AnnouncementSheet({ onDone, missed = [], lastSeen = null, onSeeAll, onStartTour }: AnnouncementSheetProps) {
  const showCatchUp = missed.length >= CATCH_UP_MIN && !!onSeeAll
  const announcedTitle = changelog.find((e) => e.version === ANNOUNCEMENT_VERSION)?.title
  const breakpoint = useBreakpoint()

  if (breakpoint !== 'celular') {
    return (
      <AnnouncementLetter
        onDone={onDone}
        title={announcedTitle}
        catchUp={showCatchUp && onSeeAll ? <CatchUpCard missed={missed} lastSeen={lastSeen} onSeeAll={onSeeAll} /> : null}
        onStartTour={onStartTour}
      />
    )
  }

  return (
    <Sheet abajo title="Novedades de Teleo" onClose={onDone}>
      {showCatchUp && <CatchUpCard missed={missed} lastSeen={lastSeen} onSeeAll={onSeeAll} />}

      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-chip bg-primary text-primary-ink text-body-sm font-bold tabular-nums">
          V.{ANNOUNCEMENT_VERSION}
        </span>
        {announcedTitle && <h3 className="font-title text-[22px] leading-tight text-text">{announcedTitle}</h3>}
      </div>
      <p className="text-body-md text-text-secondary mt-2 mb-4">
        {showCatchUp ? 'Lo más reciente:' : 'Esto es lo nuevo en tu rincón de lectura.'}
      </p>

      <ul className="flex flex-col gap-2.5 stagger-children">
        {announcementItems.map(({ title, text }) => (
          <li key={title} className="bg-surface-2 border border-border rounded-2xl p-3.5">
            <span className="block font-display font-semibold text-body-md text-text">{title}</span>
            <span className="block text-body-sm text-text-secondary mt-0.5">{text}</span>
          </li>
        ))}
      </ul>

      {onStartTour && (
        <section className="bg-surface-2 border border-border rounded-2xl p-4 mt-4">
          <p className="font-display font-semibold text-body-md text-text">¿Lo pruebas?</p>
          <p className="text-body-sm text-text-secondary mt-1">El tutorial te muestra cada parte de Teleo en menos de un minuto.</p>
          <Button variant="soft" className="mt-3" onClick={onStartTour}>
            Ver el tutorial
          </Button>
        </section>
      )}

      <p className="text-body-sm text-text-muted text-center mt-4">
        Puedes volver a verlo cuando quieras en Configuración, en Novedades.
      </p>
      <Button variant="primary" className="mt-4" onClick={onDone}>
        Empezar
      </Button>
    </Sheet>
  )
}

/** La ventana de novedades en tableta y computadora (V.4.3.0, lienzo "Ventana de novedades",
 *  elegida "Una carta sobre la mesa"): una carta que sale de su sobre, un poco torcida sobre la
 *  mesa, con una estampilla con el número de la versión y las novedades numeradas en dos
 *  columnas. Se distingue de las hojas de trabajo porque es un momento especial. Velo encima de
 *  todo; se cierra con "Empezar", tocando el velo o con Esc (en los tres casos queda vista). */
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
  // "4.3.0" › "4.3" para la estampilla.
  const stamp = ANNOUNCEMENT_VERSION.split('.').slice(0, 2).join('.')

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pl-[calc(var(--tapa-ancho)+1.5rem)]" role="dialog" aria-modal="true" aria-label="Novedades de Teleo">
      <div className="absolute inset-0 bg-black/35 animate-fade-in" onClick={onDone} />
      <div className="relative w-full max-w-190 animate-carta-in">
        <div className="relative -rotate-[0.8deg]">
          {/* El sobre, detrás de la carta, con la solapa abierta en V. */}
          <div
            aria-hidden="true"
            className="absolute -left-6.5 -right-6.5 -bottom-8.5 h-[220px] rounded-md bg-orange-soft shadow-[0_24px_40px_-20px_rgba(0,0,0,0.5)]"
            style={{ clipPath: 'polygon(0 0, 50% 46%, 100% 0, 100% 100%, 0 100%)' }}
          />
          <div className="relative max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-md bg-surface px-14 pt-11 pb-8.5 shadow-[0_24px_44px_-24px_rgba(60,30,20,0.6)]">
            {/* Estampilla con el número de la versión. */}
            <span
              aria-hidden="true"
              className="absolute top-6.5 right-7.5 w-16 h-[76px] rounded border-2 border-dashed border-ornament bg-magenta-tint flex items-center justify-center font-title text-[26px] text-primary-text rotate-[4deg]"
            >
              {stamp}
            </span>
            {catchUp && <div className="mr-24">{catchUp}</div>}
            <p className="smallcaps text-text-muted">Novedades de Teleo · V.{ANNOUNCEMENT_VERSION}</p>
            {title && <h2 className="mt-2 font-title text-[38px] leading-tight text-text pr-24">{title}</h2>}
            <p className="mt-2.5 mb-6.5 font-display italic text-[18px] text-text-secondary">
              {catchUp ? 'Lo más reciente:' : 'Esto es lo nuevo en tu rincón de lectura.'}
            </p>
            <ol className={`${breakpoint === 'escritorio' ? 'columns-2 gap-x-10' : ''} stagger-children`}>
              {announcementItems.map(({ title: itemTitle, text }, i) => (
                <li key={itemTitle} className="grid grid-cols-[34px_1fr] gap-2.5 break-inside-avoid mb-4.5">
                  <span aria-hidden="true" className="font-title text-[24px] leading-none text-ornament">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block font-display font-semibold text-[18px] text-text">{itemTitle}</span>
                    <span className="block mt-0.5 text-body-md leading-snug text-text-secondary">{text}</span>
                  </span>
                </li>
              ))}
            </ol>
            {onStartTour && (
              <section className="bg-surface-2 border border-border rounded-2xl p-4 mt-2">
                <p className="font-display font-semibold text-body-md text-text">¿Lo pruebas?</p>
                <p className="text-body-sm text-text-secondary mt-1">El tutorial te muestra cada parte de Teleo en menos de un minuto.</p>
                <Button variant="soft" className="mt-3" onClick={onStartTour}>
                  Ver el tutorial
                </Button>
              </section>
            )}
            <div className="flex items-center justify-between gap-5 mt-2.5 pt-4.5 border-t border-dashed border-border">
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
