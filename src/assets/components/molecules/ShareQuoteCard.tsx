import { forwardRef, useId, useState } from 'react'
import { BookOpen } from 'lucide-react'
import { Logo } from '../atoms/Logo'
import type { BannerId } from '../../../lib/banners'
import { quoteCardSvg } from '../../../lib/quoteCardArt'
import { shareSafeImageUrl } from '../../../lib/shareImage'
import { getQuoteCardColor, type QuoteCardColor } from '../../../lib/quoteCardStyles'
import type { QuoteWithBook } from '../../../hooks/useQuotes'

/** Tamaño en pantalla. Se exporta con pixelRatio 3: 1080 × 1920 (historia). */
export const SHARE_QUOTE_WIDTH = 360
export const SHARE_QUOTE_HEIGHT = 640

/** Letra más chica mientras más larga la cita, para que siempre entre en la tarjeta. */
function quoteSize(length: number) {
  if (length <= 90) return 'text-[24px] leading-[1.3]'
  if (length <= 170) return 'text-[20px] leading-[1.35]'
  if (length <= 280) return 'text-[17px] leading-[1.4]'
  if (length <= 420) return 'text-[15px] leading-[1.45]'
  return 'text-[13px] leading-[1.45]'
}

function MiniCover({ url, title }: { url: string | null; title: string }) {
  const src = shareSafeImageUrl(url, 200)
  const [failed, setFailed] = useState(false)
  const box = 'w-[44px] shrink-0 aspect-2/3 rounded-[7px] overflow-hidden shadow-[0_6px_14px_-8px_rgba(40,20,10,0.6)]'
  if (!src || failed) {
    return (
      <div className={`${box} bg-primary-soft text-primary-text flex items-center justify-center`} aria-hidden="true">
        <BookOpen size={16} />
      </div>
    )
  }
  return <img src={src} alt={title} crossOrigin="anonymous" onError={() => setFailed(true)} className={`${box} object-cover`} />
}

/** Decoración de toda la tarjeta con la temática del banner elegido (lib/quoteCardArt). */
function CardArt({ banner, inkClass }: { banner: BannerId; inkClass: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${inkClass} [&>svg]:absolute [&>svg]:inset-0 [&>svg]:h-full [&>svg]:w-full`}
      dangerouslySetInnerHTML={{ __html: quoteCardSvg(banner, uid) }}
    />
  )
}

interface ShareQuoteCardProps {
  quote: QuoteWithBook
  /** Decoración de toda la tarjeta con la temática del banner elegido. null = solo el color. */
  banner?: BannerId | null
  color?: QuoteCardColor
}

/** Tarjeta para compartir una cita como imagen (Mis citas, V.2.1.0). Toda la tarjeta lleva
 *  el color elegido (del tema activo) y la decoración del banner; la cita y el libro van en
 *  una hoja clara al centro, así el dibujo nunca pasa por detrás de las letras. */
export const ShareQuoteCard = forwardRef<HTMLDivElement, ShareQuoteCardProps>(function ShareQuoteCard(
  { quote, banner = null, color = 'principal' },
  ref
) {
  const text = quote.quote_text.trim()
  const style = getQuoteCardColor(color)
  return (
    <div
      ref={ref}
      style={{ width: SHARE_QUOTE_WIDTH, height: SHARE_QUOTE_HEIGHT }}
      className={`relative overflow-hidden rounded-[22px] ${style.panel}`}
    >
      {banner && <CardArt banner={banner} inkClass={style.ink} />}

      <div className="relative h-full flex flex-col px-6 pt-7 pb-7">
        <div className="flex justify-center">
          <span className="inline-flex rounded-full bg-surface px-4 py-2 shadow-[0_8px_18px_-10px_rgba(40,20,10,0.6)]">
            <Logo className="h-[22px] w-auto" />
          </span>
        </div>

        <div className="flex-1 min-h-0 flex items-center py-5">
          <div className="w-full max-h-full rounded-[24px] bg-surface text-text px-6 pt-5 pb-5 flex flex-col shadow-[0_16px_32px_-16px_rgba(40,20,10,0.7)]">
            <span aria-hidden="true" className="font-title text-[64px] leading-[0.75] text-primary-text -ml-1">“</span>
            <p className={`font-display italic ${quoteSize(text.length)} mt-1 overflow-hidden`}>{text}</p>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-border">
              <MiniCover url={quote.book.cover_url} title={quote.book.title} />
              <div className="min-w-0">
                <p className="font-display font-semibold text-[15px] leading-tight text-text line-clamp-2">{quote.book.title}</p>
                {quote.book.author && <p className="text-[12px] text-text-secondary mt-0.5 truncate">{quote.book.author}</p>}
                {quote.page != null && <p className="text-[11px] text-text-muted mt-0.5">Pág. {quote.page}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
