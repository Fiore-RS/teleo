import { useEffect, useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { getPalette } from '../../lib/palettes'
import { prefersReducedMotion } from '../../lib/motion'

/** Columna fija a la derecha de Configuración en la computadora (V.4.3.0, lienzo "Teleo ·
 *  Escritorio", tablero L): "Así se ve", una miniatura de La mesa con los colores del tema y el
 *  modo que se están usando (cambia en vivo al elegir otro), y "En esta página", el índice de
 *  las secciones. Llena el espacio que dejaba la columna de carpetas del teléfono. */

export interface SeccionConfig {
  id: string
  label: string
  danger?: boolean
}

const SMALLCAPS = 'block font-body font-bold text-[12px] tracking-[0.16em] uppercase text-text-muted'

/** Miniatura de La mesa: tapa con la sección activa, el libro abierto, una tarjeta con pestaña
 *  y dos lomos. Del alto de lo que lleva: termina justo debajo de los lomos. Todo con las variables del tema, así cambia sola con el tema y el modo. */
function TemaPreview() {
  const fade = 'transition-colors duration-300 motion-reduce:transition-none'
  return (
    <div aria-hidden="true" className={`flex rounded-xl overflow-hidden border border-border shadow-card ${fade}`}>
      <div className={`w-[58px] shrink-0 bg-cover pt-3.5 pl-2 flex flex-col gap-1.5 ${fade}`}>
        <span className={`block h-2 w-[34px] rounded-[3px] bg-cover-ink/85 mb-1.5 ${fade}`} />
        <span className={`block h-3.5 rounded-l-[5px] bg-mesa ${fade}`} />
        {[30, 26, 32].map((w) => (
          <span key={w} className={`block h-1.5 my-1 rounded-[3px] bg-cover-ink/50 ${fade}`} style={{ width: w }} />
        ))}
      </div>
      <div className={`flex-1 min-w-0 bg-mesa px-4 pt-4 pb-4 flex flex-col gap-2.5 ${fade}`}>
        <span className={`block h-3 w-[90px] rounded-[3px] bg-text/75 ${fade}`} />
        <div className="grid grid-cols-[1.3fr_1fr] gap-2.5">
          <div className={`flex gap-2 p-2 rounded-md bg-surface shadow-card ${fade}`}>
            <span className={`w-9 h-[54px] shrink-0 rounded-[2px_4px_4px_2px] bg-orange ${fade}`} />
            <span className="flex-1 flex flex-col gap-1.5 pt-1">
              <span className={`h-1.5 rounded-[3px] bg-text/60 ${fade}`} />
              <span className={`h-1.5 w-3/5 rounded-[3px] bg-text/30 ${fade}`} />
              <span className={`mt-auto h-1.5 rounded-[3px] bg-border ${fade}`}>
                <span className={`block h-full w-[45%] rounded-[3px] bg-primary ${fade}`} />
              </span>
            </span>
          </div>
          <div className="relative pt-3">
            <span className={`absolute top-0 left-0 w-11 h-[13px] rounded-t-md bg-surface ${fade}`} />
            <div className={`h-[58px] rounded-[0_8px_8px_8px] bg-surface shadow-card p-2 flex flex-col gap-1.5 ${fade}`}>
              <span className={`h-1.5 w-[70%] rounded-[3px] bg-text/50 ${fade}`} />
              <span className={`h-3.5 w-9 rounded ${fade}`} style={{ background: 'var(--teleo-lomo-3)' }} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-1 mt-0.5">
          <span className={`block h-3.5 w-[78%] rounded-[2px_3px_3px_2px] ${fade}`} style={{ background: 'var(--teleo-lomo-1)' }} />
          <span className={`block h-3.5 w-[66%] ml-3 rounded-[2px_3px_3px_2px] ${fade}`} style={{ background: 'var(--teleo-lomo-2)' }} />
        </div>
      </div>
    </div>
  )
}

/** La sección que se está viendo: la última cuyo borde de arriba ya pasó cerca del borde de
 *  arriba de la pantalla. */
function useSeccionActiva(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')
  useEffect(() => {
    let frame = 0
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        let current = ids[0] ?? ''
        for (const id of ids) {
          const el = document.getElementById(id)
          if (el && el.getBoundingClientRect().top <= 140) current = id
        }
        // Al llegar al final, la última (aunque sea corta y no alcance el borde de arriba).
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
          current = ids[ids.length - 1] ?? current
        }
        setActive(current)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ids])
  return active
}

/** La columna queda debajo del encabezado fijo (unos 53px pegado arriba). */
export function ConfigLateral({ secciones }: { secciones: SeccionConfig[] }) {
  const { palette, theme } = useTheme()
  const [ids] = useState(() => secciones.map((s) => s.id))
  const active = useSeccionActiva(ids)
  const modo = theme === 'system' ? 'con el modo del sistema' : theme === 'dark' ? 'en modo oscuro' : 'en modo claro'

  function goTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <aside className="sticky top-20 flex flex-col gap-7.5">
      <section aria-labelledby="config-asi-se-ve">
        <span id="config-asi-se-ve" className={`${SMALLCAPS} mb-2.5`}>
          Así se ve
        </span>
        <TemaPreview />
        <p className="mt-2.5 px-0.5 font-display italic text-[16px] text-text-secondary">
          {getPalette(palette).name}, {modo}.
        </p>
      </section>
      <nav aria-labelledby="config-en-esta-pagina">
        <span id="config-en-esta-pagina" className={`${SMALLCAPS} mb-2`}>
          En esta página
        </span>
        <ul className="flex flex-col gap-0.5">
          {secciones.map(({ id, label, danger }) => {
            const isActive = id === active
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => goTo(id)}
                  aria-current={isActive ? 'location' : undefined}
                  className={`w-full h-[38px] px-3.5 flex items-center rounded-[10px] text-left font-display text-[16.5px] transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-primary-text ${
                    isActive
                      ? 'bg-surface-2 text-text font-semibold'
                      : danger
                        ? 'text-primary-text hover:bg-surface-2/60'
                        : 'text-text-secondary hover:bg-surface-2/60 hover:text-text'
                  }`}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
