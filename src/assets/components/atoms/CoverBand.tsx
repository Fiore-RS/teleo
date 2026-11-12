/** Tapa del cuaderno en el teléfono (V.3.8.0): franja del color principal del tema arriba de
 *  La mesa, Estante, Cuaderno y Bitácora, con la textura de puntos y la costura punteada de la
 *  barra lateral de escritorio. Es decorativa y se va con la página al bajar. Va recta de lado
 *  a lado, sin esquinas redondeadas.
 *
 *  Ocupa todo el ancho: se pone como primer hijo del contenedor de la pantalla (que lleva
 *  px-4 pt-4) y se sale de ese padding con -mx-4 -mt-4. En el iPhone instalado el
 *  safe-area de arriba se suma al alto, así la tapa también pinta detrás de la barra de estado.
 *
 *  La cinta de la racha (StreakRibbon) usa COVER_BAND_HEIGHT para empezar arriba de la tapa y
 *  pasarle por encima. */
export const COVER_BAND_HEIGHT = 22

export function CoverBand() {
  return (
    <div
      aria-hidden="true"
      className="relative -mx-4 -mt-4 bg-cover"
      style={{
        height: `calc(${COVER_BAND_HEIGHT}px + env(safe-area-inset-top, 0px))`,
        boxShadow: '0 6px 14px -8px var(--teleo-cover-shadow)',
      }}
    >
      {/* Costura recta cerca del borde de abajo, de lado a lado. */}
      <span className="absolute inset-x-0 bottom-[6px] border-b-[1.5px] border-dashed border-stitch" />
    </div>
  )
}
