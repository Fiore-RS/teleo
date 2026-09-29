import { useRef, useState } from 'react'
import { Share2, Download, Check } from 'lucide-react'
import { Modal } from '../atoms/Modal'
import { Button } from '../atoms/Button'
import { ShareQuoteCard, SHARE_QUOTE_WIDTH, SHARE_QUOTE_HEIGHT } from './ShareQuoteCard'
import { BannerArt } from '../atoms/BannerArt'
import { HorizontalScroller } from '../atoms/HorizontalScroller'
import type { QuoteWithBook } from '../../../hooks/useQuotes'
import { useAuth } from '../../../hooks/useAuth'
import { useProfile } from '../../../hooks/useProfile'
import { banners, isBannerId, type BannerId } from '../../../lib/banners'
import { QUOTE_CARD_COLORS, getQuoteCardColor, type QuoteCardColor } from '../../../lib/quoteCardStyles'

// Más chica que la del perfil para que entren la vista previa y las opciones.
const PREVIEW_SCALE = 0.7

// Si una imagen no se puede incrustar, html-to-image usa este PNG transparente de 1x1.
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

interface ShareQuoteModalProps {
  quote: QuoteWithBook
  onClose: () => void
}

/** Compartir una cita como imagen (Mis citas, V.2.1.0). Mismo flujo que la tarjeta del
 *  perfil: Web Share API con la imagen y, si el navegador no puede, descarga. */
export function ShareQuoteModal({ quote, onClose }: ShareQuoteModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloaded, setDownloaded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  // undefined = todavía no eligió: se usa el banner de su perfil.
  const [bannerChoice, setBannerChoice] = useState<BannerId | null | undefined>(undefined)
  const [color, setColor] = useState<QuoteCardColor>('principal')
  const banner = bannerChoice === undefined ? (isBannerId(profile?.banner) ? profile.banner : null) : bannerChoice
  const colorStyle = getQuoteCardColor(color)

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'teleo-cita.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function generateBlob() {
    if (!cardRef.current) return null
    const { toBlob } = await import('html-to-image')
    return toBlob(cardRef.current, {
      pixelRatio: 3,
      imagePlaceholder: TRANSPARENT_PIXEL,
      onImageErrorHandler: (event) => {
        console.warn('[ShareQuoteModal] Imagen no se pudo incrustar, se omite:', event)
      },
    })
  }

  async function handleShare() {
    setIsGenerating(true)
    setError(null)
    try {
      const blob = await generateBlob()
      if (!blob) {
        setError('No se pudo generar la imagen. Intenta de nuevo.')
        return
      }
      const file = new File([blob], 'teleo-cita.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Una cita de mi cuaderno',
          text: `Una cita de ${quote.book.title} que guardé en Teleo.`,
        })
      } else {
        downloadBlob(blob)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('[ShareQuoteModal] Error al compartir:', err)
      setError('No se pudo compartir la imagen. Intenta de nuevo o usa "Descargar imagen".')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    setIsGenerating(true)
    setError(null)
    setDownloaded(false)
    try {
      const blob = await generateBlob()
      if (blob) {
        downloadBlob(blob)
        setDownloaded(true)
      } else {
        setError('No se pudo generar la imagen. Intenta de nuevo.')
      }
    } catch (err) {
      console.error('[ShareQuoteModal] Error al descargar:', err)
      setError('No se pudo generar la imagen. Intenta de nuevo.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Modal variant="sheet" isOpen onClose={onClose} title="Compartir cita">
      <div className="mx-auto" style={{ width: SHARE_QUOTE_WIDTH * PREVIEW_SCALE, height: SHARE_QUOTE_HEIGHT * PREVIEW_SCALE }}>
        <div style={{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left' }} className="shadow-float rounded-[22px]">
          <ShareQuoteCard ref={cardRef} quote={quote} banner={banner} color={color} />
        </div>
      </div>

      {/* Color: el degradado del tema o uno de sus tres acentos. */}
      <p className="font-body font-semibold text-body-sm text-text-secondary mt-5 mb-2">Color</p>
      <div className="flex gap-3" role="radiogroup" aria-label="Color de la tarjeta">
        {QUOTE_CARD_COLORS.map((c) => {
          const isActive = c.id === color
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={c.label}
              onClick={() => setColor(c.id)}
              className={`w-10 h-10 rounded-full ${c.swatch} ${c.ink} flex items-center justify-center border-2 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
                isActive ? 'border-bg ring-2 ring-primary-text' : 'border-border'
              }`}
            >
              {isActive && <Check size={16} strokeWidth={3} />}
            </button>
          )
        })}
      </div>

      {/* Decoración: la temática de cada banner de Tu rincón, pensada para la tarjeta completa. */}
      <p className="font-body font-semibold text-body-sm text-text-secondary mt-4 mb-2">Decoración</p>
      <HorizontalScroller className="-mx-5 px-5 gap-2.5! pb-1">
        <div role="radiogroup" aria-label="Decoración" className="flex gap-2.5">
          {[null, ...banners.map((b) => b.id)].map((id) => {
            const isActive = id === banner
            const name = id ? banners.find((b) => b.id === id)!.name : 'Ninguna'
            return (
              <button
                key={id ?? 'ninguna'}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setBannerChoice(id)}
                className="w-24 shrink-0 text-left rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
              >
                <span
                  className={`relative block aspect-18/7 rounded-lg overflow-hidden ${colorStyle.panel} border-2 ${
                    isActive ? 'border-primary-text' : 'border-transparent'
                  }`}
                >
                  {id && <BannerArt banner={id} colorClass={colorStyle.ink} className="opacity-60" />}
                </span>
                <span className={`block text-body-sm mt-1 truncate ${isActive ? 'font-bold text-text' : 'text-text-secondary'}`}>{name}</span>
              </button>
            )
          })}
        </div>
      </HorizontalScroller>
      <div className="flex flex-col gap-2 mt-5">
        <Button variant="primary" onClick={handleShare} isLoading={isGenerating}>
          <Share2 size={18} /> Compartir
        </Button>
        <Button variant="outline" onClick={handleDownload} isLoading={isGenerating}>
          <Download size={18} /> Descargar imagen
        </Button>
        {error && <p className="text-body-sm text-primary-text text-center mt-1">{error}</p>}
        {downloaded && !error && (
          <p className="text-body-sm text-text-secondary text-center mt-1">Imagen descargada. Revisa tu carpeta de descargas.</p>
        )}
      </div>
    </Modal>
  )
}
