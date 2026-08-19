import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ReactNode } from 'react'

interface SortableItemProps {
  id: string
  children: ReactNode
}

export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // 'pan-y' (no 'none'): con activationConstraint.delay en el sensor, el navegador
        // necesita poder seguir haciendo scroll vertical nativo mientras se espera el
        // mantener-presionado; con 'none' el navegador le entrega el gesto a JS desde el
        // primer toque y el scroll queda bloqueado por completo, aunque el drag todavía no
        // se haya activado. Una vez pasa el delay, dnd-kit toma el control del gesto solo.
        touchAction: 'pan-y',
      }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}