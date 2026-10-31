interface StreakTilesProps {
  current: number
  longest: number
}

/** Racha actual y racha más larga, lado a lado. Los mismos números en Bitácora y en el
 *  calendario de lectura, para que se vean iguales en los dos lugares. V.3.5.0 (rediseño
 *  editorial): sin llama ni trofeo ni recuadros de color; dos cifras grandes en Young Serif con
 *  su etiqueta debajo, centradas y separadas por una línea fina. */
export function StreakTiles({ current, longest }: StreakTilesProps) {
  return (
    <div className="grid grid-cols-2">
      <div className="px-3 py-1 text-center">
        <p className="font-title text-[40px] leading-none text-text tabular-nums">{current}</p>
        <p className="text-[12.5px] leading-snug text-text-secondary mt-1.5">
          Racha actual
        </p>
      </div>
      <div className="px-3 py-1 text-center border-l border-border">
        <p className="font-title text-[40px] leading-none text-text tabular-nums">{longest}</p>
        <p className="text-[12.5px] leading-snug text-text-secondary mt-1.5">
          Racha más larga
        </p>
      </div>
    </div>
  )
}
