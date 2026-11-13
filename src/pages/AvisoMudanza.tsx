import { Logo } from '../assets/components/atoms/Logo'
import { newAddressUrl } from '../lib/moved'

const STEPS = [
  { strong: 'Abre la dirección nueva', rest: ' e instala Teleo desde ahí.' },
  { strong: 'Inicia sesión', rest: ' con tu cuenta de siempre.' },
  { strong: 'Borra esta app', rest: ' para no confundirlas.' },
]

/** Aviso fijo de la mudanza (V.3.8.1): lo ve quien abre la app vieja instalada después de
 *  que Teleo se mudó a teleo.fiorers.dev. Ocupa toda la pantalla y no se puede cerrar: esta
 *  copia ya no recibe cambios, así que lo único que queda por hacer es ir a la nueva.
 *  Diseño: lienzo "Teleo · Escritorio", fila "La mudanza". */
export function AvisoMudanza() {
  return (
    <main className="min-h-dvh flex items-center justify-center bg-bg px-4 py-5 sm:py-16">
      <div className="w-full max-w-[560px] min-h-[calc(100dvh-40px)] sm:min-h-0 flex drop-shadow-[0_24px_30px_rgba(90,40,40,0.28)]">
        <div
          className="relative flex-1 flex flex-col bg-surface rounded-[6px] pl-13 pr-6 pt-11 pb-7 sm:pl-16 sm:pr-12 sm:pt-13 sm:pb-10"
          style={{
            backgroundImage:
              'repeating-linear-gradient(180deg, transparent 0 31px, color-mix(in srgb, var(--color-border) 75%, transparent) 31px 32px)',
            clipPath: 'polygon(0 0, calc(100% - 26px) 0, 100% 26px, 100% 100%, 0 100%)',
          }}
        >
          {/* Margen del cuaderno y esquina doblada. */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-8 sm:left-10 w-[1.5px]"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-rose) 55%, transparent)' }}
          />
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-[26px] h-[26px]"
            style={{
              background: 'linear-gradient(225deg, transparent 50%, var(--color-surface-2) 50%)',
              boxShadow: '-2px 2px 4px -2px rgba(0,0,0,0.25)',
            }}
          />

          <Logo className="w-[132px]" />
          <p className="mt-10 smallcaps text-primary-text">Aviso</p>
          <h1 className="mt-2 font-title text-[40px] sm:text-[46px] leading-[1.05] text-text">Teleo se mudó</h1>
          <p className="mt-3 font-display italic text-[20px] leading-snug text-text-secondary">Ahora vive en teleo.fiorers.dev</p>
          <p className="mt-4.5 text-body-md leading-relaxed text-text">
            Tus libros, reseñas y preferencias están a salvo en tu cuenta. Esta app ya no se va a actualizar, así que hace
            falta instalar Teleo otra vez desde la dirección nueva.
          </p>
          <ol className="mt-7 flex flex-col gap-4">
            {STEPS.map((step, index) => (
              <li key={step.strong} className="flex gap-3.5 items-start">
                <span aria-hidden="true" className="w-5.5 shrink-0 pt-0.5 font-title text-[24px] leading-none text-primary-text text-center">
                  {index + 1}
                </span>
                <span className="text-body-md leading-snug text-text">
                  <span className="sr-only">Paso {index + 1}: </span>
                  <strong>{step.strong}</strong>
                  {step.rest}
                </span>
              </li>
            ))}
          </ol>

          <div className="flex-1 min-h-9" />
          <a
            href={newAddressUrl()}
            className="flex items-center justify-center h-[50px] rounded-button bg-primary text-primary-ink font-body font-bold text-[17px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
          >
            Ir a la dirección nueva
          </a>
          <p className="mt-3 text-center text-body-sm text-text-secondary">teleo.fiorers.dev</p>
        </div>
      </div>
    </main>
  )
}
