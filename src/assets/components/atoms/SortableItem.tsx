import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface SortableItemProps {
  id: string
  children: ReactNode
  // 'pan-y' para listas/grillas dentro de una página que se hace scroll vertical (el caso de
  // siempre). 'pan-x' para listas horizontales tipo swiper (la lista de "esta temporada" en
  // Mesa) — mismo razonamiento pero con los ejes invertidos, ver comentario abajo.
  axis?: 'x' | 'y'
}

export function SortableItem({ id, children, axis = 'y' }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // Se deja pasar nativamente el eje en el que el CONTENEDOR hace scroll (vertical en
        // grillas/listas normales, horizontal en un swiper), para que el navegador pueda
        // seguir haciendo ese scroll mientras se espera el mantener-presionado
        // (activationConstraint.delay del sensor). Con 'none' el navegador le entrega el
        // gesto a JS desde el primer toque y el scroll queda bloqueado por completo, aunque
        // el drag todavía no se haya activado. Una vez pasa el delay, dnd-kit toma el control
        // del gesto solo, sea cual sea el eje.
        touchAction: axis === 'x' ? 'pan-x' : 'pan-y',
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}