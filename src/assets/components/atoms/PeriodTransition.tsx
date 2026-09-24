import { useState, type ReactNode } from 'react'

interface PeriodTransitionProps {
  /** Número que crece hacia el futuro (ej. año * 12 + mes, o el año). Al cambiar, el
   *  contenido entra deslizándose desde la derecha si se avanzó y desde la izquierda si se
   *  retrocedió. */
  order: number
  children: ReactNode
  className?: string
}

/** Animación al cambiar de mes o año con las flechas (calendarios, Resumen, Lanzamientos).
 *  Se apaga sola con "reducir movimiento". */
export function PeriodTransition({ order, children, className = '' }: PeriodTransitionProps) {
  const [prevOrder, setPrevOrder] = useState(order)
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null)
  // Se ajusta durante el render (sin efecto) para que la dirección ya esté lista al montar.
  if (order !== prevOrder) {
    setDirection(order > prevOrder ? 'next' : 'prev')
    setPrevOrder(order)
  }

  const animation = direction === 'next' ? 'animate-slide-next' : direction === 'prev' ? 'animate-slide-prev' : ''
  // El contenedor de afuera recorta el deslizamiento para que no aparezca una barra de
  // desplazamiento horizontal; el margen negativo deja lugar al borde del día de hoy.
  return (
    <div className={`overflow-x-clip -mx-1 px-1 ${className}`}>
      <div key={order} className={animation}>
        {children}
      </div>
    </div>
  )
}
