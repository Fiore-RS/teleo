import { Flame } from 'lucide-react'
import { COVER_BAND_HEIGHT } from './CoverBand'

interface StreakRibbonProps {
  streak: number
  /** Si la sesión de hoy ya está marcada: la cinta se llena de naranja. */
  marked: boolean
  isLoading?: boolean
  /** Cambia cada vez que se marca la sesión de hoy, para repetir la caída con rebote. */
  dropKey?: number
  onClick: () => void
  /** Dónde cuelga (V.4.0.0): del borde de arriba de La mesa en el celular, o del libro abierto
   *  de La mesa en pantallas grandes (más larga, sin contar la tapa de arriba). */
  placement?: 'mesa' | 'libro'
}

/** Cinta marcapáginas de la racha (V.3.0.0). Cuelga del borde de arriba de Mesa, en V, con
 *  costura a los lados y solo el número. Sin marcar hoy se ve pálida (naranja suave, llama
 *  vacía, costura punteada); al marcar se llena de naranja y baja con un pequeño rebote,
 *  que se apaga con "reducir movimiento". No crece con la racha.
 *
 *  V.3.8.0: la cinta es más larga y empieza en el borde de arriba, sobre la tapa del cuaderno
 *  (CoverBand), para que se vea que le pasa por encima; la llama y el número quedan debajo de
 *  la tapa. En el iPhone instalado el safe-area de arriba se suma al alto y al padding para
 *  que queden a la vista. */
export function StreakRibbon({ streak, marked, isLoading, dropKey = 0, onClick, placement = 'mesa' }: StreakRibbonProps) {
  const onBook = placement === 'libro'
  return (
    <button
      key={dropKey}
      type="button"
      onClick={onClick}
      data-tour="racha"
      title="Ver calendario de lectura"
      aria-label={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'}. Ver calendario de lectura`}
      className={`absolute z-10 ${onBook ? '-top-3.5 right-13.5 w-[50px]' : 'top-0 right-7 w-10'} flex flex-col items-center gap-0.5 leading-none origin-top transition-colors duration-300 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
        marked
          ? 'text-on-orange drop-shadow-[0_4px_5px_rgba(0,0,0,0.3)]'
          : 'text-orange-text drop-shadow-[0_3px_4px_rgba(0,0,0,0.22)]'
      } ${dropKey > 0 ? 'animate-ribbon-drop' : ''}`}
      style={
        onBook
          ? { height: 100, paddingTop: 24 }
          : {
              height: `calc(${COVER_BAND_HEIGHT + 96}px + env(safe-area-inset-top, 0px))`,
              paddingTop: `calc(${COVER_BAND_HEIGHT + 16}px + env(safe-area-inset-top, 0px))`,
            }
      }
    >
      {/* Tela en V con la costura punteada a los lados. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 transition-colors duration-300 motion-reduce:transition-none ${marked ? 'bg-orange' : 'bg-orange-soft'}`}
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 14px), 0 100%)' }}
      >
        <span
          className={`absolute inset-y-0 inset-x-1 border-x-[1.5px] border-dashed ${marked ? '' : 'border-orange opacity-75'}`}
          style={marked ? { borderColor: 'color-mix(in srgb, var(--color-on-orange) 55%, transparent)' } : undefined}
        />
      </span>
      <Flame
        size={onBook ? 18 : 16}
        strokeWidth={1.6}
        fill={marked ? 'currentColor' : 'none'}
        aria-hidden="true"
        className="relative"
      />
      <span className={`relative font-display font-semibold mt-px tabular-nums ${onBook ? 'text-[22px]' : 'text-[19px]'}`}>
        {isLoading ? ' ' : streak}
      </span>
    </button>
  )
}
