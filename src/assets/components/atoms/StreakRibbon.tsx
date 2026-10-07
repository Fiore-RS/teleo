import { Flame } from 'lucide-react'

interface StreakRibbonProps {
  streak: number
  /** Si la sesión de hoy ya está marcada: la cinta se llena de naranja. */
  marked: boolean
  isLoading?: boolean
  /** Cambia cada vez que se marca la sesión de hoy, para repetir la caída con rebote. */
  dropKey?: number
  onClick: () => void
}

/** Cinta marcapáginas de la racha (V.3.0.0). Cuelga del borde de arriba de Mesa, en V, con
 *  costura a los lados y solo el número. Sin marcar hoy se ve pálida (naranja suave, llama
 *  vacía, costura punteada); al marcar se llena de naranja y baja con un pequeño rebote,
 *  que se apaga con "reducir movimiento". No crece con la racha.
 *
 *  En el iPhone instalado la cinta empieza bajo la barra de estado: el safe-area de arriba se
 *  suma al alto y al padding para que la llama y el número queden a la vista. */
export function StreakRibbon({ streak, marked, isLoading, dropKey = 0, onClick }: StreakRibbonProps) {
  return (
    <button
      key={dropKey}
      type="button"
      onClick={onClick}
      title="Ver calendario de lectura"
      aria-label={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'}. Ver calendario de lectura`}
      className={`absolute top-0 right-7 z-10 w-10 flex flex-col items-center gap-0.5 leading-none origin-top transition-colors duration-300 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
        marked
          ? 'text-on-orange drop-shadow-[0_4px_5px_rgba(0,0,0,0.25)]'
          : 'text-orange-text drop-shadow-[0_2px_3px_rgba(0,0,0,0.15)]'
      } ${dropKey > 0 ? 'animate-ribbon-drop' : ''}`}
      style={{
        height: 'calc(84px + env(safe-area-inset-top, 0px))',
        paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
      }}
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
        size={16}
        strokeWidth={1.6}
        fill={marked ? 'currentColor' : 'none'}
        aria-hidden="true"
        className="relative"
      />
      <span className="relative font-display font-semibold text-[19px] mt-px tabular-nums">
        {isLoading ? ' ' : streak}
      </span>
    </button>
  )
}
