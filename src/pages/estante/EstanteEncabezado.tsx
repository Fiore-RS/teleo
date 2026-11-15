import type { ReactNode } from 'react'
import { LayoutGrid, SlidersHorizontal } from 'lucide-react'
import { EncabezadoAncho, encabezadoBoton } from '../../assets/components/molecules/EncabezadoAncho'

type EstanteTab = 'libros' | 'sagas'

interface EstanteEncabezadoProps {
  tab: EstanteTab
  onTabChange: (tab: EstanteTab) => void
  /** Cuántos se ven con los filtros puestos (undefined mientras carga). */
  bookCount?: number
  sagaCount?: number
  subtitle: string
  /** Lo que se está buscando desde la tapa del cuaderno, si hay algo. */
  search: string
  onClearSearch: () => void
  hasFilters: boolean
  onFilters: () => void
  onView: () => void
  /** Menú de orden (SortMenu con la variante 'button'). */
  sortMenu: ReactNode
  /** "¿Qué leo ahora?" (solo en Libros). */
  onRandomPick?: () => void
}

/** Encabezado del Estante en tableta y computadora (V.4.1.0): EncabezadoAncho con la línea de
 *  la biblioteca, "¿Qué leo ahora?" y los botones Filtros, orden y Vista. Sin buscador: se
 *  busca desde la tapa del cuaderno. */
export function EstanteEncabezado({
  tab,
  onTabChange,
  bookCount,
  sagaCount,
  subtitle,
  search,
  onClearSearch,
  hasFilters,
  onFilters,
  onView,
  sortMenu,
  onRandomPick,
}: EstanteEncabezadoProps) {
  return (
    <EncabezadoAncho
      title="Estante"
      subtitle={subtitle}
      tabsLabel="Libros o sagas"
      tabs={[
        { value: 'libros' as const, label: 'Libros', count: bookCount },
        { value: 'sagas' as const, label: 'Sagas', count: sagaCount },
      ]}
      active={tab}
      onTabChange={onTabChange}
      search={{ query: search, onClear: onClearSearch }}
      extra={
        onRandomPick && (
          <button
            type="button"
            onClick={onRandomPick}
            className="font-body text-body-sm font-bold text-primary-text hover:underline underline-offset-4 rounded-chip focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            ¿Qué leo ahora?
          </button>
        )
      }
      actions={
        <>
          <button type="button" onClick={onFilters} className={encabezadoBoton}>
            <SlidersHorizontal size={17} aria-hidden="true" />
            Filtros
            {hasFilters && <span aria-label="(con filtros puestos)" className="w-2 h-2 rounded-full bg-primary" />}
          </button>
          {sortMenu}
          <button type="button" onClick={onView} className={encabezadoBoton}>
            <LayoutGrid size={17} aria-hidden="true" />
            Vista
          </button>
        </>
      }
    />
  )
}
