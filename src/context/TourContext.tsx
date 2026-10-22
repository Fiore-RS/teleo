import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Card } from '../assets/components/molecules/Card'
import { TOUR_STEPS, type TourStep } from '../lib/tour'
import { prefersReducedMotion } from '../lib/motion'
import { TourContext } from './tourContextValue'

/** Recorrido sobre la app real (V.3.3.0, vista previa C). Se oscurece la pantalla, se ilumina
 *  un elemento a la vez (marcado con `data-tour`) y un globito con estilo Cuaderno explica qué
 *  es, con "Omitir", el número de paso y "Siguiente" siempre a la vista. Cambia de pantalla
 *  solo. Mientras dura, el resto de la app no responde a toques. */
export function TourProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [stepIndex, setStepIndex] = useState<number | null>(null)

  const start = useCallback(() => setStepIndex(0), [])
  const end = useCallback(() => setStepIndex(null), [])
  const next = useCallback(() => {
    setStepIndex((i) => (i === null || i >= TOUR_STEPS.length - 1 ? null : i + 1))
  }, [])

  const step = stepIndex === null ? null : TOUR_STEPS[stepIndex]

  // Cada paso vive en una pantalla: si no se está ahí, se va.
  useEffect(() => {
    if (step && location.pathname !== step.route) navigate(step.route)
  }, [step, location.pathname, navigate])

  const value = useMemo(() => ({ isActive: stepIndex !== null, start }), [stepIndex, start])

  return (
    <TourContext.Provider value={value}>
      {children}
      {step && stepIndex !== null && location.pathname === step.route && (
        <TourOverlay key={stepIndex} step={step} index={stepIndex} onNext={next} onSkip={end} />
      )}
    </TourContext.Provider>
  )
}

const SCRIM = 'rgba(20, 10, 8, 0.66)'
const SPOT_PADDING = 8
const GAP = 14
/** Ancho máximo de la columna de la app (max-w-120 en App.tsx). */
const APP_COLUMN = 480
/** Cuánto se espera a que aparezca el elemento al cambiar de pantalla (~3 s). */
const MAX_FIND_FRAMES = 180

interface Box {
  top: number
  left: number
  width: number
  height: number
}

function TourOverlay({ step, index, onNext, onSkip }: { step: TourStep; index: number; onNext: () => void; onSkip: () => void }) {
  const [box, setBox] = useState<Box | null>(null)
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }))
  const nextRef = useRef<HTMLButtonElement>(null)
  const isLast = index === TOUR_STEPS.length - 1
  const animate = !prefersReducedMotion()

  // Busca el elemento (puede tardar si la pantalla recién se abre) y lo sigue si la página se
  // desplaza o cambia de tamaño.
  useEffect(() => {
    let el: Element | null = null
    let frame = 0
    let tries = 0

    function measure() {
      if (!el) return
      const r = el.getBoundingClientRect()
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height })
      setViewport({ width: window.innerWidth, height: window.innerHeight })
    }

    function find() {
      el = document.querySelector(`[data-tour="${step.target}"]`)
      const r = el?.getBoundingClientRect()
      if (el && r && r.width > 0) {
        if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center' })
        measure()
        return
      }
      if (++tries < MAX_FIND_FRAMES) frame = requestAnimationFrame(find)
      else onNext() // Si el elemento no aparece, se salta el paso en vez de quedar trabado.
    }

    function onChange() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    frame = requestAnimationFrame(find)
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
    }
  }, [step.target, onNext])

  useEffect(() => {
    if (box) nextRef.current?.focus({ preventScroll: true })
  }, [box])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onSkip()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onSkip])

  const columnWidth = Math.min(viewport.width, APP_COLUMN)
  const tipLeft = (viewport.width - columnWidth) / 2 + 16
  const tipWidth = columnWidth - 32

  let spot: Box | null = null
  let tipStyle: CSSProperties = { left: tipLeft, width: tipWidth, visibility: 'hidden' }
  let arrow: { x: number; below: boolean } | null = null

  if (box) {
    spot = {
      top: box.top - SPOT_PADDING,
      left: box.left - SPOT_PADDING,
      width: box.width + SPOT_PADDING * 2,
      height: box.height + SPOT_PADDING * 2,
    }
    // El globito va debajo si lo iluminado está en la mitad de arriba; si no, encima.
    const below = spot.top + spot.height / 2 < viewport.height / 2
    tipStyle = below
      ? { left: tipLeft, width: tipWidth, top: spot.top + spot.height + GAP }
      : { left: tipLeft, width: tipWidth, bottom: viewport.height - spot.top + GAP }
    const centerX = spot.left + spot.width / 2 - tipLeft
    arrow = { x: Math.min(Math.max(centerX - 8, 24), tipWidth - 40), below }
  }

  const Icon = step.icon
  const titleId = `tour-title-${index}`

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      {/* Tapa los toques a la app mientras dura el recorrido. */}
      <div className="absolute inset-0" style={spot ? undefined : { background: SCRIM }} />

      {spot && (
        <div
          aria-hidden="true"
          className="absolute rounded-[18px] pointer-events-none"
          style={{
            ...spot,
            boxShadow: `0 0 0 2px rgba(255, 248, 238, 0.9), 0 0 0 9999px ${SCRIM}`,
            transition: animate ? 'top 300ms, left 300ms, width 300ms, height 300ms' : undefined,
          }}
        />
      )}

      <div className={`absolute ${box ? 'animate-fade-in' : ''}`} style={tipStyle}>
        {arrow && (
          <span
            aria-hidden="true"
            className={`absolute z-10 w-4 h-4 rotate-45 bg-surface border-border ${arrow.below ? 'border-l border-t' : 'border-r border-b'}`}
            style={arrow.below ? { top: 24, left: arrow.x } : { bottom: -7, left: arrow.x }}
          />
        )}
        <Card tab={{ label: step.tab, icon: Icon }} as="div" padding="pt-3.5 px-4 pb-3" className="drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]">
          <h2 id={titleId} className="font-title text-[20px] leading-[1.15] text-text">{step.title}</h2>
          <p className="text-body-md text-text-secondary mt-1.5">{step.text}</p>
          <div className="flex items-center justify-between gap-3 mt-3">
            <button
              type="button"
              onClick={onSkip}
              className="py-1.5 font-body font-bold text-body-md text-text-secondary rounded-full focus-visible:outline-2 focus-visible:outline-primary-text"
            >
              Omitir
            </button>
            <span className="text-body-sm font-semibold text-text-muted tabular-nums">
              {index + 1} de {TOUR_STEPS.length}
            </span>
            <button
              ref={nextRef}
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-ink px-4 py-2 font-body font-bold text-body-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
            >
              {isLast ? 'Listo' : 'Siguiente'}
              {!isLast && <ChevronRight size={16} strokeWidth={2.4} aria-hidden="true" />}
            </button>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  )
}
