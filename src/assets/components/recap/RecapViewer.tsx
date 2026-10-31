import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2, X } from 'lucide-react'
import { Button } from '../atoms/Button'
import { RecapCard, RECAP_CARD_WIDTH, RECAP_EXPORT_PIXEL_RATIO } from './RecapCard'
import { useRecap } from '../../../hooks/useRecap'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { readRecapTones } from '../../../lib/recapTones'
import { MONTH_NAMES } from '../../../lib/months'
import type { RecapPeriod } from '../../../lib/recap'

const CARD_HEIGHT = (RECAP_CARD_WIDTH * 16) / 9

// Si una imagen no se puede incrustar, html-to-image usa este PNG transparente de 1x1.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function cardToBlob(node: HTMLElement) {
  const { toBlob } = await import('html-to-image')
  return toBlob(node, {
    pixelRatio: RECAP_EXPORT_PIXEL_RATIO,
    imagePlaceholder: TRANSPARENT_PIXEL,
    onImageErrorHandler: (event) => console.warn('[RecapViewer] Imagen no se pudo incrustar, se omite:', event),
  })
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

interface RecapViewerProps {
  userId: string | undefined
  period: RecapPeriod
  onClose: () => void
}

/** Visor de "Tu lectura en Teleo" (V.3.2.0): las tarjetas del mes o del año a pantalla
 *  completa. Se pasa con un toque (derecha avanza, izquierda vuelve) o con las flechas del
 *  teclado; sin avance automático. "Compartir esta" manda la tarjeta visible como imagen y
 *  "Compartir todas" manda todas juntas; si el navegador no puede compartir archivos, se
 *  descargan. */
export function RecapViewer({ userId, period, onClose }: RecapViewerProps) {
  const { recap, isLoading } = useRecap(userId, period)
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const username = profile?.username ?? null
  // Los colores se leen una vez al abrir: el tema no cambia con el visor abierto.
  const [tones] = useState(readRecapTones)
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<'next' | 'back'>('next')
  const [busy, setBusy] = useState<'one' | 'all' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const stageRef = useRef<HTMLDivElement>(null)
  const exportRefs = useRef<(HTMLDivElement | null)[]>([])

  const cards = recap.cards
  const current = Math.min(index, cards.length - 1)
  const isYear = period.kind === 'anio'
  const title = isYear ? `Tu ${period.year} en Teleo` : `Tu ${MONTH_NAMES[period.month - 1].toLowerCase()} en Teleo`
  const subtitle = isYear ? (recap.isOngoing ? 'Hasta ahora' : 'Año completo') : recap.isOngoing ? 'Hasta hoy' : `${MONTH_NAMES[period.month - 1]} ${period.year}`
  const fileBase = isYear ? `teleo-${period.year}` : `teleo-${period.year}-${String(period.month).padStart(2, '0')}`

  const go = useCallback(
    (step: 1 | -1) => {
      setMessage(null)
      setDirection(step === 1 ? 'next' : 'back')
      setIndex((i) => Math.max(0, Math.min(cards.length - 1, Math.min(i, cards.length - 1) + step)))
    },
    [cards.length]
  )

  // Escape cierra; las flechas pasan de tarjeta.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [go, onClose])

  // El fondo no se desplaza mientras el visor está abierto.
  useEffect(() => {
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = before
    }
  }, [])

  // La tarjeta se achica si no entra en la pantalla (celulares chicos o apaisados).
  useLayoutEffect(() => {
    function measure() {
      const el = stageRef.current
      if (!el) return
      setScale(Math.min(1.25, el.clientWidth / RECAP_CARD_WIDTH, el.clientHeight / CARD_HEIGHT))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const exportCards = useMemo(() => cards.map((card, i) => ({ card, i })), [cards])

  async function share(which: 'one' | 'all') {
    setBusy(which)
    setMessage(null)
    try {
      const targets = which === 'one' ? [current] : cards.map((_, i) => i)
      const files: File[] = []
      for (const i of targets) {
        const node = exportRefs.current[i]
        if (!node) continue
        const blob = await cardToBlob(node)
        if (blob) files.push(new File([blob], `${fileBase}-${i + 1}.png`, { type: 'image/png' }))
      }
      if (files.length === 0) {
        setMessage('No se pudo generar la imagen. Intenta de nuevo.')
        return
      }
      if (navigator.canShare?.({ files })) {
        await navigator.share({ files, title, text: `${title}.` })
      } else {
        for (const file of files) downloadBlob(file, file.name)
        setMessage(files.length === 1 ? 'Imagen descargada. Revisa tu carpeta de descargas.' : 'Imágenes descargadas. Revisa tu carpeta de descargas.')
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[RecapViewer] Error al compartir:', err)
      setMessage('No se pudo compartir. Intenta de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 14px)' }}
    >
      <div className="w-full max-w-120 mx-auto px-4 flex flex-col gap-3 flex-1 min-h-0">
        <div className="flex gap-1" aria-hidden="true">
          {cards.map((card, i) => (
            <span key={card} className={`flex-1 h-[3px] rounded-full ${i <= current ? 'bg-primary-text' : 'bg-border'}`} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-[16px] text-text truncate">{title}</h2>
            <p className="text-[12.5px] text-text-muted">
              {subtitle}
              {!isLoading && ` · ${current + 1} de ${cards.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 shrink-0 rounded-button bg-surface-2 border border-border text-text-secondary flex items-center justify-center focus-visible:outline-2 focus-visible:outline-primary-text"
          >
            <X size={18} />
          </button>
        </div>

        <div ref={stageRef} className="flex-1 min-h-0 flex items-center justify-center">
          {isLoading ? (
            <div
              className="rounded-[20px] bg-surface-2 animate-pulse"
              style={{ width: RECAP_CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}
              aria-label="Cargando"
            />
          ) : (
            <div className="relative" style={{ width: RECAP_CARD_WIDTH * scale, height: CARD_HEIGHT * scale }}>
              <div
                key={`${cards[current]}-${current}`}
                className={`rc-enter${direction === 'back' ? ' back' : ''} shadow-float rounded-[20px]`}
                style={{ width: RECAP_CARD_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <RecapCard card={cards[current]} recap={recap} tone={tones[current % tones.length]} username={username} />
              </div>
              <button type="button" aria-label="Tarjeta anterior" onClick={() => go(-1)} disabled={current === 0} className="absolute inset-y-0 left-0 w-[35%] focus-visible:outline-2 focus-visible:outline-primary-text rounded-l-[20px]" />
              <button type="button" aria-label="Tarjeta siguiente" onClick={() => go(1)} disabled={current === cards.length - 1} className="absolute inset-y-0 right-0 w-[65%] focus-visible:outline-2 focus-visible:outline-primary-text rounded-r-[20px]" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2.5">
            <Button variant="outline" fullWidth disabled={isLoading || busy !== null} isLoading={busy === 'all'} onClick={() => share('all')}>
              Compartir todas
            </Button>
            <Button variant="primary" fullWidth disabled={isLoading || busy !== null} isLoading={busy === 'one'} onClick={() => share('one')}>
              <Share2 size={18} /> Compartir esta
            </Button>
          </div>
          {message && <p className="text-body-sm text-text-secondary text-center">{message}</p>}
        </div>
      </div>

      {/* Copias a tamaño real, fuera de la pantalla, para exportar las imágenes. */}
      {!isLoading && (
        <div aria-hidden="true" className="fixed top-0 pointer-events-none" style={{ left: -10000 }}>
          {exportCards.map(({ card, i }) => (
            <RecapCard
              key={card}
              ref={(node) => {
                exportRefs.current[i] = node
              }}
              card={card}
              recap={recap}
              tone={tones[i % tones.length]}
              username={username}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  )
}
