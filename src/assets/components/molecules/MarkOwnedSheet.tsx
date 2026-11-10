import { useUnownedPhysical } from '../../../hooks/useUnownedPhysical'
import { ConfirmSheet } from './ConfirmSheet'

interface MarkOwnedSheetProps {
  userId: string | undefined
  /** "offer": la hoja que sale una sola vez en Mesa. "settings": el atajo de Configuración. */
  mode: 'offer' | 'settings'
  onClose: () => void
}

/** "Lo tengo" para la biblioteca que ya existía (V.3.7.0): marca de una vez todos los libros
 *  físicos que no están en Deseados. Después se le quita la marca a los que eran prestados o
 *  de biblioteca, desde Editar libro. */
export function MarkOwnedSheet({ userId, mode, onClose }: MarkOwnedSheetProps) {
  const { count, isLoading, isMarking, markAll } = useUnownedPhysical(userId)

  if (isLoading) return null

  if (count === 0) {
    return (
      <ConfirmSheet
        title="Ya están todos marcados"
        message="Todos tus libros físicos que no están en Deseados ya tienen Lo tengo."
        confirmLabel="Entendido"
        onClose={onClose}
      />
    )
  }

  const books = count === 1 ? '1 libro' : `${count} libros`

  return (
    <ConfirmSheet
      title="¿Marcamos tus libros físicos como tuyos?"
      message={
        <>
          <p>
            {count === 1
              ? 'Tienes 1 libro en formato físico que no está en Deseados. Podemos marcarlo con Lo tengo, y si era prestado o de biblioteca, le quitas la marca después.'
              : `Tienes ${books} en formato físico que no están en Deseados. Podemos marcarlos con Lo tengo, y después le quitas la marca a los que eran prestados o de biblioteca.`}
          </p>
          {mode === 'offer' && <p className="mt-2 text-body-sm text-text-muted">Si prefieres hacerlo después, está en Configuración, en Tus datos.</p>}
        </>
      }
      confirmLabel={count === 1 ? 'Marcar el libro' : `Marcar los ${count}`}
      cancelLabel={mode === 'offer' ? 'Ahora no' : 'Cancelar'}
      isLoading={isMarking}
      onConfirm={async () => {
        await markAll()
        onClose()
      }}
      onClose={onClose}
    />
  )
}
