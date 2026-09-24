import { Sheet } from '../atoms/Sheet'
import { Button } from '../atoms/Button'
import { ANNOUNCEMENT_VERSION, announcementItems } from '../../../lib/announcement'

interface AnnouncementSheetProps {
  /** Se llama al tocar "Empezar" o al cerrar la hoja: en los dos casos queda como vista. */
  onDone: () => void
}

/** "Novedades de Teleo": aparece una sola vez por cuenta al entrar a La mesa después de un
 *  lanzamiento grande (V.2.0.0). Una tarjeta por novedad con su ícono y una línea. */
export function AnnouncementSheet({ onDone }: AnnouncementSheetProps) {
  return (
    <Sheet title="Novedades de Teleo" onClose={onDone}>
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 rounded-full bg-primary text-primary-ink text-body-sm font-bold tabular-nums">
          V.{ANNOUNCEMENT_VERSION}
        </span>
        <p className="text-body-md text-text-secondary">Esto es lo nuevo en tu rincón de lectura.</p>
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
