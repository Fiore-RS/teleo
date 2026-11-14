import logoIcon from '../../images/logo/logo-icon.svg'

/** La tapa del cuaderno de las pantallas de entrada en tableta y computadora (V.4.3.0, lienzo
 *  "Teleo · Escritorio", página "Pantallas de entrada", dirección "La tapa del cuaderno"): el
 *  color principal del tema con la textura de puntos y la costura, el ícono hundido como un
 *  grabado, TELEO y "Diario de Lectura", y una cinta marcapáginas colgando. Es la misma tapa de
 *  la barra de la izquierda de la app: al entrar, el cuaderno se abre. Sin la ilustración del
 *  rincón de lectura (Fiorella, 14 nov 2026). */
export function TapaPortada() {
  const mask = `url("${logoIcon}") center / contain no-repeat`
  return (
    <div className="relative h-full min-h-dvh bg-cover text-cover-ink flex flex-col items-center justify-center px-8 shadow-[8px_0_24px_-12px_var(--teleo-cover-shadow)]">
      {/* Costura cerca del borde derecho, como en la barra de la app. */}
      <span aria-hidden="true" className="absolute top-4 bottom-4 right-4.5 border-r-[1.5px] border-dashed border-stitch pointer-events-none" />

      {/* Cinta marcapáginas que cuelga desde arriba, con la punta en V y su costura. */}
      <span
        aria-hidden="true"
        className="absolute top-0 right-[18%] w-10 escritorio:w-[52px] h-[34%] bg-pink shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 22px), 0 100%)' }}
      >
        <span
          className="absolute inset-x-[7px] top-0 bottom-[23px] border-x-[1.5px] border-dashed"
          style={{ borderColor: 'color-mix(in srgb, var(--color-on-pink) 50%, transparent)' }}
        />
      </span>

      {/* El ícono, en el color de la tapa clara, con luz abajo y sombra arriba: parece grabado. */}
      <span
        role="img"
        aria-label="Teleo: Diario de Lectura"
        className="block w-[150px] escritorio:w-[190px] aspect-[412/340] bg-current opacity-90"
        style={{
          mask,
          WebkitMask: mask,
          filter: 'drop-shadow(0 1.5px 0 rgba(255,255,255,0.12)) drop-shadow(0 -1.5px 0 rgba(0,0,0,0.25))',
        }}
      />
      <p aria-hidden="true" className="mt-8 font-title text-[56px] escritorio:text-[72px] leading-none tracking-[0.08em]">
        TELEO
      </p>
      <p aria-hidden="true" className="mt-2.5 font-body font-medium text-[18px] escritorio:text-[21px] tracking-[0.04em] opacity-80">
        Diario de Lectura
      </p>
    </div>
  )
}
