import { Sheet } from '../atoms/Sheet'
import { Shelf, type ShelfItem } from './Shelf'
import { FormCard, FormRow, FormSection, FormSwitchRow } from './FormLayout'
import type { ShelfView } from '../../../lib/shelfView'

interface ShelfViewSheetProps {
  view: ShelfView
  onChange: (view: ShelfView) => void
  onClose: () => void
  /** Libros de más por repisa según la pantalla (V.4.1.0): 0 en el celular, 2 en tableta y 4
   *  en computadora. Las opciones muestran el número real (3 o 4 en el celular, 5 o 6 en
   *  tableta, 7 u 8 en computadora), aunque se guarde la elección de siempre (3 o 4). */
  extraColumns?: number
}

const previewColors = ['var(--color-primary)', 'var(--color-orange)', 'var(--color-pink)', 'var(--color-magenta)']

function previewItems(columns: number): ShelfItem[] {
  return Array.from({ length: columns }, (_, i) => previewColors[i % previewColors.length]).map((color, i) => ({
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
function Preview({ view, extra }: { view: ShelfView; extra: number }) {
  // En tableta y computadora la vista previa es el librero, como en el Estante. Muestra 3 o 4
  // portadas (un pedazo de la repisa): con 7 u 8 en el ancho de la hoja no se distinguían.
  const librero = extra > 0
  return (
    <div aria-hidden="true" className="grid bg-bg border border-border rounded-[18px] px-3 py-3 mb-5.5 pointer-events-none">
      <div className="invisible [grid-area:1/1]">
        <Shelf items={previewItems(3)} perRow={3} librero={librero} />
      </div>
      <div className="self-center [grid-area:1/1]">
        <Shelf
          items={previewItems(view.columns)}
          perRow={view.columns}
          showNames={view.showNames}
          planks={view.planks}
          librero={librero}
        />
      </div>
    </div>
  )
}

/** "Vista del estante" (V.3.0.0): columnas, título y autor, y repisa. Se aplica al instante
 *  (se ve detrás de la hoja) y queda guardada en la cuenta, para Libros y Sagas. */
export function ShelfViewSheet({ view, onChange, onClose, extraColumns = 0 }: ShelfViewSheetProps) {
  return (
    <Sheet title="Vista del estante" onClose={onClose}>
      <Preview view={view} extra={extraColumns} />

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
                  className={`w-11 h-9 rounded-chip font-body font-bold text-body-md tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                    view.columns === n ? 'bg-primary text-primary-ink' : 'bg-surface border border-border text-text-secondary'
                  }`}
                >
                  {n + extraColumns}
                </button>
              ))}
            </div>
          </FormRow>
          <FormSwitchRow
            label="Título y autor"
            hint="Sin ellos se ven solo las portadas"
            checked={view.showNames}
            onChange={(showNames) => onChange({ ...view, showNames })}
          />
          <FormSwitchRow
            label="Repisa"
            hint={extraColumns > 0 ? 'El librero de madera, con un tablón bajo cada fila' : 'Un tablón bajo cada fila de libros'}
            checked={view.planks}
            onChange={(planks) => onChange({ ...view, planks })}
          />
        </FormCard>
      </FormSection>
    </Sheet>
  )
}
