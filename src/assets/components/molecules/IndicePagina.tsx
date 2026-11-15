import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../../../lib/motion'

/** Índice fijo a la derecha de las pantallas largas de una columna en la computadora (V.4.3.0):
 *  Configuración, Guía de Teleo y Novedades. La sección que se está viendo queda marcada y al
 *  tocar otra, la pantalla baja hasta ella (cada sección lleva su `id` y `scroll-mt-24`, para
 *  no quedar debajo del encabezado fijo). */

export interface SeccionIndice {
  id: string
  label: string
  /** Segunda línea más chica (ej. el título de una versión en Novedades). */
  detail?: string
  danger?: boolean
}

export const INDICE_SMALLCAPS = 'block font-body font-bold text-[12px] tracking-[0.16em] uppercase text-text-muted'

/** La sección que se está viendo: la última cuyo borde de arriba ya pasó cerca del borde de
 *  arriba de la pantalla (o la última, al llegar al final). */
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

interface IndicePaginaProps {
  secciones: SeccionIndice[]
  titulo?: string
  /** Antes de bajar (ej. Novedades despliega la versión elegida). */
  onSelect?: (id: string) => void
  /** Si la lista es larga, se desplaza dentro de su propio alto. */
  larga?: boolean
}

export function IndicePagina({ secciones, titulo = 'En esta página', onSelect, larga = false }: IndicePaginaProps) {
  const [ids] = useState(() => secciones.map((s) => s.id))
  const active = useSeccionActiva(ids)

  function goTo(id: string) {
    onSelect?.(id)
    // Un cuadro después, por si al desplegar algo cambió el alto de la página.
    requestAnimationFrame(() =>
      document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' }),
    )
  }

  return (
    <nav aria-label={titulo} className={larga ? 'flex flex-col min-h-0' : undefined}>
      <span className={`${INDICE_SMALLCAPS} mb-2`}>{titulo}</span>
      <ul className={`flex flex-col gap-0.5 ${larga ? 'max-h-[calc(100vh-9rem)] overflow-y-auto pr-1 -mr-1 scrollbar-hide' : ''}`}>
        {secciones.map(({ id, label, detail, danger }) => {
          const isActive = id === active
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => goTo(id)}
                aria-current={isActive ? 'location' : undefined}
                className={`w-full ${detail ? 'py-1.5' : 'h-[38px]'} px-3.5 flex flex-col justify-center rounded-[10px] text-left transition-colors motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-primary-text ${
                  isActive ? 'bg-surface-2 text-text' : danger ? 'text-primary-text hover:bg-surface-2/60' : 'text-text-secondary hover:bg-surface-2/60 hover:text-text'
                }`}
              >
                <span className={`font-display text-[16.5px] leading-snug ${isActive ? 'font-semibold' : ''}`}>{label}</span>
                {detail && <span className="block w-full truncate font-body text-[13px] text-text-muted">{detail}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
