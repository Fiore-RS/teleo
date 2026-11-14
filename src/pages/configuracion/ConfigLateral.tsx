import { useTheme } from '../../hooks/useTheme'
import { getPalette } from '../../lib/palettes'
import { IndicePagina, INDICE_SMALLCAPS, type SeccionIndice } from '../../assets/components/molecules/IndicePagina'

/** Columna fija a la derecha de Configuración en la computadora (V.4.3.0, lienzo "Teleo ·
 *  Escritorio", tablero L): "Así se ve", una miniatura de La mesa con los colores del tema y el
 *  modo que se están usando (cambia en vivo al elegir otro), y "En esta página", el índice de
 *  las secciones. Llena el espacio que dejaba la columna de carpetas del teléfono. */

export type SeccionConfig = SeccionIndice

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

/** La columna queda debajo del encabezado fijo (unos 53px pegado arriba). */
export function ConfigLateral({ secciones }: { secciones: SeccionConfig[] }) {
  const { palette, theme } = useTheme()
  const modo = theme === 'system' ? 'con el modo del sistema' : theme === 'dark' ? 'en modo oscuro' : 'en modo claro'

  return (
    <aside className="sticky top-20 flex flex-col gap-7.5">
      <section aria-labelledby="config-asi-se-ve">
        <span id="config-asi-se-ve" className={`${INDICE_SMALLCAPS} mb-2.5`}>
          Así se ve
        </span>
        <TemaPreview />
        <p className="mt-2.5 px-0.5 font-display italic text-[16px] text-text-secondary">
          {getPalette(palette).name}, {modo}.
        </p>
      </section>
      <IndicePagina secciones={secciones} />
    </aside>
  )
}
