import { Rows3, Type } from 'lucide-react'
import { Sheet } from '../atoms/Sheet'
import { Shelf, type ShelfItem } from './Shelf'
import { FormCard, FormRow, FormSection, FormSwitchRow } from './FormLayout'
import type { ShelfView } from '../../../lib/shelfView'

interface ShelfViewSheetProps {
  view: ShelfView
  onChange: (view: ShelfView) => void
  onClose: () => void
}

const previewColors = ['var(--color-primary)', 'var(--color-orange)', 'var(--color-pink)', 'var(--color-magenta)']

function previewItems(columns: 3 | 4): ShelfItem[] {
  return previewColors.slice(0, columns).map((color, i) => ({
    key: String(i),
    title: 'Título del libro',
    subtitle: 'Autor',
    cover: <div className="aspect-2/3 w-full rounded-[9px] shadow-[0_6px_14px_-8px_rgba(0,0,0,0.55)]" style={{ background: color }} />,
  }))
}

/** Una fila de ejemplo con portadas de colores, para ver la vista antes de cerrar la hoja.
 *  El recuadro tiene siempre el alto de la vista más alta (3 por fila, con nombres y repisa):
 *  esa versión va invisible en la misma celda y la vista elegida se centra encima, así la
 *  hoja no cambia de tamaño al tocar las opciones. */
function Preview({ view }: { view: ShelfView }) {
  return (
    <div aria-hidden="true" className="grid bg-bg border border-border rounded-[18px] px-3 py-3 mb-5.5 pointer-events-none">
      <div className="invisible [grid-area:1/1]">
        <Shelf items={previewItems(3)} perRow={3} />
      </div>
      <div className="self-center [grid-area:1/1]">
        <Shelf items={previewItems(view.columns)} perRow={view.columns} showNames={view.showNames} planks={view.planks} />
      </div>
    </div>
  )
}

/** "Vista del estante" (V.3.0.0): columnas, título y autor, y repisa. Se aplica al instante
 *  (se ve detrás de la hoja) y queda guardada en la cuenta, para Libros y Sagas. */
export function ShelfViewSheet({ view, onChange, onClose }: ShelfViewSheetProps) {
  return (
    <Sheet title="Vista del estante" onClose={onClose}>
      <Preview view={view} />

      <FormSection label="Cómo se ven tus libros y sagas">
        <FormCard>
          <FormRow label="Libros por fila">
            <div role="radiogroup" aria-label="Libros por fila" className="flex gap-1.5">
              {([3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={view.columns === n}
                  onClick={() => onChange({ ...view, columns: n })}
                  className={`w-11 h-9 rounded-full font-body font-bold text-body-md tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                    view.columns === n ? 'bg-primary text-primary-ink' : 'bg-surface border border-border text-text-secondary'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </FormRow>
          <FormSwitchRow
            icon={Type}
            label="Título y autor"
            hint="Sin ellos se ven solo las portadas"
            checked={view.showNames}
            onChange={(showNames) => onChange({ ...view, showNames })}
          />
          <FormSwitchRow
            icon={Rows3}
            label="Repisa"
            hint="Un tablón bajo cada fila de libros"
            checked={view.planks}
            onChange={(planks) => onChange({ ...view, planks })}
          />
        </FormCard>
      </FormSection>
    </Sheet>
  )
}
