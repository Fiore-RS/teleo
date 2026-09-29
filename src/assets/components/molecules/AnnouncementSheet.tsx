import { History } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { ANNOUNCEMENT_VERSION, announcementItems, CATCH_UP_MIN } from '../../../lib/announcement'
import type { ChangelogEntry } from '../../../lib/changelog'

interface AnnouncementSheetProps {
  /** Se llama al tocar "Empezar" o al cerrar la hoja: en los dos casos queda como vista. */
  onDone: () => void
  /** Versiones con anuncio que la persona no vio (de la más nueva a la más vieja). */
  missed?: ChangelogEntry[]
  /** Última versión que la persona vio, si se sabe. */
  lastSeen?: string | null
  /** Botón "Ver todas las novedades" del aviso de novedades acumuladas. */
  onSeeAll?: () => void
}

/** Aviso de novedades acumuladas (V.2.1.2): si la persona se perdió varias versiones con
 *  anuncio, se le cuenta cuáles fueron y se le invita a verlas en Novedades. */
function CatchUpCard({ missed, lastSeen, onSeeAll }: { missed: ChangelogEntry[]; lastSeen: string | null; onSeeAll: () => void }) {
  return (
    <section className="bg-magenta-tint border border-border rounded-2xl p-4 mb-4">
      <h3 className="flex items-center gap-2 font-display font-semibold text-body-lg text-text">
        <History size={18} className="text-magenta-text shrink-0" aria-hidden="true" />
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
            <span className="shrink-0 px-2 py-0.5 rounded-full bg-magenta-soft text-magenta-text text-[12px] font-bold tabular-nums">
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
 *  lanzamiento grande (V.2.0.0). Una tarjeta por novedad con su ícono y una línea. */
export function AnnouncementSheet({ onDone, missed = [], lastSeen = null, onSeeAll }: AnnouncementSheetProps) {
  const showCatchUp = missed.length >= CATCH_UP_MIN && !!onSeeAll
  return (
    <Sheet title="Novedades de Teleo" onClose={onDone}>
      {showCatchUp && <CatchUpCard missed={missed} lastSeen={lastSeen} onSeeAll={onSeeAll} />}

      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-full bg-primary text-primary-ink text-body-sm font-bold tabular-nums">
          V.{ANNOUNCEMENT_VERSION}
        </span>
        <p className="text-body-md text-text-secondary">
          {showCatchUp ? 'Lo más reciente:' : 'Esto es lo nuevo en tu rincón de lectura.'}
        </p>
      </div>

      <ul className="flex flex-col gap-2.5 stagger-children">
        {announcementItems.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 bg-surface-2 border border-border rounded-2xl p-3.5">
            <span className="w-9 h-9 shrink-0 rounded-full bg-primary-soft text-primary-text flex items-center justify-center">
              <Icon size={17} />
            </span>
            <span className="min-w-0">
              <span className="block font-display font-semibold text-body-md text-text">{title}</span>
              <span className="block text-body-sm text-text-secondary mt-0.5">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-body-sm text-text-muted text-center mt-4">
        Puedes volver a verlo cuando quieras en Configuración, en Novedades.
      </p>
      <Button variant="primary" className="mt-4" onClick={onDone}>
        Empezar
      </Button>
    </Sheet>
  )
}
