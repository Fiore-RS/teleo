import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Librero, ShelfPlank } from './Shelf'

/** Una pestaña de las estanterías del Perfil en el celular. */
export interface EstanteriaTab {
  key: string
  label: string
  total?: number
  /** La de Mis próximas lecturas va en magenta, como sus marcapáginas. */
  tone?: 'brand' | 'magenta'
}

/** Pestañas de las estanterías (V.4.5.0, Perfil en el celular): de texto, con su número, y se
 *  deslizan de lado si no caben. */
export function EstanteriaTabs({ tabs, active, onChange }: { tabs: EstanteriaTab[]; active: string; onChange: (key: string) => void }) {
  // Al pasar entre Mis próximas lecturas y las demás, las pestañas se vuelven a montar (van en
  // otra parte de la pantalla): se deja a la vista la elegida al instante, sin que se corran.
  const listRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const list = listRef.current
    const tab = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!list || !tab) return
    const right = tab.offsetLeft + tab.offsetWidth - list.clientWidth
    if (right > list.scrollLeft) list.scrollLeft = right
    else if (tab.offsetLeft < list.scrollLeft) list.scrollLeft = tab.offsetLeft
  }, [active])
  return (
    <div ref={listRef} role="tablist" aria-label="Estanterías" className="relative flex gap-4 overflow-x-auto scrollbar-hide border-b border-border mb-3.5">
      {tabs.map((t) => {
        const isActive = t.key === active
        const magenta = t.tone === 'magenta'
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`shrink-0 max-w-[13rem] flex items-baseline pb-2 pt-1 font-body text-body-md whitespace-nowrap border-b-2 -mb-px transition-colors focus-visible:outline-2 focus-visible:outline-primary-text ${
              isActive
                ? `${magenta ? 'border-magenta text-magenta-text' : 'border-primary text-primary-text'} font-bold`
                : 'border-transparent text-text-secondary font-semibold'
            }`}
          >
            <span className="truncate">{t.label}</span>
            {t.total !== undefined && (
              <span className={`ml-1.5 shrink-0 tabular-nums ${isActive ? '' : 'text-text-muted'}`}>{t.total}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Las estanterías del Perfil en el celular (V.4.5.0): sin carpeta alrededor, el título con su
 *  acción a la derecha ("Ver todos" o el menú de la lista), las pestañas y, debajo, el librero de
 *  madera con una repisa que se desliza de lado. */
export function EstanteriaCelular({ action, tabs, children }: { action?: ReactNode; tabs: ReactNode; children: ReactNode }) {
  return (
    <section aria-label="Estanterías">
      <div className="flex items-center justify-between gap-3 mb-1 min-h-8">
        <h2 className="smallcaps text-text-secondary">Estanterías</h2>
        {action && <div className="shrink-0 text-primary-text">{action}</div>}
      </div>
      {tabs}
      <Librero>{children}</Librero>
    </section>
  )
}

/** Una repisa del librero del celular: las portadas en fila (se deslizan de lado) paradas sobre
 *  el tablón. `message` reemplaza las portadas (vacía o sin libros). */
export function RepisaCelular({ children, message }: { children?: ReactNode; message?: ReactNode }) {
  return (
    <div className="pt-4 pb-2">
      {message ? (
        <div className="px-4 pb-3.5 text-[#FBF3EA]">{message}</div>
      ) : (
        <div className="flex items-end gap-3 overflow-x-auto scrollbar-hide px-3 pt-1">{children}</div>
      )}
      <ShelfPlank className="mx-0! rounded-none!" />
    </div>
  )
}
