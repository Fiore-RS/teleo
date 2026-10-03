import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

/** Hacia dónde se alinea el menú con su botón: 'left' (borde izquierdo), 'right' (borde
 *  derecho) o 'stretch' (mismo ancho que el botón). */
export type FloatingMenuAlign = 'left' | 'right' | 'stretch'

interface FloatingMenuOptions {
  align: FloatingMenuAlign
  /** Alto máximo del menú en px. */
  maxHeight?: number
}

const MENU_GAP = 6
/** Margen mínimo con los bordes de la pantalla. */
const VIEWPORT_MARGIN = 12

/** Menús desplegables que se dibujan en un portal con posición fija (V.2.2.1): dentro de una
 *  hoja quedaban recortados por la zona que se desplaza y por los botones fijos del pie.
 *  - Se abre hacia abajo y, si no cabe, hacia arriba.
 *  - Sigue al botón si la hoja se desplaza o cambia el tamaño de la pantalla.
 *  - Se cierra al tocar fuera o con Escape (sin cerrar también la hoja).
 *
 *  Uso: `containerRef` en el contenedor del botón, `anchorRef` en el botón, y el menú con
 *  `createPortal(<div ref={menuRef} style={menuStyle} className="z-70 ...">, document.body)`. */
export function useFloatingMenu({ align, maxHeight = 256 }: FloatingMenuOptions) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<CSSProperties | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setPosition(null)
  }, [])
  const open = useCallback(() => setIsOpen(true), [])
  const toggle = useCallback(() => (isOpen ? close() : open()), [isOpen, close, open])

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const rect = anchor.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const menuH = Math.min(menuRef.current?.scrollHeight ?? maxHeight, maxHeight)
    const spaceBelow = viewportH - rect.bottom - MENU_GAP - VIEWPORT_MARGIN
    const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN
    const openUp = spaceBelow < menuH && spaceAbove > spaceBelow

    const style: CSSProperties = {
      position: 'fixed',
      maxHeight: Math.max(120, Math.min(maxHeight, openUp ? spaceAbove : spaceBelow)),
    }
    if (openUp) style.bottom = viewportH - rect.top + MENU_GAP
    else style.top = rect.bottom + MENU_GAP

    if (align === 'stretch') {
      style.left = rect.left
      style.width = rect.width
    } else if (align === 'left') {
      style.left = Math.max(VIEWPORT_MARGIN, rect.left)
      style.maxWidth = viewportW - (style.left as number) - VIEWPORT_MARGIN
    } else {
      style.right = Math.max(VIEWPORT_MARGIN, viewportW - rect.right)
      style.maxWidth = viewportW - (style.right as number) - VIEWPORT_MARGIN
    }
    setPosition(style)
  }, [align, maxHeight])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      close()
    }
    // En captura sobre window: corre antes que el Escape de la hoja (en document) y lo detiene,
    // así Escape solo cierra el menú.
    function handleKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKey, true)
    }
  }, [isOpen, close])

  // Invisible hasta conocer su posición, para que no aparezca un instante en la esquina.
  const menuStyle: CSSProperties = position ?? { position: 'fixed', visibility: 'hidden' }

  return { isOpen, open, close, toggle, containerRef, anchorRef, menuRef, menuStyle }
}
