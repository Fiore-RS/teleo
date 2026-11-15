interface RecapEntryRowProps {
  label: string
  onClick: () => void
}

/** Botón que abre "Tu lectura en Teleo" desde Bitácora › Resumen (V.3.2.0). Una píldora con
 *  contorno rosa a todo el ancho de la hoja, debajo del mes o el año: discreta, para no competir con los libros
 *  (elegido por Fiorella entre tres opciones, 15 oct 2026). V.4.5.1: sin ícono, solo texto, y el
 *  mismo en todos los tamaños. */
export function RecapEntryRow({ label, onClick }: RecapEntryRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center rounded-button border-[1.5px] border-pink-text text-pink-text px-4 py-2.5 font-body font-bold text-body-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      {label}
    </button>
  )
}
